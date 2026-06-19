import Link from 'next/link'
import { getPosts, formatDate } from '@/lib/posts'
import { getAllVotes } from '@/lib/votes'
import { ArticleCard } from '@/components/ArticleCard'

export const dynamic = 'force-dynamic'

const TICKER = [
  'GPT-5', 'GEMINI 2.5 PRO', 'CLAUDE OPUS', 'FLUX.1-SCHNELL', 'LLAMA 3',
  'SORA 2', 'GROK 3', 'MISTRAL LARGE', 'DALL·E 4', 'DEEPSEEK R2',
  'AGENTIC AI', 'RAG 2.0', 'MCP PROTOCOL', 'REASONING MODELS', 'DIFFUSION VIDEO',
]

export default async function HomePage() {
  const posts = await getPosts()
  const votes = await getAllVotes()
  const featured = posts.slice(0, 3)
  const older = posts.slice(3)

  return (
    <>
      {/* ── Masthead compacto ─────────────────────────────── */}
      <section className="relative bg-ink border-b border-y/15 overflow-hidden geo-grid">
        {/* Diamond accent — top right */}
        <svg
          className="absolute top-0 right-0 w-64 h-64 opacity-[0.07] pointer-events-none"
          viewBox="0 0 256 256" fill="none"
        >
          {[30, 70, 110, 150, 190, 230].map((r) => (
            <rect
              key={r}
              x={128 - r / Math.SQRT2}
              y={128 - r / Math.SQRT2}
              width={r * Math.SQRT2}
              height={r * Math.SQRT2}
              transform="rotate(45 128 128)"
              stroke="#FFE600"
              strokeWidth="1"
              fill="none"
            />
          ))}
          <circle cx="128" cy="128" r="4" fill="#FFE600" />
        </svg>

        <div className="max-w-5xl mx-auto px-6 py-10 relative">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">

            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-1.5 h-1.5 bg-y rotate-45 pulse-dot" />
                <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-y/55">
                  SYS://NEURAL_DROP
                </span>
                <span className="blink text-y text-xs leading-none">▮</span>
              </div>

              <p className="text-sm text-white/40 max-w-md leading-relaxed">
                As notícias mais quentes de IA — sem filtro corporativo, em PT-BR.
                Três drops por dia, toda manhã.
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 shrink-0">
              <div className="text-center">
                <div className="font-display text-4xl text-y leading-none">
                  {posts.length.toString().padStart(2, '0')}
                </div>
                <div className="font-mono text-[8px] tracking-widest uppercase text-white/25 mt-1">
                  drops
                </div>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="text-center">
                <div className="font-display text-4xl text-white/30 leading-none">3×</div>
                <div className="font-mono text-[8px] tracking-widest uppercase text-white/25 mt-1">
                  por dia
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ticker */}
        <div className="border-t border-y/10 bg-y/[0.03] overflow-hidden">
          <div className="ticker-track flex items-center py-2 whitespace-nowrap select-none">
            {[...Array(3)].flatMap((_, rep) =>
              TICKER.map((item, i) => (
                <span
                  key={`${rep}-${i}`}
                  className="flex items-center gap-4 font-mono text-[9px] tracking-[0.25em] text-white/20 shrink-0 px-3"
                >
                  <span className="w-1 h-1 bg-y/35 rotate-45 shrink-0" />
                  {item}
                </span>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── Drops ────────────────────────────────────────── */}
      <section>

        {/* Section label */}
        <div className="max-w-5xl mx-auto px-6 pt-10 pb-5 flex items-center gap-4">
          <span className="w-1.5 h-1.5 bg-y rotate-45 shrink-0" />
          <span className="font-mono text-[9px] tracking-[0.35em] uppercase text-ink/30 dark:text-white/30">
            ÚLTIMOS DROPS
          </span>
          <div className="flex-1 h-px bg-ink/8 dark:bg-white/8" />
          <span className="font-mono text-[9px] tracking-widest text-ink/20 dark:text-white/20">
            [{posts.length.toString().padStart(3, '0')}]
          </span>
        </div>

        {/* 3 featured — 1 large left + 2 stacked right */}
        {featured.length > 0 && (
          <div className="max-w-5xl mx-auto px-6 mb-px">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-ink/8 dark:bg-white/8 border border-ink/8 dark:border-white/8">

              {/* Card 1 — tall, spans 2 rows */}
              {featured[0] && (
                <Link
                  href={`/posts/${featured[0].slug}`}
                  className="group relative flex flex-col bg-white dark:bg-ink hover:bg-ink transition-colors duration-500 overflow-hidden stripe-hover sm:row-span-2"
                >
                  <span className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-ink/10 dark:border-white/10 group-hover:border-y transition-colors duration-300" />
                  <span className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-ink/10 dark:border-white/10 group-hover:border-y transition-colors duration-300" />
                  <span className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-ink/10 dark:border-white/10 group-hover:border-y/40 transition-colors duration-300" />
                  <span className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-ink/10 dark:border-white/10 group-hover:border-y/40 transition-colors duration-300" />

                  <span className="absolute top-4 right-14 font-mono text-[8px] tracking-[0.3em] uppercase text-ink group-hover:text-y bg-y group-hover:bg-ink border border-transparent group-hover:border-y/30 px-2 py-0.5 transition-colors duration-300">
                    NOVO
                  </span>

                  <div className="flex flex-col flex-1 px-7 pt-9 pb-5 gap-5">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-y rotate-45 shrink-0" />
                      <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-ink/40 dark:text-white/40 group-hover:text-y transition-colors">
                        {featured[0].category}
                      </span>
                      <span className="flex-1 h-px bg-ink/8 dark:bg-white/8" />
                      <span className="font-mono text-[9px] text-ink/25 dark:text-white/25">
                        {featured[0].readTime}
                      </span>
                    </div>

                    <h2 className="font-display text-[clamp(2rem,4vw,3.2rem)] text-ink dark:text-white group-hover:text-white uppercase leading-none tracking-tight transition-colors">
                      {featured[0].title}
                    </h2>

                    <p className="text-sm text-ink/55 dark:text-white/55 group-hover:text-white/65 leading-relaxed transition-colors">
                      {featured[0].excerpt}
                    </p>
                  </div>

                  <div className="flex items-center justify-between px-7 pb-7">
                    <time className="font-mono text-xs text-ink/25 dark:text-white/25 group-hover:text-white/35 transition-colors">
                      {formatDate(featured[0].date)}
                    </time>
                    <span className="flex items-center gap-1.5 text-ink/30 dark:text-white/30 group-hover:text-y transition-colors font-bold text-sm tracking-wider">
                      LER <span className="text-base leading-none">→</span>
                    </span>
                  </div>

                  <div className="h-px w-0 group-hover:w-full bg-y transition-all duration-500 ease-out" />
                </Link>
              )}

              {/* Cards 2 & 3 — stacked */}
              {featured.slice(1).map((post) => (
                <Link
                  key={post.slug}
                  href={`/posts/${post.slug}`}
                  className="group relative flex flex-col bg-white dark:bg-ink hover:bg-ink transition-colors duration-500 overflow-hidden stripe-hover"
                >
                  <span className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-ink/10 dark:border-white/10 group-hover:border-y transition-colors duration-300" />
                  <span className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-ink/10 dark:border-white/10 group-hover:border-y transition-colors duration-300" />
                  <span className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-ink/10 dark:border-white/10 group-hover:border-y/40 transition-colors duration-300" />
                  <span className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-ink/10 dark:border-white/10 group-hover:border-y/40 transition-colors duration-300" />

                  <div className="flex flex-col flex-1 px-6 pt-6 pb-4 gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-y rotate-45 shrink-0" />
                      <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-ink/40 dark:text-white/40 group-hover:text-y transition-colors">
                        {post.category}
                      </span>
                      <span className="flex-1 h-px bg-ink/8 dark:bg-white/8" />
                      <span className="font-mono text-[9px] text-ink/25 dark:text-white/25">
                        {post.readTime}
                      </span>
                    </div>

                    <h2 className="font-display text-[clamp(1.4rem,2.5vw,2rem)] text-ink dark:text-white group-hover:text-white uppercase leading-tight tracking-tight transition-colors">
                      {post.title}
                    </h2>

                    <p className="text-sm text-ink/50 dark:text-white/50 group-hover:text-white/65 leading-relaxed line-clamp-2 transition-colors">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="flex items-center justify-between px-6 pb-5">
                    <time className="font-mono text-xs text-ink/25 dark:text-white/25 group-hover:text-white/35 transition-colors">
                      {formatDate(post.date)}
                    </time>
                    <span className="flex items-center gap-1.5 text-ink/30 dark:text-white/30 group-hover:text-y transition-colors font-bold text-sm tracking-wider">
                      LER <span className="text-base leading-none">→</span>
                    </span>
                  </div>

                  <div className="h-px w-0 group-hover:w-full bg-y transition-all duration-500 ease-out" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Older posts grid */}
        {older.length > 0 && (
          <>
            <div className="max-w-5xl mx-auto px-6 pt-8 pb-4 flex items-center gap-4">
              <span className="font-mono text-[9px] tracking-[0.35em] uppercase text-ink/20 dark:text-white/20">
                ARQUIVO
              </span>
              <div className="flex-1 h-px bg-ink/8 dark:bg-white/8" />
            </div>
            <div className="max-w-5xl mx-auto px-6 pb-24">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-ink/8 dark:bg-white/8 border border-ink/8 dark:border-white/8">
                {older.map((post) => (
                  <ArticleCard key={post.slug} post={post} votes={votes[post.slug]} />
                ))}
              </div>
            </div>
          </>
        )}

        {posts.length === 0 && (
          <div className="max-w-5xl mx-auto px-6 py-24 text-center">
            <span className="font-mono text-sm text-ink/25 dark:text-white/25 tracking-widest">
              AGUARDANDO PRÓXIMO DROP<span className="blink">▮</span>
            </span>
          </div>
        )}
      </section>
    </>
  )
}
