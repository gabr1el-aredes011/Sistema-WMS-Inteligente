export interface UserSummary {
  id: string
  fullName: string
  email: string
  isActive: boolean
  createdAtUtc: string
  lastLoginAtUtc: string | null
  roles: string[]
}

export interface UserDetails extends UserSummary {
  updatedAtUtc: string | null
}

export interface RoleSummary {
  name: string
  description: string | null
  isSystem: boolean
  permissionCount: number
}

export interface PagedUsers {
  items: UserSummary[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface CreateUserInput {
  fullName: string
  email: string
  password: string
  roles: string[]
}

export interface UpdateUserInput {
  fullName: string
  email: string
}
