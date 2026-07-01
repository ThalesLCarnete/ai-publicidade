import type { MDXComponents } from 'mdx/types'
import type { ReactNode } from 'react'

// Extrai o texto plano de uma árvore de nós React (pra detectar quem fala no debate).
function nodeText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(nodeText).join('')
  if (typeof node === 'object' && 'props' in node) {
    return nodeText((node as { props?: { children?: ReactNode } }).props?.children)
  }
  return ''
}

export function useMDXComponents(): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="font-display text-5xl tracking-wide text-ink dark:text-white mt-12 mb-5 uppercase leading-tight">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <div className="flex items-start gap-3 mt-12 mb-5">
        <span className="shrink-0 mt-1 flex flex-col items-center gap-1">
          <span className="w-1.5 h-1.5 bg-y rotate-45" />
          <span className="w-px flex-1 bg-y/30 min-h-[1rem]" />
        </span>
        <h2 className="font-display text-3xl tracking-wide text-ink dark:text-white uppercase leading-tight">
          {children}
        </h2>
      </div>
    ),
    h3: ({ children }) => (
      <h3 className="font-bold text-base text-ink dark:text-white mt-8 mb-3 uppercase tracking-wider flex items-center gap-2">
        <span className="w-1 h-1 bg-y rotate-45 shrink-0" />
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="text-ink/75 dark:text-white/75 leading-[1.85] mb-5 text-[0.95rem]">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="mb-6 space-y-2 pl-0">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-6 space-y-2 pl-0">{children}</ol>
    ),
    li: ({ children }) => (
      <li className="flex gap-3 text-ink/75 dark:text-white/75 text-[0.95rem] leading-[1.85]">
        <span className="text-y font-bold shrink-0 mt-1 text-xs">◆</span>
        <span>{children}</span>
      </li>
    ),
    strong: ({ children }) => (
      <strong className="font-bold text-ink dark:text-white">{children}</strong>
    ),
    blockquote: ({ children }) => {
      // Falas do debate (começam com "Caio"/"Rafael") viram balões de chat alternados.
      const speaker = /^\s*\*{0,2}\s*(caio|rafael)\b/i.exec(nodeText(children))?.[1]?.toLowerCase()
      if (speaker === 'caio' || speaker === 'rafael') {
        const caio = speaker === 'caio'
        return (
          <div className={`my-2.5 flex ${caio ? 'justify-start pr-6 sm:pr-12' : 'justify-end pl-6 sm:pl-12'}`}>
            <div
              className={[
                'max-w-[88%] px-4 py-2.5 border text-[0.9rem] leading-relaxed not-italic [&>p]:mb-0',
                caio
                  ? 'bg-y/10 border-y/40 rounded-2xl rounded-bl-sm'
                  : 'bg-ink/[0.04] dark:bg-white/[0.06] border-ink/15 dark:border-white/15 rounded-2xl rounded-br-sm',
              ].join(' ')}
            >
              {children}
            </div>
          </div>
        )
      }
      return (
        <blockquote className="relative my-8 pl-6 border-l-2 border-y">
          <span className="absolute -left-1 top-0 w-2 h-2 bg-y rotate-45" />
          <div className="text-ink/70 dark:text-white/70 italic text-[0.95rem] leading-relaxed">
            {children}
          </div>
        </blockquote>
      )
    },
    code: ({ children }) => (
      <code className="font-mono bg-ink/5 dark:bg-white/10 text-[0.85rem] px-1.5 py-0.5 text-y dark:text-y">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="relative font-mono text-sm bg-ink dark:bg-white/5 border border-y/20 text-white p-5 my-6 overflow-x-auto">
        <span className="absolute top-2 right-3 font-mono text-[9px] tracking-widest text-y/40 uppercase">
          CODE
        </span>
        {children}
      </pre>
    ),
    hr: () => (
      <div className="flex items-center gap-3 my-10">
        <div className="flex-1 h-px bg-ink/8 dark:bg-white/8" />
        <span className="w-2 h-2 bg-y rotate-45" />
        <div className="w-8 h-px bg-y/40" />
        <span className="w-1.5 h-1.5 border border-y/60 rotate-45" />
        <div className="w-8 h-px bg-y/40" />
        <span className="w-2 h-2 bg-y rotate-45" />
        <div className="flex-1 h-px bg-ink/8 dark:bg-white/8" />
      </div>
    ),
    img: ({ src, alt }) => (
      <figure className="my-8 -mx-2 relative">
        <div className="relative overflow-hidden border border-y/20">
          {/* Corner brackets */}
          <span className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-y z-10" />
          <span className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-y z-10" />
          <span className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-y z-10" />
          <span className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-y z-10" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt ?? ''}
            className="w-full object-cover block"
            loading="lazy"
          />
        </div>
        {alt && (
          <figcaption className="mt-2 flex items-center gap-2 text-xs text-ink/35 dark:text-white/35">
            <span className="w-1 h-1 bg-y/60 rotate-45 shrink-0" />
            {alt}
          </figcaption>
        )}
      </figure>
    ),
  }
}
