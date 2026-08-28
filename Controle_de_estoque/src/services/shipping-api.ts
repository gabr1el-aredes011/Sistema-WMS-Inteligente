import { apiRequest } from './auth-api'
import type { Carrier, CarrierInput, Pickup, PickupInput, PickupStatus, PublicPickup } from '../types/shipping'

export const shippingApi = {
  carriers(token: string, active?: boolean) { return apiRequest<Carrier[]>(`/carriers${active === undefined ? '' : `?isActive=${active}`}`, token) },
  createCarrier(token: string, value: CarrierInput) { return apiRequest<Carrier>('/carriers', token, { method: 'POST', body: JSON.stringify(value) }) },
  setCarrierStatus(token: string, id: string, isActive: boolean) { return apiRequest<Carrier>(`/carriers/${id}/status`, token, { method: 'PUT', body: JSON.stringify({ isActive }) }) },
  pickups(token: string, status?: PickupStatus) { return apiRequest<Pickup[]>(`/dispatch/pickups${status ? `?status=${status}` : ''}`, token) },
  createPickup(token: string, value: PickupInput) { return apiRequest<Pickup>('/dispatch/pickups', token, { method: 'POST', body: JSON.stringify(value) }) },
  setPickupStatus(token: string, id: string, status: PickupStatus) { return apiRequest<Pickup>(`/dispatch/pickups/${id}/status`, token, { method: 'PUT', body: JSON.stringify({ status }) }) },
  publicPickup(accessToken: string) { return fetch(`${(import.meta.env.VITE_API_URL ?? 'https://localhost:7045/api/v1').replace(/\/$/, '')}/carrier-portal/pickups/${accessToken}`).then(async (response) => { if (!response.ok) throw new Error('Coleta não encontrada.'); return response.json() as Promise<PublicPickup> }) },
}
