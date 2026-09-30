import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Card, CardTime, ColumnDetail } from '../types'
import { cardDndId, columnDndId } from '../utils/dnd'
import { AddCardForm } from './AddCardForm'
import { Button } from './Button'
import { Icon } from './Icon'
import { SortableCard } from './SortableCard'
import styles from './ColumnView.module.css'

interface ColumnViewProps {
  column: ColumnDetail
  times: Record<number, CardTime>
  isFirst: boolean
  isLast: boolean
  onOpenCard: (card: Card) => void
  onStartTimer: (cardId: number) => Promise<void>
  onStopTimer: (cardId: number) => Promise<void>
  onAddCard: (title: string) => Promise<void>
  onRename: () => void
  onDelete: () => void
  onMove: (direction: -1 | 1) => void
}

export function ColumnView({
  column,
  times,
  isFirst,
  isLast,
  onOpenCard,
  onStartTimer,
  onStopTimer,
  onAddCard,
  onRename,
  onDelete,
  onMove,
}: ColumnViewProps) {
  const { setNodeRef, isOver } = useDroppable({ id: columnDndId(column.id) })

  return (
    <section className={styles.column}>
      <header className={styles.header}>
        <h2 className={styles.name} title={column.name} onDoubleClick={onRename}>
          {column.name}
        </h2>
        <span className={styles.count}>{column.cards.length}</span>
        <div className={styles.actions}>
          <Button variant="ghost" iconOnly aria-label="Move column left" disabled={isFirst} onClick={() => onMove(-1)}>
            <Icon name="left" size={14} />
          </Button>
          <Button variant="ghost" iconOnly aria-label="Move column right" disabled={isLast} onClick={() => onMove(1)}>
            <Icon name="right" size={14} />
          </Button>
          <Button variant="ghost" iconOnly aria-label="Rename column" onClick={onRename}>
            <Icon name="edit" size={14} />
          </Button>
          <Button variant="ghost" iconOnly aria-label="Delete column" onClick={onDelete}>
            <Icon name="trash" size={14} />
          </Button>
        </div>
      </header>

      <SortableContext items={column.cards.map((card) => cardDndId(card.id))} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className={`${styles.cards} ${isOver ? styles.over : ''}`}>
          {column.cards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              time={times[card.id]}
              onOpen={() => onOpenCard(card)}
              onStartTimer={() => onStartTimer(card.id)}
              onStopTimer={() => onStopTimer(card.id)}
            />
          ))}
        </div>
      </SortableContext>

      <AddCardForm onAdd={onAddCard} />
    </section>
  )
}
