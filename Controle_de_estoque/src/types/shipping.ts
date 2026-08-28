export type PickupStatus = 'Preparing' | 'ReadyForPickup' | 'Collected' | 'Cancelled'

export interface Carrier { id: string; name: string; taxId: string | null; contactName: string | null; email: string | null; phone: string | null; isActive: boolean }
export interface Pickup { id: string; code: string; carrierId: string; carrierName: string; orderReference: string; description: string | null; volumeCount: number; scheduledAtUtc: string | null; status: PickupStatus; publicAccessToken: string; createdAtUtc: string; readyAtUtc: string | null; collectedAtUtc: string | null }
export interface PublicPickup { code: string; carrierName: string; orderReference: string; description: string | null; volumeCount: number; scheduledAtUtc: string | null; status: PickupStatus; readyAtUtc: string | null; collectedAtUtc: string | null; updatedAtUtc: string | null }
export interface CarrierInput { name: string; taxId?: string; contactName?: string; email?: string; phone?: string }
export interface PickupInput { carrierId: string; orderReference: string; description?: string; volumeCount: number; scheduledAtUtc?: string }
