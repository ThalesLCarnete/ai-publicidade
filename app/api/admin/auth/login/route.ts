import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, signToken, cookieName, cookieOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  const expectedEmail = process.env.ADMIN_EMAIL
  const expectedHash = process.env.ADMIN_PASSWORD_HASH

  if (
    !expectedEmail ||
    !expectedHash ||
    email !== expectedEmail ||
    hashPassword(password) !== expectedHash
  ) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
  }

  const token = signToken(email)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(cookieName(), token, cookieOptions())
  return res
}
