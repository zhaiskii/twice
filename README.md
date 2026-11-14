# Twice — stop paying twice

**Live:** https://zhaiskii.github.io/twice/ — no sign-up, try a sample statement or drop in your own CSV.

Drop in a bank or card CSV and Twice shows what you pay for twice:

- **Already included**: Netflix you pay for while your T-Mobile plan includes it, DashPass your
  Chase Sapphire covers, Peacock that comes with Walmart+.
- **Same network, less**: a $175 Verizon bill when Visible and US Mobile run on the same towers for $50.
- **Two doing one job**: Spotify *and* Apple Music, iCloud+ *and* Google One.
- **Price went up**: the exact charge where each subscription got more expensive.

Each finding comes with a step-by-step switch kit (port-out PIN, which plan to order, the overlap
order so you never lose service). We don't cancel or haggle for you — we find the cheaper twin
of what you keep and what you already get for free.

## Why the numbers are real

- **Nothing is hardcoded.** The engine (`packages/engine`) parses the CSV and computes every
  finding in your browser. Open *Edit statement* on the results page, change or delete any row,
  and the totals recompute.
- **Every fact is sourced.** Prices, perks and port-out steps live in
  [`packages/engine/data/*.json`](packages/engine/data). Each row carries the official `url` and
  the date we checked it, and the results page links to both.
- **Your file never leaves the browser.** There is no backend and no analytics.
- **Tested:** 206 vitest tests cover 8 bank formats, sign conventions, recurring detection, every
  finding rule, three persona statements end to end, and a performance budget (`analyze` on 1,000
  rows in well under a frame). CI runs them before every deploy.

## Repo

```
apps/web/            Vite + React 19 + Tailwind v4 + motion — the whole UI, static build
packages/engine/     Pure TypeScript: parse → normalize → recurring → findings → totals
  src/types.ts       The contract between engine and UI
  src/rules/         One file per finding kind
  data/*.json        Sourced catalog: 37 merchants, 9 carriers, 11 plans, 11 perks
  fixtures/          Three synthetic persona statements (Chase card, Amex, BofA checking)
docs/                SPEC.md (behavior), research.md (market), pitch.md
.github/workflows/   pnpm check → GitHub Pages
```

```bash
pnpm install
pnpm dev      # http://localhost:5173
pnpm check    # typecheck + tests + build
```

## Agent-native

The repo is written to be extended by coding agents. [`AGENTS.md`](AGENTS.md) (also `CLAUDE.md`)
holds the rules, and every non-obvious choice is a `// DECISION(<slug>): what — why. when to
revisit` comment on the line it governs, with `// AGENT:` notes on cross-file couplings.
`grep -rn "DECISION(" apps packages` is the design doc.

Built in 24 hours for Business Cup 2.0 (Zimran × AIESEC × Nazarbayev University).
The sample statements are synthetic; the people in them are made up.
