'use client'

import { useEffect, useState } from 'react'

// Upvote anônimo (estilo "curtir"). Dedup por navegador via localStorage:
// clicou → +1 e marca; clicou de novo → -1 e desmarca. Sem login.
export function VoteButton({
  slug,
  initial = 0,
  size = 'md',
}: {
  slug: string
  initial?: number
  size?: 'sm' | 'md'
}) {
  const [count, setCount] = useState(initial)
  const [voted, setVoted] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setVoted(typeof window !== 'undefined' && localStorage.getItem('vote:' + slug) === '1')
  }, [slug])

  async function toggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (busy) return
    setBusy(true)
    const method = voted ? 'DELETE' : 'POST'
    // otimista
    const optimistic = count + (voted ? -1 : 1)
    setCount(Math.max(0, optimistic))
    setVoted(!voted)
    try {
      const r = await fetch(`/api/posts/${slug}/vote`, { method })
      const d = await r.json()
      if (typeof d.count === 'number') setCount(d.count)
      if (voted) localStorage.removeItem('vote:' + slug)
      else localStorage.setItem('vote:' + slug, '1')
    } catch {
      // reverte em caso de erro
      setCount(count)
      setVoted(voted)
    } finally {
      setBusy(false)
    }
  }

  const pad = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-2 text-sm'

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-pressed={voted}
      aria-label={voted ? 'Remover voto' : 'Votar neste post'}
      className={`inline-flex items-center gap-1.5 font-bold tracking-wider border transition-colors ${pad} ${
        voted
          ? 'border-y bg-y text-ink'
          : 'border-ink/20 dark:border-white/20 text-ink/60 dark:text-white/60 hover:border-y hover:text-y'
      }`}
    >
      <span className="leading-none text-base">▲</span>
      <span className="tabular-nums">{count}</span>
    </button>
  )
}
