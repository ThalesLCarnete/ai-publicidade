import Anthropic from '@anthropic-ai/sdk'
import type { RSSArticle } from './rss'

const POLLINATIONS_KEY = process.env.POLLINATIONS_API_KEY
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

// Usa Anthropic se tiver chave, caso contrário usa Pollinations (OpenAI-compatible)
const anthropic = ANTHROPIC_KEY ? new Anthropic({ apiKey: ANTHROPIC_KEY }) : null

export type GeneratedPost = {
  title: string
  slug: string
  excerpt: string
  category: string
  readTime: string
  content: string
  sourceUrl: string
}

// Chamada unificada: Anthropic ou Pollinations
async function chatComplete(opts: {
  model: { anthropic: string; pollinations: string }
  system: string
  userMessage: string
  maxTokens: number
}): Promise<string> {
  if (anthropic) {
    const res = await anthropic.messages.create({
      model: opts.model.anthropic,
      max_tokens: opts.maxTokens,
      system: opts.system,
      messages: [{ role: 'user', content: opts.userMessage }],
    })
    return res.content[0].type === 'text' ? res.content[0].text : ''
  }

  // Fallback: Pollinations OpenAI-compatible API
  const res = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${POLLINATIONS_KEY}`,
    },
    body: JSON.stringify({
      model: opts.model.pollinations,
      max_tokens: opts.maxTokens,
      messages: [
        { role: 'system', content: opts.system },
        { role: 'user', content: opts.userMessage },
      ],
    }),
    signal: AbortSignal.timeout(120_000),
  })
  const data = (await res.json()) as { choices?: Array<{ message?: { content: string } }> }
  return data.choices?.[0]?.message?.content ?? ''
}

// Gera imagem e faz upload permanente — sk_ nunca exposto na URL final
async function generateImageUrl(prompt: string, width = 1200, height = 630): Promise<string> {
  const style = 'dark background, minimal geometric shapes, professional advertising technology, no text'
  const full = `${prompt}, ${style}`
  const genUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(full)}?model=zimage&width=${width}&height=${height}&nologo=true`

  if (!POLLINATIONS_KEY) return genUrl

  try {
    const headers: Record<string, string> = { Authorization: `Bearer ${POLLINATIONS_KEY}` }

    const imgRes = await fetch(genUrl, { headers, signal: AbortSignal.timeout(40_000) })
    if (!imgRes.ok) return genUrl
    const imgBytes = await imgRes.arrayBuffer()

    const form = new FormData()
    form.append('file', new Blob([imgBytes], { type: 'image/jpeg' }), 'image.jpg')

    const uploadRes = await fetch('https://media.pollinations.ai/upload', {
      method: 'POST',
      headers,
      body: form,
      signal: AbortSignal.timeout(20_000),
    })
    if (!uploadRes.ok) return genUrl
    const { url } = (await uploadRes.json()) as { url: string }
    return url
  } catch {
    return genUrl
  }
}

const SYSTEM_SCORE = `Você é um avaliador de notícias para um blog de IA e publicidade no Brasil.`

const SYSTEM_WRITE = `Você é um jornalista especializado em IA aplicada à publicidade e marketing no Brasil.
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

  const text = await chatComplete({
    model: { anthropic: 'claude-haiku-4-5-20251001', pollinations: 'openai' },
    system: SYSTEM_SCORE,
    userMessage: `Avalie de 0 a 10 a relevância de cada notícia para profissionais de publicidade e marketing no Brasil que trabalham com IA. Retorne SOMENTE um JSON array, ex: [{"i":1,"s":8},{"i":2,"s":3}].\n\n${list}`,
    maxTokens: 512,
  })

  const match = text.match(/\[[\s\S]*\]/)
  if (!match) return articles.map((a) => ({ ...a, score: 5 }))

  const scores: Array<{ i: number; s: number }> = JSON.parse(match[0])
  return articles.map((a, i) => ({
    ...a,
    score: scores.find((x) => x.i === i + 1)?.s ?? 0,
  }))
}

export async function generatePost(article: RSSArticle): Promise<GeneratedPost> {
  console.log('  ↳ Gerando imagens (zimage)...')
  const [coverUrl, img2Url, img3Url] = await Promise.all([
    generateImageUrl(`${article.title} AI marketing concept`),
    generateImageUrl('AI data visualization advertising dashboard futuristic'),
    generateImageUrl('creative technology artificial intelligence digital agency'),
  ])

  const text = await chatComplete({
    model: { anthropic: 'claude-sonnet-4-6', pollinations: 'openai' },
    system: SYSTEM_WRITE,
    userMessage: `Escreva um artigo de ~900 palavras sobre esta notícia para o blog "IA para Publicidade":

TÍTULO: ${article.title}
DESCRIÇÃO: ${article.description}
FONTE: ${article.link}

Use estas URLs de imagem EXATAMENTE como estão:

IMAGEM DE CAPA: ${coverUrl}
IMAGEM 2 (seção do meio): ${img2Url}
IMAGEM 3 (seção final): ${img3Url}

Estrutura:
1. ![descrição em português](${coverUrl})
2. Introdução contextualizando para o mercado BR
3. 3-4 seções com ## incluindo img2 no meio
4. ## O que isso muda para você — use img3
5. Conclusão prática`,
    maxTokens: 4096,
  })

  const metaMatch = text.match(/===METADATA===\s*([\s\S]*?)\s*===CONTENT===/)
  const contentMatch = text.match(/===CONTENT===\s*([\s\S]+)$/)

  if (!metaMatch || !contentMatch) {
    throw new Error(`Resposta malformada para: ${article.title}`)
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
