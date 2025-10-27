// Use the project's mongoose mock at __tests__/mocks/mongoose.js via moduleNameMapper
describe('lib/mongodb', () => {
  const ORIGINAL_ENV = process.env

  const resetGlobalCache = () => {
    try {
      delete (global as any).mongoose
    } catch (_) {
      // ignore
    }
  }

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    process.env = { ...ORIGINAL_ENV }
    process.env.MONGODB_URI = 'mongodb://localhost/test'
    resetGlobalCache()

    const mongooseMock = require('../mocks/mongoose')
    mongooseMock.connection.readyState = 1
    mongooseMock.connect.mockReset()
    mongooseMock.connect.mockResolvedValue({ connection: mongooseMock.connection })
    mongooseMock.connection.close.mockReset()
    mongooseMock.connection.close.mockResolvedValue(undefined)
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
    resetGlobalCache()
  })

  const importWithMock = async () => {
    const mongooseMock = require('../mocks/mongoose')
    jest.doMock('mongoose', () => mongooseMock)
    resetGlobalCache()
    return { mongooseMock, module: await import('@/lib/mongodb') }
  }

  test('dbConnect calls mongoose.connect once and caches connection', async () => {
    const { mongooseMock, module } = await importWithMock()
    const dbConnect = module.default

    const conn1 = await dbConnect()
    expect(mongooseMock.connect).toHaveBeenCalledTimes(1)
    expect(conn1).toBeDefined()

    const conn2 = await dbConnect()
    expect(mongooseMock.connect).toHaveBeenCalledTimes(1)
    expect(conn2).toBe(conn1)
  })

  test('dbConnect returns null when the MongoDB URI is missing', async () => {
    delete process.env.MONGODB_URI
    const { mongooseMock, module } = await importWithMock()
    const dbConnect = module.default

    const result = await dbConnect()
    expect(result).toBeNull()
    expect(mongooseMock.connect).not.toHaveBeenCalled()
  })

  test('dbConnect clears stale cached connection and reconnects', async () => {
    const { mongooseMock, module } = await importWithMock()
    const dbConnect = module.default

    await dbConnect()
    expect(mongooseMock.connect).toHaveBeenCalledTimes(1)

    mongooseMock.connection.readyState = 0
    mongooseMock.connect.mockResolvedValueOnce({ connection: mongooseMock.connection })

    const reconnect = await dbConnect()
    expect(reconnect).toBeDefined()
    expect(mongooseMock.connect).toHaveBeenCalledTimes(2)
  })

  test('dbConnect resets cached promise after a connection rejection', async () => {
    const mongooseMock = require('../mocks/mongoose')
    mongooseMock.connect.mockImplementationOnce(() => Promise.reject(new Error('connect fail')))
    mongooseMock.connect.mockImplementationOnce(() => Promise.resolve({ connection: mongooseMock.connection }))

    jest.doMock('mongoose', () => mongooseMock)
    resetGlobalCache()

    const module = await import('@/lib/mongodb')
    const dbConnect = module.default

    let thrown: unknown
    try {
      await dbConnect()
    } catch (error) {
      thrown = error
    }

    expect(thrown).toBeInstanceOf(Error)
    expect((thrown as Error).message).toBe('connect fail')
    expect(mongooseMock.connect).toHaveBeenCalledTimes(1)

    mongooseMock.connection.readyState = 1
    await expect(dbConnect()).resolves.toEqual({ connection: mongooseMock.connection })
    expect(mongooseMock.connect).toHaveBeenCalledTimes(2)
  })

  test('clearMongoConnection closes and clears cached connection', async () => {
    const { mongooseMock, module } = await importWithMock()
    const dbConnect = module.default

    await dbConnect()
    expect(mongooseMock.connect).toHaveBeenCalledTimes(1)

    await module.clearMongoConnection()
    expect(mongooseMock.connection.close).toHaveBeenCalled()

    mongooseMock.connection.readyState = 1
    mongooseMock.connect.mockResolvedValueOnce({ connection: mongooseMock.connection })
    await dbConnect()
    expect(mongooseMock.connect).toHaveBeenCalledTimes(2)
  })

  test('dbConnect uses an existing global mongoose cache promise', async () => {
    resetGlobalCache()
    jest.resetModules()

    const mongooseMock = require('../mocks/mongoose')
    mongooseMock.connection.readyState = 1
    const cachedPromise = Promise.resolve({ connection: mongooseMock.connection })

    ;(global as any).mongoose = { conn: null, promise: cachedPromise }

    jest.doMock('mongoose', () => mongooseMock)

    const module = await import('@/lib/mongodb')
    const dbConnect = module.default

    const conn = await dbConnect()
    expect(conn).toEqual({ connection: mongooseMock.connection })
  })

  test('dbConnect re-export from dbConnect.ts works', async () => {
    const { default: dbConnectFromDbConnect } = await import('@/lib/dbConnect')
    expect(dbConnectFromDbConnect).toBeDefined()
  })
})
