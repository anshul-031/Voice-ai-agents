const indexesSymbol = Symbol('jest.mongoose.indexes');

type IndexEntry = [Record<string, unknown>, Record<string, unknown> | undefined];

const createIndexCollector = (schemaInstance: any) => {
  if (!schemaInstance[indexesSymbol]) {
    Object.defineProperty(schemaInstance, indexesSymbol, {
      value: [] as IndexEntry[],
      enumerable: false,
      writable: true,
    });
  }

  return schemaInstance[indexesSymbol] as IndexEntry[];
};

const Schema: any = jest.fn(function (this: any, definition: Record<string, unknown>, options?: Record<string, unknown>) {
  this.definition = definition;
  this.options = options ?? {};
  this.methods = {};
  this.statics = {};
  this.virtual = jest.fn().mockReturnValue({ get: jest.fn(), set: jest.fn() });
  this.pre = jest.fn().mockReturnThis();
  this.post = jest.fn().mockReturnThis();
  this.add = jest.fn().mockReturnThis();
  this.path = jest.fn();
  this.plugin = jest.fn().mockReturnThis();
  createIndexCollector(this);
  this.index = jest.fn((fields: Record<string, unknown>, options?: Record<string, unknown>) => {
    const collector = createIndexCollector(this);
    collector.push([fields, options]);
    return this;
  });
});

// Define a configurable indexes method on the prototype so tests can delete it
Object.defineProperty(Schema.prototype, 'indexes', {
  value: function(this: any): IndexEntry[] {
    const collector = createIndexCollector(this);
    return [...collector];
  },
  writable: true,
  configurable: true,
});
(Schema as any).Types = {
  ObjectId: jest.fn().mockImplementation((value?: string) => value ?? 'mock-object-id'),
};

const models: Record<string, any> = {};
const storage: Record<string, any[]> = {}; // In-memory storage for testing

const defaultModelMethods = (modelName: string) => ({
  create: jest.fn((data: any) => {
    if (!storage[modelName]) storage[modelName] = [];
    const newDoc = { ...data, _id: 'mock-id-' + Math.random().toString(36).substr(2, 9), createdAt: new Date(), updatedAt: new Date() };
    storage[modelName].push(newDoc);
    return Promise.resolve(newDoc);
  }),
  find: jest.fn(() => ({
    exec: jest.fn().mockResolvedValue(storage[modelName] || []),
  })),
  findOne: jest.fn((query: any) => {
    const docs = storage[modelName] || [];
    let found = null;
    for (const doc of docs) {
      let matches = true;
      for (const [key, value] of Object.entries(query)) {
        if (doc[key] !== value) {
          matches = false;
          break;
        }
      }
      if (matches) {
        found = doc;
        break;
      }
    }
    return Promise.resolve(found);
  }),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  updateMany: jest.fn(),
  insertMany: jest.fn(),
  aggregate: jest.fn(),
  deleteMany: jest.fn(),
  countDocuments: jest.fn(),
  estimateDocumentCount: jest.fn(),
  distinct: jest.fn(),
  bulkWrite: jest.fn(),
  findOneAndUpdate: jest.fn((query: any, update: any, options: any = {}) => {
    const docs = storage[modelName] || [];
    let foundIndex = -1;
    let found = null;

    // Find existing document
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      let matches = true;
      for (const [key, value] of Object.entries(query)) {
        if (doc[key] !== value) {
          matches = false;
          break;
        }
      }
      if (matches) {
        foundIndex = i;
        found = doc;
        break;
      }
    }

    if (found && !options.upsert) {
      // Update existing
      Object.assign(found, update, { updatedAt: new Date() });
      return Promise.resolve(found);
    } else if (options.upsert) {
      // Create new or update existing
      const newDoc = { ...query, ...update, updatedAt: new Date() };
      if (!found) {
        newDoc._id = 'mock-id-' + Math.random().toString(36).substr(2, 9);
        newDoc.createdAt = new Date();
        docs.push(newDoc);
      } else {
        Object.assign(found, newDoc);
      }
      return Promise.resolve(newDoc);
    }

    return Promise.resolve(null);
  }),
  findOneAndDelete: jest.fn(),
  replaceOne: jest.fn(),
});

const ensureModel = (name: string) => {
  if (!models[name]) {
    if (!storage[name]) storage[name] = [];
    const ctor: any = jest.fn((data?: any) => ({
      ...(data || {}),
      save: jest.fn().mockResolvedValue(undefined),
    }));
    Object.assign(ctor, {
      modelName: name,
      ...defaultModelMethods(name),
    });
    models[name] = ctor;
  }
  return models[name];
};

const model = jest.fn((name: string, schema?: unknown) => {
  const modelCtor = ensureModel(name);
  if (schema !== undefined) {
    Object.defineProperty(modelCtor, 'schema', {
      value: schema,
      enumerable: false,
      configurable: true,
      writable: true,
    });
  }
  return modelCtor;
});

const connection = {
  readyState: 1,
  close: jest.fn().mockResolvedValue(undefined),
};

const connect = jest.fn(async () => ({
  connection,
  models,
  model,
}));

const disconnect = jest.fn(async () => {
  connection.readyState = 0;
});

const resetMocks = () => {
  Schema.mockClear();
  model.mockClear();
  connect.mockClear();
  disconnect.mockClear();
  connection.close.mockClear();
  for (const key of Object.keys(models)) {
    delete models[key];
  }
  for (const key of Object.keys(storage)) {
    delete storage[key];
  }
  connection.readyState = 1;
};

const mongooseMock = {
  connect,
  disconnect,
  connection,
  model,
  models,
  Schema,
  Types: {
    ObjectId: jest.fn().mockImplementation((value?: string) => value ?? 'mock-object-id'),
  },
  __reset: resetMocks,
  __clearStorage: () => {
    Object.keys(storage).forEach(key => {
      storage[key] = [];
    });
  },
};

module.exports = {
  __esModule: true,
  default: mongooseMock,
  ...mongooseMock,
};

