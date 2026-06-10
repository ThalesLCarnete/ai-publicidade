import Link from 'next/link'
import { LogoutButton } from './LogoutButton'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-white dark:bg-[#111]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-ink flex flex-col">
        <div className="border-b border-white/10 px-6 py-4 flex items-center gap-2">
          <span className="text-y font-bold text-2xl leading-none">\</span>
          <span className="font-display text-white text-base tracking-widest uppercase">Admin</span>
        </div>

        <nav className="flex-1 px-4 py-6 flex flex-col gap-1">
          <Link
            href="/admin"
            className="flex items-center gap-2 px-3 py-2.5 text-xs font-bold tracking-widest uppercase text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <span className="text-y">■</span>
            Posts
          </Link>
          <Link
            href="/admin/posts/new"
            className="flex items-center gap-2 px-3 py-2.5 text-xs font-bold tracking-widest uppercase text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <span className="text-y">+</span>
            Novo Post
          </Link>
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 px-3 py-2.5 text-xs font-bold tracking-widest uppercase text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <span className="text-y">↗</span>
            Ver Blog
          </Link>
        </nav>

        <div className="border-t border-white/10 px-4 py-4">
          <LogoutButton />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
