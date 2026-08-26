import { useState } from 'react'
import {
  FiActivity,
  FiBell,
  FiBox,
  FiChevronRight,
  FiClock,
  FiGrid,
  FiHelpCircle,
  FiHome,
  FiLogOut,
  FiMenu,
  FiPackage,
  FiSearch,
  FiSettings,
  FiShield,
  FiTruck,
  FiUsers,
  FiX,
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import { useAuth } from '../auth/useAuth'
import '../styles/dashboard.css'

const navigation = [
  { label: 'Visão geral', icon: FiHome, active: true },
  { label: 'Estoque', icon: FiPackage },
  { label: 'Recebimentos', icon: FiBox },
  { label: 'Expedições', icon: FiTruck },
  { label: 'Usuários', icon: FiUsers },
]

function getInitials(fullName: string) {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function DashboardPage() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const user = session?.user

  if (!user || !session) {
    return null
  }

  async function handleLogout() {
    await logout()
    navigate('/', { replace: true })
  }

  const primaryRole = user.roles[0] ?? 'Usuário'
  const accessExpiresAt = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(session.accessTokenExpiresAtUtc))

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
          {navigation.map(({ label, icon: Icon, active }) => (
            <button
              key={label}
              className={active ? 'nav-item nav-item--active' : 'nav-item'}
              type="button"
              disabled={!active}
              title={!active ? 'Disponível nas próximas etapas' : undefined}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
              {!active && <small>Em breve</small>}
            </button>
          ))}
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

        <main className="dashboard-content">
          <header className="dashboard-heading">
            <div>
              <span className="eyebrow eyebrow--blue">Central operacional</span>
              <h1>Olá, {user.fullName.split(' ')[0]}.</h1>
              <p>Sua sessão foi autenticada com sucesso. O ambiente está pronto para operar.</p>
            </div>
            <div className="live-status"><span /> Sistema operacional</div>
          </header>

          <section className="status-grid" aria-label="Resumo do acesso">
            <article className="status-card status-card--accent">
              <span className="status-card__icon"><FiActivity /></span>
              <div>
                <small>Status da API</small>
                <strong>Conectada</strong>
                <span className="positive-label">Autenticação validada</span>
              </div>
            </article>
            <article className="status-card">
              <span className="status-card__icon"><FiShield /></span>
              <div>
                <small>Perfil de acesso</small>
                <strong>{primaryRole}</strong>
                <span>{user.roles.length} perfil(is) vinculado(s)</span>
              </div>
            </article>
            <article className="status-card">
              <span className="status-card__icon"><FiGrid /></span>
              <div>
                <small>Permissões</small>
                <strong>{user.permissions.length}</strong>
                <span>Recursos autorizados</span>
              </div>
            </article>
            <article className="status-card">
              <span className="status-card__icon"><FiClock /></span>
              <div>
                <small>Sessão atual</small>
                <strong>{accessExpiresAt}</strong>
                <span>Expiração do token de acesso</span>
              </div>
            </article>
          </section>

          <section className="dashboard-panels">
            <article className="panel next-steps-panel">
              <header className="panel__header">
                <div>
                  <span className="panel__eyebrow">Próximas entregas</span>
                  <h2>Evolução do WMS</h2>
                </div>
                <span className="phase-pill">Fase de fundação</span>
              </header>

              <div className="roadmap-list">
                <div className="roadmap-item roadmap-item--active">
                  <span className="roadmap-marker"><FiUsers /></span>
                  <div>
                    <strong>Administração de usuários</strong>
                    <p>Cadastro, papéis e permissões pelo painel.</p>
                  </div>
                  <span className="roadmap-state">Próxima</span>
                </div>
                <div className="roadmap-item">
                  <span className="roadmap-marker"><FiPackage /></span>
                  <div>
                    <strong>Catálogo e estoque</strong>
                    <p>Produtos, endereços e saldos rastreáveis.</p>
                  </div>
                  <FiChevronRight aria-hidden="true" />
                </div>
                <div className="roadmap-item">
                  <span className="roadmap-marker"><FiTruck /></span>
                  <div>
                    <strong>Fluxos logísticos</strong>
                    <p>Recebimento, movimentação e expedição.</p>
                  </div>
                  <FiChevronRight aria-hidden="true" />
                </div>
              </div>
            </article>

            <aside className="panel access-panel">
              <header className="panel__header">
                <div>
                  <span className="panel__eyebrow">Acesso atual</span>
                  <h2>Seu perfil</h2>
                </div>
              </header>

              <div className="profile-card">
                <span className="user-avatar user-avatar--large">{getInitials(user.fullName)}</span>
                <strong>{user.fullName}</strong>
                <span>{user.email}</span>
              </div>

              <div className="role-list">
                {user.roles.length > 0 ? (
                  user.roles.map((role) => <span key={role}><FiShield /> {role}</span>)
                ) : (
                  <span>Nenhum perfil associado</span>
                )}
              </div>

              <button className="secondary-action" type="button" onClick={handleLogout}>
                <FiLogOut /> Sair com segurança
              </button>
            </aside>
          </section>
        </main>
      </div>
    </div>
  )
}

export default DashboardPage
