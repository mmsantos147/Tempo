import { useEffect, useState } from 'react'
import { boardsApi } from '../api/boards'
import { useNotify } from '../hooks/useNotify'
import type { BoardDetail, BoardSummary } from '../types'
import form from './Form.module.css'

interface CardPickerProps {
  cardId: number | null
  onChange: (cardId: number | null) => void
}

export function CardPicker({ cardId, onChange }: CardPickerProps) {
  const { notifyError } = useNotify()
  const [boards, setBoards] = useState<BoardSummary[] | null>(null)
  const [boardId, setBoardId] = useState<number | null>(null)
  const [board, setBoard] = useState<BoardDetail | null>(null)

  useEffect(() => {
    let cancelled = false
    boardsApi
      .list()
      .then((list) => {
        if (cancelled) return
        setBoards(list)
        setBoardId(list[0]?.id ?? null)
      })
      .catch((error) => {
        if (!cancelled) notifyError(error)
      })
    return () => {
      cancelled = true
    }
  }, [notifyError])

  useEffect(() => {
    if (boardId === null) return
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

  const currentBoard = board?.id === boardId ? board : null

  return (
    <div className={form.row}>
      <label className={form.field}>
        Board
        <select
          value={boardId ?? ''}
          disabled={!boards || boards.length === 0}
          onChange={(event) => {
            setBoardId(Number(event.target.value))
            onChange(null)
          }}
        >
          {boards?.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className={form.field}>
        Card
        <select
          value={cardId ?? ''}
          disabled={!currentBoard}
          onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))}
        >
          <option value="">Select a card</option>
          {currentBoard?.columns.map((column) => (
            <optgroup key={column.id} label={column.name}>
              {column.cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.completedAt ? `✓ ${card.title}` : card.title}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
    </div>
  )
}
