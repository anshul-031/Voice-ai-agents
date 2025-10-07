import { render, screen } from '@testing-library/react'
import React from 'react'
import RootLayout, { metadata } from '@/app/layout'

describe('RootLayout', () => {
  it('renders children inside html/body', () => {
    render(
      <RootLayout>
        <div data-testid="child">Hello</div>
      </RootLayout>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('exposes metadata with title and description', () => {
    expect(metadata).toBeDefined()
    expect(metadata.title).toBe('AI Voice Assistant')
    expect(metadata.description).toBe('Voice-first AI assistant')
  })
})
