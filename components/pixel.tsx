// Avatares pixel-art compartilhados (DebatePlayer, ProductionLine).
// Cada rosto é uma grade 12×12; cada char mapeia pra uma cor da paleta.

export const CAIO_ROWS = [
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
export const CAIO_PAL: Record<string, string> = {
  h: '#3a2410', s: '#f2c094', e: '#0a0a0a', m: '#a03d2e', t: '#FFE600',
}

export const RAFAEL_ROWS = [
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
export const RAFAEL_PAL: Record<string, string> = {
  h: '#2b2b2b', H: '#9aa0a3', s: '#e8b48c', g: '#0a0a0a', b: '#463a35', m: '#5e2c24', u: '#41585e',
}

export function PixelFace({ rows, palette, title, className }: {
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

export const PIXEL_FONT = { fontFamily: 'var(--font-pixel)' } as const
