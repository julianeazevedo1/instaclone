import { useEffect, useState } from 'react'
import { Link, NavLink, useParams } from 'react-router-dom'
import logo from '../assets/instaclone-logo.svg'
import API_URL from '../api'
import './Navbar.css'

function Navbar() {
    const { id } = useParams()
    const [usuarioAutenticado, setUsuarioAutenticado] = useState(null)
    const [erroUsuario, setErroUsuario] = useState('')
    const classeLink = ({ isActive }) => `jelly-nav-link${isActive ? ' ativo' : ''}`

    useEffect(() => {
        const token = sessionStorage.getItem('instaclone_token')
        if (!token) return undefined

        let ativo = true

        async function carregarUsuario() {
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
                    throw new Error(dados.mensagem || 'Não foi possível carregar sua conta.')
                }

                if (ativo) setUsuarioAutenticado(dados)
            } catch (erroCarregamento) {
                if (ativo) setErroUsuario(erroCarregamento.message)
            }
        }

        carregarUsuario()
        return () => {
            ativo = false
        }
    }, [])

    return (
        <header className="col-12 jelly-navbar">
            <div className="jelly-navbar-inner">
                <Link
                    className="jelly-brand"
                    to={`/feed/${id}`}
                    aria-label="Instaclone — ir para o feed"
                >
                    <img src={logo} alt="" aria-hidden="true" />
                    <span className="jelly-brand-copy">
                        <strong>Instaclone</strong>
                        <small>Compartilhe momentos</small>
                    </span>
                </Link>

                <nav className="jelly-navigation" aria-label="Navegação principal">
                    <ul className="jelly-nav-links">
                        <li>
                            <NavLink className={classeLink} to={`/feed/${id}`}>
                                <i className="bi bi-compass" aria-hidden="true" />
                                <span>Feed</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink className={classeLink} to={`/perfil/${id}`}>
                                <i className="bi bi-person" aria-hidden="true" />
                                <span>Perfil</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                className={classeLink}
                                to={`/configuracao/${id}`}
                                aria-label="Configurações"
                                title="Configurações"
                            >
                                <i className="bi bi-gear" aria-hidden="true" />
                                <span>Configurações</span>
                            </NavLink>
                        </li>
                    </ul>
                </nav>

                <div className="jelly-navbar-actions">
                    <Link className="jelly-publish-button" to={`/publicar/${id}`}>
                        <i className="bi bi-plus-lg" aria-hidden="true" />
                        <span className="jelly-publish-long">Nova publicação</span>
                        <span className="jelly-publish-short">Publicar</span>
                    </Link>
                    {usuarioAutenticado && (
                        <Link
                            className="jelly-current-user"
                            to={`/perfil/${usuarioAutenticado.id}`}
                            aria-label={`Perfil de ${usuarioAutenticado.nome}`}
                        >
                            {usuarioAutenticado.temFotoPerfil ? (
                                <img src={usuarioAutenticado.fotoPerfil} alt="" />
                            ) : (
                                <i className="bi bi-person-circle" aria-hidden="true" />
                            )}
                            <span>{usuarioAutenticado.nome}</span>
                            <small className="jelly-current-user-badge">Você</small>
                        </Link>
                    )}
                    {erroUsuario && <span className="jelly-user-error" role="status">{erroUsuario}</span>}
                    {usuarioAutenticado ? (
                        <Link
                            className="jelly-logout-button"
                            to="/login"
                            aria-label="Sair"
                            title="Sair"
                            onClick={() => {
                                sessionStorage.removeItem('instaclone_usuario_id')
                                sessionStorage.removeItem('instaclone_token')
                            }}
                        >
                            <i className="bi bi-box-arrow-right" aria-hidden="true" />
                        </Link>
                    ) : (
                        <Link className="jelly-login-button" to="/login">
                            <i className="bi bi-box-arrow-in-right" aria-hidden="true" />
                            <span>Entrar</span>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    )
}

export default Navbar
