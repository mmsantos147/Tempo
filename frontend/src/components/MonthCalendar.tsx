import { addMonths, formatLongDate, formatMonth, monthGrid } from '../utils/time'
import { Button } from './Button'
import { Icon } from './Icon'
import styles from './MonthCalendar.module.css'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface MonthCalendarProps {
  month: string
  selected: string
  today: string
  marked: Set<string> | null
  onMonthChange: (month: string) => void
  onSelect: (date: string) => void
}

export function MonthCalendar({ month, selected, today, marked, onMonthChange, onSelect }: MonthCalendarProps) {
  const cells = monthGrid(month)
  const isCurrentMonth = month >= today.slice(0, 7)

  return (
    <section className={styles.calendar} aria-label="Calendar">
      <header className={styles.header}>
        <Button variant="ghost" iconOnly aria-label="Previous month" onClick={() => onMonthChange(addMonths(month, -1))}>
          <Icon name="left" size={14} />
        </Button>
        <h2 className={styles.month} aria-live="polite">
          {formatMonth(month)}
        </h2>
        <Button
          variant="ghost"
          iconOnly
          aria-label="Next month"
          disabled={isCurrentMonth}
          onClick={() => onMonthChange(addMonths(month, 1))}
        >
          <Icon name="right" size={14} />
        </Button>
      </header>

      <div className={styles.grid} role="grid">
        <div className={styles.row} role="row">
          {WEEKDAYS.map((day, index) => (
            <span key={index} className={styles.weekday} role="columnheader" aria-label={WEEKDAY_NAMES[index]}>
              {day}
            </span>
          ))}
        </div>
        {Array.from({ length: cells.length / 7 }, (_, week) => (
          <div key={week} className={styles.row} role="row">
            {cells.slice(week * 7, week * 7 + 7).map((date, index) =>
              date === null ? (
                <span key={index} role="gridcell" />
              ) : (
                <span key={date} role="gridcell">
                  <button
                    type="button"
                    className={[
                      styles.day,
                      date === selected ? styles.selected : '',
                      date === today ? styles.today : '',
                      marked?.has(date) ? styles.marked : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    disabled={date > today}
                    aria-current={date === today ? 'date' : undefined}
                    aria-pressed={date === selected}
                    aria-label={`${formatLongDate(date)}${marked?.has(date) ? ', has an entry' : ''}`}
                    onClick={() => onSelect(date)}
                  >
                    {Number(date.slice(8, 10))}
                  </button>
                </span>
              ),
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
