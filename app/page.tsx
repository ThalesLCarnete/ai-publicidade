import { posts } from '@/lib/posts'
import { ArticleCard } from '@/components/ArticleCard'

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="border-b border-ink/10 dark:border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="flex items-start gap-5">
            <div className="w-1.5 self-stretch bg-y shrink-0 mt-2" />
            <div>
              <h1 className="font-display text-[clamp(4rem,10vw,8rem)] leading-none tracking-wide text-ink dark:text-white uppercase">
                IA para<br />Publicidade
              </h1>
              <p className="mt-6 text-base text-ink/50 dark:text-white/50 max-w-lg leading-relaxed">
                As ferramentas, tendências e estratégias de inteligência artificial
                que estão transformando o mercado publicitário.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-ink/10 dark:bg-white/10 border border-ink/10 dark:border-white/10">
          {posts.map((post) => (
            <ArticleCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </>
  )
}
