# Chord Progression Repertoire

Research-backed reference for expanding the progression features. Companion to [`GOAL.md`](../GOAL.md) Part 1. Notation: uppercase = major, lowercase = minor, ° = diminished, 7 = dominant unless marked maj7/m7.

How this maps to code today:

- `PROGRESSIONS` in `src/lib/theory.js` — `{ name, rn, degrees }` per progression; `degrees` are semitone offsets from the key root. This is the format new entries should use.
- `getSuggestedProgressions(root, mode)` maps degrees → chord names in key; `toRomanNumeral()` converts any chord back to a numeral.
- `FAMOUS_PROGRESSIONS` in `src/lib/education.js` — richer entries (songs, tips, style variations) for the Learn side.

## 1. Genre-by-genre progression tables

### Pop
| Progression | Name / notes |
|---|---|
| I–V–vi–IV | "Axis of Awesome" — #1 in Hooktheory's corpus of 75k+ analyzed songs |
| vi–IV–I–V | Same loop rotated to start on vi ("pessimistic axis") |
| I–vi–IV–V | "Doo-wop" / "'50s progression" |
| I–IV–vi–V | Common variant (Africa chorus) |
| IV–V–iii–vi | "Royal Road" — J-pop/anime staple, spreading into Western pop |

### Rock
| Progression | Name / notes |
|---|---|
| I–IV–V | Foundation of rock/blues/country |
| I–♭VII–IV(–I) | Mixolydian rock cliché (Sweet Home Alabama as V–IV–I rotation) |
| i–♭VII–♭VI(–V) | Andalusian-derived minor loop; with V = full Andalusian cadence |
| I–♭III–IV | Blues-rock riff progression (borrowed ♭III) |

### Blues (12-bar family)
| Progression | Name / notes |
|---|---|
| I7×4 / IV7×2, I7×2 / V7, IV7, I7, V7 | Standard 12-bar |
| Bar 2 → IV7 | "Quick change" / "quick four" |
| ii7–V7 in bars 9–10, turnaround I–VI7–ii–V7 | Jazz blues |
| i7–iv7–i7 … ♭VI7–V7–i7 | Minor blues (The Thrill Is Gone) |
| I–V–IV–IV–I–V–I–V | 8-bar blues (Key to the Highway) |

### Jazz
| Progression | Name / notes |
|---|---|
| ii7–V7–Imaj7 | The fundamental cadence |
| I–vi–ii–V (also iii–vi–ii–V) | Rhythm changes A / turnaround |
| III7–VI7–II7–V7 | Rhythm changes bridge (circle of dominants) |
| iim7♭5–V7♭9–i | Minor ii–V–i |
| ii7–♭II7–Imaj7 | Tritone-sub cadence |
| ivm7–♭VII7–Imaj7 | "Backdoor" progression |

### Folk / Country
| Progression | Name / notes |
|---|---|
| I–IV–V(–I) | Core of both genres |
| I–V–I–IV | Two/three-chord verse pattern |
| i–♭VII–♭VI | Minor folk descent (Am–G–F) |
| I–V–vi–iii–IV–I–IV–V | Pachelbel progression |
| I–II7–V–I | Classic country secondary-dominant (V/V) move |

### Funk
| Progression | Name / notes |
|---|---|
| I7 vamp | James Brown static dominant, voiced as 9th |
| i7–IV7 | Dorian two-chord vamp — the most common funk pair |
| i7 / m11 vamp | Minor one-chord groove |
| ii7–V7 loop | Funk/disco vamp |

Design insight: funk needs few *progressions* but rich *chord qualities* (9, 7♯9, m11, 13sus) — colour lives in the voicing, not the changes.

### Reggae
| Progression | Name / notes |
|---|---|
| I–V or I–IV | Two-chord skank vamps |
| I–V–vi–IV | No Woman No Cry |
| i–♭VII(–♭VI) | Minor roots-reggae vamp |
| I–IV–V | Ska/rocksteady standard |

### R&B / Neo-soul
| Progression | Name / notes |
|---|---|
| ii7–V7–Imaj7 (with 9/11/13 extensions) | Core cadence |
| iii7–vi7–ii7–V7 | Circle movement from the mediant — neo-soul staple |
| vi–ii–V–I | "6-2-5-1" cyclical soul loop |
| Imaj7–IVmaj7 / Imaj7–iii7 | Two-chord vamps |
| i7–iv7 | Dorian D'Angelo-style minor vamp |

### Gospel
| Progression | Name / notes |
|---|---|
| ii7–V7–I | The gospel "2-5-1", often chained: 6-2-5-1, 3-6-2-5-1 |
| I–I7–IV | Tonicizing IV (V7/IV "amen" setup) |
| IV–iv–I | Plagal with borrowed iv |
| I–♯i°–ii | Chromatic passing-diminished walk-up |

## 2. Substitution / variation taxonomy

Progression "families" relate through a small set of transforms — these are the generation rules for variation buttons and the Builder:

1. **Rotation** — any loop can start on any chord (I–V–vi–IV ≡ vi–IV–I–V). Treat loops as cyclic equivalence classes; display the rotation matching the user's tonic emphasis. (`detectRepeatingProgression` already canonicalizes rotations.)
2. **Diatonic (function) substitution** — chords sharing two notes swap: I↔vi↔iii (tonic), IV↔ii (subdominant), V↔vii° (dominant).
3. **Modal interchange / borrowing** — take a chord from the parallel mode: iv, ♭VI, ♭VII, ♭III, iim7♭5 in major; major IV (Dorian) in minor.
4. **Secondary dominants** — precede any diatonic target with its V7: V/V = II7, V/vi = III7, V/IV = I7, V/ii = VI7.
5. **Tritone substitution** — replace any dominant with the dominant a tritone away (V7 → ♭II7). Jazz flavour flag.
6. **Backdoor dominant** — ♭VII7 resolving to I, usually as ivm7–♭VII7–I.
7. **Quality embellishment** — same root, richer colour: triad → 7th → 9/11/13, sus2/4, add9. The main axis distinguishing genres (pop = triads/sus, jazz/neo-soul/gospel = extensions, funk = dominant 9/♯9). Already partially covered by `CHORD_SUBSTITUTIONS` in `education.js`.
8. **Passing/approach chords** — chromatic passing diminished (I–♯i°–ii), bass-line inversions (slash chords).

## 3. UX patterns worth copying

- **Hookpad (Hooktheory)** — *key-relative chord palette*: only the diatonic chords of the current key, colour-coded consistently per scale degree (key-agnostic colours). Borrowed chords live in expandable secondary palettes. *Magic Chord* suggests the statistically likeliest next chord. Drag-and-drop onto a timeline. → Direct model for the Progression Builder (GOAL G3).
- **Hooktheory TheoryTab** — progressions ranked by real-song frequency; each links to songs using it. "You're playing the Creep progression" is a strong engagement hook (partially exists via `FAMOUS_PROGRESSIONS` song lists).
- **Scaler 2/3** — three-zone vertical flow: detection area (top) → suggested chords/scales (middle) → user-built progression (bottom). Maps directly onto this app: live detection → suggestions → builder.
- **iReal Pro** — one-tap transposition; per-genre rendering of the same progression.
- **ToneGym** — instant audio preview when tapping any chord/progression.

## 4. Voicing data

### Guitar
Best option found: [`tombatossals/chords-db`](https://github.com/tombatossals/chords-db) (MIT, npm `@tombatossals/chords-db`, prebuilt `lib/guitar.json`):
- All 12 keys × large suffix list, **multiple positions per chord** (open + barre + higher CAGED positions).
- Per position: `frets` (per string, `x` = mute, low-E first), `fingers`, optional `barres`, `baseFret`. Example: `{ frets: '55775x', fingers: '114310', barres: 5 }`.
- Companion renderer: [`tombatossals/react-chords`](https://github.com/tombatossals/react-chords) (React SVG diagrams consuming this format).

Triads on string-sets (top-3 / middle-3) are *not* in chords-db but are cheap to generate: for each inversion of the triad, map the 3 chord tones onto a chosen string set within a 4-fret window. This complements the existing `GUITAR_SHAPES` in `src/lib/voicings.js`.

### Piano
No canonical open dataset exists. The sane model is **interval recipes resolved per chord quality** (the chord templates in `theory.js` already encode quality → semitone mapping):

```js
// voicing = named recipe of chord degrees, resolved per chord quality
{
  shell:        { LH: ['1', '7'],           RH: ['3'] },
  rootPosition: { LH: ['1'],                RH: ['1', '3', '5', '7'] },
  rootlessA:    { LH: ['3', '5', '7', '9'] },  // Type A: 3rd on bottom
  rootlessB:    { LH: ['7', '9', '3', '5'] },  // Type B: 7th on bottom
  guideTones:   { LH: ['3', '7'] },
}
```

Conventions to encode: rootless voicings keep the top note between C4–C5; alternate Type A/B through a progression so inner voices barely move — i.e. pick the voicing minimizing semitone travel from the previous chord (simple voice-leading distance minimization).

## 5. Sources

- Hooktheory corpus & blog: hooktheory.com/blog/i-analyzed-the-chords-of-1300-popular-songs-for-patterns-this-is-what-i-found/ ; hooktheory.com/blog/jazz-chord-progressions/
- 12-bar variants: en.wikipedia.org/wiki/Twelve-bar_blues ; happybluesman.com/common-variations-12-bar-blues/
- Named progressions: en.wikipedia.org/wiki/%2750s_progression ; piano.org/chord-progressions/ ; supersimplepiano.com/learn/chord-progressions/royal-road
- Substitutions: learnjazzstandards.com (chord substitution) ; hub.yamaha.com (beyond diatonic) ; hubguitar.com (tritone subs)
- Gospel: gospelmaps.com/top-gospel-chord-progressions/ ; gospel.hearandplay.com (2-5-1)
- Genre vamps: orphiq.com (reggae) ; guitar-chord.org/articles/funk.html ; orangecandymusic.com & pickupmusic.com (R&B/neo-soul)
- Tools: producelikeapro.com (Scaler review) ; hooktheory.com/hookpad
- Voicing data: github.com/tombatossals/chords-db ; github.com/tombatossals/react-chords ; voicinglab.com & pianowithjonny.com & thejazzpianosite.com (rootless voicings)
