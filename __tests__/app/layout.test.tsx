import { render, screen } from '@testing-library/react'
import React from 'react'
import RootLayout from '@/app/layout'

describe('RootLayout', () => {
  it('renders children inside html/body', () => {
    render(
      <RootLayout>
        <div data-testid="child">Hello</div>
      </RootLayout>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
})
