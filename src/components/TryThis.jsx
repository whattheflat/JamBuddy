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
//       whether or not it's a loop station; unchanged behaviour);
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

export default function TryThis({ loop, keyInfo, currentChord, onChordClick }) {
  const [cycle, setCycle] = useState(0)
  const lastPosRef = useRef(null)
  const lastNameRef = useRef(null)

  const loopArr = Array.isArray(loop) && loop.length ? loop : null
  const subject = pickSubject(loopArr, keyInfo, currentChord)

  // Position/name that DRIVE rotation. When following a live loop chord this is its
  // playhead index (wrap → advance). When following a live chord not in the loop it
  // is −1 (advance on chord change). In the (b) fallback the subject is a fixed loop
  // station with no playhead — pos is stable and name is stable, so the effect fires
  // once and the shown idea holds steady (visible, no flicker).
  const rotationPos = subject ? subject.pos : -1
  const subjectName = subject ? subject.name : null

  // Rotation: advance one idea each loop pass (playhead position wraps toward 0).
  // With no loop position (−1), advance on each genuine subject-chord change so the
  // nudge refreshes as the player moves. Refs carry the previous pos/name across
  // renders (no side effects during render). Runs unconditionally (before returns).
  useEffect(() => {
    const prevPos = lastPosRef.current
    const prevName = lastNameRef.current
    lastPosRef.current = rotationPos
    lastNameRef.current = subjectName
    if (subjectName == null) return
    if (rotationPos >= 0) {
      setCycle(c => advanceOnWrap(c, prevPos, rotationPos))
    } else if (prevName != null && prevName !== subjectName) {
      setCycle(c => c + 1)
    }
  }, [rotationPos, subjectName])

  // No subject (no loop + no valid live chord) or 0 subs → no card.
  if (!subject) return null
  const picked = pickSub(subject.subs, cycle)
  if (!picked) return null

  const subs = subject.subs
  const subjectChord = subject.name

  const { sub, idx, total } = picked
  const showIndicator = total > 1
  const isCircle = CIRCLE_CATEGORIES.has(sub.category)
  const tag = CATEGORY_TAG[sub.category] ?? sub.category

  return (
    <section
      className="rounded-2xl border border-border bg-panel p-3"
      aria-label={`Try this instead of ${subjectChord}`}
    >
      <h4 className="mb-2 flex items-baseline justify-between gap-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
        <span>
          Try this instead of {subjectChord}
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
