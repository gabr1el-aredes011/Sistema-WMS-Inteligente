import { useState, type FormEvent } from 'react'
import { FiCheck, FiEye, FiEyeOff, FiShield, FiUser, FiX } from 'react-icons/fi'
import type { RoleSummary, UserSummary } from '../types/users'

export interface UserFormValue {
  fullName: string
  email: string
  password: string
  roles: string[]
}

interface UserFormModalProps {
  user: UserSummary | null
  roles: RoleSummary[]
  canEditIdentity: boolean
  canEditRoles: boolean
  isSaving: boolean
  serverError: string
  onClose: () => void
  onSave: (value: UserFormValue) => Promise<void>
}

function roleLabel(roleName: string) {
  const labels: Record<string, string> = {
    Administrator: 'Administrador',
    WarehouseManager: 'Gestor de armazém',
    Buyer: 'Comprador',
    StockKeeper: 'Estoquista',
    Picker: 'Separador',
    Auditor: 'Auditor',
  }

  return labels[roleName] ?? roleName
}

export default function UserFormModal({
  user,
  roles,
  canEditIdentity,
  canEditRoles,
  isSaving,
  serverError,
  onClose,
  onSave,
}: UserFormModalProps) {
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user?.roles ?? [])
  const [showPassword, setShowPassword] = useState(false)
  const [validationError, setValidationError] = useState('')
  const isCreating = user === null

  function toggleRole(roleName: string) {
    setSelectedRoles((current) =>
      current.includes(roleName)
        ? current.filter((role) => role !== roleName)
        : [...current, roleName],
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setValidationError('')

    if (!fullName.trim() || !email.trim()) {
      setValidationError('Preencha o nome completo e o e-mail.')
      return
    }

    if (isCreating && password.length < 12) {
      setValidationError('A senha inicial precisa ter pelo menos 12 caracteres.')
      return
    }

    if (selectedRoles.length === 0) {
      setValidationError('Selecione ao menos um perfil de acesso.')
      return
    }

    await onSave({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      roles: selectedRoles,
    })
  }

  const formError = validationError || serverError

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="user-modal" role="dialog" aria-modal="true" aria-labelledby="user-modal-title">
        <header className="user-modal__header">
          <span className="user-modal__icon"><FiUser /></span>
          <div>
            <span className="panel__eyebrow">Controle de acesso</span>
            <h2 id="user-modal-title">
              {isCreating ? 'Cadastrar novo usuário' : 'Editar usuário'}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" disabled={isSaving}>
            <FiX />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="user-modal__body">
            <div className="modal-section-heading">
              <strong>Dados do usuário</strong>
              <span>Informações utilizadas para identificação e acesso.</span>
            </div>

            <div className="form-grid">
              <label className="modal-field modal-field--full">
                <span>Nome completo</span>
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Ex.: Mariana Santos"
                  maxLength={160}
                  disabled={!canEditIdentity || isSaving}
                  autoFocus
                />
              </label>

              <label className="modal-field modal-field--full">
                <span>E-mail corporativo</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nome@empresa.com.br"
                  maxLength={256}
                  disabled={!canEditIdentity || isSaving}
                />
              </label>

              {isCreating && (
                <label className="modal-field modal-field--full">
                  <span>Senha inicial</span>
                  <span className="modal-password">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Mínimo de 12 caracteres"
                      maxLength={200}
                      disabled={isSaving}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </span>
                  <small>Use maiúscula, minúscula, número e símbolo.</small>
                </label>
              )}
            </div>

            <div className="modal-section-heading modal-section-heading--roles">
              <strong>Perfis de acesso</strong>
              <span>Defina as responsabilidades deste usuário no WMS.</span>
            </div>

            <div className="role-options">
              {roles.map((role) => {
                const selected = selectedRoles.includes(role.name)
                return (
                  <button
                    key={role.name}
                    className={`role-option ${selected ? 'role-option--selected' : ''}`}
                    type="button"
                    onClick={() => toggleRole(role.name)}
                    disabled={!canEditRoles || isSaving}
                    aria-pressed={selected}
                  >
                    <span className="role-option__check">
                      {selected ? <FiCheck /> : <FiShield />}
                    </span>
                    <span>
                      <strong>{roleLabel(role.name)}</strong>
                      <small>{role.description ?? `${role.permissionCount} permissões`}</small>
                    </span>
                  </button>
                )
              })}
            </div>

            {formError && <div className="modal-error" role="alert">{formError}</div>}
          </div>

          <footer className="user-modal__footer">
            <button className="button button--secondary" type="button" onClick={onClose} disabled={isSaving}>
              Cancelar
            </button>
            <button className="button button--primary" type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando...' : isCreating ? 'Criar usuário' : 'Salvar alterações'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
