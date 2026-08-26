import {
  FiActivity,
  FiChevronRight,
  FiClock,
  FiGrid,
  FiPackage,
  FiShield,
  FiTruck,
  FiUsers,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { getInitials } from '../utils/user-display'

function DashboardPage() {
  const { session } = useAuth()
  const user = session?.user

  if (!user || !session) {
    return null
  }

  const primaryRole = user.roles[0] ?? 'Usuário'
  const accessExpiresAt = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(session.accessTokenExpiresAtUtc))
  const canReadUsers = user.permissions.includes('users.read')

  return (
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
              <span className="panel__eyebrow">Evolução contínua</span>
              <h2>Próximas entregas do WMS</h2>
            </div>
            <span className="phase-pill">Fundação operacional</span>
          </header>

          <div className="roadmap-list">
            {canReadUsers && (
              <Link className="roadmap-item roadmap-item--active" to="/users">
                <span className="roadmap-marker"><FiUsers /></span>
                <div>
                  <strong>Administração de usuários</strong>
                  <p>Cadastro, perfis e controle de acesso já disponíveis.</p>
                </div>
                <span className="roadmap-state">Acessar</span>
              </Link>
            )}
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
        </aside>
      </section>
    </main>
  )
}

export default DashboardPage
