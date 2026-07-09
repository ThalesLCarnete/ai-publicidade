import Link from 'next/link'
import type { ReactNode } from 'react'
import { DebatePlayer } from '@/components/DebatePlayer'

export const metadata = {
  title: 'Bastidores — como o IA Traduzida é feito',
  description:
    'O processo por trás do IA Traduzida: os agentes de IA, o debate entre o Visionário e o Cético, os workflows e a auditoria humana que aprova cada post.',
}

const steps = [
  { n: '01', t: 'Coleta', d: 'Robôs leem dezenas de feeds de IA — brasileiros e internacionais — e juntam as manchetes do dia.' },
  { n: '02', t: 'Classificador', d: 'Um agente-editor escolhe as 2 notícias mais interessantes — as que têm um lado grandioso E um lado questionável.' },
  { n: '03', t: 'O Debate', d: 'Caio (entusiasta) e Rafael (cético) discutem cada notícia e cravam as notas de relevância e confiabilidade.' },
  { n: '04', t: 'Curadoria', d: 'Em paralelo, outro agente separa 1 notícia de utilidade prática — algo pra usar hoje.' },
  { n: '05', t: 'Redação + auditoria', d: 'O redator escreve o brief; o Editor-Cético caça hype, jargão e exagero antes de qualquer publicação.' },
  { n: '06', t: 'Aprovação humana', d: 'Nada é publicado sem o OK de um humano no Telegram. Sempre.' },
  { n: '07', t: 'Publicação', d: 'Três posts no site — com o debate visível — e o brief no canal de WhatsApp.' },
]

const agents = [
  { cat: 'Pauta', name: 'Classificador', role: 'Escolhe as 2 notícias mais interessantes do dia — prioriza o surpreendente, não o business seco.' },
  { cat: 'Curadoria', name: 'Curador de Utilidade', role: 'Garimpa 1 dica prática que o leitor consegue usar hoje: uma ferramenta, um recurso novo, um passo a passo.' },
  { cat: 'Debate', name: 'Caio × Rafael', role: 'Dois personagens de personalidades opostas debatem cada notícia e definem as notas. Perfis completos abaixo.' },
  { cat: 'Redação', name: 'Redator do Brief', role: 'Monta o Brief do Dia na voz de um professor que explica sem deslumbre e sem pânico.' },
  { cat: 'Auditoria', name: 'Editor-Cético', role: 'A última barreira: reprova textos com hype, jargão sem tradução ou afirmação que a fonte não sustenta.' },
  { cat: 'Publicação', name: 'Redator de Post', role: 'Transforma cada notícia num post do site, com a conversa do debate em balões de chat.' },
]

const personas = [
  {
    name: 'Caio Mendel',
    epithet: 'O Visionário',
    meta: '34 anos · Joinville, SC',
    pull: 'Puxa a relevância ↑',
    quote: 'Vocês ainda não entenderam o que acabou de acontecer.',
    bio: 'Aprendeu a programar sozinho num PC usado que ganhou aos 11 anos. Largou um emprego de terno num banco em 2018 pra empreender — abriu três empresas, duas quebraram. Divorciado, pai da Olívia, de 7 anos.',
    wound: 'Precisa que o futuro seja grandioso: se não for, ter largado tudo não significou nada. O entusiasmo dele é necessidade, não ingenuidade.',
    style: 'Pensa em exponenciais. Enxerga o "iPhone moment" em cada lançamento. Fala rápido, com energia e convicção.',
    accent: true,
  },
  {
    name: 'Rafael Khoury',
    epithet: 'O Cético',
    meta: '41 anos · Foz do Iguaçu, PR',
    pull: 'Puxa a confiabilidade ↓',
    quote: 'Já vi esse filme antes. Sei como termina.',
    bio: 'Cresceu ouvindo o avô repetir: "promessa boa demais é a primeira parte do golpe". Quase 20 anos em machine learning; viveu de perto o estouro de duas bolhas de hype. Mantém um caderno com previsões grandiosas da indústria — e a data em que falharam.',
    wound: 'Não desconfia por amargura: já viu gente se machucar acreditando rápido demais. Pra ele, furar uma bolha de hype é proteger alguém de um calote.',
    style: 'Pergunta "cadê o benchmark?", "quem financiou o estudo?". Separa avanço real de press release. Fala devagar, com pausas.',
    accent: false,
  },
]

const infra = [
  { name: 'n8n', d: 'Orquestra o pipeline inteiro, na VPS' },
  { name: 'Claude Haiku', d: 'O cérebro rápido e barato dos agentes' },
  { name: 'Browserless', d: 'Renderiza as imagens dos selos' },
  { name: 'Vercel', d: 'Hospeda o site e o arquivo dos posts' },
  { name: 'Telegram', d: 'Onde o humano aprova ou recusa' },
]

const workflows = [
  { name: 'brief-diario', d: 'O pipeline principal — da coleta à publicação dos 3 posts.' },
  { name: 'render-imagens', d: 'Sub-workflow que gera as imagens 1080×1350 dos selos.' },
]

function Label({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-5xl mx-auto px-6 pt-16 pb-6 flex items-center gap-4">
      <span className="w-1.5 h-1.5 bg-y rotate-45 shrink-0" />
      <span className="font-mono text-[9px] tracking-[0.35em] uppercase text-ink/30 dark:text-white/30">
        {children}
      </span>
      <div className="flex-1 h-px bg-ink/8 dark:bg-white/8" />
    </div>
  )
}

export default function BastidoresPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative bg-ink border-b-2 border-y overflow-hidden geo-grid">
        <svg
          className="absolute top-0 right-0 w-72 h-72 opacity-[0.07] pointer-events-none"
          viewBox="0 0 256 256" fill="none"
        >
          {[30, 70, 110, 150, 190, 230].map((r) => (
            <rect
              key={r}
              x={128 - r / Math.SQRT2}
              y={128 - r / Math.SQRT2}
              width={r * Math.SQRT2}
              height={r * Math.SQRT2}
              transform="rotate(45 128 128)"
              stroke="#FFE600" strokeWidth="1" fill="none"
            />
          ))}
          <circle cx="128" cy="128" r="4" fill="#FFE600" />
        </svg>

        <div className="max-w-5xl mx-auto px-6 py-16 relative">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase text-white/35 hover:text-y transition-colors mb-10 font-mono"
          >
            <span className="text-y">←</span> Voltar ao feed
          </Link>

          <div className="flex items-center gap-2.5 mb-4">
            <span className="w-1.5 h-1.5 bg-y rotate-45 pulse-dot" />
            <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-y/55">
              SYS://BASTIDORES
            </span>
          </div>

          <h1 className="font-display text-[clamp(2.5rem,8vw,6rem)] leading-none tracking-wide text-white uppercase">
            Bastidores
          </h1>

          <p className="mt-6 text-[0.95rem] sm:text-base text-white/55 max-w-2xl leading-relaxed">
            O IA Traduzida é escrito por agentes de IA e auditado por um humano. Nada de caixa-preta:
            aqui está o processo inteiro — quem são os agentes, como o debate define as notas e por que
            nenhum post vai ao ar sem um <span className="text-y">sim</span> humano.
          </p>
        </div>
      </section>

      {/* ── Debate ao vivo (a atração principal) ─────────── */}
      <Label>🕹️ DEBATE AO VIVO · A ATRAÇÃO PRINCIPAL</Label>
      <section className="max-w-5xl mx-auto px-6">
        <p className="text-sm text-ink/55 dark:text-white/55 max-w-2xl leading-relaxed mb-6">
          Antes de cada post ir ao ar, Caio e Rafael brigam por ele. Aperte start e assista a um
          debate <b className="text-ink dark:text-white font-semibold">real</b> — reproduzido
          palavra por palavra — que definiu as notas de um post publicado neste site.
        </p>
        <DebatePlayer />
      </section>

      {/* ── O processo ───────────────────────────────────── */}
      <Label>O PROCESSO</Label>
      <section className="max-w-5xl mx-auto px-6">
        <ol className="relative border-l border-ink/10 dark:border-white/10 ml-3">
          {steps.map((s) => (
            <li key={s.n} className="relative pl-8 pb-8 last:pb-0">
              <span className="absolute -left-[7px] top-1.5 w-3 h-3 bg-y rotate-45 border border-ink dark:border-ink" />
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-[11px] text-y/70">{s.n}</span>
                <h3 className="font-display text-2xl tracking-wide text-ink dark:text-white uppercase leading-none">
                  {s.t}
                </h3>
              </div>
              <p className="mt-2 text-sm text-ink/60 dark:text-white/60 leading-relaxed max-w-xl">
                {s.d}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Os agentes ───────────────────────────────────── */}
      <Label>OS AGENTES</Label>
      <section className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-ink/8 dark:bg-white/8 border border-ink/8 dark:border-white/8">
          {agents.map((a) => (
            <div key={a.name} className="group relative bg-white dark:bg-ink p-6 flex flex-col gap-3">
              <span className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-ink/10 dark:border-white/10 group-hover:border-y transition-colors" />
              <span className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-ink/10 dark:border-white/10 group-hover:border-y transition-colors" />
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 bg-y rotate-45 shrink-0" />
                <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-ink/40 dark:text-white/40">
                  {a.cat}
                </span>
              </div>
              <h3 className="font-display text-2xl tracking-wide text-ink dark:text-white uppercase leading-none">
                {a.name}
              </h3>
              <p className="text-sm text-ink/60 dark:text-white/60 leading-relaxed">{a.role}</p>
              <span className="mt-auto pt-2 font-mono text-[9px] tracking-widest uppercase text-ink/25 dark:text-white/25">
                ⛭ Claude Haiku
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── O debate ─────────────────────────────────────── */}
      <Label>O DEBATE · OS PERFIS</Label>
      <section className="max-w-5xl mx-auto px-6">
        <p className="text-sm text-ink/55 dark:text-white/55 max-w-2xl leading-relaxed mb-8">
          O coração do IA Traduzida. Duas personalidades opostas discutem cada notícia numa única
          conversa. Um puxa a nota pra cima, o outro pra baixo — a nota final é o equilíbrio entre os
          dois, nunca a vitória de um.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {personas.map((p) => (
            <article
              key={p.name}
              className={[
                'relative p-7 border',
                p.accent
                  ? 'bg-y/[0.06] border-y/40'
                  : 'bg-ink/[0.03] dark:bg-white/[0.05] border-ink/15 dark:border-white/15',
              ].join(' ')}
            >
              <span
                className={`absolute top-4 right-4 w-3 h-3 rotate-45 ${
                  p.accent ? 'bg-y' : 'bg-ink/30 dark:bg-white/30'
                }`}
              />

              <span
                className={`font-mono text-[10px] tracking-[0.3em] uppercase ${
                  p.accent ? 'text-y' : 'text-ink/45 dark:text-white/45'
                }`}
              >
                {p.epithet} · {p.pull}
              </span>

              <h3 className="font-display text-4xl tracking-wide text-ink dark:text-white uppercase leading-none mt-2">
                {p.name}
              </h3>
              <span className="block font-mono text-[11px] text-ink/35 dark:text-white/35 mt-2">
                {p.meta}
              </span>

              <p className="mt-5 pl-4 border-l-2 border-y/60 italic text-[0.95rem] text-ink/75 dark:text-white/75 leading-relaxed">
                “{p.quote}”
              </p>

              <dl className="mt-6 space-y-4">
                <div>
                  <dt className="text-[9px] font-bold tracking-[0.25em] uppercase text-ink/35 dark:text-white/35 mb-1">
                    História
                  </dt>
                  <dd className="text-sm text-ink/65 dark:text-white/65 leading-relaxed">{p.bio}</dd>
                </div>
                <div>
                  <dt className="text-[9px] font-bold tracking-[0.25em] uppercase text-ink/35 dark:text-white/35 mb-1">
                    O que o move
                  </dt>
                  <dd className="text-sm text-ink/65 dark:text-white/65 leading-relaxed">{p.wound}</dd>
                </div>
                <div>
                  <dt className="text-[9px] font-bold tracking-[0.25em] uppercase text-ink/35 dark:text-white/35 mb-1">
                    Como debate
                  </dt>
                  <dd className="text-sm text-ink/65 dark:text-white/65 leading-relaxed">{p.style}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      {/* ── Infraestrutura + workflows ───────────────────── */}
      <Label>A INFRAESTRUTURA</Label>
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-ink/8 dark:bg-white/8 border border-ink/8 dark:border-white/8 mb-8">
          {infra.map((t) => (
            <div key={t.name} className="bg-white dark:bg-ink p-5 flex flex-col gap-1.5">
              <span className="font-display text-lg tracking-wide text-ink dark:text-white uppercase leading-none">
                {t.name}
              </span>
              <span className="text-xs text-ink/50 dark:text-white/50 leading-snug">{t.d}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {workflows.map((w) => (
            <div key={w.name} className="relative border border-ink/10 dark:border-white/10 p-5 flex items-start gap-3">
              <span className="mt-1 w-1.5 h-1.5 bg-y rotate-45 shrink-0" />
              <div>
                <code className="font-mono text-sm text-y">{w.name}.json</code>
                <p className="mt-1 text-sm text-ink/55 dark:text-white/55 leading-relaxed">{w.d}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 flex items-center gap-3 text-ink/40 dark:text-white/40">
          <span className="w-2 h-2 bg-y rotate-45 shrink-0" />
          <span className="font-mono text-[11px] tracking-widest uppercase">
            Escrito por agentes. Auditado por um humano.
          </span>
        </div>
      </section>
    </>
  )
}
