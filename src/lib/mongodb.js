import mongoose from "mongoose";

/**
 * Cached Mongoose connection to avoid creating a new connection on every
 * hot-reload in Next.js development mode.
 */
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

/**
 * connectDB — connects to MongoDB and returns the cached connection.
 * Should be called at the top of every API route handler.
 */
export async function connectDB() {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        const opts = { bufferCommands: false };
        cached.promise = mongoose
            .connect(process.env.MONGODB_URI, opts)
            .then((m) => {
                console.log("[MongoDB] Connected");
                return m;
            });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}
