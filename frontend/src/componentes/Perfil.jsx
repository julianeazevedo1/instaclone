import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import API_URL from '../api'
import './Perfil.css'

const TAMANHO_MAXIMO_CAPA = 5 * 1024 * 1024
const TIPOS_CAPA_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp']

function Perfil() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [usuarioAutenticadoId, setUsuarioAutenticadoId] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [erro, setErro] = useState('')
  const [erroSessao, setErroSessao] = useState('')
  const [erroCapa, setErroCapa] = useState('')
  const [enviandoCapa, setEnviandoCapa] = useState(false)
  const [excluindoCapa, setExcluindoCapa] = useState(false)
  const ehDono = usuarioAutenticadoId !== null && usuarioAutenticadoId === Number(id)

  useEffect(() => {
    async function carregarPerfil() {
      try {
        if (!id) {
          throw new Error('ID do perfil não informado')
        }

        const resposta = await fetch(`${API_URL}/perfis/${id}`)
        if (!resposta.ok) {
          throw new Error('Perfil não encontrado')
        }

        setPerfil(await resposta.json())
      } catch (erroCarregamento) {
        setErro(erroCarregamento.message)
      }
    }

    carregarPerfil()
  }, [id])

  useEffect(() => {
    let ativo = true
    const token = sessionStorage.getItem('instaclone_token')

    async function carregarSessao() {
      try {
        const resposta = await fetch(`${API_URL}/sessao`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const dados = await resposta.json()

        if (!resposta.ok) {
          if (resposta.status === 401) {
            sessionStorage.removeItem('instaclone_usuario_id')
            sessionStorage.removeItem('instaclone_token')
            return
          }
          throw new Error(dados.mensagem || 'Não foi possível confirmar sua sessão.')
        }

        if (ativo) setUsuarioAutenticadoId(Number(dados.id))
      } catch (erroCarregamento) {
        if (ativo) setErroSessao(erroCarregamento.message || 'Não foi possível confirmar sua sessão.')
      }
    }

    if (token) carregarSessao()

    return () => {
      ativo = false
    }
  }, [])

  async function enviarFotoCapa(event) {
    const campoFoto = event.currentTarget
    const arquivo = campoFoto.files?.[0]
    if (!arquivo) return

    setErroCapa('')

    if (!TIPOS_CAPA_PERMITIDOS.includes(arquivo.type)) {
      setErroCapa('Escolha uma imagem JPEG, PNG ou WEBP.')
      campoFoto.value = ''
      return
    }

    if (arquivo.size > TAMANHO_MAXIMO_CAPA) {
      setErroCapa('A foto de capa deve ter no máximo 5 MB.')
      campoFoto.value = ''
      return
    }

    const dados = new FormData()
    dados.append('foto', arquivo)
    setEnviandoCapa(true)

    try {
      const resposta = await fetch(`${API_URL}/perfis/${id}/capa`, {
        method: 'POST',
        body: dados,
      })
      const resultado = await resposta.json()

      if (!resposta.ok) {
        throw new Error(resultado.mensagem || 'Não foi possível atualizar a foto de capa.')
      }

      setPerfil((atual) => ({ ...atual, fotoCapa: resultado.fotoCapa, temFotoCapa: true }))
    } catch (erroEnvio) {
      setErroCapa(erroEnvio.message)
    } finally {
      setEnviandoCapa(false)
      campoFoto.value = ''
    }
  }

  async function excluirFotoCapa() {
    if (!ehDono) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }

    if (!perfil.temFotoCapa || !window.confirm('Excluir a foto de capa? Esta ação não pode ser desfeita.')) {
      return
    }

    setErroCapa('')
    setExcluindoCapa(true)

    try {
      const resposta = await fetch(`${API_URL}/perfis/${id}/capa`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${sessionStorage.getItem('instaclone_token')}` },
      })
      const resultado = await resposta.json()
      if (!resposta.ok) {
        throw new Error(resultado.mensagem || 'Não foi possível excluir a foto de capa.')
      }

      setPerfil((atual) => ({
        ...atual,
        fotoCapa: resultado.fotoCapa,
        temFotoCapa: resultado.temFotoCapa,
      }))
    } catch (erroExclusao) {
      setErroCapa(erroExclusao.message)
    } finally {
      setExcluindoCapa(false)
    }
  }

  if (erro) return <div className="alert alert-danger" role="alert">{erro}</div>
  if (!perfil) return <p className="text-secondary" role="status">Carregando perfil...</p>

  return (
    <section
      className="perfil-card"
      aria-label={`${ehDono ? 'Seu perfil' : 'Perfil'} de ${perfil.nome}`}
      aria-busy={enviandoCapa || excluindoCapa}
    >
      {erroSessao && <p className="perfil-sessao-erro" role="status">{erroSessao}</p>}
      <div className={`perfil-capa${perfil.fotoCapa ? ' com-foto' : ' vazia'}`}>
        {perfil.fotoCapa && <img className="perfil-capa-imagem" src={perfil.fotoCapa} alt="" />}
        <span className="perfil-capa-sombra" aria-hidden="true" />
        {perfil.fotoCapa ? (
          <span className="perfil-capa-selo" aria-hidden="true">INSTACLONE</span>
        ) : (
          <span className="perfil-capa-placeholder" aria-hidden="true">
            <i className="bi bi-image" />
            <span>Área para foto de capa</span>
          </span>
        )}
        {ehDono && (
          <>
            <input
              id="foto-capa"
              className="perfil-capa-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={enviandoCapa}
              onChange={enviarFotoCapa}
            />
            <div className="perfil-capa-acoes">
              {perfil.temFotoCapa && (
                <button
                  className="perfil-capa-excluir"
                  type="button"
                  disabled={enviandoCapa || excluindoCapa}
                  title="Excluir foto de capa"
                  onClick={excluirFotoCapa}
                >
                  <i className={`bi ${excluindoCapa ? 'bi-arrow-repeat' : 'bi-trash3'}`} aria-hidden="true" />
                  <span>{excluindoCapa ? 'Excluindo...' : 'Excluir capa'}</span>
                </button>
              )}
              <label
                className={`perfil-capa-botao${enviandoCapa ? ' enviando' : ''}`}
                htmlFor="foto-capa"
              >
                <i className={`bi ${enviandoCapa ? 'bi-arrow-repeat' : 'bi-camera'}`} aria-hidden="true" />
                <span>
                  {enviandoCapa
                    ? 'Enviando...'
                    : perfil.fotoCapa
                      ? 'Alterar foto de capa'
                      : 'Adicionar foto de capa'}
                </span>
              </label>
            </div>
          </>
        )}
      </div>
      {erroCapa && <p className="perfil-capa-erro" role="alert">{erroCapa}</p>}

      <div className="perfil-corpo">
        <div className="perfil-identidade">
          <img
            src={perfil.fotoPerfil}
            alt={`Foto de perfil de ${perfil.nome}`}
            className="perfil-avatar"
          />

          <div className="perfil-titulos">
            <h1>
              {perfil.nome}
              {ehDono && (
                <span className="perfil-selo-atual">
                  <i className="bi bi-person-check-fill" aria-hidden="true" />
                  Você
                </span>
              )}
            </h1>
            <p className="perfil-usuario">@{perfil.usuario}</p>
          </div>

          {ehDono && (
            <div className="perfil-acoes">
              <Link className="perfil-botao perfil-botao-secundario" to={`/configuracao/${id}`}>
                <i className="bi bi-pencil" aria-hidden="true" />
                <span>Editar perfil</span>
              </Link>
              <Link className="perfil-botao perfil-botao-principal" to={`/publicar/${id}`}>
                <i className="bi bi-plus-lg" aria-hidden="true" />
                <span>Publicar foto</span>
              </Link>
            </div>
          )}
        </div>

        {(perfil.bio || perfil.localidade) && (
          <div className="perfil-descricao">
            {perfil.bio && <p>{perfil.bio}</p>}
            {perfil.localidade && (
              <span className="perfil-localidade">
                <i className="bi bi-geo-alt" aria-hidden="true" />
                {perfil.localidade}
              </span>
            )}
          </div>
        )}

        <ul className="perfil-estatisticas" aria-label="Estatísticas do perfil">
          <li>
            <strong>{perfil.posts}</strong>
            <span>Publicações</span>
          </li>
          <li>
            <strong>{perfil.seguidores}</strong>
            <span>{perfil.seguidores === 1 ? 'Seguidor' : 'Seguidores'}</span>
          </li>
          <li>
            <strong>{perfil.seguindo}</strong>
            <span>Seguindo</span>
          </li>
        </ul>
      </div>
    </section>
  )
}

export default Perfil
