import Link from 'next/link'
import { getPosts, formatDate } from '@/lib/posts'
import { ArticleCard } from '@/components/ArticleCard'

export const dynamic = 'force-dynamic'

const TICKER = [
  'GPT-5', 'GEMINI 2.5 PRO', 'CLAUDE OPUS', 'FLUX.1-SCHNELL', 'LLAMA 3',
  'SORA 2', 'GROK 3', 'MISTRAL LARGE', 'DALL·E 4', 'DEEPSEEK R2',
  'AGENTIC AI', 'RAG 2.0', 'MCP PROTOCOL', 'REASONING MODELS', 'DIFFUSION VIDEO',
]

export default async function HomePage() {
  const posts = await getPosts()
  const featured = posts.slice(0, 2)
  const older = posts.slice(2)

  return (
    <>
      {/* ── Hero full-viewport ────────────────────────────── */}
      <section className="relative min-h-[100svh] bg-ink flex flex-col overflow-hidden">

        {/* Geo grid */}
        <div className="absolute inset-0 geo-grid pointer-events-none" />

        {/* Giant diamond SVG — top right */}
        <svg
          className="absolute -top-24 right-0 w-[80vw] max-w-[820px] opacity-[0.11] pointer-events-none"
          viewBox="0 0 820 820" fill="none"
        >
          {[40, 100, 160, 220, 280, 340, 400, 460, 520, 580, 640, 700, 760].map((r) => (
            <rect
              key={r}
              x={410 - r / Math.SQRT2}
              y={410 - r / Math.SQRT2}
              width={r * Math.SQRT2}
              height={r * Math.SQRT2}
              transform="rotate(45 410 410)"
              stroke="#FFE600"
              strokeWidth="1"
              fill="none"
            />
          ))}
          <line x1="410" y1="0" x2="410" y2="820" stroke="#FFE600" strokeWidth="0.5" />
          <line x1="0" y1="410" x2="820" y2="410" stroke="#FFE600" strokeWidth="0.5" />
          <line x1="0" y1="0" x2="820" y2="820" stroke="#FFE600" strokeWidth="0.3" opacity="0.4" />
          <line x1="820" y1="0" x2="0" y2="820" stroke="#FFE600" strokeWidth="0.3" opacity="0.4" />
          <circle cx="410" cy="410" r="5" fill="#FFE600" />
          <circle cx="410" cy="410" r="18" stroke="#FFE600" strokeWidth="0.8" fill="none" />
          <circle cx="410" cy="410" r="36" stroke="#FFE600" strokeWidth="0.4" fill="none" />
        </svg>

        {/* Horizontal circuit traces */}
        <div className="absolute left-0 right-0 top-[32%] h-px bg-gradient-to-r from-transparent via-y/10 to-transparent pointer-events-none" />
        <div className="absolute left-0 right-0 bottom-[22%] h-px bg-gradient-to-r from-transparent via-y/6 to-transparent pointer-events-none" />

        {/* Vertical circuit trace — left */}
        <div className="absolute left-14 inset-y-0 w-px bg-gradient-to-b from-transparent via-y/12 to-transparent pointer-events-none" />

        {/* Circuit nodes */}
        <span className="absolute left-14 top-[32%] w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 border border-y/50 rotate-45 pointer-events-none" />
        <span className="absolute left-14 bottom-[22%] w-2 h-2 -translate-x-1/2 translate-y-1/2 bg-y/25 rotate-45 pointer-events-none" />

        {/* ─ Content ──────────────────────────────────────── */}
        <div className="relative flex-1 flex flex-col max-w-5xl mx-auto px-6 w-full pt-14 pb-10">

          {/* Top bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-y shrink-0 pulse-dot" />
              <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-y/60">
                SYS://NEURAL_DROP
              </span>
              <span className="blink text-y text-xs leading-none">▮</span>
            </div>
            <div className="hidden sm:flex items-center gap-5">
              <span className="font-mono text-[9px] tracking-widest uppercase text-white/20">
                [{posts.length.toString().padStart(3, '0')}] DROPS
              </span>
              <span className="w-px h-3 bg-white/10" />
              <span className="font-mono text-[9px] tracking-widest uppercase text-white/20">
                DIÁRIO
              </span>
            </div>
          </div>

          {/* Headline */}
          <div className="flex-1 flex flex-col justify-center pt-12 pb-6">

            <div className="flex items-center gap-4 mb-5">
              <div className="h-px w-8 bg-y/40 shrink-0" />
              <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-y/35 whitespace-nowrap overflow-hidden">
                INTELIGÊNCIA ARTIFICIAL · SEM FILTRO · BRASIL
              </span>
            </div>

            <h1 className="font-display uppercase leading-none">
              <span className="block text-[clamp(5rem,20vw,17rem)] text-white leading-[0.82] tracking-tight glitch-text">
                NEURAL
              </span>

              <div className="flex items-center gap-5">
                <span className="text-[clamp(5rem,20vw,17rem)] text-y leading-[0.82] tracking-tight shrink-0">
                  DROP
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-y/50 to-transparent hidden sm:block" />
              </div>
            </h1>

            {/* Description + CTA */}
            <div className="mt-10 flex flex-col sm:flex-row sm:items-end gap-8">
              <p className="text-sm text-white/35 max-w-sm leading-relaxed border-l-2 border-y/30 pl-4">
                As notícias mais quentes de IA — sem filtro corporativo, sem
                enrolação. Drops diários direto do epicentro da revolução.
              </p>
              <Link
                href="#drops"
                className="stripe-hover inline-flex items-center gap-3 bg-y text-ink text-[11px] font-bold tracking-[0.25em] uppercase px-7 py-4 group self-start relative overflow-hidden"
              >
                <span className="w-1.5 h-1.5 bg-ink rotate-45 shrink-0 group-hover:rotate-[225deg] transition-transform duration-300" />
                VER DROPS
              </Link>
            </div>
          </div>
        </div>

        {/* ─ Ticker bar ──────────────────────────────────── */}
        <div className="relative border-t border-y/10 bg-y/[0.03] overflow-hidden">
          <div className="ticker-track flex items-center py-2.5 whitespace-nowrap select-none">
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
      <section id="drops">

        {/* Section label */}
        <div className="max-w-5xl mx-auto px-6 pt-14 pb-6 flex items-center gap-4">
          <span className="w-1.5 h-1.5 bg-y rotate-45 shrink-0" />
          <span className="font-mono text-[9px] tracking-[0.35em] uppercase text-ink/30 dark:text-white/30">
            ÚLTIMOS DROPS
          </span>
          <div className="flex-1 h-px bg-ink/8 dark:bg-white/8" />
          <span className="font-mono text-[9px] tracking-widest text-ink/20 dark:text-white/20">
            [{posts.length.toString().padStart(3, '0')}]
          </span>
        </div>

        {/* 2 featured posts — side by side */}
        {featured.length > 0 && (
          <div className="max-w-5xl mx-auto px-6 mb-px">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-ink/8 dark:bg-white/8 border border-ink/8 dark:border-white/8">
              {featured.map((post, idx) => (
                <Link
                  key={post.slug}
                  href={`/posts/${post.slug}`}
                  className="group relative flex flex-col bg-white dark:bg-ink hover:bg-ink transition-colors duration-500 overflow-hidden stripe-hover min-h-[320px]"
                >
                  {/* NEW badge on first */}
                  {idx === 0 && (
                    <span className="absolute top-5 right-5 font-mono text-[8px] tracking-[0.3em] uppercase text-ink bg-y px-2 py-0.5 z-10">
                      NOVO
                    </span>
                  )}

                  {/* Corner brackets */}
                  <span className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-ink/10 dark:border-white/10 group-hover:border-y transition-colors duration-300" />
                  <span className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-ink/10 dark:border-white/10 group-hover:border-y transition-colors duration-300" />
                  <span className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-ink/10 dark:border-white/10 group-hover:border-y/40 transition-colors duration-300" />
                  <span className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-ink/10 dark:border-white/10 group-hover:border-y/40 transition-colors duration-300" />

                  <div className="flex flex-col flex-1 px-7 pt-8 pb-5 gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-y rotate-45 shrink-0" />
                      <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-ink/40 dark:text-white/40 group-hover:text-y transition-colors">
                        {post.category}
                      </span>
                      <span className="flex-1 h-px bg-ink/8 dark:bg-white/8" />
                      <span className="font-mono text-[9px] text-ink/25 dark:text-white/25">
                        {post.readTime}
                      </span>
                    </div>

                    <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.8rem)] text-ink dark:text-white group-hover:text-white uppercase leading-none tracking-tight transition-colors flex-1">
                      {post.title}
                    </h2>

                    <p className="text-sm text-ink/50 dark:text-white/50 group-hover:text-white/65 leading-relaxed line-clamp-2 transition-colors">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="flex items-center justify-between px-7 pb-7">
                    <time className="font-mono text-xs text-ink/25 dark:text-white/25 group-hover:text-white/35 transition-colors">
                      {formatDate(post.date)}
                    </time>
                    <span className="flex items-center gap-1.5 text-ink/30 dark:text-white/30 group-hover:text-y transition-colors font-bold text-sm tracking-wider">
                      LER <span className="text-base leading-none">→</span>
                    </span>
                  </div>

                  {/* Bottom sweep line */}
                  <div className="h-px w-0 group-hover:w-full bg-y transition-all duration-500 ease-out" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Older posts grid */}
        {older.length > 0 && (
          <div className="max-w-5xl mx-auto px-6 pb-24">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-ink/8 dark:bg-white/8 border border-ink/8 dark:border-white/8 border-t-0">
              {older.map((post) => (
                <ArticleCard key={post.slug} post={post} />
              ))}
            </div>
          </div>
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
