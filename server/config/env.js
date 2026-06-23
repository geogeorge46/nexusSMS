const allowedOrigins = (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: process.env.PORT ?? 5000,
  mongoUri: process.env.MONGODB_URI,
  allowedOrigins,
  trustProxy: process.env.TRUST_PROXY === 'true',
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 300),
  logLevel: process.env.LOG_LEVEL ?? 'info',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  passwordPepper: process.env.PASSWORD_PEPPER ?? '',
  allowDemoAuth: process.env.ALLOW_DEMO_AUTH === 'true',
  isProduction: process.env.NODE_ENV === 'production',
}

export function validateRuntimeEnv() {
  const required = ['MONGODB_URI', 'JWT_SECRET']
  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  if (env.isProduction && env.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production')
  }
}
