import { useState, type PropsWithChildren } from 'react'
import { authApi } from '../services/auth-api'
import type { AuthenticationSession, LoginCredentials } from '../types/auth'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthenticationSession | null>(null)

  async function login(credentials: LoginCredentials) {
    const nextSession = await authApi.login(credentials)
    setSession(nextSession)
  }

  async function logout() {
    const refreshToken = session?.refreshToken
    setSession(null)

    if (refreshToken) {
      await authApi.logout(refreshToken).catch(() => undefined)
    }
  }

  const value = {
    session,
    isAuthenticated: session !== null,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
