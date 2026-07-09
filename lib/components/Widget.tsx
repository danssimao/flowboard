import { useState } from 'react'
import type { WidgetTheme } from '../types'
import styles from './Widget.module.css'

export interface WidgetProps {
  title: string
  theme?: WidgetTheme
}

export function Widget({ title, theme = 'light' }: WidgetProps) {
  const [count, setCount] = useState(0)
  return (
    <div className={`${styles.container} ${styles[theme]}`}>
      <h2 className={styles.title}>{title}</h2>
      <button className={styles.button} onClick={() => setCount(c => c + 1)}>
        Clicks: {count}
      </button>
    </div>
  )
}
