export type Post = {
  slug: string
  title: string
  excerpt: string
  date: string
  readTime: string
  category: string
}

export const posts: Post[] = [
  {
    slug: 'ia-generativa-criacao-anuncios',
    title: 'IA Generativa na Criação de Anúncios',
    excerpt:
      'Como DALL-E 3, Midjourney e Sora estão transformando a produção criativa publicitária — do briefing à entrega em minutos.',
    date: '2026-06-10',
    readTime: '6 min',
    category: 'Criatividade',
  },
  {
    slug: 'personalizacao-em-escala',
    title: 'Personalização em Escala com Machine Learning',
    excerpt:
      'Algoritmos de recomendação e modelos preditivos permitem que marcas entreguem a mensagem certa para a pessoa certa no momento exato.',
    date: '2026-06-07',
    readTime: '5 min',
    category: 'Dados & IA',
  },
  {
    slug: 'ia-midia-programatica',
    title: 'IA e Mídia Programática: o Novo RTB',
    excerpt:
      'Real-time bidding, audience segmentation e otimização de lances com IA estão redefinindo como compramos e vendemos mídia digital.',
    date: '2026-06-03',
    readTime: '7 min',
    category: 'Mídia',
  },
  {
    slug: 'llms-marketing-de-conteudo',
    title: 'LLMs e o Futuro do Marketing de Conteúdo',
    excerpt:
      'ChatGPT, Claude e Gemini estão mudando o fluxo de produção editorial. Como usar esses modelos sem perder voz de marca e autenticidade.',
    date: '2026-05-28',
    readTime: '5 min',
    category: 'Conteúdo',
  },
]

export function getPostBySlug(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug)
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
