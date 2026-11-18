import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Navbar from '../componentes/Navbar'
import './Configuracao.css'

const URL_API = 'http://localhost:3000/perfis'
const TAMANHO_MAXIMO = 5 * 1024 * 1024
const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp']

function Configuracao() {
  const { id } = useParams()
  const [perfil, setPerfil] = useState(null)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [erroFoto, setErroFoto] = useState('')
  const [mensagemFoto, setMensagemFoto] = useState('')
  const [enviandoFoto, setEnviandoFoto] = useState(false)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    let ativo = true

    async function carregarPerfil() {
      try {
        const resposta = await fetch(`${URL_API}/${id}`)
        if (!resposta.ok) throw new Error('Não foi possível carregar o perfil')
        const dados = await resposta.json()
        if (ativo) setPerfil(dados)
      } catch (erroCarregamento) {
        if (ativo) setErro(erroCarregamento.message)
      }
    }

    carregarPerfil()
    return () => {
      ativo = false
    }
  }, [id])

  function alterarCampo(campo, valor) {
    setPerfil((atual) => ({ ...atual, [campo]: valor }))
  }

  async function alterarFoto(event) {
    const campoFoto = event.currentTarget
    const arquivo = campoFoto.files?.[0]
    if (!arquivo) return

    setErroFoto('')
    setMensagemFoto('')

    if (!TIPOS_PERMITIDOS.includes(arquivo.type)) {
      setErroFoto('Escolha uma imagem JPEG, PNG ou WEBP.')
      campoFoto.value = ''
      return
    }

    if (arquivo.size > TAMANHO_MAXIMO) {
      setErroFoto('A foto deve ter no máximo 5 MB.')
      campoFoto.value = ''
      return
    }

    const dados = new FormData()
    dados.append('foto', arquivo)
    setEnviandoFoto(true)

    try {
      const resposta = await fetch(`${URL_API}/${id}/foto`, {
        method: 'POST',
        body: dados,
      })
      const resultado = await resposta.json()

      if (!resposta.ok) {
        throw new Error(resultado.mensagem || 'Não foi possível atualizar a foto de perfil.')
      }

      setPerfil((atual) => ({ ...atual, fotoPerfil: resultado.fotoPerfil }))
      setMensagemFoto('Foto de perfil atualizada.')
    } catch (erroEnvio) {
      setErroFoto(erroEnvio.message)
    } finally {
      setEnviandoFoto(false)
      campoFoto.value = ''
    }
  }

  async function salvarPerfil(event) {
    event.preventDefault()
    setErro('')
    setMensagem('')
    setSalvando(true)

    const parametros = new URLSearchParams({
      nome: perfil.nome ?? '',
      bio: perfil.bio ?? '',
      localidade: perfil.localidade ?? '',
    })

    try {
      const resposta = await fetch(`${URL_API}/${id}?${parametros}`, { method: 'PATCH' })
      const resultado = await resposta.json()
      if (!resposta.ok) {
        throw new Error(resultado.mensagem || 'Não foi possível salvar as alterações.')
      }

      setPerfil(resultado)
      setMensagem('Alterações salvas com sucesso.')
    } catch (erroSalvamento) {
      setErro(erroSalvamento.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="container-fluid min-vh-100 px-0">
      <div className="row g-0">
        <Navbar />
        <main className="col-12 col-lg-9 col-xl-10 configuracao-main">
          {!perfil ? (
            <div className="configuracao-estado" role={erro ? 'alert' : 'status'}>
              {erro || 'Carregando configurações...'}
            </div>
          ) : (
            <div className="configuracao-conteudo">
              <header className="configuracao-cabecalho">
                <span className="configuracao-etiqueta">PERSONALIZAÇÃO</span>
                <h1>Configurações</h1>
                <p>Cuide das informações e da identidade do seu perfil.</p>
              </header>

              <div className="configuracao-grade">
                <section className="configuracao-cartao configuracao-foto">
                  <div className="configuracao-titulo-cartao">
                    <span className="configuracao-icone">
                      <i className="bi bi-person-badge" aria-hidden="true" />
                    </span>
                    <div>
                      <h2>Foto de perfil</h2>
                      <p>Essa imagem aparece no seu perfil e nas publicações.</p>
                    </div>
                  </div>

                  <div className="configuracao-previa">
                    <img src={perfil.fotoPerfil} alt={`Foto de perfil de ${perfil.nome}`} />
                    <div>
                      <strong>{perfil.nome}</strong>
                      <span>@{perfil.usuario}</span>
                    </div>
                  </div>

                  <input
                    id="foto-perfil"
                    className="configuracao-input-arquivo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={enviandoFoto}
                    onChange={alterarFoto}
                  />
                  <label
                    className={`configuracao-botao-foto${enviandoFoto ? ' enviando' : ''}`}
                    htmlFor="foto-perfil"
                  >
                    <i className={`bi ${enviandoFoto ? 'bi-arrow-repeat' : 'bi-camera'}`} aria-hidden="true" />
                    {enviandoFoto ? 'Enviando...' : 'Escolher foto'}
                  </label>
                  <p className="configuracao-ajuda">JPEG, PNG ou WEBP · Até 5 MB</p>

                  {erroFoto && <p className="configuracao-mensagem erro" role="alert">{erroFoto}</p>}
                  {mensagemFoto && <p className="configuracao-mensagem sucesso" role="status">{mensagemFoto}</p>}
                </section>

                <section className="configuracao-cartao configuracao-formulario">
                  <div className="configuracao-titulo-cartao">
                    <span className="configuracao-icone">
                      <i className="bi bi-sliders" aria-hidden="true" />
                    </span>
                    <div>
                      <h2>Informações pessoais</h2>
                      <p>Esses dados ajudam as pessoas a conhecer você.</p>
                    </div>
                  </div>

                  <form onSubmit={salvarPerfil}>
                    <div className="configuracao-campo">
                      <label htmlFor="nome">Nome</label>
                      <input
                        id="nome"
                        name="nome"
                        className="form-control"
                        value={perfil.nome ?? ''}
                        onChange={(event) => alterarCampo('nome', event.target.value)}
                      />
                    </div>

                    <div className="configuracao-campo">
                      <label htmlFor="bio">Bio</label>
                      <textarea
                        id="bio"
                        name="bio"
                        className="form-control"
                        rows="3"
                        value={perfil.bio ?? ''}
                        onChange={(event) => alterarCampo('bio', event.target.value)}
                      />
                    </div>

                    <div className="configuracao-campo">
                      <label htmlFor="localidade">Localidade</label>
                      <input
                        id="localidade"
                        name="localidade"
                        className="form-control"
                        value={perfil.localidade ?? ''}
                        onChange={(event) => alterarCampo('localidade', event.target.value)}
                      />
                    </div>

                    {erro && <div className="configuracao-mensagem erro" role="alert">{erro}</div>}
                    {mensagem && <div className="configuracao-mensagem sucesso" role="status">{mensagem}</div>}

                    <button className="configuracao-botao-salvar" type="submit" disabled={salvando}>
                      <i className="bi bi-check2" aria-hidden="true" />
                      {salvando ? 'Salvando...' : 'Salvar alterações'}
                    </button>
                  </form>
                </section>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default Configuracao
