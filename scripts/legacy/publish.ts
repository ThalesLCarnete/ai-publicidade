import type { GeneratedPost } from './generate'

const BLOG_URL = process.env.BLOG_URL ?? 'https://ai-publicidade.vercel.app'
const ADMIN_EMAIL = process.env.BLOG_ADMIN_EMAIL ?? ''
const ADMIN_PASSWORD = process.env.BLOG_ADMIN_PASSWORD ?? ''

async function getSessionCookie(): Promise<string> {
  const res = await fetch(`${BLOG_URL}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  if (!res.ok) throw new Error(`Login falhou: ${res.status}`)
  const setCookie = res.headers.get('set-cookie') ?? ''
  const match = setCookie.match(/admin_session=([^;]+)/)
  if (!match) throw new Error('Cookie de sessão não encontrado')
  return `admin_session=${match[1]}`
}

export async function publishPost(post: GeneratedPost): Promise<void> {
  const today = new Date().toISOString().split('T')[0]
  const cookie = await getSessionCookie()

  const res = await fetch(`${BLOG_URL}/api/admin/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      date: today,
      readTime: post.readTime,
      category: post.category,
      content: post.content,
    }),
  })

  if (res.status === 409) {
    console.log(`  ↳ Slug já existe: ${post.slug} — pulando`)
    return
  }
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Publicação falhou (${res.status}): ${body}`)
  }

  console.log(`  ✓ Publicado: ${post.title}`)
}
