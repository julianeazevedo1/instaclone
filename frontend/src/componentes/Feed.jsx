import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import API_URL from '../api'
import './Feed.css'

const abas = [
    { id: 'feed', nome: 'Feed' },
    { id: 'reels', nome: 'Reels', colunas: 'col-4 md:col-3 lg:col-2' },
    { id: 'marcados', nome: 'Marcados' },
]

const reelsAna = [
    {
        id: 'flores',
        titulo: 'Flores ao vento',
        src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        credito: 'MDN · CC0',
    },
    {
        id: 'sintel-1',
        titulo: 'Sintel · trecho 1',
        src: 'https://media.w3.org/2010/05/sintel/trailer.mp4#t=0,15',
        credito: 'Blender Foundation · CC BY 3.0',
    },
    {
        id: 'sintel-2',
        titulo: 'Sintel · trecho 2',
        src: 'https://media.w3.org/2010/05/sintel/trailer.mp4#t=15,30',
        credito: 'Blender Foundation · CC BY 3.0',
    },
    {
        id: 'big-buck-bunny-1',
        titulo: 'Big Buck Bunny · trecho 1',
        src: 'https://media.w3.org/2010/05/bunny/trailer.mp4#t=0,15',
        credito: 'Blender Foundation · CC BY 3.0',
    },
    {
        id: 'big-buck-bunny-2',
        titulo: 'Big Buck Bunny · trecho 2',
        src: 'https://media.w3.org/2010/05/bunny/trailer.mp4#t=15,30',
        credito: 'Blender Foundation · CC BY 3.0',
    },
    {
        id: 'sintel-3',
        titulo: 'Sintel · trecho 3',
        src: 'https://media.w3.org/2010/05/sintel/trailer.mp4#t=30,45',
        credito: 'Blender Foundation · CC BY 3.0',
    },
    {
        id: 'sintel-4',
        titulo: 'Sintel · trecho 4',
        src: 'https://media.w3.org/2010/05/sintel/trailer.mp4#t=45,60',
        credito: 'Blender Foundation · CC BY 3.0',
    },
    {
        id: 'big-buck-bunny-3',
        titulo: 'Big Buck Bunny · trecho 3',
        src: 'https://media.w3.org/2010/05/bunny/trailer.mp4#t=30,45',
        credito: 'Blender Foundation · CC BY 3.0',
    },
    {
        id: 'big-buck-bunny-4',
        titulo: 'Big Buck Bunny · trecho 4',
        src: 'https://media.w3.org/2010/05/bunny/trailer.mp4#t=45,60',
        credito: 'Blender Foundation · CC BY 3.0',
    },
    {
        id: 'big-buck-bunny-5',
        titulo: 'Big Buck Bunny · trecho 5',
        src: 'https://media.w3.org/2010/05/bunny/trailer.mp4#t=60,75',
        credito: 'Blender Foundation · CC BY 3.0',
    },
    {
        id: 'big-buck-bunny-6',
        titulo: 'Big Buck Bunny · trecho 6',
        src: 'https://media.w3.org/2010/05/bunny/trailer.mp4#t=75,90',
        credito: 'Blender Foundation · CC BY 3.0',
    },
    {
        id: 'big-buck-bunny-7',
        titulo: 'Big Buck Bunny · trecho 7',
        src: 'https://media.w3.org/2010/05/bunny/trailer.mp4#t=90,105',
        credito: 'Blender Foundation · CC BY 3.0',
    },
]

function Feed({ perfilId, atualizacao }) {
  const usuarioLogadoId = Number(sessionStorage.getItem('instaclone_usuario_id'))
  const [abaAtiva, setAbaAtiva] = useState('feed')
  const [posts, setPosts] = useState([])
  const [resultadoPerfil, setResultadoPerfil] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [erroExclusao, setErroExclusao] = useState('')
  const [excluindoId, setExcluindoId] = useState(null)
  const abaSelecionada = abas.find((aba) => aba.id === abaAtiva)
  const resultadoPerfilAtual = resultadoPerfil?.id === Number(perfilId)
  const erroPerfil = resultadoPerfilAtual ? resultadoPerfil.erro : ''
  const ehPerfilAna = resultadoPerfilAtual && !erroPerfil && resultadoPerfil.usuario === 'ana'

  useEffect(() => {
    const controlador = new AbortController()

    async function carregarPerfil() {
      try {
        const resposta = await fetch(`${API_URL}/perfis/${perfilId}`, {
          signal: controlador.signal,
        })
        const perfil = await resposta.json()
        if (!resposta.ok) {
          throw new Error(perfil.mensagem || 'Não foi possível identificar este perfil.')
        }

        setResultadoPerfil({
          id: Number(perfilId),
          usuario: perfil.usuario?.trim().toLowerCase(),
        })
      } catch (erroCarregamento) {
        if (erroCarregamento.name !== 'AbortError') {
          setResultadoPerfil({
            id: Number(perfilId),
            erro: erroCarregamento.message || 'Não foi possível identificar este perfil.',
          })
        }
      }
    }

    carregarPerfil()
    return () => controlador.abort()
  }, [perfilId])

  useEffect(() => {
    let ativo = true

    async function carregarPosts() {
      try {
        const resposta = await fetch(`${API_URL}/perfis/${perfilId}/posts`)
        if (!resposta.ok) throw new Error('Não foi possível carregar as publicações')
        const publicacoes = await resposta.json()
        if (ativo) setPosts(publicacoes)
      } catch (erroCarregamento) {
        if (ativo) setErro(erroCarregamento.message)
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    carregarPosts()

    return () => {
      ativo = false
    }
  }, [perfilId, atualizacao])

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

      setPosts((atuais) => atuais.filter((atual) => atual.id !== post.id))
    } catch (erroRemocao) {
      setErroExclusao(erroRemocao.message)
    } finally {
      setExcluindoId(null)
    }
  }

    return (
        <section className="container-fluid px-7 d-flex flex-column align-items-center">
            <div className="nav nav-pills botao-feed my-5 justify-content-evenly" role="group" aria-label="Publicações do perfil">
                {abas.map((aba) => (
                    <button
                        key={aba.id}
                        className={`nav-link ${abaAtiva === aba.id ? 'active ' : ''}`}
                        type="button"
                        aria-pressed={abaAtiva === aba.id}
                        onClick={() => setAbaAtiva(aba.id)}
                    >
                        {aba.nome}
                    </button>
                ))}
            </div>

            {carregando && <p className="text-secondary" role="status">Carregando publicações...</p>}
            {erro && <div className="alert alert-danger" role="alert">{erro}</div>}
            {erroExclusao && <div className="alert alert-danger" role="alert">{erroExclusao}</div>}
            {abaAtiva === 'reels' && !resultadoPerfilAtual && (
                <p className="text-secondary" role="status">Carregando Reels...</p>
            )}
            {abaAtiva === 'reels' && resultadoPerfilAtual && erroPerfil && (
                <div className="alert alert-danger" role="alert">{erroPerfil}</div>
            )}
            {abaAtiva === 'reels' && resultadoPerfilAtual && !erroPerfil && !ehPerfilAna && (
                <p className="text-secondary" role="status">Este perfil ainda não tem Reels.</p>
            )}
            {!carregando && !erro && abaAtiva === 'feed' && posts.length === 0 && (
                <div className="feed-vazio" role="status">
                    <i className="bi bi-camera" aria-hidden="true" />
                    <p>Você ainda não publicou nenhuma foto.</p>
                    <Link className="btn feed-vazio-botao" to={`/publicar/${perfilId}`}>
                        Publicar primeira foto
                    </Link>
                </div>
            )}
            {!carregando && !erro && abaAtiva === 'marcados' && (
                <p className="text-secondary" role="status">Nenhuma publicação marcada por enquanto.</p>
            )}

            <div
                className={abaAtiva === 'feed'
                    ? 'grade-fotos'
                    : `row g-1 ${abaAtiva === 'reels' ? 'justify-content-center' : ''}`}
                aria-live="polite"
            >
                {!carregando && !erro && abaAtiva === 'feed' && posts.map((foto) => (
                    <div className="feed-foto" key={foto.id}>
                        <img
                            src={foto.imagem}
                            alt={foto.legenda || 'Foto publicada'}
                            className="img-fluid w-100"
                            style={{ aspectRatio: '1 / 1', objectFit: 'cover' }}
                        />
                        {Number(foto.usuarioId) === usuarioLogadoId && usuarioLogadoId > 0 && (
                        <button
                            className="feed-foto-excluir"
                            type="button"
                            aria-label="Excluir foto"
                            title="Excluir foto"
                            disabled={excluindoId === foto.id}
                            onClick={() => excluirPublicacao(foto)}
                        >
                            <i className={`bi ${excluindoId === foto.id ? 'bi-arrow-repeat' : 'bi-trash3'}`} aria-hidden="true" />
                        </button>
                        )}
                    </div>
                ))}
                {abaAtiva === 'reels' && ehPerfilAna && reelsAna.map((video) => (
                    <div className={abaSelecionada.colunas} key={video.id}>
                        <video
                            className="img-fluid w-100"
                            controls
                            muted
                            loop
                            playsInline
                            preload="metadata"
                            aria-label={`${video.titulo} · ${video.credito}`}
                            title={`${video.titulo} · ${video.credito}`}
                            style={{ aspectRatio: '5 / 7', objectFit: 'cover', backgroundColor: '#000' }}
                        >
                            <source src={video.src} type="video/mp4" />
                            Seu navegador não consegue reproduzir este vídeo.
                        </video>
                    </div>
                ))}
            </div>
        </section>
    )
}

export default Feed