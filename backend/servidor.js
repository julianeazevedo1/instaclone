import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import multer from 'multer'
import banco from './banco.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const diretorioUploads = path.join(__dirname, 'uploads')
const extensoesImagem = new Map([
    ['image/jpeg', '.jpg'],
    ['image/png', '.png'],
    ['image/webp', '.webp'],
])
const app = express()

fs.mkdirSync(diretorioUploads, { recursive: true })

const upload = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, callback) => callback(null, diretorioUploads),
        filename: (_req, file, callback) => {
            callback(null, `${crypto.randomUUID()}${extensoesImagem.get(file.mimetype)}`)
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
        if (!extensoesImagem.has(file.mimetype)) {
            const erro = new Error('Envie uma imagem JPEG, PNG ou WEBP')
            erro.status = 400
            return callback(erro)
        }

        callback(null, true)
    },
})

function responderErroUpload(erroUpload, res, next) {
    if (!erroUpload) return false

    if (erroUpload instanceof multer.MulterError) {
        const status = erroUpload.code === 'LIMIT_FILE_SIZE' ? 413 : 400
        res.status(status).json({ mensagem: 'Não foi possível enviar a imagem' })
        return true
    }

    if (erroUpload.status === 400) {
        res.status(400).json({ mensagem: erroUpload.message })
        return true
    }

    next(erroUpload)
    return true
}

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(diretorioUploads))

function urlImagem(req, imagem) {
    if (!imagem) return ''
    if (/^https?:\/\//i.test(imagem)) return imagem

    return `${req.protocol}://${req.get('host')}/uploads/${encodeURIComponent(imagem)}`
}

function buscarPerfil(id) {
    return banco.prepare(`
        SELECT
            usuarios.id,
            usuarios.usuario,
            usuarios.nome,
            usuarios.bio,
            usuarios.localidade,
            usuarios.foto,
            usuarios.capa,
            COUNT(DISTINCT posts.id) AS posts,
(SELECT COUNT(*) FROM seguidores
 WHERE seguido_id = usuarios.id) AS seguidores,
(SELECT COUNT(*) FROM seguidores
 WHERE seguidor_id = usuarios.id) AS seguindo
        FROM usuarios
        LEFT JOIN posts ON posts.usuario_id = usuarios.id
        WHERE usuarios.id = ?
        GROUP BY usuarios.id
    `).get(id)
}

function respostaPerfil(req, perfil) {
    return {
        id: perfil.id,
        usuario: perfil.usuario,
        nome: perfil.nome,
        bio: perfil.bio,
        fotoPerfil: urlImagem(req, perfil.foto),
        fotoCapa: urlImagem(req, perfil.capa),
        localidade: perfil.localidade,
        posts: perfil.posts,
        seguidores: perfil.seguidores,
        seguindo: perfil.seguindo,
    }
}

function respostaPost(req, post) {
    return {
        id: post.id,
        usuarioId: post.usuarioId,
        usuario: post.usuario,
        avatar: urlImagem(req, post.avatar),
        legenda: post.legenda,
        imagem: `${req.protocol}://${req.get('host')}/uploads/${encodeURIComponent(post.imagem)}`,
    }
}

app.get('/posts', (req, res) => {
    const posts = banco.prepare(`
        SELECT
            posts.id,
            posts.usuario_id AS usuarioId,
            usuarios.usuario,
            usuarios.foto AS avatar,
            posts.imagem,
            posts.legenda
        FROM posts
        JOIN usuarios ON usuarios.id = posts.usuario_id
        ORDER BY posts.id DESC
    `).all()

    res.json(posts.map((post) => respostaPost(req, post)))
})

app.get('/perfis/:id', (req, res) => {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1) {
        return res.status(404).json({ mensagem: 'Perfil não encontrado' })
    }

    const perfil = buscarPerfil(id)
    if (!perfil) {
        return res.status(404).json({ mensagem: 'Perfil não encontrado' })
    }

    res.json(respostaPerfil(req, perfil))
})

app.post('/perfis/:id/capa', (req, res, next) => {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1 || !banco.prepare('SELECT id FROM usuarios WHERE id = ?').get(id)) {
        return res.status(404).json({ mensagem: 'Perfil não encontrado' })
    }

    upload.single('foto')(req, res, (erroUpload) => {
        if (responderErroUpload(erroUpload, res, next)) return
        if (!req.file) {
            return res.status(400).json({ mensagem: 'Escolha uma foto de capa' })
        }

        try {
            banco.prepare('UPDATE usuarios SET capa = ? WHERE id = ?').run(req.file.filename, id)
            return res.json({ fotoCapa: urlImagem(req, req.file.filename) })
        } catch (erroBanco) {
            fs.rmSync(req.file.path, { force: true })
            return next(erroBanco)
        }
    })
})

app.post('/perfis/:id/foto', (req, res, next) => {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1 || !banco.prepare('SELECT id FROM usuarios WHERE id = ?').get(id)) {
        return res.status(404).json({ mensagem: 'Perfil não encontrado' })
    }

    upload.single('foto')(req, res, (erroUpload) => {
        if (responderErroUpload(erroUpload, res, next)) return
        if (!req.file) {
            return res.status(400).json({ mensagem: 'Escolha uma foto de perfil' })
        }

        try {
            banco.prepare('UPDATE usuarios SET foto = ? WHERE id = ?').run(req.file.filename, id)
            return res.json({ fotoPerfil: urlImagem(req, req.file.filename) })
        } catch (erroBanco) {
            fs.rmSync(req.file.path, { force: true })
            return next(erroBanco)
        }
    })
})

app.get('/perfis/:id/posts', (req, res) => {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1 || !banco.prepare('SELECT id FROM usuarios WHERE id = ?').get(id)) {
        return res.status(404).json({ mensagem: 'Perfil não encontrado' })
    }

    const posts = banco.prepare(`
        SELECT
            posts.id,
            posts.usuario_id AS usuarioId,
            usuarios.usuario,
            usuarios.foto AS avatar,
            posts.imagem,
            posts.legenda
        FROM posts
        JOIN usuarios ON usuarios.id = posts.usuario_id
        WHERE posts.usuario_id = ?
        ORDER BY posts.id DESC
    `).all(id)

    res.json(posts.map((post) => respostaPost(req, post)))
})

app.post('/perfis/:id/posts', (req, res, next) => {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1 || !banco.prepare('SELECT id FROM usuarios WHERE id = ?').get(id)) {
        return res.status(404).json({ mensagem: 'Perfil não encontrado' })
    }

    upload.single('foto')(req, res, (erroUpload) => {
        if (responderErroUpload(erroUpload, res, next)) return

        if (!req.file) {
            return res.status(400).json({ mensagem: 'Escolha uma foto para publicar' })
        }

        const legenda = typeof req.body.legenda === 'string' ? req.body.legenda.trim() : ''
        if (legenda.length > 2000) {
            fs.rmSync(req.file.path, { force: true })
            return res.status(400).json({ mensagem: 'A legenda deve ter no máximo 2000 caracteres' })
        }

        try {
            const resultado = banco.prepare(
                'INSERT INTO posts (usuario_id, imagem, legenda) VALUES (?, ?, ?)'
            ).run(id, req.file.filename, legenda)
            const post = banco.prepare(`
                SELECT
                    posts.id,
                    posts.usuario_id AS usuarioId,
                    usuarios.usuario,
                    usuarios.foto AS avatar,
                    posts.imagem,
                    posts.legenda
                FROM posts
                JOIN usuarios ON usuarios.id = posts.usuario_id
                WHERE posts.id = ?
            `).get(Number(resultado.lastInsertRowid))

            return res.status(201).json(respostaPost(req, post))
        } catch (erroBanco) {
            fs.rmSync(req.file.path, { force: true })
            return next(erroBanco)
        }
    })
})

app.post('/cadastro', (req, res, next) => {
    const { nome, usuario, email, senha } = req.body ?? {}

    if (
        typeof nome !== 'string'
        || typeof usuario !== 'string'
        || typeof email !== 'string'
        || typeof senha !== 'string'
    ) {
        return res.status(400).json({ mensagem: 'Preencha todos os campos do cadastro.' })
    }

    const nomeNormalizado = nome.trim()
    const usuarioNormalizado = usuario.trim().toLowerCase()
    const emailNormalizado = email.trim().toLowerCase()

    if (nomeNormalizado.length < 2 || nomeNormalizado.length > 80) {
        return res.status(400).json({ mensagem: 'O nome deve ter entre 2 e 80 caracteres.' })
    }

    if (!/^[a-z0-9._]{3,30}$/.test(usuarioNormalizado)) {
        return res.status(400).json({
            mensagem: 'O usuário deve ter de 3 a 30 caracteres: letras, números, ponto ou sublinhado.',
        })
    }

    if (
        emailNormalizado.length > 254
        || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)
    ) {
        return res.status(400).json({ mensagem: 'Informe um email válido.' })
    }

    if (senha.length < 8 || Buffer.byteLength(senha, 'utf8') > 72) {
        return res.status(400).json({
            mensagem: 'A senha deve ter no mínimo 8 caracteres e no máximo 72 bytes.',
        })
    }

    const usuarioExistente = banco.prepare(
        'SELECT id FROM usuarios WHERE lower(usuario) = ? OR lower(email) = ?'
    ).get(usuarioNormalizado, emailNormalizado)

    if (usuarioExistente) {
        return res.status(409).json({ mensagem: 'Esse usuário ou email já está cadastrado.' })
    }

    try {
        const senhaHash = bcrypt.hashSync(senha, 10)
        const resultado = banco.prepare(`
            INSERT INTO usuarios (usuario, senha, nome, email)
            VALUES (?, ?, ?, ?)
        `).run(usuarioNormalizado, senhaHash, nomeNormalizado, emailNormalizado)

        return res.status(201).json({
            mensagem: 'Cadastro realizado com sucesso.',
            id: Number(resultado.lastInsertRowid),
        })
    } catch (erroCadastro) {
        if (String(erroCadastro.message).includes('UNIQUE constraint failed')) {
            return res.status(409).json({ mensagem: 'Esse usuário ou email já está cadastrado.' })
        }

        return next(erroCadastro)
    }
})

app.post('/login', (req, res) => {
    const { usuario, senha } = req.body ?? {}
    if (typeof usuario !== 'string' || typeof senha !== 'string') {
        return res.status(400).json({ mensagem: 'Informe usuário e senha' })
    }

    const conta = banco
        .prepare('SELECT id, senha FROM usuarios WHERE usuario = ?')
        .get(usuario)

    if (!conta || !bcrypt.compareSync(senha, conta.senha)) {
        return res.status(401).json({ mensagem: 'Usuário ou senha incorretos' })
    }

    res.json({
        mensagem: 'Login realizado com sucesso',
        id: conta.id,
    })
})

app.patch('/perfis/:id', (req, res) => {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1) {
        return res.status(404).json({ mensagem: 'Perfil não encontrado' })
    }

    const campos = ['nome', 'bio', 'localidade']
    const atualizacoes = campos.filter((campo) => req.query[campo] !== undefined)
    if (atualizacoes.length === 0) {
        return res.status(400).json({
            mensagem: 'Envie nome, bio ou localidade na query',
        })
    }

    const valores = atualizacoes.map((campo) => String(req.query[campo]))
    const definicoes = atualizacoes.map((campo) => `${campo} = ?`).join(', ')
    banco.prepare(`UPDATE usuarios SET ${definicoes} WHERE id = ?`).run(...valores, id)

    const perfil = buscarPerfil(id)
    if (!perfil) {
        return res.status(404).json({ mensagem: 'Perfil não encontrado' })
    }

    res.json(respostaPerfil(req, perfil))
})

const PORTA = 3000

app.listen(PORTA, () => {
    console.log(`Servidor iniciado em http://localhost:${PORTA}`)
})

