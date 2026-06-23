import 'dotenv/config'

import { createServer } from 'node:http'

import { app } from './app.js'
import { configureCloudinary } from './config/cloudinary.js'
import { env, validateRuntimeEnv } from './config/env.js'
import { connectDatabase, disconnectDatabase } from './config/db.js'
import { logger } from './config/logger.js'
import { initializeSocketServer } from './socket/socketServer.js'

validateRuntimeEnv()

await connectDatabase(env.mongoUri)
configureCloudinary()

const httpServer = createServer(app)
initializeSocketServer(httpServer)

httpServer.listen(env.port, () => {
  logger.info(`Nexus API listening on port ${env.port}`)
})

async function shutdown(signal) {
  logger.info(`${signal} received. Closing Nexus API.`)

  httpServer.close(async () => {
    await disconnectDatabase()
    logger.info('Nexus API shut down cleanly.')
    process.exit(0)
  })

  setTimeout(() => process.exit(1), 10000).unref()
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))
