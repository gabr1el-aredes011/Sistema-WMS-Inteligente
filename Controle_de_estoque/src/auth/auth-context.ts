import { createContext } from 'react'
import type { AuthenticationSession, LoginCredentials } from '../types/auth'

export interface AuthContextValue {
  session: AuthenticationSession | null
  isInitializing: boolean
  isAuthenticated: boolean
  sessionNotice: string
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
