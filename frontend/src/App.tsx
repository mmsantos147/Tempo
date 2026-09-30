import { BoardHeader } from './components/BoardHeader'
import { BoardView } from './components/BoardView'
import { useBoards } from './hooks/useBoards'
import styles from './App.module.css'

export default function App() {
  const { boards, selectedId, loading, select, create, rename, remove } = useBoards()

  return (
    <div className={styles.app}>
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
        {!loading && selectedId !== null && <BoardView key={selectedId} boardId={selectedId} />}
      </main>
    </div>
  )
}
