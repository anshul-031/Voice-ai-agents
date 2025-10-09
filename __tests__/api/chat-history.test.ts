export {}
let dbConnect: any;
let Chat: any;

describe('/api/chat/history', () => {
    let GET: any, DELETE_: any
    const importRoutes = () => {
        // Ensure fresh module state and mocks before requiring route
        jest.isolateModules(() => {
            let ChatMock: any
            jest.doMock('next/server', () => {
                const NextResponse = {
                    json: (body: any, init?: { status?: number }) => ({ status: init?.status ?? 200, json: async () => body }),
                }
                class NextRequest { constructor(public url: string) {} async json() { return {} } }
                return { NextResponse, NextRequest }
            })
            jest.doMock('next/server.js', () => {
                const NextResponse = {
                    json: (body: any, init?: { status?: number }) => ({ status: init?.status ?? 200, json: async () => body }),
                }
                class NextRequest { constructor(public url: string) {} async json() { return {} } }
                return { NextResponse, NextRequest }
            })
            // Also mock by relative paths in case transformed imports use file paths
            jest.doMock('../../lib/mongodb.ts', () => ({
                __esModule: true,
                default: jest.fn().mockResolvedValue(undefined),
                clearMongoConnection: jest.fn().mockResolvedValue(undefined),
            }))
            jest.doMock('../../models/Chat.ts', () => {
                if (!ChatMock) {
                    ChatMock = jest.fn()
                    const defaultChain = {
                        sort: jest.fn().mockReturnThis(),
                        skip: jest.fn().mockReturnThis(),
                        limit: jest.fn().mockReturnThis(),
                        lean: jest.fn().mockReturnThis(),
                        exec: jest.fn().mockResolvedValue([]),
                    }
                    ChatMock._chain = defaultChain
                    ChatMock.find = jest.fn().mockReturnValue(ChatMock._chain)
                    ChatMock.aggregate = jest.fn()
                    ChatMock.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 0 })
                }
                return { __esModule: true, default: ChatMock }
            })
            // Mock both alias and bare specifier since path mapping may resolve to either
            jest.doMock('@/lib/mongodb', () => ({
                __esModule: true,
                default: jest.fn().mockResolvedValue(undefined),
                clearMongoConnection: jest.fn().mockResolvedValue(undefined),
            }))
            jest.doMock('lib/mongodb', () => ({
                __esModule: true,
                default: jest.fn().mockResolvedValue(undefined),
                clearMongoConnection: jest.fn().mockResolvedValue(undefined),
            }))
            jest.doMock('@/models/Chat', () => {
                if (!ChatMock) {
                    ChatMock = jest.fn()
                    const defaultChain = {
                        sort: jest.fn().mockReturnThis(),
                        skip: jest.fn().mockReturnThis(),
                        limit: jest.fn().mockReturnThis(),
                        lean: jest.fn().mockReturnThis(),
                        exec: jest.fn().mockResolvedValue([]),
                    }
                    ChatMock._chain = defaultChain
                    ChatMock.find = jest.fn().mockReturnValue(ChatMock._chain)
                    ChatMock.aggregate = jest.fn()
                    ChatMock.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 0 })
                }
                return { __esModule: true, default: ChatMock }
            })
            jest.doMock('models/Chat', () => {
                if (!ChatMock) {
                    ChatMock = jest.fn()
                    const defaultChain = {
                        sort: jest.fn().mockReturnThis(),
                        skip: jest.fn().mockReturnThis(),
                        limit: jest.fn().mockReturnThis(),
                        lean: jest.fn().mockReturnThis(),
                        exec: jest.fn().mockResolvedValue([]),
                    }
                    ChatMock._chain = defaultChain
                    ChatMock.find = jest.fn().mockReturnValue(ChatMock._chain)
                    ChatMock.aggregate = jest.fn()
                    ChatMock.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 0 })
                }
                return { __esModule: true, default: ChatMock }
            })

            const route = require('@/app/api/chat/history/route')
            GET = route.GET
            DELETE_ = route.DELETE
            // Capture concrete mock instances used by the route
            dbConnect = require('@/lib/mongodb').default
            Chat = ChatMock
        })
    }
    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
        importRoutes();
        ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
    });

    describe('GET', () => {
        it('should return 400 if sessionId is missing', async () => {
            const request = { url: 'http://localhost:3000/api/chat/history' } as any
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe('sessionId is required');
        });

        it('should fetch chat history successfully', async () => {
            const mockChats = [
                {
                    _id: 'chat1',
                    role: 'user',
                    content: 'Hello',
                    timestamp: new Date(),
                    systemPrompt: 'Test prompt'
                },
                {
                    _id: 'chat2',
                    role: 'assistant',
                    content: 'Hi there',
                    timestamp: new Date(),
                    systemPrompt: 'Test prompt'
                }
            ];

            Chat._chain.exec.mockResolvedValue(mockChats)

            const request = { url: 'http://localhost:3000/api/chat/history?sessionId=test-session' } as any
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.sessionId).toBe('test-session');
            expect(data.count).toBe(2);
            expect(data.chats).toHaveLength(2);
        });

        it('should handle database errors gracefully', async () => {
            Chat.find.mockImplementation(() => { throw new Error('Database error') })

            const request = { url: 'http://localhost:3000/api/chat/history?sessionId=test-session' } as any
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe('Failed to fetch chat history');
        });

        it('should respect limit and skip parameters', async () => {
            Chat._chain.skip.mockClear()
            Chat._chain.limit.mockClear()
            Chat._chain.exec.mockResolvedValue([])

            const request = { url: 'http://localhost:3000/api/chat/history?sessionId=test&limit=50&skip=10' } as any
            await GET(request);

            expect(Chat._chain.skip).toHaveBeenCalledWith(10);
            expect(Chat._chain.limit).toHaveBeenCalledWith(50);
        });
    });

    describe('DELETE', () => {
        it('should return 400 if sessionId is missing', async () => {
            const request = { url: 'http://localhost:3000/api/chat/history' } as any
            const response = await DELETE_(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe('sessionId is required');
        });

        it('should delete chat history successfully', async () => {
            Chat.deleteMany.mockResolvedValue({ deletedCount: 5 })

            const request = { url: 'http://localhost:3000/api/chat/history?sessionId=test-session' } as any
            const response = await DELETE_(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.deletedCount).toBe(5);
        });

        it('should handle delete errors gracefully', async () => {
            Chat.deleteMany.mockRejectedValue(new Error('Delete failed'))

            const request = { url: 'http://localhost:3000/api/chat/history?sessionId=test-session' } as any
            const response = await DELETE_(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBeDefined();
        });
    });
});
