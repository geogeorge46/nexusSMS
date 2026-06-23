import crypto from 'node:crypto'

import { env } from '../config/env.js'

const algorithm = 'HS256'

export function signAuthToken(payload) {
  const now = Math.floor(Date.now() / 1000)
  const body = {
    ...payload,
    iat: now,
    exp: now + parseDurationSeconds(env.jwtExpiresIn),
  }

  const encodedHeader = base64UrlEncode(JSON.stringify({ alg: algorithm, typ: 'JWT' }))
  const encodedPayload = base64UrlEncode(JSON.stringify(body))
  const signature = createSignature(`${encodedHeader}.${encodedPayload}`)

  return `${encodedHeader}.${encodedPayload}.${signature}`
}

export function verifyAuthToken(token) {
  const [encodedHeader, encodedPayload, signature] = token.split('.')

  if (!encodedHeader || !encodedPayload || !signature) {
    throw new Error('Invalid token')
  }

  const expected = createSignature(`${encodedHeader}.${encodedPayload}`)
  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    throw new Error('Invalid token signature')
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload))

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired')
  }

  return payload
}

function createSignature(value) {
  return crypto.createHmac('sha256', env.jwtSecret).update(value).digest('base64url')
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString('base64url')
}

function base64UrlDecode(value) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function parseDurationSeconds(value) {
  const match = String(value).match(/^(\d+)([smhd])$/)

  if (!match) return 7 * 24 * 60 * 60

  const amount = Number(match[1])
  const unit = match[2]
  const multipliers = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
  }

  return amount * multipliers[unit]
}
