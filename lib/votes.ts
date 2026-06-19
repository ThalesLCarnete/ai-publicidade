import { put, list, get } from '@vercel/blob'

// Contador de upvotes por post, guardado num único JSON no Vercel Blob (store
// private — lido via SDK). Escala pra blog pequeno; escrita é read-modify-write
// (sem garantia de atomicidade sob concorrência alta, aceitável aqui).

const KEY = 'ai-publicidade/votes.json'

async function findUrl(): Promise<string | null> {
  const { blobs } = await list({ prefix: 'ai-publicidade/votes' })
  return blobs[0]?.url ?? null
}

async function readVotes(): Promise<Record<string, number>> {
  try {
    const url = await findUrl()
    if (!url) return {}
    const result = await get(url, { access: 'private', useCache: false })
    if (!result || result.statusCode === 304) return {}
    const chunks: Uint8Array[] = []
    const reader = result.stream.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) chunks.push(value)
    }
    const text = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf8')
    const parsed = JSON.parse(text)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch (err) {
    console.error('[votes read]', (err as Error).message)
    return {}
  }
}

async function writeVotes(v: Record<string, number>) {
  await put(KEY, JSON.stringify(v), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  })
}

export async function getVotes(slug: string): Promise<number> {
  const v = await readVotes()
  return v[slug] ?? 0
}

export async function getAllVotes(): Promise<Record<string, number>> {
  return readVotes()
}

export async function adjustVotes(slug: string, delta: number): Promise<number> {
  const v = await readVotes()
  const next = Math.max(0, (v[slug] ?? 0) + delta)
  v[slug] = next
  await writeVotes(v)
  return next
}
