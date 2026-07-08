// LickCard — tab-style SVG lick renderer (task D-22).
//
// Renders one structured lick from the KB `licks` schema (src/data/kb/SCHEMA.md):
//   { id, name, level, chordContext, techniques[], source?,
//     tab: [{ string: 1–6, fret: 0–15, technique? }] }   // ordered, first → last
//
// Tab convention (per SCHEMA.md): string 1 = high e rendered on TOP,
// string 6 = low E on the bottom — standard guitar tab. NOTE: this is the
// REVERSE of RiffDiagram.jsx's row order (that diagram puts low E on top).
//
// There is no rhythm information in the schema, so notes are simply evenly
// spaced columns in `tab` order — no bars, beams or durations are invented.
//
// Column rule: each note takes the next column, EXCEPT a note tagged
// `double-stop`, which stacks into the PREVIOUS note's column (unless it is on
// the same string, where stacking would overlap — then it takes a new column).
//
// Technique glyphs (amber, the established secondary-tone colour):
//   hammer-on  → slur arc from the previous note + italic "h" above
//   pull-off   → slur arc from the previous note + italic "p" above
//   slide      → short diagonal segment into the note (rises toward higher frets)
//   bend       → curved arrow rising from the note
//   vibrato    → small ~ wave above the note
//   ghost-note → fret number in parentheses, dimmed
//   double-stop→ no glyph; renders as a stacked column (see above)
//   chromatic-approach → no glyph (melodic content — the tag chip covers it)
//   unknown strings    → no glyph, note still renders (graceful)
//
// Exports:
//   default  <LickCard lick={…} size="thumb"|"full" />   (production API)
//   <TechniqueLegend />  — the glyph key, rendered ONCE per grid (per D-20 §3)
//   layoutTab(tab)       — pure layout helper (returns null on empty/invalid)
//   DEMO_LICK            — SCHEMA.md's worked B.B.-box example, dev fixture only
//
// Design tokens (tailwind.config.js) — SVG fills can't read Tailwind classes,
// so the constants below mirror the tokens (same convention as MiniPiano /
// ChordDiagram): accent #a855f7, amber #f59e0b, surface #0f0f0f.

const AMBER = '#f59e0b'        // token `amber` — technique glyphs
const FRET_TEXT = '#e5e7eb'    // gray-200 — fret numbers (≈15:1 on surface)
const GHOST_TEXT = '#9ca3af'   // gray-400 — ghost notes, quieter but AA (≈7:1)
const STRING_LINE = '#3a3a3a'  // string lines (decorative, RiffDiagram idiom)
const STRING_LABEL = '#6b7280' // gray-500 — string-name microcopy (decorative)
const CARD_BG = '#0f0f0f'      // token `surface` — backing pill behind fret numbers

// Fixed technique vocabulary (C-20 schema) — anything else gets no glyph.
export const TECHNIQUE_VOCAB = [
  'hammer-on', 'pull-off', 'slide', 'bend',
  'double-stop', 'ghost-note', 'chromatic-approach', 'vibrato',
]

// Chip symbol per technique (shown in the technique-tag chips).
const TECH_SYMBOL = {
  'hammer-on': 'h',
  'pull-off': 'p',
  slide: '⟋',
  bend: '↑',
  vibrato: '~',
  'ghost-note': '( )',
  'double-stop': '⋮',
  'chromatic-approach': null, // tag only — no mark on the tab
}

// ── Geometry (SVG user units; the svg scales to card width via viewBox) ──────
const STR_GAP = 14   // vertical gap between string lines
const PAD_T = 17     // headroom for bend arrows / vibrato above string 1
const PAD_B = 9
const PAD_L = 20     // room for string-name labels
const PAD_R = 12
const COL_W = 26     // horizontal pitch per note column

const STRING_NAMES = ['e', 'B', 'G', 'D', 'A', 'E'] // index = string − 1 (top → bottom)

function isValidNote(n) {
  return (
    n && typeof n === 'object' &&
    Number.isInteger(n.string) && n.string >= 1 && n.string <= 6 &&
    Number.isInteger(n.fret) && n.fret >= 0 && n.fret <= 15
  )
}

/**
 * Pure layout: tab array → positioned notes.
 * Returns null when there is nothing renderable (not an array / no valid note).
 * Otherwise: { notes: [{string,fret,technique?,col,x,y,label,ghost}], nCols, width, height }
 * Columns are monotonically non-decreasing; y grows with string number
 * (string 1 = smallest y = top line).
 */
export function layoutTab(tab) {
  if (!Array.isArray(tab)) return null
  const clean = tab.filter(isValidNote)
  if (clean.length === 0) return null

  const notes = []
  let col = -1
  for (let i = 0; i < clean.length; i++) {
    const n = clean[i]
    const prev = notes[i - 1]
    // double-stop stacks into the previous column — unless same string (overlap).
    const stacks = i > 0 && n.technique === 'double-stop' && prev.string !== n.string
    if (!stacks) col++
    const ghost = n.technique === 'ghost-note'
    notes.push({
      string: n.string,
      fret: n.fret,
      technique: typeof n.technique === 'string' ? n.technique : undefined,
      col,
      x: PAD_L + col * COL_W + COL_W / 2,
      y: PAD_T + (n.string - 1) * STR_GAP,
      label: ghost ? `(${n.fret})` : String(n.fret),
      ghost,
    })
  }

  const nCols = col + 1
  return {
    notes,
    nCols,
    width: PAD_L + nCols * COL_W + PAD_R,
    height: PAD_T + 5 * STR_GAP + PAD_B,
  }
}

// ── Glyph fragments (pure SVG, all in user units so they scale with the tab) ─

function SlurGlyph({ note, prev, letter }) {
  const fs = 8
  if (!prev || prev.col === note.col) {
    // No source note to slur from — letter alone, just before the note.
    return (
      <text x={note.x - 10} y={note.y - 7} textAnchor="middle" fontSize={fs}
        fontStyle="italic" fill={AMBER}>{letter}</text>
    )
  }
  const midX = (prev.x + note.x) / 2
  const topY = Math.min(prev.y, note.y)
  return (
    <g>
      <path
        d={`M ${prev.x + 5} ${prev.y - 4} Q ${midX} ${topY - 13} ${note.x - 5} ${note.y - 4}`}
        fill="none" stroke={AMBER} strokeWidth={1}
      />
      <text x={midX} y={topY - 11} textAnchor="middle" fontSize={fs}
        fontStyle="italic" fill={AMBER}>{letter}</text>
    </g>
  )
}

function SlideGlyph({ note, prev }) {
  // Rises toward the higher fret (up-slide ⟋), falls for a down-slide (⟍).
  if (prev && prev.col !== note.col) {
    const up = note.fret >= prev.fret
    const midY = (prev.y + note.y) / 2
    return (
      <line
        x1={prev.x + 7} y1={up ? midY + 3 : midY - 3}
        x2={note.x - 7} y2={up ? midY - 3 : midY + 3}
        stroke={AMBER} strokeWidth={1.2} strokeLinecap="round"
      />
    )
  }
  // Slide-in from nowhere: short lead-in segment.
  return (
    <line x1={note.x - 14} y1={note.y + 4} x2={note.x - 7} y2={note.y - 1}
      stroke={AMBER} strokeWidth={1.2} strokeLinecap="round" />
  )
}

function BendGlyph({ note }) {
  const { x, y } = note
  return (
    <g>
      <path d={`M ${x + 4} ${y - 4} Q ${x + 10} ${y - 6} ${x + 10} ${y - 11}`}
        fill="none" stroke={AMBER} strokeWidth={1.2} />
      <polygon
        points={`${x + 7.8},${y - 10} ${x + 12.2},${y - 10} ${x + 10},${y - 14.5}`}
        fill={AMBER}
      />
    </g>
  )
}

function VibratoGlyph({ note }) {
  const { x, y } = note
  return (
    <path
      d={`M ${x - 7} ${y - 9} q 2.3 -3.5 4.6 0 t 4.6 0 t 4.6 0`}
      fill="none" stroke={AMBER} strokeWidth={1.1} strokeLinecap="round"
    />
  )
}

function NoteGlyph({ note, prev }) {
  switch (note.technique) {
    case 'hammer-on': return <SlurGlyph note={note} prev={prev} letter="h" />
    case 'pull-off': return <SlurGlyph note={note} prev={prev} letter="p" />
    case 'slide': return <SlideGlyph note={note} prev={prev} />
    case 'bend': return <BendGlyph note={note} />
    case 'vibrato': return <VibratoGlyph note={note} />
    // ghost-note is handled by the parenthesised label; double-stop by the
    // column stacking; chromatic-approach and unknown strings get no mark.
    default: return null
  }
}

// ── The tab SVG ───────────────────────────────────────────────────────────────

function TabSvg({ layout, name, size }) {
  const { notes, width, height } = layout
  const full = size === 'full'
  return (
    <div className="w-full" style={{ maxWidth: width * (full ? 2 : 1.3) }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        style={{ display: 'block', height: 'auto' }}
        role="img"
        aria-label={`Tab for ${name}: ${notes.length} note${notes.length === 1 ? '' : 's'}`}
      >
        {/* String lines — string 1 (high e) on top, string 6 (low E) at bottom */}
        {STRING_NAMES.map((label, i) => {
          const y = PAD_T + i * STR_GAP
          return (
            <g key={label + i}>
              <line x1={PAD_L - 6} y1={y} x2={width - PAD_R + 6} y2={y}
                stroke={STRING_LINE} strokeWidth={i === 5 ? 1.4 : 1} />
              <text x={7} y={y + 3} textAnchor="middle" fontSize={7}
                fill={STRING_LABEL}>{label}</text>
            </g>
          )
        })}

        {/* Technique glyphs (under the numbers so pills stay readable) */}
        {notes.map((n, i) => (
          <NoteGlyph key={`g${i}`} note={n} prev={notes[i - 1]} />
        ))}

        {/* Fret numbers on their strings, backed by a surface pill so the
            number interrupts the string line like printed tab */}
        {notes.map((n, i) => {
          const w = n.label.length * 5.2 + 3
          return (
            <g key={`n${i}`}>
              <rect x={n.x - w / 2} y={n.y - 5.5} width={w} height={11}
                rx={2} fill={CARD_BG} />
              <text x={n.x} y={n.y + 3.2} textAnchor="middle" fontSize={9.5}
                fontWeight="600" fill={n.ghost ? GHOST_TEXT : FRET_TEXT}>
                {n.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── Card chrome ───────────────────────────────────────────────────────────────

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
  return null // unknown/missing level → no badge, never a wrong claim
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
        {name ? `${name} — tab unavailable` : 'lick unavailable'}
      </span>
    </div>
  )
}

/**
 * <LickCard lick={…} size="thumb"|"full" />
 * Pure/presentational — renders one KB lick object; never crashes on bad data.
 */
export default function LickCard({ lick, size = 'full' }) {
  const layout = layoutTab(lick?.tab)
  const name = typeof lick?.name === 'string' && lick.name.trim() ? lick.name : 'Untitled lick'

  if (!lick || !layout) {
    return <PlaceholderCard name={lick ? name : null} size={size} />
  }

  const full = size === 'full'
  const chordContext =
    typeof lick.chordContext === 'string' && lick.chordContext.trim()
      ? lick.chordContext
      : null
  const techniques = Array.isArray(lick.techniques)
    ? lick.techniques.filter(t => typeof t === 'string' && t.trim())
    : []
  const source = typeof lick.source === 'string' && lick.source.trim() ? lick.source : null

  return (
    <div
      className={`bg-surface border border-border rounded-lg flex flex-col ${full ? 'p-3 gap-2' : 'p-2 gap-1.5'}`}
      role="group"
      aria-label={chordContext ? `${name} — ${chordContext}` : name}
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
            {chordContext}
          </span>
        </div>
      )}

      {/* The tab */}
      <TabSvg layout={layout} name={name} size={size} />

      {/* Technique tags */}
      {full && techniques.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {techniques.map(t => <TechniqueChip key={t} tech={t} />)}
        </div>
      )}

      {/* Attribution */}
      {full && source && (
        <span className="text-[10px] text-gray-500 italic leading-snug">{source}</span>
      )}
    </div>
  )
}

// ── Glyph legend — render ONCE per lick grid (D-20 §3), not per card ─────────

function LegendSample({ children, w = 22 }) {
  return (
    <svg viewBox={`0 0 ${w} 18`} width={w} height={18} aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      {children}
    </svg>
  )
}

export function TechniqueLegend() {
  const items = [
    {
      key: 'hammer-on', label: 'hammer-on',
      sample: (
        <LegendSample>
          <path d="M 3 14 Q 11 4 19 14" fill="none" stroke={AMBER} strokeWidth={1} />
          <text x={11} y={9} textAnchor="middle" fontSize={8} fontStyle="italic" fill={AMBER}>h</text>
        </LegendSample>
      ),
    },
    {
      key: 'pull-off', label: 'pull-off',
      sample: (
        <LegendSample>
          <path d="M 3 14 Q 11 4 19 14" fill="none" stroke={AMBER} strokeWidth={1} />
          <text x={11} y={9} textAnchor="middle" fontSize={8} fontStyle="italic" fill={AMBER}>p</text>
        </LegendSample>
      ),
    },
    {
      key: 'slide', label: 'slide',
      sample: (
        <LegendSample>
          <line x1={4} y1={13} x2={18} y2={5} stroke={AMBER} strokeWidth={1.2} strokeLinecap="round" />
        </LegendSample>
      ),
    },
    {
      key: 'bend', label: 'bend',
      sample: (
        <LegendSample>
          <path d="M 5 14 Q 12 12 12 7" fill="none" stroke={AMBER} strokeWidth={1.2} />
          <polygon points="9.8,8 14.2,8 12,3.5" fill={AMBER} />
        </LegendSample>
      ),
    },
    {
      key: 'vibrato', label: 'vibrato',
      sample: (
        <LegendSample>
          <path d="M 3 10 q 2.3 -3.5 4.6 0 t 4.6 0 t 4.6 0" fill="none" stroke={AMBER} strokeWidth={1.1} strokeLinecap="round" />
        </LegendSample>
      ),
    },
    {
      key: 'ghost-note', label: 'ghost note',
      sample: (
        <LegendSample>
          <text x={11} y={12} textAnchor="middle" fontSize={9} fontWeight="600" fill={GHOST_TEXT}>(5)</text>
        </LegendSample>
      ),
    },
    {
      key: 'double-stop', label: 'double-stop (stacked)',
      sample: (
        <LegendSample>
          <text x={11} y={8} textAnchor="middle" fontSize={8} fontWeight="600" fill={FRET_TEXT}>5</text>
          <text x={11} y={17} textAnchor="middle" fontSize={8} fontWeight="600" fill={FRET_TEXT}>7</text>
        </LegendSample>
      ),
    },
  ]

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-gray-400">
      {items.map(it => (
        <span key={it.key} className="inline-flex items-center gap-1.5">
          {it.sample}
          {it.label}
        </span>
      ))}
      <span className="text-gray-500">chromatic-approach: tag only, no mark</span>
    </div>
  )
}

// ── Dev fixture — SCHEMA.md's worked example (P-21 real data replaces this in
//    the app; this export exists so the card can be exercised before P-21) ────

export const DEMO_LICK = {
  id: 'blues-box1-bb-answer',
  name: 'B.B. box answer phrase',
  level: 'foundation',
  chordContext: 'over the I7',
  techniques: ['bend', 'vibrato'],
  source: 'the B.B. King box, e.g. "The Thrill Is Gone" fills',
  tab: [
    { string: 2, fret: 8 },
    { string: 1, fret: 8, technique: 'bend' },
    { string: 1, fret: 10, technique: 'vibrato' },
    { string: 2, fret: 8 },
  ],
}
