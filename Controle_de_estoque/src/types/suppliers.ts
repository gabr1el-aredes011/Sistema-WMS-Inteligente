export interface Supplier {
  id: string
  legalName: string
  tradeName: string | null
  taxId: string
  email: string | null
  phone: string | null
  isActive: boolean
  createdAtUtc: string
  updatedAtUtc: string | null
}

export interface PagedSuppliers {
  items: Supplier[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface SupplierInput {
  legalName: string
  tradeName?: string
  taxId: string
  email?: string
  phone?: string
}
