import { Navigate, useParams } from 'react-router'
import { AppHeader } from '../components/AppHeader'
import { DayView } from '../components/DayView'
import { isIsoDate } from '../utils/time'
import styles from './Page.module.css'

export function DayPage() {
  const { date } = useParams()

  if (!isIsoDate(date)) {
    return <Navigate to="/day" replace />
  }

  return (
    <>
      <AppHeader />
      <main className={`${styles.main} ${styles.scroll}`}>
        <DayView date={date} />
      </main>
    </>
  )
}
