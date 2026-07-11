import { useMemo } from 'react'
import kb from '../data/kb/index.js'
import { NOTES, CHORD_TYPES } from '../lib/theory'
import {
  buildLoopIndex,
  matchLoopToProgression,
  loopToDegrees,
  canonicalDegrees,
  chordRootPC,
} from '../lib/match'

// ─── RelatedProgressions — loop-relative songbook relatives (task L-51) ───────
//
// 3–5 KB progressions genuinely related to the DETECTED loop, replacing the
// retired generic ProgressionSuggestions table. KB-sourced only, loop-relative
// by construction. Spec: docs/design/one-screen.md §5 (ranking + render + empty
// states) and §6 (component boundary: pure/prop-driven, computes its own match
// so it stays file-disjoint from D-51's rail work).
//
// Props:
//   loop         : string[] | null — the detected repeating progression (chord names)
//   keyInfo      : { root, mode, confidence } | null — effective key (realizes chips)
//   onChordClick : fn(chordName) — opens ChordDetailModal (App's setSelectedChord)
//
// The ranking (rankRelatedProgressions) is exported for smoke coverage.

// Suffix → KB quality token, derived from CHORD_TYPES (the vocabulary
// authority — same inverse mapping as match.js's private suffixToQuality; all
// 14 suffixes are unique). Unknown suffixes stay unmapped → wildcard (§5:
// match on Δ alone).
const SUFFIX_TO_QUALITY = Object.fromEntries(
  Object.entries(CHORD_TYPES).map(([quality, def]) => [def.suffix, quality])
)

// §5 scoring constants.
const SCORE_SAME_CHANGES = 100 // same canonical degree shape
const SCORE_SAME_STYLE = 40 // same style as the matched progression
const SCORE_PER_TRANSITION = 12 // per shared (Δ, quality→quality) transition…
const TRANSITION_CAP = 36 // …capped (= 3 distinct transitions)
const SCORE_JACCARD = 16 // × rebased degree-set Jaccard
export const RELATED_SCORE_FLOOR = 24
export const RELATED_MAX_ENTRIES = 5

// The module-level index (§6: "matchLoopToProgression over a module-level
// index is trivially cheap") — built once, shared across renders.
const DEFAULT_INDEX = buildLoopIndex(kb)

// ─── The MANDATORY collapse step (§5 step 2) ──────────────────────────────────
// The live detected loop is a COLLAPSED form (detection never commits the same
// chord twice in a row), while KB `degrees` are raw, bar-per-bar — blues-12bar
// is [0,0,0,0,5,5,0,0,7,5,0,7]. Compared raw, the +100 same-shape term would
// never fire for collapse-affected KB progressions. So before
// canonicalDegrees(p.degrees) AND before building T(p): collapse consecutive
// equal (degree, quality) pairs — including the wrap-around pair (last === first
// as a cycle). Each surviving unit keeps the rn of its first bar for the
// "shares {rn}→{rn}" annotation.
// (L-60 will land a shared collapsed-form index in match.js; this local
// collapse is deliberately component-scoped until then — one-screen.md §9.)
export function collapseChanges(progression) {
  const degrees = Array.isArray(progression?.degrees) ? progression.degrees : []
  const qualities = Array.isArray(progression?.qualities) ? progression.qualities : []
  const rn = Array.isArray(progression?.rn) ? progression.rn : []
  const out = []
  for (let i = 0; i < degrees.length; i++) {
    const q = qualities[i] ?? null
    const prev = out[out.length - 1]
    if (prev && prev.deg === degrees[i] && prev.quality === q) continue
    out.push({ deg: degrees[i], quality: q, rn: rn[i] ?? '' })
  }
  if (out.length > 1) {
    const first = out[0]
    const last = out[out.length - 1]
    if (first.deg === last.deg && first.quality === last.quality) out.pop()
  }
  return out
}

// Transition set over units [{deg, quality, rn?}], wrap-around included (§5):
// triples (Δ = (deg[i+1] − deg[i]) mod 12, q[i], q[i+1]); rn labels ride along
// for the annotation.
function transitionsOf(units) {
  const n = units.length
  if (n < 2) return []
  const out = []
  for (let i = 0; i < n; i++) {
    const a = units[i]
    const b = units[(i + 1) % n]
    out.push({
      d: (((b.deg - a.deg) % 12) + 12) % 12,
      qa: a.quality,
      qb: b.quality,
      rnFrom: a.rn ?? '',
      rnTo: b.rn ?? '',
    })
  }
  return out
}

// Live-loop units: degree from loopToDegrees, quality from the chord-name
// suffix (unmappable → null = wildcard, matches on Δ alone).
function loopUnitsOf(loop, loopDeg) {
  return loop.map((name, i) => {
    const m = typeof name === 'string' ? name.match(/^[A-G][b#]?(.*)$/) : null
    const suffix = m ? m[1] : null
    return { deg: loopDeg[i], quality: suffix != null ? SUFFIX_TO_QUALITY[suffix] ?? null : null }
  })
}

// Distinct triples of T(p) matched by some loop transition (wildcard-aware),
// in p's canonical order — shared[0] names the annotation.
function sharedTransitions(loopT, pT) {
  const seen = new Set()
  const shared = []
  for (const t of pT) {
    const key = `${t.d}|${t.qa}|${t.qb}`
    if (seen.has(key)) continue
    seen.add(key)
    const hit = loopT.some(
      l =>
        l.d === t.d &&
        (l.qa == null || t.qa == null || l.qa === t.qa) &&
        (l.qb == null || t.qb == null || l.qb === t.qb)
    )
    if (hit) shared.push(t)
  }
  return shared
}

// Rebased degree-set Jaccard over the canonical rotations (both sides rebased
// so their canonical first element is 0 — rotation-invariant by construction).
function degreeSetJaccard(aCanon, bCanon) {
  const a = new Set(aCanon.split(','))
  const b = new Set(bCanon.split(','))
  let inter = 0
  for (const x of a) if (b.has(x)) inter++
  const union = a.size + b.size - inter
  return union ? inter / union : 0
}

/**
 * rankRelatedProgressions(loop, kbRegistry?) → { match, entries } | null
 *
 * The §5 ranking. Returns null when the loop yields no degrees (no loop /
 * unparseable chord names) — the caller renders the idle state. `entries` is
 * score-desc (stable by style, id), floored at RELATED_SCORE_FLOOR, at most
 * RELATED_MAX_ENTRIES, never padded. Exported for smoke coverage.
 */
export function rankRelatedProgressions(loop, kbRegistry = kb) {
  const loopDeg = loopToDegrees(loop)
  if (!loopDeg || !loopDeg.length) return null
  const loopCanon = canonicalDegrees(loopDeg)
  const index = kbRegistry === kb ? DEFAULT_INDEX : buildLoopIndex(kbRegistry)
  const match = matchLoopToProgression(loop, index)
  const loopT = transitionsOf(loopUnitsOf(loop, loopDeg))

  const entries = []
  for (const style of Object.keys(kbRegistry)) {
    const styleLabel = kbRegistry[style]?.meta?.label ?? style
    const progs = kbRegistry[style]?.progressions
    if (!Array.isArray(progs)) continue
    for (const prog of progs) {
      if (!Array.isArray(prog.degrees) || !prog.degrees.length) continue
      if (match.matched && prog.id === match.id) continue // §5: every p ≠ the matched one
      const collapsed = collapseChanges(prog)
      if (!collapsed.length) continue
      const pCanon = canonicalDegrees(collapsed.map(u => u.deg))
      const shared = sharedTransitions(loopT, transitionsOf(collapsed))
      const sameChanges = pCanon === loopCanon
      const sameStyle = match.matched && style === match.style

      let score = 0
      if (sameChanges) score += SCORE_SAME_CHANGES
      if (sameStyle) score += SCORE_SAME_STYLE
      score += Math.min(shared.length * SCORE_PER_TRANSITION, TRANSITION_CAP)
      score += degreeSetJaccard(loopCanon, pCanon) * SCORE_JACCARD
      score -= Math.abs(loop.length - collapsed.length)
      if (score < RELATED_SCORE_FLOOR) continue // never pad with junk

      // §5 annotation: why this entry is here (survivors always have one —
      // below the floor nothing scores on Jaccard − length alone).
      const annotation = sameChanges
        ? 'same changes'
        : shared.length
          ? `shares ${shared[0].rnFrom || '?'}→${shared[0].rnTo || '?'}`
          : 'same style'

      entries.push({
        style,
        styleLabel,
        id: prog.id,
        name: prog.name,
        level: prog.level === 'intermediate' ? 'intermediate' : 'foundation', // untagged counts foundation
        score,
        annotation,
        progression: prog,
      })
    }
  }

  entries.sort(
    (a, b) => b.score - a.score || a.style.localeCompare(b.style) || a.id.localeCompare(b.id)
  )
  return { match, entries: entries.slice(0, RELATED_MAX_ENTRIES) }
}

// ─── Presentational bits ──────────────────────────────────────────────────────

// Level chip — ExplorePanel's LevelBadge language (amber = the existing
// secondary-tone token; foundation stays quiet; untagged counts foundation).
function LevelBadge({ level }) {
  if (level === 'intermediate') {
    return (
      <span className="shrink-0 text-[9px] uppercase tracking-wide font-semibold text-amber border border-amber/40 rounded px-1.5 py-px">
        intermediate
      </span>
    )
  }
  return (
    <span className="shrink-0 text-[9px] uppercase tracking-wide font-semibold text-gray-400 border border-border rounded px-1.5 py-px">
      foundation
    </span>
  )
}

// The chord chain realized in the current key — the raw (bar-per-bar) KB form,
// truncated to the first 8 + "…" (§5); each chip taps through to
// ChordDetailModal via onChordClick (the banner-chip pattern, smaller).
const CHAIN_SHOWN = 8

function ChordChain({ progression, keyRoot, onChordClick }) {
  const degrees = progression.degrees ?? []
  const qualities = progression.qualities ?? []
  const rn = progression.rn ?? []
  const shown = degrees.slice(0, CHAIN_SHOWN)
  return (
    <div className="mt-1 flex items-end gap-1 flex-wrap">
      {shown.map((deg, i) => {
        const rootPc = (((keyRoot + deg) % 12) + 12) % 12
        const label = `${NOTES[rootPc]}${CHORD_TYPES[qualities[i]]?.suffix ?? ''}`
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChordClick?.(label)}
            aria-label={`${label} — open chord detail`}
            className="flex flex-col items-center px-1.5 py-0.5 rounded-lg border border-border bg-border hover:border-gray-500 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span className="text-xs font-bold leading-none text-gray-300">{label}</span>
            <span className="text-[10px] text-gray-500">{rn[i] ?? ''}</span>
          </button>
        )
      })}
      {degrees.length > CHAIN_SHOWN && <span className="self-center text-xs text-gray-500">…</span>}
    </div>
  )
}

export default function RelatedProgressions({ loop, keyInfo, onChordClick }) {
  const loopKey = Array.isArray(loop) ? loop.join(',') : ''
  const ranked = useMemo(
    () => (loopKey ? rankRelatedProgressions(loop) : null),
    [loopKey] // eslint-disable-line react-hooks/exhaustive-deps
  )

  // keyInfo.root is a note NAME; chips want a pitch class. Default to C (0)
  // until a key is known, same fallback JamGuide's stations use.
  const keyRoot = useMemo(() => {
    const pc = chordRootPC(keyInfo?.root)
    return pc >= 0 ? pc : 0
  }, [keyInfo?.root])

  // Idle — no loop (or unparseable chord names, which rank as no loop).
  if (!ranked) {
    return (
      <section
        className="rounded-2xl border border-dashed border-border p-3"
        aria-label="Related progressions"
      >
        <p className="text-sm text-gray-500">
          Loop a progression — related changes from the songbook land here.
        </p>
      </section>
    )
  }

  return (
    <section
      className="rounded-2xl border border-border bg-panel p-3"
      aria-label="Related progressions"
    >
      <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
        Related progressions · from the songbook
        {keyInfo?.root ? ` · in ${keyInfo.root}` : ''}
      </h4>
      {ranked.entries.length === 0 ? (
        // Loop, but nothing clears the floor — honest, never padded (§5).
        <p className="text-sm text-gray-500">
          Nothing in the songbook genuinely relates to this loop yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {ranked.entries.map(entry => (
            <li key={`${entry.style}-${entry.id}`} className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                <span className="text-sm font-semibold text-gray-100">{entry.name}</span>
                <span className="text-xs text-gray-500">{entry.styleLabel}</span>
                <LevelBadge level={entry.level} />
                <span className="text-[10px] text-gray-500">{entry.annotation}</span>
              </div>
              <ChordChain
                progression={entry.progression}
                keyRoot={keyRoot}
                onChordClick={onChordClick}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
