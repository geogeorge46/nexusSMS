import winston from 'winston'

import { env } from './env.js'

const formats = [
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  env.isProduction ? winston.format.json() : winston.format.simple(),
]

export const logger = winston.createLogger({
  level: env.logLevel,
  format: winston.format.combine(...formats),
  defaultMeta: {
    service: 'nexus-api',
    environment: env.nodeEnv,
  },
  transports: [new winston.transports.Console()],
})

export const requestLogStream = {
  write(message) {
    logger.http(message.trim())
  },
}
