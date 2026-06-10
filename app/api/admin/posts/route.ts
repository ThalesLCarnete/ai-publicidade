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

export async function GET() {
  return NextResponse.json(readManifest())
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { slug, title, excerpt, date, readTime, category, content } = body

  if (!slug || !title || !content) {
    return NextResponse.json({ error: 'slug, title e content são obrigatórios' }, { status: 400 })
  }

  const posts = readManifest()
  if (posts.find((p) => p.slug === slug)) {
    return NextResponse.json({ error: 'Slug já existe' }, { status: 409 })
  }

  // Write MDX file
  fs.writeFileSync(path.join(CONTENT_DIR, `${slug}.mdx`), content, 'utf8')

  // Update manifest
  const newPost: Post = { slug, title, excerpt, date, readTime, category }
  posts.unshift(newPost)
  writeManifest(posts)

  return NextResponse.json(newPost, { status: 201 })
}
