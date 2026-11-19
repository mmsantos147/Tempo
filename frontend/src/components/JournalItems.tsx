import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import { Link } from 'react-router'
import type { JournalItem } from '../types'
import { Button } from './Button'
import { Icon } from './Icon'
import { MakeCardDialog } from './MakeCardDialog'
import styles from './JournalItems.module.css'

interface JournalItemsProps {
  items: JournalItem[]
  disabled: boolean
  onAdd: (text: string) => Promise<boolean>
  onUpdate: (id: number, text: string) => Promise<void>
  onMove: (id: number, position: number) => Promise<void>
  onRemove: (id: number) => Promise<void>
  onCreateCard: (id: number, columnId: number) => Promise<void>
}

export function JournalItems({ items, disabled, onAdd, onUpdate, onMove, onRemove, onCreateCard }: JournalItemsProps) {
  const [draft, setDraft] = useState('')
  const [adding, setAdding] = useState(false)
  const [cardItem, setCardItem] = useState<JournalItem | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const position = items.findIndex((item) => item.id === over.id)
    if (position >= 0) void onMove(Number(active.id), position)
  }

  const add = async () => {
    const text = draft.trim()
    if (!text) return
    setAdding(true)
    if (await onAdd(text)) setDraft('')
    setAdding(false)
  }

  return (
    <section className={styles.panel} aria-labelledby="journal-want-to-do">
      <h2 id="journal-want-to-do" className={styles.title}>
        Want to do
      </h2>

      {items.length === 0 && <p className={styles.empty}>Nothing planned yet.</p>}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <ul className={styles.list}>
            {items.map((item) => (
              <JournalItemRow
                key={item.id}
                item={item}
                onUpdate={(text) => onUpdate(item.id, text)}
                onRemove={() => void onRemove(item.id)}
                onMakeCard={() => setCardItem(item)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <form
        className={styles.addForm}
        onSubmit={(event) => {
          event.preventDefault()
          void add()
        }}
      >
        <input
          className={styles.addInput}
          aria-label="New item"
          placeholder="Add something you want to do"
          maxLength={200}
          disabled={disabled}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button type="submit" iconOnly aria-label="Add item" disabled={disabled || adding || !draft.trim()}>
          <Icon name="plus" size={14} />
        </Button>
      </form>

      {cardItem && (
        <MakeCardDialog
          item={cardItem}
          onCreate={(columnId) => onCreateCard(cardItem.id, columnId)}
          onClose={() => setCardItem(null)}
        />
      )}
    </section>
  )
}

interface JournalItemRowProps {
  item: JournalItem
  onUpdate: (text: string) => Promise<void>
  onRemove: () => void
  onMakeCard: () => void
}

function JournalItemRow({ item, onUpdate, onRemove, onMakeCard }: JournalItemRowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.text)

  const commit = () => {
    const text = draft.trim()
    setEditing(false)
    if (text && text !== item.text) void onUpdate(text)
    else setDraft(item.text)
  }

  const card = item.card

  return (
    <li
      ref={setNodeRef}
      className={`${styles.item} ${isDragging ? styles.dragging : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className={styles.handle}
        aria-label={`Reorder "${item.text}"`}
        {...attributes}
        {...listeners}
      >
        <Icon name="grip" size={14} />
      </button>

      {editing ? (
        <input
          className={styles.editInput}
          aria-label="Item text"
          autoFocus
          maxLength={200}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              commit()
            }
            if (event.key === 'Escape') {
              event.preventDefault()
              setDraft(item.text)
              setEditing(false)
            }
          }}
        />
      ) : (
        <button type="button" className={`${styles.text} ${card?.completedAt ? styles.textDone : ''}`} onClick={() => setEditing(true)}>
          {item.text}
        </button>
      )}

      <div className={styles.actions}>
        {card ? (
          <Link
            to={`/?board=${card.boardId}&card=${card.id}`}
            className={`${styles.badge} ${card.completedAt ? styles.badgeDone : ''}`}
            title={`Open card "${card.title}"`}
          >
            {card.completedAt && <Icon name="check" size={12} />}
            {card.completedAt ? 'Done' : 'Card'}
          </Link>
        ) : (
          <Button variant="ghost" className={styles.makeCard} onClick={onMakeCard}>
            Make card
          </Button>
        )}
        <Button variant="ghost" iconOnly aria-label={`Delete "${item.text}"`} onClick={onRemove}>
          <Icon name="trash" size={14} />
        </Button>
      </div>
    </li>
  )
}
