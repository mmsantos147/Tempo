import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useRef, useState } from 'react'
import { useBoard } from '../hooks/useBoard'
import { useCardTimes } from '../hooks/useCardTimes'
import type { ColumnDetail } from '../types'
import { allCardIds, findCard } from '../utils/columns'
import { parseDndId } from '../utils/dnd'
import { Button } from './Button'
import { CardContent } from './CardContent'
import { CardModal } from './CardModal'
import { ColumnView } from './ColumnView'
import { ConfirmDialog } from './ConfirmDialog'
import { Icon } from './Icon'
import { PromptDialog } from './PromptDialog'
import styles from './BoardView.module.css'

type ColumnDialog =
  | { kind: 'add' }
  | { kind: 'rename'; column: ColumnDetail }
  | { kind: 'delete'; column: ColumnDetail }
  | null

interface Location {
  columnIndex: number
  cardIndex: number
}

interface DragOrigin {
  columns: ColumnDetail[]
  columnId: number
  cardIndex: number
}

function locate(columns: ColumnDetail[], dndId: UniqueIdentifier): Location | null {
  const parsed = parseDndId(dndId)
  if (!parsed) return null

  if (parsed.type === 'column') {
    const columnIndex = columns.findIndex((column) => column.id === parsed.id)
    return columnIndex < 0 ? null : { columnIndex, cardIndex: columns[columnIndex].cards.length }
  }

  for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
    const cardIndex = columns[columnIndex].cards.findIndex((card) => card.id === parsed.id)
    if (cardIndex >= 0) return { columnIndex, cardIndex }
  }
  return null
}

export function BoardView({ boardId }: { boardId: number }) {
  const {
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
  } = useBoard(boardId)
  const columns = board?.columns ?? []
  const { times, start, stop } = useCardTimes(allCardIds(columns))

  const [openCardId, setOpenCardId] = useState<number | null>(null)
  const [columnDialog, setColumnDialog] = useState<ColumnDialog>(null)
  const [activeCardId, setActiveCardId] = useState<number | null>(null)
  const dragOrigin = useRef<DragOrigin | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragStart = ({ active }: DragStartEvent) => {
    const from = locate(columns, active.id)
    if (!from) return
    dragOrigin.current = { columns, columnId: columns[from.columnIndex].id, cardIndex: from.cardIndex }
    setActiveCardId(parseDndId(active.id)?.id ?? null)
  }

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return
    setColumns((current) => {
      const from = locate(current, active.id)
      const to = locate(current, over.id)
      if (!from || !to || from.columnIndex === to.columnIndex) return current

      const next = current.map((column) => ({ ...column, cards: [...column.cards] }))
      const [moving] = next[from.columnIndex].cards.splice(from.cardIndex, 1)
      next[to.columnIndex].cards.splice(to.cardIndex, 0, moving)
      return next
    })
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const origin = dragOrigin.current
    dragOrigin.current = null
    setActiveCardId(null)
    if (!origin) return

    const from = locate(columns, active.id)
    const to = over ? locate(columns, over.id) : null
    const cardId = parseDndId(active.id)?.id
    if (!over || !from || !to || cardId === undefined) {
      setColumns(() => origin.columns)
      return
    }

    let next = columns
    const overIsCard = parseDndId(over.id)?.type === 'card'
    if (from.columnIndex === to.columnIndex && overIsCard && from.cardIndex !== to.cardIndex) {
      next = columns.map((column, index) =>
        index === from.columnIndex ? { ...column, cards: arrayMove(column.cards, from.cardIndex, to.cardIndex) } : column,
      )
      setColumns(() => next)
    }

    const final = locate(next, active.id)!
    const finalColumnId = next[final.columnIndex].id
    if (finalColumnId !== origin.columnId || final.cardIndex !== origin.cardIndex) {
      void persistCardMove(cardId, finalColumnId, final.cardIndex)
    }
  }

  const handleDragCancel = () => {
    const origin = dragOrigin.current
    dragOrigin.current = null
    setActiveCardId(null)
    if (origin) setColumns(() => origin.columns)
  }

  if (!board) {
    return <p className={styles.loading}>Loading board…</p>
  }

  const activeCard = activeCardId === null ? undefined : findCard(columns, activeCardId)
  const openCard = openCardId === null ? undefined : findCard(columns, openCardId)
  const noop = async () => {}

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className={styles.board}>
          {columns.map((column, index) => (
            <ColumnView
              key={column.id}
              column={column}
              times={times}
              isFirst={index === 0}
              isLast={index === columns.length - 1}
              onOpenCard={(card) => setOpenCardId(card.id)}
              onStartTimer={start}
              onStopTimer={stop}
              onAddCard={(title) => createCard(column.id, { title, description: null, estimatedMinutes: null })}
              onRename={() => setColumnDialog({ kind: 'rename', column })}
              onDelete={() => setColumnDialog({ kind: 'delete', column })}
              onMove={(direction) => void moveColumn(column.id, index + direction)}
            />
          ))}
          <Button className={styles.addColumn} onClick={() => setColumnDialog({ kind: 'add' })}>
            <Icon name="plus" size={14} />
            Add column
          </Button>
        </div>

        <DragOverlay>
          {activeCard && (
            <CardContent card={activeCard} time={times[activeCard.id]} onStartTimer={noop} onStopTimer={noop} overlay />
          )}
        </DragOverlay>
      </DndContext>

      {openCard && (
        <CardModal
          key={openCard.id}
          card={openCard}
          time={times[openCard.id]}
          onSave={(input) => updateCard(openCard.id, input)}
          onToggleCompleted={() => setCardCompleted(openCard.id, openCard.completedAt === null)}
          onDelete={() => removeCard(openCard.id)}
          onStartTimer={() => start(openCard.id)}
          onStopTimer={() => stop(openCard.id)}
          onClose={() => setOpenCardId(null)}
        />
      )}

      {columnDialog?.kind === 'add' && (
        <PromptDialog
          title="Add column"
          label="Name"
          confirmLabel="Add"
          onSubmit={(name) => void createColumn(name)}
          onClose={() => setColumnDialog(null)}
        />
      )}

      {columnDialog?.kind === 'rename' && (
        <PromptDialog
          title="Rename column"
          label="Name"
          initialValue={columnDialog.column.name}
          onSubmit={(name) => void renameColumn(columnDialog.column.id, name)}
          onClose={() => setColumnDialog(null)}
        />
      )}

      {columnDialog?.kind === 'delete' && (
        <ConfirmDialog
          title="Delete column"
          message={
            columnDialog.column.cards.length > 0
              ? `Delete "${columnDialog.column.name}" and its ${columnDialog.column.cards.length} card(s), including all tracked time?`
              : `Delete "${columnDialog.column.name}"?`
          }
          onConfirm={() => void removeColumn(columnDialog.column.id)}
          onClose={() => setColumnDialog(null)}
        />
      )}
    </>
  )
}
