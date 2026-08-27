import { useEffect, useState, type FormEvent } from 'react'
import {
  FiBox,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiFilter,
  FiLayers,
  FiPlus,
  FiSearch,
  FiSlash,
  FiTag,
} from 'react-icons/fi'
import { useAuth } from '../auth/useAuth'
import ProductFormModal from '../components/ProductFormModal'
import { ApiError } from '../services/auth-api'
import { catalogApi } from '../services/catalog-api'
import type {
  PagedProducts,
  ProductCategory,
  ProductDetails,
  ProductInput,
  ProductSummary,
} from '../types/catalog'
import '../styles/users.css'
import '../styles/catalog.css'

type StatusFilter = 'all' | 'active' | 'inactive'

const itemTypeLabels: Record<ProductSummary['itemType'], string> = {
  RawMaterial: 'Matéria-prima',
  SemiFinished: 'Semielaborado',
  Component: 'Componente',
  FinishedProduct: 'Produto acabado',
  Kit: 'Kit / conjunto',
  Packaging: 'Embalagem',
}

const emptyPage: PagedProducts = {
  items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0,
}

function dimensions(product: ProductSummary) {
  const values = [product.heightMillimeters, product.depthMillimeters, product.lengthMillimeters]
    .filter((value): value is number => value !== null)
  return values.length ? `${values.join(' × ')} mm` : 'Não informado'
}

export default function ProductCatalogPage() {
  const { session } = useAuth()
  const token = session?.accessToken ?? ''
  const permissions = session?.user.permissions ?? []
  const [products, setProducts] = useState<PagedProducts>(emptyPage)
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [editingProduct, setEditingProduct] = useState<ProductDetails | null | undefined>(undefined)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [statusProduct, setStatusProduct] = useState<ProductSummary | null>(null)
  const [categoryDialog, setCategoryDialog] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [notice, setNotice] = useState('')

  const canCreate = permissions.includes('products.create')
  const canUpdate = permissions.includes('products.update')
  const canDisable = permissions.includes('products.disable')

  useEffect(() => {
    let cancelled = false
    catalogApi.categories(token)
      .then((result) => { if (!cancelled) setCategories(result) })
      .catch((error: unknown) => { if (!cancelled) setLoadError(error instanceof ApiError ? error.message : 'Não foi possível carregar as categorias.') })
    return () => { cancelled = true }
  }, [token, refreshVersion])

  useEffect(() => {
    let cancelled = false
    catalogApi.list(token, {
      search,
      categoryId: categoryId || undefined,
      isActive: status === 'all' ? undefined : status === 'active',
      page,
      pageSize: 20,
    })
      .then((result) => { if (!cancelled) { setProducts(result); setLoadError('') } })
      .catch((error: unknown) => { if (!cancelled) setLoadError(error instanceof ApiError ? error.message : 'Não foi possível carregar os produtos.') })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [token, search, categoryId, status, page, refreshVersion])

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

  async function openEdit(productId: string) {
    setFormError('')
    try {
      setEditingProduct(await catalogApi.get(token, productId))
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : 'Não foi possível abrir o produto.')
    }
  }

  async function saveProduct(value: ProductInput) {
    setIsSaving(true)
    setFormError('')
    try {
      if (editingProduct === null) {
        await catalogApi.create(token, value)
      } else if (editingProduct) {
        const baseProduct = {
          categoryId: value.categoryId,
          name: value.name,
          type: value.type,
          itemType: value.itemType,
          model: value.model,
          heightMillimeters: value.heightMillimeters,
          depthMillimeters: value.depthMillimeters,
          lengthMillimeters: value.lengthMillimeters,
        }
        await catalogApi.update(token, editingProduct.id, baseProduct)
      }
      setEditingProduct(undefined)
      reload(editingProduct === null ? 'Produto criado com sucesso.' : 'Produto atualizado com sucesso.')
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Não foi possível salvar o produto.')
    } finally {
      setIsSaving(false)
    }
  }

  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!categoryName.trim()) return
    setIsSaving(true)
    setFormError('')
    try {
      await catalogApi.createCategory(token, categoryName.trim())
      setCategoryName('')
      setCategoryDialog(false)
      reload('Categoria criada com sucesso.')
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Não foi possível criar a categoria.')
    } finally {
      setIsSaving(false)
    }
  }

  async function changeProductStatus() {
    if (!statusProduct) return
    try {
      await catalogApi.setStatus(token, statusProduct.id, !statusProduct.isActive)
      const message = statusProduct.isActive ? 'Produto inativado.' : 'Produto reativado.'
      setStatusProduct(null)
      reload(message)
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : 'Não foi possível alterar o status.')
      setStatusProduct(null)
    }
  }

  const visibleVariants = products.items.reduce((total, product) => total + product.variantCount, 0)

  return (
    <main className="dashboard-content users-page catalog-page">
      <header className="users-heading">
        <div>
          <span className="eyebrow eyebrow--blue">Catálogo e estoque</span>
          <h1>Catálogo de produtos</h1>
          <p>Organize materiais, componentes e produtos acabados com rastreabilidade industrial.</p>
        </div>
        {canCreate && <div className="catalog-heading-actions">
          <button className="button button--secondary" type="button" onClick={() => { setFormError(''); setCategoryDialog(true) }}><FiLayers /> Nova categoria</button>
          <button className="button button--primary" type="button" onClick={() => { setFormError(''); setEditingProduct(null) }} disabled={categories.length === 0}><FiPlus /> Novo produto</button>
        </div>}
      </header>

      <section className="users-metrics" aria-label="Resumo do catálogo">
        <article><span><FiBox /></span><div><small>Total encontrado</small><strong>{products.totalCount}</strong></div></article>
        <article><span><FiLayers /></span><div><small>Categorias</small><strong>{categories.length}</strong></div></article>
        <article><span><FiTag /></span><div><small>Variantes nesta página</small><strong>{visibleVariants}</strong></div></article>
      </section>

      <section className="users-panel">
        <header className="users-toolbar catalog-toolbar">
          <form className="users-search" onSubmit={handleSearch}>
            <FiSearch /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Buscar por nome, código interno ou referência" /><button type="submit">Buscar</button>
          </form>
          <select className="category-filter" value={categoryId} onChange={(event) => { setIsLoading(true); setPage(1); setCategoryId(event.target.value) }} aria-label="Filtrar por categoria">
            <option value="">Todas as categorias</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <div className="status-filter"><FiFilter />{(['all', 'active', 'inactive'] as StatusFilter[]).map((item) => <button key={item} className={status === item ? 'status-filter__active' : ''} type="button" onClick={() => { setIsLoading(true); setPage(1); setStatus(item) }}>{item === 'all' ? 'Todos' : item === 'active' ? 'Ativos' : 'Inativos'}</button>)}</div>
        </header>

        {loadError && <div className="users-alert" role="alert">{loadError}</div>}

        <div className="users-table-wrap">
          <table className="users-table catalog-table">
            <thead><tr><th>Produto</th><th>Categoria e modelo</th><th>Dimensões</th><th>Variantes</th><th>Status</th><th><span className="sr-only">Ações</span></th></tr></thead>
            <tbody>
              {isLoading ? Array.from({ length: 4 }).map((_, index) => <tr className="skeleton-row" key={index}><td colSpan={6}><span /></td></tr>) : products.items.length === 0 ? (
                <tr><td colSpan={6}><div className="users-empty"><FiBox /><strong>Nenhum produto encontrado</strong><span>Crie uma categoria e cadastre o primeiro item do catálogo.</span></div></td></tr>
              ) : products.items.map((product) => (
                <tr key={product.id}>
                  <td><div className="catalog-product"><span><FiBox /></span><span><strong>{product.name}</strong><small>{product.type} · {itemTypeLabels[product.itemType]}</small></span></div></td>
                  <td><strong className="catalog-category">{product.categoryName}</strong><small className="catalog-model">{product.model ?? 'Sem modelo'}</small></td>
                  <td><span className="catalog-dimensions">{dimensions(product)}</span></td>
                  <td><div className="catalog-variants"><strong>{product.variantCount}</strong><span>{product.colors.slice(0, 3).join(', ') || 'Sem cor'}</span></div></td>
                  <td><span className={`user-status ${product.isActive ? 'user-status--active' : 'user-status--inactive'}`}><span />{product.isActive ? 'Ativo' : 'Inativo'}</span></td>
                  <td><div className="table-actions">{canUpdate && <button type="button" onClick={() => openEdit(product.id)} title="Editar produto"><FiEdit2 /></button>}{canDisable && <button type="button" onClick={() => setStatusProduct(product)} title={product.isActive ? 'Inativar' : 'Reativar'}>{product.isActive ? <FiSlash /> : <FiCheckCircle />}</button>}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="users-pagination"><span>Página {products.page} de {Math.max(products.totalPages, 1)} · {products.totalCount} registro(s)</span><div><button type="button" onClick={() => { setIsLoading(true); setPage(page - 1) }} disabled={page <= 1 || isLoading}><FiChevronLeft /></button><button type="button" onClick={() => { setIsLoading(true); setPage(page + 1) }} disabled={page >= products.totalPages || isLoading}><FiChevronRight /></button></div></footer>
      </section>

      {editingProduct !== undefined && <ProductFormModal key={editingProduct?.id ?? 'new-product'} product={editingProduct} categories={categories} isSaving={isSaving} serverError={formError} onClose={() => setEditingProduct(undefined)} onSave={saveProduct} />}

      {categoryDialog && <div className="modal-backdrop" role="presentation"><section className="confirm-dialog category-dialog" role="dialog" aria-modal="true"><span className="confirm-dialog__icon"><FiLayers /></span><h2>Nova categoria</h2><p>Crie uma organização para agrupar os produtos do catálogo.</p><form onSubmit={createCategory}><input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="Ex.: Montantes" autoFocus />{formError && <div className="modal-error">{formError}</div>}<div><button className="button button--secondary" type="button" onClick={() => setCategoryDialog(false)}>Cancelar</button><button className="button button--primary" type="submit" disabled={isSaving}>Criar categoria</button></div></form></section></div>}

      {statusProduct && <div className="modal-backdrop" role="presentation"><section className="confirm-dialog" role="dialog" aria-modal="true"><span className={`confirm-dialog__icon ${statusProduct.isActive ? 'confirm-dialog__icon--danger' : ''}`}>{statusProduct.isActive ? <FiSlash /> : <FiCheckCircle />}</span><h2>{statusProduct.isActive ? 'Inativar produto?' : 'Reativar produto?'}</h2><p>{statusProduct.isActive ? 'O produto deixará de ficar disponível para novas operações.' : 'O produto voltará a ficar disponível para a operação.'}</p><div><button className="button button--secondary" type="button" onClick={() => setStatusProduct(null)}>Cancelar</button><button className={`button ${statusProduct.isActive ? 'button--danger' : 'button--primary'}`} type="button" onClick={changeProductStatus}>{statusProduct.isActive ? 'Inativar' : 'Reativar'}</button></div></section></div>}
      {notice && <div className="success-toast" role="status"><FiCheckCircle /> {notice}</div>}
    </main>
  )
}
