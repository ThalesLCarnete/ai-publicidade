import Link from 'next/link'
import type { Post } from '@/lib/posts'
import { formatDate } from '@/lib/posts'

export function ArticleCard({ post, votes }: { post: Post; votes?: number }) {
  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group relative flex flex-col bg-white dark:bg-ink hover:bg-ink dark:hover:bg-ink transition-colors duration-300 overflow-hidden stripe-hover"
    >
      {/* ── Corner brackets (tech decoration) ─────────────── */}
      <span className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-ink/15 dark:border-white/15 group-hover:border-y transition-colors duration-300" />
      <span className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-ink/15 dark:border-white/15 group-hover:border-y transition-colors duration-300" />

      {/* ── Category bar ──────────────────────────────────── */}
      <div className="flex items-center gap-2 px-7 pt-8 pb-0">
        <span className="w-1.5 h-1.5 bg-y rotate-45 shrink-0" />
        <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-ink/40 dark:text-white/40 group-hover:text-y transition-colors">
          {post.category}
        </span>
        <span className="flex-1 h-px bg-ink/8 dark:bg-white/8" />
        <span className="font-mono text-[10px] text-ink/25 dark:text-white/25 group-hover:text-white/30 transition-colors">
          {post.readTime}
        </span>
      </div>

      {/* ── Content ───────────────────────────────────────── */}
      <div className="flex flex-col gap-3 px-7 py-5 flex-1">
        <h2 className="font-display text-[1.6rem] leading-tight tracking-wide text-ink dark:text-white group-hover:text-white uppercase transition-colors">
          {post.title}
        </h2>
        <p className="text-sm text-ink/55 dark:text-white/55 group-hover:text-white/65 leading-relaxed line-clamp-3 transition-colors">
          {post.excerpt}
        </p>
      </div>

      {/* ── Footer ────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-7 pb-7">
        <time className="font-mono text-xs text-ink/25 dark:text-white/25 group-hover:text-white/35 transition-colors">
          {formatDate(post.date)}
        </time>
        <div className="flex items-center gap-3">
          {votes ? (
            <span className="flex items-center gap-1 text-ink/30 dark:text-white/30 group-hover:text-y transition-colors font-bold text-xs tabular-nums">
              <span className="text-sm leading-none">▲</span>
              {votes}
            </span>
          ) : null}
          <span className="flex items-center gap-1.5 text-ink/30 dark:text-white/30 group-hover:text-y transition-colors font-bold text-sm tracking-wider">
            LER
            <span className="text-base leading-none">→</span>
          </span>
        </div>
      </div>

      {/* ── Bottom accent line ────────────────────────────── */}
      <div className="h-px w-0 group-hover:w-full bg-y transition-all duration-500 ease-out" />

      {/* ── Bottom corner brackets ────────────────────────── */}
      <span className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-ink/15 dark:border-white/15 group-hover:border-y/40 transition-colors duration-300" />
      <span className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-ink/15 dark:border-white/15 group-hover:border-y/40 transition-colors duration-300" />
    </Link>
  )
}
