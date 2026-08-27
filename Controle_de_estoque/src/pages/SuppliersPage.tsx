import { useEffect, useState, type FormEvent } from 'react'
import { FiBriefcase, FiCheckCircle, FiChevronLeft, FiChevronRight, FiEdit2, FiFilter, FiMail, FiPlus, FiSearch, FiSlash, FiTruck } from 'react-icons/fi'
import { useAuth } from '../auth/useAuth'
import SupplierFormModal from '../components/SupplierFormModal'
import { ApiError } from '../services/auth-api'
import { suppliersApi } from '../services/suppliers-api'
import type { PagedSuppliers, Supplier, SupplierInput } from '../types/suppliers'
import '../styles/users.css'
import '../styles/suppliers.css'

type StatusFilter = 'all' | 'active' | 'inactive'

const emptyPage: PagedSuppliers = { items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0 }

function formatTaxId(value: string) {
  return value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

export default function SuppliersPage() {
  const { session } = useAuth()
  const token = session?.accessToken ?? ''
  const permissions = session?.user.permissions ?? []
  const canManage = permissions.includes('suppliers.manage')
  const [suppliers, setSuppliers] = useState<PagedSuppliers>(emptyPage)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null | undefined>(undefined)
  const [statusSupplier, setStatusSupplier] = useState<Supplier | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let cancelled = false
    suppliersApi.list(token, {
      search,
      isActive: status === 'all' ? undefined : status === 'active',
      page,
      pageSize: 20,
    }).then((result) => {
      if (!cancelled) { setSuppliers(result); setLoadError('') }
    }).catch((error: unknown) => {
      if (!cancelled) setLoadError(error instanceof ApiError ? error.message : 'Não foi possível carregar os fornecedores.')
    }).finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [token, search, status, page, refreshVersion])

  function reload(message: string) {
    setIsLoading(true)
    setRefreshVersion((current) => current + 1)
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3500)
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setPage(1)
    setSearch(searchInput.trim())
  }

  async function saveSupplier(value: SupplierInput) {
    setIsSaving(true)
    setFormError('')
    try {
      if (selectedSupplier === null) await suppliersApi.create(token, value)
      else if (selectedSupplier) await suppliersApi.update(token, selectedSupplier.id, value)
      const message = selectedSupplier === null ? 'Fornecedor cadastrado com sucesso.' : 'Fornecedor atualizado com sucesso.'
      setSelectedSupplier(undefined)
      reload(message)
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Não foi possível salvar o fornecedor.')
    } finally {
      setIsSaving(false)
    }
  }

  async function changeStatus() {
    if (!statusSupplier) return
    try {
      await suppliersApi.setStatus(token, statusSupplier.id, !statusSupplier.isActive)
      const message = statusSupplier.isActive ? 'Fornecedor inativado.' : 'Fornecedor reativado.'
      setStatusSupplier(null)
      reload(message)
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : 'Não foi possível alterar o fornecedor.')
      setStatusSupplier(null)
    }
  }

  const activeOnPage = suppliers.items.filter((supplier) => supplier.isActive).length
  const withEmail = suppliers.items.filter((supplier) => supplier.email).length

  return (
    <main className="dashboard-content users-page suppliers-page">
      <header className="users-heading"><div><span className="eyebrow eyebrow--blue">Compras e suprimentos</span><h1>Fornecedores</h1><p>Centralize parceiros, contatos e documentos para os próximos recebimentos.</p></div>{canManage && <button className="button button--primary" type="button" onClick={() => { setFormError(''); setSelectedSupplier(null) }}><FiPlus /> Novo fornecedor</button>}</header>

      <section className="users-metrics" aria-label="Resumo de fornecedores">
        <article><span><FiBriefcase /></span><div><small>Total encontrado</small><strong>{suppliers.totalCount}</strong></div></article>
        <article><span><FiTruck /></span><div><small>Ativos nesta página</small><strong>{activeOnPage}</strong></div></article>
        <article><span><FiMail /></span><div><small>Com e-mail cadastrado</small><strong>{withEmail}</strong></div></article>
      </section>

      <section className="users-panel">
        <header className="users-toolbar"><form className="users-search" onSubmit={handleSearch}><FiSearch /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Buscar por razão social, nome fantasia ou CNPJ" /><button type="submit">Buscar</button></form><div className="status-filter"><FiFilter />{(['all', 'active', 'inactive'] as StatusFilter[]).map((item) => <button key={item} className={status === item ? 'status-filter__active' : ''} type="button" onClick={() => { setIsLoading(true); setPage(1); setStatus(item) }}>{item === 'all' ? 'Todos' : item === 'active' ? 'Ativos' : 'Inativos'}</button>)}</div></header>
        {loadError && <div className="users-alert" role="alert">{loadError}</div>}
        <div className="users-table-wrap"><table className="users-table suppliers-table"><thead><tr><th>Fornecedor</th><th>CNPJ</th><th>Contato</th><th>Status</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>
          {isLoading ? Array.from({ length: 4 }).map((_, index) => <tr className="skeleton-row" key={index}><td colSpan={5}><span /></td></tr>) : suppliers.items.length === 0 ? <tr><td colSpan={5}><div className="users-empty"><FiBriefcase /><strong>Nenhum fornecedor encontrado</strong><span>Cadastre o primeiro parceiro da cadeia de suprimentos.</span></div></td></tr> : suppliers.items.map((supplier) => <tr key={supplier.id}>
            <td><div className="supplier-identity"><span><FiBriefcase /></span><span><strong>{supplier.legalName}</strong><small>{supplier.tradeName ?? 'Sem nome fantasia'}</small></span></div></td>
            <td><span className="supplier-tax-id">{formatTaxId(supplier.taxId)}</span></td>
            <td><div className="supplier-contact"><strong>{supplier.email ?? 'E-mail não informado'}</strong><small>{supplier.phone ?? 'Telefone não informado'}</small></div></td>
            <td><span className={`user-status ${supplier.isActive ? 'user-status--active' : 'user-status--inactive'}`}><span />{supplier.isActive ? 'Ativo' : 'Inativo'}</span></td>
            <td><div className="table-actions">{canManage && <><button type="button" title="Editar fornecedor" onClick={() => { setFormError(''); setSelectedSupplier(supplier) }}><FiEdit2 /></button><button type="button" title={supplier.isActive ? 'Inativar' : 'Reativar'} onClick={() => setStatusSupplier(supplier)}>{supplier.isActive ? <FiSlash /> : <FiCheckCircle />}</button></>}</div></td>
          </tr>)}
        </tbody></table></div>
        <footer className="users-pagination"><span>Página {suppliers.page} de {Math.max(suppliers.totalPages, 1)} · {suppliers.totalCount} registro(s)</span><div><button type="button" onClick={() => { setIsLoading(true); setPage(page - 1) }} disabled={page <= 1 || isLoading}><FiChevronLeft /></button><button type="button" onClick={() => { setIsLoading(true); setPage(page + 1) }} disabled={page >= suppliers.totalPages || isLoading}><FiChevronRight /></button></div></footer>
      </section>

      {selectedSupplier !== undefined && <SupplierFormModal key={selectedSupplier?.id ?? 'new-supplier'} supplier={selectedSupplier} isSaving={isSaving} serverError={formError} onClose={() => setSelectedSupplier(undefined)} onSave={saveSupplier} />}
      {statusSupplier && <div className="modal-backdrop" role="presentation"><section className="confirm-dialog" role="dialog" aria-modal="true"><span className={`confirm-dialog__icon ${statusSupplier.isActive ? 'confirm-dialog__icon--danger' : ''}`}>{statusSupplier.isActive ? <FiSlash /> : <FiCheckCircle />}</span><h2>{statusSupplier.isActive ? 'Inativar fornecedor?' : 'Reativar fornecedor?'}</h2><p>{statusSupplier.isActive ? 'O fornecedor não poderá ser selecionado em novos processos de compra.' : 'O fornecedor voltará a ficar disponível para compras e recebimentos.'}</p><div><button className="button button--secondary" type="button" onClick={() => setStatusSupplier(null)}>Cancelar</button><button className={`button ${statusSupplier.isActive ? 'button--danger' : 'button--primary'}`} type="button" onClick={changeStatus}>{statusSupplier.isActive ? 'Inativar' : 'Reativar'}</button></div></section></div>}
      {notice && <div className="success-toast" role="status"><FiCheckCircle /> {notice}</div>}
    </main>
  )
}
