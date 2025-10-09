export {}
let dbConnect: any, clearMongoConnection: any, Chat: any

describe('/api/chat/sessions', () => {
    let GET: any
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

            // DB mocks across alias/bare/relative
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

            // Chat model mock across alias/bare/relative
            let ChatMock: any
            const defineChatMock = () => {
                if (!ChatMock) {
                    ChatMock = jest.fn()
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

            const route = require('@/app/api/chat/sessions/route')
            GET = route.GET
            dbConnect = require('@/lib/mongodb').default
            clearMongoConnection = require('@/lib/mongodb').clearMongoConnection
            Chat = ChatMock
        })
    }
    beforeEach(() => {
        jest.resetModules()
        jest.clearAllMocks();
        importRoute();
        ;(dbConnect as jest.Mock).mockResolvedValue(undefined);
        ;(clearMongoConnection as jest.Mock).mockResolvedValue(undefined);
    });

    it('should fetch sessions successfully with default userId', async () => {
        const mockSessions = [
            {
                sessionId: 'session1',
                userId: 'mukul',
                messageCount: 5,
                firstMessage: 'Hello',
                lastMessage: 'Goodbye',
                lastTimestamp: new Date(),
                firstTimestamp: new Date()
            }
        ];

        (Chat.aggregate as jest.Mock).mockResolvedValue(mockSessions);

    const request = { url: 'http://localhost:3000/api/chat/sessions' } as any
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.userId).toBe('mukul');
        expect(data.sessions).toHaveLength(1);
        expect(data.count).toBe(1);
    });

    it('should fetch sessions with custom userId', async () => {
        const mockSessions = [
            {
                sessionId: 'session1',
                userId: 'customUser',
                messageCount: 3,
                firstMessage: 'Hi',
                lastMessage: 'Bye',
                lastTimestamp: new Date(),
                firstTimestamp: new Date()
            }
        ];

        (Chat.aggregate as jest.Mock).mockResolvedValue(mockSessions);

    const request = { url: 'http://localhost:3000/api/chat/sessions?userId=customUser' } as any
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.userId).toBe('customUser');
        expect(data.sessions).toHaveLength(1);
    });

    it('should return empty array when no sessions found', async () => {
        (Chat.aggregate as jest.Mock).mockResolvedValue([]);

    const request = { url: 'http://localhost:3000/api/chat/sessions' } as any
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.sessions).toHaveLength(0);
        expect(data.count).toBe(0);
    });

    it('should retry connection on first failure', async () => {
        (dbConnect as jest.Mock)
            .mockRejectedValueOnce(new Error('Connection failed'))
            .mockResolvedValueOnce(undefined);

        (Chat.aggregate as jest.Mock).mockResolvedValue([]);

    const request = { url: 'http://localhost:3000/api/chat/sessions' } as any
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(clearMongoConnection).toHaveBeenCalled();
        expect(dbConnect).toHaveBeenCalledTimes(2);
    });

    it('should handle aggregate errors gracefully', async () => {
        (Chat.aggregate as jest.Mock).mockRejectedValue(new Error('Aggregate failed'));

    const request = { url: 'http://localhost:3000/api/chat/sessions' } as any
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to fetch sessions');
    });

    it('should handle non-Error exceptions', async () => {
        (Chat.aggregate as jest.Mock).mockRejectedValue('String error');

    const request = { url: 'http://localhost:3000/api/chat/sessions' } as any
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.details).toBe('Unknown error');
    });
});
