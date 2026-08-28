import { useEffect, useState } from 'react'
import { FiCheckCircle, FiClock, FiTruck, FiXCircle } from 'react-icons/fi'
import { useParams } from 'react-router-dom'
import { shippingApi } from '../services/shipping-api'
import type { PublicPickup, PickupStatus } from '../types/shipping'
import logo from '../assets/logo.png'
import '../styles/shipping.css'

const statusContent: Record<PickupStatus, { label: string; description: string; icon: typeof FiClock }> = {
  Preparing: { label: 'Em preparação', description: 'A carga ainda não está liberada. Não se desloque para a coleta.', icon: FiClock },
  ReadyForPickup: { label: 'Pronto para coleta', description: 'A carga foi liberada pela PV Company e pode ser coletada.', icon: FiCheckCircle },
  Collected: { label: 'Coletado', description: 'A retirada desta carga já foi registrada.', icon: FiTruck },
  Cancelled: { label: 'Coleta cancelada', description: 'Esta solicitação foi cancelada. Entre em contato com a PV Company.', icon: FiXCircle },
}

export default function CarrierPortalPage() {
  const { accessToken = '' } = useParams()
  const [pickup, setPickup] = useState<PublicPickup | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { shippingApi.publicPickup(accessToken).then(setPickup).catch(() => setError('Não foi possível localizar esta coleta. Confira o link recebido.')) }, [accessToken])
  if (error) return <main className="carrier-portal"><section><img src={logo} alt="Altrion" /><FiXCircle className="portal-error" /><h1>Coleta não encontrada</h1><p>{error}</p></section></main>
  if (!pickup) return <main className="carrier-portal"><section><p>Consultando a situação da coleta...</p></section></main>
  const content = statusContent[pickup.status]; const Icon = content.icon
  return <main className="carrier-portal"><section><img src={logo} alt="Altrion" /><span className="eyebrow eyebrow--blue">Portal da transportadora</span><h1>{pickup.code}</h1><p className="portal-reference">Referência {pickup.orderReference}</p><div className={`portal-status portal-status--${pickup.status}`}><Icon /><div><strong>{content.label}</strong><p>{content.description}</p></div></div><dl><div><dt>Transportadora</dt><dd>{pickup.carrierName}</dd></div><div><dt>Volumes</dt><dd>{pickup.volumeCount}</dd></div><div><dt>Coleta prevista</dt><dd>{pickup.scheduledAtUtc ? new Date(pickup.scheduledAtUtc).toLocaleString('pt-BR') : 'A confirmar'}</dd></div><div><dt>Descrição</dt><dd>{pickup.description ?? 'Sem observações'}</dd></div></dl><footer>Consulta segura · somente informações desta coleta</footer></section></main>
}
