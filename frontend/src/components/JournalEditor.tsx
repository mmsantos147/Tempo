import type { SaveStatus } from '../hooks/useJournal'
import type { JournalTexts } from '../types'
import { AutoTextarea } from './AutoTextarea'
import styles from './JournalEditor.module.css'

const STATUS_LABEL: Record<SaveStatus, string> = {
  idle: '',
  pending: 'Unsaved changes',
  saving: 'Saving…',
  saved: 'Saved',
  error: 'Not saved',
}

interface JournalEditorProps {
  texts: JournalTexts
  disabled: boolean
  saveStatus: SaveStatus
  onChange: (field: keyof JournalTexts, value: string) => void
  onBlur: () => void
}

export function JournalEditor({ texts, disabled, saveStatus, onChange, onBlur }: JournalEditorProps) {
  return (
    <div className={styles.editor}>
      <p className={`${styles.status} ${saveStatus === 'error' ? styles.error : ''}`} role="status" aria-live="polite">
        {STATUS_LABEL[saveStatus]}
      </p>

      <section className={styles.section}>
        <label className={styles.label} htmlFor="journal-what-i-did">
          What I did
        </label>
        <AutoTextarea
          id="journal-what-i-did"
          className={styles.text}
          placeholder="Write freely about your day…"
          rows={4}
          maxLength={50000}
          disabled={disabled}
          value={texts.whatIDid}
          onChange={(event) => onChange('whatIDid', event.target.value)}
          onBlur={onBlur}
        />
      </section>

      <section className={styles.section}>
        <label className={styles.label} htmlFor="journal-how-i-felt">
          How I felt
        </label>
        <AutoTextarea
          id="journal-how-i-felt"
          className={styles.text}
          placeholder="Energy, mood, what helped, what got in the way…"
          rows={3}
          maxLength={50000}
          disabled={disabled}
          value={texts.howIFelt}
          onChange={(event) => onChange('howIFelt', event.target.value)}
          onBlur={onBlur}
        />
      </section>
    </div>
  )
}
