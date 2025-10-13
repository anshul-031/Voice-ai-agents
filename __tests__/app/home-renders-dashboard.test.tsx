import Home from '@/app/page'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

jest.mock('@/app/dashboard/page', () => jest.fn(() => <div data-testid="dashboard-page">Dashboard</div>))

describe('Home route', () => {
  it('renders DashboardPage', () => {
    render(<Home />)
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
  })
})

// keep this file focused on Home routing only
