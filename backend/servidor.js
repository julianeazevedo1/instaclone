const express = require("express")
const path = require("path")
const fs = require("fs")
const cors = require("cors")

const app = express()

app.use(cors())
app.use(express.json())

//rota
//get perfil -> retorna nome, bio, posts, seguidores, seguindo

const ARQUIVO_PERFIS = path.join(__dirname, "perfis.json")

let perfis = [
    {
        id: 1,
        usuario: "juliane",
        nome: "Juliane Azevedo",
        fotoPerfil:"https://placehold.co/100",
        bio: "Fullstack Dev",
        localidade: "Fortaleza, Brasil",
        posts: 20,
        seguidores: 345,
        seguindo: 27
        
    },
    {
        id: 2,
        usuario: "ana",
        nome: "Ana Silva",
        fotoPerfil:"https://img.magnific.com/fotos-premium/uma-mulher-de-negocios-elegante-e-confiante-a-sorrir_589812-528.jpg?semt=ais_hybrid&w=740&q=80",
        bio: "UX/UI Designer",
        localidade: "Fortaleza, Brasil",
        posts: 20,
        seguidores: 120,
        seguindo: 80,
    },

    {
        id: 3,
        usuario: "joao",
        nome: "João Pereira",
        fotoPerfil:"https://images.pexels.com/photos/31772575/pexels-photo-31772575.jpeg",
        bio: "Product Owner",
        localidade: "Fortaleza, Brasil",
        posts: 30,
        seguidores: 120,
        seguindo: 80,
    },

    {
        id: 4,
        usuario: "carlos",
        nome: "Carlos Santos",
        fotoPerfil:"https://images.pexels.com/photos/7681106/pexels-photo-7681106.jpeg",
        bio: "Product Manager",
        localidade: "Fortaleza, Brasil",
        posts: 50,
        seguidores: 120,
        seguindo: 80,
    }
]

function salvarPerfis() {
    fs.writeFileSync(ARQUIVO_PERFIS, JSON.stringify(perfis, null, 2), "utf8")
}

try {
    perfis = JSON.parse(fs.readFileSync(ARQUIVO_PERFIS, "utf8"))
} catch (erro) {
    if (erro.code === "ENOENT") {
        salvarPerfis()
    } else {
        console.error("Erro ao carregar perfis:", erro)
        process.exit(1)
    }
}

// app.get("/perfil", (req, res) => {
//     res.json({
//         nome: "Juliane Azevedo",
//         bio: "Fullstack Developer",
//         localidade: "Fortaleza, Brasil",
//         posts: 20,
//         seguidores: 345,
//         seguindo: 20,
//     })
// })

app.get("/perfis/:id", (req, res) => {
    const id = Number(req.params.id)
    const perfil = perfis.find((item) => item.id === id)

    if (!perfil) {
        return res.status(404).json({ mensagem: "Perfil não encontrado" })
    }

    res.json(perfil)
})

//login -> post
const usuarios = [
    { email: "juliane@gmail.com", senha: "12345", id: 1 },
    { email: "ana@gmail.com", senha: "12345", id: 2 },
    { email: "joao@gmail.com", senha: "12345", id: 3 },
    { email: "carlos@gmail.com", senha: "12345", id: 4 },
]

app.post("/login", (req, res) => {
    const { email, senha } = req.body

    const usuario = usuarios.find(
        (item) => item.email === email && item.senha === senha
    )

    if (!usuario) {
        return res.status(401).json({
            mensagem: "E-mail ou senha incorretos",
        })
    }

    return res.json({
        mensagem: "Login realizado com sucesso",
        id: usuario.id,
    })
})


app.patch("/perfis/:id", (req, res) => {
    const encontrado = perfis.find(
        (perfil) => perfil.id == req.params.id
    )

    if (!encontrado) {
        return res.status(404).send("Perfil não encontrado!")
    }

    const novoPerfil = {}

    if (req.query.nome !== undefined) {
        novoPerfil.nome = req.query.nome
    }

    if (req.query.bio !== undefined) {
        novoPerfil.bio = req.query.bio
    }

    if (req.query.localidade !== undefined) {
        novoPerfil.localidade = req.query.localidade
    }

    if (Object.keys(novoPerfil).length === 0) {
        return res.status(400).send("Envie nome, bio ou localidade na query")
    }

    Object.assign(encontrado, novoPerfil)

    try {
        salvarPerfis()
    } catch (erro) {
        console.error("Erro ao salvar perfis:", erro)
        return res.status(500).send("Não foi possível salvar o perfil")
    }

    res.json(encontrado)
})
//----------------------------------------------------------------------------------------

const ARQUIVO = "produtos.json"

let produtos = [
    { id: 1, nome: "Mouse", preco: 120, desc: "Mouse caro dms" },
    { id: 2, nome: "Teclado", preco: 20, desc: "Presta não" },
    { id: 3, nome: "Fone de ouvido", preco: 100, desc: "TWS Headphone frush frush" },
    { id: 4, nome: "Mousepad", preco: 12, desc: "Bem finin" },
    { id: 5, nome: "Tela Arzopa", preco: 600, desc: "Full HD" },
]

function salvar() {
    const dadosjson = JSON.stringify(produtos, null, 2)
    fs.writeFile(ARQUIVO, dadosjson, "utf8", (err) => {
        if (err) {
            console.error("Erro ao salvar o arquivo:", err)
        } else {
            console.log("Arquivo salvo!")
        }
    })
}

function ler() {
    if (fs.existsSync(ARQUIVO)) {
        try {
            const dados = fs.readFileSync(ARQUIVO, "utf8")
            produtos = JSON.parse(dados)
        } catch (err) {
            console.error("Erro ao ler o arquivo, usando lista padrão:", err)
        }
    }
}

// Lê o arquivo uma única vez ao iniciar
ler()

app.get("/sobre", (req, res) => {
    const caminho = path.join(__dirname, "curriculo.html")
    res.sendFile(caminho)
})

app.get("/produtos", (req, res) => {
    res.json(produtos)
})

app.get("/produtos/:id", (req, res) => {
    const encontrado = produtos.find(
        (produto) => produto.id == req.params.id
    )

    if (encontrado) {
        res.json(encontrado)
    } else {
        res.status(404).send("Não encontrado")
    }
})

app.post("/produtos", (req, res) => {
    const body = req.body || {}

    const precoValido = body.preco !== undefined && body.preco !== "" && !isNaN(Number(body.preco))

    if (body.nome && precoValido && body.desc) {
        const novoId = produtos.length
            ? Math.max(...produtos.map((p) => p.id)) + 1
            : 1

        const novoProduto = {
            id: novoId,
            nome: body.nome,
            preco: Number(body.preco),
            desc: body.desc,
        }

        produtos.push(novoProduto)
        salvar()
        res.status(201).json(novoProduto)
    } else {
        res.status(400).send("Digite todos os campos (nome, preco e desc)")
    }
})

app.delete("/produtos/:id", (req, res) => {
    const existe = produtos.find(
        (produto) => produto.id == req.params.id
    )

    if (existe) {
        produtos = produtos.filter(
            (produto) => produto.id != req.params.id
        )

        salvar()
        res.send("Apaguei!")
    } else {
        res.status(404).send("Não achei!")
    }
})

app.patch("/produtos/:id", (req, res) => {
    const encontrado = produtos.find(
        (produto) => produto.id == req.params.id
    )

    if (!encontrado) {
        return res.status(404).send("Não encontrei!")
    }

    const novoproduto = {}

    if (req.query.nome) {
        novoproduto.nome = req.query.nome
    }

    if (req.query.preco !== undefined) {
        const preco = Number(req.query.preco)
        if (isNaN(preco)) {
            return res.status(400).send("Preço inválido")
        }
        novoproduto.preco = preco
    }

    if (req.query.desc) {
        novoproduto.desc = req.query.desc
    }

    if (Object.keys(novoproduto).length === 0) {
        return res.status(400).send("Envie nome, preco ou desc na query")
    }

    Object.assign(encontrado, novoproduto)

    salvar()
    res.json(encontrado)
})

app.listen(3000, () => {
    console.log("Servidor iniciado em http://localhost:3000")
})


//login - post
//feed - get
//perfil - get, bio e nome/ enviar foto post
//configuração - patch, get