import { createContext, useContext } from 'react'

export interface Notifier {
  notify: (message: string) => void
  notifyError: (error: unknown) => void
}

export const NotifyContext = createContext<Notifier | null>(null)

export function useNotify(): Notifier {
  const notifier = useContext(NotifyContext)
  if (!notifier) {
    throw new Error('useNotify must be used inside <NotificationProvider>')
  }
  return notifier
}
