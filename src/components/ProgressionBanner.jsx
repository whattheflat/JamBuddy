import { useRef, useEffect } from 'react'
import { toRomanNumeral } from '../lib/theory'
import { findLoopPosition } from '../lib/match'

// ─── ProgressionBanner — the SLIM LOOP STRIP (task L-50, one-screen.md §1.2) ──
//
// One full-width status row: key chip · chord history (last 5, age-faded) ·
// ♻ loop chips. The old right-30% "Now Playing" text-6xl chord + its divider
// are GONE per the user directive — the enlarged current history chip and the
// accent-glowing active loop chip ARE the now-playing display. Chrome trimmed
// (p-4 → p-2, history pb-1 dropped) so the strip lands at ~76px.
const HISTORY_SHOWN = 5

export default function ProgressionBanner({ chordHistory, keyInfo, detectedProgression, onChordClick }) {
  const { root, mode, confidence } = keyInfo ?? {}

  const visible = chordHistory.slice(-HISTORY_SHOWN)
  const current = visible[visible.length - 1]
  const loopPos = findLoopPosition(chordHistory, detectedProgression)

  const currentRef = useRef(null)
  const prevChord  = useRef(null)
  useEffect(() => {
    if (current && current !== prevChord.current && currentRef.current) {
      currentRef.current.animate(
        [{ opacity: 0, transform: 'scale(0.85)' }, { opacity: 1, transform: 'scale(1)' }],
        { duration: 200, easing: 'ease-out', fill: 'forwards' }
      )
      prevChord.current = current
    }
  }, [current])

  return (
    <div className="bg-panel border border-border rounded-2xl p-2 mb-3 flex flex-wrap items-end gap-x-3 gap-y-1">

      {/* ── Key chip ── */}
      <div className="shrink-0 flex items-baseline gap-1.5 self-center">
        {root ? (
          <>
            <span className="text-2xl font-bold text-accent">{root}</span>
            <span className="text-gray-400 text-sm">{mode}</span>
            {confidence && (
              <span className="text-xs text-gray-600">{Math.round(confidence * 100)}%</span>
            )}
          </>
        ) : (
          <span className="text-gray-600 text-sm">Detecting key…</span>
        )}
      </div>

      <div className="w-px h-6 bg-border shrink-0 self-center" />

      {/* ── Chord history (the enlarged current chip is the "now") ── */}
      {!chordHistory.length ? (
        <p className="text-gray-600 text-sm self-center">Start listening…</p>
      ) : (
        <div className="flex items-end gap-1 overflow-x-auto">
          {visible.map((chord, i) => {
            const isCurrent = i === visible.length - 1
            const age       = visible.length - 1 - i
            const opacity   = Math.max(0.25, 1 - age * 0.09)
            const rn        = root ? toRomanNumeral(chord, root, mode) : ''
            return (
              <div
                key={i}
                ref={isCurrent ? currentRef : null}
                style={{ opacity }}
                onClick={() => onChordClick?.(chord)}
                className={`flex flex-col items-center shrink-0 px-2 py-1 rounded-xl transition-colors duration-200 cursor-pointer ${
                  isCurrent
                    ? 'bg-accent/10 border border-accent/40 ring-1 ring-accent/20 hover:bg-accent/20'
                    : 'border border-transparent hover:border-border hover:bg-panel'
                }`}
              >
                <span className={`font-black leading-none tracking-tight ${
                  isCurrent ? 'text-3xl text-accent' : 'text-xl text-gray-200'
                }`}>
                  {chord}
                </span>
                <span className={`text-xs font-semibold mt-0.5 ${
                  isCurrent ? 'text-amber-400' : 'text-gray-500'
                }`}>
                  {rn || ' '}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Loop — on the same row (divider between); playhead chip = the now ── */}
      {detectedProgression && (
        <>
          <div className="w-px h-6 bg-border shrink-0 self-center" />
          <div className="flex items-center gap-1.5 flex-wrap self-center">
            <span className="text-xs text-gray-500">♻</span>
            {detectedProgression.map((chord, i) => {
              const isActive = i === loopPos
              const rn = root ? toRomanNumeral(chord, root, mode) : chord
              return (
                <div
                  key={i}
                  onClick={() => onChordClick?.(chord)}
                  className={`flex flex-col items-center px-2 py-0.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-accent/20 border-accent shadow-[0_0_10px_rgba(168,85,247,0.3)] hover:bg-accent/30'
                      : 'bg-border border-border hover:border-gray-500'
                  }`}
                >
                  <span className={`text-sm font-bold leading-none ${isActive ? 'text-accent' : 'text-gray-300'}`}>
                    {chord}
                  </span>
                  <span className={`text-xs ${isActive ? 'text-amber-400' : 'text-gray-600'}`}>{rn}</span>
                </div>
              )
            })}
            <span className="text-gray-600 text-xs">→ loop</span>
          </div>
        </>
      )}

    </div>
  )
}
