import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Home from '@/app/page'

describe('Home page - text chat TTS success and ended cleanup', () => {
  beforeEach(() => {
    ;(global.fetch as jest.Mock) = jest.fn((url: RequestInfo | URL) => {
      const s = String(url)
      if (s.includes('/api/config-status')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ services: { stt: true, llm: true, tts: true }, allConfigured: true, message: 'ok' }) })
      }
      if (s.includes('/api/llm')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ llmText: 'Hello world' }) })
      }
      if (s.includes('/api/tts')) {
        const base64 = Buffer.from(Uint8Array.from([1, 2, 3, 4])).toString('base64')
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ audioData: base64, mimeType: 'audio/wav' }) })
      }
      return Promise.reject(new Error('unhandled url: ' + s))
    })
  })

  afterEach(() => {
    ;(global.fetch as jest.Mock).mockReset()
    ;(global.URL.revokeObjectURL as jest.Mock).mockClear()
  })

  it('revokes object URL after audio ended', async () => {
    render(<Home />)

    const toggle = await screen.findByTitle('Toggle text chat')
    await userEvent.click(toggle)

    const input = screen.getByPlaceholderText('Type your message here...')
    await userEvent.type(input, 'Hi there')
    await userEvent.click(screen.getByTitle('Send message'))

    // Wait for assistant message to confirm flow
    await waitFor(() => {
      expect(screen.getByText('Hello world')).toBeInTheDocument()
    })

    // Trigger the 'ended' callback registered on the latest Audio instance
    const AudioMock = global.Audio as unknown as jest.Mock
    const instance = AudioMock.mock.results[AudioMock.mock.results.length - 1]?.value
    expect(instance).toBeDefined()
    const call = instance.addEventListener.mock.calls.find((c: any[]) => c[0] === 'ended')
    expect(call).toBeDefined()
    const endedCb = call[1]
    endedCb()

    expect(global.URL.revokeObjectURL).toHaveBeenCalled()
  })
})
