import Anthropic from '@anthropic-ai/sdk'
import { put } from '@vercel/blob'
import type { RSSArticle } from './rss'

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
const HF_TOKEN = process.env.HUGGINGFACE_TOKEN

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
  const res = await fetch('https://text.pollinations.ai/openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

// Seed determinístico por string — mesma notícia = mesma imagem
function seedFrom(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h) % 1_000_000
}

// Gera imagem via HuggingFace (FLUX.1-schnell) e faz upload para Vercel Blob
// URL final no MDX é pública e permanente, sem chave exposta
async function generateAndUploadImage(
  prompt: string,
  seed: number,
  width = 1024,
  height = 576
): Promise<string> {
  if (!HF_TOKEN) {
    console.log('    ⚠ HUGGINGFACE_TOKEN não definida, pulando imagem')
    return ''
  }

  const style = 'dark background, minimal geometric shapes, professional advertising technology, no text, no watermark, cinematic lighting'
  const fullPrompt = `${prompt}, ${style}`

  try {
    const res = await fetch(
      'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
          'x-use-cache': 'false',
        },
        body: JSON.stringify({
          inputs: fullPrompt,
          parameters: { width, height, num_inference_steps: 4, seed },
        }),
        signal: AbortSignal.timeout(120_000),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`HuggingFace ${res.status}: ${err.slice(0, 200)}`)
    }

    const imgBytes = await res.arrayBuffer()
    if (imgBytes.byteLength < 1000) throw new Error('Imagem vazia retornada')

    const blobKey = `ai-publicidade/images/${seed}-${width}x${height}.jpg`
    const result = await put(blobKey, imgBytes, {
      access: 'public',
      contentType: 'image/jpeg',
      addRandomSuffix: false,
      allowOverwrite: true,
    })
    return result.url
  } catch (err) {
    console.error('    ✗ Erro ao gerar imagem:', (err as Error).message)
    return ''
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
    model: { anthropic: 'claude-haiku-4-5-20251001', pollinations: 'openai-fast' },
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
  const base = seedFrom(article.link)

  console.log('  ↳ Gerando imagens (FLUX.1-schnell → Vercel Blob)...')
  const [coverUrl, img2Url, img3Url] = await Promise.all([
    generateAndUploadImage(`${article.title} AI marketing technology concept`, base, 1200, 630),
    generateAndUploadImage('AI data visualization advertising dashboard futuristic technology', base + 1, 1200, 630),
    generateAndUploadImage('creative technology artificial intelligence digital agency innovation', base + 2, 1200, 630),
  ])

  const text = await chatComplete({
    model: { anthropic: 'claude-sonnet-4-6', pollinations: 'openai' },
    system: SYSTEM_WRITE,
    userMessage: `Escreva um artigo de ~900 palavras sobre esta notícia para o blog "IA para Publicidade":

TÍTULO: ${article.title}
DESCRIÇÃO: ${article.description}
FONTE: ${article.link}

${coverUrl ? `Use estas URLs de imagem EXATAMENTE como estão (não modifique):

IMAGEM DE CAPA: ${coverUrl}
IMAGEM 2 (seção do meio): ${img2Url}
IMAGEM 3 (seção final): ${img3Url}

` : ''}Estrutura:
${coverUrl ? `1. ![imagem de capa](${coverUrl})\n` : ''}2. Introdução contextualizando para o mercado BR
3. 3-4 seções com ## ${img2Url ? `— inclua ![imagem](${img2Url}) em uma seção do meio` : ''}
4. ## O que isso muda para você${img3Url ? ` — inclua ![imagem](${img3Url})` : ''}
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
