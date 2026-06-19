import { NextRequest, NextResponse } from 'next/server'
import { getVotes, adjustVotes } from '@/lib/votes'

// Upvotes anônimos (sem login). Dedup é client-side via localStorage:
// POST = +1 (curtir), DELETE = -1 (descurtir). GET = contagem atual.
// Sem auth: votar é ação pública.

export async function GET(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return NextResponse.json({ count: await getVotes(slug) })
}

export async function POST(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return NextResponse.json({ count: await adjustVotes(slug, 1) })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return NextResponse.json({ count: await adjustVotes(slug, -1) })
}
