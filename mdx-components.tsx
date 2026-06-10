import type { MDXComponents } from 'mdx/types'

export function useMDXComponents(): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="font-display text-5xl tracking-wide text-ink dark:text-white mt-12 mb-5 uppercase leading-tight">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="font-display text-3xl tracking-wide text-ink dark:text-white mt-12 mb-4 uppercase leading-tight">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="font-bold text-lg text-ink dark:text-white mt-8 mb-3 uppercase tracking-wider">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="text-ink/75 dark:text-white/75 leading-[1.8] mb-5 text-[0.95rem]">{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="mb-5 space-y-2 pl-0">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-5 space-y-2 pl-0 list-none counter-reset-[item]">{children}</ol>
    ),
    li: ({ children }) => (
      <li className="flex gap-3 text-ink/75 dark:text-white/75 text-[0.95rem] leading-[1.8]">
        <span className="text-y font-bold shrink-0 mt-0.5">—</span>
        <span>{children}</span>
      </li>
    ),
    strong: ({ children }) => (
      <strong className="font-bold text-ink dark:text-white">{children}</strong>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-y pl-5 my-6 text-ink/60 dark:text-white/60 italic">
        {children}
      </blockquote>
    ),
    code: ({ children }) => (
      <code className="bg-ink/5 dark:bg-white/10 text-sm px-1.5 py-0.5 font-mono text-ink dark:text-white">
        {children}
      </code>
    ),
    hr: () => (
      <div className="flex items-center gap-3 my-10">
        <span className="text-y font-bold text-lg">\</span>
        <div className="flex-1 h-px bg-ink/10 dark:bg-white/10" />
      </div>
    ),
  }
}
