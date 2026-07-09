import { useState } from 'react'

export interface UseWidgetReturn {
  expanded: boolean
  toggle: () => void
}

export function useWidget(initialExpanded = false): UseWidgetReturn {
  const [expanded, setExpanded] = useState(initialExpanded)
  const toggle = () => setExpanded(v => !v)
  return { expanded, toggle }
}
