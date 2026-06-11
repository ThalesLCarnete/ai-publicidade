export type RSSArticle = {
  title: string
  description: string
  link: string
  pubDate: string
}

const FEEDS = [
  'https://venturebeat.com/ai/feed/',
  'https://techcrunch.com/tag/artificial-intelligence/feed/',
  'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
  'https://feeds.marketingaiinstitute.com/marketingaiinstitute',
  'https://www.adweek.com/feed/',
  'https://feeds.feedburner.com/TechCrunchSocialMedia',
]

function extractTag(xml: string, tag: string): string {
  const pattern = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*)<\\/${tag}>`,
    'i'
  )
  const m = xml.match(pattern)
  return (m?.[1] ?? m?.[2] ?? '').trim()
}

function parseItems(xml: string): RSSArticle[] {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/g) ?? []
  return blocks.map((block) => ({
    title: extractTag(block, 'title'),
    description: extractTag(block, 'description').replace(/<[^>]+>/g, '').slice(0, 400),
    link: extractTag(block, 'link') || extractTag(block, 'guid'),
    pubDate: extractTag(block, 'pubDate'),
  })).filter((a) => a.title && a.link)
}

function isRecent(pubDate: string, days = 3): boolean {
  if (!pubDate) return true
  const d = new Date(pubDate)
  if (isNaN(d.getTime())) return true
  return (Date.now() - d.getTime()) < days * 86_400_000
}

export async function fetchAllFeeds(): Promise<RSSArticle[]> {
  const results = await Promise.allSettled(
    FEEDS.map(async (url) => {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 ai-publicidade-bot/1.0' },
        signal: AbortSignal.timeout(10_000),
      })
      const xml = await res.text()
      return parseItems(xml).filter((a) => isRecent(a.pubDate))
    })
  )

  return results
    .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
    .filter((a, i, arr) => arr.findIndex((b) => b.link === a.link) === i)
}
