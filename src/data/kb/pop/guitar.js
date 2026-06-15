// Pop guitar pack. Every shape's pitch classes were verified by note-spelling
// against standard tuning (EADGBe) and the chord quality before authoring.
// Voicing / capo / strumming references:
//   justinguitar.com (open "cowboy" chords, capo strategy, common strums),
//   guitar.com & fretjam.com (sus2/sus4 add-colour, add9 cowboy chords),
//   andyguitar.co.uk (eighth-note pop strum, palm-muted pop-rock),
//   en.wikipedia.org/wiki/The_Axis_of_Awesome (capo-as-transpose for the axis).
//
// Pop guitar is a capo-and-open-shape craft: most hits are written in a flat or
// sharp key but PLAYED in a guitar-friendly shape set (G, C, D, Em, Am) with the
// capo doing the transposition. Each progression therefore gets one open
// "campfire" play (ringing strings, capo-friendly) and one movable barre play
// for the keys no capo position reaches. The barre play is genuinely different
// in register and ring, not a transposition of the open one.

// --- Open "cowboy" shapes — render only when the chord root matches ---
const OPEN_G = { onlyRoot: 7, frets: [3, 2, 0, 0, 3, 3], fingers: [2, 1, 0, 0, 3, 4] }     // big ringing G
const OPEN_D = { onlyRoot: 2, frets: ['x', 'x', 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] }
const OPEN_EM = { onlyRoot: 4, frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] }
const OPEN_AM = { onlyRoot: 9, frets: ['x', 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] }
const OPEN_C = { onlyRoot: 0, frets: ['x', 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] }
const OPEN_F = { onlyRoot: 5, frets: ['x', 'x', 3, 2, 1, 1], fingers: [0, 0, 3, 2, 1, 1] }  // small F, top four

// --- add9 colour (the pop "sparkle") — used where the quality is add9 ---
const OPEN_CADD9 = { onlyRoot: 0, frets: ['x', 3, 2, 0, 3, 3], fingers: [0, 2, 1, 0, 3, 4] }   // R–3–5–9

// --- Movable barres — for the capo-hostile keys ---
const BARRE_MAJ_6 = { rootStr: 6, offsets: [0, 2, 2, 1, 0, 0], fingers: [1, 3, 4, 2, 1, 1] }   // E-shape
const BARRE_MAJ_5 = { rootStr: 5, offsets: ['x', 0, 2, 2, 2, 0], fingers: [0, 1, 2, 3, 4, 1] } // A-shape
const BARRE_MIN_6 = { rootStr: 6, offsets: [0, 2, 2, 0, 0, 0], fingers: [1, 3, 4, 1, 1, 1] }   // Em-shape
const BARRE_MIN_5 = { rootStr: 5, offsets: ['x', 0, 2, 2, 1, 0], fingers: [0, 1, 3, 4, 2, 1] } // Am-shape

export default {
  styleIntro:
    'Pop guitar is built from a handful of open "cowboy" chords and a capo. Most chart hits live in flat or sharp keys, but the guitarist plays familiar open shapes and slides the capo to the singer\'s key — so the same G–D–Em–C grips power a thousand songs. The colour comes from sus2/sus4 hammer-ons and add9 ring, not from harmonic complexity; the loop stays simple and the strum, dynamics, and one well-placed suspension carry the part.',

  comping: [
    {
      label: 'Eighth-note pop strum',
      rhythm: 'D D U U D U (the "old faithful")',
      description: 'The default acoustic-pop pattern: steady down-up eighths with a gap where the third downstroke would be, accent on the backbeat. Keep the wrist loose and constant even through the muted gap.',
    },
    {
      label: 'Sus hammer-on figure',
      rhythm: 'strum chord → hammer to sus4 / pull to sus2 within the bar',
      description: 'The signature pop-guitar decoration: hold the open chord and wiggle one finger to a sus4 and back (or pull off to sus2). It animates a single static chord without changing the harmony — Tom Petty / Mr. Big territory.',
    },
    {
      label: 'Palm-muted eighths (pop-rock)',
      rhythm: 'chugged straight eighths, edge of the palm on the bridge',
      description: 'For the driving pop-rock loops: muted downstrokes on the low strings, opening up on the chorus. The dynamic jump from muted verse to open chorus is the arrangement doing the work the chords don\'t.',
    },
  ],

  plays: {
    'pop-axis': [
      {
        label: 'G–D–Em–C campfire (capo to taste)',
        level: 'intermediate',
        chords: [
          { shape: OPEN_G, note: 'I — big ringing G' },
          { shape: OPEN_D, note: 'V — open D' },
          { shape: OPEN_EM, note: 'vi — Em, the only minor in the loop' },
          { shape: OPEN_CADD9, extensions: ['9'], note: 'IV — Cadd9 keeps the top two strings ringing through the change' },
        ],
        tips: 'This is the canonical pop guitar set: in G it is G–D–Em–C, and any key is just a capo move (A = capo 2, B♭ = capo 3…). Voicing the IV as Cadd9 lets the open B and e strings drone across all four chords — the modern-pop "wash".',
      },
      {
        label: 'Barre shapes (capo-hostile keys)',
        level: 'intermediate',
        chords: [
          { shape: BARRE_MAJ_6, note: 'I — E-shape barre' },
          { shape: BARRE_MAJ_5, note: 'V — A-shape, same fret region' },
          { shape: BARRE_MIN_6, note: 'vi — Em-shape barre' },
          { shape: BARRE_MAJ_5, note: 'IV — A-shape barre' },
          ],
        tips: 'When no capo position gives you open strings (or a second guitar already owns the jangly part). I and vi share the 6th-string root; V and IV share the 5th — the hand rocks between two anchor frets. Lighten the barre between strums so it breathes.',
      },
    ],

    'pop-50s-doowop': [
      {
        label: 'C-family doo-wop (Stand By Me grips)',
        level: 'intermediate',
        chords: [
          { shape: OPEN_C, note: 'I — open C' },
          { shape: OPEN_AM, note: 'vi — Am, the wistful drop' },
          { shape: OPEN_F, note: 'IV — small F, top four strings' },
          { shape: OPEN_G, note: 'V — open G' },
        ],
        tips: 'In C this is the literal Stand By Me / "ice-cream changes" set. The whole feeling is the C → Am drop in the first two bars — let that ring before the F–G turns it home. Slow triplet-feel strum, not eighths.',
      },
      {
        label: 'Barre doo-wop, upper register',
        level: 'intermediate',
        chords: [
          { shape: BARRE_MAJ_5, note: 'I — A-shape barre' },
          { shape: BARRE_MIN_6, note: 'vi — Em-shape, two frets down on the 6th string' },
          { shape: BARRE_MAJ_6, note: 'IV — E-shape barre' },
          { shape: BARRE_MAJ_5, note: 'V — A-shape, up the neck' },
        ],
        tips: 'A closed, vocal-group reading: roots walk between the 5th and 6th strings, so the hand never travels far. Mute the highest string and the four-voice grip starts to sound like the backing singers it came from.',
      },
    ],

    'pop-canon': [
      {
        label: 'Open Canon line (descending bass)',
        level: 'intermediate',
        chords: [
          { shape: OPEN_G, note: 'I — bass G' },
          { shape: OPEN_D, note: 'V — bass D (the line: 1 → 7 sits in the inner voice)' },
          { shape: OPEN_EM, note: 'vi — bass E' },
          { shape: OPEN_AM, note: 'iii — Am as the diatonic iii; bass B/A keeps the stair descending' },
          { shape: OPEN_C, note: 'IV — bass C, ready to loop back to G' },
        ],
        tips: 'The point of this line is the descending bass stair — pick the lowest string of each open shape as a bass note before strumming and you hear Pachelbel inside the pop. Five open chords, no barre, no capo needed in G.',
      },
      {
        label: 'Barre Canon, even register',
        level: 'intermediate',
        chords: [
          { shape: BARRE_MAJ_6, note: 'I — E-shape' },
          { shape: BARRE_MAJ_5, note: 'V — A-shape' },
          { shape: BARRE_MIN_6, note: 'vi — Em-shape' },
          { shape: BARRE_MIN_5, note: 'iii — Am-shape barre' },
          { shape: BARRE_MAJ_5, note: 'IV — A-shape' },
        ],
        tips: 'Closed shapes keep every chord the same density — useful under a busy vocal where the open version\'s ringing strings would clutter. Keep the top-string melody note audible; that moving top line is the second half of what makes the Canon line sing.',
      },
    ],

    'pop-mixo-bVII': [
      {
        label: 'Open Mixolydian vamp with sus colour',
        level: 'intermediate',
        chords: [
          { shape: OPEN_D, note: 'I — open D; wiggle to Dsus2/Dsus4 and back for the pop-rock "ring"' },
          { shape: OPEN_C, note: '♭VII — open C, the borrowed flat-seven' },
          { shape: OPEN_G, note: 'IV — open G; hammer the sus4 and pull back as the fill' },
        ],
        tips: 'In D this is D–C–G, the brightest open-string Mixolydian shape set. Decorate the held I and IV with sus2/sus4 hammer-ons (the verse decoration in countless pop-rock loops) — the chord stays major, your finger wiggles. Let the open strings ring through the C.',
      },
      {
        label: 'Barre power-vamp (pop-rock drive)',
        level: 'intermediate',
        chords: [
          { shape: BARRE_MAJ_6, note: 'I — E-shape, palm-muted in the verse' },
          { shape: BARRE_MAJ_5, note: '♭VII — A-shape two frets below the I root' },
          { shape: BARRE_MAJ_5, note: 'IV — A-shape, slides up from the ♭VII' },
        ],
        tips: 'The driving reading: palm-muted E-shape on the I, then the two A-shape majors share a grip and just slide — ♭VII to IV is a two-fret move. Open the palm mute on the chorus for the lift; the dynamic, not a new chord, is the chorus.',
      },
    ],

    'pop-minor-loop': [
      {
        label: 'Em campfire loop (Save Tonight grips)',
        level: 'intermediate',
        chords: [
          { shape: OPEN_EM, note: 'i — Em, the lone minor' },
          { shape: OPEN_C, note: '♭VI — open C' },
          { shape: OPEN_G, note: '♭III — open G' },
          { shape: OPEN_D, note: '♭VII — open D, leans back to Em' },
        ],
        tips: 'In E minor this is the literal Em–C–G–D of Save Tonight / Numb. After the single minor i, three open majors cascade home — keep the strum constant and let the all-major run feel anthemic against the minor tonic. Capo to move it to any minor key.',
      },
      {
        label: 'Barre minor loop, even and driving',
        level: 'intermediate',
        chords: [
          { shape: BARRE_MIN_6, note: 'i — Em-shape barre' },
          { shape: BARRE_MAJ_5, note: '♭VI — A-shape' },
          { shape: BARRE_MAJ_6, note: '♭III — E-shape' },
          { shape: BARRE_MAJ_5, note: '♭VII — A-shape' },
        ],
        tips: 'The closed reading for a fuller, rockier feel. The three majors alternate E-shape / A-shape so the hand stays in one neighbourhood; palm-mute the i for tension and release it across the three majors for the climb.',
      },
    ],
  },

  improv: {
    scales: [
      { over: 'I (major loops)', scale: 'major', why: 'Major pentatonic is the safe melodic home over the axis and doo-wop loops; add the full major scale for passing tones between chord tones.' },
      { over: 'vi / iii / Am (the minor chords)', scale: 'minor', why: 'Over the vi (the relative minor) the natural-minor / minor-pentatonic shape sits right under the major-key notes — same fingering, darker target tones.' },
      { over: 'I / IV (Mixolydian vamp)', scale: 'mixolydian', why: 'The ♭VII in the loop is the ♭7 of the key — Mixolydian builds it in, so a single scale covers the whole I–♭VII–IV vamp.' },
      { over: 'i (minor pop loop)', scale: 'minor', why: 'Natural minor over the i–♭VI–♭III–♭VII loop; every chord in the loop is diatonic to natural minor, so one scale covers all four.' },
    ],
    targetNotes:
      'In looping pop the melody usually lands on a common tone held across the changes — find the one or two notes that belong to all four chords and lean on them (the high open strings in the open-shape plays are doing exactly this). On the doo-wop loop, voice-lead the top note down I→vi (root to its own 3rd) for the signature sweetness.',
    licks: [
      {
        over: 'pop-axis',
        description: 'The "drone" decoration: keep the open B (and high e) ringing across all four open chords — G, D, Em, Cadd9 all contain or tolerate those open strings, which is why the Cadd9 voicing is chosen over plain C. The unchanging top notes are the modern-pop wash.',
        source: 'justinguitar.com — "Cadd9 & the G–D–Em–C trick"; en.wikipedia.org/wiki/The_Axis_of_Awesome',
      },
      {
        over: 'pop-mixo-bVII',
        description: 'The sus hammer-on fill: over the static I, strum the chord then hammer the sus4 and pull to sus2 in a steady eighth pulse (e.g. D → Dsus4 → D → Dsus2). It implies motion over one held chord — the standard trick for filling bars in a slow pop-rock loop.',
        source: 'fretjam.com / guitar.com — "sus2 & sus4 chord embellishments"; andyguitar.co.uk pop-rock strumming',
      },
    ],
  },
}
