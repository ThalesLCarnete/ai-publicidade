import { notFound } from 'next/navigation'
import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import { compileMDX } from 'next-mdx-remote/rsc'
import { getPosts, getPostBySlug, formatDate } from '@/lib/posts'
import { useMDXComponents } from '@/mdx-components'

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }))
}

export const dynamicParams = true

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}
  return { title: `${post.title} — TBWA \\ IA & Publicidade`, description: post.excerpt }
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const filePath = path.join(process.cwd(), 'content/posts', `${slug}.mdx`)
  if (!fs.existsSync(filePath)) notFound()

  const source = fs.readFileSync(filePath, 'utf8')
  const components = useMDXComponents()
  const { content } = await compileMDX({ source, components })

  return (
    <>
      {/* Article hero — black band */}
      <div className="bg-ink dark:bg-ink border-b-4 border-y">
        <div className="max-w-5xl mx-auto px-6 py-14">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-white/40 hover:text-y transition-colors mb-10"
          >
            <span className="text-y font-bold">←</span>
            Todos os artigos
          </Link>
          <div className="flex items-start gap-4">
            <span className="text-y font-bold text-4xl leading-none mt-1 select-none">\</span>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-y">
                  {post.category}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="text-[10px] text-white/40">{post.readTime} de leitura</span>
              </div>
              <h1 className="font-display text-[clamp(2.5rem,7vw,5.5rem)] leading-none tracking-wide text-white uppercase">
                {post.title}
              </h1>
              <p className="mt-5 text-base text-white/60 max-w-2xl leading-relaxed">
                {post.excerpt}
              </p>
              <time className="mt-4 block text-xs text-white/30 tracking-wider">
                {formatDate(post.date)}
              </time>
            </div>
          </div>
        </div>
      </div>

      {/* Article body */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="max-w-2xl py-14">
          <article>{content}</article>
        </div>
      </div>
    </>
  )
}
