# Contributing to JamBuddy

JamBuddy is two things at once: a live **jam companion** that hears your key and chords and shows you how to play over them, and an open **learning platform** for the style knowledge behind those changes. The full vision is in [`GOAL.md`](GOAL.md).

The best part: **the style packs are data, not code.** If you're a gigging musician who knows how a style is voiced and played, you can teach JamBuddy a new genre by filling in a structured file — no audio or detection internals required. This guide is about that path.

---

## Quick start (setup)

You'll need [Node.js](https://nodejs.org/) (18+) and, for the live app, a microphone.

```bash
git clone https://github.com/whattheflat/whattheflat.git
cd whattheflat
npm install

# Desktop app — Vite dev server + Electron window, hot reload, mic access
npm run electron:dev

# Or browser-only (no Electron shell) — then open http://localhost:5173
npm run dev
```

You do **not** need the app running to add a style — adding a style is editing data files and running one validator command. But it's nice to see your pack light up live once it's in.

---

## Add a music style without deep coding

This is the heart of contributing. A "style" is a genre pack: the standard progressions of that style, plus idiomatic ways to play each one. One pack renders in **all 12 keys** automatically, because everything is stored key-agnostically (scale degrees, not chord names).

The data contract you're filling is [`src/data/kb/SCHEMA.md`](src/data/kb/SCHEMA.md) — read it; it's the source of truth. The steps below are the workflow around it.

### Step 1 — Copy an existing pack as your template

A style lives in `src/data/kb/<style>/` and has (at least) three files:

```
src/data/kb/<style>/
  meta.js           — the style's identity (label, feel, tempo, one-line character)
  progressions.js   — the style's standard progressions (instrument-independent)
  guitar.js         — how to play them on guitar (voicings, comping, improv)
```

The cleanest way to start is to **mirror a finished pack**. The gospel pack is a good, complete reference to copy and edit:

- [`src/data/kb/gospel/meta.js`](src/data/kb/gospel/meta.js)
- [`src/data/kb/gospel/progressions.js`](src/data/kb/gospel/progressions.js)
- [`src/data/kb/gospel/guitar.js`](src/data/kb/gospel/guitar.js)

(`SCHEMA.md` names the `jazz/` pack as its canonical exemplar — gospel mirrors the same shape and is a good second model. Pick whichever style is closest to yours.)

Make a new folder named after your style (e.g. `src/data/kb/neosoul/`), copy those three files in, and rewrite the content.

### Step 2 — Fill in the fields (in plain musician language)

**`meta.js`** — the style's identity. `id` (must equal the folder name), `label` (display name), `feel` (`swing` / `straight` / `shuffle` / `16th` / `bossa`…), `tempoRange` (`[low, high]` BPM), and a one-sentence `character` of what makes the style sound like itself.

**`progressions.js`** — your style's signature progressions, 4–8 of them. Each one is written **key-agnostically** using these fields:

- `degrees` — the chord roots as **semitone offsets from the key root, 0–11**. So in any major key: I = `0`, ii = `2`, IV = `5`, V = `7`, vi = `9`. A ii–V–I is `[2, 7, 0]`. You write the *intervals*, JamBuddy fills in the actual chords once it knows the key.
- `qualities` — the chord **quality** for each degree, e.g. `min7`, `dom7`, `maj7`, `maj`, `add9`, `sus4`, `dim7`. These must be one of the names JamBuddy knows: `maj`, `min`, `dom7`, `maj7`, `min7`, `dim`, `dim7`, `half_dim`, `aug`, `sus4`, `sus2`, `maj6`, `min6`, `add9`. (That list lives in `CHORD_TYPES` in `src/lib/theory.js`.)
- `rn` — the Roman numerals you'd *write on a chart* (`['ii7', 'V7', 'Imaj7']`) — purely for display.
- `bars` — how many bars each chord lasts.
- `mode` — `major`, `minor`, `dorian`, `phrygian`, `lydian`, or `mixolydian`.
- `songs` — real songs that use the progression. **Be honest here** (see the PR checklist).
- `tip` — one transferable idea a player can take away.
- `id` — a globally unique slug, prefixed with your style name (`neosoul-251`, `neosoul-vamp`…).

`degrees`, `qualities`, `rn`, and `bars` must all be the **same length** (one entry per chord in the loop).

**`guitar.js`** — the ways to play each progression. The key fields:

- `styleIntro` — 2–3 sentences on the guitar's role in this style.
- `comping` — at least one named rhythm with a description.
- `plays` — for each progression id, **at least two genuinely different ways to play it** (different register, density, or technique — not the same voicing moved up the neck).
- `improv` — scales to solo over each chord, target notes, optional licks.

Each chord in a play carries a guitar **shape**, written in one of two formats:

- **Movable shape** (the common case) — fret offsets *relative to the root fret*, so the same grip works in every key:
  ```js
  shape: {
    rootStr: 6,                        // which string carries the root (6 = low E)
    offsets: [0, 'x', 0, 1, 'x', 'x'], // always 6 entries, low-E string first; 'x' = muted
    fingers: [1, 0, 2, 3, 0, 0],
  }
  ```
- **Open shape** (open-string chords that only work in certain keys) — uses absolute `frets` plus `onlyRoot` (the pitch class, 0–11, the shape is built for) instead of `offsets`.

If a voicing **deliberately leaves a note out**, declare it so the data stays honest and the UI can show it:

- `extensions: ['9']` — colour tones you've added beyond the basic chord (the validator only allows notes you've declared).
- `rootless: true` — the shape omits the root (e.g. guide-tone grips where the bass covers the root).
- `omit3: true` — the shape omits the 3rd (e.g. power chords that work over major or minor).

### Step 3 — Register the style

Open [`src/data/kb/index.js`](src/data/kb/index.js) and add your pack the same way the others are wired: import its `meta`, `progressions`, and `guitar`, then add an entry to the exported registry. Mirror an existing block exactly — the UI reads only this registry.

### Step 4 — Run the validator until it's green

```bash
node scripts/validate-kb.mjs
```

A passing run looks like:

```
✓ KB valid — 9 style(s), 45 progressions, 90 plays
```

If it fails, it prints a specific line for each problem (which file, which chord, what's wrong). Fix the data and run again. **Never weaken the validator to make content pass** — if you think a rule is wrong, open an issue instead.

#### Why the validator exists (this is the important part)

The validator is the quality bar that lets us trust voicings we didn't author ourselves. For **every guitar shape**, it computes the **actual pitch classes** the grip would sound (from the string tuning, the root string, and your offsets) and checks two things:

1. **Every note you sound actually belongs to the chord** — the chord's own tones plus any `extensions` you declared. A misspelled grip (a wrong fret, a stray open string) sounds a note that isn't in the chord, and the validator rejects it.
2. **The chord's defining tones are present** — unless you've honestly declared them omitted via `rootless` / `omit3`.

In plain terms: you can't accidentally ship an "Amaj7" that's secretly an A7, and you can't claim a voicing has a note it doesn't. That mechanical check is what makes a contributed pack trustworthy without a maintainer re-fingering every chord by hand.

---

## The assisted path: `/kb-expand`

If you're working with [Claude Code](https://claude.com/claude-code), the `/kb-expand` skill is an assisted authoring route. It does exactly **one style × instrument cell end to end** — researches the style's standard progressions and idiomatic voicings (with sources), drafts the files per `SCHEMA.md`, registers the style, and **self-validates** by running `node scripts/validate-kb.mjs` until green before stopping. It's the fastest way to go from "I know this genre" to a scaffolded, validated pack you can refine. You still own the musical judgment — check its voicings and attributions.

---

## Pull request checklist

Before you open a PR, confirm:

- [ ] **Validator green** — `node scripts/validate-kb.mjs` prints `✓ KB valid …`.
- [ ] **Build green** — `npm run build` succeeds (your new file imports cleanly).
- [ ] **Honest attributions** — every song listed actually uses the progression. Do **not** claim a specific recording uses an exact voicing unless you genuinely know it does; "standard in the tradition" or a hedged reference is better than a fabricated one. Licks and sources are real.
- [ ] **Plays genuinely differ** — the 2+ ways to play each progression contrast in register, density, or technique (not transpositions of one another).
- [ ] **One style per PR** — keeps review focused and easy to merge.

That's it. Open the PR, and a maintainer (the Critic in our [ensemble](docs/agents/ROSTER.md)) will run the same checks before merging.

---

## Reporting bugs and proposing styles

You don't have to write any code to help:

- **Propose or contribute a style** → use the [Propose / contribute a style](.github/ISSUE_TEMPLATE/add-style.md) issue template. Tell us the genre, its signature progressions, and whether you'll author the voicings or want help.
- **Found a bug?** → [Bug report](.github/ISSUE_TEMPLATE/bug_report.md).
- **Have an idea?** → [Feature request](.github/ISSUE_TEMPLATE/feature_request.md).

---

## Scope and ground rules

- Adding/editing **style data** under `src/data/kb/` and using the issue templates needs no special permission — that's exactly the contribution path this guide is for.
- Changes to **app code, the audio pipeline, the schema, or the validator** are bigger — open an issue to discuss first so it fits the roadmap in [`GOAL.md`](GOAL.md).
- **License:** the project doesn't have a license file yet, so reuse terms aren't settled. If that matters for your contribution, raise it in an issue before investing heavily.

Thanks for helping musicians hear, play, and *learn* the jam.
