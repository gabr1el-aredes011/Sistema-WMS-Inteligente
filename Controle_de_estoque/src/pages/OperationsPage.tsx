import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { apiRequest } from '../services/auth-api'
import '../styles/operations.css'

type Line = {
  id: string
  variantId: string | null
  description: string
  quantity: number
  reserved: number
  isCustom: boolean
  customCompleted: boolean
  details: string | null
}
type Order = {
  id: string
  invoiceNumber: string
  invoiceKey: string
  customer: string
  channel: string
  status: string
  responsible: string | null
  dueAtUtc: string | null
  createdAtUtc: string
  lines: Line[]
  events: {
    id: string
    actor: string
    message: string
    createdAtUtc: string
  }[]
}
type Stock = {
  variantId: string
  code: string
  product: string
  color: string
  unit: string
  isActive: boolean
  onHand: number
  reserved: number
  missing: number
  pendingOrders: number
}
type DraftLine = {
  variantId: string
  description: string
  quantity: number
  isCustom: boolean
  details: string
}
const statuses: Record<string, string> = {
  Preparing: 'Em preparação',
  Separating: 'Em separação',
  Ready: 'Pronto para retirada',
  Dispatched: 'Expedido',
  Cancelled: 'Cancelado',
}
const channels = [
  'Instagram',
  'Mercado Livre',
  'WhatsApp',
  'Site oficial',
  'Presencial',
]
const qty = (n: number) =>
  n.toLocaleString('pt-BR', { maximumFractionDigits: 3 })
const fileBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

export default function OperationsPage({
  mode,
}: {
  mode: 'orders' | 'production' | 'dispatch'
}) {
  const { session } = useAuth()
  const token = session?.accessToken ?? ''
  const permissions = session?.user.permissions ?? []
  const canOrders =
    permissions.includes('purchasing.manage') ||
    permissions.includes('dispatch.manage')
  const canProduction = permissions.includes('inventory.receive')
  const canDispatch = permissions.includes('dispatch.readiness.update')
  const [orders, setOrders] = useState<Order[]>([])
  const [stock, setStock] = useState<Stock[]>([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [draftId, setDraftId] = useState(() => crypto.randomUUID())
  const [customer, setCustomer] = useState('')
  const [channel, setChannel] = useState(channels[0])
  const [due, setDue] = useState('')
  const [lines, setLines] = useState<DraftLine[]>([])
  const [pdf, setPdf] = useState<File | null>(null)
  const [xml, setXml] = useState<File | null>(null)
  const [attachments, setAttachments] = useState<File[]>([])
  const [documents, setDocuments] = useState<{ kind: string; name: string }[]>(
    [],
  )
  const [invoice, setInvoice] = useState('')
  const [scan, setScan] = useState('')
  const [variant, setVariant] = useState('')
  const [quantity, setQuantity] = useState('')
  const [receiptId, setReceiptId] = useState(() => crypto.randomUUID())
  const [comment, setComment] = useState('')
  const [responsible, setResponsible] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const quantityRef = useRef<HTMLInputElement>(null)
  const scanRef = useRef<HTMLInputElement>(null)
  const inFlight = useRef(false)

  const reload = useCallback(async () => {
    const [o, s] = await Promise.all([
      apiRequest<Order[]>('/operations/orders', token),
      apiRequest<Stock[]>('/operations/stock', token),
    ])
    setOrders(o)
    setStock(s)
  }, [token])
  useEffect(() => {
    let active = true
    setLoading(true)
    reload()
      .catch((e) => {
        if (active) setError(String(e.message))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [reload])
  const order = orders.find((o) => o.id === selected)
  useEffect(() => {
    setDocuments([])
    if (!selected) return
    let active = true
    apiRequest<{ kind: string; name: string }[]>(
      `/operations/orders/${selected}/documents`,
      token,
    )
      .then((value) => {
        if (active) setDocuments(value)
      })
      .catch((e) => {
        if (active) setError(e.message)
      })
    return () => {
      active = false
    }
  }, [selected, token])
  useEffect(() => {
    const dialog = document.querySelector<HTMLElement>('.ops-modal')
    if (!dialog) return
    const previous = document.activeElement as HTMLElement | null
    dialog.querySelector<HTMLElement>('button,input,select,textarea')?.focus()
    function trap(event: KeyboardEvent) {
      if (event.key === 'Escape' && !inFlight.current) {
        setCreating(false)
        setSelected(null)
      }
      if (event.key !== 'Tab') return
      const elements = Array.from(
        dialog!.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled)',
        ),
      )
      const first = elements[0],
        last = elements[elements.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', trap)
    return () => {
      document.removeEventListener('keydown', trap)
      previous?.focus()
    }
  }, [creating, selected])
  useEffect(() => {
    if (mode === 'production' && !busy && !variant) scanRef.current?.focus()
  }, [mode, busy, variant])

  const product = stock.find((s) => s.variantId === variant)
  const open = orders.filter(
    (o) => !['Dispatched', 'Cancelled'].includes(o.status),
  )
  const shortages = stock
    .filter((s) => s.missing > 0)
    .sort((a, b) => b.missing - a.missing)

  async function perform(work: () => Promise<void>, message: string) {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await work()
      await reload()
      setNotice(message)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Não foi possível concluir a operação.',
      )
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  async function readXml(file: File | undefined) {
    setXml(null)
    setLines([])
    setInvoice('')
    setError('')
    if (!file) return
    try {
      if (file.size > 2_000_000) throw new Error('XML: limite de 2 MB.')
      const text = await file.text()
      if (/<!DOCTYPE|<!ENTITY/i.test(text))
        throw new Error('XML com declaração externa não permitido.')
      const doc = new DOMParser().parseFromString(text, 'application/xml')
      const ns = 'http://www.portalfiscal.inf.br/nfe'
      const infos = doc.getElementsByTagNameNS(ns, 'infNFe')
      if (doc.getElementsByTagName('parsererror').length || infos.length !== 1)
        throw new Error('Selecione um XML válido de NF-e.')
      const value = (el: Element, name: string) =>
        el.getElementsByTagNameNS(ns, name)[0]?.textContent ?? ''
      const info = infos[0]
      const items = Array.from(info.getElementsByTagNameNS(ns, 'det')).map(
        (el) => {
          const code = value(el, 'cProd')
          return {
            variantId:
              stock.find((s) => s.code === code && s.isActive)?.variantId ?? '',
            description: value(el, 'xProd'),
            quantity: Number(value(el, 'qCom')),
            isCustom: false,
            details: '',
          }
        },
      )
      if (
        !items.length ||
        items.length > 200 ||
        items.some((x) => !Number.isFinite(x.quantity) || x.quantity <= 0)
      )
        throw new Error('Confira os itens e quantidades da NF-e.')
      setLines(items)
      setInvoice(value(info, 'nNF'))
      setCustomer(
        value(info.getElementsByTagNameNS(ns, 'dest')[0] ?? info, 'xNome'),
      )
      setXml(file)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao ler XML.')
    }
  }

  function resolveScan() {
    setError('')
    const text = scan.trim()
    const parts = text.split('|')
    const code =
      parts.length > 1
        ? parts[0] === 'PVWMS' && parts[1] === 'V1' && parts[2] === 'VARIANT'
          ? parts[3]
          : ''
        : text
    const found = stock.find((s) => s.code.toLowerCase() === code.toLowerCase())
    if (!found) {
      setError(
        'Código não encontrado. Leia o QR do catálogo ou selecione o produto.',
      )
      setVariant('')
      return
    }
    if (!found.isActive) {
      setError('Produto Inativado do Sistema')
      setVariant('')
      return
    }
    setVariant(found.variantId)
    setQuantity('')
    setReceiptId(crypto.randomUUID())
    quantityRef.current?.focus()
  }

  function action(action: string, lineId?: string) {
    if (!order) return
    void perform(async () => {
      await apiRequest(`/operations/orders/${order.id}/actions`, token, {
        method: 'POST',
        body: JSON.stringify({
          action,
          lineId,
          message: comment,
          responsible,
          conferenceConfirmed: confirmed,
        }),
      })
      setComment('')
      setConfirmed(false)
    }, 'Pedido atualizado.')
  }
  async function download(kind: string) {
    if (!order) return
    try {
      const url = `${(import.meta.env.VITE_API_URL ?? 'https://localhost:7045/api/v1').replace(/\/$/, '')}/operations/orders/${order.id}/documents/${kind}`
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Não foi possível baixar o documento.')
      const blob = URL.createObjectURL(await response.blob())
      const a = document.createElement('a')
      a.href = blob
      a.download =
        documents.find((d) => d.kind === kind)?.name ??
        `NF-${order.invoiceNumber}.${kind}`
      a.click()
      setTimeout(() => URL.revokeObjectURL(blob), 1000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha no download.')
    }
  }

  return (
    <main className="ops-page">
      <header className="ops-heading">
        <div>
          <span className="ops-eyebrow">PV COMPANY · OPERAÇÃO INDUSTRIAL</span>
          <h1>
            {mode === 'production'
              ? 'Entrada de produção'
              : mode === 'dispatch'
                ? 'Expedição de pedidos'
                : 'Pedidos'}
          </h1>
          <p>
            {mode === 'production'
              ? 'Registre peças fabricadas e complete as reservas pendentes.'
              : 'Do escritório à separação, acompanhe cada pedido em um só lugar.'}
          </p>
        </div>
        <div className="ops-actions">
          <button
            disabled={busy || loading}
            onClick={() => void perform(reload, 'Dados atualizados.')}
          >
            Atualizar
          </button>
          {mode === 'orders' && canOrders && (
            <button
              className="ops-primary"
              onClick={() => {
                setCreating(true)
                setDraftId(crypto.randomUUID())
                setLines([])
                setPdf(null)
                setXml(null)
                setAttachments([])
                setCustomer('')
                setDue('')
                setInvoice('')
                setError('')
              }}
            >
              + Novo pedido
            </button>
          )}
        </div>
      </header>
      {error && (
        <div className="ops-alert" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="ops-success" role="status">
          {notice}
        </div>
      )}
      <section className="ops-metrics">
        <article>
          <span>Pedidos em andamento</span>
          <strong>{open.length}</strong>
        </article>
        <article>
          <span>Variantes com falta</span>
          <strong>{shortages.length}</strong>
        </article>
        <article>
          <span>Prontos para retirada</span>
          <strong>{orders.filter((o) => o.status === 'Ready').length}</strong>
        </article>
      </section>
      {loading ? (
        <p role="status">Carregando operação…</p>
      ) : mode === 'production' ? (
        <>
          <section className="ops-card">
            <h2>Produtos em falta com urgência</h2>
            <p>
              Faltas dos pedidos abertos. Entradas atendem automaticamente os
              pedidos mais antigos.
            </p>
            {shortages.length === 0 ? (
              <p>Nenhuma falta pendente.</p>
            ) : (
              <div className="ops-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Produto / variante</th>
                      <th>Falta</th>
                      <th>Pedidos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shortages.map((s) => (
                      <tr key={s.variantId}>
                        <td>
                          {s.product} · {s.color}
                          <small>
                            {s.code}
                            {!s.isActive
                              ? ' · Inativo — revisar com administrador'
                              : ''}
                          </small>
                        </td>
                        <td>
                          {qty(s.missing)} {s.unit}
                        </td>
                        <td>{s.pendingOrders}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          {canProduction && (
            <section className="ops-card">
              <h2>Registrar produtos fabricados</h2>
              <p>
                Bipe o QR do quadro ou digite o código, informe a quantidade e
                confirme.
              </p>
              <fieldset disabled={busy}>
                <div className="ops-row">
                  <label>
                    Código ou QR
                    <input
                      ref={scanRef}
                      value={scan}
                      onChange={(e) => setScan(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          resolveScan()
                        }
                      }}
                      placeholder="PV-00000001 ou leitura do QR"
                    />
                  </label>
                  <button onClick={resolveScan}>Identificar produto</button>
                </div>
                <label>
                  Ou selecione a variante
                  <select
                    value={variant}
                    onChange={(e) => {
                      setVariant(e.target.value)
                      setQuantity('')
                      setReceiptId(crypto.randomUUID())
                    }}
                  >
                    <option value="">Selecione</option>
                    {stock
                      .filter((s) => s.isActive)
                      .map((s) => (
                        <option key={s.variantId} value={s.variantId}>
                          {s.code} · {s.product} · {s.color} · {s.unit}
                        </option>
                      ))}
                  </select>
                </label>
                {product && (
                  <p className="ops-selected">
                    {product.product} · {product.color} · {product.unit}
                    <br />
                    Físico: {qty(product.onHand)} · Reservado:{' '}
                    {qty(product.reserved)} · Disponível:{' '}
                    {qty(product.onHand - product.reserved)}
                  </p>
                )}
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    void perform(async () => {
                      await apiRequest('/operations/production', token, {
                        method: 'POST',
                        body: JSON.stringify({
                          id: receiptId,
                          variantId: variant,
                          quantity: Number(quantity),
                        }),
                      })
                      setReceiptId(crypto.randomUUID())
                      setQuantity('')
                      setScan('')
                      setVariant('')
                    }, 'Entrada registrada. Reservas pendentes atualizadas.')
                  }}
                >
                  <div className="ops-row">
                    <label>
                      Quantidade produzida
                      <input
                        ref={quantityRef}
                        type="number"
                        min="0.001"
                        max="1000000000"
                        step="0.001"
                        required
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                      />
                    </label>
                    <button
                      className="ops-primary"
                      disabled={!variant || !product?.isActive}
                    >
                      Confirmar entrada
                    </button>
                  </div>
                </form>
              </fieldset>
            </section>
          )}
          <section className="ops-card">
            <h2>Saldos por variante</h2>
            <div className="ops-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Físico</th>
                    <th>Reservado</th>
                    <th>Disponível</th>
                  </tr>
                </thead>
                <tbody>
                  {stock.map((s) => (
                    <tr key={s.variantId}>
                      <td>
                        {s.product} · {s.color}
                        <small>
                          {s.code} · {s.unit}
                        </small>
                      </td>
                      <td>{qty(s.onHand)}</td>
                      <td>{qty(s.reserved)}</td>
                      <td>{qty(s.onHand - s.reserved)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <section className="ops-card">
          <div className="ops-row">
            <label>
              Buscar pedido
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Últimos 4 dígitos da NF, número completo ou cliente"
              />
            </label>
            <label>
              Etapa
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="">Todas</option>
                {Object.entries(statuses).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="ops-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nota / cliente</th>
                  <th>Canal</th>
                  <th>Etapa</th>
                  <th>Prazo</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {orders
                  .filter(
                    (o) =>
                      (!filter || o.status === filter) &&
                      `${o.invoiceNumber} ${o.customer} ${o.invoiceKey}`
                        .toLowerCase()
                        .includes(search.toLowerCase()),
                  )
                  .map((o) => (
                    <tr key={o.id}>
                      <td>
                        <strong>
                          NF {o.invoiceNumber.slice(-4).padStart(4, '0')}
                        </strong>
                        <small>
                          {o.customer} · Número completo: {o.invoiceNumber}
                        </small>
                      </td>
                      <td>{o.channel}</td>
                      <td>
                        <span className={`ops-badge ops-${o.status}`}>
                          {statuses[o.status]}
                        </span>
                      </td>
                      <td>
                        {o.dueAtUtc
                          ? new Date(o.dueAtUtc).toLocaleDateString('pt-BR')
                          : 'Sem prazo'}
                      </td>
                      <td>
                        <button
                          onClick={() => {
                            setSelected(o.id)
                            setResponsible(o.responsible ?? '')
                            setConfirmed(false)
                            setComment('')
                          }}
                        >
                          Abrir pedido
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {orders.length === 0 && (
              <p>Nenhum pedido cadastrado. Comece anexando a NF-e e seu PDF.</p>
            )}
          </div>
        </section>
      )}
      {creating && (
        <div className="ops-overlay">
          <section
            className="ops-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Novo pedido"
          >
            <h2>Novo pedido</h2>
            <p>
              Anexe os dois documentos e confira o vínculo de cada item do XML.
              A reserva será feita ao cadastrar.
            </p>
            {error && (
              <div role="alert" className="ops-alert">
                {error}
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!pdf || !xml) {
                  setError('Anexe PDF e XML.')
                  return
                }
                void perform(async () => {
                  await apiRequest('/operations/orders', token, {
                    method: 'POST',
                    body: JSON.stringify({
                      id: draftId,
                      customer,
                      channel,
                      dueAtUtc: due
                        ? new Date(`${due}T12:00:00`).toISOString()
                        : null,
                      lines: lines.map((l) => ({
                        ...l,
                        variantId: l.variantId || null,
                      })),
                      pdfBase64: await fileBase64(pdf),
                      xmlBase64: await fileBase64(xml),
                      attachments: await Promise.all(
                        attachments.map(async (f) => ({
                          name: f.name,
                          contentBase64: await fileBase64(f),
                        })),
                      ),
                    }),
                  })
                  setCreating(false)
                }, 'Pedido cadastrado e estoque reservado.')
              }}
            >
              <fieldset disabled={busy}>
                <div className="ops-row">
                  <label>
                    XML da NF-e · até 2 MB
                    <input
                      type="file"
                      accept=".xml"
                      required
                      onChange={(e) => void readXml(e.target.files?.[0])}
                    />
                  </label>
                  <label>
                    PDF da nota · até 5 MB
                    <input
                      type="file"
                      accept=".pdf"
                      required
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f && f.size > 5_000_000) {
                          setError('PDF: limite de 5 MB.')
                          setPdf(null)
                        } else setPdf(f ?? null)
                      }}
                    />
                  </label>
                </div>
                <p>Nota identificada: {invoice || 'Aguardando XML'}</p>
                <label>
                  Anexos e referências de personalizados · até 5 arquivos de 2
                  MB
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? [])
                      if (
                        files.length > 5 ||
                        files.some((f) => f.size > 2_000_000)
                      ) {
                        setError(
                          'Selecione até cinco anexos de no máximo 2 MB cada.',
                        )
                        setAttachments([])
                        e.target.value = ''
                      } else setAttachments(files)
                    }}
                  />
                </label>
                <div className="ops-row">
                  <label>
                    Cliente
                    <input
                      required
                      maxLength={200}
                      value={customer}
                      onChange={(e) => setCustomer(e.target.value)}
                    />
                  </label>
                  <label>
                    Canal
                    <select
                      value={channel}
                      onChange={(e) => setChannel(e.target.value)}
                    >
                      {channels.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Prazo
                    <input
                      type="date"
                      value={due}
                      onChange={(e) => setDue(e.target.value)}
                    />
                  </label>
                </div>
                {lines.map((l, i) => (
                  <article className="ops-line" key={i}>
                    <strong>
                      {i + 1}. {l.description}
                    </strong>
                    <p>Quantidade da nota: {qty(l.quantity)}</p>
                    <label className="ops-check">
                      <input
                        type="checkbox"
                        checked={l.isCustom}
                        onChange={(e) =>
                          setLines((old) =>
                            old.map((x, j) =>
                              j === i
                                ? {
                                    ...x,
                                    isCustom: e.target.checked,
                                    variantId: '',
                                  }
                                : x,
                            ),
                          )
                        }
                      />
                      Produto personalizado
                    </label>
                    <label>
                      {l.isCustom
                        ? 'Produto-base (opcional)'
                        : 'Variante do catálogo · confira a unidade da nota'}
                      <select
                        required={!l.isCustom}
                        value={l.variantId}
                        onChange={(e) =>
                          setLines((old) =>
                            old.map((x, j) =>
                              j === i ? { ...x, variantId: e.target.value } : x,
                            ),
                          )
                        }
                      >
                        <option value="">Selecione</option>
                        {stock
                          .filter((s) => s.isActive)
                          .map((s) => (
                            <option key={s.variantId} value={s.variantId}>
                              {s.code} · {s.product} · {s.color} · {s.unit}
                            </option>
                          ))}
                      </select>
                    </label>
                    {l.isCustom && (
                      <label>
                        Detalhes solicitados pelo cliente
                        <textarea
                          required
                          maxLength={2000}
                          value={l.details}
                          onChange={(e) =>
                            setLines((old) =>
                              old.map((x, j) =>
                                j === i ? { ...x, details: e.target.value } : x,
                              ),
                            )
                          }
                        />
                      </label>
                    )}
                  </article>
                ))}
                <div className="ops-actions">
                  <button type="button" onClick={() => setCreating(false)}>
                    Cancelar
                  </button>
                  <button
                    className="ops-primary"
                    disabled={!xml || !pdf || lines.length === 0}
                  >
                    Cadastrar e reservar
                  </button>
                </div>
              </fieldset>
            </form>
          </section>
        </div>
      )}
      {order && (
        <div className="ops-overlay">
          <section
            className="ops-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Detalhes do pedido"
          >
            <div className="ops-heading">
              <div>
                <h2>
                  NF {order.invoiceNumber} · {order.customer}
                </h2>
                <span className="ops-badge">{statuses[order.status]}</span>
              </div>
              <button onClick={() => setSelected(null)}>Fechar</button>
            </div>
            <p className="ops-key">Chave: {order.invoiceKey}</p>
            <p>
              {order.channel} · Responsável:{' '}
              {order.responsible || 'Não atribuído'}
            </p>
            <div className="ops-actions">
              {documents.map((d) => (
                <button key={d.kind} onClick={() => void download(d.kind)}>
                  Baixar {d.name}
                </button>
              ))}
            </div>
            {error && (
              <div className="ops-alert" role="alert">
                {error}
              </div>
            )}
            <div className="ops-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Pedido</th>
                    <th>Reserva / produção</th>
                  </tr>
                </thead>
                <tbody>
                  {order.lines.map((l) => (
                    <tr key={l.id}>
                      <td>
                        {l.description}
                        <small>
                          {l.isCustom
                            ? `Personalizado: ${l.details}`
                            : stock.find((s) => s.variantId === l.variantId)
                                ?.code}
                        </small>
                      </td>
                      <td>{qty(l.quantity)}</td>
                      <td>
                        {l.isCustom ? (
                          l.customCompleted ? (
                            'Produção concluída'
                          ) : canProduction &&
                            !['Cancelled', 'Dispatched'].includes(
                              order.status,
                            ) ? (
                            <button
                              disabled={busy}
                              onClick={() => action('CustomComplete', l.id)}
                            >
                              Concluir produção
                            </button>
                          ) : (
                            'Aguardando produção'
                          )
                        ) : (
                          `${qty(l.reserved)} reservadas`
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!['Cancelled', 'Dispatched'].includes(order.status) && (
              <fieldset disabled={busy}>
                {(canDispatch || canOrders) && (
                  <>
                    <div className="ops-row">
                      <label>
                        Responsável pela preparação
                        <input
                          value={responsible}
                          maxLength={150}
                          onChange={(e) => setResponsible(e.target.value)}
                        />
                      </label>
                      <button onClick={() => action('Assign')}>Atribuir</button>
                    </div>
                    <label>
                      Comentário
                      <textarea
                        maxLength={2000}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      />
                    </label>
                    <button
                      disabled={!comment.trim()}
                      onClick={() => action('Comment')}
                    >
                      Registrar comentário
                    </button>
                    <div className="ops-actions">
                      {canDispatch && order.status === 'Preparing' && (
                        <button
                          className="ops-primary"
                          onClick={() => action('Separating')}
                        >
                          Iniciar separação
                        </button>
                      )}
                      {canDispatch && order.status === 'Separating' && (
                        <>
                          <label className="ops-check">
                            <input
                              type="checkbox"
                              checked={confirmed}
                              onChange={(e) => setConfirmed(e.target.checked)}
                            />
                            Conferi e embalei todos os itens
                          </label>
                          <button
                            className="ops-primary"
                            disabled={
                              !confirmed ||
                              !order.responsible ||
                              !order.lines.every((l) =>
                                l.isCustom
                                  ? l.customCompleted
                                  : l.reserved === l.quantity,
                              )
                            }
                            onClick={() => action('Ready')}
                          >
                            Pronto para retirada
                          </button>
                        </>
                      )}
                      {canDispatch && order.status === 'Ready' && (
                        <button
                          className="ops-primary"
                          onClick={() => {
                            if (
                              window.confirm(
                                'Confirma a saída de todos os itens? O saldo será baixado.',
                              )
                            )
                              action('Dispatched')
                          }}
                        >
                          Confirmar expedição completa
                        </button>
                      )}
                    </div>
                  </>
                )}
                {canOrders && (
                  <button
                    className="ops-danger"
                    onClick={() => {
                      if (
                        window.confirm(
                          'Cancelar pedido e liberar suas reservas?',
                        )
                      )
                        action('Cancelled')
                    }}
                  >
                    Cancelar pedido
                  </button>
                )}
              </fieldset>
            )}
            <h3>Histórico do pedido</h3>
            <ol className="ops-history">
              {[...order.events]
                .sort((a, b) => a.createdAtUtc.localeCompare(b.createdAtUtc))
                .map((e) => (
                  <li key={e.id}>
                    <p>{e.message}</p>
                    <small>
                      {new Date(e.createdAtUtc).toLocaleString('pt-BR')} ·{' '}
                      {e.actor}
                    </small>
                  </li>
                ))}
            </ol>
          </section>
        </div>
      )}
    </main>
  )
}
