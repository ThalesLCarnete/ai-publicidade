'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (res.ok) {
      router.push('/admin')
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Erro ao fazer login')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink flex flex-col">
      {/* Top bar */}
      <div className="border-b border-white/10 px-8 py-4 flex items-center gap-2">
        <span className="text-y font-bold text-2xl leading-none">\</span>
        <span className="font-display text-white text-lg tracking-widest uppercase">
          Admin
        </span>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-5xl text-white uppercase tracking-wide mb-2">
            Login
          </h1>
          <p className="text-white/40 text-sm mb-8">Acesso restrito ao painel editorial.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/5 border border-white/10 text-white px-4 py-3 text-sm focus:outline-none focus:border-y placeholder-white/20"
                placeholder="admin@exemplo.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/5 border border-white/10 text-white px-4 py-3 text-sm focus:outline-none focus:border-y placeholder-white/20"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs border border-red-400/20 bg-red-400/10 px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-y text-ink font-bold tracking-widest uppercase text-sm px-6 py-3 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
