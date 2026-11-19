import { useEffect, useState } from 'react'
import { boardsApi } from '../api/boards'
import { errorMessage } from '../api/client'
import { useNotify } from '../hooks/useNotify'
import type { BoardDetail, BoardSummary, JournalItem } from '../types'
import { Button } from './Button'
import form from './Form.module.css'
import { Modal, ModalActions } from './Modal'
import styles from './TimeEntryForm.module.css'

interface MakeCardDialogProps {
  item: JournalItem
  onCreate: (columnId: number) => Promise<void>
  onClose: () => void
}

export function MakeCardDialog({ item, onCreate, onClose }: MakeCardDialogProps) {
  const { notifyError } = useNotify()
  const [boards, setBoards] = useState<BoardSummary[] | null>(null)
  const [boardId, setBoardId] = useState<number | null>(null)
  const [board, setBoard] = useState<BoardDetail | null>(null)
  const [columnId, setColumnId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    boardsApi
      .list()
      .then((list) => {
        if (cancelled) return
        setBoards(list)
        setBoardId(list[0]?.id ?? null)
      })
      .catch((failure) => {
        if (!cancelled) notifyError(failure)
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
        if (cancelled) return
        setBoard(detail)
        setColumnId(detail.columns[0]?.id ?? null)
      })
      .catch((failure) => {
        if (!cancelled) notifyError(failure)
      })
    return () => {
      cancelled = true
    }
  }, [boardId, notifyError])

  const currentBoard = board?.id === boardId ? board : null

  const submit = async () => {
    if (columnId === null) return
    setSaving(true)
    setError(null)
    try {
      await onCreate(columnId)
      onClose()
    } catch (failure) {
      setError(errorMessage(failure))
      setSaving(false)
    }
  }

  return (
    <Modal title="Make card" onClose={onClose}>
      <form
        className={form.form}
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
      >
        <p className={styles.card}>
          <span className={styles.cardLabel}>Title</span>
          {item.text}
        </p>

        <div className={form.row}>
          <label className={form.field}>
            Board
            <select
              data-autofocus
              value={boardId ?? ''}
              disabled={!boards || boards.length === 0}
              onChange={(event) => setBoardId(Number(event.target.value))}
            >
              {boards?.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
          <label className={form.field}>
            Column
            <select
              value={columnId ?? ''}
              disabled={!currentBoard || currentBoard.columns.length === 0}
              onChange={(event) => setColumnId(Number(event.target.value))}
            >
              {currentBoard?.columns.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {boards?.length === 0 && <p className={form.hint}>Create a board first.</p>}
        {error && (
          <p className={styles.problem} role="alert">
            {error}
          </p>
        )}

        <ModalActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={columnId === null || !currentBoard || saving}>
            Create card
          </Button>
        </ModalActions>
      </form>
    </Modal>
  )
}
