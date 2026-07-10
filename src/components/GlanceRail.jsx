// GlanceRail — the playhead accordion (task L-33, per docs/design/glance-mode.md §1–§4).
//
// A station-aligned rail under the RoadmapTrack: columns mirror the Roadmap's
// stations (canonical KB order, same labels/rn). The column at `activeIndex`
// (the playhead) is EXPANDED to the full VoicingBrowser gallery — every
// placeable guitar shape, or every piano style, side by side — while every
// other column keeps its recommended thumb (the KB play's shape / the threaded
// piano voicing). The expansion ADVANCES WITH THE PLAYHEAD: over one loop cycle
// the player is shown every variation of every chord with zero clicks (user
// directive 2026-07-10). Constant footprint — expanding one column collapses
// the previous.
//
// Pinning (D-31 §4): tapping a collapsed column pins its gallery open and halts
// auto-follow; unpin by tapping the pinned column's header or the "follow the
// jam" chip. The PARENT owns the pin state and the onFocusChord emission — this
// component never emits focus-chord and NEVER triggers audio on its own
// (auto-follow must not feed the mic; every ▶ inside the gallery is a gesture).
//
// Space honesty (D-31 §3): cells are never shrunk below the D-30 sizes — the
// rail scrolls horizontally, USER-OWNED. The old auto-centre effect was deleted
// in L-40 (D-40 §4/§6.1): the rail now lives in page flow (the Jam Guide band,
// no 70vh scroller), where scrollIntoView's nearest scroller is the DOCUMENT —
// every playhead advance would yank the whole page. Scrolling is the piano
// rail's NORMAL state on most loops (a rootless 7th-chord gallery is ~940px on
// its own). Narrow (<640px, D-31 §3): one thing per row — the current
// station's full gallery (cells wrap), then a single "next" thumb; the loop
// display up top (ProgressionBanner) still shows the whole loop.
//
// Pure presentational. Props (the D-31 §5 contract):
//   stations    — [{ shape, voicing, rootPc, quality, label, rn }] canonical order
//   activeIndex — playhead station (canonicalPos); -1 = loop known, playhead
//                 not — station 0 expands, but nothing is marked "now" (§2.1)
//   pinnedIndex — the pinned station index, or null (= follow the jam)
//   onPin       — fn(index|null): pin a station / unpin
//   instrument  — 'guitar' | 'piano' (VoicingBrowser `show`)
//   keyRoot     — key tonic pitch class 0–11 (ChordDiagram fret placement)

import ChordDiagram from './ChordDiagram'
import MiniPiano from './MiniPiano'
import VoicingBrowser from './VoicingBrowser'

export default function GlanceRail({
  stations = [], activeIndex = -1, pinnedIndex = null, onPin, instrument, keyRoot,
}) {
  const n = stations.length
  const pinned = pinnedIndex != null && pinnedIndex >= 0 && pinnedIndex < n
  // The expanded column: the pin wins; otherwise follow the playhead; with the
  // playhead unknown (-1) station 0 expands so the rail is never all-collapsed.
  const expandedIndex = pinned ? pinnedIndex : (activeIndex >= 0 ? activeIndex : 0)
  // Narrow-viewport lookahead: the one collapsed thumb worth its pixels (§3).
  const followBase = activeIndex >= 0 ? activeIndex : 0
  const nextIndex = n > 1 ? (followBase + 1) % n : -1

  if (n === 0) return null

  return (
    <section
      className="rounded-2xl border border-border bg-panel p-3"
      aria-label="Voicing variations — follows the playhead"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
          Variations · {pinned ? 'pinned' : 'follows the playhead'}
        </h4>
        {pinned && (
          <button
            type="button"
            onClick={() => onPin?.(null)}
            className="flex min-h-[32px] items-center gap-1.5 rounded-lg border border-accent bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent outline-none transition hover:bg-accent/20 focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span aria-hidden="true">▶</span> follow the jam
          </button>
        )}
      </div>

      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-start sm:overflow-x-auto sm:pb-1" role="list">
        {stations.map((st, i) => {
          const isNow = i === activeIndex
          const isExpanded = i === expandedIndex
          const isPinnedHere = pinned && i === pinnedIndex

          if (isExpanded) {
            // ── The expanded column: the full D-30 gallery for this station. ──
            return (
              <div
                key={i}
                role="listitem"
                aria-current={isNow ? 'true' : undefined}
                aria-label={`${st.label}${st.rn ? ` (${st.rn})` : ''} — every ${instrument} voicing`}
                className={
                  'order-1 w-full shrink-0 rounded-lg border p-2 sm:order-none sm:w-max ' +
                  (isNow ? 'border-accent bg-accent/10' : 'border-accent/60 bg-accent/5')
                }
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <button
                    type="button"
                    aria-pressed={isPinnedHere}
                    onClick={() => onPin?.(isPinnedHere ? null : i)}
                    title={isPinnedHere
                      ? `Unpin ${st.label} — follow the jam again`
                      : `Pin ${st.label} — hold its voicings open, light its guide tones on the fretboard`}
                    className="flex min-h-[32px] items-center gap-1.5 rounded px-1 outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <span className="text-sm font-semibold leading-none text-gray-100">{st.label}</span>
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
                  {isPinnedHere && (
                    <span className="text-[9px] font-semibold uppercase tracking-widest text-gray-500">
                      pinned
                    </span>
                  )}
                </div>
                {/* dense: the rail shows the mic-feedback microcopy once, below. */}
                <VoicingBrowser rootPc={st.rootPc} quality={st.quality} show={instrument} dense />
              </div>
            )
          }

          // ── Collapsed column: the recommended thumb; tap to pin. ──
          // Narrow (<640px): only the "next" thumb survives — the rest are
          // dropped (the Roadmap above still shows the whole loop, §3).
          const isNext = i === nextIndex
          return (
            <button
              key={i}
              type="button"
              role="listitem"
              aria-pressed={false}
              aria-current={isNow ? 'true' : undefined}
              onClick={() => onPin?.(i)}
              title={`Pin ${st.label}${st.rn ? ` (${st.rn})` : ''} — hold its voicings open`}
              className={
                (isNext ? 'order-2 flex sm:order-none ' : 'hidden sm:flex ') +
                'shrink-0 flex-col items-center gap-1 rounded-lg border p-2 outline-none transition ' +
                'focus-visible:ring-2 focus-visible:ring-accent ' +
                (isNow
                  ? 'border-accent bg-accent/10 ring-1 ring-accent'
                  : 'border-border bg-surface hover:border-gray-500')
              }
              style={{ opacity: isNow ? 1 : 0.85 }}
            >
              {isNext && (
                <span className="self-start text-[9px] font-semibold uppercase tracking-widest text-gray-500 sm:hidden">
                  next
                </span>
              )}
              {st.voicing ? (
                <>
                  <MiniPiano voicing={st.voicing} size="thumb" />
                  {/* MiniPiano has no built-in chord label; mirror ChordDiagram's
                      thumb label (text-gray-300, 9px) so the station stays named. */}
                  <span className="text-gray-300 leading-none" style={{ fontSize: 9 }}>
                    {st.label}
                  </span>
                </>
              ) : (
                <ChordDiagram
                  shape={st.shape}
                  keyRoot={keyRoot}
                  rootPc={st.rootPc}
                  size="thumb"
                  label={st.label}
                />
              )}
              {st.rn && (
                <span className="text-[9px] font-medium uppercase tracking-wide text-gray-500">
                  {st.rn}
                </span>
              )}
            </button>
          )
        })}
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
