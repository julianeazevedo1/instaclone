import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../componentes/Navbar'
import './FeedInicio.css'

function FeedInicio() {
  const [publicacoes, setPublicacoes] = useState([])
  const [curtidas, setCurtidas] = useState({})
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const historias = [
    ...new Map(
      publicacoes
        .filter((post) => post.usuarioId)
        .map((post) => [
          post.usuarioId,
          { id: post.usuarioId, usuario: post.usuario, avatar: post.avatar },
        ])
    ).values(),
  ]

  useEffect(() => {
    let ativo = true

    async function carregarPublicacoes() {
      try {
        const resposta = await fetch('http://localhost:3000/posts')
        const dados = await resposta.json()

        if (!resposta.ok) {
          throw new Error(dados.mensagem || 'Não foi possível carregar as publicações.')
        }

        if (ativo) setPublicacoes(dados)
      } catch (erroCarregamento) {
        if (ativo) setErro(erroCarregamento.message)
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    carregarPublicacoes()

    return () => {
      ativo = false
    }
  }, [])

  return (
    <div className="container-fluid min-vh-100 px-0 bg-light">
      <div className="row g-0">
        <Navbar />
        <main className="col-12 col-lg-9 col-xl-10 p-3 p-md-4">
          <section className="stories-section mx-auto" style={{ maxWidth: '600px' }} aria-label="Stories">
            <div className="stories-track">
              {historias.map((historia) => (
                <Link
                  className="story-item"
                  key={historia.id}
                  to={`/perfil/${historia.id}`}
                  aria-label={`Ver perfil de ${historia.usuario}`}
                >
                  <span className="story-ring">
                    <img src={historia.avatar} alt="" className="story-avatar" />
                  </span>
                  <span className="story-name">{historia.usuario}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="mx-auto" style={{ maxWidth: '600px' }} aria-label="Publicações">
            {carregando && <p className="text-secondary" role="status">Carregando publicações...</p>}
            {erro && <div className="alert alert-danger" role="alert">{erro}</div>}
            {!carregando && !erro && publicacoes.length === 0 && (
              <p className="text-secondary">Ainda não há publicações no feed.</p>
            )}
            {publicacoes.map((post) => (
              <div className="card shadow-sm mb-4" key={post.id}>
                <div className="card-body d-flex align-items-center gap-2 py-2">
                  <img
                    src={post.avatar}
                    alt=""
                    className="rounded-circle"
                    style={{ width: 40, height: 40, objectFit: 'cover' }}
                  />
                  <strong>{post.usuario}</strong>
                </div>
                <img
                  src={post.imagem}
                  alt={`Publicação de ${post.usuario}`}
                  className="card-img-top"
                />
                <div className="card-body py-2">
                  <div className="d-flex gap-2 mb-2">
                    <button
                      className={`btn btn-light ${curtidas[post.id] ? 'text-danger' : ''}`}
                      type="button"
                      aria-label="Curtir"
                      onClick={() => setCurtidas({ ...curtidas, [post.id]: !curtidas[post.id] })}
                    >
                      <i className={`bi ${curtidas[post.id] ? 'bi-heart-fill' : 'bi-heart'}`} />
                    </button>
                    <button className="btn btn-light" type="button" aria-label="Comentar"><i className="bi bi-chat" /></button>
                    <button className="btn btn-light" type="button" aria-label="Compartilhar"><i className="bi bi-send" /></button>
                    <button className="btn btn-light ms-auto" type="button" aria-label="Salvar"><i className="bi bi-bookmark" /></button>
                  </div>
                  <strong>{curtidas[post.id] ? 1 : 0} curtidas</strong>
                  {post.legenda && (
                    <p className="mb-0"><strong>{post.usuario}</strong> {post.legenda}</p>
                  )}
                </div>
              </div>
            ))}
          </section>
        </main>
      </div>
    </div>
  )
}

export default FeedInicio
