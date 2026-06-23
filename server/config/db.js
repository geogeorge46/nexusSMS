import mongoose from 'mongoose'

export async function connectDatabase(uri) {
  if (!uri) {
    throw new Error('MONGODB_URI is required')
  }

  mongoose.set('strictQuery', true)
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE ?? 10),
  })
}

export function getDatabaseHealth() {
  return {
    status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    readyState: mongoose.connection.readyState,
    name: mongoose.connection.name,
    host: mongoose.connection.host,
  }
}

export async function disconnectDatabase() {
  await mongoose.disconnect()
}
