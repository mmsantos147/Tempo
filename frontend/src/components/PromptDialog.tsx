import { useState } from 'react'
import { Button } from './Button'
import form from './Form.module.css'
import { Modal, ModalActions } from './Modal'

interface PromptDialogProps {
  title: string
  label: string
  initialValue?: string
  confirmLabel?: string
  maxLength?: number
  onSubmit: (value: string) => void
  onClose: () => void
}

export function PromptDialog({
  title,
  label,
  initialValue = '',
  confirmLabel = 'Save',
  maxLength = 100,
  onSubmit,
  onClose,
}: PromptDialogProps) {
  const [value, setValue] = useState(initialValue)
  const trimmed = value.trim()

  return (
    <Modal title={title} onClose={onClose}>
      <form
        className={form.form}
        onSubmit={(event) => {
          event.preventDefault()
          if (!trimmed) return
          onSubmit(trimmed)
          onClose()
        }}
      >
        <label className={form.field}>
          {label}
          <input data-autofocus value={value} maxLength={maxLength} onChange={(event) => setValue(event.target.value)} />
        </label>
        <ModalActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={!trimmed}>
            {confirmLabel}
          </Button>
        </ModalActions>
      </form>
    </Modal>
  )
}
