// Provide a mongoose stub that can simulate different connection states
let connectCallCount = 0
let shouldFailConnection = false
let connectionReadyState = 1

jest.mock('mongoose', () => {
  class Schema {
    constructor(_def: any) {}
    index() { return this }
  }
  const models: Record<string, any> = {}
  const model = jest.fn((name: string, _schema: any) => {
    if (!models[name]) models[name] = { modelName: name }
    return models[name]
  })

  const connection = {
    get readyState() {
      return connectionReadyState
    },
    close: jest.fn()
  }

  const connect = jest.fn(() => {
    connectCallCount++
    if (shouldFailConnection) {
      return Promise.reject(new Error('Connection failed'))
    }
    return Promise.resolve({
      connection
    })
  })

  const defaultExport = { connect, models, model }
  return {
    __esModule: true,
    default: defaultExport,
    Schema,
    model,
    models,
  }
})

describe('lib and models import (esm-safe)', () => {
  beforeEach(() => {
    // Clear mongoose cache between tests
    delete (global as any).mongoose;
    jest.clearAllMocks();
    jest.resetModules();
    // Reset mock state
    connectCallCount = 0
    shouldFailConnection = false
    connectionReadyState = 1
    // Clear require cache to force re-import
    delete require.cache[require.resolve('@/lib/mongodb')]
  });

  it('imports dbConnect and clearMongoConnection without side effects', async () => {
    const mod = await import('@/lib/mongodb')
    const conn = await mod.default()
    expect(conn).toBeTruthy()
    await mod.clearMongoConnection()
  })

  it('imports models to ensure coverage of schema definitions', () => {
    return Promise.all([
      import('@/models/Campaign'),
      import('@/models/CampaignContact'),
      import('@/models/Chat'),
      import('@/models/VoiceAgent'),
      import('@/models/PhoneNumber'),
      import('@/models/WhatsAppMessage'),
      import('@/models/WhatsAppNumber'),
    ]).then(([c1, c2, c3, c4, c5, c6, c7]) => {
      expect(c1.default).toBeTruthy()
      expect(c2.default).toBeTruthy()
      expect(c3.default).toBeTruthy()
      expect(c4.default).toBeTruthy()
      expect(c5.default).toBeTruthy()
      expect(c6.default).toBeTruthy()
      expect(c7.default).toBeTruthy()
    })
  })

  it('reuses cached connection when available and alive', async () => {
    const mod = await import('@/lib/mongodb')
    const conn1 = await mod.default()
    const conn2 = await mod.default()
    expect(conn1).toBe(conn2) // Should return the same cached connection
  })

  it('creates new connection when cached connection is stale', async () => {
    const mod = await import('@/lib/mongodb')

    // First connection - should succeed
    const conn1 = await mod.default()
    expect(conn1).toBeTruthy()
    expect(connectCallCount).toBe(1)

    // Simulate stale connection by changing readyState
    connectionReadyState = 0

    // Second connection - should detect stale (readyState = 0) and create new
    const conn2 = await mod.default()
    expect(conn2).toBeTruthy()
    expect(connectCallCount).toBe(2) // Should have called connect again
  })

  it('handles connection failure gracefully', async () => {
    const mod = await import('@/lib/mongodb')

    // Make connection fail
    shouldFailConnection = true

    // Should throw error
    await expect(mod.default()).rejects.toThrow('Connection failed')
  })

  it('clears connection cache when clearMongoConnection is called', async () => {
    const mod = await import('@/lib/mongodb')
    const conn1 = await mod.default()
    expect(conn1).toBeTruthy()

    await mod.clearMongoConnection()

    // Next call should create a new connection
    const conn2 = await mod.default()
    expect(conn2).toBeTruthy()
  })
})
