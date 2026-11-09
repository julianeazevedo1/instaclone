import { useState } from 'react'

const abas = [
    { id: 'feed', nome: 'Feed', imagem: 'https://placehold.co/600', colunas: 'col-6 md:col-4 lg:col-3' },
    { id: 'reels', nome: 'Reels', imagem: 'https://placehold.co/500x700', colunas: 'col-4 md:col-3 lg:col-2' },
    { id: 'marcados', nome: 'Marcados', imagem: 'https://placehold.co/400/pink/white', colunas: 'col-6 md:col-4 lg:col-3' },
]

function Feed() {
    const [abaAtiva, setAbaAtiva] = useState('feed')
    const abaSelecionada = abas.find((aba) => aba.id === abaAtiva)

    return (
        <section className="container-fluid px-7 d-flex flex-column align-items-center">
            <div className="nav nav-pills my-5 justify-content-evenly" role="group" aria-label="Publicações do perfil">
                {abas.map((aba) => (
                    <button
                        key={aba.id}
                        className={`nav-link ${abaAtiva === aba.id ? 'active' : ''}`}
                        type="button"
                        aria-pressed={abaAtiva === aba.id}
                        onClick={() => setAbaAtiva(aba.id)}
                    >
                        {aba.nome}
                    </button>
                ))}
            </div>

            <div className="row g-1 g-1" aria-live="polite">
                {Array.from({ length: 16 }, (_, index) => (
                    <div className={abaSelecionada.colunas} key={`${abaAtiva}-${index}`}>
                        <img
                            src={`${abaSelecionada.imagem}?text=${abaSelecionada.nome}+${index + 1}`}
                            alt={`${abaSelecionada.nome} ${index + 1}`}
                            className="img-fluid w-100"
                        />
                    </div>
                ))}
            </div>
        </section>
    )
}

export default Feed
