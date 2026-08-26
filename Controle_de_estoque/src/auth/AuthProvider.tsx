import { useEffect, useState, type PropsWithChildren } from 'react'
import { authApi } from '../services/auth-api'
import type { AuthenticationSession, LoginCredentials } from '../types/auth'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthenticationSession | null>(null)

  useEffect(() => {
    if (!session) return

    const refreshAt = new Date(session.accessTokenExpiresAtUtc).getTime() - 60_000
    const delay = Math.max(refreshAt - Date.now(), 0)
    const timer = window.setTimeout(() => {
      authApi.refresh(session.refreshToken)
        .then(setSession)
        .catch(() => setSession(null))
    }, delay)

    return () => window.clearTimeout(timer)
  }, [session])

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
