import { useEffect, useRef, useState } from 'react'
import API_URL from '../api'
import './VisualizadorStories.css'

const DURACAO_STORY = 6000

function horarioPublicacao(valor) {
  if (!valor) return 'Horário não disponível'

  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return 'Horário não disponível'

  return `Publicado às ${new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(data)}`
}

function VisualizadorStories({
  usuarios,
  usuarioInicialId,
  token,
  onClose,
  onStoryViewed,
}) {
  const indiceInicial = Math.max(0, usuarios.findIndex(
    (usuario) => Number(usuario.id) === Number(usuarioInicialId)
  ))
  const [indiceUsuario, setIndiceUsuario] = useState(indiceInicial)
  const [stories, setStories] = useState([])
  const [indiceStory, setIndiceStory] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [erroVisualizacao, setErroVisualizacao] = useState('')
  const [pausado, setPausado] = useState(false)
  const [progresso, setProgresso] = useState(0)
  const [imagemIndisponivel, setImagemIndisponivel] = useState(false)
  const fecharRef = useRef(null)
  const toqueInicial = useRef(null)
  const ignorarCliqueAte = useRef(0)
  const progressoAtual = useRef(0)
  const iniciarPeloFim = useRef(false)
  const avancarRef = useRef(null)
  const voltarRef = useRef(null)
  const usuarioAtual = usuarios[indiceUsuario]
  const usuarioAtualId = usuarioAtual?.id
  const storyAtual = stories[indiceStory]
  const storyAtualId = storyAtual?.id
  const storyAtualVisualizado = storyAtual?.visualizado

  useEffect(() => {
    if (!usuarioAtualId) {
      onClose()
      return undefined
    }

    const controlador = new AbortController()
    let efeitoAtivo = true

    async function carregarStories() {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const resposta = await fetch(
          `${API_URL}/perfis/${usuarioAtualId}/stories`,
          { headers, signal: controlador.signal }
        )
        const dados = await resposta.json()

        if (!resposta.ok) {
          throw new Error(dados.mensagem || 'Não foi possível carregar os Stories.')
        }
        if (!Array.isArray(dados)) {
          throw new Error('O servidor retornou Stories em um formato inválido.')
        }
        if (dados.length === 0) {
          onClose()
          return
        }

        setStories(dados)
        setIndiceStory(iniciarPeloFim.current ? dados.length - 1 : 0)
        setProgresso(0)
        progressoAtual.current = 0
        iniciarPeloFim.current = false
      } catch (erroCarregamento) {
        if (efeitoAtivo && erroCarregamento.name !== 'AbortError') {
          setErro(erroCarregamento.message || 'Não foi possível carregar os Stories.')
        }
      } finally {
        if (efeitoAtivo && !controlador.signal.aborted) setCarregando(false)
      }
    }

    carregarStories()
    return () => {
      efeitoAtivo = false
      controlador.abort()
    }
  }, [usuarioAtualId, token, onClose])

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
      if (evento.key === 'Escape') onClose()
      if (evento.key === 'ArrowRight') avancarRef.current?.()
      if (evento.key === 'ArrowLeft') voltarRef.current?.()
    }

    document.addEventListener('keydown', lidarComTecla)
    return () => document.removeEventListener('keydown', lidarComTecla)
  }, [onClose])

  useEffect(() => {
    if (!storyAtualId || !token || storyAtualVisualizado) return undefined

    let efeitoAtivo = true

    async function registrarVisualizacao() {
      try {
        const resposta = await fetch(`${API_URL}/stories/${storyAtualId}/visualizacao`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
        const dados = await resposta.json()

        if (!resposta.ok) {
          throw new Error(dados.mensagem || 'Não foi possível registrar a visualização.')
        }

        setStories((atuais) => atuais.map((story) => (
          story.id === storyAtualId ? { ...story, visualizado: true } : story
        )))
        onStoryViewed(storyAtualId)
      } catch (erroRegistro) {
        if (efeitoAtivo) {
          setErroVisualizacao(erroRegistro.message || 'Não foi possível salvar que este Story foi visualizado.')
        }
      }
    }

    registrarVisualizacao()
    return () => {
      efeitoAtivo = false
    }
  }, [storyAtualId, storyAtualVisualizado, token, onStoryViewed])

  function iniciarProximoUsuario(indice, comecarNoFim = false) {
    iniciarPeloFim.current = comecarNoFim
    setCarregando(true)
    setErro('')
    setErroVisualizacao('')
    setImagemIndisponivel(false)
    setPausado(false)
    setStories([])
    setIndiceStory(0)
    setProgresso(0)
    progressoAtual.current = 0
    setIndiceUsuario(indice)
  }

  function avancarStory() {
    if (indiceStory < stories.length - 1) {
      const proximoIndice = indiceStory + 1
      setIndiceStory(proximoIndice)
      setProgresso(0)
      progressoAtual.current = 0
      setErroVisualizacao('')
      setImagemIndisponivel(false)
      setPausado(false)
      return
    }

    if (indiceUsuario < usuarios.length - 1) {
      iniciarProximoUsuario(indiceUsuario + 1)
      return
    }

    onClose()
  }

  function voltarStory() {
    if (indiceStory > 0) {
      const indiceAnterior = indiceStory - 1
      setIndiceStory(indiceAnterior)
      setProgresso(0)
      progressoAtual.current = 0
      setErroVisualizacao('')
      setImagemIndisponivel(false)
      setPausado(false)
      return
    }

    if (indiceUsuario > 0) {
      iniciarProximoUsuario(indiceUsuario - 1, true)
    }
  }

  useEffect(() => {
    avancarRef.current = avancarStory
    voltarRef.current = voltarStory
  })

  useEffect(() => {
    if (!storyAtualId || carregando || pausado || erro) return undefined

    const inicio = Date.now() - progressoAtual.current
    const temporizador = window.setInterval(() => {
      const atual = Math.min(Date.now() - inicio, DURACAO_STORY)
      progressoAtual.current = atual
      setProgresso(atual)

      if (atual >= DURACAO_STORY) {
        window.clearInterval(temporizador)
        avancarRef.current?.()
      }
    }, 40)

    return () => window.clearInterval(temporizador)
  }, [storyAtualId, carregando, pausado, erro])

  function iniciarPausaPonteiro(evento) {
    if (evento.pointerType === 'touch') return
    setPausado(true)
  }

  function encerrarPausaPonteiro(evento) {
    if (evento.pointerType !== 'touch') setPausado(false)
  }

  function iniciarToque(evento) {
    if (evento.touches.length !== 1) return

    toqueInicial.current = {
      x: evento.touches[0].clientX,
      y: evento.touches[0].clientY,
    }
    setPausado(true)
  }

  function encerrarToque(evento) {
    const origem = toqueInicial.current
    toqueInicial.current = null

    if (origem && evento.changedTouches.length === 1) {
      const deltaX = evento.changedTouches[0].clientX - origem.x
      const deltaY = evento.changedTouches[0].clientY - origem.y
      if (Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY)) {
        ignorarCliqueAte.current = Date.now() + 400
        if (deltaX < 0) avancarStory()
        else voltarStory()
      }
    }

    setPausado(false)
  }

  function clicarZona(direcao) {
    if (Date.now() < ignorarCliqueAte.current) return
    if (direcao === 'proximo') avancarStory()
    else voltarStory()
  }

  const percentual = Math.min(100, (progresso / DURACAO_STORY) * 100)

  return (
    <div className="story-viewer-backdrop">
      <section
        className="story-viewer"
        role="dialog"
        aria-modal="true"
        aria-label={`Stories de ${usuarioAtual?.nome || usuarioAtual?.usuario || 'usuário'}`}
        onPointerDown={iniciarPausaPonteiro}
        onPointerUp={encerrarPausaPonteiro}
        onPointerCancel={encerrarPausaPonteiro}
        onTouchStart={iniciarToque}
        onTouchEnd={encerrarToque}
      >
        {storyAtual && (
          <img
            className="story-viewer-fundo"
            src={storyAtual.imagem}
            alt=""
            aria-hidden="true"
          />
        )}
        <div className="story-viewer-sombra" aria-hidden="true" />

        {stories.length > 0 && !erro && (
          <div className="story-viewer-progresso" aria-label="Progresso dos Stories">
            {stories.map((story, indice) => {
              const preenchimento = indice < indiceStory
                ? 100
                : indice === indiceStory
                  ? percentual
                  : 0

              return (
                <span
                  className="story-viewer-trilho"
                  key={story.id}
                  role="progressbar"
                  aria-label={`Story ${indice + 1} de ${stories.length}`}
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-valuenow={Math.round(preenchimento)}
                >
                  <span style={{ width: `${preenchimento}%` }} />
                </span>
              )
            })}
          </div>
        )}

        <header className="story-viewer-topo">
          {storyAtual && (
            <div className="story-viewer-autor">
              <img src={storyAtual.avatar} alt="" />
              <div>
                <strong>{storyAtual.nome || storyAtual.usuario}</strong>
                <span>{horarioPublicacao(storyAtual.publicadoEm)}</span>
              </div>
            </div>
          )}
          <button
            ref={fecharRef}
            className="story-viewer-fechar"
            type="button"
            aria-label="Fechar Stories"
            onClick={onClose}
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </header>

        {carregando ? (
          <p className="story-viewer-estado" role="status">Carregando Stories...</p>
        ) : erro ? (
          <div className="story-viewer-estado story-viewer-erro" role="alert">
            <p>{erro}</p>
            <button type="button" onClick={onClose}>Fechar</button>
          </div>
        ) : storyAtual ? (
          <div className={`story-viewer-palco${pausado ? ' pausado' : ''}`}>
            {imagemIndisponivel ? (
              <p className="story-viewer-imagem-erro" role="alert">Esta imagem não está disponível.</p>
            ) : (
              <img
                className="story-viewer-imagem"
                src={storyAtual.imagem}
                alt={storyAtual.legenda || `Story de ${storyAtual.nome || storyAtual.usuario}`}
                onError={() => setImagemIndisponivel(true)}
                draggable="false"
              />
            )}
            <button
              className="story-viewer-zona story-viewer-zona-anterior"
              type="button"
              aria-label="Story anterior"
              onClick={() => clicarZona('anterior')}
            />
            <button
              className="story-viewer-zona story-viewer-zona-proximo"
              type="button"
              aria-label="Próximo Story"
              onClick={() => clicarZona('proximo')}
            />
          </div>
        ) : null}

        {erroVisualizacao && (
          <p className="story-viewer-aviso" role="status">{erroVisualizacao}</p>
        )}
        {storyAtual?.legenda && !erro && (
          <p className="story-viewer-legenda">{storyAtual.legenda}</p>
        )}
        {pausado && !erro && (
          <span className="story-viewer-pausado" aria-live="polite">
            <i className="bi bi-pause-fill" aria-hidden="true" />
            Pausado
          </span>
        )}
      </section>
    </div>
  )
}

export default VisualizadorStories
