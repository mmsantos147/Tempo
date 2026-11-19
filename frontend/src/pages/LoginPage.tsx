import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router'
import { ApiError, errorMessage } from '../api/client'
import { Button } from '../components/Button'
import form from '../components/Form.module.css'
import { Icon } from '../components/Icon'
import { useAuth } from '../hooks/useAuth'
import { safeNextPath } from '../utils/navigation'
import styles from './LoginPage.module.css'

function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 401) return 'Invalid email or password.'
  if (error instanceof ApiError && error.status === 429) {
    const minutes = Math.max(1, Math.ceil((error.retryAfterSeconds ?? 60) / 60))
    return `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`
  }
  return errorMessage(error)
}

export function LoginPage() {
  const { state, login } = useAuth()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const next = safeNextPath(searchParams.get('next'))

  if (state.status === 'authenticated') {
    return <Navigate to={next} replace />
  }

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await login(email.trim(), password)
    } catch (failure) {
      setError(loginErrorMessage(failure))
      setPassword('')
      setSubmitting(false)
    }
  }

  return (
    <main className={styles.page}>
      <form
        className={`${form.form} ${styles.card}`}
        onSubmit={(event) => {
          event.preventDefault()
          if (email.trim() && password) void submit()
        }}
      >
        <div className={styles.brand}>
          <Icon name="clock" size={24} />
          Tempo
        </div>
        <h1 className={styles.title}>Sign in</h1>

        <label className={form.field}>
          Email
          <input
            type="email"
            autoComplete="username"
            autoFocus
            required
            maxLength={255}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className={form.field}>
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            maxLength={200}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" disabled={!email.trim() || !password || submitting || state.status === 'loading'}>
          Sign in
        </Button>
      </form>
    </main>
  )
}
