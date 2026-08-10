---
name: update-handoff
description: Update .claude/HANDOFF.md, the terse project-memory file a brand-new Claude Code session reads to pick up this portfolio project where the last session left off. Use whenever the user asks to "update the handoff", "log this session", "log progress", "wrap up", "save context for next session", or similar. Also proactively run it right after a version-bump commit lands (npm run save, per this project's CLAUDE.local.md section 5) — the new tag is a natural checkpoint — and proactively offer (don't just do it) when the conversation looks like it's winding down. Keeps the file under 300 lines by pruning/compacting old history rather than letting it grow forever.
---

## What HANDOFF.md is for

One job: let a brand-new Claude Code session (no memory of this one) get
oriented in under a minute. It is **not** a changelog — git log/tags already
hold full detail — it's a compressed pointer to what a new session actually
needs: the shape of the project, what's done, what's mid-flight, what's next.
Gitignored, never committed, never read by anyone but the next Claude session.

Every line should earn its place. If it's derivable by reading the code or
`git log`, it doesn't belong here — only put in what those can't tell you:
decisions made, things deferred and *why*, state left uncommitted.

## Structure

Keep these sections, in this order. If the file doesn't exist yet, create it
fresh with this shape.

1. `# Session Handoff — <project>` + a one-line note that it's gitignored and
   entries should stay brief.
2. `## Project` — static overview: what it is, stack, hosting. Touch this
   only when something structural actually changed (new major dependency,
   hosting move, framework swap). Leave it alone otherwise.
3. `## History` — terse log of finished chunks, newest at the bottom, one
   line per chunk (not one line per commit — several related commits in a
   session become a single bullet). Reference version tags where they exist
   (`v1.14: ...`) instead of restating commit messages; that's what
   `git log`/`git tag` are for.
4. `## In progress / next up` — the true current state: mid-flight work,
   anything left uncommitted, open decisions. **Overwrite this section each
   run** rather than appending — a stale "in progress" note actively
   misleads the next session. Anything finished moves to History; anything
   still open stays here.
5. `## Waiting on user` (only if applicable) — things only the user can
   supply (content, credentials, decisions). Remove an item once supplied.

## Update procedure

1. Read the existing file (if any).
2. Work out what actually happened: `git log`/`git tag` since the last
   History entry, `git status`/`git diff` for anything uncommitted, and
   anything decided in conversation that git can't show (a deferral, a
   tradeoff chosen, a "not now" from the user).
3. Write the deltas in, following the conciseness rules below.
4. Show the user a short summary of what changed in the file — don't just
   silently rewrite it.

## Conciseness rules (the whole point of this skill)

- Bullet fragments, not paragraphs. "Fixed cube spin easing" beats "We
  identified and fixed an issue where the cube's spin animation had
  incorrect easing."
- One line per chunk of work in History, not one line per commit.
- Never restate what's already obvious from `## Project` or from reading
  the code.
- If a past decision's *reasoning* matters later (why something was
  deferred, why an approach was rejected), keep the reasoning to one
  clause — don't drop it, but don't expand it either.

## Keeping it under 300 lines

Check the line count before finishing. If it's over, or trending there:

- Compact `## History` first — that's the section allowed to lose detail
  over time, because git already has it in full. Collapse a run of old
  entries into one summary line, e.g.:
  `v1.0–v1.9: initial build — cube, gradient bg, project pages, GSAP
  animations (see git tags for detail).`
- `## In progress` and `## Waiting on user` should never need compacting if
  they're being overwritten correctly each run. If either is ballooning,
  that means items should have graduated to History (done) or been dropped
  (abandoned) — not that they need summarizing.
- Never compact `## Project` — it should already be minimal.

## When to run this

- Explicit request: "update the handoff", "log this session", "log
  progress", "wrap up", "save context for next session," etc.
- Proactively, right after a version-bump commit lands (`npm run save`) —
  the new tag is a natural History checkpoint.
- Proactively *offer* (don't just do it) when the conversation signals the
  user is wrapping up for now — don't interrupt a task mid-flow to suggest
  it.
