import Anthropic from '@anthropic-ai/sdk'
import type { RSSArticle } from './rss'

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
const BLOG_URL = process.env.BLOG_URL ?? 'https://ai-publicidade.vercel.app'

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

// URLs de imagem servidas pelo route handler /api/image do próprio blog
// Gera no HuggingFace on-demand e faz cache no Blob privado — sem chave exposta
function imageUrl(seed: number, type: 'cover' | 'mid' | 'end'): string {
  return `${BLOG_URL}/api/image?seed=${seed}&type=${type}&w=1200&h=630`
}

const SYSTEM_SCORE = `Você é um avaliador de notícias para um blog de IA e publicidade no Brasil.`

const SYSTEM_WRITE = `Você é editor do blog "IA para Publicidade" — o lugar onde profissionais de marketing e publicidade brasileiros descobrem o que a inteligência artificial significa para o dia a dia deles, sem papo de LinkedIn corporativo.

## Tom de voz

**Humor calibrado:** Use ironia leve e inteligente quando couber. Não force graça, mas não seja engessado. Uma piada bem colocada vale mais que dois parágrafos de análise.

**Casual com substância:** Escreva como um colega de trabalho esperto explicando algo no Slack — acessível, com gírias do mercado BR quando naturais ("brief", "budget", "deck", "entregável"), nunca soando forçado.

**Respeito total:** Trate o leitor como par. Sem "como todos sabemos" nem didatismo condescendente. Explique o contexto quando necessário, de igual para igual.

**Ritmo ágil:** Parágrafos curtos (3-4 linhas max). Frases com verbo de ação. Alterne períodos longos com curtos para criar ritmo. O leitor está no celular entre uma reunião e outra.

## Estrutura do artigo

- Título: direto, pode ser provocativo ou ter uma virada inesperada. Máx 90 chars.
- Lide forte: primeira frase que faça a pessoa precisar ler a segunda.
- Contexto rápido (1 parágrafo): o que aconteceu, sem drama.
- Desenvolvimento em 3-4 seções com ## — cada uma responde uma pergunta real do leitor.
- "O que muda pra você": seção prática obrigatória, com exemplos concretos do mercado BR.
- Conclusão: 2-3 linhas, sem "em resumo" ou "concluindo". Termine com insight ou pergunta que fica.

## Proibido

- Bullet points genéricos sem substância
- "No cenário atual", "cada vez mais", "no mundo da IA"
- Começos de parágrafo com "Além disso" ou "Por outro lado"
- Títulos de seção com mais de 6 palavras
- Qualquer variação de "revolucionar" ou "transformar o mercado"

Sempre responda exatamente neste formato (sem texto fora dele):

===METADATA===
{
  "title": "Título do artigo em PT-BR",
  "slug": "slug-em-kebab-case-sem-acentos",
  "excerpt": "Resumo de 1-2 frases: curioso e direto, sem spoiler total.",
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
  const coverUrl = imageUrl(base, 'cover')
  const img2Url = imageUrl(base + 1, 'mid')
  const img3Url = imageUrl(base + 2, 'end')

  console.log(`  ↳ URLs de imagem geradas (seed: ${base})`)

  const text = await chatComplete({
    model: { anthropic: 'claude-sonnet-4-6', pollinations: 'openai' },
    system: SYSTEM_WRITE,
    userMessage: `Escreva um artigo de ~900 palavras sobre esta notícia para o blog "IA para Publicidade":

TÍTULO: ${article.title}
DESCRIÇÃO: ${article.description}
FONTE: ${article.link}

Use estas URLs de imagem EXATAMENTE como estão (não modifique):

IMAGEM DE CAPA: ${coverUrl}
IMAGEM 2 (seção do meio): ${img2Url}
IMAGEM 3 (seção final): ${img3Url}

Estrutura:
1. ![imagem de capa](${coverUrl})
2. Introdução contextualizando para o mercado BR
3. 3-4 seções com ## — inclua ![imagem](${img2Url}) em uma seção do meio
4. ## O que isso muda para você — inclua ![imagem](${img3Url})
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
