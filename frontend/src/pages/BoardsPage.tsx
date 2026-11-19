import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { BoardHeader } from '../components/BoardHeader'
import { BoardView } from '../components/BoardView'
import { useBoards } from '../hooks/useBoards'
import styles from './Page.module.css'

function readId(value: string | null): number | null {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

export function BoardsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [linked] = useState(() => ({ boardId: readId(searchParams.get('board')), cardId: readId(searchParams.get('card')) }))
  const { boards, selectedId, loading, select, create, rename, remove } = useBoards(linked.boardId)

  useEffect(() => {
    if (searchParams.has('board') || searchParams.has('card')) setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams])

  return (
    <>
      <BoardHeader
        boards={boards}
        selectedId={selectedId}
        onSelect={select}
        onCreate={create}
        onRename={rename}
        onDelete={remove}
      />
      <main className={styles.main}>
        {loading && <p className={styles.message}>Loading…</p>}
        {!loading && selectedId === null && (
          <p className={styles.message}>No boards yet. Use “New board” to create one.</p>
        )}
        {!loading && selectedId !== null && <BoardView
            key={selectedId}
            boardId={selectedId}
            initialCardId={selectedId === linked.boardId ? linked.cardId : null}
          />}
      </main>
    </>
  )
}
