import { useEffect, useRef, useState } from 'react'
import API_URL from '../api'
import './PerfilModal.css'

function PerfilModal({ usuarioId, onClose }) {
  const [perfil, setPerfil] = useState(null)
  const [publicacoes, setPublicacoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [imagemAmpliada, setImagemAmpliada] = useState(null)
  const fecharRef = useRef(null)

  useEffect(() => {
    const controlador = new AbortController()

    async function carregarPerfil() {
      try {
        const [respostaPerfil, respostaPublicacoes] = await Promise.all([
          fetch(`${API_URL}/perfis/${usuarioId}`, { signal: controlador.signal }),
          fetch(`${API_URL}/perfis/${usuarioId}/posts`, { signal: controlador.signal }),
        ])
        const [dadosPerfil, dadosPublicacoes] = await Promise.all([
          respostaPerfil.json(),
          respostaPublicacoes.json(),
        ])

        if (!respostaPerfil.ok) {
          throw new Error(dadosPerfil.mensagem || 'Não foi possível carregar o perfil.')
        }
        if (!respostaPublicacoes.ok) {
          throw new Error(dadosPublicacoes.mensagem || 'Não foi possível carregar as publicações.')
        }
        if (!Array.isArray(dadosPublicacoes)) {
          throw new Error('Não foi possível carregar as publicações.')
        }

        setPerfil(dadosPerfil)
        setPublicacoes(dadosPublicacoes)
      } catch (erroCarregamento) {
        if (erroCarregamento.name !== 'AbortError') {
          setErro(erroCarregamento.message || 'Não foi possível carregar o perfil.')
        }
      } finally {
        if (!controlador.signal.aborted) setCarregando(false)
      }
    }

    carregarPerfil()
    return () => controlador.abort()
  }, [usuarioId])

  useEffect(() => {
    const focoAnterior = document.activeElement
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    fecharRef.current?.focus()

    return () => {
      document.body.style.overflow = overflowAnterior
      if (focoAnterior instanceof HTMLElement && focoAnterior.isConnected) focoAnterior.focus()
    }
  }, [])

  useEffect(() => {
    function lidarComTecla(evento) {
      if (evento.key !== 'Escape') return

      if (imagemAmpliada) {
        setImagemAmpliada(null)
      } else {
        onClose()
      }
    }

    document.addEventListener('keydown', lidarComTecla)
    return () => document.removeEventListener('keydown', lidarComTecla)
  }, [imagemAmpliada, onClose])

  return (
    <div
      className="perfil-modal-backdrop"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onClose()
      }}
    >
      <section
        className="perfil-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="perfil-modal-titulo"
      >
        <button
          ref={fecharRef}
          className="perfil-modal-fechar"
          type="button"
          aria-label="Fechar perfil"
          onClick={onClose}
        >
          <i className="bi bi-x-lg" aria-hidden="true" />
        </button>

        {carregando ? (
          <p className="perfil-modal-estado" role="status">Carregando perfil...</p>
        ) : erro ? (
          <div className="perfil-modal-estado perfil-modal-erro" role="alert">{erro}</div>
        ) : perfil && (
          <div className="perfil-modal-conteudo">
            <header className="perfil-modal-cabecalho">
              <div className={`perfil-modal-capa${perfil.fotoCapa ? ' com-imagem' : ''}`}>
                {perfil.fotoCapa && <img src={perfil.fotoCapa} alt="" />}
              </div>
              <div className="perfil-modal-identidade">
                {perfil.temFotoPerfil ? (
                  <img
                    className="perfil-modal-avatar"
                    src={perfil.fotoPerfil}
                    alt={`Foto de perfil de ${perfil.nome}`}
                  />
                ) : (
                  <span className="perfil-modal-avatar perfil-modal-avatar-vazio" aria-hidden="true">
                    <i className="bi bi-person" />
                  </span>
                )}
                <div className="perfil-modal-nome">
                  <h2 id="perfil-modal-titulo">{perfil.nome}</h2>
                  <span>@{perfil.usuario}</span>
                </div>
              </div>

              {perfil.bio && <p className="perfil-modal-bio">{perfil.bio}</p>}
              {perfil.localidade && (
                <p className="perfil-modal-localidade">
                  <i className="bi bi-geo-alt" aria-hidden="true" />
                  {perfil.localidade}
                </p>
              )}

              <ul className="perfil-modal-estatisticas" aria-label="Informações do perfil">
                <li><strong>{perfil.posts}</strong><span>Publicações</span></li>
                <li>
                  <strong>{perfil.seguidores}</strong>
                  <span>{perfil.seguidores === 1 ? 'Seguidor' : 'Seguidores'}</span>
                </li>
                <li><strong>{perfil.seguindo}</strong><span>Seguindo</span></li>
              </ul>
            </header>

            <section className="perfil-modal-publicacoes" aria-label={`Publicações de ${perfil.nome}`}>
              <h3><i className="bi bi-grid-3x3" aria-hidden="true" /> Publicações</h3>
              {publicacoes.length > 0 ? (
                <div className="perfil-modal-grade">
                  {publicacoes.map((publicacao) => (
                    <button
                      className="perfil-modal-foto"
                      type="button"
                      key={publicacao.id}
                      aria-label={`Ampliar publicação${publicacao.legenda ? `: ${publicacao.legenda}` : ''}`}
                      onClick={() => setImagemAmpliada(publicacao)}
                    >
                      <img
                        src={publicacao.imagem}
                        alt={publicacao.legenda || `Publicação de ${perfil.nome}`}
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="perfil-modal-vazio">Este usuário ainda não publicou fotos.</p>
              )}
            </section>
          </div>
        )}
      </section>

      {imagemAmpliada && (
        <div
          className="perfil-modal-ampliada-backdrop"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) setImagemAmpliada(null)
          }}
        >
          <button
            className="perfil-modal-ampliada-fechar"
            type="button"
            aria-label="Fechar imagem ampliada"
            onClick={() => setImagemAmpliada(null)}
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
          <figure className="perfil-modal-ampliada">
            <img
              src={imagemAmpliada.imagem}
              alt={imagemAmpliada.legenda || `Publicação de ${perfil.nome}`}
            />
            {imagemAmpliada.legenda && <figcaption>{imagemAmpliada.legenda}</figcaption>}
          </figure>
        </div>
      )}
    </div>
  )
}

export default PerfilModal
