import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './Feed.css'

const abas = [
    { id: 'feed', nome: 'Feed' },
    { id: 'reels', nome: 'Reels', colunas: 'col-4 md:col-3 lg:col-2' },
    { id: 'marcados', nome: 'Marcados' },
]

const videosReels = [
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
  const [abaAtiva, setAbaAtiva] = useState('feed')
  const [posts, setPosts] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const abaSelecionada = abas.find((aba) => aba.id === abaAtiva)

  useEffect(() => {
    let ativo = true

    async function carregarPosts() {
      try {
        const resposta = await fetch(`http://localhost:3000/perfis/${perfilId}/posts`)
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
                    <div key={foto.id}>
                        <img
                            src={foto.imagem}
                            alt={foto.legenda || 'Foto publicada'}
                            className="img-fluid w-100"
                            style={{ aspectRatio: '1 / 1', objectFit: 'cover' }}
                        />
                    </div>
                ))}
                {abaAtiva === 'reels' && videosReels.map((video) => (
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