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

export function getPosts(): Post[] {
  return JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
}

export function getPostBySlug(slug: string): Post | undefined {
  return getPosts().find((p) => p.slug === slug)
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Keep backwards-compat export for pages that still import `posts` directly
export const posts = getPosts()
