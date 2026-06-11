import { fetchAllFeeds } from './rss'
import { scoreArticles, generatePost } from './generate'
import { publishPost } from './publish'

const MAX_PER_RUN = 2
const MIN_SCORE = 7

async function loadPublishedSlugs(): Promise<Set<string>> {
  try {
    const res = await fetch(
      `${process.env.BLOG_URL ?? 'https://ai-publicidade.vercel.app'}/api/admin/posts`,
      { headers: { Cookie: '' } }
    )
    if (!res.ok) return new Set()
    const posts: Array<{ slug: string }> = await res.json()
    return new Set(posts.map((p) => p.slug))
  } catch {
    return new Set()
  }
}

async function main() {
  console.log('🤖 Auto-post iniciado\n')

  // 1. Buscar feeds RSS
  console.log('📡 Buscando feeds RSS...')
  const articles = await fetchAllFeeds()
  console.log(`   ${articles.length} artigos encontrados nos últimos 3 dias\n`)

  if (articles.length === 0) {
    console.log('Nenhum artigo recente. Encerrando.')
    return
  }

  // 2. Pegar slugs já publicados para deduplicar
  const existingSlugs = await loadPublishedSlugs()

  // 3. Pontuar relevância
  console.log('🧠 Avaliando relevância com Claude...')
  const scored = await scoreArticles(articles.slice(0, 30))
  const relevant = scored
    .filter((a) => a.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)

  console.log(`   ${relevant.length} artigos com score ≥ ${MIN_SCORE}\n`)

  if (relevant.length === 0) {
    console.log('Nenhum artigo relevante hoje. Encerrando.')
    return
  }

  // 4. Gerar e publicar até MAX_PER_RUN posts
  let published = 0
  for (const article of relevant) {
    if (published >= MAX_PER_RUN) break

    console.log(`✍️  Gerando: "${article.title}" (score: ${article.score})`)
    try {
      const post = await generatePost(article)

      if (existingSlugs.has(post.slug)) {
        console.log(`  ↳ Slug existente: ${post.slug} — pulando\n`)
        continue
      }

      await publishPost(post)
      published++
      console.log(`  ↳ Imagens Pollinations embutidas no MDX\n`)
    } catch (err) {
      console.error(`  ✗ Erro ao processar: ${(err as Error).message}\n`)
    }
  }

  console.log(`\n✅ Concluído: ${published} post(s) publicado(s)`)
}

main().catch((err) => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
