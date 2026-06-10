import fs from 'fs'
import path from 'path'

export type Post = {
  slug: string
  title: string
  excerpt: string
  date: string
  readTime: string
  category: string
}

const MANIFEST = path.join(process.cwd(), 'content/posts/manifest.json')
const CONTENT_DIR = path.join(process.cwd(), 'content/posts')

function useBlob(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN
}

export async function getPosts(): Promise<Post[]> {
  if (useBlob()) {
    const { blobGetPosts } = await import('./blob-store')
    return blobGetPosts()
  }
  return JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  if (useBlob()) {
    const { blobGetPostWithContent } = await import('./blob-store')
    const post = await blobGetPostWithContent(slug)
    return post ?? undefined
  }
  const posts: Post[] = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
  return posts.find((p) => p.slug === slug)
}

export async function getPostContent(slug: string): Promise<string> {
  if (useBlob()) {
    const { blobGetPostWithContent } = await import('./blob-store')
    const post = await blobGetPostWithContent(slug)
    return post?.content ?? ''
  }
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`)
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : ''
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
