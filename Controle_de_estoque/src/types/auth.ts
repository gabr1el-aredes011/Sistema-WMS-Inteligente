export interface CurrentUser {
  id: string
  fullName: string
  email: string
  roles: string[]
  permissions: string[]
}

export interface AuthenticationSession {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAtUtc: string
  refreshTokenExpiresAtUtc: string
  user: CurrentUser
}

export interface LoginCredentials {
  email: string
  password: string
}
