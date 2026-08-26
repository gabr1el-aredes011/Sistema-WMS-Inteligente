import { useEffect, useState, type FormEvent } from 'react'
import {
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiFilter,
  FiMoreHorizontal,
  FiPlus,
  FiSearch,
  FiShield,
  FiSlash,
  FiUserCheck,
  FiUsers,
} from 'react-icons/fi'
import { useAuth } from '../auth/useAuth'
import UserFormModal, { type UserFormValue } from '../components/UserFormModal'
import { ApiError } from '../services/auth-api'
import { usersApi } from '../services/users-api'
import type { PagedUsers, RoleSummary, UserSummary } from '../types/users'
import { getInitials } from '../utils/user-display'
import '../styles/users.css'

type StatusFilter = 'all' | 'active' | 'inactive'

const emptyPage: PagedUsers = {
  items: [],
  page: 1,
  pageSize: 20,
  totalCount: 0,
  totalPages: 0,
}

function formatDate(value: string | null) {
  if (!value) return 'Nunca acessou'

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function friendlyRole(role: string) {
  const labels: Record<string, string> = {
    Administrator: 'Administrador',
    WarehouseManager: 'Gestor de armazém',
    Buyer: 'Comprador',
    StockKeeper: 'Estoquista',
    Picker: 'Separador',
    Auditor: 'Auditor',
  }
  return labels[role] ?? role
}

function UsersPage() {
  const { session } = useAuth()
  const token = session?.accessToken ?? ''
  const permissions = session?.user.permissions ?? []
  const [users, setUsers] = useState<PagedUsers>(emptyPage)
  const [roles, setRoles] = useState<RoleSummary[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserSummary | null | undefined>(undefined)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [statusUser, setStatusUser] = useState<UserSummary | null>(null)
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [notice, setNotice] = useState('')

  const canUpdate = permissions.includes('users.update')
  const canManageRoles = permissions.includes('users.roles.manage')
  const canCreate = permissions.includes('users.create') && canManageRoles
  const canDisable = permissions.includes('users.disable')
  const canReadRoles = permissions.includes('roles.read')

  useEffect(() => {
    if (!canReadRoles) return

    let cancelled = false

    usersApi.roles(token)
      .then((result) => {
        if (!cancelled) setRoles(result)
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof ApiError ? error.message : 'Não foi possível carregar os perfis.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [token, canReadRoles])

  useEffect(() => {
    let cancelled = false

    usersApi.list(token, {
      search,
      isActive: status === 'all' ? undefined : status === 'active',
      page,
      pageSize: 20,
    })
      .then((result) => {
        if (!cancelled) {
          setUsers(result)
          setLoadError('')
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof ApiError ? error.message : 'Não foi possível carregar os usuários.')
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token, search, status, page, refreshVersion])

  function reload(message?: string) {
    setIsLoading(true)
    setRefreshVersion((current) => current + 1)
    if (message) {
      setNotice(message)
      window.setTimeout(() => setNotice(''), 3500)
    }
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setPage(1)
    setSearch(searchInput.trim())
  }

  function changeStatusFilter(nextStatus: StatusFilter) {
    setIsLoading(true)
    setPage(1)
    setStatus(nextStatus)
  }

  async function handleSaveUser(value: UserFormValue) {
    setIsSaving(true)
    setFormError('')

    try {
      if (selectedUser === null) {
        await usersApi.create(token, value)
        setSelectedUser(undefined)
        reload('Usuário criado com sucesso.')
        return
      }

      if (selectedUser) {
        if (canUpdate) {
          await usersApi.update(token, selectedUser.id, {
            fullName: value.fullName,
            email: value.email,
          })
        }

        const rolesChanged = [...selectedUser.roles].sort().join('|') !==
          [...value.roles].sort().join('|')

        if (canManageRoles && rolesChanged) {
          await usersApi.setRoles(token, selectedUser.id, value.roles)
        }

        setSelectedUser(undefined)
        reload('Usuário atualizado com sucesso.')
      }
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Não foi possível salvar o usuário.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleStatusChange() {
    if (!statusUser) return

    setIsChangingStatus(true)

    try {
      await usersApi.setStatus(token, statusUser.id, !statusUser.isActive)
      const message = statusUser.isActive
        ? 'Usuário desativado com segurança.'
        : 'Usuário reativado com sucesso.'
      setStatusUser(null)
      reload(message)
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : 'Não foi possível alterar o status.')
      setStatusUser(null)
    } finally {
      setIsChangingStatus(false)
    }
  }

  function goToPage(nextPage: number) {
    setIsLoading(true)
    setPage(nextPage)
  }

  const visibleActiveUsers = users.items.filter((user) => user.isActive).length

  return (
    <main className="dashboard-content users-page">
      <header className="users-heading">
        <div>
          <span className="eyebrow eyebrow--blue">Identidade e acesso</span>
          <h1>Administração de usuários</h1>
          <p>Gerencie pessoas, perfis e acessos da operação em um só lugar.</p>
        </div>
        {canCreate && (
          <button className="button button--primary" type="button" onClick={() => {
            setFormError('')
            setSelectedUser(null)
          }}>
            <FiPlus /> Novo usuário
          </button>
        )}
      </header>

      <section className="users-metrics" aria-label="Resumo de usuários">
        <article>
          <span><FiUsers /></span>
          <div><small>Total encontrado</small><strong>{users.totalCount}</strong></div>
        </article>
        <article>
          <span><FiUserCheck /></span>
          <div><small>Ativos nesta página</small><strong>{visibleActiveUsers}</strong></div>
        </article>
        <article>
          <span><FiShield /></span>
          <div><small>Perfis disponíveis</small><strong>{roles.length}</strong></div>
        </article>
      </section>

      <section className="users-panel">
        <header className="users-toolbar">
          <form className="users-search" onSubmit={handleSearch}>
            <FiSearch />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Buscar por nome ou e-mail"
              aria-label="Buscar usuários"
            />
            <button type="submit">Buscar</button>
          </form>

          <div className="status-filter" aria-label="Filtrar por status">
            <FiFilter />
            {(['all', 'active', 'inactive'] as StatusFilter[]).map((item) => (
              <button
                key={item}
                className={status === item ? 'status-filter__active' : ''}
                type="button"
                onClick={() => changeStatusFilter(item)}
              >
                {item === 'all' ? 'Todos' : item === 'active' ? 'Ativos' : 'Inativos'}
              </button>
            ))}
          </div>
        </header>

        {loadError && <div className="users-alert" role="alert">{loadError}</div>}

        <div className="users-table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Perfil</th>
                <th>Status</th>
                <th>Último acesso</th>
                <th><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr className="skeleton-row" key={index}>
                    <td colSpan={5}><span /></td>
                  </tr>
                ))
              ) : users.items.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="users-empty">
                      <FiUsers />
                      <strong>Nenhum usuário encontrado</strong>
                      <span>Ajuste os filtros ou cadastre uma nova pessoa.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                users.items.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="table-user">
                        <span className="user-avatar">{getInitials(user.fullName)}</span>
                        <span><strong>{user.fullName}</strong><small>{user.email}</small></span>
                      </div>
                    </td>
                    <td>
                      <div className="table-roles">
                        {user.roles.slice(0, 2).map((role) => (
                          <span key={role}>{friendlyRole(role)}</span>
                        ))}
                        {user.roles.length > 2 && <small>+{user.roles.length - 2}</small>}
                      </div>
                    </td>
                    <td>
                      <span className={`user-status ${user.isActive ? 'user-status--active' : 'user-status--inactive'}`}>
                        <span /> {user.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td><span className="last-access">{formatDate(user.lastLoginAtUtc)}</span></td>
                    <td>
                      <div className="table-actions">
                        {(canUpdate || canManageRoles) && (
                          <button type="button" onClick={() => {
                            setFormError('')
                            setSelectedUser(user)
                          }} aria-label={`Editar ${user.fullName}`} title="Editar usuário">
                            <FiEdit2 />
                          </button>
                        )}
                        {canDisable && (
                          <button type="button" onClick={() => setStatusUser(user)} aria-label={`${user.isActive ? 'Desativar' : 'Reativar'} ${user.fullName}`} title={user.isActive ? 'Desativar' : 'Reativar'}>
                            {user.isActive ? <FiSlash /> : <FiCheckCircle />}
                          </button>
                        )}
                        {!canUpdate && !canManageRoles && !canDisable && <FiMoreHorizontal />}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="users-pagination">
          <span>
            Página {users.page} de {Math.max(users.totalPages, 1)} · {users.totalCount} registro(s)
          </span>
          <div>
            <button type="button" onClick={() => goToPage(page - 1)} disabled={page <= 1 || isLoading} aria-label="Página anterior">
              <FiChevronLeft />
            </button>
            <button type="button" onClick={() => goToPage(page + 1)} disabled={page >= users.totalPages || isLoading} aria-label="Próxima página">
              <FiChevronRight />
            </button>
          </div>
        </footer>
      </section>

      {selectedUser !== undefined && (
        <UserFormModal
          key={selectedUser?.id ?? 'new-user'}
          user={selectedUser}
          roles={roles}
          canEditIdentity={selectedUser === null ? canCreate : canUpdate}
          canEditRoles={selectedUser === null ? canCreate : canManageRoles}
          isSaving={isSaving}
          serverError={formError}
          onClose={() => setSelectedUser(undefined)}
          onSave={handleSaveUser}
        />
      )}

      {statusUser && (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="status-dialog-title">
            <span className={`confirm-dialog__icon ${statusUser.isActive ? 'confirm-dialog__icon--danger' : ''}`}>
              {statusUser.isActive ? <FiSlash /> : <FiCheckCircle />}
            </span>
            <h2 id="status-dialog-title">
              {statusUser.isActive ? 'Desativar usuário?' : 'Reativar usuário?'}
            </h2>
            <p>
              {statusUser.isActive
                ? `${statusUser.fullName} perderá o acesso e suas sessões serão encerradas.`
                : `${statusUser.fullName} poderá acessar o WMS novamente.`}
            </p>
            <div>
              <button className="button button--secondary" type="button" onClick={() => setStatusUser(null)} disabled={isChangingStatus}>Cancelar</button>
              <button className={`button ${statusUser.isActive ? 'button--danger' : 'button--primary'}`} type="button" onClick={handleStatusChange} disabled={isChangingStatus}>
                {isChangingStatus ? 'Processando...' : statusUser.isActive ? 'Desativar' : 'Reativar'}
              </button>
            </div>
          </section>
        </div>
      )}

      {notice && <div className="success-toast" role="status"><FiCheckCircle /> {notice}</div>}
    </main>
  )
}

export default UsersPage
