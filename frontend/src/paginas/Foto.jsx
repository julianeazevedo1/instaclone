import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../componentes/Navbar'

const TAMANHO_MAXIMO = 5 * 1024 * 1024
const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp']

function PublicarFoto() {
  const { id } = useParams()
  const navigate = useNavigate()
  const campoFoto = useRef(null)
  const [foto, setFoto] = useState(null)
  const [legenda, setLegenda] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  function selecionarFoto(event) {
    const arquivo = event.target.files?.[0] ?? null
    setErro('')

    if (arquivo && !TIPOS_PERMITIDOS.includes(arquivo.type)) {
      setErro('Escolha uma imagem JPEG, PNG ou WEBP.')
      event.target.value = ''
      setFoto(null)
      return
    }

    if (arquivo && arquivo.size > TAMANHO_MAXIMO) {
      setErro('A imagem deve ter no máximo 5 MB.')
      event.target.value = ''
      setFoto(null)
      return
    }

    setFoto(arquivo)
  }

  async function publicar(event) {
    event.preventDefault()
    setErro('')

    if (!foto) {
      setErro('Selecione uma foto para publicar.')
      return
    }

    const dados = new FormData()
    dados.append('foto', foto)
    dados.append('legenda', legenda)
    setEnviando(true)

    try {
      const resposta = await fetch(`http://localhost:3000/perfis/${id}/posts`, {
        method: 'POST',
        body: dados,
      })
      const post = await resposta.json()

      if (!resposta.ok) {
        throw new Error(post.mensagem || 'Não foi possível publicar a foto.')
      }

      setFoto(null)
      setLegenda('')
      if (campoFoto.current) campoFoto.current.value = ''
      navigate(`/feed/${id}`)
    } catch (erroPublicacao) {
      setErro(erroPublicacao.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="container-fluid min-vh-100 px-0">
      <div className="row g-0">
        <Navbar />
        <main className="col-12 col-lg-9 col-xl-10 p-3 p-md-4">
          <div className="mx-auto" style={{ maxWidth: '720px' }}>
            <div className="text-center mb-4">
              <h1 className="h3 fw-bold mb-1" style={{ color: '#8b5361' }}>Nova publicação</h1>
              <p className="text-secondary mb-0">Compartilhe uma foto</p>
            </div>

            <div className="card border-0 shadow-sm mb-4" style={{ backgroundColor: '#fff0f3' }}>
              <div className="card-header border-0" style={{ backgroundColor: '#f5cfd8' }}>
                <h2 className="h5 mb-0">Nova publicação</h2>
              </div>
              <div className="card-body">
                <form onSubmit={publicar}>
                  <div className="mb-3">
                    <label htmlFor="foto-publicacao" className="form-label">Escolha uma foto</label>
                    <input
                      ref={campoFoto}
                      id="foto-publicacao"
                      name="foto"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="form-control"
                      onChange={selecionarFoto}
                    />
                    <div className="form-text">JPEG, PNG ou WEBP; até 5 MB.</div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="legenda-publicacao" className="form-label">Legenda (opcional)</label>
                    <textarea
                      id="legenda-publicacao"
                      name="legenda"
                      className="form-control"
                      rows="2"
                      maxLength="2000"
                      value={legenda}
                      onChange={(event) => setLegenda(event.target.value)}
                    />
                  </div>

                  {erro && <div className="alert alert-danger" role="alert">{erro}</div>}

                  <button
                    type="submit"
                    className="btn rounded-pill px-4"
                    disabled={enviando}
                    style={{ backgroundColor: '#e5a5b3', color: '#fff', borderColor: '#e5a5b3' }}
                  >
                    {enviando ? 'Publicando...' : 'Publicar foto'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default PublicarFoto
