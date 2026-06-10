import type { Metadata } from 'next'
import { Bebas_Neue, Geist } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/Header'

const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-bebas' })
const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'IA & Publicidade — TBWA',
  description:
    'As ferramentas e tendências de inteligência artificial mais relevantes para o mercado publicitário.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      data-theme="light"
      suppressHydrationWarning
      className={`${bebas.variable} ${geist.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t)document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-screen bg-white dark:bg-ink font-sans">
        <Header />
        <main>{children}</main>
      </body>
    </html>
  )
}
