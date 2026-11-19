import { Navigate, Route, Routes } from 'react-router'
import { RequireAuth } from './components/RequireAuth'
import { BoardsPage } from './pages/BoardsPage'
import { DayPage } from './pages/DayPage'
import { JournalPage } from './pages/JournalPage'
import { LoginPage } from './pages/LoginPage'
import { todayInAppZone } from './utils/time'
import styles from './App.module.css'

export default function App() {
  return (
    <div className={styles.app}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/" element={<BoardsPage />} />
          <Route path="/day" element={<Navigate to={`/day/${todayInAppZone()}`} replace />} />
          <Route path="/day/:date" element={<DayPage />} />
          <Route path="/journal" element={<Navigate to={`/journal/${todayInAppZone()}`} replace />} />
          <Route path="/journal/:date" element={<JournalPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
