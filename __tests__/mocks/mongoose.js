const connection = {
	readyState: 1,
	close: jest.fn().mockResolvedValue(undefined),
};

const models = {};

const createModel = (name) => {
	if (models[name]) {
		return models[name];
	}

	const MockModel = function MockModel(doc = {}) {
		Object.assign(this, doc);
	};

	Object.assign(MockModel, {
		find: jest.fn(),
		findOne: jest.fn(),
		findById: jest.fn(),
		findByIdAndUpdate: jest.fn(),
		findByIdAndDelete: jest.fn(),
		create: jest.fn(),
			insertMany: jest.fn(),
		deleteMany: jest.fn(),
		aggregate: jest.fn(),
		countDocuments: jest.fn(),
		updateOne: jest.fn(),
	});

	MockModel.prototype.save = jest.fn();

	models[name] = MockModel;
	return MockModel;
};

const connect = jest.fn(async () => ({
	connection,
}));

const Schema = jest.fn(function Schema(definition = {}, options = {}) {
	this.definition = definition;
	this.options = options;
});

Schema.Types = {
	ObjectId: jest.fn(() => 'mock-object-id'),
};

Schema.prototype.index = jest.fn();
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
};
