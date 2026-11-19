import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../componentes/Navbar'
import PerfilModal from '../componentes/PerfilModal'
import VisualizadorStories from '../componentes/VisualizadorStories'
import API_URL from '../api'
import './FeedInicio.css'

function FeedInicio() {
  const usuarioLogadoId = Number(sessionStorage.getItem('instaclone_usuario_id'))
  const token = sessionStorage.getItem('instaclone_token')
  const navigate = useNavigate()
  const [perfilAbertoId, setPerfilAbertoId] = useState(null)
  const [storiesUsuarioId, setStoriesUsuarioId] = useState(null)
  const [publicacoes, setPublicacoes] = useState([])
  const [curtidas, setCurtidas] = useState({})
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [erroExclusao, setErroExclusao] = useState('')
  const [excluindoId, setExcluindoId] = useState(null)
  const fecharPerfil = useCallback(() => setPerfilAbertoId(null), [])
  const fecharStories = useCallback(() => setStoriesUsuarioId(null), [])
  const marcarStoryComoVisto = useCallback((postId) => {
    setPublicacoes((atuais) => atuais.map((post) => (
      post.id === postId ? { ...post, visualizado: true } : post
    )))
  }, [])

  function selecionarPerfil(id) {
    if (Number(id) === usuarioLogadoId) {
      navigate(`/perfil/${id}`)
      return
    }

    setPerfilAbertoId(Number(id))
  }

  const historias = Array.from(publicacoes.reduce((agrupadas, post) => {
    if (!post.usuarioId) return agrupadas

    const id = Number(post.usuarioId)
    const historia = agrupadas.get(id) || {
      id,
      usuario: post.usuario,
      nome: post.nome,
      avatar: post.avatar,
      temNovas: false,
    }
    historia.temNovas = historia.temNovas || !post.visualizado
    agrupadas.set(id, historia)
    return agrupadas
  }, new Map()).values())

  function abrirStories(id) {
    if (!historias.some((historia) => historia.id === Number(id))) return
    setStoriesUsuarioId(Number(id))
  }

  useEffect(() => {
    let ativo = true

    async function carregarPublicacoes() {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const resposta = await fetch(`${API_URL}/posts`, { headers })
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
  }, [token])

  async function excluirPublicacao(post) {
    if (Number(post.usuarioId) !== usuarioLogadoId || usuarioLogadoId < 1) return

    if (!window.confirm('Excluir esta foto? Esta ação não pode ser desfeita.')) return

    setErroExclusao('')
    setExcluindoId(post.id)

    try {
      const resposta = await fetch(`${API_URL}/perfis/${post.usuarioId}/posts/${post.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${sessionStorage.getItem('instaclone_token')}` },
      })
      const resultado = await resposta.json()
      if (!resposta.ok) {
        throw new Error(resultado.mensagem || 'Não foi possível excluir a publicação.')
      }

      setPublicacoes((atuais) => atuais.filter((atual) => atual.id !== post.id))
    } catch (erroRemocao) {
      setErroExclusao(erroRemocao.message)
    } finally {
      setExcluindoId(null)
    }
  }

  return (
    <div className="container-fluid min-vh-100 px-0 jelly-feed-page">
      <div className="row g-0">
        <Navbar />
        <main className="col-12 jelly-feed-main">
          <section className="stories-section mx-auto" style={{ maxWidth: '600px' }} aria-label="Stories">
            <div className="stories-track">
              {historias.map((historia) => (
                <div
                  className="story-item"
                  key={historia.id}
                >
                  <button
                    className={`story-ring ${historia.temNovas ? 'story-ring-tem-novas' : 'story-ring-vistos'}`}
                    type="button"
                    aria-label={`Assistir Stories de ${historia.nome || historia.usuario}`}
                    onClick={() => abrirStories(historia.id)}
                  >
                    <img src={historia.avatar} alt="" className="story-avatar" />
                  </button>
                  <button
                    className="story-name"
                    type="button"
                    onClick={() => selecionarPerfil(historia.id)}
                  >
                    {historia.nome || historia.usuario}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="mx-auto" style={{ maxWidth: '600px' }} aria-label="Publicações">
            {carregando && <p className="text-secondary" role="status">Carregando publicações...</p>}
            {erro && <div className="alert alert-danger" role="alert">{erro}</div>}
            {erroExclusao && <div className="alert alert-danger" role="alert">{erroExclusao}</div>}
            {!carregando && !erro && publicacoes.length === 0 && (
              <p className="text-secondary">Ainda não há publicações no feed.</p>
            )}
            {publicacoes.map((post) => (
              <div className="card jelly-post-card mb-4" key={post.id}>
                <div className="card-body d-flex align-items-center gap-2 py-2">
                  <button
                    className="jelly-post-avatar-button"
                    type="button"
                    aria-label={`Ver perfil de ${post.usuario}`}
                    onClick={() => selecionarPerfil(post.usuarioId)}
                  >
                    <img
                      src={post.avatar}
                      alt=""
                      className="rounded-circle"
                      style={{ width: 40, height: 40, objectFit: 'cover' }}
                    />
                  </button>
                  <button
                    className="jelly-post-author-button"
                    type="button"
                    onClick={() => selecionarPerfil(post.usuarioId)}
                  >
                    {post.usuario}
                  </button>
                  {Number(post.usuarioId) === usuarioLogadoId && usuarioLogadoId > 0 && (
                    <button
                      className="btn jelly-delete-post-button ms-auto"
                      type="button"
                      aria-label="Excluir publicação"
                      title="Excluir publicação"
                      disabled={excluindoId === post.id}
                      onClick={() => excluirPublicacao(post)}
                    >
                      <i className={`bi ${excluindoId === post.id ? 'bi-arrow-repeat' : 'bi-trash3'}`} aria-hidden="true" />
                      <span>{excluindoId === post.id ? 'Excluindo...' : 'Excluir'}</span>
                    </button>
                  )}
                </div>
                <img
                  src={post.imagem}
                  alt={`Publicação de ${post.usuario}`}
                  className="card-img-top"
                />
                <div className="card-body py-2">
                  <div className="d-flex gap-2 mb-2">
                    <button
                      className={`btn jelly-icon-button ${curtidas[post.id] ? 'curtido' : ''}`}
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
      {perfilAbertoId !== null && (
        <PerfilModal
          key={perfilAbertoId}
          usuarioId={perfilAbertoId}
          onClose={fecharPerfil}
        />
      )}
      {storiesUsuarioId !== null && (
        <VisualizadorStories
          key={storiesUsuarioId}
          usuarios={historias}
          usuarioInicialId={storiesUsuarioId}
          token={token}
          onClose={fecharStories}
          onStoryViewed={marcarStoryComoVisto}
        />
      )}
    </div>
  )
}

export default FeedInicio
