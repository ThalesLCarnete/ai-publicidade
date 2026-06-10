'use client'

import { useRouter } from 'next/navigation'

export function DeleteButton({ slug }: { slug: string }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm(`Deletar "${slug}"? Esta ação não pode ser desfeita.`)) return

    const res = await fetch(`/api/admin/posts/${slug}`, { method: 'DELETE' })
    if (res.ok) {
      router.refresh()
    } else {
      alert('Erro ao deletar o post.')
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="text-xs font-bold tracking-wider uppercase text-red-400/70 hover:text-red-400 transition-colors border border-red-400/20 hover:border-red-400/50 px-3 py-1.5"
    >
      Deletar
    </button>
  )
}
