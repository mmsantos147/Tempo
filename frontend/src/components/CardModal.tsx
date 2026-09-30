import { useState } from 'react'
import type { Card, CardInput, CardTime } from '../types'
import { Button } from './Button'
import { CardTimer } from './CardTimer'
import { ConfirmDialog } from './ConfirmDialog'
import form from './Form.module.css'
import { Icon } from './Icon'
import { Modal, ModalActions } from './Modal'
import styles from './CardModal.module.css'

interface CardModalProps {
  card: Card
  time: CardTime | undefined
  onSave: (input: CardInput) => Promise<boolean>
  onToggleCompleted: () => Promise<void>
  onDelete: () => Promise<void>
  onStartTimer: () => Promise<void>
  onStopTimer: () => Promise<void>
  onClose: () => void
}

export function CardModal({
  card,
  time,
  onSave,
  onToggleCompleted,
  onDelete,
  onStartTimer,
  onStopTimer,
  onClose,
}: CardModalProps) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description ?? '')
  const [estimate, setEstimate] = useState(card.estimatedMinutes?.toString() ?? '')
  const [saving, setSaving] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const completed = card.completedAt !== null
  const trimmedTitle = title.trim()
  const estimateValue = estimate.trim() === '' ? null : Number(estimate)
  const estimateValid = estimateValue === null || (Number.isInteger(estimateValue) && estimateValue >= 0)

  const save = async () => {
    setSaving(true)
    const saved = await onSave({
      title: trimmedTitle,
      description: description.trim() === '' ? null : description,
      estimatedMinutes: estimateValue,
    })
    setSaving(false)
    if (saved) onClose()
  }

  return (
    <Modal title="Edit card" onClose={onClose} wide>
      <form
        className={form.form}
        onSubmit={(event) => {
          event.preventDefault()
          if (trimmedTitle && estimateValid) void save()
        }}
      >
        <div className={styles.timeBox}>
          <span className={styles.timeLabel}>Time tracked</span>
          <CardTimer time={time} onStart={onStartTimer} onStop={onStopTimer} large />
        </div>

        <label className={form.field}>
          Title
          <input data-autofocus value={title} maxLength={200} onChange={(event) => setTitle(event.target.value)} />
        </label>

        <label className={form.field}>
          Description
          <textarea
            rows={5}
            maxLength={10000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>

        <label className={form.field}>
          Estimate (minutes)
          <input
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={estimate}
            onChange={(event) => setEstimate(event.target.value)}
          />
          {!estimateValid && <span className={form.hint}>Use a whole number of minutes, 0 or more.</span>}
        </label>

        <div className={styles.footer}>
          <div className={styles.secondaryActions}>
            <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
              <Icon name="trash" size={14} />
              Delete
            </Button>
            <Button onClick={() => void onToggleCompleted()}>
              <Icon name="check" size={14} />
              {completed ? 'Reopen' : 'Mark complete'}
            </Button>
          </div>
          <ModalActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={!trimmedTitle || !estimateValid || saving}>
              Save
            </Button>
          </ModalActions>
        </div>
      </form>

      {confirmingDelete && (
        <ConfirmDialog
          title="Delete card"
          message={`Delete "${card.title}" and all of its tracked time?`}
          onConfirm={() => {
            void onDelete()
            onClose()
          }}
          onClose={() => setConfirmingDelete(false)}
        />
      )}
    </Modal>
  )
}
