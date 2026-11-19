import { Link } from 'react-router'
import { useDayEntries } from '../hooks/useDayEntries'
import { useNow } from '../hooks/useNow'
import type { TimeEntry } from '../types'
import { formatDuration } from '../utils/format'
import { formatTime } from '../utils/time'
import styles from './DayEntriesPanel.module.css'

function seconds(entry: TimeEntry, now: number): number {
  const end = entry.endedAt ? Date.parse(entry.endedAt) : now
  return Math.max(0, (end - Date.parse(entry.startedAt)) / 1000)
}

export function DayEntriesPanel({ date }: { date: string }) {
  const { entries, loading, failed } = useDayEntries(date)
  const now = useNow(entries?.some((entry) => entry.endedAt === null) ?? false)
  const total = entries?.reduce((sum, entry) => sum + seconds(entry, now), 0) ?? 0

  return (
    <section className={styles.panel} aria-labelledby="journal-time">
      <header className={styles.header}>
        <h2 id="journal-time" className={styles.title}>
          Time tracked
        </h2>
        <Link to={`/day/${date}`} className={styles.link}>
          Day view
        </Link>
      </header>

      {loading && <p className={styles.message}>Loading…</p>}
      {failed && <p className={styles.message}>Could not load the entries.</p>}
      {entries && entries.length === 0 && <p className={styles.message}>No time logged.</p>}

      {entries && entries.length > 0 && (
        <>
          <ul className={styles.list}>
            {entries.map((entry) => (
              <li key={entry.id} className={`${styles.entry} ${entry.endedAt ? '' : styles.running}`}>
                <span className={styles.range}>
                  {formatTime(entry.startedAt)}–{entry.endedAt ? formatTime(entry.endedAt) : 'now'}
                </span>
                <span className={styles.card} title={entry.description ?? undefined}>
                  {entry.cardTitle}
                </span>
                <span className={styles.duration}>{formatDuration(seconds(entry, now))}</span>
              </li>
            ))}
          </ul>
          <p className={styles.total}>
            <span>Total</span>
            <span className={styles.duration}>{formatDuration(total)}</span>
          </p>
        </>
      )}
    </section>
  )
}
