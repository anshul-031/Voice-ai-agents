// Use the project's mongoose mock at __tests__/mocks/mongoose.js via moduleNameMapper
describe('lib/mongodb', () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...ORIGINAL_ENV }
    process.env.MONGODB_URI = 'mongodb://localhost/test'
    // clear global cache if present
    try { delete (global as any).mongoose } catch (_) {}
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
    jest.clearAllMocks()
    try { delete (global as any).mongoose } catch (_) {}
  })

  test('dbConnect calls mongoose.connect once and caches connection', async () => {
    const mongooseMock = require('../mocks/mongoose')
    jest.doMock('mongoose', () => mongooseMock)

    // Ensure no cached global mongoose from previous tests
    try { delete (global as any).mongoose } catch (_) {}

    // Import after mocking to ensure module picks the mock
    const { default: dbConnect } = await import('@/lib/mongodb')

    // Ensure connect resolves with an object having connection
    mongooseMock.connect.mockResolvedValueOnce({ connection: mongooseMock.connection })

    // First call should invoke connect
    const conn1 = await dbConnect()
    expect(mongooseMock.connect).toHaveBeenCalledTimes(1)
    expect(conn1).toBeDefined()

    // Second call should return cached connection without calling connect again
    const conn2 = await dbConnect()
    expect(mongooseMock.connect).toHaveBeenCalledTimes(1)
    expect(conn2).toBe(conn1)
  })

  test('clearMongoConnection closes and clears cached connection', async () => {
    const mongooseMock = require('../mocks/mongoose')
    jest.doMock('mongoose', () => mongooseMock)

    try { delete (global as any).mongoose } catch (_) {}

    const mongodb = await import('@/lib/mongodb')
    const dbConnect = mongodb.default

    mongooseMock.connect.mockResolvedValueOnce({ connection: mongooseMock.connection })

    // Populate cached connection
    await dbConnect()
    expect(mongooseMock.connect).toHaveBeenCalled()

    // Spy on close and call clearMongoConnection
    mongooseMock.connection.close.mockResolvedValueOnce(undefined)

    await mongodb.clearMongoConnection()

    // After clearing, connect can be called again
    mongooseMock.connect.mockResolvedValueOnce({ connection: mongooseMock.connection })
    await dbConnect()
    expect(mongooseMock.connect).toHaveBeenCalledTimes(2)
  })

  test('dbConnect propagates connection errors when connect fails', async () => {
    const mongooseMock = require('../mocks/mongoose')
    jest.doMock('mongoose', () => mongooseMock)

    try { delete (global as any).mongoose } catch (_) {}
    jest.resetModules()

    const { default: dbConnect } = await import('@/lib/mongodb')

    const error = new Error('connect fail')
    mongooseMock.connect.mockRejectedValueOnce(error)

    await expect(dbConnect()).rejects.toThrow('connect fail')
  })

  test('dbConnect re-export from dbConnect.ts works', async () => {
    // Import from dbConnect.ts to ensure re-export coverage
    const { default: dbConnectFromDbConnect } = await import('@/lib/dbConnect')
    expect(dbConnectFromDbConnect).toBeDefined()
  })
})
