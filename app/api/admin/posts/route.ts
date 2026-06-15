import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import type { Post } from '@/lib/posts'
import { authorizeRequest } from '@/lib/auth'

const MANIFEST = path.join(process.cwd(), 'content/posts/manifest.json')
const CONTENT_DIR = path.join(process.cwd(), 'content/posts')

function useBlob(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN
}

export async function GET() {
  if (useBlob()) {
    const { blobGetPosts } = await import('@/lib/blob-store')
    return NextResponse.json(await blobGetPosts())
  }
  return NextResponse.json(JSON.parse(fs.readFileSync(MANIFEST, 'utf8')))
}

export async function POST(req: NextRequest) {
  if (!authorizeRequest(req)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const { slug, title, excerpt, date, readTime, category, content } = body

  if (!slug || !title || !content) {
    return NextResponse.json({ error: 'slug, title e content são obrigatórios' }, { status: 400 })
  }

  const post: Post & { content: string } = { slug, title, excerpt, date, readTime, category, content }

  if (useBlob()) {
    const { blobCreatePost } = await import('@/lib/blob-store')
    try {
      await blobCreatePost(post)
    } catch (err) {
      const msg = (err as Error).message ?? String(err)
      if (msg.includes('Slug já existe')) {
        return NextResponse.json({ error: 'Slug já existe' }, { status: 409 })
      }
      console.error('[blob POST error]', msg)
      return NextResponse.json({ error: msg }, { status: 500 })
    }
    return NextResponse.json(post, { status: 201 })
  }

  const posts: Post[] = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
  if (posts.find((p) => p.slug === slug)) {
    return NextResponse.json({ error: 'Slug já existe' }, { status: 409 })
  }
  fs.writeFileSync(path.join(CONTENT_DIR, `${slug}.mdx`), content, 'utf8')
  posts.unshift(post)
  fs.writeFileSync(MANIFEST, JSON.stringify(posts, null, 2))
  return NextResponse.json(post, { status: 201 })
}
