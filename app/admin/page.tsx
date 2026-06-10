import Link from 'next/link'
import { getPosts, formatDate } from '@/lib/posts'
import { DeleteButton } from './DeleteButton'

export const dynamic = 'force-dynamic'

export default function AdminPostsPage() {
  const posts = getPosts()

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl text-ink dark:text-white uppercase tracking-wide">
            Posts
          </h1>
          <p className="text-ink/40 dark:text-white/40 text-sm mt-1">
            {posts.length} {posts.length === 1 ? 'artigo' : 'artigos'} publicados
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className="bg-y text-ink font-bold text-xs tracking-widest uppercase px-5 py-3 hover:bg-ink hover:text-y transition-colors"
        >
          + Novo Post
        </Link>
      </div>

      <div className="border border-ink/10 dark:border-white/10">
        {posts.length === 0 ? (
          <div className="px-6 py-12 text-center text-ink/30 dark:text-white/30 text-sm">
            Nenhum post ainda.{' '}
            <Link href="/admin/posts/new" className="text-y hover:underline">
              Criar o primeiro
            </Link>
          </div>
        ) : (
          posts.map((post, i) => (
            <div
              key={post.slug}
              className={`flex items-center gap-4 px-6 py-4 ${
                i !== posts.length - 1 ? 'border-b border-ink/10 dark:border-white/10' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-y">
                    {post.category}
                  </span>
                  <span className="text-ink/20 dark:text-white/20 text-xs">·</span>
                  <time className="text-xs text-ink/30 dark:text-white/30">
                    {formatDate(post.date)}
                  </time>
                </div>
                <p className="font-semibold text-ink dark:text-white text-sm truncate">
                  {post.title}
                </p>
                <p className="text-xs text-ink/40 dark:text-white/40 truncate mt-0.5">
                  /{post.slug}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/posts/${post.slug}`}
                  target="_blank"
                  className="text-xs text-ink/30 dark:text-white/30 hover:text-ink dark:hover:text-white transition-colors px-2 py-1.5"
                >
                  ↗
                </Link>
                <Link
                  href={`/admin/posts/${post.slug}/edit`}
                  className="text-xs font-bold tracking-wider uppercase text-ink/50 dark:text-white/50 hover:text-ink dark:hover:text-white transition-colors border border-ink/10 dark:border-white/10 hover:border-ink dark:hover:border-white px-3 py-1.5"
                >
                  Editar
                </Link>
                <DeleteButton slug={post.slug} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
