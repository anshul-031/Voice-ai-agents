/**
 * @jest-environment node
 */
export {}
let GET: any, POST: any, PUT: any, DELETE_: any
let dbConnect: any, clearMongoConnection: any
let VoiceAgent: any

const importRoute = () => {
    jest.isolateModules(() => {
    let VAMock: any
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
        // Mock DB (alias and bare)
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
        // Also mock by relative path in case transformed imports resolve to file path
        jest.doMock('../../lib/mongodb.ts', getDbMock)
            // Mock model: share a single instance across all import paths
            const defineVAMock = () => {
                if (!VAMock) {
                    VAMock = jest.fn()
                    const chain = {
                        sort: jest.fn().mockReturnThis(),
                        lean: jest.fn().mockReturnThis(),
                        exec: jest.fn().mockResolvedValue([]),
                    }
                    VAMock._chain = chain
                    VAMock.find = jest.fn().mockReturnValue(VAMock._chain)
                    VAMock.findByIdAndUpdate = jest.fn()
                    VAMock.findByIdAndDelete = jest.fn()
                }
                return { __esModule: true, default: VAMock }
            }
            jest.doMock('@/models/VoiceAgent', defineVAMock)
            jest.doMock('models/VoiceAgent', defineVAMock)
            jest.doMock('../../models/VoiceAgent.ts', defineVAMock)

            const route = require('@/app/api/voice-agents/route')
            GET = route.GET; POST = route.POST; PUT = route.PUT; DELETE_ = route.DELETE
            // Capture the exact mock instances used by the route within the same module isolation
            dbConnect = require('@/lib/mongodb').default
            clearMongoConnection = require('@/lib/mongodb').clearMongoConnection
            VoiceAgent = VAMock
    })
}

describe('/api/voice-agents', () => {
    beforeEach(() => {
        jest.resetModules()
        jest.clearAllMocks();
        importRoute()
        ;(dbConnect as any).mockResolvedValue(undefined)
        ;(clearMongoConnection as any).mockResolvedValue(undefined)
    });

    describe('GET', () => {
        it('should fetch agents successfully with default userId', async () => {
            const mockAgents = [
                {
                    _id: 'agent1',
                    userId: 'mukul',
                    title: 'Test Agent',
                    prompt: 'Test prompt',
                    lastUpdated: new Date(),
                    createdAt: new Date()
                }
            ];
            VoiceAgent._chain.exec.mockResolvedValue(mockAgents)

            const request = { url: 'http://localhost:3000/api/voice-agents' } as any
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.userId).toBe('mukul');
            expect(data.agents).toHaveLength(1);
            expect(data.count).toBe(1);
        });

        it('should fetch agents with custom userId', async () => {
            VoiceAgent._chain.exec.mockResolvedValue([])

            const request = { url: 'http://localhost:3000/api/voice-agents?userId=customUser' } as any
            const response = await GET(request);
            const data = await response.json();

            expect(data.userId).toBe('customUser');
            expect(VoiceAgent.find).toHaveBeenCalledWith({ userId: 'customUser' });
        });

        it('should retry connection on first failure', async () => {
            (dbConnect as jest.Mock)
                .mockRejectedValueOnce(new Error('Connection failed'))
                .mockResolvedValueOnce(undefined);

            VoiceAgent._chain.exec.mockResolvedValue([])

            const request = { url: 'http://localhost:3000/api/voice-agents' } as any
            await GET(request);

            expect(clearMongoConnection).toHaveBeenCalled();
            expect(dbConnect).toHaveBeenCalledTimes(2);
        });

        it('should handle errors gracefully', async () => {
            VoiceAgent.find.mockImplementation(() => { throw new Error('Database error') })

            const request = { url: 'http://localhost:3000/api/voice-agents' } as any
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.success).toBe(false);
            expect(data.error).toBe('Failed to fetch voice agents');
        });
    });

    describe('POST', () => {
        it('should return 400 if title is missing', async () => {
            const request = { url: 'http://localhost:3000/api/voice-agents', json: async () => ({ prompt: 'Test' }) } as any

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toContain('Missing required fields');
        });

        it('should return 400 if prompt is missing', async () => {
            const request = { url: 'http://localhost:3000/api/voice-agents', json: async () => ({ title: 'Test' }) } as any

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toContain('Missing required fields');
        });

        it('should create agent successfully', async () => {
            const mockAgent = {
                _id: 'agent123',
                userId: 'mukul',
                title: 'New Agent',
                prompt: 'New prompt',
                lastUpdated: new Date(),
                createdAt: new Date(),
                save: jest.fn().mockResolvedValue(true)
            };

            ;(VoiceAgent as any).mockImplementation(() => mockAgent);

            const request = { url: 'http://localhost:3000/api/voice-agents', json: async () => ({ title: 'New Agent', prompt: 'New prompt' }) } as any

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.agent.title).toBe('New Agent');
            expect(mockAgent.save).toHaveBeenCalled();
        });

        it('should use custom userId if provided', async () => {
            const mockAgent = {
                _id: 'agent123',
                userId: 'customUser',
                title: 'Agent',
                prompt: 'Prompt',
                lastUpdated: new Date(),
                createdAt: new Date(),
                save: jest.fn().mockResolvedValue(true)
            };

            ;(VoiceAgent as any).mockImplementation(() => mockAgent);

            const request = { url: 'http://localhost:3000/api/voice-agents', json: async () => ({ userId: 'customUser', title: 'Agent', prompt: 'Prompt' }) } as any

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.agent.userId).toBe('customUser');
        });

        it('should handle save errors', async () => {
            const mockAgent = {
                save: jest.fn().mockRejectedValue(new Error('Save failed'))
            };

            (VoiceAgent as any).mockImplementation(() => mockAgent);

            const request = { url: 'http://localhost:3000/api/voice-agents', json: async () => ({ title: 'Agent', prompt: 'Prompt' }) } as any

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe('Failed to create voice agent');
        });
    });

    describe('PUT', () => {
        it('should return 400 if id is missing', async () => {
            const request = { url: 'http://localhost:3000/api/voice-agents', json: async () => ({ title: 'Updated' }) } as any

            const response = await PUT(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toContain('Missing required fields');
        });

        it('should return 400 if no update fields provided', async () => {
            const request = { url: 'http://localhost:3000/api/voice-agents', json: async () => ({ id: 'agent123' }) } as any

            const response = await PUT(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toContain('Missing required fields');
        });

        it('should update agent successfully', async () => {
            const mockAgent = {
                _id: 'agent123',
                userId: 'mukul',
                title: 'Updated Agent',
                prompt: 'Updated prompt',
                lastUpdated: new Date(),
                createdAt: new Date()
            };

            VoiceAgent.findByIdAndUpdate.mockResolvedValue(mockAgent)

            const request = { url: 'http://localhost:3000/api/voice-agents', json: async () => ({ id: 'agent123', title: 'Updated Agent', prompt: 'Updated prompt' }) } as any

            const response = await PUT(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.agent.title).toBe('Updated Agent');
        });

        it('should return 404 if agent not found', async () => {
            VoiceAgent.findByIdAndUpdate.mockResolvedValue(null)

            const request = { url: 'http://localhost:3000/api/voice-agents', json: async () => ({ id: 'nonexistent', title: 'Updated' }) } as any

            const response = await PUT(request);
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error).toBe('Voice agent not found');
        });

        it('should update only title', async () => {
            const mockAgent = {
                _id: 'agent123',
                userId: 'mukul',
                title: 'New Title',
                prompt: 'Old prompt',
                lastUpdated: new Date(),
                createdAt: new Date()
            };

            VoiceAgent.findByIdAndUpdate.mockResolvedValue(mockAgent)

            const request = { url: 'http://localhost:3000/api/voice-agents', json: async () => ({ id: 'agent123', title: 'New Title' }) } as any

            const response = await PUT(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
        });

        it('should handle update errors', async () => {
            VoiceAgent.findByIdAndUpdate.mockRejectedValue(new Error('Update failed'))

            const request = { url: 'http://localhost:3000/api/voice-agents', json: async () => ({ id: 'agent123', title: 'Updated' }) } as any

            const response = await PUT(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe('Failed to update voice agent');
        });
    });

    describe('DELETE', () => {
        it('should return 400 if id is missing', async () => {
            const request = { url: 'http://localhost:3000/api/voice-agents' } as any
            const response = await DELETE_(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe('Agent ID is required');
        });

        it('should delete agent successfully', async () => {
            VoiceAgent.findByIdAndDelete.mockResolvedValue({ _id: 'agent123' })

            const request = { url: 'http://localhost:3000/api/voice-agents?id=agent123' } as any
            const response = await DELETE_(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.message).toContain('deleted successfully');
        });

        it('should return 404 if agent not found', async () => {
            VoiceAgent.findByIdAndDelete.mockResolvedValue(null)

            const request = { url: 'http://localhost:3000/api/voice-agents?id=nonexistent' } as any
            const response = await DELETE_(request);
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error).toBe('Voice agent not found');
        });

        it('should handle delete errors', async () => {
            VoiceAgent.findByIdAndDelete.mockRejectedValue(new Error('Delete failed'))

            const request = { url: 'http://localhost:3000/api/voice-agents?id=agent123' } as any
            const response = await DELETE_(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe('Failed to delete voice agent');
        });
    });
});
