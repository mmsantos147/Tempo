import { Button } from './Button'
import form from './Form.module.css'
import { Modal, ModalActions } from './Modal'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onClose }: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className={form.message}>{message}</p>
      <ModalActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="danger"
          data-autofocus
          onClick={() => {
            onConfirm()
            onClose()
          }}
        >
          {confirmLabel}
        </Button>
      </ModalActions>
    </Modal>
  )
}
