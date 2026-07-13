// PianoLickCard — degree-based piano lick renderer (task D-60).
//
// Renders one structured piano lick from the KB `licks` schema for piano packs
// (src/data/kb/SCHEMA.md "Piano licks"): degree-language notes realized over a
// LIVE root — the same reasoning as BassPatternCard: the data transposes, the
// card shows the actual keys under your hands right now.
//
//   { id, name, level, chordContext, quality, techniques[], source?, tips?,
//     notes: [{ deg|approach, octave?, beat?, technique? }] }   // ordered
//
// ── Realization (SCHEMA.md rules) ─────────────────────────────────────────────
// Pitch space: MiniPiano's absolute-note window, 0 = C3, range [0, 36] — which
// is ALSO chordAudio's playVoicing space (its doc: "0 = the C of the low
// displayed octave = C3"), so realized notes drop straight into playback.
//  · The ROOT sits at its pitch class in the bottom octave: rootAbs = rootPc
//    (0–11). The schema caps every resolved offset at 25 semitones, so the
//    highest legal note is 11 + 25 = 36 — every lick fits in all 12 keys.
//  · A `deg` note: abs = rootAbs + resolveDegree(deg, lick.quality) + 12·octave.
//    `quality` is the lick's own machine truth (NOT the live chord's quality —
//    the lick states what it resolves through; the caller picks licks that fit).
//  · An `approach` note derives from the NEXT `deg` note in `notes[]` order
//    (scanning past intervening approaches): chrom-below = target − 1,
//    chrom-above = target + 1. Approaches are non-terminal by schema; a lick
//    ending on an approach (or any unresolvable note) nulls the realization and
//    the card renders an honest placeholder instead of lying.
//
// ── Visual design (thumb): pitch-timeline ─────────────────────────────────────
// x = beat (proportional columns when every note carries a beat, LickCard-style
// even columns otherwise), y = pitch — a piano-roll miniature. Chosen over
// order-numbered keyboard dots for the thumb because a lick IS contour + rhythm:
// the line shape reads at strip size without decoding numbers. Note markers are
// LickCard's surface-pill idiom carrying NOTE NAMES (the actionable info for a
// keyboard player), connected by a faint contour line; dashed accent lines mark
// the root pitch ("R" gutter label) so "home" is visible at a glance.
//
// Colour tiers (established language, Fretboard/Piano/BassPatternCard):
//   chord tone → purple (ACCENT_SOFT text; root itself full ACCENT)
//   other scale degrees/extensions → gray-200
//   approaches (borrowed chromatics) → amber, like BassPatternCard
//   ghost-note → parenthesised, dimmed (LickCard idiom)
//
// Technique glyphs (amber): grace-note = slashed mini-note crushed before its
// target · slide = thicker amber glissando segment replacing that contour hop ·
// double-stop = stacked pills at one x (equal beats; or LickCard's column rule
// beatless) · ghost-note = the parenthesised dim label. <PianoTechniqueLegend/>
// renders the key ONCE per grid (LickCard's TechniqueLegend contract).
//
// `size="full"` adds: chordContext chip, an order-numbered keyboard view
// (MiniPiano's cropped-window geometry), technique chips, tips, source —
// mirroring LickCard's full-size behaviour.
//
// ── No playback (D-70 §3) ─────────────────────────────────────────────────────
// The strip is purely visual — glance over audio (the user's settled call, "then
// leave them off, better not"). The ▶ play path (sequencer + PlayButton) was
// removed with the rest of the ▶s across the app; the card only renders now.
//
// ── Wiring contract (LicksStrip integration — Luthier, L-71) ──────────────────
//   <PianoLickCard lick={…} rootPc={0–11} chordLabel="Dm7" size="thumb|full" />
//   lick       — one entry of a piano pack's top-level `licks` array
//   rootPc     — the LIVE chord root pitch class (from the loop station)
//   chordLabel — optional display name for aria/captions (falls back to
//                NOTES[rootPc] + quality)
//   Pure/presentational; never crashes on bad data (placeholder instead).
//
// Design tokens (tailwind.config.js) — SVG fills can't read Tailwind classes,
// so the constants below mirror the tokens (LickCard/MiniPiano convention).

import { NOTES, CHORD_TYPES } from '../lib/theory'
import { resolveDegree } from './JamGuide'

// ─── Vocabulary (hand-synced with validate-kb.mjs PIANO_LICK_TECHNIQUES; the
//     smoke §7b-piano guard enforces set-equality — add to BOTH or neither) ────
export const PIANO_TECHNIQUE_VOCAB = ['slide', 'double-stop', 'ghost-note', 'grace-note']

// Chip symbol per technique (technique-tag chips, full size).
const TECH_SYMBOL = {
  slide: '⟋',
  'double-stop': '⋮',
  'ghost-note': '( )',
  'grace-note': '♪',
}

// ─── Palette (mirrors tailwind.config.js tokens + MiniPiano's key colours) ────
const ACCENT = '#a855f7'       // token `accent` — the root (focal tone)
const ACCENT_SOFT = '#c084fc'  // lighter accent — chord tones (MiniPiano tier)
const AMBER = '#f59e0b'        // token `amber` — approaches + technique glyphs
const NOTE_TEXT = '#e5e7eb'    // gray-200 — non-chord-tone degrees
const GHOST_TEXT = '#9ca3af'   // gray-400 — ghost notes (dim but AA)
const CONTOUR = '#3a3a3a'      // contour line (decorative, LickCard string idiom)
const LABEL = '#6b7280'        // gray-500 — beat numbers / gutter microcopy
const CARD_BG = '#0f0f0f'      // token `surface` — backing pills
const WHITE_FILL = '#f5f5f5'   // MiniPiano key colours (keyboard view)
const BLACK_FILL = '#1f2937'
const WHITE_STROKE = '#374151'
const BLACK_STROKE = '#111827'

const APPROACH_DELTA = { 'chrom-below': -1, 'chrom-above': 1 }
const ABS_MAX = 36 // MiniPiano window top key

const mod12 = (n) => ((n % 12) + 12) % 12

// abs (0 = C3) → "A3"/"F4"… scientific spelling, for aria pitch lists.
const absName = (abs) => `${NOTES[mod12(abs)]}${Math.floor(abs / 12) + 3}`

/**
 * realizePianoLick(lick, rootPc)
 *   → [{ abs, name, beat?, technique?, approach, chordTone, isRoot }] | null
 *
 * Pure realization per the header rules. Returns null on ANY malformed or
 * out-of-window note so the caller renders a placeholder — authored data is
 * validator-guaranteed, but a renderer must never crash on bad input.
 */
export function realizePianoLick(lick, rootPc) {
  if (!lick || typeof lick !== 'object' || !Number.isFinite(rootPc)) return null
  const notes = lick.notes
  if (!Array.isArray(notes) || notes.length === 0) return null
  const quality = lick.quality
  const intervals = CHORD_TYPES[quality]?.intervals
  if (!intervals) return null // quality is required machine truth (schema)
  const root = mod12(rootPc)
  const chordPcs = new Set(intervals.map(mod12))

  // Pass 1: resolve every deg note's absolute pitch.
  const abs = new Array(notes.length).fill(null)
  for (let i = 0; i < notes.length; i++) {
    const n = notes[i]
    if (!n || typeof n !== 'object') return null
    const isDeg = n.deg !== undefined
    const isApp = n.approach !== undefined
    if (isDeg === isApp) return null // exactly one of deg | approach (schema)
    if (isDeg) {
      const off = resolveDegree(String(n.deg), quality)
      if (off === null || off === undefined) return null
      const oct = n.octave === undefined ? 0 : n.octave
      if (![0, 1, 2].includes(oct)) return null
      abs[i] = root + off + 12 * oct
    }
  }
  // Pass 2: approaches derive from the NEXT deg note (schema: never terminal).
  for (let i = 0; i < notes.length; i++) {
    if (abs[i] !== null) continue
    const delta = APPROACH_DELTA[notes[i].approach]
    if (delta === undefined) return null
    const target = abs.slice(i + 1).find((a) => a !== null)
    if (target === undefined) return null // approach with nothing to target
    abs[i] = target + delta
  }
  if (abs.some((a) => a < 0 || a > ABS_MAX)) return null // outside the window

  return notes.map((n, i) => ({
    abs: abs[i],
    name: NOTES[mod12(abs[i])],
    beat: Number.isFinite(n.beat) ? n.beat : undefined,
    technique: typeof n.technique === 'string' ? n.technique : undefined,
    approach: n.approach !== undefined,
    chordTone: !(n.approach !== undefined) && chordPcs.has(mod12(abs[i] - root)),
    isRoot: !(n.approach !== undefined) && mod12(abs[i] - root) === 0,
  }))
}

// ─── Timeline layout (x = beat/column, y = pitch) ─────────────────────────────

const PAD_T = 14   // headroom for grace glyphs above the top pill
const PAD_B = 8
const PAD_L = 16   // gutter for the "R" root-line label
const PAD_R = 12
const COL_W = 26   // beatless column pitch (LickCard's)
const BEAT_ROW = 10
const SEMI_MIN = 3 // px per semitone bounds — wide licks compress,
const SEMI_MAX = 7 // narrow licks stretch, so contour stays legible

function layoutLick(realized, rootPc) {
  const hasBeats =
    realized.every((n) => Number.isFinite(n.beat)) &&
    realized.every((n, i) => i === 0 || n.beat >= realized[i - 1].beat)

  // x: proportional to beat when authored (BassPatternCard), else LickCard
  // columns — where a double-stop stacks into the previous column.
  let xs, width, maxBeat = null, unit = null
  if (hasBeats) {
    const gaps = realized
      .map((n, i) => (i > 0 ? n.beat - realized[i - 1].beat : 0))
      .filter((g) => g > 0)
    const minGap = gaps.length ? Math.min(...gaps) : 1
    unit = Math.min(COL_W / minGap, COL_W * 4)
    xs = realized.map((n) => PAD_L + (n.beat - 1) * unit + 10)
    maxBeat = realized[realized.length - 1].beat
    width = PAD_L + (maxBeat - 1) * unit + 20 + PAD_R
  } else {
    let col = -1
    xs = realized.map((n, i) => {
      const stacks = i > 0 && n.technique === 'double-stop'
      if (!stacks) col++
      return PAD_L + col * COL_W + COL_W / 2
    })
    width = PAD_L + (col + 1) * COL_W + PAD_R
  }

  // y: linear pitch axis over the lick's own range.
  const lo = Math.min(...realized.map((n) => n.abs))
  const hi = Math.max(...realized.map((n) => n.abs))
  const range = Math.max(1, hi - lo)
  const semi = Math.min(SEMI_MAX, Math.max(SEMI_MIN, 66 / range))
  const plotH = Math.max(26, range * semi)
  const yFor = (a) => PAD_T + plotH - (a - lo) * semi

  return {
    hasBeats,
    maxBeat,
    unit,
    width,
    height: PAD_T + plotH + PAD_B + (hasBeats ? BEAT_ROW : 0),
    plotBottom: PAD_T + plotH,
    // Root reference lines: every root-pc pitch inside the plotted range.
    rootYs: Array.from({ length: hi - lo + 1 }, (_, k) => lo + k)
      .filter((a) => mod12(a) === mod12(rootPc))
      .map(yFor),
    notes: realized.map((n, i) => ({
      ...n,
      x: xs[i],
      y: yFor(n.abs),
      label: n.technique === 'ghost-note' ? `(${n.name})` : n.name,
      ghost: n.technique === 'ghost-note',
    })),
  }
}

function pillColor(n) {
  if (n.approach) return AMBER
  if (n.ghost) return GHOST_TEXT
  if (n.isRoot) return ACCENT
  if (n.chordTone) return ACCENT_SOFT
  return NOTE_TEXT
}

// Grace ornament: slashed mini-note crushed just before its target pill.
function GraceGlyph({ note }) {
  const cx = note.x - 12
  const cy = note.y - 8
  return (
    <g>
      <circle cx={cx} cy={cy} r={2} fill={AMBER} />
      <line x1={cx - 3} y1={cy + 3} x2={cx + 3} y2={cy - 3}
        stroke={AMBER} strokeWidth={1} strokeLinecap="round" />
      <path d={`M ${cx + 2.5} ${cy} Q ${(cx + note.x) / 2} ${cy - 4} ${note.x - 6} ${note.y - 4}`}
        fill="none" stroke={AMBER} strokeWidth={0.9} />
    </g>
  )
}

function TimelineSvg({ layout, ariaLabel }) {
  const { notes, width, height, hasBeats, maxBeat, unit, plotBottom, rootYs } = layout
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      style={{ display: 'block', height: 'auto', maxWidth: width * 1.4 }}
      role="img"
      aria-label={ariaLabel}
    >
      {/* Root ("home") reference lines + gutter label */}
      {rootYs.map((y, i) => (
        <g key={`r${i}`}>
          <line x1={PAD_L - 4} y1={y} x2={width - PAD_R + 4} y2={y}
            stroke={ACCENT} strokeOpacity={0.3} strokeWidth={1} strokeDasharray="3 3" />
          <text x={6} y={y + 2.5} textAnchor="middle" fontSize={6.5} fill={ACCENT} fillOpacity={0.75}>
            R
          </text>
        </g>
      ))}

      {/* Beat numbers (only when beats are authored; x mirrors note columns) */}
      {hasBeats &&
        Array.from({ length: Math.floor(maxBeat + 1e-6) }, (_, b) => (
          <text key={`b${b}`} x={PAD_L + b * unit + 10} y={plotBottom + BEAT_ROW}
            textAnchor="middle" fontSize={6.5} fill={LABEL}>
            {b + 1}
          </text>
        ))}

      {/* Contour: connect consecutive notes when x advances (dyad partners
          float stacked); a slide hop redraws its segment as a thicker amber
          glissando line. */}
      {notes.map((n, i) => {
        const prev = notes[i - 1]
        if (!prev || n.x <= prev.x) return null
        const slide = n.technique === 'slide'
        return (
          <line key={`c${i}`}
            x1={prev.x} y1={prev.y} x2={n.x} y2={n.y}
            stroke={slide ? AMBER : CONTOUR}
            strokeWidth={slide ? 1.6 : 1}
            strokeLinecap="round"
          />
        )
      })}

      {/* Grace ornaments (above the pills) */}
      {notes.map((n, i) => (n.technique === 'grace-note' ? <GraceGlyph key={`g${i}`} note={n} /> : null))}

      {/* Note-name pills at pitch height — LickCard's fret-pill idiom */}
      {notes.map((n, i) => {
        const w = n.label.length * 5.2 + 4
        return (
          <g key={`n${i}`}>
            <rect x={n.x - w / 2} y={n.y - 5.5} width={w} height={11} rx={2} fill={CARD_BG} />
            <text x={n.x} y={n.y + 3.2} textAnchor="middle" fontSize={9}
              fontWeight="600" fill={pillColor(n)}>
              {n.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── Keyboard view (full size): which keys, in what order ────────────────────
// MiniPiano's cropped-window geometry (whole-octave span + trailing high C),
// replicated here because order badges aren't part of MiniPiano's contract.

const WW = 22
const WH = 60
const BW = 14
const BH = 38
const WHITE_PCS = [0, 2, 4, 5, 7, 9, 11]
const BLACK_OFFSETS = [
  { pc: 1, afterWhite: 0 }, { pc: 3, afterWhite: 1 }, { pc: 6, afterWhite: 3 },
  { pc: 8, afterWhite: 4 }, { pc: 10, afterWhite: 5 },
]

function LickKeyboard({ realized, ariaLabel }) {
  // abs → { orders: [1-based strike order…], tier }
  const hits = new Map()
  realized.forEach((n, i) => {
    const h = hits.get(n.abs) ?? { orders: [], isRoot: false, deg: false, approach: false }
    h.orders.push(i + 1)
    h.isRoot ||= n.isRoot
    h.deg ||= !n.approach
    h.approach ||= n.approach
    hits.set(n.abs, h)
  })
  const lo = Math.min(...realized.map((n) => n.abs))
  const hi = Math.max(...realized.map((n) => n.abs))
  const octStart = Math.floor(lo / 12)
  const OCTAVES = Math.max(1, Math.ceil((hi - octStart * 12) / 12))
  const TOTAL_WHITES = WHITE_PCS.length * OCTAVES + 1
  const baseW = WW * TOTAL_WHITES + 2
  const scale = 0.85

  const fillFor = (h) => (h.deg ? (h.isRoot ? ACCENT : ACCENT_SOFT) : AMBER)

  const whites = []
  for (let oct = 0; oct < OCTAVES; oct++) {
    for (let wi = 0; wi < WHITE_PCS.length; wi++) {
      const absWi = oct * WHITE_PCS.length + wi
      whites.push({ x: absWi * WW + 1, absWi, absNote: (octStart + oct) * 12 + WHITE_PCS[wi] })
    }
  }
  whites.push({
    x: OCTAVES * WHITE_PCS.length * WW + 1,
    absWi: OCTAVES * WHITE_PCS.length,
    absNote: (octStart + OCTAVES) * 12,
  })
  const blacks = []
  for (let oct = 0; oct < OCTAVES; oct++) {
    for (const { pc, afterWhite } of BLACK_OFFSETS) {
      blacks.push({
        x: (oct * WHITE_PCS.length + afterWhite) * WW + WW - BW / 2,
        key: `${oct}-${pc}`,
        absNote: (octStart + oct) * 12 + pc,
      })
    }
  }

  return (
    <svg width={baseW * scale} height={(WH + 4) * scale} viewBox={`0 0 ${baseW} ${WH + 4}`}
      className="overflow-visible" role="img" aria-label={ariaLabel}>
      {whites.map(({ x, absWi, absNote }) => {
        const h = hits.get(absNote)
        return (
          <g key={`w${absWi}`}>
            <rect x={x} y={1} width={WW - 1} height={WH} rx={2}
              fill={h ? fillFor(h) : WHITE_FILL} stroke={WHITE_STROKE} strokeWidth={0.5} />
            {h && (
              <text x={x + (WW - 1) / 2} y={WH - 6} textAnchor="middle"
                fontSize={7} fontWeight="bold" fill={h.deg ? 'white' : 'black'}>
                {h.orders.join('·')}
              </text>
            )}
          </g>
        )
      })}
      {blacks.map(({ x, key, absNote }) => {
        const h = hits.get(absNote)
        return (
          <g key={`b${key}`}>
            <rect x={x} y={1} width={BW} height={BH} rx={2}
              fill={h ? fillFor(h) : BLACK_FILL} stroke={BLACK_STROKE} strokeWidth={0.5} />
            {h && (
              <text x={x + BW / 2} y={BH - 5} textAnchor="middle"
                fontSize={6} fontWeight="bold" fill={h.deg ? 'white' : 'black'}>
                {h.orders.join('·')}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ─── Card chrome (LickCard's idiom) ───────────────────────────────────────────

function LevelBadge({ level }) {
  if (level === 'intermediate') {
    return (
      <span className="shrink-0 text-[9px] uppercase tracking-wide font-semibold text-amber border border-amber/40 rounded px-1.5 py-px">
        intermediate
      </span>
    )
  }
  if (level === 'foundation') {
    return (
      <span className="shrink-0 text-[9px] uppercase tracking-wide font-semibold text-gray-400 border border-border rounded px-1.5 py-px">
        foundation
      </span>
    )
  }
  return null
}

function TechniqueChip({ tech }) {
  const symbol = TECH_SYMBOL[tech]
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 border border-border rounded-full px-1.5 py-px">
      {symbol && <span className="text-amber font-semibold" aria-hidden="true">{symbol}</span>}
      {tech}
    </span>
  )
}

function PlaceholderCard({ name, size }) {
  return (
    <div
      className={`bg-surface border border-border rounded-lg flex flex-col items-center justify-center text-gray-500 ${size === 'thumb' ? 'p-2 min-h-[72px]' : 'p-4 min-h-[110px]'}`}
      role="group"
      aria-label={name ? `${name}: lick unavailable` : 'lick unavailable'}
    >
      <span className="text-lg leading-none" aria-hidden="true">—</span>
      <span className="text-[10px] mt-1">
        {name ? `${name} — lick unavailable` : 'lick unavailable'}
      </span>
    </div>
  )
}

/**
 * <PianoLickCard lick={…} rootPc={0–11} chordLabel? size="thumb"|"full" />
 * Pure/presentational — realizes one KB piano lick over the live chord root;
 * never crashes on bad data. See the header for the full wiring contract.
 */
export default function PianoLickCard({ lick, rootPc, chordLabel, size = 'full' }) {
  const realized = realizePianoLick(lick, rootPc)
  const name = typeof lick?.name === 'string' && lick.name.trim() ? lick.name : 'Untitled lick'

  if (!realized) {
    return <PlaceholderCard name={lick ? name : null} size={size} />
  }

  const full = size === 'full'
  const chordName =
    typeof chordLabel === 'string' && chordLabel.trim()
      ? chordLabel
      : `${NOTES[mod12(rootPc)]}${CHORD_TYPES[lick.quality]?.suffix ?? lick.quality}`
  const chordContext =
    typeof lick.chordContext === 'string' && lick.chordContext.trim() ? lick.chordContext : null
  const techniques = Array.isArray(lick.techniques)
    ? lick.techniques.filter((t) => typeof t === 'string' && t.trim())
    : []
  const source = typeof lick.source === 'string' && lick.source.trim() ? lick.source : null
  const tips = typeof lick.tips === 'string' && lick.tips.trim() ? lick.tips : null

  const layout = layoutLick(realized, rootPc)
  const pitchNames = realized.map((n) => absName(n.abs)).join(', ')

  return (
    <div
      className={`bg-surface border border-border rounded-lg flex flex-col ${full ? 'p-3 gap-2' : 'p-2 gap-1.5'}`}
      role="group"
      aria-label={`${name} — over ${chordName}${chordContext ? ` (${chordContext})` : ''}`}
    >
      {/* Header: name + level badge */}
      <div className="flex items-start justify-between gap-2">
        <span className={`text-gray-200 font-semibold leading-tight ${full ? 'text-sm' : 'text-[11px]'}`}>
          {name}
        </span>
        <LevelBadge level={lick.level} />
      </div>

      {/* Where it lands */}
      {full && chordContext && (
        <div>
          <span className="inline-block text-[10px] font-medium text-accent bg-accent/10 border border-accent/40 rounded-full px-2 py-px">
            {chordContext} · here: {chordName}
          </span>
        </div>
      )}

      {/* The pitch timeline */}
      <div className="max-w-full overflow-x-auto dark-scroll">
        <TimelineSvg
          layout={layout}
          ariaLabel={`Melody for ${name} over ${chordName}: ${pitchNames}`}
        />
      </div>

      {/* Keyboard view (full): the actual keys, numbered in strike order */}
      {full && (
        <div className="max-w-full overflow-x-auto dark-scroll">
          <LickKeyboard
            realized={realized}
            ariaLabel={`Keys for ${name} over ${chordName}, numbered in playing order`}
          />
        </div>
      )}

      {/* Technique tags */}
      {full && techniques.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {techniques.map((t) => <TechniqueChip key={t} tech={t} />)}
        </div>
      )}

      {/* Transferable idea + attribution */}
      {full && tips && <p className="text-[10px] leading-snug text-gray-500">{tips}</p>}
      {full && source && (
        <span className="text-[10px] text-gray-500 italic leading-snug">{source}</span>
      )}
    </div>
  )
}

// ─── Glyph legend — render ONCE per lick grid (LickCard contract) ─────────────

function LegendSample({ children, w = 22 }) {
  return (
    <svg viewBox={`0 0 ${w} 18`} width={w} height={18} aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      {children}
    </svg>
  )
}

export function PianoTechniqueLegend() {
  const items = [
    {
      key: 'grace-note', label: 'grace note',
      sample: (
        <LegendSample>
          <circle cx={5} cy={7} r={2} fill={AMBER} />
          <line x1={2} y1={10} x2={8} y2={4} stroke={AMBER} strokeWidth={1} strokeLinecap="round" />
          <path d="M 7 8 Q 12 5 16 10" fill="none" stroke={AMBER} strokeWidth={0.9} />
          <circle cx={17} cy={12} r={3} fill={NOTE_TEXT} />
        </LegendSample>
      ),
    },
    {
      key: 'slide', label: 'slide (key-slip)',
      sample: (
        <LegendSample>
          <line x1={4} y1={13} x2={18} y2={5} stroke={AMBER} strokeWidth={1.6} strokeLinecap="round" />
        </LegendSample>
      ),
    },
    {
      key: 'double-stop', label: 'double-stop (stacked)',
      sample: (
        <LegendSample>
          <text x={11} y={8} textAnchor="middle" fontSize={8} fontWeight="600" fill={NOTE_TEXT}>G</text>
          <text x={11} y={17} textAnchor="middle" fontSize={8} fontWeight="600" fill={NOTE_TEXT}>D</text>
        </LegendSample>
      ),
    },
    {
      key: 'ghost-note', label: 'ghost note',
      sample: (
        <LegendSample>
          <text x={11} y={12} textAnchor="middle" fontSize={9} fontWeight="600" fill={GHOST_TEXT}>(E)</text>
        </LegendSample>
      ),
    },
  ]
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-gray-400">
      {items.map((it) => (
        <span key={it.key} className="inline-flex items-center gap-1.5">
          {it.sample}
          {it.label}
        </span>
      ))}
      <span className="text-gray-500">amber = chromatic approach · purple = chord tone · R line = the root</span>
    </div>
  )
}

// ─── Dev fixture — SCHEMA.md's worked enclosure (P-60 real data replaces this
//    in the app; exported so the card can be exercised before P-60 lands) ─────

export const DEMO_PIANO_LICK = {
  id: 'jazz-enclosure-into-3',
  name: 'Bebop enclosure into the 3rd',
  level: 'intermediate',
  chordContext: 'over the ii7',
  quality: 'min7',
  techniques: ['grace-note'],
  source: 'Barry Harris workshop vocabulary',
  notes: [
    { deg: '5', octave: 1, beat: 1 },
    { approach: 'chrom-above', beat: 2 },
    { approach: 'chrom-below', beat: 2.5 },
    { deg: '3', octave: 1, beat: 3, technique: 'grace-note' },
  ],
}
