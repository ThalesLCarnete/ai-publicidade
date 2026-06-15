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

export async function GET(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  if (useBlob()) {
    const { blobGetPostWithContent } = await import('@/lib/blob-store')
    const post = await blobGetPostWithContent(slug)
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(post)
  }

  const posts: Post[] = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
  const post = posts.find((p) => p.slug === slug)
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`)
  const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : ''
  return NextResponse.json({ ...post, content })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!authorizeRequest(req)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { slug } = await params
  const body = await req.json()

  if (useBlob()) {
    const { blobGetPostWithContent, blobUpdatePost } = await import('@/lib/blob-store')
    const existing = await blobGetPostWithContent(slug)
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await blobUpdatePost(slug, body)
    return NextResponse.json({ ...existing, ...body })
  }

  const posts: Post[] = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
  const idx = posts.findIndex((p) => p.slug === slug)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (body.content !== undefined) {
    fs.writeFileSync(path.join(CONTENT_DIR, `${slug}.mdx`), body.content, 'utf8')
  }
  posts[idx] = { ...posts[idx], ...body }
  fs.writeFileSync(MANIFEST, JSON.stringify(posts, null, 2))
  return NextResponse.json(posts[idx])
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!authorizeRequest(req)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { slug } = await params

  if (useBlob()) {
    const { blobDeletePost } = await import('@/lib/blob-store')
    await blobDeletePost(slug)
    return NextResponse.json({ ok: true })
  }

  const posts: Post[] = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
  const idx = posts.findIndex((p) => p.slug === slug)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  posts.splice(idx, 1)
  fs.writeFileSync(MANIFEST, JSON.stringify(posts, null, 2))
  return NextResponse.json({ ok: true })
}
