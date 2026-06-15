export type RSSArticle = {
  title: string
  description: string
  link: string
  pubDate: string
}

// Feeds verificados como funcionando
const FEEDS = [
  'https://techcrunch.com/tag/artificial-intelligence/feed/',
  'https://venturebeat.com/category/ai/feed/',
  'https://thenextweb.com/neural/feed/',
  'https://siliconangle.com/feed/',
  'https://www.adweek.com/feed/',
  'https://feeds.feedburner.com/venturebeat/SZYF',
]

function extractTag(xml: string, tag: string): string {
  const pattern = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*)<\\/${tag}>`,
    'i'
  )
  const m = xml.match(pattern)
  return (m?.[1] ?? m?.[2] ?? '').trim()
}

// Suporta tanto RSS (<item>) quanto Atom (<entry>)
function parseItems(xml: string): RSSArticle[] {
  const rssBlocks = xml.match(/<item[\s>][\s\S]*?<\/item>/g) ?? []
  const atomBlocks = xml.match(/<entry[\s>][\s\S]*?<\/entry>/g) ?? []
  const blocks = rssBlocks.length > 0 ? rssBlocks : atomBlocks

  return blocks.map((block) => {
    const link =
      extractTag(block, 'link') ||
      (block.match(/<link[^>]+href=["']([^"']+)["']/) ?? [])[1] ||
      extractTag(block, 'guid')
    const pubDate =
      extractTag(block, 'pubDate') ||
      extractTag(block, 'published') ||
      extractTag(block, 'updated')

    return {
      title: extractTag(block, 'title'),
      description: extractTag(block, 'description')
        .replace(/<[^>]+>/g, '')
        .slice(0, 400) || extractTag(block, 'summary').replace(/<[^>]+>/g, '').slice(0, 400),
      link,
      pubDate,
    }
  }).filter((a) => a.title && a.link)
}

function isRecent(pubDate: string, days = 5): boolean {
  if (!pubDate) return true
  const d = new Date(pubDate)
  if (isNaN(d.getTime())) return true
  return Date.now() - d.getTime() < days * 86_400_000
}

export async function fetchAllFeeds(): Promise<RSSArticle[]> {
  const results = await Promise.allSettled(
    FEEDS.map(async (url) => {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 ai-publicidade-bot/1.0' },
        signal: AbortSignal.timeout(10_000),
        redirect: 'follow',
      })
      const xml = await res.text()
      return parseItems(xml).filter((a) => isRecent(a.pubDate))
    })
  )

  return results
    .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
    .filter((a, i, arr) => arr.findIndex((b) => b.link === a.link) === i)
}
