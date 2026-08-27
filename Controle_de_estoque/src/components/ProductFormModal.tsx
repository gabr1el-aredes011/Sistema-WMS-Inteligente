import { useState, type FormEvent } from 'react'
import { FiBox, FiPlus, FiTrash2, FiX } from 'react-icons/fi'
import type {
  CatalogItemType,
  ProductCategory,
  ProductColor,
  ProductDetails,
  ProductInput,
  ProductVariantInput,
} from '../types/catalog'

interface ProductFormModalProps {
  product: ProductDetails | null
  categories: ProductCategory[]
  colors: ProductColor[]
  isSaving: boolean
  serverError: string
  onClose: () => void
  onSave: (value: ProductInput) => Promise<void>
}

const emptyVariant = (): ProductVariantInput => ({
  color: '',
  externalReference: '',
  externalBarcode: '',
  unitOfMeasure: 'UN',
})

const itemTypes: { value: CatalogItemType; label: string }[] = [
  { value: 'RawMaterial', label: 'Matéria-prima' },
  { value: 'SemiFinished', label: 'Semielaborado' },
  { value: 'Component', label: 'Componente' },
  { value: 'FinishedProduct', label: 'Produto acabado' },
  { value: 'Kit', label: 'Kit / conjunto' },
  { value: 'Packaging', label: 'Embalagem' },
]

export default function ProductFormModal({
  product,
  categories,
  colors,
  isSaving,
  serverError,
  onClose,
  onSave,
}: ProductFormModalProps) {
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? '')
  const [name, setName] = useState(product?.name ?? '')
  const [type, setType] = useState(product?.type ?? '')
  const [itemType, setItemType] = useState<CatalogItemType>(product?.itemType ?? 'Component')
  const [model, setModel] = useState(product?.model ?? '')
  const [height, setHeight] = useState(product?.heightMillimeters?.toString() ?? '')
  const [depth, setDepth] = useState(product?.depthMillimeters?.toString() ?? '')
  const [length, setLength] = useState(product?.lengthMillimeters?.toString() ?? '')
  const [variants, setVariants] = useState<ProductVariantInput[]>(
    product?.variants.map((variant) => ({
      color: variant.color,
      externalReference: variant.externalReference ?? '',
      externalBarcode: variant.externalBarcode ?? '',
      unitOfMeasure: variant.unitOfMeasure,
    })) ?? [emptyVariant()],
  )
  const [validationError, setValidationError] = useState('')
  const isCreating = product === null

  function updateVariant(index: number, field: keyof ProductVariantInput, value: string) {
    setVariants((current) => current.map((variant, itemIndex) =>
      itemIndex === index ? { ...variant, [field]: value } : variant,
    ))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setValidationError('')

    if (!categoryId || !name.trim() || !type.trim()) {
      setValidationError('Preencha categoria, nome e tipo do produto.')
      return
    }

    if (isCreating && variants.some((variant) => !variant.color.trim())) {
      setValidationError('Informe a cor de todas as variantes.')
      return
    }

    await onSave({
      categoryId,
      name: name.trim(),
      type: type.trim(),
      itemType,
      model: model.trim() || undefined,
      heightMillimeters: height ? Number(height) : undefined,
      depthMillimeters: depth ? Number(depth) : undefined,
      lengthMillimeters: length ? Number(length) : undefined,
      variants: variants.map((variant) => ({
        ...variant,
        color: variant.color.trim(),
        externalReference: variant.externalReference?.trim() || undefined,
        externalBarcode: variant.externalBarcode?.trim() || undefined,
        unitOfMeasure: variant.unitOfMeasure.trim() || 'UN',
      })),
    })
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="user-modal product-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
        <header className="user-modal__header">
          <span className="user-modal__icon"><FiBox /></span>
          <div>
            <span className="panel__eyebrow">Catálogo operacional</span>
            <h2 id="product-modal-title">{isCreating ? 'Cadastrar produto' : 'Editar produto'}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" disabled={isSaving}><FiX /></button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="user-modal__body">
            <div className="modal-section-heading">
              <strong>Identificação e dimensões</strong>
              <span>As medidas são registradas em milímetros para evitar ambiguidades.</span>
            </div>

            <div className="form-grid">
              <label className="modal-field">
                <span>Categoria</span>
                <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} disabled={isSaving}>
                  <option value="">Selecione</option>
                  {categories.filter((category) => category.isActive).map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </label>
              <label className="modal-field">
                <span>Tipo</span>
                <input value={type} onChange={(event) => setType(event.target.value)} placeholder="Ex.: Montante" disabled={isSaving} />
              </label>
              <label className="modal-field">
                <span>Classificação industrial</span>
                <select value={itemType} onChange={(event) => setItemType(event.target.value as CatalogItemType)} disabled={isSaving}>
                  {itemTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <label className="modal-field modal-field--full">
                <span>Nome do produto</span>
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Montante Slim 2000 x 600" disabled={isSaving} autoFocus />
              </label>
              <label className="modal-field">
                <span>Modelo</span>
                <input value={model} onChange={(event) => setModel(event.target.value)} placeholder="Ex.: Slim" disabled={isSaving} />
              </label>
              <label className="modal-field">
                <span>Altura (mm)</span>
                <input type="number" min="1" value={height} onChange={(event) => setHeight(event.target.value)} disabled={isSaving} />
              </label>
              <label className="modal-field">
                <span>Profundidade (mm)</span>
                <input type="number" min="1" value={depth} onChange={(event) => setDepth(event.target.value)} disabled={isSaving} />
              </label>
              <label className="modal-field">
                <span>Comprimento (mm)</span>
                <input type="number" min="1" value={length} onChange={(event) => setLength(event.target.value)} disabled={isSaving} />
              </label>
            </div>

            <div className="modal-section-heading modal-section-heading--roles product-variants-heading">
              <span><strong>Variantes operacionais</strong><small>O WMS gera o código interno. Referências e códigos do fornecedor são opcionais.</small></span>
              {isCreating && (
                <button type="button" onClick={() => setVariants((current) => [...current, emptyVariant()])} disabled={isSaving}>
                  <FiPlus /> Adicionar variante
                </button>
              )}
            </div>

            <div className="variant-list">
              {variants.map((variant, index) => (
                <div className="variant-row" key={`${index}-${variant.color}`}>
                  <label className="modal-field"><span>Código interno</span><input value={product?.variants[index]?.internalCode ?? 'Gerado automaticamente'} disabled /></label>
                  <label className="modal-field">
                    <span>Cor</span>
                    <span className="color-select-control">
                      <i style={{ backgroundColor: colors.find((color) => color.name === variant.color)?.hexCode ?? '#dce4ec' }} />
                      <select value={variant.color} onChange={(event) => updateVariant(index, 'color', event.target.value)} disabled={!isCreating || isSaving}>
                        <option value="">Selecione</option>
                        {variant.color && !colors.some((color) => color.name === variant.color) && (
                          <option value={variant.color}>{variant.color} (legado)</option>
                        )}
                        {colors.map((color) => (
                          <option
                            key={color.id}
                            value={color.name}
                            disabled={variants.some((item, itemIndex) => itemIndex !== index && item.color === color.name)}
                          >
                            {color.name}
                          </option>
                        ))}
                      </select>
                    </span>
                  </label>
                  <label className="modal-field"><span>Referência externa (opcional)</span><input value={variant.externalReference ?? ''} onChange={(event) => updateVariant(index, 'externalReference', event.target.value)} disabled={!isCreating || isSaving} /></label>
                  <label className="modal-field"><span>Código externo (opcional)</span><input value={variant.externalBarcode ?? ''} onChange={(event) => updateVariant(index, 'externalBarcode', event.target.value)} disabled={!isCreating || isSaving} /></label>
                  {isCreating && variants.length > 1 && (
                    <button type="button" onClick={() => setVariants((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remover variante ${index + 1}`}><FiTrash2 /></button>
                  )}
                </div>
              ))}
            </div>
            {!isCreating && <p className="variant-note">A edição de variantes será habilitada na etapa de gestão de etiquetas e unidades logísticas.</p>}
            {(validationError || serverError) && <div className="modal-error" role="alert">{validationError || serverError}</div>}
          </div>

          <footer className="user-modal__footer">
            <button className="button button--secondary" type="button" onClick={onClose} disabled={isSaving}>Cancelar</button>
            <button className="button button--primary" type="submit" disabled={isSaving}>{isSaving ? 'Salvando...' : isCreating ? 'Criar produto' : 'Salvar alterações'}</button>
          </footer>
        </form>
      </section>
    </div>
  )
}
