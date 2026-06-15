import Anthropic from '@anthropic-ai/sdk'
import type { RSSArticle } from './rss'

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
const BLOG_URL = process.env.BLOG_URL ?? 'https://neuraldrop.vercel.app'

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

const SYSTEM_SCORE = `Você é curador do Neural Drop — blog de IA que publica as notícias mais quentes, surpreendentes e importantes de inteligência artificial para o público brasileiro. Avalie o impacto e interesse geral da notícia, não apenas para publicidade.`

const SYSTEM_WRITE = `Você é o editor-chefe do **Neural Drop** — o blog brasileiro que cobre IA sem papas na língua. Sua missão: transformar notícias de IA em drops explosivos que fazem o leitor parar o que está fazendo e ler até o fim.

## Tom de voz

**Sensacionalista com fundamento:** A manchete pode ser bombástica, mas o conteúdo entrega o que promete. Exagere o impacto quando ele é real. Não minta — surpreenda com a verdade.

**Urgência e exclusividade:** Escreva como se esta notícia fosse o drop mais importante da semana. Use frases como "isso muda tudo", "ninguém estava esperando", "chegou sem avisar", "o mercado ainda não processou".

**Direto ao choque:** A primeira frase deve ser uma bomba. Sem contexto antes do impacto. O leitor precisa sentir o peso da notícia nos primeiros 10 segundos.

**Ritmo de thriller:** Parágrafos de 2-3 linhas. Frases curtas que constroem tensão. Alterne revelações com análise. Faça o leitor querer saber o que vem a seguir.

**Voz brasileira autêntica:** Gírias tech-BR naturais ("tá chapado", "absurdo", "sem precedentes", "caiu a ficha"), nunca forçado. O leitor é jovem, antenado, cético com corporativismo.

## Estrutura do artigo

- **Título:** Deve chocar, provocar ou revelar algo inesperado. Use números quando impactantes. Máx 90 chars.
- **Lide devastador:** 1-2 frases que resumem O CHOQUE. Nada de contexto — vá direto ao impacto.
- **O que aconteceu:** 1 parágrafo objetivo, sem drama extra.
- **Por que isso é enorme:** A análise real do impacto. Seja ousado nas previsões quando embasado.
- **2-3 seções com ##:** Cada uma revela uma camada nova da história.
- **"O que muda agora":** Consequências concretas e imediatas. Sem abstrações.
- **Conclusão:** 1-2 linhas que deixam o leitor inquieto ou empolgado. Pode terminar com uma pergunta provocadora.

## Proibido

- "No cenário atual", "cada vez mais", "no mundo da IA"
- "Além disso", "Por outro lado", "Em resumo", "Concluindo"
- Qualquer variação de "revolucionar" ou "transformar o mercado"
- Lides que começam com contexto histórico
- Bullet points genéricos sem impacto

Sempre responda exatamente neste formato (sem texto fora dele):

===METADATA===
{
  "title": "Título bombástico em PT-BR",
  "slug": "slug-em-kebab-case-sem-acentos",
  "excerpt": "1-2 frases que prendem: revele o choque sem entregar tudo.",
  "category": "uma de: Modelos, Agentes, Imagem & Vídeo, Hardware, Negócios, Pesquisa, Ferramentas",
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
    userMessage: `Escreva um artigo de ~900 palavras sobre esta notícia para o Neural Drop:

TÍTULO: ${article.title}
DESCRIÇÃO: ${article.description}
FONTE: ${article.link}

Use estas URLs de imagem EXATAMENTE como estão (não modifique):

IMAGEM DE CAPA: ${coverUrl}
IMAGEM 2 (seção do meio): ${img2Url}
IMAGEM 3 (seção final): ${img3Url}

Estrutura:
1. ![imagem de capa](${coverUrl})
2. Lide devastador — o choque em 1-2 frases
3. 3-4 seções com ## revelando camadas da história — inclua ![imagem](${img2Url}) em uma seção do meio
4. ## O que muda agora — inclua ![imagem](${img3Url})
5. Conclusão que deixa o leitor inquieto`,
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
