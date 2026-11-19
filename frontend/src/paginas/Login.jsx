import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import logo from '../assets/instaclone-logo.svg'
import API_URL from '../api'
import 'bootstrap/dist/css/bootstrap.min.css'
import './Login.css'


const URL_API = `${API_URL}/login`


function Login() {

  //---js
  const navigate = useNavigate()
  const location = useLocation()

  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')


  // Envia usuário e senha ao backend

  async function entrar(event) {
    event.preventDefault()
    setCarregando(true)
    setErro('')

    const formulario = new FormData(event.currentTarget)

    try {
      const resposta = await fetch(URL_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario: formulario.get('usuario'),
          senha: formulario.get('senha'),
        }),
      })

      const dados = await resposta.json()

      if (!resposta.ok) {
        setErro(dados.mensagem || 'Não foi possível fazer login.')
        return
      }

      sessionStorage.setItem('instaclone_usuario_id', String(dados.id))
      sessionStorage.setItem('instaclone_token', dados.token)
      navigate(location.state?.from || `/perfil/${dados.id}`, { replace: true })
    } catch {
      setErro('Não consegui falar com o servidor. Ele está ligado?')
    } finally {
      setCarregando(false)
    }
  }

  //---html
  return (

    <main className="jelly-login-page d-flex justify-content-center align-items-center min-vh-100 px-3 py-5">
      <div className="login-caixa border bg-white">
        <div className="login-brand">
          <img src={logo} alt="" aria-hidden="true" />
          <span>Instaclone</span>
        </div>
      

        <form onSubmit={entrar} className="espaco-entre-email-e-senha d-flex flex-column">
          <input
            type="text"
            className="form-control"
            name="usuario"
            placeholder="Nome de usuário ou e-mail"
            autoComplete="username"
            required
          />
          <input
            type="password"
            className="form-control"
            name="senha"
            placeholder="Senha" 
            required
          />

          {erro && <p role="alert" className="text-danger small text-center m-0">{erro}</p>}
          <button type="submit" className="btn btn-primary botao-login" disabled={carregando}>
            {carregando ? 'Entrando...' : 'Log in'}
          </button>

          <div className="login-for d-flex align-items-center justify-content-center">
            <span>OU</span>
          </div>

          <a href="https://www.facebook.com/?locale=pt_BR" className="facebook-login d-flex align-items-center justify-content-center">
            <img src="https://static.vecteezy.com/system/resources/thumbnails/018/930/698/small/facebook-logo-facebook-icon-transparent-free-png.png" className="img-fluid img-facebook" alt="Logo do Facebook"/>
            <span>Log in com Facebook</span>
          </a>
          <a className="forgot-password d-flex align-items-center justify-content-center" href="#">Esqueceu a senha?</a>
          <p className="text-center small mt-3 mb-0">
            Não tem uma conta? <Link to="/cadastro">Cadastre-se</Link>
          </p>
        </form>
      </div>
    </main>
  )
}

export default Login