# Related progressions — same-style-first (D-72)

Concept doc for **L-72**. Design-only; no code here. Scope is one bounded edit to
`src/components/RelatedProgressions.jsx` (match.js untouched — see §6).

## The user's ask (2026-07-13, verbatim intent)

> "for the related progressions this is good also, but i would also want
> bridge/chorus/modifications in the same style … say i select jam roulette with
> blues, then i want for that progression other options and not necessarily go
> into other styles."

**Chosen scope:** reuse the KB's *existing* same-style progressions. No computed
modifications, no new authored content, no new KB fields. When a style is active
(rolled via Jam Roulette **or** live-detected), the panel leads with the OTHER
progressions of that same style, reframed as variations/sections to try — instead
of jumping to other styles.

The component today already computes a match, ranks every *other* KB progression
by musical proximity, and prints a flat cross-style list. This doc changes only
**how the list is partitioned, floored, ordered, and labelled** once a style is
known. When no style is known, behaviour is unchanged.

---

## 1. How the active style is known — reuse the component's own match

`rankRelatedProgressions(loop)` already calls
`matchLoopToProgression(loop, index)`, whose result is
`{ matched, id, style, rotation, progression }`. **`match.style` IS the active
style** — for both entry points:

- **Jam Roulette:** `rollJam` seeds `detectedProgression = seedableLoop(prog, key)`
  (the collapsed canonical form). The L-60 collapsed-form index makes the
  component re-match that loop back to the rolled progression → `match.style ==
  the rolled style`, `match.id == the rolled progression's id`. That id is already
  excluded from `entries` (the `prog.id === match.id` guard), so the surviving
  same-style progressions are exactly "other options for the style I rolled."
- **Live detection:** the detected repeating loop is what App passes as
  `loop={detectedProgression}`; the same match resolves the live style/id.

**Recommendation — use the internally-computed `match.style`; do NOT add a prop.**
Naming it explicitly: inside `rankRelatedProgressions`, after the existing
`const match = matchLoopToProgression(...)`, take

```
const activeStyle = match.matched ? match.style : null
```

Rejected: threading a `matchedStyle` prop down from App (roulette knows it via
`lastRolledStyleRef`; live detection could expose its own match). It duplicates
state that the component already derives identically from the same `loop`, and
introduces a divergence risk (App's match vs the component's match drifting).
The single source of truth is the loop → its match. Keep it in one place.

**No-match fallback.** When `match.matched === false` (the loop matches no KB
progression — an off-book jam), `activeStyle` is `null`; the panel renders exactly
today's cross-style list (flat, floor `RELATED_SCORE_FLOOR`, existing
annotations). Nothing about the current behaviour changes when no style is locked.

---

## 2. Same-style-first presentation — two sections

When `activeStyle != null`, partition the scored candidates by
`entry.style === activeStyle`:

**Primary — "Try these in {styleLabel}"** (same-style siblings).
All same-style progressions except the one being played, in scorer order (§4),
capped at `RELATED_MAX_ENTRIES` (5). The score floor is **relaxed to 0 for this
section** — a sibling of your own style is never "junk"; it is exactly the "other
options" the user asked for. Styles hold ≤7 progressions, so this shows all of
them (blues → 4 siblings).

**Secondary — "Same changes, other styles"** (cross-style), demoted, small.
Only progressions whose canonical changes are *identical* to the loop
(`sameChanges === true`), capped at **2**, floor kept. This preserves a genuinely
valuable, rare relative — "this exact turnaround also lives in jazz and gospel" —
without "going into other styles" for merely-similar material. If none qualify,
the section is omitted entirely.

**Recommendation: ship both sections (option b).** It honours "not necessarily go
into other styles" (same-style leads and dominates the panel) while not hiding an
exact-match cousin elsewhere. Dropping the secondary later is a one-line change
(don't render it) if the user wants pure same-style — noted as the toggle.

Rejected: a hard same-style-only filter that *never* shows cross-style. It throws
away the exact-match cousin (musically the most useful cross-style pointer we
have) and would also have to special-case the no-match path. Kept only as the
one-line fallback if the user insists on zero cross-style.

---

## 3. The reframe — "bridge/chorus/modifications" with NO new content

Same-style siblings must read as *sections/variations to try*, not a flat list.
We label each with a short **role phrase** derived only from data already in the
KB — comparing the sibling to the active (matched) progression. Fields used:
`mode`, `bars` (summed = the form length), `qualities` (the colour set),
`name`, `level`. No new fields.

`siblingRole(sibling, active)` → a short phrase or `null`, first rule that fires:

1. **mode differs** → `"{mode} version"` — minor→`"minor version"`,
   major→`"major version"`, else the mode name (`"dorian version"`, …).
2. **same mode, fewer total bars** → `"shorter form"`.
3. **same mode, more total bars** → `"extended form"`.
4. **same mode & length, a quality the active lacks** → `"reharmonized"`.
5. **otherwise** → `null` (honest: just the name + level badge, no role line).

The active progression's `mode`/`bars` come from looking the raw KB entry up by
`match.id` in `kbRegistry[activeStyle].progressions` (avoids any collapsed-
projection subtlety; the raw entry is authoritative).

### Concrete — active = blues **Standard 12-bar** (major, 12 bars)

| sibling | mode | bars | role phrase | reads as |
|---|---|---|---|---|
| Quick-change 12-bar | major | 12 | `null` | name + `foundation` (name already says "quick-change") |
| 8-bar blues | major | 8 | **shorter form** | "the compact take" |
| Minor blues | minor | 12 | **minor version** | "the minor cousin" |
| Turnaround cycle | major | 4 | **shorter form** | name already says "Turnaround cycle" |

Every phrase is honest and re-derivable from `mode`/`bars`/`qualities`. Where no
character is derivable (Quick-change: same mode, same length, same all-dom7 colour
set) we print **nothing** beyond the name and level badge — the name carries it.
The two "shorter form"s are fine: their *names* (`8-bar blues`, `Turnaround
cycle`) already distinguish them, and the scorer orders them by proximity (§4).

This is where the "bridge/chorus/modification" feel comes from: the KB already
holds the minor version, the short form, the turnaround, the quick-change — we are
just *reframing existing siblings* with a one-line role, not synthesising sections.

---

## 4. Ranking within same-style — keep the scorer order

The existing scorer still runs over every candidate. Within the same-style group
the `+40 SCORE_SAME_STYLE` term is constant, so it cancels — ordering is driven by
`same changes (+100)` → `shared transitions` → `Jaccard` → `− length`, i.e.
**musical proximity to the loop you're playing.** That is more useful mid-jam than
alphabetical, so:

**Recommendation: keep the scorer sort within same-style. Do NOT re-sort by
level/name.** The closest variation to what your hands are already doing surfaces
first. The only change is relaxing the floor to 0 for this section (§2) so no
sibling is silently dropped for being "only" a distant relative — the user
explicitly wants *all* the style's options.

---

## 5. Edge / empty states

- **Style with only 1 progression** (0 same-style siblings after excluding the
  played one). No current style hits this (all have ≥5), but handle it: render an
  honest primary line — *"You're on the only {styleLabel} loop in the songbook."* —
  then fall through to the cross-style secondary (kept at floor). Never pad.
- **Secondary empty** (no exact cross-style cousin) → omit the secondary section
  silently; the primary stands alone.
- **No match at all** (`activeStyle == null`) → today's single flat list, unchanged.
- **Instrument-agnostic — confirmed.** `RelatedProgressions` reads only
  `progressions` (`degrees`/`qualities`/`rn`/`level`/`name`/`mode`/`bars`), never
  the `instruments` cells. It behaves identically under guitar / piano / bass; the
  global instrument selector does not touch it.

---

## 6. L-72 change list (RelatedProgressions.jsx only)

`match.js` needs **no change** — `matchLoopToProgression` already returns
`{ style, id, progression }`. Reuse it.

In `rankRelatedProgressions`:
1. After computing `match`, derive `const activeStyle = match.matched ? match.style
   : null` and look up the raw active progression (`kbRegistry[activeStyle]
   ?.progressions.find(p => p.id === match.id)`) for its `mode` + summed `bars`.
2. Keep the existing scoring loop. Change the floor test: skip the
   `score < RELATED_SCORE_FLOOR → continue` **only when** `style === activeStyle`
   (same-style siblings bypass the floor); cross-style keeps the floor.
3. Add a `siblingRole(sibling, active)` helper (§3) and attach `role` to each
   same-style entry; leave cross-style entries' existing `annotation` intact.
4. Partition the sorted entries into `primary` (`style === activeStyle`, cap 5)
   and `secondary` (`style !== activeStyle && sameChanges`, cap 2). Return
   `{ match, activeStyle, activeStyleLabel, primary, secondary }`. Keep
   `entries` (= `primary.concat(secondary)`) on the return so any existing
   `entries[0]` / `entries.length` reads still resolve during the transition.
   When `activeStyle == null`, return today's shape (`primary = entries`,
   `secondary = []`) so the render path collapses to the current flat list.

In the render:
5. Two `<section>`-internal blocks: primary headed *"Try these in
   {activeStyleLabel}"*, secondary headed *"Same changes, elsewhere"* (rendered
   only when non-empty). Same-style rows swap the `annotation` line for the `role`
   phrase (omit the line when `role == null`). Reuse the existing `LevelBadge` /
   `ChordChain` — no new tokens, no new colours (all within `bg-panel` /
   `border-border` / `text-gray-*` / `text-amber`, already in use).

**Smoke pins (C-50, `scripts/smoke.mjs` §8) will shift — re-derive, coordinate
with C-70:**
- Pin (a) collapsed 12-bar in A: top stays **blues/blues-8bar, score 92**
  (blues is now the active style; 8-bar is a same-style sibling; the +40 is still
  in its score, order unchanged). Its **annotation label changes** from
  `'shares I7→V7'` to the role `'shorter form'` — the assertion must be re-pinned.
- Pin (b) ii–V–I in C: top stays **jazz/jazz-251-minor, score 156** (same-style,
  same changes). Its label changes from `'same changes'` to the role
  `'minor version'` (mode differs) — re-pin.
- Scores and top ids are stable; only the annotation strings and the return shape
  move. Add coverage for the primary/secondary split and the no-match fallback.

### Rejected alternatives (recap)
- **Computed modifications** (synthesise a bridge/chorus by transposing or
  reharmonising) — rejected per the user's explicit choice to reuse existing KB
  content; also risks inventing non-idiomatic changes we can't vouch for.
- **Hard same-style-only, no cross-style ever** — rejected: loses the exact-match
  cousin in another style and complicates the no-match path. Retained only as the
  one-line "drop the secondary" toggle if the user later wants zero cross-style.
- **An explicit `matchedStyle` prop from App** — rejected as redundant (§1): the
  component derives the same style from the same loop; a prop only adds a
  divergence surface.
