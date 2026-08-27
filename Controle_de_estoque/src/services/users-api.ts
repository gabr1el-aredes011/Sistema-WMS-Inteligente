import { apiRequest } from './auth-api'
import type {
  CreateUserInput,
  PagedUsers,
  RoleSummary,
  UpdateUserInput,
  UserDetails,
} from '../types/users'

interface UserFilters {
  search?: string
  isActive?: boolean
  page?: number
  pageSize?: number
}

export const usersApi = {
  list(accessToken: string, filters: UserFilters = {}) {
    const query = new URLSearchParams()

    if (filters.search) query.set('search', filters.search)
    if (filters.isActive !== undefined) {
      query.set('isActive', String(filters.isActive))
    }
    query.set('page', String(filters.page ?? 1))
    query.set('pageSize', String(filters.pageSize ?? 20))

    return apiRequest<PagedUsers>(`/users?${query}`, accessToken)
  },

  roles(accessToken: string) {
    return apiRequest<RoleSummary[]>('/roles', accessToken)
  },

  create(accessToken: string, input: CreateUserInput) {
    return apiRequest<UserDetails>('/users', accessToken, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  update(accessToken: string, userId: string, input: UpdateUserInput) {
    return apiRequest<UserDetails>(`/users/${userId}`, accessToken, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  },

  setRoles(accessToken: string, userId: string, roles: string[]) {
    return apiRequest<UserDetails>(`/users/${userId}/roles`, accessToken, {
      method: 'PUT',
      body: JSON.stringify({ roles }),
    })
  },

  setStatus(accessToken: string, userId: string, isActive: boolean) {
    return apiRequest<UserDetails>(`/users/${userId}/status`, accessToken, {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    })
  },
}
