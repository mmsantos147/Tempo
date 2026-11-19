import { createContext, useContext } from 'react'
import type { User } from '../types'

export type AuthState = { status: 'loading' } | { status: 'anonymous' } | { status: 'authenticated'; user: User }

export interface Auth {
  state: AuthState
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<Auth | null>(null)

export function useAuth(): Auth {
  const auth = useContext(AuthContext)
  if (!auth) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return auth
}
