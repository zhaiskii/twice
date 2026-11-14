# AGENTS.md — Twice

Read this first. `CLAUDE.md` is a symlink to this file.

## What this is

**Twice** — drop in a bank/card CSV, see what you're paying twice: services your
phone plan, card or membership already includes, two services doing one job, and
a big-carrier phone bill when the *same network* costs a third as much. No bank
login; the file never leaves the browser; every number links to its source.

Built for **Business Cup 2.0** (Zimran × AIESEC × Nazarbayev University),
24 h, submission **12:00 Almaty, Nov 15 2026**: ≤10-slide PDF deck, production
URL (jury uses it with **no sign-up/login**), public GitHub repo (they read it).

Judging: 40% works end-to-end in production, real not hardcoded · 20% what we
sell & why users return · 15% problem & user · 15% business ($100M ARR path,
LTV > CAC) · 10% originality. Pass/fail: B2C, web only, all 3 submissions.

- Product spec & engine contract: `docs/SPEC.md` + `packages/engine/src/types.ts`
- Why this product (research, competitors, numbers): `docs/research.md`
- Pitch notes: `docs/pitch.md`

## Repo map

```
apps/web/            Vite + React 19 + Tailwind v4 + motion — the whole UI, static build
packages/engine/     Pure TS engine: parse → normalize → recurring → findings
  src/types.ts       THE contract (every cross-boundary shape)
  src/index.ts       Public API: parseStatement, analyze, catalog, personas
  data/*.json        Sourced catalog: merchants, carriers, plans, perks
  fixtures/          Synthetic persona statements (+ personas.json) for demo & tests
docs/                SPEC.md, research.md, pitch.md
```

## Commands (pnpm workspace)

```
pnpm install
pnpm dev          # web on :5173
pnpm test         # engine unit + persona tests (vitest)
pnpm typecheck
pnpm check        # typecheck + test + build — must pass before every commit
```

## Rules for agents

1. **Comment decisions where they live.** Every non-obvious choice gets
   `// DECISION(<slug>): <what> — <why>. <when to revisit>` on the line it
   governs. Write it as an instruction to the next agent, not a diary.
   Cross-file couplings get `// AGENT: if you change X, also update Y.`
2. **Never invent a fact.** Prices, perks, port-out steps live in
   `packages/engine/data/*.json`, each row with `url` + `checkedOn`. If you
   can't verify it on an official page, leave it out.
3. **Engine stays pure.** No network, no Date.now() inside rules (pass dates
   in), no randomness, no throwing on bad input. Same input → same output.
4. **Privacy is a feature.** The raw statement never leaves the browser. No
   analytics, no server calls with user data in v0.
5. **Do not build** cancellation, bill negotiation, budgeting or trial alerts —
   that is Rocket Money and Zimran's own Subpilot; copying it costs us the
   originality score. We *replace* and *dedupe*; we don't haggle.
6. **Keep it simple.** No new dependency without a DECISION comment saying why
   the platform can't do it. No router, no state library, no backend in v0.
7. **Types first.** Change `types.ts`, then follow the compiler. Don't
   redefine engine shapes in the web app.
8. **Test what judges will poke**: each bank format, sign conventions, edited
   rows recomputing, the "clean" persona producing no fake savings.

## Design bar (apps/web)

Design-engineer quality: calm, typographic, generous whitespace, one accent
color, crisp numbers (tabular figures), motion that explains state changes
(never decoration), every control has hover/press/focus feedback, works at
375 px, respects `prefers-reduced-motion`. Original look — take the *level* of
polish from Linear / Vercel / Anthropic-class sites, never their branding.
