export interface ProductCategory {
  id: string
  name: string
  isActive: boolean
  productCount: number
}

export interface ProductColor {
  id: string
  name: string
  hexCode: string
}

export interface ProductVariant {
  id: string
  internalCode: string
  color: string
  externalReference: string | null
  externalBarcode: string | null
  unitOfMeasure: string
  isActive: boolean
}

export interface ProductSummary {
  id: string
  name: string
  categoryId: string
  categoryName: string
  type: string
  itemType: CatalogItemType
  model: string | null
  heightMillimeters: number | null
  depthMillimeters: number | null
  lengthMillimeters: number | null
  isActive: boolean
  variantCount: number
  colors: string[]
}

export interface ProductDetails extends Omit<ProductSummary, 'variantCount' | 'colors'> {
  createdAtUtc: string
  updatedAtUtc: string | null
  variants: ProductVariant[]
}

export interface PagedProducts {
  items: ProductSummary[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface ProductVariantInput {
  color: string
  externalReference?: string
  externalBarcode?: string
  unitOfMeasure: string
}

export type CatalogItemType =
  | 'RawMaterial'
  | 'SemiFinished'
  | 'Component'
  | 'FinishedProduct'
  | 'Kit'
  | 'Packaging'

export interface ProductInput {
  categoryId: string
  name: string
  type: string
  itemType: CatalogItemType
  model?: string
  heightMillimeters?: number
  depthMillimeters?: number
  lengthMillimeters?: number
  variants: ProductVariantInput[]
}

export type UpdateProductInput = Omit<ProductInput, 'variants'>
