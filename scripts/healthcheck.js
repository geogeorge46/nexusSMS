const baseUrl = process.env.HEALTHCHECK_URL ?? `http://127.0.0.1:${process.env.PORT ?? 5000}/api/ready`

try {
  const response = await fetch(baseUrl, { signal: AbortSignal.timeout(5000) })

  if (!response.ok) {
    console.error(`Healthcheck failed with status ${response.status}`)
    process.exit(1)
  }

  const body = await response.json()
  if (body.status !== 'ready') {
    console.error(`Service is not ready: ${JSON.stringify(body)}`)
    process.exit(1)
  }

  process.exit(0)
} catch (error) {
  console.error(`Healthcheck failed: ${error.message}`)
  process.exit(1)
}
