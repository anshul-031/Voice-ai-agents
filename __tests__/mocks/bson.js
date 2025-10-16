class ObjectId {
	constructor(id = '000000000000000000000000') {
		this.id = id;
	}

	toHexString() {
		return this.id;
	}
}

module.exports = {
	ObjectId,
	BSON: {},
	BSONError: class BSONError extends Error {},
	BSONRuntimeError: class BSONRuntimeError extends Error {},
	serialize: jest.fn(() => Buffer.from([])),
	deserialize: jest.fn(() => ({})),
};
