// GlanceRail — ALL loop stations expanded, always (task D-41, per
// docs/design/integrated-glance.md §4; supersedes the L-33 playhead accordion).
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
//   gallery — first cell = the station's OWN voicing (guitar: the KB play's
//             recommended shape badged "play", when present; piano: the
//             threaded/authored voicing labeled honestly, e.g. "LH 3-5-7-9" —
//             the accordion's collapsed-thumb value survives here) + the full
//             VoicingBrowser gallery (show={instrument}, dense). Cells
//             FLEX-WRAP — rows never scroll horizontally; the piano worst case
//             (~1,470px of cells) wraps to a second cell line instead (§4).
//
// Focus semantics (D-40 §4 — the pin, simplified): with everything always
// expanded there is nothing left to hold open, so tapping a row header TOGGLES
// that station as focused. The PARENT owns the state and the onFocusChord
// emission (the D-03 fretboard guide-tone contract, byte-compatible); a focused
// row shows an "aim on fretboard" chip; tap again (or the loop changes) to
// clear. This component never emits focus-chord itself and NEVER triggers
// audio on its own — every ▶ lives inside the gallery, behind a user gesture.
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
import ChordDiagram from './ChordDiagram'
import MiniPiano from './MiniPiano'
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
  // The station's own voicing — the first gallery cell (D-40 §4).
  const ownGuitar = instrument === 'guitar' && st.shape ? st.shape : null
  const ownPiano = instrument === 'piano' && st.voicing ? st.voicing : null

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
      className={`rounded-lg border p-2 ${stateClass}`}
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

      {/* ── Gallery: own-voicing cell + the full dense browser; cells WRAP,
             never scroll horizontally (D-40 §4). ── */}
      <div className="flex flex-wrap items-start gap-2">
        {(ownGuitar || ownPiano) && (
          <figure className="flex shrink-0 flex-col items-center gap-1.5 rounded-md border border-accent/60 bg-surface p-2">
            <figcaption className="flex max-w-full items-center gap-1.5 text-[11px] font-medium leading-tight text-gray-300">
              {ownGuitar && (
                <span className="rounded bg-accent px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black">
                  play
                </span>
              )}
              <span className="break-words">{ownGuitar ? ownGuitar.label : ownPiano.label}</span>
            </figcaption>
            {ownGuitar ? (
              <ChordDiagram shape={ownGuitar} keyRoot={keyRoot} rootPc={st.rootPc} size="thumb" />
            ) : (
              <MiniPiano voicing={ownPiano} size="thumb" />
            )}
          </figure>
        )}
        <div className="min-w-0 flex-1 basis-[300px]">
          {/* dense: the rail shows the mic-feedback microcopy once, below. */}
          <VoicingBrowser rootPc={st.rootPc} quality={st.quality} show={instrument} dense />
        </div>
      </div>
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
      className="rounded-2xl border border-border bg-panel p-3"
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

      {/* Mic-feedback microcopy — ONCE for the whole rail (D-31 §2.5); the
          gallery mounts run `dense` and suppress their per-mount copy. */}
      <p className="mt-2 text-[11px] text-gray-500">
        ▶ previews play through your speakers — while the mic is live, detection may
        hear them. Nothing plays automatically.
      </p>
    </section>
  )
}
