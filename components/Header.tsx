import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  return (
    <header className="sticky top-0 z-10 bg-ink">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-y font-bold text-2xl leading-none select-none">\</span>
          <span className="font-display text-white text-lg tracking-widest uppercase group-hover:text-y transition-colors">
            IA & Publicidade
          </span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  )
}
