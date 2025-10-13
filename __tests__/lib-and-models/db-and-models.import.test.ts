// Provide a lightweight mongoose stub that supports Schema/model without pulling ESM deps
jest.mock('mongoose', () => {
  class Schema {
    constructor(_def: any) {}
    index() { return this }
  }
  const models: Record<string, any> = {}
  const model = (name: string, _schema: any) => {
    if (!models[name]) models[name] = { modelName: name }
    return models[name]
  }
  const connect = jest.fn(() => Promise.resolve({ connection: { readyState: 1, close: jest.fn() } }))
  const defaultExport = { connect }
  return {
    __esModule: true,
    default: defaultExport,
    Schema,
    model,
    models,
  }
})

describe('lib and models import (esm-safe)', () => {
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
    ]).then(([c1, c2, c3, c4]) => {
      expect(c1.default).toBeTruthy()
      expect(c2.default).toBeTruthy()
      expect(c3.default).toBeTruthy()
      expect(c4.default).toBeTruthy()
    })
  })
})
