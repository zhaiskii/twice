# Twice — v0 spec (hackathon build)

Types live in `packages/engine/src/types.ts`; this file explains behavior.

## User & promise

US adults 25–45 who pay ~$60–80/mo in subscriptions and $80–120 per phone line
on Verizon/AT&T/T-Mobile. Promise: *"See what you pay twice in 60 seconds — no
bank login."* We find the **cheaper twin** of what you keep and the things you
**already get free**. We never cancel or negotiate for you (see AGENTS.md rule 5).

## Screens (single page, state machine, no router)

1. **Landing** — hero "You're paying twice." · CTA *Try a sample* / *Upload CSV* ·
   trust strip: no bank login · file never leaves your browser · every number sourced.
2. **Input** — 3 persona cards (from `personas`) + dropzone (multiple CSVs allowed,
   merged). After parse: banner "Chase card format · 214 rows · 9 recurring" +
   warnings. Footer link to the GitHub repo.
3. **Quiz** — only `analysis.needs` (≤3 questions), prefilled from persona.profile,
   skippable. Answers → `Profile` → re-run `analyze`.
4. **Results** — animated total `$low–$high / yr` (or single number if equal) ·
   finding cards grouped *Already included* (paying_twice) · *Same network, less*
   (phone_switch) · *Two doing one job* (overlap) · *Price went up* (price_step).
   Each card: title, $/yr, evidence rows (date · descriptor · amount), rule,
   assumptions, sources with "checked <date>", *Open switch kit*. Empty state for the
   clean persona: "You're already on a good deal" + what we checked.
5. **Statement table** (drawer) — edit description/amount/date, delete, add row;
   `analyze` re-runs on every change and the total animates. This is how a judge
   proves nothing is hardcoded.
6. **Switch kit** (sheet) — `finding.kit` steps as checkboxes, persisted in
   localStorage → **Bill Detox tracker** (progress across findings, "come back
   tomorrow" loop: PINs expire in 4–7 days, perks need one billing cycle overlap).
7. **Paywall** — appears when opening a 2nd kit. *Twice Plus*: $7.49 first month
   then $14.99/mo, or $79/yr. Renewal price and one-click cancel stated up front,
   no countdown timers. No Stripe account yet → button reads "Unlock demo — no
   charge" (honest label). Free tier: all findings + 1 kit.
8. **Privacy panel** — "What leaves your browser: nothing." (true in v0: no backend.)

## Engine pipeline (`analyze`)

1. **Normalize descriptor** — uppercase; strip processor prefixes (`SQ *`, `TST*`,
   `PAYPAL *`, `PP*`, `GOOGLE *`, `APPLE.COM/BILL`→keep "APPLE"), card/ref numbers,
   `#1234` store numbers, phone numbers, trailing city/state, dates, "PURCHASE
   AUTHORIZED ON ..". Match `merchants.json` patterns; unmatched → `unknown:<norm>`.
2. **Recurring** — group charges (amount > 0) by merchant.
   - monthly: gaps 25–35 days (one missed month tolerated); catalogued merchants
     need ≥2 charges, unknown need ≥3 with amounts within ±5% (wireless: ±25%).
   - annual: ≥2 charges 350–380 days apart, or 1 charge of a catalogued
     `membership` merchant ≥ $50.
   - weekly: ≥4 charges 6–8 days apart.
   - price steps: consecutive amount change ≥ $0.50 and ≥ 3% that persists to
     the latest charge (or ≥2 charges). Refunds (amount < 0) never start a series.
3. **Findings**
   - **paying_twice** — recurring merchant M + a perk whose `includesMerchantId`=M
     and whose provider is present: `statement` perks when `providerMerchantId`
     is recurring; `quiz` perks when `profile.perkProviders` contains provider.id.
     Savings low = `includedTierMonthly×12`, high = `annualCost` of M (cap low ≤ high).
   - **overlap** — ≥2 recurring merchants in the same category among `music`,
     `cloud_storage`, `delivery`, `streaming_video`*: savings = cheaper one's annualCost
     (low and high equal). *streaming_video only when ≥3 services (2 is normal).
   - **phone_switch** — recurring merchant with `carrierId` whose carrier
     `isBigThree`. lines = profile.phoneLines ?? clamp(round(monthly/85),1,5) →
     confidence 'medium' + assumption. Alternatives = plans on the same network,
     total = monthlyTotalByLines[lines] ?? monthlyPerLine×lines, cheapest 3.
     high = (current − cheapest)×12, low = (current − 3rd cheapest)×12; skip if
     high ≤ 0. Always add assumption "assumes your phone is paid off" and carrier
     warnings. Kit = carrier.portOut + "order the eSIM/SIM on <plan url>" + "keep
     the old line until the number ports".
   - **price_step** — one per recurring series with priceSteps: annualIncrease =
     (latest − pre-step)×periods/yr; savings {0,0}.
4. **Totals** — sum savings by merchant (max per merchant across findings) so
   nothing counts twice; price_step excluded. `recurringAnnual` = Σ annualCost.
5. **Needs** — `phoneLines` when a big-3 wireless series exists and
   `profile.phoneLines` is undefined. `perkProviders` (multi) listing quiz-perk
   providers whose included merchant is recurring and not yet answered, plus
   phone-plan tiers for the detected carrier.

## Personas (`fixtures/`, synthetic, 12 months Nov 2025 → Oct 2026)

| file | format | story | must find |
|---|---|---|---|
| `maya_chase_card.csv` | chase_card | Austin renter, Verizon 2 lines ~$165 (step +$10 in Aug 2026), Walmart+ + Peacock, DashPass with a Chase Sapphire, Spotify + Apple Music | phone_switch (Verizon→Visible-class), paying_twice ×2, overlap music, price_step ×1–2 |
| `jordan_amex.csv` | amex | Couple, T-Mobile 3 lines on an Experience plan + pays Netflix, iCloud+ and Google One, Uber One + DashPass | phone_switch (T-Mobile network), paying_twice Netflix (after quiz), overlap ×2 |
| `priya_bofa_checking.csv` | bofa_checking | Already lean: Mint, one music, one streaming | **no savings findings** (maybe one price_step) |

Each persona has ~150–250 rows incl. realistic noise (groceries, gas, rent,
Amazon, restaurants, payroll deposits, card payments, refunds) using real-world
descriptor styles. `personas.json` holds metadata + the profile the demo pre-fills.

## Canonical ids (shared by data/*.json, fixtures and tests)

AGENT: data/ and engine/ are written by different agents — use these exact ids.

- **merchants** (`merchants.json` id): `netflix` `hulu` `disney_plus` `max`
  `peacock` `paramount_plus` `apple_tv` `youtube_premium` `spotify`
  `apple_music` `amazon_music` `icloud` `google_one` `dropbox` `dashpass`
  `uber_one` `instacart_plus` `grubhub_plus` `walmart_plus` `amazon_prime`
  `verizon` `att` `tmobile` `visible` `mint` `cricket` `metro` `us_mobile`
  `tello` `planet_fitness` — add more if useful, never rename these.
- **carriers** (`carriers.json` id, = `MerchantRow.carrierId`): `verizon` `att`
  `tmobile` (isBigThree) and `visible` `mint` `cricket` `metro` `us_mobile` `tello`.
- **perk providers** (`PerkRow.provider.id`): `chase_sapphire_preferred`
  `chase_sapphire_reserve` `amex_platinum` `tmobile_experience_more`
  `tmobile_experience_beyond` `walmart_plus` `instacart_plus` — plus any other
  verified provider. Quiz perks for phone plans set `carrierId: "tmobile"`.

## Out of scope for v0 (roadmap slide)

Plaid sync · Gmail receipts · PDF statements · live gym prices · insurance &
internet switching · LLM labeling of unknown merchants · real Stripe checkout.
