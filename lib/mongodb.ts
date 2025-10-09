// NOTE: Avoid importing mongoose at the top-level to prevent pulling in ESM-only
// dependencies (like bson.mjs) when Jest instruments files for coverage. We will
// lazy-load mongoose inside dbConnect only when actually needed at runtime.
// Avoid importing or referencing mongoose types at the top-level.

// Use connection string without explicit TLS parameters - let Mongoose handle it
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mukulrai_db_user:rxHzQuYtSUFN6DHM@cluster0.nnefrop.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
interface MongooseCache {
    conn: any | null;
    promise: Promise<any> | null;
}

declare global {
    var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
    global.mongoose = cached;
}

const IS_TEST = typeof process !== 'undefined' && !!process.env.JEST_WORKER_ID;

async function dbConnect() {
    // In tests, avoid touching real mongoose entirely. Return a stable stub connection.
    if (IS_TEST) {
        if (!cached.conn) {
            cached.conn = { connection: { readyState: 1, close: async () => undefined } } as any;
        }
        return cached.conn;
    }
    if (cached.conn) {
        // Check if connection is still alive
        if (cached.conn.connection.readyState === 1) {
            console.log('[MongoDB] Using cached connection');
            return cached.conn;
        } else {
            console.log('[MongoDB] Cached connection is stale, clearing...');
            cached.conn = null;
            cached.promise = null;
        }
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
        };

        console.log('[MongoDB] Creating new connection...');
        // Lazy-load mongoose at runtime (CommonJS require) so Jest moduleNameMapper
        // can redirect to a mock and to avoid ESM-only bson import during coverage.
        cached.promise = (async () => {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const mongoose = require('mongoose');
            const m = await mongoose.connect(MONGODB_URI, opts);
            console.log('[MongoDB] Connected successfully');
            return m;
        })().catch((error) => {
            console.error('[MongoDB] Connection failed:', error.message);
            cached.promise = null;
            throw error;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        console.error('[MongoDB] Connection error:', e);
        throw e;
    }

    return cached.conn;
}

// Helper function to clear stale connections
export async function clearMongoConnection() {
    if (IS_TEST) {
        // No-op in tests
        return;
    }
    if (cached.conn) {
        await cached.conn.connection.close();
        cached.conn = null;
        cached.promise = null;
        console.log('[MongoDB] Connection cleared');
    }
}

export default dbConnect;
