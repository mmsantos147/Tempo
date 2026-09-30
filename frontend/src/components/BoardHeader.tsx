import { useState } from 'react'
import type { BoardSummary } from '../types'
import { Button } from './Button'
import { ConfirmDialog } from './ConfirmDialog'
import { Icon } from './Icon'
import { PromptDialog } from './PromptDialog'
import styles from './BoardHeader.module.css'

type BoardDialog = 'create' | 'rename' | 'delete' | null

interface BoardHeaderProps {
  boards: BoardSummary[]
  selectedId: number | null
  onSelect: (id: number) => void
  onCreate: (name: string) => Promise<void>
  onRename: (id: number, name: string) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

export function BoardHeader({ boards, selectedId, onSelect, onCreate, onRename, onDelete }: BoardHeaderProps) {
  const [dialog, setDialog] = useState<BoardDialog>(null)
  const selected = boards.find((board) => board.id === selectedId)

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <Icon name="clock" size={20} />
        Tempo
      </div>

      {boards.length > 0 && (
        <select
          className={styles.select}
          aria-label="Board"
          value={selectedId ?? ''}
          onChange={(event) => onSelect(Number(event.target.value))}
        >
          {boards.map((board) => (
            <option key={board.id} value={board.id}>
              {board.name}
            </option>
          ))}
        </select>
      )}

      <div className={styles.actions}>
        {selected && (
          <>
            <Button variant="ghost" iconOnly aria-label="Rename board" title="Rename board" onClick={() => setDialog('rename')}>
              <Icon name="edit" />
            </Button>
            <Button variant="ghost" iconOnly aria-label="Delete board" title="Delete board" onClick={() => setDialog('delete')}>
              <Icon name="trash" />
            </Button>
          </>
        )}
        <Button variant="primary" onClick={() => setDialog('create')}>
          <Icon name="plus" size={14} />
          New board
        </Button>
      </div>

      {dialog === 'create' && (
        <PromptDialog
          title="New board"
          label="Name"
          confirmLabel="Create"
          onSubmit={(name) => void onCreate(name)}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog === 'rename' && selected && (
        <PromptDialog
          title="Rename board"
          label="Name"
          initialValue={selected.name}
          onSubmit={(name) => void onRename(selected.id, name)}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog === 'delete' && selected && (
        <ConfirmDialog
          title="Delete board"
          message={`Delete "${selected.name}" with all its columns, cards and tracked time?`}
          onConfirm={() => void onDelete(selected.id)}
          onClose={() => setDialog(null)}
        />
      )}
    </header>
  )
}
