// GlanceRail — ALL loop stations expanded, always (task D-41, per
// docs/design/integrated-glance.md §4; supersedes the L-33 playhead accordion).
//
// D-51 (docs/design/one-screen.md §4/§6.2) adapts the rail to the dashboard's
// 500px right column. Margin-hardening arithmetic, worst case = a classic
// Windows scrollbar (~17px) inside the column's overflow-y-auto wrapper:
//   row interior = 500 − 17 (scrollbar) − 18 (section border + p-2)
//                − 14 (row border + p-1.5) = 451px
//   guitar cell 89 (75 SVG + p-1.5 + border) → 4/line (374 ≤ 451; a 5th = 469 ✗)
//   piano 1-octave 156.4 / 2-octave 279.6 → the mixed pair 279.6+6+156.4 = 442
//   fits with ~9px margin even under the scrollbar (26px without) — the fit the
//   doc calls fragile at the old paddings is now robust. Without the scrollbar
//   the interior is 468px; every count above is unchanged.
//
// One VERTICAL ROW per loop station, canonical KB order (the same order the
// banner's loop shows after rotation). Every row renders its full voicing
// gallery PERMANENTLY — the playhead HIGHLIGHTS the active row (accent ring +
// "now" badge + aria-current) and never hides, collapses, or reveals content.
// User directive 2026-07-10: "i'd like to see all the chords and their
// voicings … so you can follow and potentially learn new ways to play it while
// you are playing the loop. scrolling is easier then clicking."
//
// Row anatomy (D-40 §4):
//   header  — chord label + rn (the focus toggle) · "now" badge / "next" tag ·
//             solo-scale label · aim dots (3rd filled accent, 7th hollow —
//             RoadmapTrack's GuideDot language, honest "5th" fallback kept) ·
//             transition chip ("next F→E · ½ step down"; the last row wraps:
//             "loop"). This is where the retired RoadmapTrack's education
//             folds in (D-40 §2) — theory.js `guideTones` / `voiceLeadingPairs`
//             / `soloScale`, read-only imports.
//   gallery — the full VoicingBrowser (show={instrument}, dense) with the
//             station's OWN voicing passed as `recommended` so it renders as the
//             badged, accent-bordered first cell INSIDE the browser (no separate
//             own-cell, no dupe — dashboard-polish.md §1.1/§2.1). Guitar caps at
//             4 recommended-first shapes on one line (§1); piano is a 2×2 of
//             `size="mini"` keyboards (§2). No ▶ anywhere (§3).
//
// Focus semantics (D-40 §4 — the pin, simplified): with everything always
// expanded there is nothing left to hold open, so tapping a row header TOGGLES
// that station as focused. The PARENT owns the state and the onFocusChord
// emission (the D-03 fretboard guide-tone contract, byte-compatible); a focused
// row shows an "aim on fretboard" chip; tap again (or the loop changes) to
// clear. This component never emits focus-chord itself and never triggers audio
// — the ▶ previews were removed everywhere (dashboard-polish.md §3).
//
// NO auto-scroll (D-40 §4/§6.2 step 1): the band lives in page flow, where
// scrollIntoView's nearest scroller is the DOCUMENT — it would yank the whole
// page mid-jam. The L-33 auto-centre effect was deleted in L-40 and must never
// return; the highlight travels, the user owns the scrollbar.
//
// Pure presentational. Props:
//   stations     — [{ shape, voicing, rootPc, quality, label, rn }] canonical order
//   activeIndex  — playhead station (canonicalPos); -1 = loop known, playhead
//                  not — no row is marked "now" (content never changes either way)
//   focusedIndex — the focused station index, or null (nothing focused)
//   onFocus      — fn(index|null): toggle a station's focus
//   instrument   — 'guitar' | 'piano' (VoicingBrowser `show`; bass never mounts
//                  this rail — JamGuide renders BassGuideRows instead, D-40 §3)
//   keyRoot      — key tonic pitch class 0–11 (ChordDiagram fret placement)
//   keyMode      — key mode name (soloScale's minor-key dominant nudge)

import { NOTES, guideTones, voiceLeadingPairs, soloScale } from '../lib/theory'
import VoicingBrowser from './VoicingBrowser'

const pcName = (pc) => NOTES[((pc % 12) + 12) % 12]

// ─── Header atoms (exported — BassGuideRows in JamGuide.jsx composes the same
//     anatomy for visual parity across instruments, D-40 §3) ──────────────────

// Solo-scale label: "solo · G mixolydian" (theory.js snake_case → spaces).
export function SoloLabel({ rootPc, quality, keyMode }) {
  const { name } = soloScale(quality, keyMode)
  return (
    <span className="text-xs leading-none text-gray-400">
      <span className="text-[9px] uppercase tracking-widest text-gray-500">solo · </span>
      {pcName(rootPc)} {name.replace(/_/g, ' ')}
    </span>
  )
}

// One guide-tone dot: note name in a small circle + its honest kind label.
// Filled accent = the 3rd; hollow = the 7th (or the "5th" fallback — never
// badge a 5th as a 7th). Filled text is BLACK on accent (#a855f7 vs black
// ≈5.3:1 — AA; white would be ~4.0), matching VoicingBrowser's ▶ hover.
function GuideDot({ pc, kind, filled }) {
  return (
    <span className="flex items-center gap-1">
      <span
        className={
          'flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold leading-none ' +
          (filled ? 'bg-accent text-black' : 'border-2 border-accent text-purple-300')
        }
      >
        {pcName(pc)}
      </span>
      <span className="text-[9px] font-medium uppercase tracking-wide text-gray-400">{kind}</span>
    </span>
  )
}

// The "aim" pair — the RoadmapTrack TARGET lane, folded to one header line.
export function AimDots({ rootPc, quality }) {
  const g = guideTones(rootPc, quality)
  const seventhKind = g.hasSeventh ? '7th' : '5th'
  return (
    <span className="flex items-center gap-2">
      <span className="text-[9px] uppercase tracking-widest text-gray-500">aim</span>
      <GuideDot pc={g.third} kind="3rd" filled />
      <GuideDot pc={g.seventh} kind={seventhKind} filled={false} />
    </span>
  )
}

// The voice-leading rail, folded to a compact chip: "next F→E · ½ step down";
// a held common tone reads "B holds · common tone"; the last row's chip is the
// wrap-around and says "loop" (D-40 §2). No smooth rail (≤2 semitones) → the
// caller passes null and no chip renders.
function TransitionChip({ pair, wraps }) {
  if (!pair) return null
  const held = pair.semitones === 0
  const label = held ? `${pcName(pair.from)} holds` : `${pcName(pair.from)}→${pcName(pair.to)}`
  const motion = held
    ? 'common tone'
    : `${Math.abs(pair.semitones) === 1 ? '½' : Math.abs(pair.semitones)} step ${pair.semitones < 0 ? 'down' : 'up'}`
  return (
    <span className="flex items-center gap-1 rounded border border-border bg-surface px-1.5 py-1 text-[10px] leading-none">
      <span className="font-medium uppercase tracking-wide text-gray-500">{wraps ? 'loop' : 'next'}</span>
      <span className="font-semibold text-accent">{label}</span>
      <span className="text-gray-400">· {motion}</span>
    </span>
  )
}

// ─── One always-expanded station row ─────────────────────────────────────────

function StationRow({
  st, isNow, isNext, isFocused, onToggleFocus, instrument, keyRoot, keyMode, rail, wraps,
}) {
  // The station's own voicing — passed to VoicingBrowser as `recommended` so it
  // renders as the badged, accent-bordered first cell inside the gallery (guitar:
  // a shape; piano: a voicing matched by style). The separate own-cell is gone
  // (dashboard-polish.md §1.1/§2.1 — it centralises the ≤4 rule and kills the old
  // recommended/gallery duplicate).
  const recommended = instrument === 'guitar' ? (st.shape ?? null) : (st.voicing ?? null)

  // Active row: unmistakable (accent ring + tint). Focused-but-not-now rows get
  // the softer accent border; everything else recedes to the 0.85 opacity floor
  // (never below AA legibility).
  const stateClass = isNow
    ? 'border-accent bg-accent/10 ring-2 ring-accent'
    : isFocused
      ? 'border-accent/60 bg-accent/5'
      : 'border-border bg-surface'

  return (
    <div
      role="listitem"
      aria-current={isNow ? 'true' : undefined}
      aria-label={
        `${st.label}${st.rn ? ` (${st.rn})` : ''} — every ${instrument} voicing` +
        `${isNow ? ', now playing' : ''}${isNext ? ', up next' : ''}`
      }
      className={`rounded-lg border p-1.5 ${stateClass}`}
      style={{ opacity: isNow || isFocused ? 1 : 0.85 }}
    >
      {/* ── Header line: identity + the folded roadmap education ── */}
      <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <button
          type="button"
          aria-pressed={isFocused}
          onClick={onToggleFocus}
          title={isFocused
            ? `Unfocus ${st.label} — clear its guide tones from the fretboard`
            : `Focus ${st.label} — light its guide tones on the fretboard`}
          className="flex min-h-[32px] items-center gap-2 rounded px-1 outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="text-sm font-bold leading-none text-gray-100">{st.label}</span>
          {st.rn && (
            <span className="text-[9px] font-medium uppercase tracking-wide text-gray-400">
              {st.rn}
            </span>
          )}
        </button>
        {isNow && (
          <span className="text-[9px] font-semibold uppercase tracking-widest text-accent">
            now
          </span>
        )}
        {isNext && (
          <span className="rounded border border-accent/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-accent">
            next
          </span>
        )}
        {isFocused && (
          <span className="rounded border border-accent bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-accent">
            aim on fretboard
          </span>
        )}
        <SoloLabel rootPc={st.rootPc} quality={st.quality} keyMode={keyMode} />
        <AimDots rootPc={st.rootPc} quality={st.quality} />
        <TransitionChip pair={rail} wraps={wraps} />
      </div>

      {/* ── Gallery (dashboard-polish.md §1/§2): the recommended voicing is now
             cell #1 INSIDE the browser (badged "play", accent border — "the
             answer" prominence the old own-cell had, no dupe). Guitar caps at 4
             recommended-first cells on one line; piano is a 2×2 of mini
             keyboards. Full row interior, no separate own-cell. ── */}
      <VoicingBrowser
        rootPc={st.rootPc}
        quality={st.quality}
        show={instrument}
        dense
        recommended={recommended}
        max={4}
      />
    </div>
  )
}

// ─── The rail ─────────────────────────────────────────────────────────────────

export default function GlanceRail({
  stations = [], activeIndex = -1, focusedIndex = null, onFocus, instrument, keyRoot, keyMode,
}) {
  const n = stations.length
  if (n === 0) return null
  const nextIndex = activeIndex >= 0 && n > 1 ? (activeIndex + 1) % n : -1

  // Voice-leading rails: rail i leaves station i for station (i+1) mod n — the
  // last rail wraps back to station 0 (the loop is a wheel). The headline rail
  // is the 7→3 (voiceLeadingPairs lists the 7th first); a one-chord loop has
  // no transition to speak of.
  const rails = stations.map((st, i) => {
    if (n < 2) return null
    const next = stations[(i + 1) % n]
    return voiceLeadingPairs(
      { root: st.rootPc, quality: st.quality },
      { root: next.rootPc, quality: next.quality },
    )[0] ?? null
  })

  return (
    <section
      className="rounded-2xl border border-border bg-panel p-2"
      aria-label="Voicing variations — every chord of the loop, all expanded"
    >
      <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
        Variations · every chord, every voicing — the playhead highlights
      </h4>

      <div className="flex flex-col gap-2" role="list">
        {stations.map((st, i) => (
          <StationRow
            key={i}
            st={st}
            isNow={i === activeIndex}
            isNext={i === nextIndex}
            isFocused={focusedIndex === i}
            onToggleFocus={() => onFocus?.(focusedIndex === i ? null : i)}
            instrument={instrument}
            keyRoot={keyRoot}
            keyMode={keyMode}
            rail={rails[i]}
            wraps={i === n - 1}
          />
        ))}
      </div>

      {/* No ▶ anywhere anymore (dashboard-polish.md §3 — "leave them off,
          better not"); the rail is purely visual and follows the loop. */}
      <p className="mt-2 text-[11px] text-gray-500">
        Voicings follow the loop — the playhead highlights the chord you're on.
      </p>
    </section>
  )
}
