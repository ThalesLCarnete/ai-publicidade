import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  return (
    <header className="sticky top-0 z-10 bg-ink border-b border-y/20">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          {/* Geometric logo mark */}
          <span className="relative flex items-center justify-center w-7 h-7">
            <span className="absolute inset-0 border border-y/40 rotate-45 group-hover:rotate-[225deg] transition-transform duration-500" />
            <span className="text-y font-bold text-sm leading-none select-none z-10">\</span>
          </span>
          <span className="font-display text-white text-lg tracking-widest uppercase group-hover:text-y transition-colors">
            Neural Drop
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/bastidores"
            className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/45 hover:text-y transition-colors"
          >
            Bastidores
          </Link>
          {/* Circuit node decoration */}
          <div className="hidden sm:flex items-center gap-1.5 text-white/20">
            <span className="w-1 h-1 bg-y/60 rotate-45" />
            <span className="w-8 h-px bg-white/10" />
            <span className="w-1 h-1 bg-white/20 rotate-45" />
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Bottom geometric accent — scanning line */}
      <div className="h-px bg-gradient-to-r from-transparent via-y/40 to-transparent" />
    </header>
  )
}
