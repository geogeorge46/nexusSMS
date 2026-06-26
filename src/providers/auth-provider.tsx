import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import {
  clearAuthSession,
  fetchCurrentUser,
  getAuthToken,
  getStoredAuthUser,
  loginWithApi,
  logoutWithApi,
  saveAuthUser,
  type AuthUser,
} from '@/lib/auth-api'
import { disconnectNotificationSocket } from '@/lib/notification-socket'

type LoginPayload = {
  email: string
  password: string
}

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  login: (payload: LoginPayload) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState<string | null>(() => getAuthToken())
  const [user, setUser] = useState<AuthUser | null>(() => getStoredAuthUser())
  const [isBootstrapping, setIsBootstrapping] = useState(() => Boolean(getAuthToken()))

  useEffect(() => {
    if (!token) {
      return
    }

    let active = true

    fetchCurrentUser()
      .then((currentUser) => {
        if (!active) return
        saveAuthUser(currentUser)
        setUser(currentUser)
      })
      .catch(() => {
        if (!active) return
        clearAuthSession()
        setToken(null)
        setUser(null)
        queryClient.clear()
        disconnectNotificationSocket()
      })
      .finally(() => {
        if (active) setIsBootstrapping(false)
      })

    return () => {
      active = false
    }
  }, [queryClient, token])

  const login = useCallback(async (payload: LoginPayload) => {
    const session = await loginWithApi(payload)
    setToken(session.token)
    const currentUser = await fetchCurrentUser()
    saveAuthUser(currentUser)
    setUser(currentUser)
  }, [])

  const logout = useCallback(async () => {
    try {
      if (getAuthToken()) {
        await logoutWithApi()
      }
    } catch {
      // Local logout should still complete if the network request fails.
    } finally {
      clearAuthSession()
      setToken(null)
      setUser(null)
      disconnectNotificationSocket()
      queryClient.clear()
      window.location.assign('/login')
    }
  }, [queryClient])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isBootstrapping,
      login,
      logout,
    }),
    [isBootstrapping, login, logout, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
