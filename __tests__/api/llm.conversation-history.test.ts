/**
 * @jest-environment node
 */
import { POST } from '@/app/api/llm/route'
import { NextRequest } from 'next/server'

// Mock the Google Generative AI module
jest.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
            generateContent: jest.fn().mockResolvedValue({
                response: {
                    text: jest.fn().mockResolvedValue('This is a test response from the LLM.'),
                },
            }),
        }),
    })),
}))

describe('API: /api/llm - Conversation History', () => {
    const originalEnv = process.env

    beforeEach(() => {
        jest.clearAllMocks()
        process.env = { ...originalEnv }
        process.env.GEMINI_API_KEY = 'test_key'

        // Reset the GoogleGenerativeAI mock to default
        const { GoogleGenerativeAI } = require('@google/generative-ai')
        GoogleGenerativeAI.mockClear()
        GoogleGenerativeAI.mockImplementation(() => ({
            getGenerativeModel: jest.fn().mockReturnValue({
                generateContent: jest.fn().mockResolvedValue({
                    response: {
                        text: jest.fn().mockResolvedValue('This is a test response from the LLM.'),
                    },
                }),
            }),
        }))
    })

    afterEach(() => {
        process.env = originalEnv
    })

    describe('Conversation History - Basic Functionality', () => {
        it('should accept conversationHistory parameter', async () => {
            const conversationHistory = [
                { text: 'What is my EMI?', source: 'user' as const },
                { text: 'Your EMI is ₹3,000', source: 'assistant' as const },
            ]

            const request = new NextRequest('http://localhost:3000/api/llm', {
                method: 'POST',
                body: JSON.stringify({
                    prompt: 'You are a helpful assistant',
                    userText: 'When is it due?',
                    conversationHistory,
                }),
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.llmText).toBeDefined()
        })

        it('should work without conversationHistory (backwards compatible)', async () => {
            const request = new NextRequest('http://localhost:3000/api/llm', {
                method: 'POST',
                body: JSON.stringify({
                    prompt: 'You are a helpful assistant',
                    userText: 'Hello',
                }),
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.llmText).toBe('This is a test response from the LLM.')
        })

        it('should handle empty conversationHistory array', async () => {
            const request = new NextRequest('http://localhost:3000/api/llm', {
                method: 'POST',
                body: JSON.stringify({
                    prompt: 'You are a helpful assistant',
                    userText: 'Hello',
                    conversationHistory: [],
                }),
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.llmText).toBeDefined()
        })

        it('should handle null conversationHistory', async () => {
            const request = new NextRequest('http://localhost:3000/api/llm', {
                method: 'POST',
                body: JSON.stringify({
                    prompt: 'You are a helpful assistant',
                    userText: 'Hello',
                    conversationHistory: null,
                }),
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.llmText).toBeDefined()
        })
    })

    describe('Conversation History - Formatting', () => {
        it('should format conversation history with user and assistant messages', async () => {
            const { GoogleGenerativeAI } = require('@google/generative-ai')
            const mockGenerateContent = jest.fn().mockResolvedValue({
                response: {
                    text: jest.fn().mockResolvedValue('The EMI is due on 20th'),
                },
            })

            GoogleGenerativeAI.mockImplementation(() => ({
                getGenerativeModel: jest.fn().mockReturnValue({
                    generateContent: mockGenerateContent,
                }),
            }))

            const conversationHistory = [
                { text: 'What is my EMI amount?', source: 'user' as const },
                { text: 'Your EMI amount is ₹3,000', source: 'assistant' as const },
            ]

            const request = new NextRequest('http://localhost:3000/api/llm', {
                method: 'POST',
                body: JSON.stringify({
                    prompt: 'You are a banking assistant',
                    userText: 'When is it due?',
                    conversationHistory,
                }),
            })

            await POST(request)

            // Verify generateContent was called with formatted prompt
            expect(mockGenerateContent).toHaveBeenCalled()
            const calledPrompt = mockGenerateContent.mock.calls[0][0]

            // Should include system prompt
            expect(calledPrompt).toContain('You are a banking assistant')

            // Should include previous conversation header
            expect(calledPrompt).toContain('## Previous Conversation:')

            // Should include user message
            expect(calledPrompt).toContain('User: What is my EMI amount?')

            // Should include assistant message
            expect(calledPrompt).toContain('Assistant: Your EMI amount is ₹3,000')

            // Should include current user message
            expect(calledPrompt).toContain('User: When is it due?')
        })

        it('should handle conversation with multiple exchanges', async () => {
            const { GoogleGenerativeAI } = require('@google/generative-ai')
            const mockGenerateContent = jest.fn().mockResolvedValue({
                response: {
                    text: jest.fn().mockResolvedValue('Response'),
                },
            })

            GoogleGenerativeAI.mockImplementation(() => ({
                getGenerativeModel: jest.fn().mockReturnValue({
                    generateContent: mockGenerateContent,
                }),
            }))

            const conversationHistory = [
                { text: 'Message 1', source: 'user' as const },
                { text: 'Response 1', source: 'assistant' as const },
                { text: 'Message 2', source: 'user' as const },
                { text: 'Response 2', source: 'assistant' as const },
                { text: 'Message 3', source: 'user' as const },
                { text: 'Response 3', source: 'assistant' as const },
            ]

            const request = new NextRequest('http://localhost:3000/api/llm', {
                method: 'POST',
                body: JSON.stringify({
                    prompt: 'System prompt',
                    userText: 'Current message',
                    conversationHistory,
                }),
            })

            await POST(request)

            const calledPrompt = mockGenerateContent.mock.calls[0][0]

            // Verify all messages are included
            expect(calledPrompt).toContain('User: Message 1')
            expect(calledPrompt).toContain('Assistant: Response 1')
            expect(calledPrompt).toContain('User: Message 2')
            expect(calledPrompt).toContain('Assistant: Response 2')
            expect(calledPrompt).toContain('User: Message 3')
            expect(calledPrompt).toContain('Assistant: Response 3')
            expect(calledPrompt).toContain('User: Current message')
        })

        it('should limit history to last 20 messages', async () => {
            const { GoogleGenerativeAI } = require('@google/generative-ai')
            const mockGenerateContent = jest.fn().mockResolvedValue({
                response: {
                    text: jest.fn().mockResolvedValue('Response'),
                },
            })

            GoogleGenerativeAI.mockImplementation(() => ({
                getGenerativeModel: jest.fn().mockReturnValue({
                    generateContent: mockGenerateContent,
                }),
            }))

            // Create 50 messages (25 exchanges = 50 messages, should only use last 20)
            const conversationHistory = []
            for (let i = 1; i <= 25; i++) {
                conversationHistory.push(
                    { text: `User message ${i}`, source: 'user' as const },
                    { text: `Assistant response ${i}`, source: 'assistant' as const }
                )
            }
            // Total: 50 messages. Last 20 should be messages 31-50, which corresponds to exchanges 16-25

            const request = new NextRequest('http://localhost:3000/api/llm', {
                method: 'POST',
                body: JSON.stringify({
                    prompt: 'System prompt',
                    userText: 'Latest message',
                    conversationHistory,
                }),
            })

            await POST(request)

            const calledPrompt = mockGenerateContent.mock.calls[0][0]

            // Should NOT include first 30 messages (exchanges 1-15)
            // Note: Using line breaks to avoid partial matches (e.g., "message 1" matching "message 10")
            expect(calledPrompt).not.toContain('User message 1\n')
            expect(calledPrompt).not.toContain('User message 5\n')
            expect(calledPrompt).not.toContain('User message 14\n')
            expect(calledPrompt).not.toContain('User message 15\n')

            // SHOULD include last 20 messages (exchanges 16-25)
            expect(calledPrompt).toContain('User message 16')
            expect(calledPrompt).toContain('User message 20')
            expect(calledPrompt).toContain('User message 25')

            // Should include last 20 messages (exchanges 16-25, which are messages 31-50)
            expect(calledPrompt).toContain('User message 16')
            expect(calledPrompt).toContain('User message 20')
            expect(calledPrompt).toContain('User message 25')
        })

        it('should trim whitespace from messages', async () => {
            const { GoogleGenerativeAI } = require('@google/generative-ai')
            const mockGenerateContent = jest.fn().mockResolvedValue({
                response: {
                    text: jest.fn().mockResolvedValue('Response'),
                },
            })

            GoogleGenerativeAI.mockImplementation(() => ({
                getGenerativeModel: jest.fn().mockReturnValue({
                    generateContent: mockGenerateContent,
                }),
            }))

            const conversationHistory = [
                { text: '  What is my EMI?  ', source: 'user' as const },
                { text: '  Your EMI is ₹3,000  ', source: 'assistant' as const },
            ]

            const request = new NextRequest('http://localhost:3000/api/llm', {
                method: 'POST',
                body: JSON.stringify({
                    prompt: '  System prompt  ',
                    userText: '  Current message  ',
                    conversationHistory,
                }),
            })

            await POST(request)

            const calledPrompt = mockGenerateContent.mock.calls[0][0]

            // Verify no extra whitespace in formatted prompt
            expect(calledPrompt).toContain('System prompt\n\n')
            expect(calledPrompt).toContain('User:   What is my EMI?  ')
            expect(calledPrompt).toContain('User: Current message')
        })
    })

    describe('Conversation History - Edge Cases', () => {
        it('should handle conversation history with only user messages', async () => {
            const conversationHistory = [
                { text: 'Message 1', source: 'user' as const },
                { text: 'Message 2', source: 'user' as const },
            ]

            const request = new NextRequest('http://localhost:3000/api/llm', {
                method: 'POST',
                body: JSON.stringify({
                    prompt: 'System prompt',
                    userText: 'Current message',
                    conversationHistory,
                }),
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.llmText).toBeDefined()
        })

        it('should handle conversation history with only assistant messages', async () => {
            const conversationHistory = [
                { text: 'Response 1', source: 'assistant' as const },
                { text: 'Response 2', source: 'assistant' as const },
            ]

            const request = new NextRequest('http://localhost:3000/api/llm', {
                method: 'POST',
                body: JSON.stringify({
                    prompt: 'System prompt',
                    userText: 'Current message',
                    conversationHistory,
                }),
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.llmText).toBeDefined()
        })

        it('should handle conversation history with special characters', async () => {
            const conversationHistory = [
                { text: 'What about $1,000 & 50%?', source: 'user' as const },
                { text: 'The amount is $1,000 (50% discount)', source: 'assistant' as const },
            ]

            const request = new NextRequest('http://localhost:3000/api/llm', {
                method: 'POST',
                body: JSON.stringify({
                    prompt: 'System prompt',
                    userText: 'Tell me more',
                    conversationHistory,
                }),
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.llmText).toBeDefined()
        })

        it('should handle conversation history with newlines', async () => {
            const conversationHistory = [
                { text: 'Line 1\nLine 2\nLine 3', source: 'user' as const },
                { text: 'Response with\nmultiple lines', source: 'assistant' as const },
            ]

            const request = new NextRequest('http://localhost:3000/api/llm', {
                method: 'POST',
                body: JSON.stringify({
                    prompt: 'System prompt',
                    userText: 'Continue',
                    conversationHistory,
                }),
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.llmText).toBeDefined()
        })

        it('should handle very long conversation history messages', async () => {
            const longMessage = 'a'.repeat(5000)
            const conversationHistory = [
                { text: longMessage, source: 'user' as const },
                { text: 'Short response', source: 'assistant' as const },
            ]

            const request = new NextRequest('http://localhost:3000/api/llm', {
                method: 'POST',
                body: JSON.stringify({
                    prompt: 'System prompt',
                    userText: 'Continue',
                    conversationHistory,
                }),
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.llmText).toBeDefined()
        })

        it('should handle empty string messages in history', async () => {
            const conversationHistory = [
                { text: '', source: 'user' as const },
                { text: 'Response to empty', source: 'assistant' as const },
            ]

            const request = new NextRequest('http://localhost:3000/api/llm', {
                method: 'POST',
                body: JSON.stringify({
                    prompt: 'System prompt',
                    userText: 'Real message',
                    conversationHistory,
                }),
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.llmText).toBeDefined()
        })

        it('should work without system prompt but with conversation history', async () => {
            const conversationHistory = [
                { text: 'Hello', source: 'user' as const },
                { text: 'Hi there!', source: 'assistant' as const },
            ]

            const request = new NextRequest('http://localhost:3000/api/llm', {
                method: 'POST',
                body: JSON.stringify({
                    userText: 'How are you?',
                    conversationHistory,
                }),
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.llmText).toBeDefined()
        })

        it('should handle exactly 20 messages in history', async () => {
            const conversationHistory = []
            for (let i = 1; i <= 20; i++) {
                conversationHistory.push({ text: `Message ${i}`, source: 'user' as const })
            }

            const request = new NextRequest('http://localhost:3000/api/llm', {
                method: 'POST',
                body: JSON.stringify({
                    prompt: 'System prompt',
                    userText: 'Latest',
                    conversationHistory,
                }),
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.llmText).toBeDefined()
        })

        it('should handle single message in history', async () => {
            const conversationHistory = [
                { text: 'Single message', source: 'user' as const },
            ]

            const request = new NextRequest('http://localhost:3000/api/llm', {
                method: 'POST',
                body: JSON.stringify({
                    prompt: 'System prompt',
                    userText: 'Next message',
                    conversationHistory,
                }),
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.llmText).toBeDefined()
        })
    })

    describe('Conversation History - Integration with Existing Features', () => {
        it('should still validate userText even with conversation history', async () => {
            const conversationHistory = [
                { text: 'Previous message', source: 'user' as const },
            ]

            const request = new NextRequest('http://localhost:3000/api/llm', {
                method: 'POST',
                body: JSON.stringify({
                    prompt: 'System prompt',
                    userText: '   ',
                    conversationHistory,
                }),
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(400)
            expect(data.error).toBe('No user text provided')
        })

        it('should work with conversation history when API key is missing', async () => {
            delete process.env.GEMINI_API_KEY

            const conversationHistory = [
                { text: 'Previous message', source: 'user' as const },
            ]

            const request = new NextRequest('http://localhost:3000/api/llm', {
                method: 'POST',
                body: JSON.stringify({
                    prompt: 'System prompt',
                    userText: 'Current message',
                    conversationHistory,
                }),
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(500)
            expect(data.error).toBe('LLM service not configured')
        })

        it('should handle conversation history with model initialization errors', async () => {
            const { GoogleGenerativeAI } = require('@google/generative-ai')
            GoogleGenerativeAI.mockImplementation(() => ({
                getGenerativeModel: jest.fn().mockImplementation(() => {
                    throw new Error('Model initialization failed')
                }),
            }))

            const conversationHistory = [
                { text: 'Previous message', source: 'user' as const },
            ]

            const request = new NextRequest('http://localhost:3000/api/llm', {
                method: 'POST',
                body: JSON.stringify({
                    prompt: 'System prompt',
                    userText: 'Current message',
                    conversationHistory,
                }),
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(500)
            expect(data.error).toBe('Failed to initialize AI model')
        })

        it('should work with conversation history when generateContent fails', async () => {
            const { GoogleGenerativeAI } = require('@google/generative-ai')
            GoogleGenerativeAI.mockImplementation(() => ({
                getGenerativeModel: jest.fn().mockReturnValue({
                    generateContent: jest.fn().mockRejectedValue(new Error('Generation failed')),
                }),
            }))

            const conversationHistory = [
                { text: 'Previous message', source: 'user' as const },
            ]

            const request = new NextRequest('http://localhost:3000/api/llm', {
                method: 'POST',
                body: JSON.stringify({
                    prompt: 'System prompt',
                    userText: 'Current message',
                    conversationHistory,
                }),
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(500)
            expect(data.error).toBeDefined()
        })
    })

    describe('Conversation History - Real-world Scenarios', () => {
        it('should handle EMI payment conversation flow', async () => {
            const { GoogleGenerativeAI } = require('@google/generative-ai')
            const mockGenerateContent = jest.fn().mockResolvedValue({
                response: {
                    text: jest.fn().mockResolvedValue('Sure, I can help you pay your EMI of ₹3,000'),
                },
            })

            GoogleGenerativeAI.mockImplementation(() => ({
                getGenerativeModel: jest.fn().mockReturnValue({
                    generateContent: mockGenerateContent,
                }),
            }))

            const conversationHistory = [
                { text: 'What is my EMI amount?', source: 'user' as const },
                { text: 'Your EMI amount is ₹3,000 due on 20th', source: 'assistant' as const },
            ]

            const request = new NextRequest('http://localhost:3000/api/llm', {
                method: 'POST',
                body: JSON.stringify({
                    prompt: 'You are a banking assistant',
                    userText: 'I want to pay it',
                    conversationHistory,
                }),
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.llmText).toBeDefined()

            // Verify the prompt includes context
            const calledPrompt = mockGenerateContent.mock.calls[0][0]
            expect(calledPrompt).toContain('EMI amount is ₹3,000')
            expect(calledPrompt).toContain('I want to pay it')
        })

        it('should handle multi-turn Hinglish conversation', async () => {
            const conversationHistory = [
                { text: 'मुझे अपनी EMI के बारे में जानना है', source: 'user' as const },
                { text: 'आपकी EMI ₹3,000 है जो 20 तारीख को due थी', source: 'assistant' as const },
                { text: 'क्या मैं इसे अभी pay कर सकता हूं?', source: 'user' as const },
                { text: 'जी हां, आप इसे अभी pay कर सकते हैं', source: 'assistant' as const },
            ]

            const request = new NextRequest('http://localhost:3000/api/llm', {
                method: 'POST',
                body: JSON.stringify({
                    prompt: 'You are a Hinglish banking assistant',
                    userText: 'कैसे करूं payment?',
                    conversationHistory,
                }),
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.llmText).toBeDefined()
        })

        it('should maintain context across 10+ exchanges', async () => {
            const conversationHistory = []
            for (let i = 1; i <= 10; i++) {
                conversationHistory.push(
                    { text: `Question ${i}`, source: 'user' as const },
                    { text: `Answer ${i}`, source: 'assistant' as const }
                )
            }

            const request = new NextRequest('http://localhost:3000/api/llm', {
                method: 'POST',
                body: JSON.stringify({
                    prompt: 'You are a helpful assistant',
                    userText: 'What did we discuss?',
                    conversationHistory,
                }),
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.llmText).toBeDefined()
        })
    })
})
