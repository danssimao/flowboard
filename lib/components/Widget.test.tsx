import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Widget } from './Widget'
import styles from './Widget.module.css'

describe('Widget', () => {
  it('renders the title', () => {
    render(<Widget title="Hello" />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Hello')
  })

  it('shows initial click count as 0', () => {
    render(<Widget title="Counter" />)
    expect(screen.getByRole('button')).toHaveTextContent('Clicks: 0')
  })

  it('increments count on button click', async () => {
    const user = userEvent.setup()
    render(<Widget title="Counter" />)
    const button = screen.getByRole('button')

    await user.click(button)
    expect(button).toHaveTextContent('Clicks: 1')

    await user.click(button)
    expect(button).toHaveTextContent('Clicks: 2')
  })

  it('applies container class by default', () => {
    const { container } = render(<Widget title="Test" />)
    expect(container.firstChild).toHaveClass(styles.container)
  })

  it('applies dark theme class when theme prop is dark', () => {
    const { container } = render(<Widget title="Test" theme="dark" />)
    expect(container.firstChild).toHaveClass(styles.dark)
  })
})
