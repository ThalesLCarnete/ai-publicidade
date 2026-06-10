import { sql } from '@vercel/postgres'
import fs from 'fs'
import path from 'path'
import type { Post } from './posts'

type PostRow = {
  slug: string
  title: string
  excerpt: string
  date: string
  read_time: string
  category: string
  content?: string
}

function rowToPost(row: PostRow): Post {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    date: row.date,
    readTime: row.read_time,
    category: row.category,
  }
}

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS posts (
      slug        TEXT PRIMARY KEY,
      title       TEXT NOT NULL DEFAULT '',
      excerpt     TEXT NOT NULL DEFAULT '',
      date        TEXT NOT NULL DEFAULT '',
      read_time   TEXT NOT NULL DEFAULT '5 min',
      category    TEXT NOT NULL DEFAULT '',
      content     TEXT NOT NULL DEFAULT '',
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await seedIfEmpty()
}

async function seedIfEmpty() {
  const { rows } = await sql`SELECT COUNT(*) AS count FROM posts`
  if (parseInt(rows[0].count as string) > 0) return

  const manifestPath = path.join(process.cwd(), 'content/posts/manifest.json')
  if (!fs.existsSync(manifestPath)) return

  const posts: Post[] = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  for (const post of posts) {
    const filePath = path.join(process.cwd(), 'content/posts', `${post.slug}.mdx`)
    const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : ''
    await sql`
      INSERT INTO posts (slug, title, excerpt, date, read_time, category, content)
      VALUES (${post.slug}, ${post.title}, ${post.excerpt}, ${post.date}, ${post.readTime}, ${post.category}, ${content})
      ON CONFLICT (slug) DO NOTHING
    `
  }
}

export async function dbGetPosts(): Promise<Post[]> {
  await ensureTable()
  const { rows } = await sql<PostRow>`
    SELECT slug, title, excerpt, date, read_time, category
    FROM posts
    ORDER BY date DESC, created_at DESC
  `
  return rows.map(rowToPost)
}

export async function dbGetPostWithContent(
  slug: string
): Promise<(Post & { content: string }) | null> {
  await ensureTable()
  const { rows } = await sql<PostRow>`
    SELECT slug, title, excerpt, date, read_time, category, content
    FROM posts WHERE slug = ${slug}
  `
  if (!rows[0]) return null
  return { ...rowToPost(rows[0]), content: rows[0].content ?? '' }
}

export async function dbCreatePost(post: Post & { content: string }) {
  await ensureTable()
  const { slug, title, excerpt, date, readTime, category, content } = post
  await sql`
    INSERT INTO posts (slug, title, excerpt, date, read_time, category, content)
    VALUES (${slug}, ${title}, ${excerpt}, ${date}, ${readTime}, ${category}, ${content})
  `
}

export async function dbUpdatePost(slug: string, data: Partial<Post & { content: string }>) {
  const { title = '', excerpt = '', date = '', readTime = '', category = '', content = '' } = data
  await sql`
    UPDATE posts SET
      title     = ${title},
      excerpt   = ${excerpt},
      date      = ${date},
      read_time = ${readTime},
      category  = ${category},
      content   = ${content}
    WHERE slug = ${slug}
  `
}

export async function dbDeletePost(slug: string) {
  await sql`DELETE FROM posts WHERE slug = ${slug}`
}
