import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import './Login.css'


const URL_API = 'http://localhost:3000/login'


function Login() {

  //---js
  const navigate = useNavigate()

  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')


  //envia email e senha ao backend 

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
          email: formulario.get('email'),
          senha: formulario.get('senha'),
        }),
      })

      const dados = await resposta.json()

      if (!resposta.ok) {
        setErro(dados.mensagem || 'Não foi possível fazer login.')
        return
      }

      navigate(`/perfil/${dados.id}`)
    } catch {
      setErro('Não consegui falar com o servidor. Ele está ligado?')
    } finally {
      setCarregando(false)
    }
  }

  //---html
  return (

    <div className=" d-flex justify-content-center align-items-center min-vh-100 px-3">
      <div className="login-caixa border bg-white">
        <img src="https://thumbs.dreamstime.com/b/modelo-do-logotipo-instagram-ilustrativo-em-fundo-branco-%C3%ADcone-de-logotipos-%C3%ADcones-definir-m%C3%ADdias-sociais-banner-plano-vetores-210441931.jpg" className="img-fluid img-instagem" alt="Logo do Instagram" />
      

        <form onSubmit={entrar} className="espaco-entre-email-e-senha d-flex flex-column">
          <input
            type="email"
            className="form-control"
            name="email"
            placeholder="Email"
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
          
            <span>OR</span>
            
          </div>

          <a  href="https://www.facebook.com/?locale=pt_BR" className="d-flex align-items-center justify-content-center">
            <img src="https://static.vecteezy.com/system/resources/thumbnails/018/930/698/small/facebook-logo-facebook-icon-transparent-free-png.png" className="img-fluid img-facebook" alt="Logo do Facebook"/>
            <span>Log in com Facebook</span>
          </a>
          <a  className="d-flex align-items-center justify-content-center" href="#">Esqueceu a senha?</a>
        </form>
      </div>
    </div>
  )
}

export default Login