import crypto from 'crypto'

const COOKIE_NAME = 'admin_session'
const MAX_AGE = 60 * 60 * 8 // 8 hours

function getSecret(): string {
  const s = process.env.COOKIE_SECRET
  if (!s) throw new Error('COOKIE_SECRET is not set')
  return s
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export function signToken(email: string): string {
  const ts = Date.now().toString()
  const hmac = crypto
    .createHmac('sha256', getSecret())
    .update(`${email}|${ts}`)
    .digest('hex')
  return Buffer.from(`${email}|${ts}|${hmac}`).toString('base64url')
}

export function verifyToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8')
    const parts = decoded.split('|')
    if (parts.length !== 3) return null
    const [email, ts, hmac] = parts

    // Check expiry
    if (Date.now() - parseInt(ts) > MAX_AGE * 1000) return null

    // Verify HMAC
    const expected = crypto
      .createHmac('sha256', getSecret())
      .update(`${email}|${ts}`)
      .digest('hex')
    if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected))) return null

    return email
  } catch {
    return null
  }
}

export function cookieName(): string {
  return COOKIE_NAME
}

export function cookieOptions(maxAge = MAX_AGE) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
    secure: process.env.NODE_ENV === 'production',
  }
}
