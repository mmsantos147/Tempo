import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { errorMessage } from '../api/client'
import { NotifyContext, type Notifier } from '../hooks/useNotify'
import styles from './NotificationProvider.module.css'

interface Notification {
  id: number
  message: string
}

const DISMISS_AFTER_MS = 5000

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setNotifications((current) => current.filter((notification) => notification.id !== id))
  }, [])

  const notify = useCallback(
    (message: string) => {
      const id = nextId.current++
      setNotifications((current) => [...current, { id, message }])
      window.setTimeout(() => dismiss(id), DISMISS_AFTER_MS)
    },
    [dismiss],
  )

  const notifier = useMemo<Notifier>(
    () => ({ notify, notifyError: (error: unknown) => notify(errorMessage(error)) }),
    [notify],
  )

  return (
    <NotifyContext.Provider value={notifier}>
      {children}
      <div className={styles.stack} role="status" aria-live="polite">
        {notifications.map((notification) => (
          <button key={notification.id} className={styles.toast} onClick={() => dismiss(notification.id)}>
            {notification.message}
          </button>
        ))}
      </div>
    </NotifyContext.Provider>
  )
}
