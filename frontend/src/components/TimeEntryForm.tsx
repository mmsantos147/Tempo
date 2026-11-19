import { useState } from 'react'
import { errorMessage } from '../api/client'
import type { TimeEntry, TimeEntryInput } from '../types'
import { formatMinutes } from '../utils/format'
import { formatLongDate, minutesBetween, nowTimeInAppZone, todayInAppZone, zonedParts } from '../utils/time'
import { Button } from './Button'
import { CardPicker } from './CardPicker'
import form from './Form.module.css'
import { Modal, ModalActions } from './Modal'
import styles from './TimeEntryForm.module.css'

interface TimeEntryFormProps {
  entry?: TimeEntry
  card?: { id: number; title: string }
  defaultDate?: string
  onSubmit: (cardId: number, input: TimeEntryInput) => Promise<void>
  onClose: () => void
}

function initialValues(entry: TimeEntry | undefined, defaultDate: string | undefined) {
  if (!entry) {
    return { date: defaultDate ?? todayInAppZone(), startTime: '', endTime: '', endDate: null, description: '' }
  }
  const start = zonedParts(entry.startedAt)
  const end = entry.endedAt ? zonedParts(entry.endedAt) : null
  return {
    date: start.date,
    startTime: start.time,
    endTime: end?.time ?? '',
    endDate: end && end.date !== start.date ? end.date : null,
    description: entry.description ?? '',
  }
}

export function TimeEntryForm({ entry, card, defaultDate, onSubmit, onClose }: TimeEntryFormProps) {
  const [initial] = useState(() => initialValues(entry, defaultDate))
  const [cardId, setCardId] = useState<number | null>(entry?.cardId ?? card?.id ?? null)
  const [date, setDate] = useState(initial.date)
  const [startTime, setStartTime] = useState(initial.startTime)
  const [endTime, setEndTime] = useState(initial.endTime)
  const [description, setDescription] = useState(initial.description)
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const today = todayInAppZone()
  const filled = cardId !== null && date !== '' && startTime !== '' && endTime !== ''
  const minutes = startTime && endTime ? minutesBetween(startTime, endTime) : null

  let problem: string | null = null
  if (date > today) problem = 'The date cannot be in the future.'
  else if (minutes !== null && minutes <= 0) problem = 'End must be after start.'
  else if (date === today && endTime !== '' && endTime > nowTimeInAppZone()) problem = 'The end cannot be in the future.'

  const cardTitle = entry?.cardTitle ?? card?.title

  const submit = async () => {
    if (cardId === null) return
    setSaving(true)
    setServerError(null)
    try {
      await onSubmit(cardId, {
        date,
        startTime,
        endTime,
        description: description.trim() === '' ? null : description.trim(),
      })
      onClose()
    } catch (error) {
      setServerError(errorMessage(error))
      setSaving(false)
    }
  }

  const message = problem ?? serverError

  return (
    <Modal title={entry ? 'Edit time entry' : 'Log time'} onClose={onClose}>
      <form
        className={form.form}
        onSubmit={(event) => {
          event.preventDefault()
          if (filled && !problem) void submit()
        }}
      >
        {cardTitle ? (
          <p className={styles.card}>
            <span className={styles.cardLabel}>Card</span>
            {cardTitle}
          </p>
        ) : (
          <CardPicker cardId={cardId} onChange={setCardId} />
        )}

        <label className={form.field}>
          Day
          <input
            type="date"
            required
            max={today}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            data-autofocus={cardTitle ? true : undefined}
          />
        </label>

        <div className={form.row}>
          <label className={form.field}>
            Start
            <input type="time" required value={startTime} onChange={(event) => setStartTime(event.target.value)} />
          </label>
          <label className={form.field}>
            End
            <input type="time" required value={endTime} onChange={(event) => setEndTime(event.target.value)} />
          </label>
        </div>

        {initial.endDate && (
          <p className={form.hint}>
            This entry ended on {formatLongDate(initial.endDate)}. Entries saved here start and end on the same day.
          </p>
        )}

        <label className={form.field}>
          Description
          <textarea rows={2} maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>

        <p className={message ? styles.problem : styles.summary} role={message ? 'alert' : undefined}>
          {message ?? (minutes !== null && minutes > 0 ? `Duration: ${formatMinutes(minutes)}` : 'Times are in São Paulo time.')}
        </p>

        <ModalActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={!filled || problem !== null || saving}>
            Save
          </Button>
        </ModalActions>
      </form>
    </Modal>
  )
}
