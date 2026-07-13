import { CHORD_TYPES, NOTES, suggestSubstitutions } from '../lib/theory'
import { chordRootPC } from '../lib/match'
import { getGuitarVoicings } from '../lib/voicings'
import { pianoVoicing } from '../lib/piano'
import ChordDiagram from './ChordDiagram'
import MiniPiano from './MiniPiano'

// ─── TryThis — side-by-side substitution cards, each with a mini diagram (L-75) ─
//
// For the chord under the playhead, in the detected key, show ALL curated
// substitutions (from theory.js `suggestSubstitutions`, the L-73 engine) SIDE BY
// SIDE — one card per idea — each carrying a mini instrument diagram of that
// chord (guitar ChordDiagram / piano MiniPiano / bass root caption), following
// the global instrument. Reverses L-74's rotating one-at-a-time card: the user
// saw the rotation and asked for all-visible ("put them next to each other, we
// have enough space"). Spec: docs/design/related-area-layout.md §1–3.
// Sibling of RelatedProgressions; same micro-header + chip idiom.
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

// The mini diagram drawn inside a SubCard, chosen by the global instrument (§2):
//   guitar → first resolved guitar shape (absolute frets) via ChordDiagram thumb;
//            no shape available → no diagram (honest, chip + why only).
//   piano  → pianoVoicing for the chord, rootPc spread back in so the "R" badge
//            lands correctly (VoicingBrowser:317-319 caveat), MiniPiano size mini.
//   bass   → no diagram (no honest compact bass-chord renderer); a small
//            root · {note} caption instead.
function SubDiagram({ sub, instrument }) {
  if (instrument === 'piano') {
    return (
      <MiniPiano
        voicing={{ ...pianoVoicing({ rootPc: sub.rootPc, quality: sub.quality }), rootPc: sub.rootPc }}
        size="mini"
      />
    )
  }
  if (instrument === 'bass') {
    return (
      <span className="text-[10px] text-gray-500">
        root · {NOTES[((sub.rootPc % 12) + 12) % 12]}
      </span>
    )
  }
  // guitar (default): first resolved shape; omit the label — the chip names it.
  const shape = getGuitarVoicings(sub.label)[0]
  if (!shape) return null
  return <ChordDiagram shape={shape} rootPc={sub.rootPc} size="thumb" />
}

// One substitution card — chip (tappable → modal) + mini diagram + tag + why.
function SubCard({ sub, instrument, onChordClick }) {
  const isCircle = CIRCLE_CATEGORIES.has(sub.category)
  const tag = CATEGORY_TAG[sub.category] ?? sub.category
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5 rounded-lg border border-border bg-border/30 p-2">
      <button
        type="button"
        onClick={() => onChordClick?.(sub.label)}
        aria-label={`${sub.label} — ${sub.why}`}
        className="shrink-0 rounded-lg border border-border bg-border px-2 py-1 text-sm font-bold leading-none text-gray-100 outline-none transition-all cursor-pointer hover:border-accent/50 hover:text-accent focus-visible:ring-2 focus-visible:ring-accent"
      >
        {sub.label}
      </button>

      <div className="flex min-h-[38px] items-center justify-center">
        <SubDiagram sub={sub} instrument={instrument} />
      </div>

      <span className="text-[9px] uppercase tracking-wide text-gray-500">
        {tag}
        {isCircle && <span className="ml-0.5 text-accent" aria-hidden="true">↻</span>}
      </span>

      <p className="line-clamp-3 text-center text-[11px] leading-snug text-gray-400">
        {sub.why}
      </p>
    </div>
  )
}

export default function TryThis({ loop, keyInfo, currentChord, onChordClick, instrument = 'guitar' }) {
  const loopArr = Array.isArray(loop) && loop.length ? loop : null
  const subject = pickSubject(loopArr, keyInfo, currentChord)

  // No subject (no loop + no valid live chord) or 0 subs → no card.
  if (!subject) return null

  const subjectChord = subject.name
  const subs = subject.subs

  // Piano keyboards are up to ~199px wide (C-anchored window), so 4 cannot share a
  // 720px row — lay them out 2×2. Guitar (75px cell) and bass (no diagram) sit
  // 4-across in one flex-wrap row; with 1–3 subs the cards grow to fill (§1.1/§3).
  const isPiano = instrument === 'piano'
  const listClass = isPiano
    ? 'grid grid-cols-1 sm:grid-cols-2 gap-2'
    : 'flex flex-wrap gap-2'
  const cardBasis = isPiano ? '' : 'basis-[168px] grow min-w-[152px]'

  return (
    <section
      className="rounded-2xl border border-border bg-panel p-3"
      aria-label={`Try this instead of ${subjectChord}`}
    >
      <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
        Try this instead of {subjectChord}
        {keyInfo?.root ? ` · in ${keyInfo.root} ${keyInfo.mode ?? 'major'}` : ''}
      </h4>

      <div className={listClass}>
        {subs.map((sub, i) => (
          <div key={`${sub.label}-${i}`} className={cardBasis}>
            <SubCard sub={sub} instrument={instrument} onChordClick={onChordClick} />
          </div>
        ))}
      </div>
    </section>
  )
}
