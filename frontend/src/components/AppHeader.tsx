import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { Button } from './Button'
import { Icon } from './Icon'
import styles from './AppHeader.module.css'

const linkClass = ({ isActive }: { isActive: boolean }) => `${styles.link} ${isActive ? styles.active : ''}`

export function AppHeader({ children }: { children?: ReactNode }) {
  const { state, logout } = useAuth()

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <Icon name="clock" size={20} />
        Tempo
      </div>
      <nav className={styles.nav} aria-label="Main">
        <NavLink to="/" end className={linkClass}>
          Board
        </NavLink>
        <NavLink to="/day" className={linkClass}>
          Day
        </NavLink>
        <NavLink to="/journal" className={linkClass}>
          Journal
        </NavLink>
      </nav>
      <div className={styles.page}>{children}</div>
      {state.status === 'authenticated' && (
        <div className={styles.user}>
          <span className={styles.userName} title={state.user.email}>
            {state.user.name}
          </span>
          <Button variant="ghost" onClick={() => void logout()}>
            Sign out
          </Button>
        </div>
      )}
    </header>
  )
}
