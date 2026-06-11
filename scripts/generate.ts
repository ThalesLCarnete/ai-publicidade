import Anthropic from '@anthropic-ai/sdk'
import type { RSSArticle } from './rss'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const POLLINATIONS_KEY = process.env.POLLINATIONS_API_KEY

export type GeneratedPost = {
  title: string
  slug: string
  excerpt: string
  category: string
  readTime: string
  content: string
  sourceUrl: string
}

// Gera a imagem via Pollinations e faz upload para media.pollinations.ai (URL permanente).
// Se não houver chave, usa o endpoint público diretamente.
async function generateImageUrl(prompt: string, width = 1200, height = 630): Promise<string> {
  const style = 'dark background, minimal geometric shapes, professional advertising technology, no text'
  const full = `${prompt}, ${style}`
  const baseUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(full)}?model=flux&width=${width}&height=${height}&nologo=true`

  if (!POLLINATIONS_KEY) return baseUrl

  try {
    const headers: Record<string, string> = { Authorization: `Bearer ${POLLINATIONS_KEY}` }

    // Baixa a imagem gerada
    const imgRes = await fetch(baseUrl, { headers, signal: AbortSignal.timeout(30_000) })
    if (!imgRes.ok) return baseUrl
    const imgBytes = await imgRes.arrayBuffer()

    // Upload para media.pollinations.ai → URL permanente e pública
    const form = new FormData()
    form.append('file', new Blob([imgBytes], { type: 'image/jpeg' }), 'image.jpg')
    const uploadRes = await fetch('https://media.pollinations.ai/upload', {
      method: 'POST',
      headers,
      body: form,
      signal: AbortSignal.timeout(20_000),
    })
    if (!uploadRes.ok) return baseUrl
    const { url } = (await uploadRes.json()) as { url: string }
    return url
  } catch {
    return baseUrl // fallback gracioso
  }
}

const SYSTEM = `Você é um jornalista especializado em IA aplicada à publicidade e marketing no Brasil.
Escreve para o blog "IA para Publicidade" com tom analítico, direto e prático.

Sempre responda exatamente neste formato (sem texto fora dele):

===METADATA===
{
  "title": "Título do artigo em PT-BR",
  "slug": "slug-em-kebab-case-sem-acentos",
  "excerpt": "Resumo de 1-2 frases chamativo.",
  "category": "uma de: Criatividade, Dados & IA, Mídia, Conteúdo, Estratégia, Ferramentas",
  "readTime": "X min"
}
===CONTENT===
[artigo completo em MDX aqui]`

export async function scoreArticles(
  articles: RSSArticle[]
): Promise<Array<RSSArticle & { score: number }>> {
  if (articles.length === 0) return []

  const list = articles
    .map((a, i) => `${i + 1}. ${a.title}\n   ${a.description.slice(0, 150)}`)
    .join('\n\n')

  const res = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `Avalie de 0 a 10 a relevância de cada notícia para profissionais de publicidade e marketing no Brasil que trabalham com IA. Retorne SOMENTE um JSON array com os índices e scores, ex: [{"i":1,"s":8},{"i":2,"s":3}].\n\n${list}`,
      },
    ],
  })

  const text = res.content[0].type === 'text' ? res.content[0].text : ''
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) return articles.map((a) => ({ ...a, score: 5 }))

  const scores: Array<{ i: number; s: number }> = JSON.parse(match[0])
  return articles.map((a, i) => ({
    ...a,
    score: scores.find((x) => x.i === i + 1)?.s ?? 0,
  }))
}

export async function generatePost(article: RSSArticle): Promise<GeneratedPost> {
  console.log('  ↳ Gerando imagens via Pollinations...')
  const [coverUrl, img2Url, img3Url] = await Promise.all([
    generateImageUrl(`${article.title} AI marketing concept`),
    generateImageUrl('AI data visualization advertising dashboard futuristic'),
    generateImageUrl('creative technology artificial intelligence digital marketing'),
  ])

  const res = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Escreva um artigo de ~900 palavras sobre esta notícia para o blog "IA para Publicidade":

TÍTULO: ${article.title}
DESCRIÇÃO: ${article.description}
FONTE: ${article.link}

Use estas URLs de imagem EXATAMENTE como estão (não as modifique):

IMAGEM DE CAPA: ${coverUrl}
IMAGEM 2 (para uma seção do meio): ${img2Url}
IMAGEM 3 (para a seção de conclusão): ${img3Url}

Estrutura do artigo:
1. Imagem de capa: ![descrição em português](${coverUrl})
2. Introdução (2-3 parágrafos contextualizando para o mercado BR)
3. 3-4 seções com ## incluindo imagem 2 em uma seção do meio
4. ## O que isso muda para você — inclua imagem 3 aqui
5. Conclusão prática de 1-2 parágrafos
`,
      },
    ],
  })

  const text = res.content[0].type === 'text' ? res.content[0].text : ''
  const metaMatch = text.match(/===METADATA===\s*([\s\S]*?)\s*===CONTENT===/)
  const contentMatch = text.match(/===CONTENT===\s*([\s\S]+)$/)

  if (!metaMatch || !contentMatch) {
    throw new Error(`Resposta malformada do Claude para: ${article.title}`)
  }

  const meta = JSON.parse(metaMatch[1].trim())
  const content = contentMatch[1].trim()

  return {
    title: meta.title,
    slug: meta.slug,
    excerpt: meta.excerpt,
    category: meta.category,
    readTime: meta.readTime,
    content,
    sourceUrl: article.link,
  }
}
