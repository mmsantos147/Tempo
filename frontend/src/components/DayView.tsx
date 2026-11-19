import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useDayEntries } from '../hooks/useDayEntries'
import { useNow } from '../hooks/useNow'
import type { TimeEntry, TimeEntryInput } from '../types'
import { formatDuration } from '../utils/format'
import { addDays, formatLongDate, formatTime, todayInAppZone } from '../utils/time'
import { Button } from './Button'
import { Icon } from './Icon'
import { TimeEntryForm } from './TimeEntryForm'
import styles from './DayView.module.css'

type EntryDialog = { kind: 'create' } | { kind: 'edit'; entry: TimeEntry } | null

function durationSeconds(entry: TimeEntry, now: number): number {
  const end = entry.endedAt ? Date.parse(entry.endedAt) : now
  return Math.max(0, (end - Date.parse(entry.startedAt)) / 1000)
}

export function DayView({ date }: { date: string }) {
  const navigate = useNavigate()
  const { entries, loading, failed, create, update } = useDayEntries(date)
  const [dialog, setDialog] = useState<EntryDialog>(null)
  const hasRunning = entries?.some((entry) => entry.endedAt === null) ?? false
  const now = useNow(hasRunning)

  const today = todayInAppZone()
  const goTo = (target: string) => navigate(`/day/${target}`)
  const total = entries?.reduce((sum, entry) => sum + durationSeconds(entry, now), 0) ?? 0

  const followDate = (input: TimeEntryInput) => {
    if (input.date !== date) goTo(input.date)
  }

  return (
    <section className={styles.day}>
      <div className={styles.toolbar}>
        <div className={styles.navigation}>
          <Button variant="ghost" iconOnly aria-label="Previous day" title="Previous day" onClick={() => goTo(addDays(date, -1))}>
            <Icon name="left" />
          </Button>
          <h1 className={styles.title}>{formatLongDate(date)}</h1>
          <Button
            variant="ghost"
            iconOnly
            aria-label="Next day"
            title="Next day"
            disabled={date >= today}
            onClick={() => goTo(addDays(date, 1))}
          >
            <Icon name="right" />
          </Button>
        </div>
        <div className={styles.controls}>
          <input
            type="date"
            aria-label="Go to date"
            max={today}
            value={date}
            onChange={(event) => {
              if (event.target.value) goTo(event.target.value)
            }}
          />
          <Button disabled={date === today} onClick={() => goTo(today)}>
            Today
          </Button>
          <Button variant="primary" onClick={() => setDialog({ kind: 'create' })}>
            <Icon name="plus" size={14} />
            Log time
          </Button>
        </div>
      </div>

      {loading && <p className={styles.message}>Loading…</p>}
      {failed && <p className={styles.message}>Could not load the entries of this day.</p>}
      {entries && entries.length === 0 && <p className={styles.message}>No time logged on this day.</p>}

      {entries && entries.length > 0 && (
        <>
          <ul className={styles.list}>
            {entries.map((entry) => {
              const running = entry.endedAt === null
              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    className={`${styles.entry} ${running ? styles.running : ''}`}
                    disabled={running}
                    title={running ? 'Stop the timer to edit this entry' : 'Edit entry'}
                    onClick={() => setDialog({ kind: 'edit', entry })}
                  >
                    <span className={styles.range}>
                      {formatTime(entry.startedAt)} – {running ? 'now' : formatTime(entry.endedAt!)}
                    </span>
                    <span className={styles.details}>
                      <span className={styles.cardTitle}>{entry.cardTitle}</span>
                      {entry.description && <span className={styles.description}>{entry.description}</span>}
                    </span>
                    <span className={styles.duration}>
                      {running && <span className={styles.badge}>Running</span>}
                      {formatDuration(durationSeconds(entry, now))}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          <p className={styles.total}>
            <span>Total</span>
            <span className={styles.totalValue}>{formatDuration(total)}</span>
          </p>
        </>
      )}

      {dialog?.kind === 'create' && (
        <TimeEntryForm
          defaultDate={date}
          onSubmit={async (cardId, input) => {
            await create(cardId, input)
            followDate(input)
          }}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog?.kind === 'edit' && (
        <TimeEntryForm
          entry={dialog.entry}
          onSubmit={async (_cardId, input) => {
            await update(dialog.entry.id, input)
            followDate(input)
          }}
          onClose={() => setDialog(null)}
        />
      )}
    </section>
  )
}
