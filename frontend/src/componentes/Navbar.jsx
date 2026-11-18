import { Link, NavLink, useParams } from 'react-router-dom'
import logo from '../assets/instaclone-logo.svg'
import './Navbar.css'

function Navbar() {
    const { id } = useParams()
    const classeLink = ({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`

    return (
        <aside className="col-12 col-lg-3 col-xl-2 instaclone-sidebar">
            <div className="sidebar-inner">
                <Link
                    className="sidebar-brand"
                    to={`/feed/${id}`}
                    aria-label="Instaclone — ir para o feed"
                >
                    <img src={logo} alt="" aria-hidden="true" />
                    <span className="sidebar-brand-copy">
                        <strong>Instaclone</strong>
                        <small>Compartilhe momentos</small>
                    </span>
                </Link>

                <nav className="sidebar-navigation" aria-label="Navegação principal">
                    <p className="sidebar-section-title">MENU</p>
                    <ul className="sidebar-list">
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
                        <li className="sidebar-settings">
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
                        <li className="sidebar-mobile-publish">
                            <Link
                                className="sidebar-link"
                                to={`/publicar/${id}`}
                                aria-label="Nova publicação"
                                title="Nova publicação"
                            >
                                <i className="bi bi-plus-square" aria-hidden="true" />
                                <span>Nova publicação</span>
                            </Link>
                        </li>
                        <li className="sidebar-logout">
                            <Link className="sidebar-link" to="/login" aria-label="Sair" title="Sair">
                                <i className="bi bi-box-arrow-right" aria-hidden="true" />
                                <span>Sair</span>
                            </Link>
                        </li>
                    </ul>

                    <Link className="sidebar-publish" to={`/publicar/${id}`}>
                        <i className="bi bi-plus-lg" aria-hidden="true" />
                        <span>Nova publicação</span>
                    </Link>
                </nav>

                <div className="sidebar-footer">
                    <span className="sidebar-footer-dot" aria-hidden="true" />
                    <span>Seu espaço para boas histórias</span>
                </div>
            </div>
        </aside>
    )
}

export default Navbar
