import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import type { Post } from '@/lib/posts'

const MANIFEST = path.join(process.cwd(), 'content/posts/manifest.json')
const CONTENT_DIR = path.join(process.cwd(), 'content/posts')

function useDB(): boolean {
  return !!process.env.POSTGRES_URL
}

function fsReadManifest(): Post[] {
  return JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
}

function fsWriteManifest(posts: Post[]) {
  fs.writeFileSync(MANIFEST, JSON.stringify(posts, null, 2))
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  if (useDB()) {
    const { dbGetPostWithContent } = await import('@/lib/db')
    const post = await dbGetPostWithContent(slug)
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(post)
  }

  const posts = fsReadManifest()
  const post = posts.find((p) => p.slug === slug)
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`)
  const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : ''
  return NextResponse.json({ ...post, content })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const body = await req.json()

  if (useDB()) {
    const { dbGetPostWithContent, dbUpdatePost } = await import('@/lib/db')
    const existing = await dbGetPostWithContent(slug)
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await dbUpdatePost(slug, body)
    return NextResponse.json({ ...existing, ...body })
  }

  const posts = fsReadManifest()
  const idx = posts.findIndex((p) => p.slug === slug)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (body.content !== undefined) {
    fs.writeFileSync(path.join(CONTENT_DIR, `${slug}.mdx`), body.content, 'utf8')
  }
  posts[idx] = { ...posts[idx], ...body }
  fsWriteManifest(posts)
  return NextResponse.json(posts[idx])
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  if (useDB()) {
    const { dbDeletePost } = await import('@/lib/db')
    await dbDeletePost(slug)
    return NextResponse.json({ ok: true })
  }

  const posts = fsReadManifest()
  const idx = posts.findIndex((p) => p.slug === slug)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  posts.splice(idx, 1)
  fsWriteManifest(posts)
  return NextResponse.json({ ok: true })
}
