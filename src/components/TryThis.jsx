import { useEffect, useRef, useState } from 'react'
import { CHORD_TYPES, suggestSubstitutions } from '../lib/theory'
import { chordRootPC } from '../lib/match'

// ─── TryThis — the rotating "Try this" substitution nudge (task L-74) ─────────
//
// For the chord under the playhead, in the detected key, show ONE curated
// substitution at a time (from theory.js `suggestSubstitutions`, the L-73 engine)
// and CYCLE to the next valid idea each time the loop completes a pass. The user
// asked for something "more surprising, more jam-like, keeps offering new ideas"
// (2026-07-13) — so a single nudge that rotates, not a static 4-chip grid.
// Spec: docs/design/try-this-subs.md §4/§5 (superseded to rotation by L-74's
// ledger row). Sibling of RelatedProgressions; same micro-header + chip idiom.
//
// Props:
//   loop         : string[] | null — the detected repeating progression (chord names)
//   keyInfo      : { root, mode, confidence } | null — effective key (frames the why)
//   currentChord : string — the chord sounding NOW ("F", "Dm7")
//   onChordClick : fn(label) — opens ChordDetailModal (App's setSelectedChord)

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

// A loop pass completes when the playhead position wraps from a later station
// back toward 0 — i.e. the new position is lower than the previous one. On that
// wrap, advance the rotation by one idea. Pure + exported so the rotation can be
// proven independently of React effect timing.
export function advanceOnWrap(cycle, prevPos, pos) {
  if (pos >= 0 && prevPos != null && pos < prevPos) return cycle + 1
  return cycle
}

// Pick the sub shown for a given monotonic cycle counter (softest-first order
// preserved; modulo keeps it in range as the chord — and its sub set — changes).
export function pickSub(subs, cycle) {
  if (!subs || !subs.length) return null
  const total = subs.length
  const idx = ((cycle % total) + total) % total
  return { sub: subs[idx], idx, total }
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

export default function TryThis({ loop, keyInfo, currentChord, onChordClick }) {
  const [cycle, setCycle] = useState(0)
  const lastPosRef = useRef(null)
  const lastChordRef = useRef(null)

  const target = parseChordName(currentChord)
  const loopArr = Array.isArray(loop) && loop.length ? loop : null
  const position = loopArr && target ? loopArr.indexOf(currentChord) : -1

  // Next station's root pc → gates Rule D (secondary dominant of the next chord).
  let nextRootPc
  if (loopArr && position >= 0) {
    const pc = chordRootPC(loopArr[(position + 1) % loopArr.length])
    if (pc >= 0) nextRootPc = pc
  }

  const subs = target ? suggestSubstitutions(target, keyInfo, { nextRootPc }) : []

  // Rotation: advance one idea each loop pass (playhead position wraps toward 0).
  // With no loop (position −1), advance on each genuine currentChord change so
  // the nudge still refreshes as the player moves. Detection watches the previous
  // position/chord across renders via refs (no side effects during render).
  useEffect(() => {
    const prevPos = lastPosRef.current
    const prevChord = lastChordRef.current
    lastPosRef.current = position
    lastChordRef.current = currentChord
    if (position >= 0) {
      setCycle(c => advanceOnWrap(c, prevPos, position))
    } else if (prevChord != null && prevChord !== currentChord) {
      setCycle(c => c + 1)
    }
  }, [position, currentChord])

  // 0 subs → no card (no key, atonal, or a chord with no honest sub).
  const picked = pickSub(subs, cycle)
  if (!picked) return null

  const { sub, idx, total } = picked
  const showIndicator = total > 1
  const isCircle = CIRCLE_CATEGORIES.has(sub.category)
  const tag = CATEGORY_TAG[sub.category] ?? sub.category

  return (
    <section
      className="rounded-2xl border border-border bg-panel p-3"
      aria-label={`Try this instead of ${currentChord}`}
    >
      <h4 className="mb-2 flex items-baseline justify-between gap-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
        <span>
          Try this instead of {currentChord}
          {keyInfo?.root ? ` · in ${keyInfo.root} ${keyInfo.mode ?? 'major'}` : ''}
        </span>
        {showIndicator && (
          <span className="shrink-0 normal-case tracking-normal text-gray-500">
            {idx + 1} of {total}
          </span>
        )}
      </h4>

      <div className="flex items-baseline gap-2">
        <button
          type="button"
          onClick={() => onChordClick?.(sub.label)}
          aria-label={`${sub.label} — ${sub.why}`}
          className="shrink-0 rounded-lg border border-border bg-border px-2 py-1 text-sm font-bold leading-none text-gray-100 outline-none transition-all cursor-pointer hover:border-accent/50 hover:text-accent focus-visible:ring-2 focus-visible:ring-accent"
        >
          {sub.label}
        </button>
        <p className="min-w-0 text-[11px] leading-snug text-gray-400">
          <span className="mr-1 align-baseline text-[9px] uppercase tracking-wide text-gray-500">
            {tag}
            {isCircle && <span className="ml-0.5 text-accent" aria-hidden="true">↻</span>}
          </span>
          {sub.why}
        </p>
      </div>

      {showIndicator && (
        <div className="mt-2 flex items-center gap-1" aria-hidden="true">
          {subs.map((_, i) => (
            <span
              key={i}
              className={`h-1 w-1 rounded-full ${i === idx ? 'bg-accent' : 'bg-border'}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
