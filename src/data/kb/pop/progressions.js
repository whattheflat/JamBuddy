// Pop progressions. Loops and song references verified against:
//   en.wikipedia.org/wiki/The_Axis_of_Awesome (I–V–vi–IV "four chords"),
//   en.wikipedia.org/wiki/'50s_progression (doo-wop I–vi–IV–V),
//   classicfm.com (Maroon 5 "Memories" = Pachelbel I–V–vi–iii–IV line),
//   en.wikipedia.org/wiki/List_of_variations_on_Pachelbel's_Canon,
//   tunableapp.com chord-progressions (i–♭VI–♭III–♭VII minor loop).
// Deliberately differentiated from the rock pack: rock-axis already owns the
// I-started axis and rock-mixo-vamp the I–♭VII–IV vamp; here the axis is framed
// for capo/open pop guitar, the Mixolydian move gets honest pop songs, and the
// minor loop is the relative-minor (vi-started) reading, not rock's i–♭VII–♭VI–V.
export default [
  {
    id: 'pop-axis',
    name: 'Four chords (I–V–vi–IV)',
    rn: ['I', 'V', 'vi', 'IV'],
    degrees: [0, 7, 9, 5],
    qualities: ['maj', 'maj', 'min', 'maj'],
    bars: [1, 1, 1, 1],
    mode: 'major',
    songs: ['No Woman No Cry — Bob Marley', 'Someone Like You — Adele (verse loop)', 'Let It Be — The Beatles'],
    tip: 'The single most-used loop in modern pop (the Axis of Awesome "four chords"). On guitar it is really a capo decision: pick the capo position that lets you play it as open G–D–Em–C shapes and the whole song rings.',
  },
  {
    id: 'pop-50s-doowop',
    name: "'50s / doo-wop (I–vi–IV–V)",
    rn: ['I', 'vi', 'IV', 'V'],
    degrees: [0, 9, 5, 7],
    qualities: ['maj', 'min', 'maj', 'maj'],
    bars: [1, 1, 1, 1],
    mode: 'major',
    songs: ['Stand By Me — Ben E. King', 'Earth Angel — The Penguins', 'Blue Moon (the Marcels, 1961)'],
    tip: 'The "ice-cream changes": dropping from the bright I straight to vi is the sweet, wistful doo-wop gesture. It loops forever — Stand By Me never leaves these four chords.',
  },
  {
    id: 'pop-canon',
    name: 'Canon pop line (I–V–vi–iii–IV)',
    rn: ['I', 'V', 'vi', 'iii', 'IV'],
    degrees: [0, 7, 9, 4, 5],
    qualities: ['maj', 'maj', 'min', 'min', 'maj'],
    bars: [1, 1, 1, 1, 1],
    mode: 'major',
    songs: ['Memories — Maroon 5 (Pachelbel, set in B)', "Don't Look Back in Anger — Oasis", 'Graduation (Friends Forever) — Vitamin C'],
    tip: 'Pachelbel\'s Canon wearing pop clothes — the axis with an extra iii inserted between vi and IV. The bass walks down a clean diatonic stair (1–7–6–5–4), which is what makes the line feel "classical".',
  },
  {
    id: 'pop-mixo-bVII',
    name: 'Mixolydian pop (I–♭VII–IV)',
    rn: ['I', '♭VII', 'IV'],
    degrees: [0, 10, 5],
    qualities: ['maj', 'maj', 'maj'],
    bars: [2, 1, 1],
    mode: 'mixolydian',
    songs: ['Clocks — Coldplay (♭VII colour)', 'Cigarettes & Alcohol — Oasis', 'Royals — Lorde (verse)'],
    tip: 'Swap the polite V for the borrowed ♭VII and the loop turns anthemic without a single minor chord. Every chord is major, so a single open or capo position covers all three with one hand shape moved twice.',
  },
  {
    id: 'pop-minor-loop',
    name: 'Minor pop loop (i–♭VI–♭III–♭VII)',
    rn: ['i', '♭VI', '♭III', '♭VII'],
    degrees: [0, 8, 3, 10],
    qualities: ['min', 'maj', 'maj', 'maj'],
    bars: [1, 1, 1, 1],
    mode: 'minor',
    songs: ['Save Tonight — Eagle-Eye Cherry', 'Numb — Linkin Park', "Self Esteem — The Offspring"],
    tip: 'The axis read from its relative minor: start on vi and the same family of chords turns dark and anthemic. After the lone minor i, three major chords cascade home — an all-major run inside a minor key.',
  },
]
