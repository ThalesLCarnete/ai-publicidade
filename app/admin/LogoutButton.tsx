'use client'

import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  async function logout() {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <button
      onClick={logout}
      className="w-full text-left text-xs font-bold tracking-widest uppercase text-white/30 hover:text-white transition-colors px-3 py-2"
    >
      ← Sair
    </button>
  )
}
