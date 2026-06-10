import { put, list } from '@vercel/blob'
import fs from 'fs'
import path from 'path'
import type { Post } from './posts'

export type PostWithContent = Post & { content: string }

const BLOB_KEY = 'ai-publicidade/posts-db.json'
const MANIFEST = path.join(process.cwd(), 'content/posts/manifest.json')
const CONTENT_DIR = path.join(process.cwd(), 'content/posts')

async function findBlobUrl(): Promise<string | null> {
  const { blobs } = await list({ prefix: 'ai-publicidade/posts-db' })
  return blobs[0]?.url ?? null
}

async function readDB(): Promise<PostWithContent[]> {
  const url = await findBlobUrl()
  if (!url) return []
  const res = await fetch(url, { cache: 'no-store' })
  return res.json()
}

async function writeDB(posts: PostWithContent[]) {
  await put(BLOB_KEY, JSON.stringify(posts, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
  })
}

async function seedFromFiles(): Promise<PostWithContent[]> {
  if (!fs.existsSync(MANIFEST)) return []
  const meta: Post[] = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
  return meta.map((p) => {
    const fp = path.join(CONTENT_DIR, `${p.slug}.mdx`)
    return { ...p, content: fs.existsSync(fp) ? fs.readFileSync(fp, 'utf8') : '' }
  })
}

export async function blobGetPosts(): Promise<Post[]> {
  let posts = await readDB()
  if (posts.length === 0) {
    posts = await seedFromFiles()
    if (posts.length > 0) await writeDB(posts)
  }
  return posts.map(({ content: _c, ...p }) => p)
}

export async function blobGetPostWithContent(slug: string): Promise<PostWithContent | null> {
  let posts = await readDB()
  if (posts.length === 0) {
    posts = await seedFromFiles()
    if (posts.length > 0) await writeDB(posts)
  }
  return posts.find((p) => p.slug === slug) ?? null
}

export async function blobCreatePost(post: PostWithContent) {
  const posts = await readDB()
  if (posts.find((p) => p.slug === post.slug)) throw new Error('Slug já existe')
  await writeDB([post, ...posts])
}

export async function blobUpdatePost(slug: string, data: Partial<PostWithContent>) {
  const posts = await readDB()
  const idx = posts.findIndex((p) => p.slug === slug)
  if (idx === -1) throw new Error('Not found')
  posts[idx] = { ...posts[idx], ...data }
  await writeDB(posts)
}

export async function blobDeletePost(slug: string) {
  const posts = await readDB()
  await writeDB(posts.filter((p) => p.slug !== slug))
}
