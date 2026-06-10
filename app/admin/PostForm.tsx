'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type FormData = {
  slug: string
  title: string
  excerpt: string
  date: string
  readTime: string
  category: string
  content: string
}

type Props = {
  initial?: Partial<FormData>
  mode: 'create' | 'edit'
}

const CATEGORIES = ['Criatividade', 'Dados & IA', 'Mídia', 'Conteúdo', 'Estratégia', 'Ferramentas']

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function PostForm({ initial = {}, mode }: Props) {
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState<FormData>({
    slug: initial.slug ?? '',
    title: initial.title ?? '',
    excerpt: initial.excerpt ?? '',
    date: initial.date ?? today,
    readTime: initial.readTime ?? '5 min',
    category: initial.category ?? CATEGORIES[0],
    content: initial.content ?? '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function set(field: keyof FormData, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      // Auto-slug from title on create
      if (field === 'title' && mode === 'create') {
        next.slug = slugify(value)
      }
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const url =
      mode === 'create' ? '/api/admin/posts' : `/api/admin/posts/${initial.slug}`
    const method = mode === 'create' ? 'POST' : 'PUT'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      router.push('/admin')
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Erro ao salvar')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl text-ink dark:text-white uppercase tracking-wide">
          {mode === 'create' ? 'Novo Post' : 'Editar Post'}
        </h1>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-xs font-bold tracking-widest uppercase text-ink/40 dark:text-white/40 hover:text-ink dark:hover:text-white transition-colors border border-ink/10 dark:border-white/10 px-4 py-2.5"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-y text-ink font-bold text-xs tracking-widest uppercase px-5 py-2.5 hover:bg-ink hover:text-y transition-colors disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Publicar'}
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-6 text-red-400 text-xs border border-red-400/20 bg-red-400/10 px-4 py-3">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Title */}
        <div className="col-span-2 flex flex-col gap-1.5">
          <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-ink/40 dark:text-white/40">
            Título *
          </label>
          <input
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            required
            className="border border-ink/15 dark:border-white/10 bg-transparent text-ink dark:text-white px-4 py-3 text-sm focus:outline-none focus:border-ink dark:focus:border-white placeholder-ink/20 dark:placeholder-white/20"
            placeholder="Título do artigo"
          />
        </div>

        {/* Slug */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-ink/40 dark:text-white/40">
            Slug *
          </label>
          <input
            value={form.slug}
            onChange={(e) => set('slug', e.target.value)}
            required
            disabled={mode === 'edit'}
            className="border border-ink/15 dark:border-white/10 bg-transparent text-ink dark:text-white px-4 py-3 text-sm focus:outline-none focus:border-ink dark:focus:border-white disabled:opacity-40 font-mono"
            placeholder="meu-artigo"
          />
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-ink/40 dark:text-white/40">
            Categoria
          </label>
          <select
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            className="border border-ink/15 dark:border-white/10 bg-white dark:bg-[#111] text-ink dark:text-white px-4 py-3 text-sm focus:outline-none focus:border-ink dark:focus:border-white"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-ink/40 dark:text-white/40">
            Data
          </label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
            className="border border-ink/15 dark:border-white/10 bg-transparent text-ink dark:text-white px-4 py-3 text-sm focus:outline-none focus:border-ink dark:focus:border-white"
          />
        </div>

        {/* Read time */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-ink/40 dark:text-white/40">
            Tempo de Leitura
          </label>
          <input
            value={form.readTime}
            onChange={(e) => set('readTime', e.target.value)}
            className="border border-ink/15 dark:border-white/10 bg-transparent text-ink dark:text-white px-4 py-3 text-sm focus:outline-none focus:border-ink dark:focus:border-white"
            placeholder="5 min"
          />
        </div>

        {/* Excerpt */}
        <div className="col-span-2 flex flex-col gap-1.5">
          <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-ink/40 dark:text-white/40">
            Resumo
          </label>
          <textarea
            value={form.excerpt}
            onChange={(e) => set('excerpt', e.target.value)}
            rows={2}
            className="border border-ink/15 dark:border-white/10 bg-transparent text-ink dark:text-white px-4 py-3 text-sm focus:outline-none focus:border-ink dark:focus:border-white resize-none"
            placeholder="Breve descrição do artigo"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-ink/40 dark:text-white/40">
            Conteúdo MDX *
          </label>
          <span className="text-[10px] text-ink/25 dark:text-white/25">Markdown + JSX</span>
        </div>
        <textarea
          value={form.content}
          onChange={(e) => set('content', e.target.value)}
          required
          rows={28}
          className="border border-ink/15 dark:border-white/10 bg-ink text-white/85 px-5 py-4 text-sm font-mono focus:outline-none focus:border-y leading-relaxed resize-y"
          placeholder={`# Título do Artigo\n\nIntrodução do artigo...\n\n## Seção 1\n\nConteúdo da seção.`}
          spellCheck={false}
        />
      </div>
    </form>
  )
}
