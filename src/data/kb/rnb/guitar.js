// R&B / neo-soul guitar pack. Shapes verified by note-spelling against:
// pickupmusic.com (m9/maj9 grips, slide-into-chords), fundamental-changes.com
// (The Neo-Soul Guitar Book vocabulary, hammer-ons inside shapes),
// premierguitar.com (Curtis Mayfield figures — standard-tuning adaptations;
// originals are in open F# tuning), justinguitar.com (Mayfield/Hendrix fills),
// musicradar.com (D'Angelo Brown Sugar breakdown), landr.com & hearandplay.com
// (gospel borrowed-iv), brltheory.com (the Dilla feel).

// The core neo-soul grips.
const M9_5 = { rootStr: 5, offsets: ['x', 0, -2, 0, 0, 'x'], fingers: [0, 2, 1, 3, 4, 0] }      // R-♭3-♭7-9
const M9_6 = { rootStr: 6, offsets: [0, 'x', 0, 0, 0, 2], fingers: [1, 0, 2, 3, 3, 4] }         // R-♭7-♭3-5-9
const M11_C = { rootStr: 6, offsets: [0, 'x', 0, 0, -2, 'x'], fingers: [2, 0, 3, 4, 1, 0] }     // R-♭7-♭3-11 compact
const M11_BARRE = { rootStr: 6, offsets: [0, 0, 0, 0, 0, 0], fingers: [1, 1, 1, 1, 1, 1] }      // one-finger m11
const MAJ9_5 = { rootStr: 5, offsets: ['x', 0, -1, 1, 0, 'x'], fingers: [0, 2, 1, 4, 3, 0] }    // R-3-7-9
const MAJ7_5 = { rootStr: 5, offsets: ['x', 0, 2, 1, 2, 'x'], fingers: [0, 1, 3, 2, 4, 0] }     // R-5-7-3
const MAJ7_BARRE_6 = { rootStr: 6, offsets: [0, 2, 1, 1, 0, 0], fingers: [1, 4, 2, 3, 1, 1] }   // E-shape maj7 (embellishment host)
const DOM9_5 = { rootStr: 5, offsets: ['x', 0, -1, 0, 0, 0], fingers: [0, 2, 1, 3, 3, 3] }      // R-3-♭7-9-5
const DOM13_6 = { rootStr: 6, offsets: [0, 'x', 0, 1, 2, 'x'], fingers: [1, 0, 2, 3, 4, 0] }    // R-♭7-3-13
const NINESUS = { rootStr: 5, offsets: ['x', 0, 0, 0, 0, 0], fingers: [0, 1, 1, 1, 1, 1] }      // R-4-♭7-9-5 (the 9sus barre)
const HENDRIX = { rootStr: 5, offsets: ['x', 0, -1, 0, 1, 'x'], fingers: [0, 2, 1, 3, 4, 0] }   // 7♯9
const SIX9_5 = { rootStr: 5, offsets: ['x', 0, -1, -1, 0, 0], fingers: [0, 3, 1, 2, 4, 4] }     // R-3-6-9-5 (Motown I-colour)
const M6_4 = { rootStr: 4, offsets: ['x', 'x', 0, -2, 0, -2], fingers: [0, 0, 3, 1, 4, 2] }     // R-♭3-6-R (the borrowed iv)
const TOP3_MAJ = { rootStr: 1, offsets: ['x', 'x', 'x', 1, 0, 0], fingers: [0, 0, 0, 2, 1, 1] } // plain triad, top strings

export default {
  styleIntro:
    'Against keys-heavy neo-soul arrangements the guitar is a colourist: small rootless grips on the top strings, double-stop fills between vocal phrases, and chord stabs placed just behind the drums. Agree on extensions with the keys player, stay out of their octave, and treat silence as part of the part.',

  comping: [
    {
      label: 'Pluck and mute',
      rhythm: 'fingerstyle stabs + muted ghost 16ths',
      description: 'Pluck the grip with thumb and fingers, release fret pressure instantly for the staccato, fill between hits with muted ghost strums. Per-note dynamic control is why the genre is fingerstyle.',
    },
    {
      label: 'The neo-soul slide',
      rhythm: 'grip formed a half-step away, slid in on the beat',
      description: 'Assemble the full chord shape a half-step below (or above) the target, pluck, slide the whole grip in. The signature move — most common on the m9 and maj9 grips.',
    },
    {
      label: 'Mayfield hammer vocabulary',
      rhythm: 'one finger moves inside a held shape',
      description: 'Hold the barre, hammer single embellishments: 9→3 on the B string (A-shape), 5→6 on the B string (the My Girl move), ♭3→11 on the G string (minor shapes). Little Wing is this vocabulary at ballad tempo.',
    },
    {
      label: 'Cropper 6ths',
      rhythm: 'diatonic 6ths slid in from a fret below',
      description: 'Double-stop 6ths on the G+e string pair walking the scale — the Soul Man hook. One ladder per fill, then get out of the vocal\'s way.',
    },
    {
      label: 'The Dilla feel',
      rhythm: 'everything a hair behind the grid',
      description: 'Lay stabs slightly behind the drums and keep ghost 16ths even — displaced by less than a subdivision, drifting back across the phrase. Never rush a fill; "perfectly imperfect."',
    },
  ],

  plays: {
    'rnb-mediant-circle': [
      {
        label: 'm9 circle, slid into',
        level: 'intermediate',
        chords: [
          { shape: M9_5, extensions: ['9'], note: 'iii9 — slide in from a half-step below' },
          { shape: M9_5, extensions: ['9'], note: 'vi9' },
          { shape: M9_5, extensions: ['9'], note: 'ii9' },
          { shape: DOM13_6, extensions: ['13'], note: 'V13' },
        ],
        tips: 'One grip walks the whole circle — the move IS the slide into each new root. Keep every stab behind the beat; the drums are ahead of you on purpose.',
      },
      {
        label: 'm11 colour set',
        level: 'intermediate',
        chords: [
          { shape: M11_C, extensions: ['11'], note: 'iii11' },
          { shape: M9_6, extensions: ['9'], note: 'vi9 — 9 on top' },
          { shape: M11_C, extensions: ['11'], note: 'ii11' },
          { shape: HENDRIX, extensions: ['#9'], note: 'V7♯9 — the soul exclamation' },
        ],
        tips: 'The 11 grips are darker and hollower than the 9s — use this set on the verse, the m9 set on the hook. The ♯9 V is the once-per-chorus spice, not the default.',
      },
    ],

    'rnb-6251': [
      {
        label: 'Stevie cadence (9s and the 9sus)',
        level: 'intermediate',
        chords: [
          { shape: M9_5, extensions: ['9'], note: 'vi9' },
          { shape: DOM9_5, extensions: ['9'], note: 'II9 — the secondary dominant' },
          { shape: NINESUS, extensions: ['b7', '9'], note: 'V9sus — one-finger barre, suspended sweetness' },
          { shape: SIX9_5, extensions: ['6', '9'], note: 'I6/9 — resolve without a leading tone' },
        ],
        tips: 'The 9sus never sharpens into a plain dominant — it melts. Resolve to the 6/9 rather than a maj7 and the cadence lands like a sigh instead of a full stop.',
      },
      {
        label: 'Verse set with the ♯9 lift',
        level: 'intermediate',
        chords: [
          { shape: M11_C, extensions: ['11'], note: 'vi11' },
          { shape: HENDRIX, extensions: ['#9'], note: 'II7♯9 — grit before the suspension' },
          { shape: NINESUS, extensions: ['b7', '9'], note: 'V9sus' },
          { shape: TOP3_MAJ, note: 'plain triad on top — let the bass own the root' },
        ],
        tips: 'Ending on a bare high triad after three extended chords is the dynamic trick: the simplest chord in the progression hits hardest because of what preceded it.',
      },
    ],

    'rnb-maj7-vamp': [
      {
        label: 'maj9 pair',
        level: 'intermediate',
        chords: [
          { shape: MAJ9_5, extensions: ['9'], note: 'Imaj9' },
          { shape: MAJ9_5, extensions: ['9'], note: 'IVmaj9 — same grip, five frets up (or string set over)' },
        ],
        tips: 'Two grips, four bars, infinite patience. Vary the pluck pattern, not the harmony — and if a keys player holds these voicings, drop to double-stop 6ths fills instead.',
      },
      {
        label: 'Embellished barres (Mayfield/Hendrix)',
        level: 'intermediate',
        chords: [
          { shape: MAJ7_BARRE_6, note: 'Imaj7 — hammer 5→6 on the B string, 9→3 inside' },
          { shape: MAJ7_5, note: 'IVmaj7 — answer with the A-shape hammers' },
        ],
        tips: 'The chord is a house and the hammers are someone moving around inside it. One embellishment per bar maximum — Castles Made of Sand is mostly air.',
      },
    ],

    'rnb-dorian': [
      {
        label: "D'Angelo pair",
        level: 'intermediate',
        chords: [
          { shape: M9_5, extensions: ['9'], note: 'i9' },
          { shape: DOM9_5, extensions: ['9'], note: 'IV9 — the raised 6th lives here' },
        ],
        tips: 'Same dyad as the funk vamp at two-thirds the tempo: drag every hit behind the kick, ghost the 16ths unevenly, and let the pocket wobble — that wobble is the genre.',
      },
      {
        label: 'Barre wash (m11 + 13)',
        level: 'intermediate',
        chords: [
          { shape: M11_BARRE, extensions: ['11'], note: 'i11 — one finger, lay it across' },
          { shape: DOM13_6, extensions: ['13'], note: 'IV13' },
        ],
        tips: 'The lazy-looking version that sounds the deepest. Half-press the barre between hits for the pitchless scratch — texture first, harmony second.',
      },
    ],

    'rnb-gospel-amen': [
      {
        label: 'The Amen cadence',
        level: 'intermediate',
        chords: [
          { shape: MAJ7_5, note: 'IVmaj7' },
          { shape: M6_4, note: 'iv6 — the borrowed minor, one semitone falls' },
          { shape: MAJ9_5, extensions: ['9'], note: 'Imaj9 — home, with the 9 glowing on top' },
        ],
        tips: 'Voice-lead the 3rd of the IV down a semitone and hold everything else — the whole cadence is one finger\'s journey. Slow it down further than feels right.',
      },
      {
        label: 'Barre version with the high iv',
        level: 'intermediate',
        chords: [
          { shape: MAJ7_BARRE_6, note: 'IVmaj7' },
          { shape: M6_4, note: 'iv6 on the top four strings' },
          { shape: MAJ7_5, note: 'Imaj7' },
        ],
        tips: 'For the gospel walk, insert a passing diminished between any two diatonic chords a step apart (I→♯i°→ii) — same borrowed-from-the-choir logic as the iv.',
      },
    ],

    'rnb-justthetwo': [
      {
        label: 'Smooth-soul 9ths and the 13',
        level: 'intermediate',
        chords: [
          { shape: MAJ9_5, extensions: ['9'], note: '♭VImaj9 — the lush opener' },
          { shape: DOM13_6, extensions: ['13'], note: 'V13 — dominant colour without the bark' },
          { shape: M9_5, extensions: ['9'], note: 'i9 — home, briefly' },
          { shape: M9_5, extensions: ['9'], note: '♭vii9 — same grip, two frets down' },
          { shape: DOM9_5, extensions: ['9'], note: '♭III9 — the V of ♭VI: the loop re-arms itself' },
        ],
        tips: 'Treat the last two chords as one gesture — a ii–V pointing at the ♭VImaj9 that starts the next lap (in the original they share a single bar). Solo target: the major 7 of ♭VI is the sweetest note in the loop, and the ♭III9\'s ♭7 falls a half step onto it.',
      },
      {
        label: 'Leaner set with the altered V',
        level: 'intermediate',
        chords: [
          { shape: MAJ7_5, note: '♭VImaj7 — plainer, room for the vocal' },
          { shape: HENDRIX, extensions: ['#9'], note: 'V7♯9 — the minor-key dominant with grit, one fret below ♭VI' },
          { shape: M11_C, extensions: ['11'], note: 'i11 — dark and hollow' },
          { shape: M9_6, extensions: ['9'], note: '♭vii9 — low root, 9 on top' },
          { shape: DOM13_6, extensions: ['13'], note: '♭III13' },
        ],
        tips: 'The verse-register version: fewer notes, lower voicings, and the ♯9 on the V because in a minor key the dominant wants tension. Save the first play\'s glossy 9ths for the hook — the contrast between the two sets is the arrangement.',
      },
    ],

    'rnb-chromatic-vi': [
      {
        label: 'Chromatic descent on the A string',
        level: 'intermediate',
        chords: [
          { shape: SIX9_5, extensions: ['6', '9'], note: 'I6/9 — Motown sunshine on the tonic' },
          { shape: M9_5, extensions: ['9'], note: 'vi9 — root high on the A string' },
          { shape: DOM9_5, extensions: ['9'], note: '♭VI9 — the borrowed dominant, one fret down' },
          { shape: DOM9_5, extensions: ['9'], note: 'V9 — one more fret: the slide lands' },
        ],
        tips: 'The last three roots fall one fret at a time down a single string — vi, ♭VI7, V is chromatic planing, the same trick as the jazz tritone sub seen from above (♭VI7 subs for II7). Target the ♭VI7\'s 3rd: it slides a half step down onto the 3rd of V.',
      },
      {
        label: 'Low-string 13th descent, triad on top',
        level: 'intermediate',
        chords: [
          { shape: TOP3_MAJ, note: 'I — a bare high triad; let the bass state the root' },
          { shape: M9_6, extensions: ['9'], note: 'vi9 — drop to the low-E root' },
          { shape: DOM13_6, extensions: ['13'], note: '♭VI13 — one fret down, horn-section colour' },
          { shape: DOM13_6, extensions: ['13'], note: 'V13 — one more fret; hold it for the horn hit' },
        ],
        tips: 'The register story: start thin and high, then walk the low E string down in half steps with big 13th colour — the guitar plays the horn line. Punch the two 13ths on the beat and mute instantly; Sir Duke swings because of the silence between hits.',
      },
    ],
  },

  improv: {
    scales: [
      { over: 'i9 / m9 vamps', scale: 'dorian', why: 'The neo-soul default — Brown Sugar is pure E Dorian. ("Neo-soul scale" in lesson jargon ≈ minor pentatonic + the 9; an alias, not a different scale.)' },
      { over: 'maj7 / maj9 vamps', scale: 'major', why: 'Major pentatonic with the 9th and 6th emphasized — land on colours, not roots.' },
      { over: 'V9sus / II9', scale: 'mixolydian', why: 'Mixolydian of each dominant; over the 9sus avoid the 3rd entirely — the suspension is the point.' },
      { over: 'i–iv minor vamps', scale: 'minor', why: 'Aeolian when the iv is minor (Didn\'t Cha Know) — the ♭6 differentiates it from the Dorian vamps.' },
    ],
    targetNotes:
      'Target the 9ths and 13ths, never the roots — over a m9 land on its 9, over a 13 land on its 13. The melodic vocabulary is double-stops (3rds, 4ths, 6ths) slid in from a fret below, and pentatonics stacked in 4ths for the modern sound.',
    licks: [
      {
        over: 'rnb-maj7-vamp',
        description: 'Curtis Mayfield figure (standard-tuning adaptation — Mayfield tuned to open F♯): hammer cells inside the held shape, landing on the 3rd and the 9th. The direct ancestor of Little Wing.',
        tab: '   Figure A (land on the 3rd)     Figure B (land on the 9th→7th)\ne|---5h7p5--------|              e|--5-------5------5------\nB|----------7-----|              B|-----5h7-----p5---------\nG|----------------|              G|---------------------6--\n    A  B  A   F#                     (A) E  F#  E       C#   (in D major)',
        source: 'Premier Guitar "Digging Deeper: Curtis Mayfield"; JustinGuitar "Mayfield & Hendrix Style Fills" (RF-101)',
      },
    ],
  },
}
