import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Card, CardTime } from '../types'
import { cardDndId } from '../utils/dnd'
import { CardContent } from './CardContent'
import styles from './SortableCard.module.css'

interface SortableCardProps {
  card: Card
  time: CardTime | undefined
  onOpen: () => void
  onStartTimer: () => Promise<void>
  onStopTimer: () => Promise<void>
}

export function SortableCard({ card, time, onOpen, onStartTimer, onStopTimer }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: cardDndId(card.id),
  })

  return (
    <div
      ref={setNodeRef}
      className={`${styles.wrapper} ${isDragging ? styles.dragging : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={onOpen}
    >
      <CardContent card={card} time={time} onStartTimer={onStartTimer} onStopTimer={onStopTimer} />
    </div>
  )
}
