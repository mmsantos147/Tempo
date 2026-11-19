import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useJournal } from '../hooks/useJournal'
import { useJournalDates } from '../hooks/useJournalDates'
import { addDays, formatLongDate, monthOf, todayInAppZone } from '../utils/time'
import { Button } from './Button'
import { DayEntriesPanel } from './DayEntriesPanel'
import { Icon } from './Icon'
import { JournalEditor } from './JournalEditor'
import { JournalItems } from './JournalItems'
import { MonthCalendar } from './MonthCalendar'
import styles from './JournalView.module.css'

const FOCUS_KEY = 'tempo.journalFocus'

function readFocus(): boolean {
  try {
    return window.localStorage.getItem(FOCUS_KEY) === 'true'
  } catch {
    return false
  }
}

function saveFocus(focus: boolean): void {
  try {
    window.localStorage.setItem(FOCUS_KEY, String(focus))
  } catch {
    return
  }
}

export function JournalView({ date }: { date: string }) {
  const navigate = useNavigate()
  const today = todayInAppZone()
  const journal = useJournal(date)
  const [month, setMonth] = useState(monthOf(date))
  const dates = useJournalDates(month)
  const [focus, setFocus] = useState(readFocus)

  const marked = dates && journal.exists && monthOf(date) === month ? new Set([...dates, date]) : dates
  const unavailable = journal.loading || journal.failed
  const goTo = (target: string) => navigate(`/journal/${target}`)

  const toggleFocus = () => {
    setFocus((current) => {
      saveFocus(!current)
      return !current
    })
  }

  return (
    <div className={`${styles.journal} ${focus ? styles.focus : ''}`}>
      {!focus && (
        <aside className={styles.side}>
          <MonthCalendar
            month={month}
            selected={date}
            today={today}
            marked={marked}
            onMonthChange={setMonth}
            onSelect={goTo}
          />
          <DayEntriesPanel date={date} />
        </aside>
      )}

      <article className={styles.main}>
        <header className={styles.header}>
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
          <div className={styles.headerActions}>
            {date !== today && <Button onClick={() => goTo(today)}>Today</Button>}
            <Button
              variant="ghost"
              iconOnly
              aria-pressed={focus}
              aria-label={focus ? 'Exit focus mode' : 'Focus mode'}
              title={focus ? 'Exit focus mode' : 'Focus mode'}
              onClick={toggleFocus}
            >
              <Icon name="focus" />
            </Button>
          </div>
        </header>

        {journal.failed && <p className={styles.message}>Could not load this day. Your writing will not be saved.</p>}
        <JournalEditor
          texts={journal.texts}
          disabled={unavailable}
          saveStatus={journal.saveStatus}
          onChange={journal.changeText}
          onBlur={journal.flush}
        />
      </article>

      {!focus && (
        <aside className={styles.items}>
          <JournalItems
            items={journal.items}
            disabled={unavailable}
            onAdd={journal.addItem}
            onUpdate={journal.updateItem}
            onMove={journal.moveItem}
            onRemove={journal.removeItem}
            onCreateCard={journal.createCard}
          />
        </aside>
      )}
    </div>
  )
}
