import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { authApi } from '../api/auth'
import { onUnauthorized, refreshCsrfToken } from '../api/client'
import { AuthContext, type Auth, type AuthState } from '../hooks/useAuth'
import { useNotify } from '../hooks/useNotify'
import { loginPath } from '../utils/navigation'

const ignoreFailure = () => undefined

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { notifyError } = useNotify()
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    onUnauthorized(() => {
      setState({ status: 'anonymous' })
      const { pathname, search } = window.location
      if (pathname !== '/login') navigate(loginPath(pathname + search), { replace: true })
    })
    return () => onUnauthorized(null)
  }, [navigate])

  useEffect(() => {
    let cancelled = false
    const restore = async () => {
      await refreshCsrfToken().catch(ignoreFailure)
      try {
        const user = await authApi.me()
        if (!cancelled) setState({ status: 'authenticated', user })
      } catch {
        if (!cancelled) setState({ status: 'anonymous' })
      }
    }
    void restore()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const user = await authApi.login(email, password)
    await refreshCsrfToken().catch(ignoreFailure)
    setState({ status: 'authenticated', user })
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch (error) {
      notifyError(error)
      return
    }
    await refreshCsrfToken().catch(ignoreFailure)
    setState({ status: 'anonymous' })
    navigate('/login', { replace: true })
  }, [navigate, notifyError])

  const auth = useMemo<Auth>(() => ({ state, login, logout }), [state, login, logout])

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}
