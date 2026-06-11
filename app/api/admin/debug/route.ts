import { NextResponse } from 'next/server'
import { list, get } from '@vercel/blob'

export async function GET() {
  const info: Record<string, unknown> = {
    BLOB_TOKEN_SET: !!process.env.BLOB_READ_WRITE_TOKEN,
  }

  try {
    const { blobs } = await list({ prefix: 'ai-publicidade/posts-db' })
    info.blobs_found = blobs.length
    info.blob_urls = blobs.map((b) => ({ url: b.url, pathname: b.pathname, size: b.size }))

    if (blobs.length > 0) {
      const result = await get(blobs[0].url, { access: 'private' })
      if (!result) {
        info.get_result = 'null'
      } else {
        info.get_statusCode = result.statusCode
        if (result.statusCode === 200) {
          const chunks: Uint8Array[] = []
          const reader = result.stream.getReader()
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            if (value) chunks.push(value)
          }
          const text = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf8')
          info.blob_text_length = text.length
          try {
            const parsed = JSON.parse(text)
            info.parsed_type = Array.isArray(parsed) ? 'array' : typeof parsed
            info.parsed_length = Array.isArray(parsed) ? parsed.length : 'N/A'
            if (Array.isArray(parsed)) {
              info.slugs = parsed.map((p: Record<string, unknown>) => p.slug)
            } else {
              info.parsed_value = text.slice(0, 500)
            }
          } catch (e) {
            info.parse_error = (e as Error).message
            info.raw_text = text.slice(0, 500)
          }
        }
      }
    }
  } catch (err) {
    info.error = (err as Error).message
    info.error_stack = (err as Error).stack?.slice(0, 300)
  }

  return NextResponse.json(info)
}
