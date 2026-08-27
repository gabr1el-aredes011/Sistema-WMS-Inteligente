import { apiRequest } from './auth-api'
import type {
  PagedProducts,
  ProductCategory,
  ProductColor,
  ProductDetails,
  ProductInput,
  UpdateProductInput,
} from '../types/catalog'

interface ListProductsParams {
  search?: string
  categoryId?: string
  isActive?: boolean
  page: number
  pageSize: number
}

export const catalogApi = {
  categories(accessToken: string) {
    return apiRequest<ProductCategory[]>('/product-categories', accessToken)
  },

  createCategory(accessToken: string, name: string) {
    return apiRequest<ProductCategory>('/product-categories', accessToken, {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
  },

  colors(accessToken: string) {
    return apiRequest<ProductColor[]>('/product-colors', accessToken)
  },

  list(accessToken: string, params: ListProductsParams) {
    const query = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.pageSize),
    })
    if (params.search) query.set('search', params.search)
    if (params.categoryId) query.set('categoryId', params.categoryId)
    if (params.isActive !== undefined) query.set('isActive', String(params.isActive))
    return apiRequest<PagedProducts>(`/products?${query}`, accessToken)
  },

  get(accessToken: string, productId: string) {
    return apiRequest<ProductDetails>(`/products/${productId}`, accessToken)
  },

  create(accessToken: string, product: ProductInput) {
    return apiRequest<ProductDetails>('/products', accessToken, {
      method: 'POST',
      body: JSON.stringify(product),
    })
  },

  update(accessToken: string, productId: string, product: UpdateProductInput) {
    return apiRequest<ProductDetails>(`/products/${productId}`, accessToken, {
      method: 'PUT',
      body: JSON.stringify(product),
    })
  },

  setStatus(accessToken: string, productId: string, isActive: boolean) {
    return apiRequest<ProductDetails>(`/products/${productId}/status`, accessToken, {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    })
  },

  delete(accessToken: string, productId: string) {
    return apiRequest<void>(`/products/${productId}`, accessToken, {
      method: 'DELETE',
    })
  },
}
