import { NextRequest, NextResponse } from 'next/server'
import { put, get, list } from '@vercel/blob'

const HF_TOKEN = process.env.HUGGINGFACE_TOKEN
const PROMPTS: Record<string, string> = {
  cover: 'technological geometry hexagonal grid circuit board neural network advertising technology concept',
  mid: 'isometric data visualization geometric mesh AI dashboard circuit nodes yellow accent dark background',
  end: 'abstract geometric diamond pattern digital technology dark minimal clean neon yellow accent lines',
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const seed = searchParams.get('seed') ?? '0'
  const type = searchParams.get('type') ?? 'cover'
  const w = parseInt(searchParams.get('w') ?? '1200')
  const h = parseInt(searchParams.get('h') ?? '630')

  const blobKey = `ai-publicidade/images/${seed}-${type}-${w}x${h}.jpg`

  // Tentar cache no Blob privado. Sem list() (Advanced Operation): com a URL
  // fixa (addRandomSuffix:false) tentamos o get() direto; 404 = cache miss.
  const base = process.env.BLOB_BASE_URL
  try {
    const cacheUrl = base ? `${base.replace(/\/$/, '')}/${blobKey}` : (await list({ prefix: blobKey })).blobs[0]?.url
    if (cacheUrl) {
      const cached = await get(cacheUrl, { access: 'private', useCache: false })
      if (cached && cached.statusCode === 200) {
        const chunks: Uint8Array[] = []
        const reader = cached.stream.getReader()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (value) chunks.push(value)
        }
        const buf = Buffer.concat(chunks.map((c) => Buffer.from(c)))
        return new NextResponse(buf, {
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        })
      }
    }
  } catch {
    // cache miss — gerar
  }

  // Gerar via HuggingFace FLUX.1-schnell
  if (!HF_TOKEN) {
    return new NextResponse('HUGGINGFACE_TOKEN não configurado', { status: 503 })
  }

  const basePrompt = PROMPTS[type] ?? PROMPTS.cover
  const style = 'technological geometry, circuit board lines, hexagonal grid, dark background #0A0A0A, neon yellow accent #FFE600, no text, no watermark, 8K render, photorealistic'
  const prompt = `${basePrompt}, ${style}`

  try {
    const hfRes = await fetch(
      'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
          'x-use-cache': 'false',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { width: w, height: h, num_inference_steps: 4, seed: parseInt(seed) },
        }),
        signal: AbortSignal.timeout(90_000),
      }
    )

    if (!hfRes.ok) {
      const err = await hfRes.text()
      return new NextResponse(`HuggingFace error: ${err.slice(0, 200)}`, { status: 502 })
    }

    const imgBytes = await hfRes.arrayBuffer()

    // Cachear no Blob privado para futuras requisições
    try {
      await put(blobKey, imgBytes, {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'image/jpeg',
      })
    } catch {
      // falha de cache não impede resposta
    }

    return new NextResponse(imgBytes, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (err) {
    return new NextResponse(`Erro: ${(err as Error).message}`, { status: 500 })
  }
}
