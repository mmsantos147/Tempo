import { useCallback, useEffect, useState } from 'react'
import { boardsApi } from '../api/boards'
import type { BoardSummary } from '../types'
import { useNotify } from './useNotify'

const SELECTED_BOARD_KEY = 'tempo.selectedBoardId'

function readSelectedId(): number | null {
  try {
    const value = window.localStorage.getItem(SELECTED_BOARD_KEY)
    return value === null ? null : Number(value)
  } catch {
    return null
  }
}

function saveSelectedId(id: number | null): void {
  try {
    if (id === null) window.localStorage.removeItem(SELECTED_BOARD_KEY)
    else window.localStorage.setItem(SELECTED_BOARD_KEY, String(id))
  } catch {
    return
  }
}

export function useBoards() {
  const { notifyError } = useNotify()
  const [boards, setBoards] = useState<BoardSummary[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(readSelectedId)
  const [loading, setLoading] = useState(true)

  const select = useCallback((id: number | null) => {
    setSelectedId(id)
    saveSelectedId(id)
  }, [])

  useEffect(() => {
    let cancelled = false
    boardsApi
      .list()
      .then((list) => {
        if (cancelled) return
        setBoards(list)
        setSelectedId((current) => {
          const valid = list.some((board) => board.id === current) ? current : (list[0]?.id ?? null)
          saveSelectedId(valid)
          return valid
        })
      })
      .catch((error) => {
        if (!cancelled) notifyError(error)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [notifyError])

  const create = useCallback(
    async (name: string) => {
      try {
        const board = await boardsApi.create(name)
        setBoards((current) => [...current, board])
        select(board.id)
      } catch (error) {
        notifyError(error)
      }
    },
    [notifyError, select],
  )

  const rename = useCallback(
    async (id: number, name: string) => {
      try {
        const updated = await boardsApi.update(id, name)
        setBoards((current) => current.map((board) => (board.id === id ? updated : board)))
      } catch (error) {
        notifyError(error)
      }
    },
    [notifyError],
  )

  const remove = useCallback(
    async (id: number) => {
      try {
        await boardsApi.remove(id)
        const remaining = boards.filter((board) => board.id !== id)
        setBoards(remaining)
        if (selectedId === id) select(remaining[0]?.id ?? null)
      } catch (error) {
        notifyError(error)
      }
    },
    [boards, notifyError, select, selectedId],
  )

  return { boards, selectedId, loading, select, create, rename, remove }
}
