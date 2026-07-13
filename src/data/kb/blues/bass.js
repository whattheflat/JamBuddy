// Blues bass pack (task P-41) — the first bass cell. Patterns are degree-based
// per SCHEMA.md "Bass play": every note is either a `deg` resolved through the
// step's quality or a typed terminal `approach` whose pitch derives from the
// NEXT station's root (chrom-below = next−1, chrom-above = next+1,
// fifth-of-next = next+7). Every pitch-class and interval claim in the notes,
// feels and tips below was computed in a reference key (C) before writing:
// I=C7, IV=F7, V=G7; minor form Cm7/Fm7/A♭7/G7; turnaround C7/A7/Dm7/G7.
//
// Lines and treatments sourced from:
// Ed Friedland, "Blues Bass — A Guide to the Essential Styles and Techniques"
// (Hal Leonard Bass Method Stylistic Supplement, 2005) — the boogie/shuffle
// cells (R–3–5–6, R–5–6), two-feel, walkups, and the turnaround treatments;
// its studied repertoire includes this cell's progression songs ("Sweet Home
// Chicago", "Pride and Joy", "Hide Away", "The Thrill Is Gone");
// Ed Friedland, "Building Walking Bass Lines" (Hal Leonard) — the approach-note
// method this schema's typed approaches encode (chromatic below/above,
// dominant/fifth approach into the next root);
// Jerry Jemmott (bass on B.B. King's "Completely Well" sessions, 1969 — "The
// Thrill Is Gone"): Jemmott describes his defining move on that record as the
// half-step-below approach slid into the tonic (Guitar World bassist
// interviews) — the minor play's approach language;
// Willie Dixon — the Chess Records lane (upright behind Muddy Waters and on
// Chuck Berry sessions) that the quarter-note and eighth-note boogie lines
// double; the ramble figure itself is the boogie-woogie piano left hand
// (Pinetop Smith lineage — see blues/piano.js) moved to the bass;
// Tommy Shannon (Double Trouble) — the driving-shuffle lane the eighth-note
// ramble lives in on "Pride and Joy"-style Texas blues.
// Pedagogy frame: docs/learn-curriculum.md — lock with the kick, target the
// changes, walk as a signal rather than a default.

// Reusable cells (degree strings; quarters unless noted). Reference key C.
const BOOGIE = [                      // 1–3–5–6: C E G A — the major-triad walkup plus the 6th
  { deg: '1', beat: 1 }, { deg: '3', beat: 2 }, { deg: '5', beat: 3 }, { deg: '6', beat: 4 },
]
const CHI_CELL = [                    // 1–5–6–5: C G A G — the bass half of the Jimmy Reed dyad rock
  { deg: '1', beat: 1 }, { deg: '5', beat: 2 }, { deg: '6', beat: 3 }, { deg: '5', beat: 4 },
]
const RAMBLE = [                      // 1–3–5–6–♭7–6–5–3 in swung 8ths: C E G A B♭ A G E
  { deg: '1', beat: 1 }, { deg: '3', beat: 1.5 }, { deg: '5', beat: 2 }, { deg: '6', beat: 2.5 },
  { deg: 'b7', beat: 3 }, { deg: '6', beat: 3.5 }, { deg: '5', beat: 4 }, { deg: '3', beat: 4.5 },
]
const R5_OCT = [                      // slow 12/8 pillar: root, fifth, octave (offsets 0, 7, 12)
  { deg: '1', beat: 1 }, { deg: '5', beat: 3 }, { deg: '1', octave: 1, beat: 4 },
]
const BOX_RIFF = [                    // 1–3–4–5, quality-resolved: Cm7 → C E♭ F G; G7 → G B C D
  { deg: '1', beat: 1 }, { deg: '3', beat: 2 }, { deg: '11', beat: 3 }, { deg: '5', beat: 4 },
]

export default {
  styleIntro:
    'Blues bass is the handshake between the kick drum and the chord: roots on the strong beats, everything else in service of the next change. The craft is targeting — knowing which note pulls the band into bar 5, bar 9, and the top of the next chorus — and the discipline is repetition: pick a cell, lock it with the drummer, and let the form (not your fingers) provide the variety.',

  comping: [
    {
      label: 'Two-feel (root and fifth)',
      rhythm: 'half-note pulse: root on 1, fifth on 3',
      description:
        'The oldest blues bass job: two notes a bar, fat and unhurried. The fifth can sit above or below the root (same pitch class); the groove lives in note length, not note count. Default lane for slow blues and country blues.',
    },
    {
      label: 'Quarter-note boogie',
      rhythm: 'four swung quarters, locked with the kick',
      description:
        'One note per beat walking the chord — 1–3–5–6 or 1–5–6–5 cells transposed to each station. The shuffle swing lives in the drummer; the bass plays even quarters and lets note placement carry the lean.',
    },
    {
      label: '12/8 slow blues',
      rhythm: 'beats 1 and 3 weighted; triplet air between',
      description:
        'At slow-blues tempo every beat splits in three. The bass states less, not more: root and fifth as pillars, then a single pickup note — usually a half-step under the next root — sliding the band into the change. The Jerry Jemmott "Thrill Is Gone" lane.',
    },
  ],

  plays: {
    'blues-12bar': [
      {
        label: 'Quarter-note boogie with walking seams',
        level: 'foundation',
        feel: 'medium shuffle — even quarters locked with the kick; the walkups do the leaning',
        chords: [
          { pattern: BOOGIE, note: '1–3–5–6 — the triad plus the 6th; home base' },
          { pattern: BOOGIE },
          { pattern: BOOGIE },
          {
            // C D E♭ E → F: whole step then three half-steps, the classic blue-note walkup.
            pattern: [
              { deg: '1', beat: 1 }, { deg: '9', beat: 2 }, { deg: 'b3', beat: 3 },
              { approach: 'chrom-below', beat: 4 },
            ],
            note: 'walk up into the IV: 1–2–♭3, then the half-step under its root',
          },
          { pattern: BOOGIE, note: 'same cell, new root — the boogie transposes, it never changes' },
          {
            // F G A B → C: 1–2–3 of the IV, then the half-step under home.
            pattern: [
              { deg: '1', beat: 1 }, { deg: '9', beat: 2 }, { deg: '3', beat: 3 },
              { approach: 'chrom-below', beat: 4 },
            ],
            note: 'walk home: 1–2–3, then a half-step under the I',
          },
          {
            // C A B♭ B → C: the 6–♭7–7–1 climb. The chord's 7th degree is out of the
            // degree vocabulary over dom7, so the final half-step is TYPED — the
            // approach derives its pitch from bar 8's root, which is the same I.
            pattern: [
              { deg: '1', beat: 1 }, { deg: '6', beat: 2 }, { deg: 'b7', beat: 3 },
              { approach: 'chrom-below', beat: 4 },
            ],
            note: 'the boogie climb: 6–♭7, then chromatically under the octave root of bar 8',
          },
          {
            // C D E F♯ → G: same 1–2–3 walkup aimed at the V; F♯ is the key's ♯4.
            pattern: [
              { deg: '1', beat: 1 }, { deg: '9', beat: 2 }, { deg: '3', beat: 3 },
              { approach: 'chrom-below', beat: 4 },
            ],
            note: 'bar 8 aims at the V: 1–2–3, then the half-step under its root',
          },
          {
            // G B D E → F: up the V triad; E is the half-step under the IV's root.
            pattern: [
              { deg: '1', beat: 1 }, { deg: '3', beat: 2 }, { deg: '5', beat: 3 },
              { approach: 'chrom-below', beat: 4 },
            ],
            note: 'up the triad, then duck a half-step under the IV',
          },
          {
            // F A C B → C: up the IV triad to the key's root, dip under it, resolve.
            pattern: [
              { deg: '1', beat: 1 }, { deg: '3', beat: 2 }, { deg: '5', beat: 3 },
              { approach: 'chrom-below', beat: 4 },
            ],
            note: 'the IV\'s 5th IS the key\'s root — touch it, dip under, land',
          },
          {
            // C B♭ A A♭ → G: the turnaround descent 1–♭7–6–♭6, the ♭6 typed as the
            // approach from above (V root + 1). Four consecutive tones: whole step,
            // half step, half step, then the half-step sink onto the V.
            pattern: [
              { deg: '1', beat: 1 }, { deg: 'b7', beat: 2 }, { deg: '6', beat: 3 },
              { approach: 'chrom-above', beat: 4 },
            ],
            note: 'the turnaround descent: 1–♭7–6–♭6 sinking onto the V',
          },
          {
            // G G A B → C: pedal the V, then walk the key's 6th and 7th home.
            pattern: [
              { deg: '1', beat: 1 }, { deg: '1', beat: 2 }, { deg: '9', beat: 3 },
              { approach: 'chrom-below', beat: 4 },
            ],
            note: 'double the root, then climb the last two steps into the next chorus',
          },
        ],
        position: 'one position around the key root; open E and A do the low roots when the key allows',
        tips: 'Approach-note targeting is the whole craft: beats 1–3 belong to THIS chord, beat 4 belongs to the NEXT one. Every seam here is the same move — walk toward the coming root and place a half-step under it — so once your ear owns bar 4, bars 6, 8, 9 and 10 are free. The one seam that differs is bar 11: the classic descent (1–♭7–6–♭6) approaches the V from a half-step ABOVE, because the ♭6 of the key already lives there.',
      },
      {
        label: 'Eighth-note ramble (jump / rock\'n\'roll)',
        level: 'intermediate',
        feel: 'driving swung 8ths — the boogie-woogie piano left hand on four strings, doubling the guitar\'s ramble',
        chords: [
          { pattern: RAMBLE, note: 'up 1–3–5–6–♭7 and back down — peaks a minor 7th above the root' },
          { pattern: RAMBLE }, { pattern: RAMBLE },
          { pattern: RAMBLE, note: 'the last 8th (the 3rd) is already a half-step under the IV — the figure walks itself into bar 5' },
          { pattern: RAMBLE }, { pattern: RAMBLE },
          { pattern: RAMBLE }, { pattern: RAMBLE },
          {
            // G B D E F E D E → F: bar 9's tail bends — the V's closing 3rd (B) sits a
            // tritone from the IV's root (F), so the last 8th becomes the chromatic
            // approach (E) and the bar ends walking 5–6 → root of the IV.
            pattern: [
              { deg: '1', beat: 1 }, { deg: '3', beat: 1.5 }, { deg: '5', beat: 2 }, { deg: '6', beat: 2.5 },
              { deg: 'b7', beat: 3 }, { deg: '6', beat: 3.5 }, { deg: '5', beat: 4 },
              { approach: 'chrom-below', beat: 4.5 },
            ],
            note: 'V into IV is the figure\'s one rough seam (a tritone) — swap the last 8th for the half-step under the IV',
          },
          { pattern: RAMBLE },
          { pattern: RAMBLE },
          { pattern: RAMBLE, note: 'bar 12 needs no edit: the closing 3rd of the V is a half-step under the returning tonic — the push is built in' },
        ],
        position: 'one position; the figure spans root to ♭7, so it sits on two strings',
        tips: 'The ramble is an agreement, not a line — guitar, piano left hand and bass all play it in octaves and nobody varies it (that IS the sound: Chess-session discipline, Willie Dixon behind Chuck Berry). Note what the figure buys you for free: it closes every bar on the chord\'s 3rd, which into the IV — and from the V back home — is already the chromatic approach. Only bar 9\'s V-to-IV seam needs a repair, and one eighth note fixes it.',
      },
    ],

    'blues-quickchange': [
      {
        label: 'Chicago shuffle cell (R–5–6–5)',
        level: 'foundation',
        feel: 'Chicago shuffle — fat quarters, the 6th answering the 5th; the bass half of the Jimmy Reed rock',
        chords: [
          {
            // C G A E → F: the cell with its 4th beat swapped for the approach —
            // E, a half-step under the IV's root, is the I's own major 3rd.
            pattern: [
              { deg: '1', beat: 1 }, { deg: '5', beat: 2 }, { deg: '6', beat: 3 },
              { approach: 'chrom-below', beat: 4 },
            ],
            note: 'beat 4 announces the quick change — and that approach note is the I\'s own 3rd',
          },
          {
            // F C D D♭ → C: 6th, then chromatic slide D–D♭–C back home from above.
            pattern: [
              { deg: '1', beat: 1 }, { deg: '5', beat: 2 }, { deg: '6', beat: 3 },
              { approach: 'chrom-above', beat: 4 },
            ],
            note: 'exit by half-steps: the IV\'s 6th slides 6–♭6 onto the I\'s root',
          },
          { pattern: CHI_CELL, note: 'home — root, fifth, sixth, fifth' },
          { pattern: CHI_CELL, note: 'plain into bar 5: the cell\'s last 5th falls a whole step onto the IV\'s root' },
          { pattern: CHI_CELL },
          {
            // F C D D♭ → C — the same exit as bar 2.
            pattern: [
              { deg: '1', beat: 1 }, { deg: '5', beat: 2 }, { deg: '6', beat: 3 },
              { approach: 'chrom-above', beat: 4 },
            ],
            note: 'the bar-2 exit again — the quick change taught you this one early',
          },
          { pattern: CHI_CELL },
          {
            // C G A F♯ → G: cell into the half-step under the V.
            pattern: [
              { deg: '1', beat: 1 }, { deg: '5', beat: 2 }, { deg: '6', beat: 3 },
              { approach: 'chrom-below', beat: 4 },
            ],
            note: '6 down to ♯4, half-step under the V',
          },
          {
            // G B D E → F: up the V triad, then a half-step under the IV.
            pattern: [
              { deg: '1', beat: 1 }, { deg: '3', beat: 2 }, { deg: '5', beat: 3 },
              { approach: 'chrom-below', beat: 4 },
            ],
            note: 'V to IV: up the triad, duck under',
          },
          {
            // F A C B → C: up the IV triad, dip under home, land.
            pattern: [
              { deg: '1', beat: 1 }, { deg: '3', beat: 2 }, { deg: '5', beat: 3 },
              { approach: 'chrom-below', beat: 4 },
            ],
            note: 'touch the key\'s root (the IV\'s 5th), dip a half-step, resolve',
          },
          {
            // C G A F♯ → G — the bar-8 walkup again; bar 11 aims at the V.
            pattern: [
              { deg: '1', beat: 1 }, { deg: '5', beat: 2 }, { deg: '6', beat: 3 },
              { approach: 'chrom-below', beat: 4 },
            ],
            note: 'same aim as bar 8 — the turnaround\'s V arrives on schedule',
          },
          {
            // G F E D → C: 1–♭7–6–5 of the V = the key's 5–4–3–2 walking down to home.
            pattern: [
              { deg: '1', beat: 1 }, { deg: 'b7', beat: 2 }, { deg: '6', beat: 3 },
              { deg: '5', beat: 4 },
            ],
            note: 'walk straight down the scale — the key\'s 5–4–3–2 — into the next chorus',
          },
        ],
        position: 'first five frets; the R–5–6 cell sits across two strings in one hand position',
        tips: 'The R–5–6–5 rock is the same figure the rhythm guitarist plays as dyads (the Jimmy Reed shuffle) — you are the bottom note of that conversation, so match the guitarist\'s swing exactly or the whole band flams. The quick change is a hearing exam: beat 4 of bar 1 is where you tell the band you knew it was coming. And notice the economy — two approach flavors (half-step from below, half-step from above) cover every seam this play marks; the two it leaves plain (bars 4 and 12) already move by step on their own.',
      },
    ],

    'blues-8bar': [
      {
        label: 'Two-feel with walking seams (Key to the Highway)',
        level: 'intermediate',
        feel: 'easy shuffle two-feel — roots and fifths as the default, walking only where the form moves',
        chords: [
          {
            // C E F F♯ → G: the 1–3–4–♯4 walkup, ♯4 typed as the approach under the V.
            pattern: [
              { deg: '1', beat: 1 }, { deg: '3', beat: 2 }, { deg: '11', beat: 3 },
              { approach: 'chrom-below', beat: 4 },
            ],
            note: 'the V is already in bar 2 — walk 1–3–4–♯4 straight at it',
          },
          {
            // G B D E → F: up the V triad, half-step under the IV.
            pattern: [
              { deg: '1', beat: 1 }, { deg: '3', beat: 2 }, { deg: '5', beat: 3 },
              { approach: 'chrom-below', beat: 4 },
            ],
            note: 'and immediately down to the IV — up the triad, duck under',
          },
          {
            pattern: [{ deg: '1', beat: 1 }, { deg: '5', beat: 3 }],
            note: 'two-feel — the form finally sits still for a bar',
          },
          {
            // F A B♭ B → C: the SAME 1–3–4–♯4 walkup — IV to I is also root motion
            // up a perfect fifth, so the shape transfers note-for-note.
            pattern: [
              { deg: '1', beat: 1 }, { deg: '3', beat: 2 }, { deg: '11', beat: 3 },
              { approach: 'chrom-below', beat: 4 },
            ],
            note: 'the bar-1 walkup again: IV→I is the same fifth-up motion as I→V',
          },
          {
            pattern: [{ deg: '1', beat: 1 }, { deg: '5', beat: 3 }],
            note: 'two-feel — and beat 3 (the I\'s 5th) is already the V\'s root, naming what comes',
          },
          {
            // G D B → C: root, fifth, then the half-step under home.
            pattern: [
              { deg: '1', beat: 1 }, { deg: '5', beat: 3 },
              { approach: 'chrom-below', beat: 4 },
            ],
            note: 'stay in the two-feel and add one pickup note under the I',
          },
          {
            // C B♭ A A♭ → G: the turnaround descent, ♭6 typed as the approach from above.
            pattern: [
              { deg: '1', beat: 1 }, { deg: 'b7', beat: 2 }, { deg: '6', beat: 3 },
              { approach: 'chrom-above', beat: 4 },
            ],
            note: '1–♭7–6–♭6 sinking onto the V — the classic descent',
          },
          {
            // G A B → C: 1–2, then the half-step under the wrap.
            pattern: [
              { deg: '1', beat: 1 }, { deg: '9', beat: 3 },
              { approach: 'chrom-below', beat: 4 },
            ],
            note: 'push: walk 1–2–3-of-the-V shape up into the next chorus',
          },
        ],
        position: 'first position; the walkups stay within a hand span',
        tips: 'The 8-bar form punishes autopilot — the V lands in bar 2, where a 12-bar reflex expects home. So invert the usual economy: sit in the two-feel and spend motion ONLY at the seams, which makes every walkup an announcement the band can steer by. The transferable prize is the 1–3–4–♯4 walkup: it targets any root a fifth above where you stand, which is why bars 1 (I→V) and 4 (IV→I) are the identical shape on different roots.',
      },
    ],

    'blues-minor': [
      {
        label: 'Slow-burn 12/8 (root, fifth, octave)',
        level: 'foundation',
        feel: '12/8 slow burn — pillars on 1 and 3, one pickup note per seam; whole-bar patience',
        chords: [
          { pattern: R5_OCT, note: 'root, fifth, octave — three pillars, then air' },
          { pattern: R5_OCT },
          { pattern: R5_OCT },
          {
            // C G E → F: the pickup under the iv is E — outside C minor, borrowed
            // for one beat as a leading tone; typed as the approach, it can't misspell.
            pattern: [
              { deg: '1', beat: 1 }, { deg: '5', beat: 3 },
              { approach: 'chrom-below', beat: 4 },
            ],
            note: 'the Jemmott move: a half-step under the iv, slid into its root',
          },
          { pattern: R5_OCT },
          {
            // F C D♭ → C: approach from above — a half-step sigh onto the tonic.
            pattern: [
              { deg: '1', beat: 1 }, { deg: '5', beat: 3 },
              { approach: 'chrom-above', beat: 4 },
            ],
            note: 'come home from above — the ♭2 sighing a half-step onto the i',
          },
          { pattern: R5_OCT },
          {
            // C E♭ G → A♭: spell the minor triad; its 5th already sits a half-step
            // under the ♭VI's root, so the approach into bar 9 is free.
            pattern: [
              { deg: '1', beat: 1 }, { deg: '3', beat: 3 }, { deg: '5', beat: 4 },
            ],
            note: 'the i\'s own 5th is a half-step under the ♭VI — beat 4 is already the approach',
          },
          {
            // A♭ C E♭ A♭ → G: outline the new dominant, then restate the root as the
            // typed approach (V root + 1 = this chord's own root) and let it sink.
            pattern: [
              { deg: '1', beat: 1 }, { deg: '3', beat: 2 }, { deg: '5', beat: 3 },
              { approach: 'chrom-above', beat: 4 },
            ],
            note: 'the drama bar: the ♭VI\'s root IS the half-step above the V — restate it and sink',
          },
          {
            // G B D → C: the V with its leading-tone 3rd; the 5th lands home from a
            // whole step above.
            pattern: [
              { deg: '1', beat: 1 }, { deg: '3', beat: 3 }, { deg: '5', beat: 4 },
            ],
            note: 'the V\'s major 3rd is the key\'s leading tone — one bar of light, then dark',
          },
          { pattern: R5_OCT },
          {
            pattern: [{ deg: '1', beat: 1 }],
            note: 'one note, whole bar — no push; the minor chorus ends at home',
          },
        ],
        position: 'low and open; let every note ring into the triplet space',
        tips: 'Minor blues is won by subtraction: three pillars a bar, and one pickup note per seam does all the storytelling. Bars 8–10 are the lesson in root motion — the i\'s 5th sits a half-step under the ♭VI, and the ♭VI\'s root sits a half-step above the V, so the form\'s whole climax is two half-steps you barely have to reach for. Jerry Jemmott built "The Thrill Is Gone" on exactly this economy: the half-step-below approach, slid — not hammered — into the target.',
      },
      {
        label: 'Minor box riff (1–♭3–4–5)',
        level: 'intermediate',
        feel: 'hypnotic medium groove — one four-note riff, unbroken, transposed by the form',
        chords: [
          { pattern: BOX_RIFF, note: 'the first four notes of the minor pentatonic, as a bassline' },
          { pattern: BOX_RIFF }, { pattern: BOX_RIFF }, { pattern: BOX_RIFF },
          { pattern: BOX_RIFF, note: 'on the iv the riff\'s top note is the key\'s tonic — the loop points home' },
          { pattern: BOX_RIFF },
          { pattern: BOX_RIFF },
          { pattern: BOX_RIFF, note: 'ends on the 5th, a half-step under the ♭VI — the approach comes free' },
          { pattern: BOX_RIFF, note: 'the 3rd majorizes by itself on the dominant — same degrees, new quality' },
          { pattern: BOX_RIFF, note: 'and again on the V: 1–3–4–5 with the leading tone in it' },
          { pattern: BOX_RIFF },
          { pattern: BOX_RIFF, note: 'the closing 5th drops a fifth onto the wrap — the strongest landing there is' },
        ],
        position: 'one box position — the riff never leaves a four-fret window',
        tips: 'The riff lane: pick a cell and refuse to leave it — the hypnosis is the point, and the form does the arranging. Because the degrees resolve through each chord\'s quality, the identical fingering thinks for you: ♭3 on the minor chords becomes a major 3rd on the ♭VI7 and V7 without you deciding anything. That is the deepest habit this pack can teach — think in degrees, not notes, and every riff you own transposes to every chord you meet.',
      },
    ],

    'blues-turnaround': [
      {
        label: 'Walking the cycle',
        level: 'intermediate',
        feel: 'swinging quarters — a jazz walk squeezed into the blues\' back door',
        chords: [
          {
            // C E G B♭ → A: up the I7 arpeggio; the ♭7 is ALSO the half-step above
            // the VI's root, so the approach note is a chord tone wearing two hats.
            pattern: [
              { deg: '1', beat: 1 }, { deg: '3', beat: 2 }, { deg: '5', beat: 3 },
              { approach: 'chrom-above', beat: 4 },
            ],
            note: 'the approach into the VI is the I\'s own ♭7 — one note, two jobs',
          },
          {
            // A C♯ E G → D: the full dominant arpeggio; the ♭7 falls a perfect
            // fourth onto the ii's root.
            pattern: [
              { deg: '1', beat: 1 }, { deg: '3', beat: 2 }, { deg: '5', beat: 3 },
              { deg: 'b7', beat: 4 },
            ],
            note: 'straight up the VI7 — the ♭7 lands on the ii from a fourth above',
          },
          {
            // D F A A♭ → G: minor arpeggio, then A–A♭–G — a pure chromatic walkdown.
            pattern: [
              { deg: '1', beat: 1 }, { deg: '3', beat: 2 }, { deg: '5', beat: 3 },
              { approach: 'chrom-above', beat: 4 },
            ],
            note: 'the ii\'s 5th starts a chromatic slide: 5, then the half-step above the V, then the V',
          },
          {
            // G A B G → C: walk 1–2–3, then drop to the fifth of the TARGET — which
            // on this wrap is the V's own root: the V–I cadence inside one bar.
            pattern: [
              { deg: '1', beat: 1 }, { deg: '9', beat: 2 }, { deg: '3', beat: 3 },
              { approach: 'fifth-of-next', beat: 4 },
            ],
            note: 'climb 1–2–3, then drop to the 5th of the next root — here, the V root itself',
          },
        ],
        position: 'one position; the arpeggios alternate strings on their own as the roots fall in fifths',
        tips: 'The jazz handshake, learned as three approach flavors in four bars: half-step from above (twice — and the first one is a chord tone already), a fall from the fourth above, and the fifth-of-the-target, which is the bass player\'s strongest word because it plays a V–I cadence into whatever comes next. Loop this at a jam and you\'ve pre-learned bars 11–12 of every uptown blues — the same cycle the guitar pack shells through.',
      },
      {
        label: 'Two-beat kicks (roots and approaches)',
        level: 'foundation',
        feel: 'jump two-beat — root on the kick, approach right behind it; often two beats per chord',
        chords: [
          {
            // C B♭ → A: root, then the half-step above the VI (again the I's ♭7).
            pattern: [{ deg: '1', beat: 1 }, { approach: 'chrom-above', beat: 3 }],
            note: 'root, then lean on the ♭7 — it drops you onto the VI',
          },
          {
            // A C♯ → D: root, then the half-step under the ii — the VI's own 3rd.
            pattern: [{ deg: '1', beat: 1 }, { approach: 'chrom-below', beat: 3 }],
            note: 'the VI\'s major 3rd pushes up a half-step onto the ii',
          },
          {
            // D A → G: root and fifth; the fifth steps down a whole step onto the V.
            pattern: [{ deg: '1', beat: 1 }, { deg: '5', beat: 3 }],
            note: 'root–fifth — the 5th falls a whole step onto the V',
          },
          {
            // G B → C: root, then the leading tone (the V's 3rd) under home.
            pattern: [{ deg: '1', beat: 1 }, { approach: 'chrom-below', beat: 3 }],
            note: 'the V\'s 3rd is the key\'s leading tone — it hands you bar 1',
          },
        ],
        position: 'low register, short notes — leave the triplet air to the pianist',
        tips: 'The minimum viable turnaround: state the root, then play ONE note that belongs to the next chord more than this one. When the band squeezes the cycle into two bars (two beats per chord — the usual jazz-blues bars 11–12), this is the same pattern with the beats halved: root on the front beat, approach on the back. Notice that every back-beat note here is a chord tone of its own bar that also targets the next root — good targeting usually costs nothing.',
      },
    ],
  },
}
