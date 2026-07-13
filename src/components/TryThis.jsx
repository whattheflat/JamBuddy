import { CHORD_TYPES, NOTES, suggestSubstitutions } from '../lib/theory'
import { chordRootPC } from '../lib/match'
import { getGuitarVoicings } from '../lib/voicings'
import { pianoVoicing } from '../lib/piano'
import ChordDiagram from './ChordDiagram'
import MiniPiano from './MiniPiano'

// ─── TryThis — stable 3-slot rows-of-shapes substitution rail (L-78 / D-76) ─────
//
// For the chord under the playhead, in the detected key, show up to THREE curated
// substitutions (from theory.js `suggestSubstitutions`, the L-73 engine) as
// stacked ROWS — turned 90° from L-75's cards-across. Each row = a left identity
// block (tappable chord chip + category tag + why) and a right "ways to play it"
// block that follows the global instrument:
//   guitar → up to 3 ChordDiagram thumbs (the 3×3 grid), the genuinely different
//            grips from getGuitarVoicings(label).slice(0, 3)
//   piano  → ONE MiniPiano ("for piano it can be just one thats okay")
//   bass   → a root · {note} caption (no honest compact bass-chord renderer)
//
// The layout is a FIXED 3-slot frame: present subs render SubRow, absent slots
// render a subtle EmptySlot that holds the exact row height — so sub #1 and #2
// never shift position whether the chord yields 2 or 3 subs (the user's anti-jump
// ask: "annoying when the layout changes then u dont know where to look").
// Spec: docs/design/related-area-v2.md §2. Sibling of RelatedProgressions.
//
// Props:
//   loop         : string[] | null — the detected repeating progression (chord names)
//   keyInfo      : { root, mode, confidence } | null — effective key (frames the why)
//   currentChord : string — the chord sounding NOW ("F", "Dm7")
//   onChordClick : fn(label) — opens ChordDetailModal (App's setSelectedChord)
//   instrument   : 'guitar' | 'piano' | 'bass' — which mini diagram to draw

// Invert CHORD_TYPES suffix → quality — the app idiom (mirrors
// RelatedProgressions' SUFFIX_TO_QUALITY). All 14 suffixes are unique.
const SUFFIX_TO_QUALITY = Object.fromEntries(
  Object.entries(CHORD_TYPES).map(([quality, def]) => [def.suffix, quality])
)

// Parse a chord-name string → { rootPc, quality } (a CHORD_TYPES key) using the
// established helpers — chordRootPC for the root pc, the CHORD_TYPES suffix
// inversion for the quality. Never re-derived. Returns null when unparseable.
export function parseChordName(name) {
  if (typeof name !== 'string') return null
  const rootPc = chordRootPC(name)
  if (rootPc < 0) return null
  const m = name.match(/^[A-G][b#]?(.*)$/)
  const quality = m ? SUFFIX_TO_QUALITY[m[1]] : undefined
  if (!quality) return null
  return { rootPc, quality }
}

// Circle-of-fifths categories (relative = inner ring, secondary_dominant =
// clockwise step). Only these earn the ↻ glyph — borrowed/extension are modal /
// vertical colour and must NOT claim the circle (docs §6).
const CIRCLE_CATEGORIES = new Set(['relative', 'secondary_dominant'])

const CATEGORY_TAG = {
  relative: 'relative',
  borrowed: 'borrowed',
  extension: 'colour',
  secondary_dominant: 'V7',
}

// Per-instrument uniform row height (§2.2/§3). All 3 slots — filled or empty —
// share the current instrument's height so the frame never reflows.
const ROW_MIN_H = {
  guitar: 'min-h-[100px]',
  piano: 'min-h-[72px]',
  bass: 'min-h-[64px]',
}

// Compute the substitution set for a chord NAME at loop index `pos` (−1 when the
// chord is not a loop station). The next station's root pc gates Rule D (secondary
// dominant of the next chord). Returns { name, pos, subs } or null when the name
// won't parse. Reuses parseChordName / chordRootPC / suggestSubstitutions — never
// re-derives theory.
function subsForChord(name, pos, loopArr, keyInfo) {
  const parsed = parseChordName(name)
  if (!parsed) return null
  let nextRootPc
  if (loopArr && pos >= 0) {
    const pc = chordRootPC(loopArr[(pos + 1) % loopArr.length])
    if (pc >= 0) nextRootPc = pc
  }
  return { name, pos, subs: suggestSubstitutions(parsed, keyInfo, { nextRootPc }) }
}

// Choose the SUBJECT chord the card speaks about (pure — no hooks):
//   (a) the live currentChord, if it parses and yields ≥1 sub (the playing case —
//       whether or not it's a loop station; keeps the card live as you play);
//   (b) else the FIRST loop chord that yields ≥1 sub — so a rolled/detected loop
//       in a locked key shows the card immediately, with no live input;
//   (c) else null — no loop and no valid live chord → honest empty.
function pickSubject(loopArr, keyInfo, currentChord) {
  const pos = loopArr ? loopArr.indexOf(currentChord) : -1
  const live = subsForChord(currentChord, pos, loopArr, keyInfo)
  if (live && live.subs.length) return live
  if (loopArr) {
    for (let i = 0; i < loopArr.length; i++) {
      const cand = subsForChord(loopArr[i], i, loopArr, keyInfo)
      if (cand && cand.subs.length) return cand
    }
  }
  return null
}

// The "ways to play" block on the right of a SubRow, chosen by the global
// instrument (§2.3):
//   guitar → up to 3 ChordDiagram thumbs (the 3×3), each captioned with its shape
//            name so the three read as genuinely different grips. Fewer than 3
//            shapes exist (e.g. add9 → 2 for most roots) → show what exists, never
//            pad with fakes (honest, §2.4). None → nothing (chip + why carry it).
//   piano  → ONE MiniPiano; rootPc spread back in so the "R" badge lands right.
//   bass   → root · {note} caption (no honest compact bass-chord renderer).
function WaysToPlay({ sub, instrument }) {
  if (instrument === 'piano') {
    return (
      <div className="flex items-center">
        <MiniPiano
          voicing={{ ...pianoVoicing({ rootPc: sub.rootPc, quality: sub.quality }), rootPc: sub.rootPc }}
          size="mini"
        />
      </div>
    )
  }

  if (instrument === 'bass') {
    return (
      <span className="text-[10px] text-gray-500">
        root · {NOTES[((sub.rootPc % 12) + 12) % 12]}
      </span>
    )
  }

  // guitar (default): up to 3 genuinely different grips, left-aligned. Omit the
  // ChordDiagram label (the chip names the chord) — caption the shape name below.
  const shapes = getGuitarVoicings(sub.label).slice(0, 3)
  if (!shapes.length) return null
  return (
    <div className="flex gap-2">
      {shapes.map((shape, i) => (
        <div key={`${shape.label}-${i}`} className="flex flex-col items-center gap-0.5">
          <ChordDiagram shape={shape} rootPc={sub.rootPc} size="thumb" />
          <span className="max-w-[75px] truncate text-center text-[9px] leading-none text-gray-500">
            {shape.label}
          </span>
        </div>
      ))}
    </div>
  )
}

// One substitution ROW — left identity (chip → modal + tag + why) | right ways.
function SubRow({ sub, instrument, onChordClick }) {
  const isCircle = CIRCLE_CATEGORIES.has(sub.category)
  const tag = CATEGORY_TAG[sub.category] ?? sub.category
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border border-border bg-border/30 p-2 ${ROW_MIN_H[instrument] ?? ROW_MIN_H.guitar}`}
    >
      {/* Left identity block (~180px) */}
      <div className="flex w-[180px] shrink-0 flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onChordClick?.(sub.label)}
            aria-label={`${sub.label} — ${sub.why}`}
            className="shrink-0 rounded-lg border border-border bg-border px-2 py-1 text-sm font-bold leading-none text-gray-100 outline-none transition-all cursor-pointer hover:border-accent/50 hover:text-accent focus-visible:ring-2 focus-visible:ring-accent"
          >
            {sub.label}
          </button>
          <span className="text-[9px] uppercase tracking-wide text-gray-500">
            {tag}
            {isCircle && <span className="ml-0.5 text-accent" aria-hidden="true">↻</span>}
          </span>
        </div>
        <p className="line-clamp-2 text-[11px] leading-snug text-gray-400">
          {sub.why}
        </p>
      </div>

      {/* Right "ways to play" block */}
      <div className="min-w-0 flex-1">
        <WaysToPlay sub={sub} instrument={instrument} />
      </div>
    </div>
  )
}

// A reserved-but-empty slot — holds the exact SubRow height so the present subs
// never move when the chord yields fewer than 3 (§2.2, the anti-jump).
function EmptySlot({ instrument }) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center rounded-lg border border-dashed border-border/50 bg-transparent ${ROW_MIN_H[instrument] ?? ROW_MIN_H.guitar}`}
    >
      <span className="text-[11px] text-gray-600">—</span>
    </div>
  )
}

export default function TryThis({ loop, keyInfo, currentChord, onChordClick, instrument = 'guitar' }) {
  const loopArr = Array.isArray(loop) && loop.length ? loop : null
  const subject = pickSubject(loopArr, keyInfo, currentChord)

  // No subject (no loop + no valid live chord) or 0 subs → no card.
  if (!subject) return null

  const subjectChord = subject.name
  const subs = subject.subs.slice(0, 3) // cap at 3 (§2.1)

  return (
    <section
      className="rounded-2xl border border-border bg-panel p-3"
      aria-label={`Try this instead of ${subjectChord}`}
    >
      <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
        Try this instead of {subjectChord}
        {keyInfo?.root ? ` · in ${keyInfo.root} ${keyInfo.mode ?? 'major'}` : ''}
      </h4>

      {/* Fixed 3-slot frame — a present sub → SubRow, an absent one → EmptySlot,
          so sub #1/#2 hold their position whether there are 2 or 3 subs. */}
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map(i =>
          subs[i]
            ? <SubRow key={`${subs[i].label}-${i}`} sub={subs[i]} instrument={instrument} onChordClick={onChordClick} />
            : <EmptySlot key={`empty-${i}`} instrument={instrument} />
        )}
      </div>
    </section>
  )
}
