module.exports = {
	MongoClient: class MongoClient {
		constructor(uri, options) {
			this.uri = uri;
			this.options = options;
			this.isConnected = false;
		}

		async connect() {
			this.isConnected = true;
			return this;
		}

		db() {
			return {
				collection: () => ({
					find: jest.fn(() => ({ toArray: jest.fn(async () => []) })),
				}),
			};
		}

		async close() {
			this.isConnected = false;
		}
	},
};
