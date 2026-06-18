import { notFound } from 'next/navigation'
import Link from 'next/link'
import { compileMDX } from 'next-mdx-remote/rsc'
import { getPosts, getPostBySlug, getPostContent, formatDate } from '@/lib/posts'
import { useMDXComponents } from '@/mdx-components'

export async function generateStaticParams() {
  const posts = await getPosts()
  return posts.map((p) => ({ slug: p.slug }))
}

export const dynamicParams = true

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return {}
  return { title: `${post.title} — Neural Drop`, description: post.excerpt }
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const source = await getPostContent(slug)
  if (!source) notFound()

  const components = useMDXComponents()
  const { content } = await compileMDX({ source, components })

  return (
    <>
      {/* ── Article hero ─────────────────────────────────── */}
      <div className="relative bg-ink border-b-2 border-y overflow-hidden geo-grid">
        {/* Geometric decoration — bottom right */}
        <svg
          className="absolute bottom-0 right-0 w-64 h-64 opacity-[0.07] pointer-events-none"
          viewBox="0 0 256 256" fill="none"
        >
          {[20, 50, 80, 110, 140, 170, 200, 230].map((r) => (
            <rect
              key={r}
              x={128 - r / Math.SQRT2}
              y={128 - r / Math.SQRT2}
              width={r * Math.SQRT2}
              height={r * Math.SQRT2}
              transform="rotate(45 128 128)"
              stroke="#FFE600"
              strokeWidth="0.8"
              fill="none"
            />
          ))}
        </svg>

        {/* Vertical circuit line */}
        <div className="absolute left-6 inset-y-0 flex flex-col items-center gap-0 opacity-20 pointer-events-none">
          <div className="flex-1 w-px bg-gradient-to-b from-transparent via-y/60 to-transparent" />
        </div>

        <div className="max-w-5xl mx-auto px-6 py-14 relative">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase text-white/35 hover:text-y transition-colors mb-10 font-mono"
          >
            <span className="text-y">←</span>
            Voltar ao feed
          </Link>

          <div className="flex items-start gap-4">
            {/* Mark */}
            <span className="text-y font-bold text-4xl leading-none mt-1 select-none shrink-0">\</span>

            <div className="flex-1">
              {/* Meta chips */}
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] uppercase text-y border border-y/30 px-2.5 py-1">
                  <span className="w-1 h-1 bg-y rotate-45" />
                  {post.category}
                </span>
                <span className="font-mono text-[10px] text-white/30">
                  {post.readTime} de leitura
                </span>
                <span className="font-mono text-[10px] text-white/20">
                  {formatDate(post.date)}
                </span>
              </div>

              <h1 className="font-display text-[clamp(2rem,6vw,5rem)] leading-none tracking-wide text-white uppercase">
                {post.title}
              </h1>

              <p className="mt-5 text-[0.95rem] text-white/55 max-w-2xl leading-relaxed">
                {post.excerpt}
              </p>
            </div>
          </div>

          {post.coverImage && (
            <div className="mt-10 border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.coverImage}
                alt={post.title}
                className="block w-full h-auto"
                loading="eager"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Article body ─────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="max-w-2xl py-14">
          <article>{content}</article>
        </div>
      </div>
    </>
  )
}
