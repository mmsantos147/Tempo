import { useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'
import { useNow } from '../hooks/useNow'
import type { CardTime } from '../types'
import { formatDuration } from '../utils/format'
import { Icon } from './Icon'
import styles from './CardTimer.module.css'

interface CardTimerProps {
  time: CardTime | undefined
  onStart: () => Promise<void>
  onStop: () => Promise<void>
  large?: boolean
}

export function CardTimer({ time, onStart, onStop, large = false }: CardTimerProps) {
  const running = time?.running ?? null
  const now = useNow(running !== null)
  const [busy, setBusy] = useState(false)

  const elapsed = running ? Math.max(0, (now - Date.parse(running.startedAt)) / 1000) : 0
  const total = (time?.totalSeconds ?? 0) + elapsed

  const toggle = async (event: MouseEvent) => {
    event.stopPropagation()
    setBusy(true)
    try {
      await (running ? onStop() : onStart())
    } finally {
      setBusy(false)
    }
  }

  const keepFromCard = (event: PointerEvent | KeyboardEvent) => event.stopPropagation()

  return (
    <div className={`${styles.timer} ${running ? styles.running : ''} ${large ? styles.large : ''}`}>
      <button
        type="button"
        className={styles.toggle}
        onClick={toggle}
        onPointerDown={keepFromCard}
        onKeyDown={keepFromCard}
        disabled={busy || !time}
        aria-label={running ? 'Stop timer' : 'Start timer'}
        title={running ? 'Stop timer' : 'Start timer'}
      >
        <Icon name={running ? 'stop' : 'play'} size={large ? 16 : 12} />
      </button>
      <span className={styles.total}>{time ? formatDuration(total) : '–:––:––'}</span>
    </div>
  )
}
