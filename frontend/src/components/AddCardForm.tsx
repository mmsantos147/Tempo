import { useState } from 'react'
import { Button } from './Button'
import { Icon } from './Icon'
import styles from './AddCardForm.module.css'

interface AddCardFormProps {
  onAdd: (title: string) => Promise<void>
}

export function AddCardForm({ onAdd }: AddCardFormProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const trimmed = title.trim()

  const close = () => {
    setOpen(false)
    setTitle('')
  }

  const submit = async () => {
    if (!trimmed || saving) return
    setSaving(true)
    setTitle('')
    try {
      await onAdd(trimmed)
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <Button variant="ghost" className={styles.openButton} onClick={() => setOpen(true)}>
        <Icon name="plus" size={14} />
        Add card
      </Button>
    )
  }

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <textarea
        autoFocus
        rows={2}
        maxLength={200}
        placeholder="Card title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            void submit()
          }
          if (event.key === 'Escape') close()
        }}
      />
      <div className={styles.actions}>
        <Button type="submit" variant="primary" disabled={!trimmed || saving}>
          Add
        </Button>
        <Button variant="ghost" iconOnly aria-label="Cancel" onClick={close}>
          <Icon name="close" />
        </Button>
      </div>
    </form>
  )
}
