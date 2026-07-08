// Jazz guitar pack — gold-standard KB cell. Shapes verified by note-spelling
// against: jazzguitar.be (shell chords, drop-2, comping rhythms), freddiegreen.org,
// jenslarsen.nl (comping rhythms, voice leading), premierguitar.com (drop-2).

// Shell voicings (Freddie Green style) — root + 3rd + 7th, fifths omitted.
const SHELL_6 = { // root on low E string
  maj7:     { rootStr: 6, offsets: [0, 'x', 1, 1, 'x', 'x'], fingers: [1, 0, 3, 4, 0, 0] },   // R–7–3
  dom7:     { rootStr: 6, offsets: [0, 'x', 0, 1, 'x', 'x'], fingers: [1, 0, 2, 3, 0, 0] },   // R–♭7–3
  min7:     { rootStr: 6, offsets: [0, 'x', 0, 0, 'x', 'x'], fingers: [1, 0, 2, 3, 0, 0] },   // R–♭7–♭3
  half_dim: { rootStr: 6, offsets: [0, 'x', 0, 0, -1, 'x'], fingers: [2, 0, 3, 4, 1, 0] },    // R–♭7–♭3–♭5
}
const SHELL_5 = { // root on A string
  maj7:     { rootStr: 5, offsets: ['x', 0, -1, 1, 'x', 'x'], fingers: [0, 2, 1, 4, 0, 0] },  // R–3–7
  dom7:     { rootStr: 5, offsets: ['x', 0, -1, 0, 'x', 'x'], fingers: [0, 2, 1, 3, 0, 0] },  // R–3–♭7
  min7:     { rootStr: 5, offsets: ['x', 0, -2, 0, 'x', 'x'], fingers: [0, 3, 1, 4, 0, 0] },  // R–♭3–♭7
  half_dim: { rootStr: 5, offsets: ['x', 0, 1, 0, 1, 'x'], fingers: [0, 1, 3, 2, 4, 0] },     // R–♭5–♭7–♭3
}

// Drop-2 voicings on the top four strings (D–G–B–e) — stays out of the bass register.
const DROP2 = {
  maj7Root:  { rootStr: 4, offsets: ['x', 'x', 0, 2, 2, 2], fingers: [0, 0, 1, 3, 3, 3] },    // R–5–7–3
  dom7Root:  { rootStr: 4, offsets: ['x', 'x', 0, 2, 1, 2], fingers: [0, 0, 1, 3, 2, 4] },    // R–5–♭7–3
  min7Root:  { rootStr: 4, offsets: ['x', 'x', 0, 2, 1, 1], fingers: [0, 0, 1, 4, 2, 3] },    // R–5–♭7–♭3
  halfDimRoot: { rootStr: 4, offsets: ['x', 'x', 0, 1, 1, 1], fingers: [0, 0, 1, 2, 3, 4] },  // R–♭5–♭7–♭3
  min7Inv3:  { rootStr: 1, offsets: ['x', 'x', 0, 0, 0, 0], fingers: [0, 0, 1, 1, 1, 1] },    // ♭7–♭3–5–R (one-finger barre)
  dom7Inv2:  { rootStr: 2, offsets: ['x', 'x', 1, 2, 0, 2], fingers: [0, 0, 2, 3, 1, 4] },    // 3–♭7–R–5
  maj7Inv2:  { rootStr: 1, offsets: ['x', 'x', 1, 1, 0, 0], fingers: [0, 0, 2, 3, 1, 1] },    // 7–3–5–R
}

export default {
  styleIntro:
    'In a jazz jam the guitar is part of the rhythm section: small voicings built on 3rds and 7ths, placed around the soloist, never on top of the piano. The fifths and often the roots are someone else\'s job — your two guide tones carry the whole harmony.',

  comping: [
    {
      label: 'Four-to-the-bar (Freddie Green)',
      rhythm: '♩ ♩ ♩ ♩',
      description: 'Short, percussive quarter-note strums on all four beats, slight accent on 2 and 4 — the Count Basie pulse. Damp the unused strings; the chunk matters more than the chord.',
    },
    {
      label: 'Charleston',
      rhythm: '𝅗𝅥. + "and of 2"',
      description: 'Hit on beat 1 (held) plus a stab on the and-of-2 — the foundational syncopated comping cell. Displace it ("and of 1" + beat 3) for forward motion.',
    },
    {
      label: 'The push (anticipated and-of-4)',
      rhythm: 'tied from "and of 4"',
      description: 'Strike the next bar\'s chord an eighth note early and tie it over the barline — the standard jazz anticipation. Telegraphs the change to the whole band.',
    },
  ],

  plays: {
    'jazz-251-major': [
      {
        label: 'Shell voicings, guide-tone glue',
        level: 'intermediate',
        chords: [
          { shape: SHELL_5.min7, note: 'R–♭3–♭7' },
          { shape: SHELL_6.dom7, note: '♭7 of ii holds; ♭3 falls a half-step to become the 3rd' },
          { shape: SHELL_5.maj7, note: '♭7 of V falls a half-step to the 3rd; the other voice holds' },
        ],
        tips: 'Only the roots jump — both upper voices move 0 or 1 fret across the whole progression. Watch the D and G strings: that two-note thread is the ii–V–I.',
      },
      {
        label: 'Drop-2 in one position (top four strings)',
        level: 'intermediate',
        chords: [
          { shape: DROP2.min7Inv3, note: 'one-finger barre: ♭7–♭3–5–R' },
          { shape: DROP2.dom7Inv2, note: 'every voice moves 0–2 frets' },
          { shape: DROP2.maj7Inv2, note: 'lands with the root on top' },
        ],
        tips: 'The whole progression sits in one 3-fret window with no position jump — ideal when a piano is holding the low end. Great behind a singer: high, thin, out of the way.',
      },
    ],

    'jazz-251-minor': [
      {
        label: 'Shell voicings with the ♭5 voiced',
        level: 'intermediate',
        chords: [
          { shape: SHELL_6.half_dim, note: 'the ♭5 on the B string is the colour — don\'t skip it' },
          { shape: SHELL_5.dom7, extensions: ['b9'], note: 'add the ♭9 a fret above the root for the full minor-key sound' },
          { shape: SHELL_6.min7, note: 'home — resolve and get light' },
        ],
        tips: 'The ♭5 of the iiø7 *is* the ♭9 of the V7 — same pitch, reinterpreted. Find it once, hold it through both chords.',
      },
      {
        label: 'Drop-2, top-four strings',
        level: 'intermediate',
        chords: [
          { shape: DROP2.halfDimRoot, note: 'root + one-finger barre' },
          { shape: DROP2.dom7Inv2, note: '' },
          { shape: DROP2.min7Inv3, note: 'one-finger barre to rest on' },
        ],
        tips: 'Both barre grips bookending this make the iiø7 the only real stretch — practise the V7 grip as the pivot between them.',
      },
    ],

    'jazz-rhythm-a': [
      {
        label: 'Shells, four-to-the-bar',
        level: 'intermediate',
        chords: [
          { shape: SHELL_6.maj7, note: '' },
          { shape: SHELL_5.min7, note: '' },
          { shape: SHELL_5.min7, note: 'same grip, two frets down from vi' },
          { shape: SHELL_6.dom7, note: '' },
        ],
        tips: 'One chord per bar, four chunks per bar, Freddie Green style. At rhythm-changes tempo the small shapes are the only ones that keep up.',
      },
      {
        label: 'Drop-2 turnaround, upper register',
        level: 'intermediate',
        chords: [
          { shape: DROP2.maj7Root, note: '' },
          { shape: DROP2.min7Inv3, note: '' },
          { shape: DROP2.min7Root, note: '' },
          { shape: DROP2.dom7Inv2, note: '' },
        ],
        tips: 'A loop, not a line — bar 4 feeds bar 1. Practise it as one circular hand motion until the join disappears.',
      },
    ],

    'jazz-625': [
      {
        label: 'Shells, alternating root strings',
        level: 'intermediate',
        chords: [
          { shape: SHELL_6.min7, note: '' },
          { shape: SHELL_5.min7, note: '' },
          { shape: SHELL_6.dom7, note: '' },
          { shape: SHELL_5.maj7, note: '' },
        ],
        tips: 'Roots falling in fifths alternate 6th string → 5th string at the same fret — the progression stays in one position by construction. This is why shells were built for circle-of-fifths tunes.',
      },
      {
        label: 'Drop-2 circle, top-four strings',
        level: 'intermediate',
        chords: [
          { shape: DROP2.min7Inv3, note: '' },
          { shape: DROP2.min7Root, note: '' },
          { shape: DROP2.dom7Inv2, note: '' },
          { shape: DROP2.maj7Inv2, note: '' },
        ],
        tips: 'Sing the top note of each grip as you move — drop-2 makes the melody line on the e string audible, and that line is what the soloist hears from you.',
      },
    ],

    'jazz-tritone-sub': [
      {
        label: 'Shells down one string (chromatic slide)',
        level: 'intermediate',
        chords: [
          { shape: SHELL_5.min7, note: 'ii7 — root on the A string' },
          { shape: SHELL_5.dom7, note: '♭II7 — two fingers drop a fret; the guide-tone finger stays put' },
          { shape: SHELL_5.maj7, note: 'Imaj7 — one more fret down: home' },
        ],
        tips: 'The tritone sub turns the ii–V–I bass into a one-string chromatic slide: 2 → ♭2 → 1, one fret per chord. It works because ♭II7 and V7 share their guide tones — the 3rd and ♭7 swap names (in C: Db7 has F and B, exactly G7\'s B and F). Target the ♭II7\'s 3rd when soloing; it is the old V7\'s ♭7.',
      },
      {
        label: 'Drop-2 slide, top four strings',
        level: 'intermediate',
        chords: [
          { shape: DROP2.min7Root, note: 'ii7 — root position, root on the D string' },
          { shape: DROP2.dom7Root, note: '♭II7 — same architecture, one fret down' },
          { shape: DROP2.maj7Root, note: 'Imaj7 — one more fret down: three voices fall a half step, one holds' },
        ],
        tips: 'The upper-register version: three root-position drop-2 grips, roots falling a fret at a time. Each change is three voices dropping a half step around one common tone — the ii7\'s ♭3 is held to become the ♭II7\'s 3rd, then the ♭II7\'s ♭7 is held to become the Imaj7\'s 7. High and thin, it stays out of the piano\'s way, and the top string sings the guide-tone line: held into the ♭II7, falling a half step into home.',
      },
    ],

    'jazz-rhythm-bridge': [
      {
        label: 'Shells around the circle',
        level: 'intermediate',
        chords: [
          { shape: SHELL_6.dom7, note: 'III7 — V7 of vi, the first domino' },
          { shape: SHELL_5.dom7, note: 'VI7 — root string up, nearly the same fret' },
          { shape: SHELL_6.dom7, note: 'II7 — the pattern repeats a whole step down' },
          { shape: SHELL_5.dom7, note: 'V7 — hands you back the A section' },
        ],
        tips: 'One grip pair, four chords: roots falling in fifths alternate 6th → 5th string at almost the same fret, so the whole bridge sits in one position. Each chord is the V of the next — comp two bars each and voice-lead the ♭7 falling a half step onto the next chord\'s 3rd.',
      },
      {
        label: 'Drop-2, alternating inversions (top four strings)',
        level: 'intermediate',
        chords: [
          { shape: DROP2.dom7Inv2, note: 'III7 — 3rd in the bass voice' },
          { shape: DROP2.dom7Root, note: 'VI7 — nearest root-position grip' },
          { shape: DROP2.dom7Inv2, note: 'II7 — back to the inversion' },
          { shape: DROP2.dom7Root, note: 'V7 — root position into the turnaround' },
        ],
        tips: 'Alternating the 3rd-in-the-bass grip with root-position drop-2 keeps every change a short hop — root-position-only would force five-fret jumps around this circle. Two bars per chord is room to decorate: restrike on the Charleston, or walk the top voice.',
      },
    ],

    'jazz-blues': [
      {
        label: 'Shells through the form',
        level: 'intermediate',
        chords: [
          { shape: SHELL_6.dom7, note: 'I7 — root on the 6th string' },
          { shape: SHELL_5.dom7, note: 'IV7 — same fret, root string up' },
          { shape: SHELL_6.dom7, note: '' },
          { shape: SHELL_6.dom7, note: '' },
          { shape: SHELL_5.dom7, note: '' },
          { shape: SHELL_5.dom7, note: '' },
          { shape: SHELL_6.dom7, note: '' },
          { shape: SHELL_5.dom7, note: 'VI7 — the jazz move; hear bar 8 coming' },
          { shape: SHELL_5.min7, note: 'ii7 of the turnaround' },
          { shape: SHELL_6.dom7, note: 'V7' },
          { shape: SHELL_6.dom7, note: 'home' },
          { shape: SHELL_6.dom7, note: 'V7 pickup into the next chorus' },
        ],
        tips: 'I7 and IV7 sit at the same fret on adjacent root strings — the first four bars are a two-finger-move exercise. Keep everything within two frets of the I.',
      },
      {
        label: 'Drop-2 blues, top-four strings',
        level: 'intermediate',
        chords: [
          { shape: DROP2.dom7Root, note: '' },
          { shape: DROP2.dom7Inv2, note: 'IV7 without leaving the position' },
          { shape: DROP2.dom7Root, note: '' },
          { shape: DROP2.dom7Root, note: '' },
          { shape: DROP2.dom7Inv2, note: '' },
          { shape: DROP2.dom7Inv2, note: '' },
          { shape: DROP2.dom7Root, note: '' },
          { shape: DROP2.dom7Inv2, note: 'VI7' },
          { shape: DROP2.min7Inv3, note: '' },
          { shape: DROP2.dom7Inv2, note: '' },
          { shape: DROP2.dom7Root, note: '' },
          { shape: DROP2.dom7Inv2, note: '' },
        ],
        tips: 'Comping above the 7th fret leaves the whole low end to bass and piano — the classic organ-trio guitar register. Charleston rhythm, not four-to-the-bar, up here.',
      },
    ],
  },

  improv: {
    scales: [
      { over: 'ii7', scale: 'dorian', why: 'Minor 7 chords in a major key take Dorian — the natural 6 keeps it from sounding sad.' },
      { over: 'V7', scale: 'mixolydian', why: 'The ♭7 is built in; in minor keys use Phrygian dominant (harmonic minor from the V) for the ♭9 sound.' },
      { over: 'Imaj7', scale: 'major', why: 'Plain major works; avoid sitting on the 4th over the maj7.' },
      { over: 'I7 (blues)', scale: 'mixolydian', why: 'Mix with the blues scale — Mixolydian for the changes, blues scale for the attitude.' },
      { over: 'iiø7', scale: 'locrian', why: 'Target the ♭3 or ♭5; the ♭5 becomes the ♭9 of the next V7.' },
    ],
    targetNotes:
      'Land the 3rd of each chord on the downbeat of the change. In any ii–V–I the 7th of one chord falls a half-step to the 3rd of the next — that two-note rail is the whole map.',
    licks: [
      {
        over: 'jazz-251-major',
        description: '"The Lick" — the most famous ii–V cliché in jazz (Parker, Coltrane, everyone). Degrees 1–2–♭3–4–2–♭7–1 over the ii chord.',
        tab: 'e|--------------------------\nB|--------------------------\nG|--------------------------\nD|----2--3--5--2------------\nA|-5--------------3--5------\nE|--------------------------\n    D  E  F  G  E  C  D   (over Dm7 in C)',
        source: 'Wikipedia: "The Lick"; Alex Heitlinger compilation (2011)',
      },
      {
        over: 'jazz-251-major',
        description: 'Stock bebop ii–V–I: ii arpeggio up, then the 3–5–♭7–♭9 diminished arpeggio over the V7 (B–D–F–A♭ over G7), resolving half-step into the I.',
        tab: 'e|--------------------------|------------4--3---------|--------\nB|----------------5--3------|----3--6----------6--3----|--1-----\nG|-------------5---------5--|-4---------------------4--|--------\nD|----3--7---------------7--|--------------------------|--------\nA|-5------------------------|--------------------------|--------\nE|--------------------------|--------------------------|--------\n    Dm7 arpeggio + 9th        G7: 3-5-♭7-♭9 dim arp      Cmaj7',
        source: 'David Baker, How to Play Bebop Vol. 1; jazzguitar.be "50 Bebop Licks"',
      },
    ],
  },
}
