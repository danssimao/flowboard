import { act, renderHook } from '@testing-library/react'
import { useWidget } from './useWidget'

describe('useWidget', () => {
  it('returns expanded as false by default', () => {
    const { result } = renderHook(() => useWidget())
    expect(result.current.expanded).toBe(false)
  })

  it('returns expanded as true when initialExpanded is true', () => {
    const { result } = renderHook(() => useWidget(true))
    expect(result.current.expanded).toBe(true)
  })

  it('toggles expanded state when toggle is called', () => {
    const { result } = renderHook(() => useWidget())
    expect(result.current.expanded).toBe(false)

    act(() => result.current.toggle())
    expect(result.current.expanded).toBe(true)

    act(() => result.current.toggle())
    expect(result.current.expanded).toBe(false)
  })
})
