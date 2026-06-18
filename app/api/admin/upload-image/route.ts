import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import crypto from 'crypto'
import { authorizeRequest } from '@/lib/auth'

// Aceita upload binário (PNG/JPEG/WebP) e devolve a URL pública no Vercel Blob.
// Uso pelo n8n: POST raw binary, header `Authorization: Bearer $BLOG_API_TOKEN`,
// query `?name=meu-slug.png` opcional. Retorna `{ url }`.
export async function POST(req: NextRequest) {
  if (!authorizeRequest(req)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const contentType = req.headers.get('content-type') || 'application/octet-stream'
  const allowed = ['image/png', 'image/jpeg', 'image/webp']
  if (!allowed.some((t) => contentType.startsWith(t))) {
    return NextResponse.json(
      { error: `content-type não suportado: ${contentType}. Use ${allowed.join(', ')}.` },
      { status: 415 },
    )
  }

  const buf = Buffer.from(await req.arrayBuffer())
  if (buf.byteLength === 0) {
    return NextResponse.json({ error: 'body vazio' }, { status: 400 })
  }

  const ext = contentType === 'image/jpeg' ? 'jpg' : contentType === 'image/webp' ? 'webp' : 'png'
  const nameParam = new URL(req.url).searchParams.get('name') || ''
  const safeName = nameParam.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 80)
  const stem = safeName.replace(/\.(png|jpe?g|webp)$/i, '') || `cover-${Date.now()}`
  const suffix = crypto.randomBytes(4).toString('hex')
  const key = `ai-publicidade/covers/${stem}-${suffix}.${ext}`

  try {
    const blob = await put(key, buf, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType,
    })
    return NextResponse.json({ url: blob.url }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[upload-image] put failed:', msg)
    return NextResponse.json({ error: msg, key }, { status: 500 })
  }
}
