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

function useDB(): boolean {
  return !!process.env.POSTGRES_URL
}

export async function getPosts(): Promise<Post[]> {
  if (useDB()) {
    const { dbGetPosts } = await import('./db')
    return dbGetPosts()
  }
  return JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  if (useDB()) {
    const { dbGetPostWithContent } = await import('./db')
    const post = await dbGetPostWithContent(slug)
    return post ?? undefined
  }
  const posts: Post[] = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
  return posts.find((p) => p.slug === slug)
}

export async function getPostContent(slug: string): Promise<string> {
  if (useDB()) {
    const { dbGetPostWithContent } = await import('./db')
    const post = await dbGetPostWithContent(slug)
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
