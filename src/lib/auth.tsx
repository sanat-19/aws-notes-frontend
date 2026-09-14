import { createContext, useContext, useState, type ReactNode } from 'react'
import { api, getToken, setToken } from './api'

interface AuthContextValue {
  isAuthenticated: boolean
  email: string | null
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getToken())
  const [email, setEmail] = useState<string | null>(localStorage.getItem('email'))

  async function login(email: string, password: string) {
    const { token } = await api.login(email, password)
    setToken(token)
    setTokenState(token)
    localStorage.setItem('email', email)
    setEmail(email)
  }

  async function signup(email: string, password: string) {
    await api.signup(email, password)
    await login(email, password)
  }

  function logout() {
    setToken(null)
    setTokenState(null)
    localStorage.removeItem('email')
    setEmail(null)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!token, email, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
