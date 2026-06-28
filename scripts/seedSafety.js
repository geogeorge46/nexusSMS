export function assertSafeSeed(scriptName) {
  const isProduction = process.env.NODE_ENV === 'production'
  const allowed = process.env.ALLOW_PRODUCTION_SEED === 'true'

  if (isProduction && !allowed) {
    throw new Error(`${scriptName} is blocked in production. Set ALLOW_PRODUCTION_SEED=true only for an intentional demo reset.`)
  }
}
