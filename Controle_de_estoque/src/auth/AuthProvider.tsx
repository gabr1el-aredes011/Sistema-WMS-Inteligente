import { useEffect, useState, type PropsWithChildren } from 'react'
import { authApi } from '../services/auth-api'
import type { AuthenticationSession, LoginCredentials } from '../types/auth'
import { AuthContext } from './auth-context'

const sessionStorageKey = 'altrion-wms-session'
const renewalFailureMessage =
  'Sua sessão não pôde ser renovada. Entre novamente para continuar.'

function storeSession(session: AuthenticationSession | null) {
  if (session) {
    window.sessionStorage.setItem(sessionStorageKey, JSON.stringify(session))
  } else {
    window.sessionStorage.removeItem(sessionStorageKey)
  }
}

function readStoredSession() {
  const storedSession = window.sessionStorage.getItem(sessionStorageKey)

  if (!storedSession) return null

  try {
    return JSON.parse(storedSession) as AuthenticationSession
  } catch {
    window.sessionStorage.removeItem(sessionStorageKey)
    return null
  }
}

interface InitialAuthState {
  session: AuthenticationSession | null
  refreshToken: string | null
  isInitializing: boolean
  sessionNotice: string
}

function readInitialAuthState(): InitialAuthState {
  const storedSession = readStoredSession()

  if (!storedSession) {
    return { session: null, refreshToken: null, isInitializing: false, sessionNotice: '' }
  }

  const refreshTokenExpiresAt = new Date(
    storedSession.refreshTokenExpiresAtUtc,
  ).getTime()

  if (!Number.isFinite(refreshTokenExpiresAt) || refreshTokenExpiresAt <= Date.now()) {
    storeSession(null)
    return {
      session: null,
      refreshToken: null,
      isInitializing: false,
      sessionNotice: 'Sua sessão expirou. Entre novamente para continuar.',
    }
  }

  const accessTokenExpiresAt = new Date(
    storedSession.accessTokenExpiresAtUtc,
  ).getTime()

  if (Number.isFinite(accessTokenExpiresAt) && accessTokenExpiresAt > Date.now()) {
    return { session: storedSession, refreshToken: null, isInitializing: false, sessionNotice: '' }
  }

  return {
    session: null,
    refreshToken: storedSession.refreshToken,
    isInitializing: true,
    sessionNotice: '',
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [initialAuthState] = useState(readInitialAuthState)
  const [session, setSession] = useState<AuthenticationSession | null>(
    initialAuthState.session,
  )
  const [isInitializing, setIsInitializing] = useState(
    initialAuthState.isInitializing,
  )
  const [sessionNotice, setSessionNotice] = useState(
    initialAuthState.sessionNotice,
  )

  useEffect(() => {
    let cancelled = false

    if (!initialAuthState.refreshToken) return

    authApi.refresh(initialAuthState.refreshToken)
      .then((refreshedSession) => {
        if (!cancelled) {
          storeSession(refreshedSession)
          setSession(refreshedSession)
          setSessionNotice('')
        }
      })
      .catch(() => {
        if (!cancelled) {
          storeSession(null)
          setSessionNotice(renewalFailureMessage)
        }
      })
      .finally(() => {
        if (!cancelled) setIsInitializing(false)
      })

    return () => {
      cancelled = true
    }
  }, [initialAuthState])

  useEffect(() => {
    if (!session || isInitializing) return

    const refreshAt = new Date(session.accessTokenExpiresAtUtc).getTime() - 60_000
    const delay = Math.max(refreshAt - Date.now(), 0)
    const timer = window.setTimeout(() => {
      authApi.refresh(session.refreshToken)
        .then((refreshedSession) => {
          storeSession(refreshedSession)
          setSession(refreshedSession)
          setSessionNotice('')
        })
        .catch(() => {
          storeSession(null)
          setSessionNotice(renewalFailureMessage)
          setSession(null)
        })
    }, delay)

    return () => window.clearTimeout(timer)
  }, [session, isInitializing])

  async function login(credentials: LoginCredentials) {
    const nextSession = await authApi.login(credentials)
    storeSession(nextSession)
    setSession(nextSession)
    setSessionNotice('')
  }

  async function logout() {
    const refreshToken = session?.refreshToken
    storeSession(null)
    setSession(null)
    setSessionNotice('')

    if (refreshToken) {
      await authApi.logout(refreshToken).catch(() => undefined)
    }
  }

  const value = {
    session,
    isInitializing,
    isAuthenticated: session !== null,
    sessionNotice,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
