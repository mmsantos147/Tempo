import type { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.css'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  iconOnly?: boolean
}

export function Button({ variant = 'secondary', iconOnly = false, className, type = 'button', ...props }: ButtonProps) {
  const classes = [styles.button, styles[variant], iconOnly ? styles.iconOnly : '', className ?? '']
    .filter(Boolean)
    .join(' ')
  return <button type={type} className={classes} {...props} />
}
