import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import type { Post } from '@/lib/posts'

const MANIFEST = path.join(process.cwd(), 'content/posts/manifest.json')
const CONTENT_DIR = path.join(process.cwd(), 'content/posts')

function useDB(): boolean {
  return !!process.env.POSTGRES_URL
}

async function fsGetPosts(): Promise<Post[]> {
  return JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
}

async function fsCreatePost(post: Post & { content: string }) {
  fs.writeFileSync(path.join(CONTENT_DIR, `${post.slug}.mdx`), post.content, 'utf8')
  const posts = await fsGetPosts()
  posts.unshift(post)
  fs.writeFileSync(MANIFEST, JSON.stringify(posts, null, 2))
}

export async function GET() {
  if (useDB()) {
    const { dbGetPosts } = await import('@/lib/db')
    return NextResponse.json(await dbGetPosts())
  }
  return NextResponse.json(await fsGetPosts())
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { slug, title, excerpt, date, readTime, category, content } = body

  if (!slug || !title || !content) {
    return NextResponse.json({ error: 'slug, title e content são obrigatórios' }, { status: 400 })
  }

  if (useDB()) {
    const { dbGetPostWithContent, dbCreatePost } = await import('@/lib/db')
    const existing = await dbGetPostWithContent(slug)
    if (existing) return NextResponse.json({ error: 'Slug já existe' }, { status: 409 })
    const post: Post & { content: string } = { slug, title, excerpt, date, readTime, category, content }
    await dbCreatePost(post)
    return NextResponse.json(post, { status: 201 })
  }

  const posts = await fsGetPosts()
  if (posts.find((p) => p.slug === slug)) {
    return NextResponse.json({ error: 'Slug já existe' }, { status: 409 })
  }
  const post: Post & { content: string } = { slug, title, excerpt, date, readTime, category, content }
  await fsCreatePost(post)
  return NextResponse.json(post, { status: 201 })
}
