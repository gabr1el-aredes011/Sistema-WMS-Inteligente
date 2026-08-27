import { useState, type FormEvent } from 'react'
import { FiBriefcase, FiX } from 'react-icons/fi'
import type { Supplier, SupplierInput } from '../types/suppliers'

interface SupplierFormModalProps {
  supplier: Supplier | null
  isSaving: boolean
  serverError: string
  onClose: () => void
  onSave: (value: SupplierInput) => Promise<void>
}

function formatTaxId(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

export default function SupplierFormModal({ supplier, isSaving, serverError, onClose, onSave }: SupplierFormModalProps) {
  const [legalName, setLegalName] = useState(supplier?.legalName ?? '')
  const [tradeName, setTradeName] = useState(supplier?.tradeName ?? '')
  const [taxId, setTaxId] = useState(formatTaxId(supplier?.taxId ?? ''))
  const [email, setEmail] = useState(supplier?.email ?? '')
  const [phone, setPhone] = useState(supplier?.phone ?? '')
  const [validationError, setValidationError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setValidationError('')
    if (!legalName.trim() || taxId.replace(/\D/g, '').length !== 14) {
      setValidationError('Informe a razão social e um CNPJ com 14 dígitos.')
      return
    }
    await onSave({
      legalName: legalName.trim(),
      tradeName: tradeName.trim() || undefined,
      taxId,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
    })
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="user-modal supplier-modal" role="dialog" aria-modal="true" aria-labelledby="supplier-modal-title">
        <header className="user-modal__header">
          <span className="user-modal__icon"><FiBriefcase /></span>
          <div><span className="panel__eyebrow">Suprimentos</span><h2 id="supplier-modal-title">{supplier ? 'Editar fornecedor' : 'Cadastrar fornecedor'}</h2></div>
          <button type="button" onClick={onClose} aria-label="Fechar" disabled={isSaving}><FiX /></button>
        </header>
        <form onSubmit={handleSubmit}>
          <div className="user-modal__body">
            <div className="modal-section-heading"><strong>Identificação empresarial</strong><span>Dados utilizados nas compras, recebimentos e documentos fiscais.</span></div>
            <div className="form-grid">
              <label className="modal-field modal-field--full"><span>Razão social</span><input value={legalName} onChange={(event) => setLegalName(event.target.value)} maxLength={200} autoFocus disabled={isSaving} /></label>
              <label className="modal-field"><span>Nome fantasia</span><input value={tradeName} onChange={(event) => setTradeName(event.target.value)} maxLength={200} disabled={isSaving} /></label>
              <label className="modal-field"><span>CNPJ</span><input value={taxId} onChange={(event) => setTaxId(formatTaxId(event.target.value))} placeholder="00.000.000/0000-00" inputMode="numeric" disabled={isSaving} /></label>
              <label className="modal-field"><span>E-mail</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={256} disabled={isSaving} /></label>
              <label className="modal-field"><span>Telefone</span><input value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={30} disabled={isSaving} /></label>
            </div>
            {(validationError || serverError) && <div className="modal-error" role="alert">{validationError || serverError}</div>}
          </div>
          <footer className="user-modal__footer"><button className="button button--secondary" type="button" onClick={onClose} disabled={isSaving}>Cancelar</button><button className="button button--primary" type="submit" disabled={isSaving}>{isSaving ? 'Salvando...' : supplier ? 'Salvar alterações' : 'Criar fornecedor'}</button></footer>
        </form>
      </section>
    </div>
  )
}
