const connection = {
	readyState: 1,
	close: jest.fn().mockResolvedValue(undefined),
};

const models = {};
const storage = {}; // In-memory storage for testing

const createModel = (name) => {
	if (models[name]) {
		return models[name];
	}

	if (!storage[name]) {
		storage[name] = [];
	}

	const MockModel = function MockModel(doc = {}) {
		Object.assign(this, doc);
		this._id = 'mock-id-' + Math.random().toString(36).substr(2, 9);
		this.createdAt = new Date();
		this.updatedAt = new Date();
	};

	Object.assign(MockModel, {
		find: jest.fn(() => ({
			exec: jest.fn().mockResolvedValue(storage[name] || []),
		})),
		findOne: jest.fn((query) => {
			console.log(`[MOCK] findOne called with query:`, query);
			const docs = storage[name] || [];
			console.log(`[MOCK] Available docs for ${name}:`, docs.length);
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
			console.log(`[MOCK] findOne result:`, found ? 'found' : 'not found');
			return Promise.resolve(found);
		}),
		findOneAndUpdate: jest.fn((query, update, options = {}) => {
			console.log(`[MOCK] findOneAndUpdate called with query:`, query, 'update:', update, 'options:', options);
			const docs = storage[name] || [];
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
				console.log(`[MOCK] Updated existing doc:`, found);
				return Promise.resolve(found);
			} else if (options.upsert) {
				// Create new or update existing
				const newDoc = { ...query, ...update, updatedAt: new Date() };
				if (!found) {
					newDoc._id = 'mock-id-' + Math.random().toString(36).substr(2, 9);
					newDoc.createdAt = new Date();
					docs.push(newDoc);
					console.log(`[MOCK] Created new doc:`, newDoc);
				} else {
					Object.assign(found, newDoc);
					console.log(`[MOCK] Updated existing doc with upsert:`, found);
				}
				return Promise.resolve(newDoc);
			}

			console.log(`[MOCK] No document found and not upserting`);
			return Promise.resolve(null);
		}),
		findById: jest.fn(),
		findByIdAndUpdate: jest.fn(),
		findByIdAndDelete: jest.fn(),
		create: jest.fn((doc) => {
			const newDoc = { ...doc, _id: 'mock-id-' + Math.random().toString(36).substr(2, 9), createdAt: new Date(), updatedAt: new Date() };
			storage[name].push(newDoc);
			return Promise.resolve(newDoc);
		}),
		insertMany: jest.fn(),
		deleteMany: jest.fn(),
		aggregate: jest.fn(),
		countDocuments: jest.fn(),
		updateOne: jest.fn(),
	});

	MockModel.prototype.save = jest.fn(function() {
		if (!this._id) {
			this._id = 'mock-id-' + Math.random().toString(36).substr(2, 9);
			this.createdAt = new Date();
			storage[name].push(this);
		}
		this.updatedAt = new Date();
		return Promise.resolve(this);
	});

	models[name] = MockModel;
	return MockModel;
};

const connect = jest.fn(async () => ({
	connection,
}));

const Schema = jest.fn(function Schema(definition = {}, options = {}) {
	this.definition = definition;
	this.options = options;
	this._indexes = [];
});

Schema.Types = {
	ObjectId: jest.fn(() => 'mock-object-id'),
};

Schema.prototype.index = jest.fn(function index(fields, options) {
	this._indexes.push([fields, options]);
	return this;
});

Schema.prototype.indexes = jest.fn(function indexes() {
	return [...this._indexes];
});
Schema.prototype.pre = jest.fn();
Schema.prototype.post = jest.fn();
Schema.prototype.method = jest.fn();
Schema.prototype.static = jest.fn();

module.exports = {
	connect,
	connection,
	model: jest.fn((name) => createModel(name)),
	models,
	Schema,
	set: jest.fn(),
	Types: {
		ObjectId: jest.fn(() => 'mock-object-id'),
	},
	// Helper function to clear storage between tests
	__clearStorage: () => {
		Object.keys(storage).forEach(key => {
			storage[key] = [];
		});
	},
};
