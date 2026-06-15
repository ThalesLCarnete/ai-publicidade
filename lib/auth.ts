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

// Autoriza requisições de escrita na API: Bearer token (n8n/automação)
// ou cookie de sessão do admin (browser). Retorna o identificador do chamador ou null.
export function authorizeRequest(req: {
  headers: { get(name: string): string | null }
  cookies: { get(name: string): { value: string } | undefined }
}): string | null {
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice(7)
    const expected = process.env.BLOG_API_TOKEN
    if (
      expected &&
      token.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))
    ) {
      return 'api-token'
    }
    return null
  }

  const cookie = req.cookies.get(COOKIE_NAME)
  if (cookie) return verifyToken(cookie.value)

  return null
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
