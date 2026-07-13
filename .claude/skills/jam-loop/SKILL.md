---
name: jam-loop
description: Run one orchestrated ensemble iteration — Maestro appoints the right agent(s) for the next ready ledger task(s), the workers do the work, Critic gates it, Maestro reconciles and commits. The multi-domain generalisation of /kb-expand. Use to advance JamBuddy (app + learning platform); schedule it via /loop or /schedule for standing iterations.
---

# Jam Loop — one orchestrated ensemble iteration

You are the **main loop acting as Maestro** (a leaf subagent can't spawn subagents, so the conductor lives here). You appoint the five worker agents — **professor, luthier, muse, critic, herald** — via the Agent tool, gate with Critic, and reconcile. Do **one iteration** per invocation.

References: `docs/agents/PROTOCOL.md` (the rules), `docs/agents/ROSTER.md` (domains + cadence weights), `docs/agents/LEDGER.md` (the board). Single-domain content work can still use `/kb-expand` directly.

## Optional argument
`--only <agent>` runs just that domain's next ready task (e.g. `/jam-loop --only professor`). No argument = full balanced iteration.

## Steps

### 1. PLAN
- Read `LEDGER.md` + `GOAL.md`. Promote `backlog → ready` for any task whose `depends-on` are `done`.
- If no sprint branch is cut yet, do task M-01 first (cut the sprint branch, set the ledger header).
- Pick the next batch by `priority × cadence-weight` (ROSTER). For a parallel batch, **enforce file-disjointness** — never select two tasks whose `files` overlap. Respect locks: skip any task overlapping a `claimed`/`in-review` task.

### 2. APPOINT & DISPATCH
For each chosen task, dispatch the agent whose `domain` matches (`content`→professor, `engineering`→luthier, `design`→muse, `community`→herald, `quality`→critic). Give the agent: its task id, the DoD, its locked files, and "read your agent file + PROTOCOL.md + your ledger task first."
- **Serial (default):** one task → one `Agent` call. A dependent chain → run in dependency order, feeding each result forward.
- **Parallel (independent, file-disjoint):** multiple `Agent` calls in one message.
- **Sprint mode (only if the user opted into Workflow/"ultracode"):** use the Workflow tool — `pipeline()` for dependent chains, `parallel()` for independent batches, with `isolation: 'worktree'` for any agents writing in parallel.
Mark each dispatched task `claimed` in the ledger.

### 3. GATE (Critic — mandatory)
When a worker sets its task `in-review`, dispatch **critic** to review it: Critic runs `npm run build`, `node scripts/validate-kb.mjs`, any smoke test, and applies domain judgment (PROTOCOL §4). 
- Pass → Critic sets `done`.
- Fail → Critic sets `returned` with specific findings; the task goes back to `ready` for a future iteration (or re-dispatch the owner now if the fix is small and you have budget).

### 4. RECONCILE (you, as Maestro)
- Commit each passing task as its own commit on the sprint branch (`<area>: <what> (task <id>)`), ending messages with the Co-Authored-By line.
- Update `LEDGER.md` (statuses, any new follow-up tasks Critic surfaced) and `GOAL.md` if direction shifted.
- Append one line to the ledger's iteration log: `<date> · done: <ids> · returned: <ids> · next: <id>`.

### 5. REPORT & CONTINUE
- Tell the user: what each agent did, Critic's verdicts, what's committed, and the next ready task.
- If looping (`/loop`/`/schedule`), this iteration ends here — the next fire runs the next iteration.
- **At sprint end** (no ready tasks left in the sprint): open one PR to `main` summarising every task + validator/build status. `gh` is not installed — use the GitHub API with `git credential fill` (see PROTOCOL §6).

## Rules
- One iteration per invocation. Don't start work outside the selected batch.
- Never skip the Critic gate. Never merge a `returned` task.
- Never select a file-overlapping parallel batch — that's the conflict guardrail.
- Keep all state in files (ledger, commits, GOAL) — the next iteration has no memory of this one.
- If a task spans two domains, don't dispatch it — split it into a handoff chain first (you're Maestro; fix the board).
