import { getPosts } from '@/lib/posts'
import { ArticleCard } from '@/components/ArticleCard'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const posts = await getPosts()

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative border-b border-y/15 overflow-hidden geo-grid">
        {/* Geometric corner accent — top right */}
        <svg
          className="absolute top-0 right-0 w-80 h-80 opacity-[0.06] pointer-events-none"
          viewBox="0 0 320 320" fill="none"
        >
          {/* Concentric diamond grid */}
          {[20, 60, 100, 140, 180, 220, 260, 300].map((r) => (
            <rect
              key={r}
              x={160 - r / Math.SQRT2}
              y={160 - r / Math.SQRT2}
              width={r * Math.SQRT2}
              height={r * Math.SQRT2}
              transform="rotate(45 160 160)"
              stroke="#FFE600"
              strokeWidth="1"
              fill="none"
            />
          ))}
          {/* Cross-hair */}
          <line x1="160" y1="0" x2="160" y2="320" stroke="#FFE600" strokeWidth="0.5" />
          <line x1="0" y1="160" x2="320" y2="160" stroke="#FFE600" strokeWidth="0.5" />
          {/* Center dot */}
          <circle cx="160" cy="160" r="3" fill="#FFE600" />
        </svg>

        {/* Small circuit nodes — left side */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-6 pl-2 opacity-20 pointer-events-none">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="block w-1.5 h-1.5 bg-y rotate-45" />
          ))}
        </div>

        <div className="max-w-5xl mx-auto px-6 py-20 relative">
          <div className="flex items-start gap-5">
            {/* Animated accent bar */}
            <div className="w-1 self-stretch bg-y shrink-0 mt-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/40 scanline" />
            </div>

            <div>
              {/* System label */}
              <div className="flex items-center gap-3 mb-6">
                <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-y/70">
                  SYS://IA_PUBLICIDADE
                </span>
                <span className="blink text-y text-xs">▮</span>
              </div>

              <h1 className="font-display text-[clamp(4rem,10vw,8rem)] leading-none tracking-wide text-ink dark:text-white uppercase">
                IA para<br />Publicidade
              </h1>

              <p className="mt-6 text-sm text-ink/50 dark:text-white/50 max-w-lg leading-relaxed">
                As ferramentas, tendências e estratégias de IA que estão
                reescrevendo as regras do mercado publicitário — em PT-BR,
                sem enrolação.
              </p>

              {/* Stats row */}
              <div className="mt-8 flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-y rotate-45" />
                  <span className="font-mono text-[11px] text-ink/40 dark:text-white/40">
                    {posts.length} artigos publicados
                  </span>
                </div>
                <div className="h-3 w-px bg-ink/15 dark:bg-white/15" />
                <div className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-y/50 rotate-45" />
                  <span className="font-mono text-[11px] text-ink/40 dark:text-white/40">
                    3× por semana
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Grid label ───────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 pt-10 pb-4 flex items-center gap-3">
        <span className="w-1.5 h-1.5 bg-y rotate-45" />
        <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-ink/30 dark:text-white/30">
          Últimas publicações
        </span>
        <div className="flex-1 h-px bg-ink/8 dark:bg-white/8" />
      </div>

      {/* ── Article grid ─────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-ink/8 dark:bg-white/8 border border-ink/8 dark:border-white/8">
          {posts.map((post) => (
            <ArticleCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </>
  )
}
