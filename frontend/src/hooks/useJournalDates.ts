import { useEffect, useState } from 'react'
import { journalApi } from '../api/journal'
import { monthRange } from '../utils/time'
import { useNotify } from './useNotify'

export function useJournalDates(month: string) {
  const { notifyError } = useNotify()
  const [result, setResult] = useState<{ month: string; dates: Set<string> } | null>(null)

  useEffect(() => {
    let cancelled = false
    const { from, to } = monthRange(month)
    journalApi
      .listDates(from, to)
      .then((dates) => {
        if (!cancelled) setResult({ month, dates: new Set(dates) })
      })
      .catch((error) => {
        if (cancelled) return
        setResult({ month, dates: new Set() })
        notifyError(error)
      })
    return () => {
      cancelled = true
    }
  }, [month, notifyError])

  return result?.month === month ? result.dates : null
}
