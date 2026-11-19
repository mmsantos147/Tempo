import { useCallback, useEffect, useState } from 'react'
import { timeEntriesApi } from '../api/timeEntries'
import type { TimeEntry, TimeEntryInput } from '../types'
import { useNotify } from './useNotify'

export function useDayEntries(date: string) {
  const { notifyError } = useNotify()
  const [result, setResult] = useState<{ date: string; entries: TimeEntry[] | null } | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false
    timeEntriesApi
      .listByDate(date)
      .then((list) => {
        if (!cancelled) setResult({ date, entries: list })
      })
      .catch((error) => {
        if (cancelled) return
        setResult({ date, entries: null })
        notifyError(error)
      })
    return () => {
      cancelled = true
    }
  }, [date, version, notifyError])

  const reload = useCallback(() => setVersion((current) => current + 1), [])

  const create = useCallback(
    async (cardId: number, input: TimeEntryInput) => {
      await timeEntriesApi.create(cardId, input)
      reload()
    },
    [reload],
  )

  const update = useCallback(
    async (id: number, input: TimeEntryInput) => {
      await timeEntriesApi.update(id, input)
      reload()
    },
    [reload],
  )

  const loading = result?.date !== date
  const entries = loading ? null : result.entries

  return { entries, loading, failed: !loading && entries === null, create, update }
}
