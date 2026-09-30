import type { Card, CardTime } from '../types'
import { formatMinutes } from '../utils/format'
import { CardTimer } from './CardTimer'
import { Icon } from './Icon'
import styles from './CardContent.module.css'

interface CardContentProps {
  card: Card
  time: CardTime | undefined
  onStartTimer: () => Promise<void>
  onStopTimer: () => Promise<void>
  overlay?: boolean
}

export function CardContent({ card, time, onStartTimer, onStopTimer, overlay = false }: CardContentProps) {
  const completed = card.completedAt !== null
  const running = time?.running != null

  return (
    <article
      className={[styles.card, completed ? styles.completed : '', running ? styles.running : '', overlay ? styles.overlay : '']
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.titleRow}>
        {completed && (
          <span className={styles.check} aria-label="Completed">
            <Icon name="check" size={14} />
          </span>
        )}
        <h3 className={styles.title}>{card.title}</h3>
      </div>
      {card.description && <p className={styles.description}>{card.description}</p>}
      <footer className={styles.footer}>
        <CardTimer time={time} onStart={onStartTimer} onStop={onStopTimer} />
        {card.estimatedMinutes !== null && (
          <span className={styles.estimate} title="Estimated time">
            <Icon name="clock" size={12} />
            {formatMinutes(card.estimatedMinutes)}
          </span>
        )}
      </footer>
    </article>
  )
}
