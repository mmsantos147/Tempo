import { Navigate, useParams } from 'react-router'
import { AppHeader } from '../components/AppHeader'
import { JournalView } from '../components/JournalView'
import { isIsoDate, todayInAppZone } from '../utils/time'
import styles from './Page.module.css'

export function JournalPage() {
  const { date } = useParams()

  if (!isIsoDate(date) || date > todayInAppZone()) {
    return <Navigate to="/journal" replace />
  }

  return (
    <>
      <AppHeader />
      <main className={`${styles.main} ${styles.scroll}`}>
        <JournalView key={date} date={date} />
      </main>
    </>
  )
}
