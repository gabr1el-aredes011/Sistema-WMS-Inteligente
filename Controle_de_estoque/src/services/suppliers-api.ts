import { apiRequest } from './auth-api'
import type { PagedSuppliers, Supplier, SupplierInput } from '../types/suppliers'

interface SupplierFilters {
  search?: string
  isActive?: boolean
  page: number
  pageSize: number
}

export const suppliersApi = {
  list(accessToken: string, filters: SupplierFilters) {
    const query = new URLSearchParams({
      page: String(filters.page),
      pageSize: String(filters.pageSize),
    })
    if (filters.search) query.set('search', filters.search)
    if (filters.isActive !== undefined) query.set('isActive', String(filters.isActive))
    return apiRequest<PagedSuppliers>(`/suppliers?${query}`, accessToken)
  },

  create(accessToken: string, input: SupplierInput) {
    return apiRequest<Supplier>('/suppliers', accessToken, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  update(accessToken: string, supplierId: string, input: SupplierInput) {
    return apiRequest<Supplier>(`/suppliers/${supplierId}`, accessToken, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  },

  setStatus(accessToken: string, supplierId: string, isActive: boolean) {
    return apiRequest<Supplier>(`/suppliers/${supplierId}/status`, accessToken, {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    })
  },
}
