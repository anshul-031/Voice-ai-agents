// Use strict isolation and robust path mocking to ensure the route binds to our mocks
describe('/api/chat/save', () => {
    let POST: any
    let dbConnect: any
    let Chat: any
    const importRoute = () => {
        jest.isolateModules(() => {
            // Mock Next APIs
            jest.doMock('next/server', () => {
                const NextResponse = { json: (body: any, init?: { status?: number }) => ({ status: init?.status ?? 200, json: async () => body }) }
                class NextRequest { constructor(public url: string) {} async json() { return {} } }
                return { NextResponse, NextRequest }
            })
            jest.doMock('next/server.js', () => {
                const NextResponse = { json: (body: any, init?: { status?: number }) => ({ status: init?.status ?? 200, json: async () => body }) }
                class NextRequest { constructor(public url: string) {} async json() { return {} } }
                return { NextResponse, NextRequest }
            })

            // DB mock shared across alias/bare/relative
            let dbMock: any
            const getDbMock = () => {
                if (!dbMock) {
                    dbMock = {
                        __esModule: true,
                        default: jest.fn().mockResolvedValue(undefined),
                        clearMongoConnection: jest.fn().mockResolvedValue(undefined),
                    }
                }
                return dbMock
            }
            jest.doMock('@/lib/mongodb', getDbMock)
            jest.doMock('lib/mongodb', getDbMock)
            jest.doMock('lib/mongodb.ts', getDbMock)
            jest.doMock('../../lib/mongodb.ts', getDbMock)

            // Chat model mock shared across alias/bare/relative
            let ChatMock: any
            const defineChatMock = () => {
                if (!ChatMock) {
                    ChatMock = jest.fn()
                    // Optional static methods if route ever uses them
                    ChatMock.find = jest.fn()
                    ChatMock.aggregate = jest.fn()
                    ChatMock.deleteMany = jest.fn()
                }
                return { __esModule: true, default: ChatMock }
            }
            jest.doMock('@/models/Chat', defineChatMock)
            jest.doMock('models/Chat', defineChatMock)
            jest.doMock('models/Chat.ts', defineChatMock)
            jest.doMock('../../models/Chat.ts', defineChatMock)

            const route = require('@/app/api/chat/save/route')
            POST = route.POST
            // Capture exact instances used by the route
            dbConnect = require('@/lib/mongodb').default
            Chat = ChatMock
        })
    }
    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
        importRoute()
        ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
    });

    it('should return 400 if required fields are missing', async () => {
        const request = { url: 'http://localhost:3000/api/chat/save', json: async () => ({ sessionId: 'test' }) } as any

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('Missing required fields');
    });

    it('should return 400 for invalid role', async () => {
        const request = { url: 'http://localhost:3000/api/chat/save', json: async () => ({ sessionId: 'test', role: 'invalid', content: 'Test message' }) } as any

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('Invalid role');
    });

    it('should save chat successfully with all fields', async () => {
        const mockChat = {
            _id: 'chat123',
            userId: 'user1',
            sessionId: 'session1',
            role: 'user',
            content: 'Test message',
            systemPrompt: 'Test prompt',
            timestamp: new Date(),
            save: jest.fn().mockResolvedValue(true)
        };

        (Chat as any).mockImplementation(() => mockChat);

        const request = { url: 'http://localhost:3000/api/chat/save', json: async () => ({ userId: 'user1', sessionId: 'session1', role: 'user', content: 'Test message', systemPrompt: 'Test prompt' }) } as any

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.chatId).toBe('chat123');
        expect(mockChat.save).toHaveBeenCalled();
    });

    it('should use default userId if not provided', async () => {
        const mockChat = {
            _id: 'chat123',
            userId: 'mukul',
            sessionId: 'session1',
            role: 'user',
            content: 'Test message',
            timestamp: new Date(),
            save: jest.fn().mockResolvedValue(true)
        };

        (Chat as any).mockImplementation(() => mockChat);

        const request = { url: 'http://localhost:3000/api/chat/save', json: async () => ({ sessionId: 'session1', role: 'user', content: 'Test message' }) } as any

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
    });

    it('should accept assistant role', async () => {
        const mockChat = {
            _id: 'chat123',
            timestamp: new Date(),
            save: jest.fn().mockResolvedValue(true)
        };

        (Chat as any).mockImplementation(() => mockChat);

        const request = { url: 'http://localhost:3000/api/chat/save', json: async () => ({ sessionId: 'session1', role: 'assistant', content: 'Test response' }) } as any

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
    });

    it('should accept system role', async () => {
        const mockChat = {
            _id: 'chat123',
            timestamp: new Date(),
            save: jest.fn().mockResolvedValue(true)
        };

        (Chat as any).mockImplementation(() => mockChat);

        const request = { url: 'http://localhost:3000/api/chat/save', json: async () => ({ sessionId: 'session1', role: 'system', content: 'System message' }) } as any

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
    });

    it('should handle save errors gracefully', async () => {
        const mockChat = {
            save: jest.fn().mockRejectedValue(new Error('Save failed'))
        };

        (Chat as any).mockImplementation(() => mockChat);

        const request = { url: 'http://localhost:3000/api/chat/save', json: async () => ({ sessionId: 'session1', role: 'user', content: 'Test message' }) } as any

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBeDefined();
    });
});
