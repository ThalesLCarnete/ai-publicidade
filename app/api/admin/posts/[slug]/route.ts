import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import type { Post } from '@/lib/posts'

const MANIFEST = path.join(process.cwd(), 'content/posts/manifest.json')
const CONTENT_DIR = path.join(process.cwd(), 'content/posts')

function readManifest(): Post[] {
  return JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
}

function writeManifest(posts: Post[]) {
  fs.writeFileSync(MANIFEST, JSON.stringify(posts, null, 2))
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const posts = readManifest()
  const post = posts.find((p) => p.slug === slug)
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`)
  const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : ''

  return NextResponse.json({ ...post, content })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const body = await req.json()
  const { title, excerpt, date, readTime, category, content } = body

  const posts = readManifest()
  const idx = posts.findIndex((p) => p.slug === slug)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Update MDX file
  if (content !== undefined) {
    fs.writeFileSync(path.join(CONTENT_DIR, `${slug}.mdx`), content, 'utf8')
  }

  // Update manifest entry
  posts[idx] = { ...posts[idx], title, excerpt, date, readTime, category }
  writeManifest(posts)

  return NextResponse.json(posts[idx])
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const posts = readManifest()
  const idx = posts.findIndex((p) => p.slug === slug)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Delete MDX file
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

  // Remove from manifest
  posts.splice(idx, 1)
  writeManifest(posts)

  return NextResponse.json({ ok: true })
}
