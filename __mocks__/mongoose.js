// Robust mock for mongoose to avoid pulling in bson ESM during tests
const mockConnection = {
  readyState: 1,
  close: jest.fn().mockResolvedValue(undefined),
}

// Simple Schema mock supporting index()
function Schema(definition) {
  this.definition = definition
}
Schema.prototype.index = jest.fn()

// Cached models map
const models = {}

// Default model factory returning an object with common mongoose methods as jest.fn
function model(name, schema) {
  if (models[name]) return models[name]
  const chain = {
    sort: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  }
  const m = {
    modelName: name,
    schema,
    create: jest.fn().mockResolvedValue({}),
    find: jest.fn().mockReturnValue(chain),
    findByIdAndUpdate: jest.fn().mockResolvedValue(null),
    findByIdAndDelete: jest.fn().mockResolvedValue(null),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
  }
  models[name] = m
  return m
}

const mockMongoose = {
  connect: jest.fn().mockResolvedValue({ connection: mockConnection }),
  connection: mockConnection,
}

module.exports = {
  __esModule: true,
  default: mockMongoose,
  Schema,
  model,
  models,
}
