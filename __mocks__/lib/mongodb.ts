export const clearMongoConnection = jest.fn().mockResolvedValue(undefined)

const dbConnect = jest.fn().mockResolvedValue(undefined)

export default dbConnect
