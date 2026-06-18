import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import crypto from 'crypto'
import { authorizeRequest } from '@/lib/auth'

// Aceita upload binário (PNG/JPEG/WebP), salva no Vercel Blob (store private)
// e devolve uma URL de proxy (/api/cover) que serve a imagem publicamente.
// O store deste projeto é private (modo imutável, definido na criação), então
// o blob não é acessível direto por <img src>; o proxy lê via SDK e entrega.
// Uso pelo n8n: POST raw binary, header `Authorization: Bearer $BLOG_API_TOKEN`,
// query `?name=meu-slug.png` opcional. Retorna `{ url }`.
export async function POST(req: NextRequest) {
  if (!authorizeRequest(req)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const buf = Buffer.from(await req.arrayBuffer())
  if (buf.byteLength === 0) {
    return NextResponse.json({ error: 'body vazio' }, { status: 400 })
  }

  // Detecta o tipo pelos magic bytes (não confia no Content-Type — o n8n às
  // vezes manda application/octet-stream pra binário).
  function sniff(b: Buffer): { mime: string; ext: string } | null {
    if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { mime: 'image/png', ext: 'png' }
    if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' }
    if (b.length >= 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return { mime: 'image/webp', ext: 'webp' }
    return null
  }
  const detected = sniff(buf)
  if (!detected) {
    return NextResponse.json({ error: 'conteúdo não é PNG, JPEG ou WebP (magic bytes)' }, { status: 415 })
  }
  const contentType = detected.mime
  const ext = detected.ext
  const nameParam = new URL(req.url).searchParams.get('name') || ''
  const safeName = nameParam.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 80)
  const stem = safeName.replace(/\.(png|jpe?g|webp)$/i, '') || `cover-${Date.now()}`
  const suffix = crypto.randomBytes(4).toString('hex')
  const key = `ai-publicidade/covers/${stem}-${suffix}.${ext}`

  try {
    const blob = await put(key, buf, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType,
    })
    // O blob é private — devolve URL de proxy (/api/cover) que serve publicamente.
    const origin = new URL(req.url).origin
    const proxyUrl = `${origin}/api/cover?b=${encodeURIComponent(blob.url)}`
    return NextResponse.json({ url: proxyUrl, blobUrl: blob.url }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[upload-image] put failed:', msg)
    return NextResponse.json({ error: msg, key }, { status: 500 })
  }
}
