import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import crypto from 'crypto'

const COOKIE_NAME = 'admin_session'
const MAX_AGE_MS = 60 * 60 * 8 * 1000 // 8 hours

function verifyToken(token: string, secret: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8')
    const parts = decoded.split('|')
    if (parts.length !== 3) return false
    const [email, ts, hmac] = parts
    if (Date.now() - parseInt(ts) > MAX_AGE_MS) return false
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${email}|${ts}`)
      .digest('hex')
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected))
  } catch {
    return false
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/admin/login') return NextResponse.next()

  const token = request.cookies.get(COOKIE_NAME)?.value
  const secret = process.env.COOKIE_SECRET ?? ''

  if (!token || !verifyToken(token, secret)) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = { matcher: ['/admin/:path*'] }
