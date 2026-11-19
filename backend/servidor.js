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
const sessoes = new Map()

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

function removerArquivoUpload(imagem) {
    const nomeUploadGerado = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp)|\d{13}\.(?:jpg|jpeg|png|webp|svg))$/i
    if (typeof imagem !== 'string' || !nomeUploadGerado.test(imagem)) return

    fs.rmSync(path.join(diretorioUploads, imagem), { force: true })
}

function emitirToken(usuarioId) {
    const token = crypto.randomUUID()
    sessoes.set(token, usuarioId)
    return token
}

function usuarioDaSessao(req) {
    const autorizacao = req.get('authorization') || ''
    const token = autorizacao.startsWith('Bearer ') ? autorizacao.slice(7) : ''
    return sessoes.get(token)
}

function exigirDono(req, res, usuarioId) {
    if (usuarioDaSessao(req) !== usuarioId) {
        res.status(401).json({ mensagem: 'Faça login nesta conta para excluir este conteúdo.' })
        return false
    }

    return true
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
        temFotoPerfil: Boolean(perfil.foto && perfil.foto !== 'sem-foto.svg'),
        temFotoCapa: Boolean(perfil.capa),
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
        nome: post.nome || post.usuario,
        avatar: urlImagem(req, post.avatar),
        legenda: post.legenda,
        publicadoEm: post.publicadoEm ?? null,
        visualizado: Boolean(post.visualizado),
        imagem: `${req.protocol}://${req.get('host')}/uploads/${encodeURIComponent(post.imagem)}`,
    }
}

app.get('/posts', (req, res) => {
    const visualizadorId = usuarioDaSessao(req) ?? 0
    const posts = banco.prepare(`
        SELECT
            posts.id,
            posts.usuario_id AS usuarioId,
            usuarios.usuario,
            usuarios.nome,
            usuarios.foto AS avatar,
            posts.imagem,
            posts.legenda,
            posts.publicado_em AS publicadoEm,
            CASE WHEN story_views.post_id IS NULL THEN 0 ELSE 1 END AS visualizado
        FROM posts
        JOIN usuarios ON usuarios.id = posts.usuario_id
        LEFT JOIN story_views
            ON story_views.post_id = posts.id
            AND story_views.visualizador_id = ?
        ORDER BY posts.id DESC
    `).all(visualizadorId)

    res.json(posts.map((post) => respostaPost(req, post)))
})

app.get('/sessao', (req, res) => {
    const usuarioId = usuarioDaSessao(req)
    if (!usuarioId) {
        return res.status(401).json({ mensagem: 'Faça login para consultar sua conta.' })
    }

    const perfil = buscarPerfil(usuarioId)
    if (!perfil) {
        return res.status(401).json({ mensagem: 'A conta desta sessão não está disponível.' })
    }

    res.json({
        id: perfil.id,
        nome: perfil.nome,
        usuario: perfil.usuario,
        fotoPerfil: urlImagem(req, perfil.foto),
        temFotoPerfil: Boolean(perfil.foto && perfil.foto !== 'sem-foto.svg'),
    })
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

app.delete('/perfis/:id/foto', (req, res, next) => {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1) {
        return res.status(404).json({ mensagem: 'Perfil não encontrado' })
    }
    if (!exigirDono(req, res, id)) return

    const perfil = banco.prepare('SELECT foto FROM usuarios WHERE id = ?').get(id)
    if (!perfil) {
        return res.status(404).json({ mensagem: 'Perfil não encontrado' })
    }

    try {
        banco.prepare('UPDATE usuarios SET foto = ? WHERE id = ?').run('sem-foto.svg', id)
        removerArquivoUpload(perfil.foto)
        return res.json({
            fotoPerfil: urlImagem(req, 'sem-foto.svg'),
            temFotoPerfil: false,
        })
    } catch (erroRemocao) {
        console.error('Erro ao excluir foto de perfil:', erroRemocao)
        return res.status(500).json({ mensagem: 'Não foi possível concluir a exclusão da foto de perfil.' })
    }
})

app.delete('/perfis/:id/capa', (req, res, next) => {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1) {
        return res.status(404).json({ mensagem: 'Perfil não encontrado' })
    }
    if (!exigirDono(req, res, id)) return

    const perfil = banco.prepare('SELECT capa FROM usuarios WHERE id = ?').get(id)
    if (!perfil) {
        return res.status(404).json({ mensagem: 'Perfil não encontrado' })
    }

    try {
        banco.prepare("UPDATE usuarios SET capa = '' WHERE id = ?").run(id)
        removerArquivoUpload(perfil.capa)
        return res.json({ fotoCapa: '', temFotoCapa: false })
    } catch (erroRemocao) {
        console.error('Erro ao excluir foto de capa:', erroRemocao)
        return res.status(500).json({ mensagem: 'Não foi possível concluir a exclusão da foto de capa.' })
    }
})

app.get('/perfis/:id/posts', (req, res) => {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1 || !banco.prepare('SELECT id FROM usuarios WHERE id = ?').get(id)) {
        return res.status(404).json({ mensagem: 'Perfil não encontrado' })
    }

    const visualizadorId = usuarioDaSessao(req) ?? 0
    const posts = banco.prepare(`
        SELECT
            posts.id,
            posts.usuario_id AS usuarioId,
            usuarios.usuario,
            usuarios.nome,
            usuarios.foto AS avatar,
            posts.imagem,
            posts.legenda,
            posts.publicado_em AS publicadoEm,
            CASE WHEN story_views.post_id IS NULL THEN 0 ELSE 1 END AS visualizado
        FROM posts
        JOIN usuarios ON usuarios.id = posts.usuario_id
        LEFT JOIN story_views
            ON story_views.post_id = posts.id
            AND story_views.visualizador_id = ?
        WHERE posts.usuario_id = ?
        ORDER BY posts.id DESC
    `).all(visualizadorId, id)

    res.json(posts.map((post) => respostaPost(req, post)))
})

app.get('/perfis/:id/stories', (req, res) => {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1 || !banco.prepare('SELECT id FROM usuarios WHERE id = ?').get(id)) {
        return res.status(404).json({ mensagem: 'Perfil não encontrado' })
    }

    const visualizadorId = usuarioDaSessao(req) ?? 0
    const stories = banco.prepare(`
        SELECT
            posts.id,
            posts.usuario_id AS usuarioId,
            usuarios.usuario,
            usuarios.nome,
            usuarios.foto AS avatar,
            posts.imagem,
            posts.legenda,
            posts.publicado_em AS publicadoEm,
            CASE WHEN story_views.post_id IS NULL THEN 0 ELSE 1 END AS visualizado
        FROM posts
        JOIN usuarios ON usuarios.id = posts.usuario_id
        LEFT JOIN story_views
            ON story_views.post_id = posts.id
            AND story_views.visualizador_id = ?
        WHERE posts.usuario_id = ?
        ORDER BY posts.id ASC
    `).all(visualizadorId, id)

    res.json(stories.map((story) => respostaPost(req, story)))
})

app.post('/stories/:postId/visualizacao', (req, res) => {
    const visualizadorId = usuarioDaSessao(req)
    if (!visualizadorId) {
        return res.status(401).json({ mensagem: 'Faça login para registrar Stories visualizados.' })
    }

    const postId = Number(req.params.postId)
    if (!Number.isInteger(postId) || postId < 1) {
        return res.status(404).json({ mensagem: 'Story não encontrado' })
    }
    if (!banco.prepare('SELECT id FROM posts WHERE id = ?').get(postId)) {
        return res.status(404).json({ mensagem: 'Story não encontrado' })
    }

    try {
        banco.prepare(`
            INSERT INTO story_views (visualizador_id, post_id, visualizado_em)
            VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
            ON CONFLICT (visualizador_id, post_id)
            DO UPDATE SET visualizado_em = excluded.visualizado_em
        `).run(visualizadorId, postId)

        return res.json({ visualizado: true })
    } catch (erroRegistro) {
        console.error('Erro ao registrar Story visualizado:', erroRegistro)
        return res.status(500).json({ mensagem: 'Não foi possível registrar a visualização do Story.' })
    }
})

app.post('/perfis/:id/posts', (req, res, next) => {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1 || !banco.prepare('SELECT id FROM usuarios WHERE id = ?').get(id)) {
        return res.status(404).json({ mensagem: 'Perfil não encontrado' })
    }
    const usuarioId = usuarioDaSessao(req)
    if (!usuarioId) {
        return res.status(401).json({ mensagem: 'Faça login para publicar uma foto.' })
    }
    if (usuarioId !== id) {
        return res.status(403).json({ mensagem: 'Você só pode publicar fotos no seu próprio perfil.' })
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
                `INSERT INTO posts (usuario_id, imagem, legenda, publicado_em)
                 VALUES (?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`
            ).run(id, req.file.filename, legenda)
            const post = banco.prepare(`
                SELECT
                    posts.id,
                    posts.usuario_id AS usuarioId,
                    usuarios.usuario,
                    usuarios.nome,
                    usuarios.foto AS avatar,
                    posts.imagem,
                    posts.legenda,
                    posts.publicado_em AS publicadoEm,
                    0 AS visualizado
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

app.delete('/perfis/:id/posts/:postId', (req, res, next) => {
    const id = Number(req.params.id)
    const postId = Number(req.params.postId)
    if (
        !Number.isInteger(id)
        || id < 1
        || !Number.isInteger(postId)
        || postId < 1
    ) {
        return res.status(404).json({ mensagem: 'Publicação não encontrada' })
    }
    if (!exigirDono(req, res, id)) return

    const post = banco.prepare(
        'SELECT imagem FROM posts WHERE id = ? AND usuario_id = ?'
    ).get(postId, id)
    if (!post) {
        return res.status(404).json({ mensagem: 'Publicação não encontrada' })
    }

    try {
        banco.exec('BEGIN')
        try {
            banco.prepare('DELETE FROM story_views WHERE post_id = ?').run(postId)
            banco.prepare('DELETE FROM posts WHERE id = ? AND usuario_id = ?').run(postId, id)
            banco.exec('COMMIT')
        } catch (erroTransacao) {
            banco.exec('ROLLBACK')
            throw erroTransacao
        }
        removerArquivoUpload(post.imagem)
        return res.json({ mensagem: 'Publicação excluída com sucesso' })
    } catch (erroRemocao) {
        console.error('Erro ao excluir publicação:', erroRemocao)
        return res.status(500).json({ mensagem: 'Não foi possível concluir a exclusão da publicação.' })
    }
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
            token: emitirToken(Number(resultado.lastInsertRowid)),
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
        return res.status(400).json({ mensagem: 'Informe e-mail ou usuário e senha' })
    }

    const conta = banco
        .prepare('SELECT id, senha FROM usuarios WHERE lower(usuario) = ? OR lower(email) = ?')
        .get(usuario.trim().toLowerCase(), usuario.trim().toLowerCase())

    if (!conta || !bcrypt.compareSync(senha, conta.senha)) {
        return res.status(401).json({ mensagem: 'E-mail, usuário ou senha incorretos' })
    }

    res.json({
        mensagem: 'Login realizado com sucesso',
        id: conta.id,
        token: emitirToken(conta.id),
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

const PORTA = process.env.PORT || 3000

app.listen(PORTA, () => {
    console.log(`Servidor iniciado em http://localhost:${PORTA}`)
})

