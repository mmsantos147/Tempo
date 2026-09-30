import { useCallback, useEffect, useState } from 'react'
import { boardsApi } from '../api/boards'
import { cardsApi } from '../api/cards'
import { columnsApi } from '../api/columns'
import type { BoardDetail, Card, CardInput, ColumnDetail } from '../types'
import { withPositions } from '../utils/columns'
import { useNotify } from './useNotify'

export function useBoard(boardId: number) {
  const { notifyError } = useNotify()
  const [board, setBoard] = useState<BoardDetail | null>(null)

  const load = useCallback(async () => {
    try {
      setBoard(await boardsApi.get(boardId))
    } catch (error) {
      notifyError(error)
    }
  }, [boardId, notifyError])

  useEffect(() => {
    let cancelled = false
    boardsApi
      .get(boardId)
      .then((detail) => {
        if (!cancelled) setBoard(detail)
      })
      .catch((error) => {
        if (!cancelled) notifyError(error)
      })
    return () => {
      cancelled = true
    }
  }, [boardId, notifyError])

  const setColumns = useCallback((update: (columns: ColumnDetail[]) => ColumnDetail[]) => {
    setBoard((current) => (current ? { ...current, columns: withPositions(update(current.columns)) } : current))
  }, [])

  const replaceCard = useCallback(
    (card: Card) => {
      setColumns((columns) =>
        columns.map((column) => ({
          ...column,
          cards: column.cards.map((existing) => (existing.id === card.id ? card : existing)),
        })),
      )
    },
    [setColumns],
  )

  const createColumn = useCallback(
    async (name: string) => {
      try {
        const column = await columnsApi.create(boardId, name)
        setColumns((columns) => [...columns, { id: column.id, name: column.name, position: column.position, cards: [] }])
      } catch (error) {
        notifyError(error)
      }
    },
    [boardId, notifyError, setColumns],
  )

  const renameColumn = useCallback(
    async (columnId: number, name: string) => {
      try {
        const updated = await columnsApi.update(columnId, name)
        setColumns((columns) => columns.map((column) => (column.id === columnId ? { ...column, name: updated.name } : column)))
      } catch (error) {
        notifyError(error)
      }
    },
    [notifyError, setColumns],
  )

  const moveColumn = useCallback(
    async (columnId: number, position: number) => {
      setColumns((columns) => {
        const moving = columns.find((column) => column.id === columnId)
        if (!moving) return columns
        const rest = columns.filter((column) => column.id !== columnId)
        rest.splice(position, 0, moving)
        return rest
      })
      try {
        await columnsApi.move(columnId, position)
      } catch (error) {
        notifyError(error)
        await load()
      }
    },
    [load, notifyError, setColumns],
  )

  const removeColumn = useCallback(
    async (columnId: number) => {
      try {
        await columnsApi.remove(columnId)
        setColumns((columns) => columns.filter((column) => column.id !== columnId))
      } catch (error) {
        notifyError(error)
      }
    },
    [notifyError, setColumns],
  )

  const createCard = useCallback(
    async (columnId: number, input: CardInput) => {
      try {
        const card = await cardsApi.create(columnId, input)
        setColumns((columns) =>
          columns.map((column) => (column.id === columnId ? { ...column, cards: [...column.cards, card] } : column)),
        )
      } catch (error) {
        notifyError(error)
      }
    },
    [notifyError, setColumns],
  )

  const updateCard = useCallback(
    async (cardId: number, input: CardInput) => {
      try {
        replaceCard(await cardsApi.update(cardId, input))
        return true
      } catch (error) {
        notifyError(error)
        return false
      }
    },
    [notifyError, replaceCard],
  )

  const setCardCompleted = useCallback(
    async (cardId: number, completed: boolean) => {
      try {
        replaceCard(await (completed ? cardsApi.complete(cardId) : cardsApi.reopen(cardId)))
      } catch (error) {
        notifyError(error)
      }
    },
    [notifyError, replaceCard],
  )

  const removeCard = useCallback(
    async (cardId: number) => {
      try {
        await cardsApi.remove(cardId)
        setColumns((columns) =>
          columns.map((column) => ({ ...column, cards: column.cards.filter((card) => card.id !== cardId) })),
        )
      } catch (error) {
        notifyError(error)
      }
    },
    [notifyError, setColumns],
  )

  const persistCardMove = useCallback(
    async (cardId: number, columnId: number, position: number) => {
      try {
        await cardsApi.move(cardId, columnId, position)
      } catch (error) {
        notifyError(error)
        await load()
      }
    },
    [load, notifyError],
  )

  return {
    board,
    setColumns,
    createColumn,
    renameColumn,
    moveColumn,
    removeColumn,
    createCard,
    updateCard,
    setCardCompleted,
    removeCard,
    persistCardMove,
  }
}
