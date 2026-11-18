import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../assets/instaclone-logo.svg'
import './Cadastro.css'

const URL_API = 'http://localhost:3000/cadastro'

function Cadastro() {
  const navigate = useNavigate()
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  async function cadastrar(event) {
    event.preventDefault()
    setErro('')

    const formulario = new FormData(event.currentTarget)
    const senha = formulario.get('senha')
    const confirmarSenha = formulario.get('confirmarSenha')

    if (senha !== confirmarSenha) {
      setErro('As senhas não conferem.')
      return
    }

    setCarregando(true)

    try {
      const resposta = await fetch(URL_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formulario.get('email'),
          nome: formulario.get('nome'),
          usuario: formulario.get('usuario'),
          senha,
        }),
      })
      const dados = await resposta.json()

      if (!resposta.ok) {
        throw new Error(dados.mensagem || 'Não foi possível criar a conta.')
      }

      navigate(`/perfil/${dados.id}`)
    } catch (erroCadastro) {
      setErro(erroCadastro.message || 'Não foi possível falar com o servidor.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <main className="cadastro-page container-fluid min-vh-100 d-flex justify-content-center align-items-center px-3 py-5">
      <section className="cadastro-card">
        <Link className="cadastro-brand" to="/login">
          <img src={logo} alt="" aria-hidden="true" />
          <span>Instaclone</span>
        </Link>

        <h1 className="h4 text-center mt-4 mb-2">Crie sua conta</h1>
        <p className="cadastro-description text-center mb-4">
          Entre para compartilhar fotos e acompanhar pessoas que inspiram você.
        </p>

        <form className="d-flex flex-column gap-3" onSubmit={cadastrar}>
          <div>
            <label htmlFor="cadastro-email" className="form-label">Email</label>
            <input
              id="cadastro-email"
              name="email"
              type="email"
              className="form-control"
              placeholder="voce@exemplo.com"
              autoComplete="email"
              maxLength={254}
              required
            />
          </div>

          <div>
            <label htmlFor="cadastro-nome" className="form-label">Nome completo</label>
            <input
              id="cadastro-nome"
              name="nome"
              type="text"
              className="form-control"
              placeholder="Como podemos chamar você?"
              autoComplete="name"
              minLength={2}
              maxLength={80}
              required
            />
          </div>

          <div>
            <label htmlFor="cadastro-usuario" className="form-label">Nome de usuário</label>
            <input
              id="cadastro-usuario"
              name="usuario"
              type="text"
              className="form-control"
              placeholder="seu.usuario"
              autoComplete="username"
              autoCapitalize="none"
              pattern="[A-Za-z0-9._]{3,30}"
              title="Use de 3 a 30 letras, números, pontos ou sublinhados."
              minLength={3}
              maxLength={30}
              required
            />
          </div>

          <div>
            <label htmlFor="cadastro-senha" className="form-label">Senha</label>
            <input
              id="cadastro-senha"
              name="senha"
              type="password"
              className="form-control"
              placeholder="Mínimo de 8 caracteres"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
            />
          </div>

          <div>
            <label htmlFor="cadastro-confirmar-senha" className="form-label">Confirmar senha</label>
            <input
              id="cadastro-confirmar-senha"
              name="confirmarSenha"
              type="password"
              className="form-control"
              placeholder="Digite a senha novamente"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
            />
          </div>

          {erro && <div className="alert alert-danger mb-0" role="alert">{erro}</div>}

          <button type="submit" className="btn btn-primary cadastro-submit mt-1" disabled={carregando}>
            {carregando ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className="cadastro-footer text-center mb-0 mt-4">
          Já tem uma conta? <Link to="/login">Entrar</Link>
        </p>
      </section>
    </main>
  )
}

export default Cadastro
