import { useState } from 'react'
import {
  FiBell,
  FiBox,
  FiHelpCircle,
  FiHome,
  FiLogOut,
  FiMenu,
  FiPackage,
  FiSearch,
  FiSettings,
  FiTruck,
  FiUsers,
  FiX,
} from 'react-icons/fi'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import { useAuth } from '../auth/useAuth'
import { getInitials } from '../utils/user-display'
import '../styles/dashboard.css'

const navigation = [
  { label: 'Visão geral', icon: FiHome, path: '/dashboard' },
  {
    label: 'Estoque',
    icon: FiPackage,
    path: '/products',
    permission: 'products.read',
  },
  { label: 'Recebimentos', icon: FiBox },
  { label: 'Expedições', icon: FiTruck },
  {
    label: 'Usuários',
    icon: FiUsers,
    path: '/users',
    permission: 'users.read',
  },
]

export default function AppShell() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const user = session?.user

  if (!user) {
    return null
  }

  async function handleLogout() {
    await logout()
    navigate('/', { replace: true })
  }

  const primaryRole = user.roles[0] ?? 'Usuário'

  return (
    <div className="dashboard-shell">
      {menuOpen && (
        <button
          className="sidebar-backdrop"
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside className={`sidebar ${menuOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <img src={logo} alt="Altrion" />
          <button type="button" onClick={() => setMenuOpen(false)} aria-label="Fechar menu">
            <FiX />
          </button>
        </div>

        <div className="sidebar__workspace">
          <span>Workspace</span>
          <strong>Operação principal</strong>
          <small>Ambiente de desenvolvimento</small>
        </div>

        <nav className="sidebar__nav" aria-label="Navegação principal">
          <span className="nav-caption">Operação</span>
          {navigation.map(({ label, icon: Icon, path, permission }) => {
            if (permission && !user.permissions.includes(permission)) {
              return null
            }

            if (path) {
              return (
                <NavLink
                  key={label}
                  to={path}
                  className={({ isActive }) =>
                    isActive ? 'nav-item nav-item--active' : 'nav-item'
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon aria-hidden="true" />
                  <span>{label}</span>
                </NavLink>
              )
            }

            return (
              <button
                key={label}
                className="nav-item"
                type="button"
                disabled
                title="Disponível nas próximas etapas"
              >
                <Icon aria-hidden="true" />
                <span>{label}</span>
                <small>Em breve</small>
              </button>
            )
          })}
        </nav>

        <div className="sidebar__bottom">
          <button type="button"><FiHelpCircle /> Central de ajuda</button>
          <button type="button"><FiSettings /> Configurações</button>
          <button className="sidebar__logout" type="button" onClick={handleLogout}>
            <FiLogOut /> Encerrar sessão
          </button>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="topbar">
          <button
            className="menu-trigger"
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
          >
            <FiMenu />
          </button>

          <div className="topbar__search">
            <FiSearch aria-hidden="true" />
            <input type="search" placeholder="Buscar no WMS" aria-label="Buscar no WMS" />
            <kbd>⌘ K</kbd>
          </div>

          <div className="topbar__actions">
            <button className="notification-button" type="button" aria-label="Notificações">
              <FiBell />
              <span />
            </button>
            <div className="user-summary">
              <span className="user-avatar">{getInitials(user.fullName)}</span>
              <span>
                <strong>{user.fullName}</strong>
                <small>{primaryRole}</small>
              </span>
            </div>
          </div>
        </header>

        <Outlet />
      </div>
    </div>
  )
}
