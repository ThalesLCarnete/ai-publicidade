import Link from 'next/link'
import type { Post } from '@/lib/posts'
import { formatDate } from '@/lib/posts'

export function ArticleCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group flex flex-col bg-white dark:bg-ink hover:bg-ink dark:hover:bg-y transition-colors duration-200"
    >
      <div className="flex flex-col gap-4 p-7 flex-1">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-ink/40 dark:text-white/40 group-hover:text-y dark:group-hover:text-ink/60 transition-colors">
            {post.category}
          </span>
          <span className="w-1 h-1 rounded-full bg-ink/20 dark:bg-white/20 group-hover:bg-white/30 dark:group-hover:bg-ink/30 transition-colors" />
          <span className="text-[10px] text-ink/30 dark:text-white/30 group-hover:text-white/40 dark:group-hover:text-ink/40 transition-colors">
            {post.readTime}
          </span>
        </div>

        <h2 className="font-display text-2xl tracking-wide text-ink dark:text-white group-hover:text-white dark:group-hover:text-ink leading-tight uppercase transition-colors">
          {post.title}
        </h2>

        <p className="text-sm text-ink/60 dark:text-white/60 group-hover:text-white/70 dark:group-hover:text-ink/70 leading-relaxed line-clamp-3 transition-colors">
          {post.excerpt}
        </p>
      </div>

      <div className="flex items-center justify-between px-7 pb-6">
        <time className="text-xs text-ink/30 dark:text-white/30 group-hover:text-white/40 dark:group-hover:text-ink/40 transition-colors">
          {formatDate(post.date)}
        </time>
        <span className="text-ink/30 dark:text-white/30 group-hover:text-y dark:group-hover:text-ink transition-colors font-bold text-base">
          →
        </span>
      </div>
    </Link>
  )
}
