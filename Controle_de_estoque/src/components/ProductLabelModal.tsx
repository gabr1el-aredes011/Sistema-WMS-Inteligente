import { useMemo, useState } from 'react'
import { FiBox, FiPrinter, FiX } from 'react-icons/fi'
import QRCode from 'react-qr-code'
import type { ProductDetails } from '../types/catalog'

interface ProductLabelModalProps {
  product: ProductDetails
  onClose: () => void
}

function dimensions(product: ProductDetails) {
  const values = [product.heightMillimeters, product.depthMillimeters, product.lengthMillimeters]
    .filter((value): value is number => value !== null)
  return values.length ? `${values.join(' × ')} mm` : 'Dimensões não informadas'
}

export default function ProductLabelModal({ product, onClose }: ProductLabelModalProps) {
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? '')
  const [packageQuantity, setPackageQuantity] = useState(1)
  const [copies, setCopies] = useState(1)
  const variant = product.variants.find((item) => item.id === variantId) ?? product.variants[0]

  const qrPayload = useMemo(() => {
    if (!variant) return ''
    return [
      'PVWMS',
      'V1',
      'VARIANT',
      variant.internalCode,
      'QTY',
      packageQuantity,
      'UOM',
      variant.unitOfMeasure,
    ].join('|')
  }, [packageQuantity, variant])

  if (!variant) return null

  return (
    <div className="modal-backdrop product-label-print" role="presentation">
      <section className="user-modal label-modal" role="dialog" aria-modal="true" aria-labelledby="label-modal-title">
        <header className="user-modal__header label-modal__header">
          <span className="user-modal__icon"><FiPrinter /></span>
          <div>
            <span className="panel__eyebrow">Identificação operacional</span>
            <h2 id="label-modal-title">Etiqueta com QR Code</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar"><FiX /></button>
        </header>

        <div className="user-modal__body label-modal__body">
          <div className="label-modal__controls">
            <label className="modal-field modal-field--full">
              <span>Variante</span>
              <select value={variant.id} onChange={(event) => setVariantId(event.target.value)}>
                {product.variants.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.internalCode} · {item.color} · {item.unitOfMeasure}
                  </option>
                ))}
              </select>
            </label>
            <label className="modal-field">
              <span>Conteúdo da embalagem</span>
              <input type="number" min="1" max="999999" value={packageQuantity} onChange={(event) => setPackageQuantity(Math.max(1, Number(event.target.value) || 1))} />
            </label>
            <label className="modal-field">
              <span>Cópias</span>
              <input type="number" min="1" max="50" value={copies} onChange={(event) => setCopies(Math.min(50, Math.max(1, Number(event.target.value) || 1)))} />
            </label>
            <p>O QR Code utiliza o código interno imutável da variante. O conteúdo informado representa quantas unidades existem neste volume ou pack.</p>
          </div>

          <div className="label-sheet" aria-label="Prévia da etiqueta">
            {Array.from({ length: copies }).map((_, index) => (
              <article className="product-label" key={`${qrPayload}-${index}`}>
                <div className="product-label__brand"><FiBox /><strong>PV COMPANY</strong><span>WMS</span></div>
                <div className="product-label__content">
                  <div className="product-label__qr"><QRCode value={qrPayload} size={148} level="M" /></div>
                  <div className="product-label__details">
                    <small>PRODUTO</small>
                    <h3>{product.name}</h3>
                    <dl>
                      <div><dt>Código</dt><dd>{variant.internalCode}</dd></div>
                      <div><dt>Cor</dt><dd>{variant.color || 'Não informada'}</dd></div>
                      <div><dt>Modelo</dt><dd>{product.model ?? 'Não informado'}</dd></div>
                      <div><dt>Medidas</dt><dd>{dimensions(product)}</dd></div>
                    </dl>
                    <strong className="product-label__quantity">CONTEÚDO: {packageQuantity} {variant.unitOfMeasure}</strong>
                  </div>
                </div>
                <footer>Identificação interna · {qrPayload}</footer>
              </article>
            ))}
          </div>
        </div>

        <footer className="user-modal__footer label-modal__footer">
          <button className="button button--secondary" type="button" onClick={onClose}>Fechar</button>
          <button className="button button--primary" type="button" onClick={() => window.print()}><FiPrinter /> Imprimir etiqueta</button>
        </footer>
      </section>
    </div>
  )
}
