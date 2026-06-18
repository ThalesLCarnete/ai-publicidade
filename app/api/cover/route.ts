import { NextRequest, NextResponse } from 'next/server'
import { get } from '@vercel/blob'

// Proxy público pras cover images: o Blob store do projeto é private (modo
// imutável), então as imagens não são acessíveis direto por URL. Esta rota lê
// o blob via SDK (autorizado pelo BLOB_READ_WRITE_TOKEN) e serve os bytes com
// cache longo. Sem auth: as imagens são conteúdo público do blog.
//
// Uso: GET /api/cover?b=<url-do-blob-encodada>

const ALLOWED_HOST = '.blob.vercel-storage.com'

function contentTypeFromUrl(u: string): string {
  if (/\.png(\?|$)/i.test(u)) return 'image/png'
  if (/\.jpe?g(\?|$)/i.test(u)) return 'image/jpeg'
  if (/\.webp(\?|$)/i.test(u)) return 'image/webp'
  return 'application/octet-stream'
}

export async function GET(req: NextRequest) {
  const b = new URL(req.url).searchParams.get('b')
  if (!b) {
    return NextResponse.json({ error: 'parâmetro b (url do blob) é obrigatório' }, { status: 400 })
  }

  // Anti-SSRF: só aceita URLs do próprio Vercel Blob
  let parsed: URL
  try {
    parsed = new URL(b)
  } catch {
    return NextResponse.json({ error: 'url inválida' }, { status: 400 })
  }
  if (!parsed.hostname.endsWith(ALLOWED_HOST)) {
    return NextResponse.json({ error: 'host não permitido' }, { status: 400 })
  }

  try {
    const result = await get(b, { access: 'private', useCache: false })
    if (!result || !result.stream) {
      return NextResponse.json({ error: 'blob não encontrado' }, { status: 404 })
    }
    return new NextResponse(result.stream as unknown as ReadableStream, {
      status: 200,
      headers: {
        'Content-Type': contentTypeFromUrl(b),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[cover proxy] get failed:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
