import { useCallback, useEffect, useRef, useState } from 'react'
import { timeEntriesApi } from '../api/timeEntries'
import type { CardTime } from '../types'
import { useNotify } from './useNotify'

export function useCardTimes(cardIds: number[]) {
  const { notifyError } = useNotify()
  const [times, setTimes] = useState<Record<number, CardTime>>({})
  const requested = useRef(new Set<number>())
  const idsKey = cardIds.join(',')

  const refresh = useCallback(
    async (cardId: number) => {
      try {
        const time = await timeEntriesApi.cardTime(cardId)
        setTimes((current) => ({ ...current, [cardId]: time }))
      } catch (error) {
        notifyError(error)
      }
    },
    [notifyError],
  )

  useEffect(() => {
    const missing = idsKey
      .split(',')
      .filter(Boolean)
      .map(Number)
      .filter((id) => !requested.current.has(id))
    missing.forEach((id) => {
      requested.current.add(id)
      void refresh(id)
    })
  }, [idsKey, refresh])

  const start = useCallback(
    async (cardId: number) => {
      try {
        const entry = await timeEntriesApi.start(cardId)
        setTimes((current) => ({
          ...current,
          [cardId]: {
            cardId,
            totalSeconds: current[cardId]?.totalSeconds ?? 0,
            running: { timeEntryId: entry.id, startedAt: entry.startedAt },
          },
        }))
      } catch (error) {
        notifyError(error)
      }
    },
    [notifyError],
  )

  const stop = useCallback(
    async (cardId: number) => {
      const running = times[cardId]?.running
      if (!running) return
      try {
        await timeEntriesApi.stop(running.timeEntryId)
      } catch (error) {
        notifyError(error)
      }
      await refresh(cardId)
    },
    [notifyError, refresh, times],
  )

  return { times, start, stop }
}
