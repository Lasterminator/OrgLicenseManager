import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { login as apiLogin } from '../api/auth'
import type { LoginRequest, LoginResponse } from '../types/api'

const TOKEN_KEY = 'token'
const USER_KEY = 'user'

interface User {
  userId: string
  email: string
  role: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
}

interface AuthContextValue extends AuthState {
  login: (body: LoginRequest) => Promise<void>
  logout: () => void
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadStored(): { user: User | null; token: string | null } {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const raw = localStorage.getItem(USER_KEY)
    if (!token || !raw) return { user: null, token: null }
    const user = JSON.parse(raw) as User
    return { user, token }
  } catch {
    return { user: null, token: null }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    ...loadStored(),
    isLoading: true,
  })

  useEffect(() => {
    const { token, user } = loadStored()
    setState((s) => ({ ...s, user, token, isLoading: false }))
  }, [])

  const login = useCallback(async (body: LoginRequest) => {
    const res: LoginResponse = await apiLogin(body)
    const user: User = {
      userId: res.userId,
      email: res.email,
      role: res.role,
    }
    localStorage.setItem(TOKEN_KEY, res.token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    setState({ user, token: res.token, isLoading: false })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setState({ user: null, token: null, isLoading: false })
  }, [])

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    isAdmin: state.user?.role === 'Admin',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
