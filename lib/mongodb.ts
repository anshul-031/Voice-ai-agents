import mongoose from 'mongoose';

// Use connection string without explicit TLS parameters - let Mongoose handle it
const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

declare global {
    var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
    global.mongoose = cached;
}

async function dbConnect(): Promise<typeof mongoose | null> {
    // Check for MONGODB_URI here, not at module load time
    if (!process.env.MONGODB_URI) {
        console.log('[MongoDB] MONGODB_URI not set, skipping database connection');
        return null;
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
        cached.promise = mongoose.connect(process.env.MONGODB_URI!, opts).then((mongoose) => {
            console.log('[MongoDB] Connected successfully');
            return mongoose;
        }).catch((error) => {
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
    if (cached.conn) {
        await cached.conn.connection.close();
        cached.conn = null;
        cached.promise = null;
        console.log('[MongoDB] Connection cleared');
    }
}

export default dbConnect;
