'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

// ─── Debates REAIS, extraídos de posts publicados (não editar o texto) ──────
type Turn = { who: 'caio' | 'rafael'; text: string }
type Debate = {
  slug: string
  title: string
  relevancia: number
  confiabilidade: number
  turns: Turn[]
}

const DEBATES: Debate[] = [
  {
    slug: 'ia-roubou-credenciais-mas-o-criminoso-pagou-a-entr-2026-07-07-1',
    title: 'IA roubou credenciais, mas o criminoso pagou a entrada',
    relevancia: 6,
    confiabilidade: 5,
    turns: [
      { who: 'caio', text: 'Gente, um agente de IA invadiu servidor, roubou credencial, criptografou arquivos e escreveu o resgate sozinho. Isso é o hacker do futuro nascendo agora!' },
      { who: 'rafael', text: 'Nasceu com babá. Humano escolheu a vítima, montou a infra e deu as credenciais. Sobrou pra IA a parte fácil.' },
      { who: 'caio', text: '"Parte fácil" foi invadir, escalar privilégio e corrigir erro em 31 segundos. Isso escala rápido, é só questão de tempo.' },
      { who: 'rafael', text: 'Escala como? Sysdig nem sabe qual modelo rodou nem viu o ataque repetir em outra vítima. Isso é teoria, não fato.' },
    ],
  },
  {
    slug: 'meta-aposta-em-vender-poder-de-computacao-em-vez-d-2026-07-01-1',
    title: 'Meta aposta em vender poder de computação em vez de modelos de IA',
    relevancia: 7,
    confiabilidade: 5,
    turns: [
      { who: 'caio', text: 'Meta acaba de sinalizar que vai competir direto com AWS, Google Cloud e Azure. Eles gastaram 182 bilhões em infraestrutura — isso não é um side project, é um pivô. O dinheiro real não está em fazer o melhor modelo, está em VENDER A INFRAESTRUTURA. Quem controla os data centers controla o futuro.' },
      { who: 'rafael', text: 'Espera aí. Bloomberg reportou que Meta "está desenvolvendo planos" — é rumor, não é anúncio oficial. Meta nem comentou. Estão perdendo a corrida e agora querem vender o hardware que sobrou? A própria matéria avisa que há ceticismo real sobre bolha.' },
      { who: 'caio', text: 'Você está lendo como press release. IA para Meta já é infraestrutura interna que transforma publicidade e recomendações — o ROI está embutido nos bilhões de ads. Agora eles têm excess compute e a decisão é monetizar o que sobrou.' },
      { who: 'rafael', text: 'Quando você precisa de um "side business" para justificar 182 bilhões em infraestrutura, talvez o problema seja o investimento em si. Historicamente? Já vi três ciclos assim desde 2016.' },
    ],
  },
  {
    slug: 'app-quer-detectar-golpes-de-ia-antes-que-sua-mae-p-2026-07-07-1',
    title: 'App quer detectar golpes de IA antes que sua mãe perca a poupança',
    relevancia: 7,
    confiabilidade: 6,
    turns: [
      { who: 'caio', text: 'Vocês ainda não entendem — é um Firefox moment. Dois caras com pedigree real (Cisco, Splunk, Apple), $7 milhões levantados, 100 mil submissões em quatro meses. O mercado está explodindo: $3,5 bilhões perdidos em golpes. Eles chegaram no timing perfeito.' },
      { who: 'rafael', text: 'Tração de 100 mil submissões prova medo, não que o produto funciona. Não há dados públicos de taxa de acerto, falsos positivos ou falsos negativos. Eles usam Gemini do Google — a propriedade intelectual deles é basicamente UX. E gigantes como Apple e Google podem engolir isso em dois anos.' },
      { who: 'caio', text: 'Você está pedindo dados de acurácia — é justo. Mas é gratuito e anônimo, 100 mil inputs em quatro meses é volume de treinar modelo em produção. Usar Gemini não deslegitima — o iPhone em 2007 usava componentes que já existiam; o brilho era a integração.' },
      { who: 'rafael', text: 'Timing é real, mas a reportagem não traz um case — nenhuma história de alguém que foi alertado e evitou o golpe. Só features. Preciso ver dados reais e conformidade legal clara.' },
    ],
  },
]

// ─── Avatares pixel-art (12×12, desenhados em SVG) ─────────────────────────
const CAIO_ROWS = [
  '..h..hh..h..',
  '.hhhhhhhhhh.',
  '.hhhhhhhhhh.',
  '.hssssssssh.',
  '.hseesseesh.',
  '.ssssssssss.',
  '.ssmmmmmmss.',
  '..ssssssss..',
  '....ssss....',
  '..tttttttt..',
  '.tttttttttt.',
  '.tttttttttt.',
]
const CAIO_PAL: Record<string, string> = {
  h: '#3a2410', s: '#f2c094', e: '#0a0a0a', m: '#a03d2e', t: '#FFE600',
}

const RAFAEL_ROWS = [
  '............',
  '.hhhhhhhhhh.',
  '.hhHHhhhhhh.',
  '.hssssssssh.',
  '.sgggssgggs.',
  '.ssssssssss.',
  '.sbbbbbbbbs.',
  '.sbbmmmmbbs.',
  '..sbbbbbbs..',
  '....ssss....',
  '..uuuuuuuu..',
  '.uuuuuuuuuu.',
]
const RAFAEL_PAL: Record<string, string> = {
  h: '#2b2b2b', H: '#9aa0a3', s: '#e8b48c', g: '#0a0a0a', b: '#463a35', m: '#5e2c24', u: '#41585e',
}

function PixelFace({ rows, palette, title, className }: {
  rows: string[]
  palette: Record<string, string>
  title: string
  className?: string
}) {
  return (
    <svg viewBox="0 0 12 12" shapeRendering="crispEdges" role="img" aria-label={title} className={className}>
      {rows.flatMap((row, y) =>
        [...row].map((ch, x) =>
          palette[ch] ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={palette[ch]} /> : null
        )
      )}
    </svg>
  )
}

// ─── Barra de vida segmentada (0–10) ────────────────────────────────────────
function LifeBar({ value, max = 10, color, align }: {
  value: number
  max?: number
  color: 'y' | 'w'
  align: 'left' | 'right'
}) {
  const segs = Array.from({ length: max }, (_, i) => i < value)
  const ordered = align === 'right' ? [...segs].reverse() : segs
  return (
    <div className={`flex gap-[3px] ${align === 'right' ? 'justify-end' : ''}`}>
      {ordered.map((on, i) => (
        <span
          key={i}
          className={[
            'h-3 w-2.5 sm:w-3.5 border',
            on
              ? color === 'y'
                ? 'bg-y border-y'
                : 'bg-white border-white'
              : 'bg-transparent border-white/20',
          ].join(' ')}
        />
      ))}
    </div>
  )
}

const PIXEL = { fontFamily: 'var(--font-pixel)' } as const

// ─── O player ───────────────────────────────────────────────────────────────
export function DebatePlayer() {
  const [dIdx, setDIdx] = useState(0)
  const [phase, setPhase] = useState<'idle' | 'playing' | 'scoring' | 'done'>('idle')
  const [tIdx, setTIdx] = useState(0)
  const [chars, setChars] = useState(0)
  const [rel, setRel] = useState(0)
  const [conf, setConf] = useState(0)
  const chatRef = useRef<HTMLDivElement>(null)

  const deb = DEBATES[dIdx]
  const turn = deb.turns[tIdx]
  const typedAll = phase === 'playing' && !turn

  // digitação da fala atual
  useEffect(() => {
    if (phase !== 'playing' || !turn) return
    const iv = setInterval(() => {
      setChars((c) => Math.min(c + 2, turn.text.length))
    }, 16)
    return () => clearInterval(iv)
  }, [phase, tIdx, dIdx, turn])

  // fala completa → pausa dramática → próxima
  useEffect(() => {
    if (phase !== 'playing' || !turn || chars < turn.text.length) return
    const t = setTimeout(() => {
      setTIdx((i) => i + 1)
      setChars(0)
    }, 750)
    return () => clearTimeout(t)
  }, [phase, chars, tIdx, dIdx, turn])

  // acabaram as falas → placar
  useEffect(() => {
    if (typedAll) setPhase('scoring')
  }, [typedAll])

  // barras enchendo segmento a segmento
  useEffect(() => {
    if (phase !== 'scoring') return
    if (rel >= deb.relevancia && conf >= deb.confiabilidade) {
      setPhase('done')
      return
    }
    const t = setTimeout(() => {
      setRel((r) => Math.min(r + 1, deb.relevancia))
      setConf((c) => Math.min(c + 1, deb.confiabilidade))
    }, 130)
    return () => clearTimeout(t)
  }, [phase, rel, conf, deb])

  // auto-scroll do chat (rAF garante o scroll depois do paint do conteúdo novo)
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const el = chatRef.current
      if (el) el.scrollTop = el.scrollHeight
    })
    return () => cancelAnimationFrame(raf)
  }, [tIdx, chars, phase, rel, conf])

  const reset = () => {
    setTIdx(0)
    setChars(0)
    setRel(0)
    setConf(0)
  }

  const finishAll = () => {
    setTIdx(deb.turns.length)
    setChars(0)
    setRel(deb.relevancia)
    setConf(deb.confiabilidade)
    setPhase('done')
  }

  const start = () => {
    reset()
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finishAll()
      return
    }
    setPhase('playing')
  }

  const selectDebate = (i: number) => {
    setDIdx(i)
    reset()
    setPhase('idle')
  }

  // clique na tela: completa a fala atual na hora (convenção de diálogo de fliperama)
  const tapAdvance = () => {
    if (phase === 'playing' && turn && chars < turn.text.length) setChars(turn.text.length)
  }

  const visibleTurns = deb.turns.slice(0, tIdx)
  const typing = phase === 'playing' && turn ? { who: turn.who, text: turn.text.slice(0, chars) } : null

  return (
    <div className="relative bg-ink border-2 border-y overflow-hidden select-none">
      {/* scanlines CRT */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none z-20 opacity-40"
        style={{ background: 'repeating-linear-gradient(180deg, rgba(0,0,0,.22) 0 2px, transparent 2px 4px)' }}
      />
      {/* cantos bracket */}
      <span className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-y z-30 pointer-events-none" />
      <span className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-y z-30 pointer-events-none" />
      <span className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-y z-30 pointer-events-none" />
      <span className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-y z-30 pointer-events-none" />

      {/* topo */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-y/25 bg-y/[0.04]">
        <span style={PIXEL} className="text-[8px] text-y/70 tracking-wide">REDACAO://ARENA</span>
        <div className="flex items-center gap-2">
          {DEBATES.map((_, i) => (
            <button
              key={i}
              onClick={() => selectDebate(i)}
              aria-label={`Debate ${i + 1}`}
              style={PIXEL}
              className={[
                'text-[8px] px-2 py-1.5 border transition-colors',
                i === dIdx
                  ? 'bg-y text-ink border-y'
                  : 'text-white/40 border-white/20 hover:border-y hover:text-y',
              ].join(' ')}
            >
              {String(i + 1).padStart(2, '0')}
            </button>
          ))}
        </div>
      </div>

      {/* painel VS */}
      <div className="relative z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-6 px-4 sm:px-8 py-5 border-b border-white/10 geo-grid">
        <div className="flex flex-col items-start gap-2">
          <div className="flex items-center gap-3">
            <PixelFace rows={CAIO_ROWS} palette={CAIO_PAL} title="Caio Mendel em pixel art" className="w-12 h-12 sm:w-16 sm:h-16" />
            <div>
              <div style={PIXEL} className="text-[9px] sm:text-[11px] text-y">CAIO</div>
              <div className="font-mono text-[8px] tracking-[0.2em] uppercase text-white/40 mt-1.5">O Visionário</div>
            </div>
          </div>
          <div className="w-full mt-1">
            <div className="flex items-baseline justify-between mb-1">
              <span className="font-mono text-[8px] tracking-widest uppercase text-y/70">Relevância</span>
              <span style={PIXEL} className="text-[9px] text-y">
                {phase === 'scoring' || phase === 'done' ? `${rel}/10` : '?/10'}
              </span>
            </div>
            <LifeBar value={rel} color="y" align="left" />
          </div>
        </div>

        <div style={PIXEL} className="text-lg sm:text-2xl text-y text-center leading-none px-1" aria-hidden>
          <span className="inline-block" style={{ textShadow: '3px 3px 0 rgba(0,0,0,.6)' }}>VS</span>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3 flex-row-reverse">
            <PixelFace rows={RAFAEL_ROWS} palette={RAFAEL_PAL} title="Rafael Khoury em pixel art" className="w-12 h-12 sm:w-16 sm:h-16" />
            <div className="text-right">
              <div style={PIXEL} className="text-[9px] sm:text-[11px] text-white">RAFAEL</div>
              <div className="font-mono text-[8px] tracking-[0.2em] uppercase text-white/40 mt-1.5">O Cético</div>
            </div>
          </div>
          <div className="w-full mt-1">
            <div className="flex items-baseline justify-between mb-1 flex-row-reverse">
              <span className="font-mono text-[8px] tracking-widest uppercase text-white/60">Confiabilidade</span>
              <span style={PIXEL} className="text-[9px] text-white">
                {phase === 'scoring' || phase === 'done' ? `${conf}/10` : '?/10'}
              </span>
            </div>
            <LifeBar value={conf} color="w" align="right" />
          </div>
        </div>
      </div>

      {/* manchete em debate */}
      <div className="relative z-10 px-4 sm:px-8 py-2.5 border-b border-white/10 flex items-center gap-3">
        <span className="w-1.5 h-1.5 bg-y rotate-45 shrink-0 pulse-dot" />
        <span className="font-mono text-[10px] sm:text-[11px] text-white/60 truncate uppercase tracking-wider">
          {deb.title}
        </span>
      </div>

      {/* tela do debate */}
      <div
        ref={chatRef}
        onClick={tapAdvance}
        role="log"
        aria-live="polite"
        aria-label="Transcrição do debate"
        className="relative z-10 h-[300px] sm:h-[340px] overflow-y-auto px-4 sm:px-8 py-5 cursor-pointer"
      >
        {phase === 'idle' && (
          <div className="h-full flex flex-col items-center justify-center gap-6 text-center">
            <p className="font-mono text-[11px] text-white/45 max-w-sm leading-relaxed">
              Um debate real, palavra por palavra, como saiu dos agentes — foi ele que definiu as
              notas deste post publicado.
            </p>
            <button
              onClick={start}
              style={PIXEL}
              className="text-[10px] bg-y text-ink px-6 py-4 border-2 border-y hover:bg-ink hover:text-y transition-colors"
            >
              ▶ INICIAR DEBATE
            </button>
            <span style={PIXEL} className="text-[8px] text-y/50 blink">PRESS START</span>
          </div>
        )}

        {phase !== 'idle' && (
          <div className="flex flex-col gap-3">
            {visibleTurns.map((t, i) => (
              <Bubble key={i} who={t.who} text={t.text} />
            ))}
            {typing && typing.text.length > 0 && (
              <Bubble who={typing.who} text={typing.text} cursor />
            )}

            {phase === 'done' && (
              <div className="mt-4 border-t border-y/25 pt-5 flex flex-col items-center gap-4 text-center">
                <span style={PIXEL} className="text-[10px] text-y" role="status">
                  ★ VEREDITO ★
                </span>
                <span className="font-mono text-[11px] text-white/70 tracking-wider uppercase">
                  Relevância {deb.relevancia}/10 · Confiabilidade {deb.confiabilidade}/10
                </span>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={start}
                    style={PIXEL}
                    className="text-[8px] px-4 py-3 border border-white/25 text-white/60 hover:border-y hover:text-y transition-colors"
                  >
                    ↻ REPLAY
                  </button>
                  <Link
                    href={`/posts/${deb.slug}`}
                    style={PIXEL}
                    className="text-[8px] px-4 py-3 bg-y text-ink border border-y hover:bg-ink hover:text-y transition-colors"
                  >
                    LER O POST →
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* rodapé de controles */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-2.5 border-t border-y/25 bg-y/[0.04]">
        <span className="font-mono text-[9px] tracking-widest uppercase text-white/30">
          {phase === 'idle' && 'aguardando jogador'}
          {phase === 'playing' && 'toque na tela pra acelerar'}
          {phase === 'scoring' && 'computando notas…'}
          {phase === 'done' && 'debate encerrado'}
        </span>
        {(phase === 'playing' || phase === 'scoring') && (
          <button
            onClick={finishAll}
            style={PIXEL}
            className="text-[8px] text-white/50 hover:text-y transition-colors"
          >
            PULAR ⏩
          </button>
        )}
      </div>
    </div>
  )
}

function Bubble({ who, text, cursor }: { who: 'caio' | 'rafael'; text: string; cursor?: boolean }) {
  const caio = who === 'caio'
  return (
    <div className={`flex ${caio ? 'justify-start pr-8 sm:pr-16' : 'justify-end pl-8 sm:pl-16'}`}>
      <div
        className={[
          'max-w-[92%] px-3.5 py-2.5 border text-[12.5px] leading-relaxed font-mono',
          caio
            ? 'bg-y/10 border-y/40 text-white/85'
            : 'bg-white/[0.06] border-white/20 text-white/85',
        ].join(' ')}
      >
        <span style={PIXEL} className={`block text-[7px] mb-1.5 ${caio ? 'text-y' : 'text-white/70'}`}>
          {caio ? 'CAIO' : 'RAFAEL'}
        </span>
        {text}
        {cursor && <span className="blink text-y">▮</span>}
      </div>
    </div>
  )
}
