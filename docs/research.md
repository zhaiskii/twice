# Build the switcher Zimran doesn't already own

Build the bank-statement savings agent, but narrow it to two jobs that no neutral US product does today. The first is catching services you pay for twice because a phone plan, card or membership already includes them. The second is moving your phone line to a cheaper plan on the same network. On my scoring of the rubric this lands at about 80/100. That beats the best alternatives (an "Ask" negotiation coach at about 75, a daily AI mystery game at about 74) and clearly beats the medical bill auditor (about 64). The reason is that 40% of the grade rewards a product that produces a real, checkable dollar result, and this one does it with deterministic code and sourced, dated price tables the judges can read in the repo. It also has the strongest business precedents of any candidate: Rocket Money has 5.06M paying subscribers and booked $122M in Q3 2026, and Truebill sold for $1.275B at about $100M ARR. The big risk is originality. Zimran runs Subpilot, a cancel-and-negotiate app, and Rocket Money covers the same ground. So the product must not cancel, negotiate, budget or send trial alerts. It finds a cheaper equivalent, removes double-paying, and earns a $20–30 affiliate bounty per phone switch on top of a subscription. With about 13.5 hours left (it is 22:30 in Almaty, and submission closes at 12:00), ship CSV upload, editable synthetic statements, the two core engines, price-creep evidence, switch kits and a transparent paywall. Cut Plaid, Gmail, PDF parsing and live gym search, freeze code at 10:30 and submit by 11:30.

## The re-scoped switcher wins because 40% of the grade rewards provable dollars

Business Cup 2.0 invites 100 teams. Only 10 finalists get a 5-minute pitch plus 2 minutes of Q&A at Nazarbayev University ([Business Cup 2.0](https://businesscup.zimran.io/en)). So the first cut will most likely be made by judges opening your URL, deck and repo without you in the room. They build and run US web funnels from Almaty, but they are unlikely to have a US bank statement or a US hospital bill on hand. That is an inference, but it changes the whole design. **Every candidate will be judged on sample data plus the code.** The winner is the product whose sample a judge can edit and still get correct, explainable answers. Hackathon judges consistently call a live working demo "the single largest score differentiator" ([DEV Community](https://dev.to/kurbaitaev/what-judges-actually-score-notes-from-a-year-of-hackathon-judging-3p4l)). That favours narrow, deterministic engines over broad agents.

| Candidate | Works end-to-end (40) | What we sell / come back (20) | Problem & user (15) | Business (15) | Originality (10) | Total |
|---|---|---|---|---|---|---|
| **Switch agent, re-scoped (recommended)** | 35 | 13 | 13 | 13 | 6 | **80** |
| "Ask" negotiation coach (card APR/fees, rent, salary) | 31 | 14 | 13 | 10 | 7 | 75 |
| "Case Night" daily AI mystery (Entertainment) | 31 | 17 | 9 | 10 | 7 | 74 |
| SAVE-to-RAP student-loan navigator | 37 | 9 | 14 | 8 | 5 | 73 |
| Savings agent as first framed (generic "savings agent", live nearby-gym search) | 31 | 12 | 13 | 12 | 4 | 72 |
| Medical bill auditor | 28 | 9 | 14 | 9 | 4 | 64 |

These scores are my judgment, not measurements. The alternative-ideas research scored Ask at about 82, Case Night at about 79 and SAVE-to-RAP at about 76, but it never put them side by side with the bill agent. I marked each down for reasons explained below.

The re-scoped switcher earns its execution score because almost every part of it is deterministic. Bank CSVs parse in the browser. Recurring charges come from rules that open-source finance apps already use: at least three occurrences, with a tight day-of-month spread ([sure](https://github.com/we-promise/sure/blob/74f811c3/app/models/recurring_transaction/identifier.rb)). Each saving is a lookup against a dated table that names its source. The problem is concrete and fits the target age. Millennials have the highest median subscription spend of any generation at **$77/mo** ([MarketWatch Guides](https://www.marketwatch.com/financial-guides/investing/subscription-fatigue-survey/)). Big-3 unlimited plans run about **$80–120 per line before device payments** ([RedPocket](https://blog.redpocket.com/blog/how-much-is-a-phone-bill-what-you-need-to-know)), while Visible sells unlimited on Verizon's own network for **$25 with taxes included** ([US Mobile blog](https://www.usmobile.com/blog/cheap-phone-plans/)). Wireless prices just rose **+5.9% in a single month (Jul→Aug 2026)** ([BLS CPI](https://www.bls.gov/news.release/archives/cpi_11102026.htm)). The barrier is hassle, not ignorance: about half of 30–44s say switching carriers is a hassle ([YouGov](https://yougov.com/en-us/articles/46143-americans-willing-to-switch-phone-carrier-for-better-deal)). A product that hands over the exact replacement plan and the port-out steps removes that barrier.

The "as first framed" row scores lower for two reasons. Pitched as a generic "savings agent", it reads as Rocket Money or Subpilot. And its "cheaper gym nearby" feature is the riskiest part of the build: no places API includes membership prices, Yelp has no free production tier, and chain pricing pages are JavaScript-heavy ([Google Maps pricing](https://developers.google.com/maps/billing-and-pricing/pricing); [Yelp Places API](https://business.yelp.com/data/products/places-api/)). Narrowing the idea is what adds the eight points.

The medical bill auditor has the deepest pain. US medical debt is at least **$220B** ([KFF](https://www.kff.org/health-costs/the-burden-of-medical-debt-in-the-united-states/)), and new medical collections peak at age 27 ([Health Affairs](https://www.healthaffairs.org/doi/full/10.1377/hlthaff.2018.0349)). It loses on every other criterion:

- **Originality.** The space is crowded:
  - Granted raised a $16.3M seed backed by Truebill's founders ([Indexed.vc](https://indexed.vc/companies/granted-health)).
  - mediloop charges $129 per bill ([mediloop](https://mediloop.ai/)), and BillKarma charges $29–149 ([BillKarma](https://billkarma.app/guides/medical-bill-negotiation-service-cost/)).
  - Counterforce is free ([Counterforce](https://www.counterforcehealth.org/)).
  - Yourside already bundles medical bills with subscription overcharges ([Yourside](https://getyourside.com/)).
- **Business model.** Consumer players keep drifting to B2B: Claimable is selling to drugmakers ([Becker's](https://www.beckershospitalreview.com/finance/revenue-cycle-management/a-third-player-enters-the-ai-arms-race/)), and Avelis launched an employer product almost immediately ([Yahoo/AfroTech](https://finance.yahoo.com/news/avelis-health-ai-powered-company-173727195.html)). That suggests B2C unit economics are hard, and this hackathon is B2C-only.
- **Execution.** Each NCCI unbundling table has more than 1,048,576 rows ([CMS NCCI](https://www.cms.gov/medicare/coding-billing/national-correct-coding-initiative-ncci-edits)). Many real hospital bills arrive as summaries with no codes at all ([Business Insider](https://www.businessinsider.com/claude-helped-negotiate-hospital-bill-discount-medicare-ai-assistant-2026-2)). Judges would see synthetic bills with planted errors, which looks staged.
- **Retention.** Use is episodic, which is the weakest possible answer to "why do users come back tomorrow".

Ask is the strongest alternative, and worth stating fairly. **84% of people who ask for a lower card APR get one, but only 23% ask** ([USA Today/LendingTree](https://www.usatoday.com/story/money/personalfinance/2026/07/09/credit-card-interest-rate-late-fees-payments/90849645007/)). An "ask queue" with a running "$ won" counter is a good habit loop. But the money is won offline on a phone call, so what the judge actually sees in the product is a script and an LLM roleplay. Evidence that people pay for scripts is thin, and a coaching product sits close to Finelo's financial-education territory.

Case Night has the best daily loop but the softest claim to "a fundamental pain they will pay for". SAVE-to-RAP has two problems: it competes with the free StudentAid.gov simulator, and its deadlines expire around the end of 2026 ([Federal Student Aid](https://studentaid.gov/articles/save/)).

The switcher's lead over Ask is narrow, about five points, so this is a call, not a certainty. Three things settle it. The switcher produces a dollar result inside the product, it has the strongest revenue precedents, and the team has already put its research hours into it.

## Subpilot and Rocket Money own cancel-and-negotiate, leaving replace-and-dedupe open

Subpilot is Zimran's own product. Its Android package is `io.zimran.subpilot` ([Google Play](https://play.google.com/store/apps/details?hl=en_US&id=io.zimran.subpilot)), its iOS terms are hosted under a finelo.com domain ([App Store](https://apps.apple.com/us/app/subpilot-cancel-subscription/id6751181747)), and a former Zimran Head of Marketing says he scaled "Finelo and Subpilot" ([LinkedIn](https://linkedin.com/in/dosymzhanbegaidarov)). It detects subscriptions through Plaid, Gmail/Outlook or manual entry, and offers "Cancel for me", bill negotiation, trial alerts and budgeting ([subpilot.tech](https://subpilot.tech/app)). Premium is sold at $9.99, $24.99 or $99.99, plus $4.99 per auto-cancellation ([App Store](https://apps.apple.com/us/app/subpilot-cancel-subscription/id6751181747)). **The judges know this category from the inside, and any feature that duplicates Subpilot's list will be scored as a copy.**

Rocket Money has **5,061K paying subscribers** ([Rocket 10-Q](https://ebs.publicnow.com/view/F542359BCEC440366639450BEF8B755ABA05967D)). It launched Rowan, an AI agent "developed with Anthropic", in August 2026 ([Rocket Q3 2026](https://ir.rocketcompanies.com/news-and-events/press-releases/press-release-details/2026/Rocket-Companies-Announces-Third-Quarter-2026-Results/default.aspx)). It already alerts when a recurring charge rises by more than $1.99 and more than 5% ([Rocket Money](https://www.rocketmoney.com/learn/personal-finance/is-there-an-app-that-can-tell-me-when-my-subscription-price-increased)), so price creep cannot be the headline. But it explicitly will "never downgrade your plan" and keeps you with your current provider, and most negotiated discounts expire after about 12 months ([Rocket Money Help](https://help.rocketmoney.com/en/articles/9744501-bill-negotiation-savings-process)). On **2 Nov 2026** it moved negotiation into the $15/mo Premium+ tier, allowed only one negotiation at a time, and ended automatic renegotiation ([Rocket Money Help](https://help.rocketmoney.com/en/articles/17141357-bill-negotiation-is-moving-to-premium)).

Negotiation is also weak in practice. In CNET's test, Kudos's AI agent completed **zero** bill changes because PIN and OTP checks broke its calls ([Let's Data Science/CNET](https://letsdatascience.com/news/cnet-tests-kudos-ai-bill-negotiation-agent-bd0a866a)). Switching avoids all of that. The saving lasts, and the product never needs the user's provider login.

The white space is real but not empty. T-Mobile's Easy Switch recommends a switch, but only to T-Mobile ([WhistleOut](https://www.whistleout.com/CellPhones/News/tmobile-switching-made-easy)). The only "already included in your perks" tool found is BundleUp, which takes manual input and had 7 upvotes ([Product Hunt](https://www.producthunt.com/products/bundleup-2)).

| Capability | Rocket Money | Subpilot | Our product |
|---|---|---|---|
| Cancel subscriptions | Yes | Yes ("Cancel for me") | **No, by design** |
| Negotiate with current provider | Yes (Premium+ $15/mo since 2 Nov 2026) | Yes | **No** |
| Price-increase alerts | Yes (>$1.99 and >5%) | Trial alerts | Supporting evidence only |
| Recommend a cheaper plan on the same network | No | No | **Core** |
| Detect "you already get this free through your card/plan" | No | No | **Core** |
| Bank or email login required | Bank link | Plaid or Gmail | **None: CSV parsed in the browser** |

The positioning line: **"Rocket Money and Subpilot help you cancel what you don't use and haggle over what you keep. We find the cheaper twin of what you keep, and the things you already get free."** Don't build cancellation, negotiation, budgeting or trial alerts, even as small extras.

If a judge asks "isn't this Subpilot?", answer with the capability table. Then add that the switch engine and its affiliate bounties are revenue a cancel-first app doesn't earn, so it complements Subpilot rather than competing with it. That last point speaks to Zimran's "Extra Business Orientation" value ([Zimran LinkedIn](https://linkedin.com/company/zimran)). Keep it in Q&A, not on a slide, so the product doesn't read as a feature request.

## Thirteen and a half hours: ship one honest path, then widen it

The MVP is a single stateless web app. The browser parses the CSV, normalizes merchant names, and detects recurring charges and price steps. The raw file never leaves the device. One serverless endpoint sends only unique merchant strings and amounts to Claude for structured labeling of unknown merchants. A rules engine then matches the labeled charges against three JSON tables in the repo, where every row carries `source_url` and `checked_on`.

Bank CSV is the right input. Every major US bank exports it, and Bank of America has been CSV-only since OFX ended on 30 Sep 2025 ([CapyParse](https://capyparse.com/blog/how-to-download-bank-statements-as-csv)). Plaid is out: Link is the only way to connect accounts in production, which means a bank login, and the sandbox returns canned data with `user_good`/`pass_good` that would look faked ([Plaid Link](https://plaid.com/docs/link/); [Plaid Sandbox](https://plaid.com/docs/sandbox/test-credentials/)). Gmail is out too: its read scopes are restricted, and unverified apps are capped at 100 users ([Google](https://developers.google.com/workspace/gmail/api/auth/scopes); [Google Help](https://support.google.com/googleapi/answer/7454865?hl=en)).

| Tier | Scope |
|---|---|
| **MVP (must ship)** | Prod URL and public repo. CSV import for Chase, Amex, BofA, Capital One and Discover, plus a generic date/description/amount fallback. Three synthetic 12-month personas, one of them a "clean" household where the engine honestly finds little. An **editable transactions table** that recomputes live. A 3-question quiz (phone lines, cards/memberships held, optional ZIP). The perk-overlap engine. The same-network phone switch with savings shown as ranges. Price-step evidence. Switch kits. A "how we computed this" panel per finding. A "what we send" privacy panel. A transparent Stripe test-mode paywall. A localStorage switch tracker. |
| **Stretch (only if ahead at 06:00)** | Gym chain first-year cost comparison from a dated table. Claude-drafted cancellation email for the duplicate service. Google Places "budget chains near you" by ZIP. |
| **Out (roadmap slide only)** | Plaid auto-sync, Gmail receipts, PDF statements, live gym pricing, insurance/internet switching, medical bills. |

| Need | Real source to use | Caveat |
|---|---|---|
| CSV formats and samples | Header aliases and sample files (`chase_checking.csv`, `amex_creditcard.csv`, etc.) from [statement-normalizer](https://github.com/maxed-oss/statement-normalizer) (Apache-2.0) | Amex charges are positive. Capital One exports cover only 90 days. |
| Realistic descriptors | [HF us-bank-transaction-categories](https://huggingface.co/datasets/DoDataThings/us-bank-transaction-categories) (`GOOGLE *SPOTIFY`, `PLANET FITNESS`) | License not confirmed. Use as a reference and write your own rows. |
| Recurring and price-step logic | [sure](https://github.com/we-promise/sure/blob/74f811c3/app/models/recurring_transaction/identifier.rb) (at least 3 hits, day-of-month SD ≤5 days); [genie](https://github.com/c2siorg/genie/blob/main/agents/subscription_detector/subscription_detector.go) (±5% band, price creep) | Phone bills vary, so key on carrier, not amount stability. |
| MVNO table (~12 rows) | Visible $25 (Verizon), Mint Unlimited $30 (T-Mobile), Tello $25, US Mobile $25, Cricket $40/$35 AutoPay (AT&T) ([US Mobile blog](https://www.usmobile.com/blog/cheap-phone-plans/)); network map ([Slickdeals](https://daily.slickdeals.net/shopping/phone-plan-pros-and-cons/)) | The main source is a competitor's blog. Spot-check official pages tonight and list promos separately. |
| Perk table (~25–30 rows) | T-Mobile Experience plans include Netflix with ads, while Verizon perks are paid add-ons that bill twice ([StreamingBeam](https://streamingbeam.com/blog/free-streaming-you-already-pay-for)). Walmart+ → Peacock or Paramount+; Instacart+ → Peacock ([Cord Cutter Weekly](https://cordcutterweekly.com/the-big-list-of-streaming-deals/)). Amex Platinum $25/mo streaming credit ([Amex](https://www.americanexpress.com/en-us/credit-cards/credit-intel/how-does-the-amex-platinum-digital-entertainment-credit-work/)). Chase Sapphire DashPass ([DoorDash](https://help.doordash.com/en-us/consumers/article/chase-partnership)) | Perks are usually ad tiers, so count only the ad-tier price as the saving. |
| Port-out kit | AT&T `*PORT` (PIN valid 4 days); Verizon `#PORT` (7 days); T-Mobile app or 1-800 number (7 days). Verizon devices activated after 27 Jan 2026 stay locked until paid off ([Gigs KB](https://help.gigs.com/articles/5624814548-porting-to-gigs-from-a-us-carrier-full-carrier-reference)) | Surface the device-lock warning in the kit; it builds credibility. |
| Gym table (stretch) | First-year cost: Planet Fitness $268, Crunch $291.87, LA Fitness $467.88 ([FitWhere](https://www.fitwhere.com/reports/gym-membership-costs)) | Prices vary by location. |

Build order for a three-person team, in Almaty time. Each window ends with a check on the production URL, not just locally.

| Window | Engine (A) | Data and kits (B) | UI and funnel (C) | Exit check |
|---|---|---|---|---|
| 22:30–23:30 | Lock scope; make the repo public | Start the MVNO and perk JSON files | Scaffold Next.js and deploy to Vercel | Prod URL loads in incognito |
| 23:30–03:00 | CSV parsers, normalizer, recurring and price-step detectors, unit tests | Finish the tables with sources and dates; carrier→network map; write 3 persona CSVs | Landing, sample/upload picker, quiz, editable table, result-card skeleton | Tests pass on all persona files |
| 03:00–06:00 | Rules engine: perk overlap, same-network switch with line count and ranges | Switch kits; Claude labeling endpoint with structured output | Connect results to the engine; evidence rows; "how we computed this" | Full sample path works on prod |
| 06:00–08:00 | Edge cases: sign conventions, duplicate rows across files, short export windows | Paywall with plain renewal terms and one-click cancel; localStorage tracker | Mobile layout, error states, API caching | Every statement-normalizer sample imports |
| 08:00–09:30 | README: architecture, deterministic vs LLM parts, sources, limitations, how to run tests | Deck draft | Stretch items only if everything above is green | — |
| 09:30–10:30 | Bug bash on prod from three devices | Deck exported to PDF (≤10 slides) | Record a backup demo video | — |
| **10:30** | **Code freeze** | | | |
| 10:30–11:30 | Submit deck PDF, prod URL and public repo; confirm all three were received | | | Pass/fail items done |

Sleep in staggered 90-minute shifts between 03:00 and 08:00. If you fall behind, cut from the bottom of the MVP row (the gym stretch first, then the quiz's ZIP question). Never cut the editable table or the clean persona. Those two features are what show the judges the results aren't hardcoded.

## A three-minute jury path that proves nothing is hardcoded

The self-serve path has to convince a judge with nobody there to explain it.

| Step | What the judge does or sees | What proves it is real |
|---|---|---|
| 1 | Lands on the hook ("See what you pay twice, no bank login") and picks "Try a sample" or "Upload CSV" | No account. Repo link in the footer. |
| 2 | Picks a persona; a banner reads "Detected: Chase format, 214 rows, 9 recurring" | Parser output, not a canned screen |
| 3 | Answers 3 quiz questions (lines, cards/memberships, ZIP) | Changing an answer changes the findings |
| 4 | Sees "$X/yr" across 3–4 cards: paying twice, phone switch, price step, optional gym | Each card shows the statement rows it used, the rule, and the source link with its "checked on" date |
| 5 | Deletes the Netflix row or edits the Verizon amount | The total recomputes instantly |
| 6 | Loads the clean persona | The engine honestly reports "you're already on a good deal" |
| 7 | Opens a switch kit | Carrier-specific PIN steps and the device-lock warning |
| 8 | Reaches the paywall after the "aha" moment; Stripe test checkout; "what we send" panel | Real checkout; only merchant strings leave the browser |

For the 5-minute final, spend about 30 seconds on the problem, 90 on the live demo (steps 2, 4, 5 and 7), 60 on the Rocket/Subpilot comparison, 60 on the economics, and 30 on the close.

Prepare answers for five questions: "Isn't this Subpilot?", "How do you retain users without bank sync?", "How do you keep prices current?", "What about device financing?" and "Why would a Meta-ad user have a CSV?"

The deck should follow this outline:

| # | Slide | Content |
|---|---|---|
| 1 | Hook | One persona's "$X/yr found" |
| 2 | User and pain | $77/mo millennial spend; $80–120 per line vs $25 on the same network; the +5.9% wireless jump; switching hassle |
| 3 | Product | Three screenshots: upload → findings → switch kit |
| 4 | Why it's real | Deterministic engine, sourced tables, client-side privacy, repo |
| 5 | Why not Rocket Money / Subpilot | Capability table and the positioning line |
| 6 | What we sell | Free scan → paywall → affiliate per switch |
| 7 | Why they come back | Switch-kit cadence, 30-day Bill Detox, price and promo watch |
| 8 | Unit economics | LTV vs CAC, sensitivity, kill criteria |
| 9 | Path to $100M ARR | Payers needed vs Rocket Money's base; expansion categories |
| 10 | Risks and the next 30 days | First $5K test, then PDF and Plaid |

## $65 of year-one value against a $30–40 acquisition cost

Zimran thinks in CAC, LTV and ROI, and in "define the failure criterion before you launch a test" ([Zimran IT School notes](https://www.linkedin.com/posts/aleksandr-lapin_zimran-product-growth-activity-7520837285114699776-xW7b)). Its own funnels run about 33 quiz screens into a $19.99 first period that renews at $39.99 ([Admiral Media](https://admiral.media/web-to-app-funnels-2026/)). The deck should speak that language.

Sell a free scan that shows every finding. The paywall unlocks the switch kits, the switch tracker, and the price and promo watch. A natural checkout upsell is a household scan of a partner's statement, because single-login trackers miss overlaps billed to a partner's card ([subtracker.io](https://subtracker.io/answers/find-overlapping-family-subscriptions)). Add a refund if the kits don't find savings larger than the price, modeled on mediloop's and BillKarma's refund-if-short policies ([mediloop](https://mediloop.ai/); [BillKarma](https://billkarma.app/guides/medical-bill-negotiation-service-cost/)).

Make the checkout visibly clean: renewal price stated up front, one-click cancel, no fake countdown timer. Subpilot's own reviewers complain it is hard to cancel after buying through an Instagram funnel ([App Store](https://apps.apple.com/us/app/subpilot-cancel-subscription/id6751181747)). The FTC's June 2026 complaint against Genesis-linked apps targets exactly the "countdown timer, hidden renewal, hard cancellation" pattern ([FTC complaint](https://search.ftc.gov/system/files/ftc_gov/pdf/Growthmind-Wisey-Complaint.pdf)). Kazakh press this week linked that context to Zimran, though Zimran's involvement is not established ([AIT Media](https://aitmedia.kz/post/britanskiy-regulyator-priznal-reklamu-kazahstanskoy-it-kompanii-zimran-vvodyashchey-v-zabluzhdenie)). Don't mention the press; let the checkout make the point.

| Deck number | Value | Basis |
|---|---|---|
| Price | $7.49 first month, then $14.99/mo, or an annual plan near Monarch's $99 | Rocket Money Premium+ is $15/mo ([Rocket Money](https://help.rocketmoney.com/en/articles/2217739-how-much-does-rocket-money-cost)). Annual plans keep 28.4% of payers at one year vs 8.6% for monthly ([RevenueCat via RocketShip](https://www.rocketshiphq.com/revenuecat-state-of-subscription-apps-2025-summary/)). |
| Year-one subscription value, net | ~$46 | About 3.9 paid months on an assumed survival curve ending near 10% at month 12; ~10% fees and refunds |
| Checkout upsell | ~$9 | Upsells add 20–30% ([FunnelFox](https://blog.funnelfox.com/753-funnels-mobile-app-growth/)) |
| Affiliate per payer | ~$10/yr | US Mobile pays $30 per sign-up ([US Mobile](https://www.usmobile.com/affiliate)); Mint pays up to $20 ([Mint](https://www.mintmobile.com/affiliate-program/)) |
| **Year-one LTV** | **~$65** | Sum of the three rows above (illustrative) |
| CAC per payer | $30–40 base case; $17 best in class | $0.60–1.00 CPC ÷ 2–2.5% purchase rate; US finance CPC $0.43 ([Adjust](https://investgame.net/wp-content/uploads/2025/12/2025-12-17-finance-app-insights-report-2025.pdf)); Cleo's CAC was $17 ([Cleo](https://web.meetcleo.com/2025-annual-report)) |
| LTV:CAC, year one | 1.6–2.2x; break-even CAC ≈ $65 | Payback in about 2–3 months if the upsell and switch bounty land in month one |
| $100M ARR | ~1.03M payers at Rocket Money's realized ~$97/yr, about 20% of its 5.06M paying base | $122M quarterly revenue ÷ 5.06M payers ([10-Q](https://ebs.publicnow.com/view/F542359BCEC440366639450BEF8B755ABA05967D)) |
| Precedent | Truebill: $1.275B at about $100M ARR; Monarch: $100M ARR in Oct 2026 | [Rocket](https://www.rocketcompanies.com/press-release/rocket-companies-to-acquire-truebill-adding-rapidly-expanding-financial-empowerment-fintech-to-the-rocket-platform/); [Monarch](https://pr.capitalpress.com/article/Monarch-hits-dollar100m-in-ARR-acquires-MBI-to-accelerate-next-phase-of-growth/6abe58fda74253059c76f849) |
| Margin levers | Web payment fees 2–5% vs up to 30% in app stores; no Plaid cost of ~$0.30 per connection per month | [FunnelFox](https://blog.funnelfox.com/web-to-app-payments/); [Sacra](https://sacra.com/research/monarch-money-at-100m-arr/) |
| Kill criterion | Stop if CAC > $45 after $5K of Meta spend, or month-2 retention < 50% | Pre-registered, the way Zimran's IT School teaches |

The survival curve, upsell attach rate and affiliate attach rate are assumptions, not benchmarks. Label them that way on the slide and show a ±50% CAC sensitivity.

The honest answer to "why do they come back tomorrow" is that a switch is a project lasting several days, and the product runs it. On day 1 the user generates a transfer PIN, which expires in 4–7 days. Then they order the eSIM, port the number, confirm service and cancel the old line. A perk switch needs one or two billing cycles of overlap before the direct subscription can be cancelled ([StreamingBeam](https://streamingbeam.com/blog/free-streaming-you-already-pay-for)).

Package this as a "30-day Bill Detox", one switch per week, which borrows the 28-day-challenge framing Zimran already uses ([Web2App World](https://web2appworld.com/breakdowns/finelo/)). After that, the watch takes over. It alerts users when a provider in the dataset raises prices, and when intro pricing ends, such as Mint's $15 first term ([US Mobile blog](https://www.usmobile.com/blog/cheap-phone-plans/)). It also targets users whose Rocket-negotiated discounts expire after about 12 months.

One production-funnel fact belongs on slide 10: the Chase app exports only PDFs, and CSV is available only on the website ([Almanac Money](https://almanacmoney.com/cash-flow-forecast/download-bank-transactions)). So the Meta funnel should be quiz-first. Carrier plus line count gives an estimated saving, and the statement upload verifies it and finds more. PDF parsing is the first post-hackathon build.

## Seven risks that can still cost the win

| Risk | Why it matters | Mitigation |
|---|---|---|
| Read as a Subpilot/Rocket clone | Affects the 10% originality score and colours the 20% "what we sell" score | Ship none of their features; capability-table slide; prepared Q&A answer |
| Results look hardcoded | The 40% criterion | Editable table, five bank formats, clean persona, unit tests, sourced and dated rows, README limitations section |
| Wrong phone savings | One charge can bundle several lines, device payments and taxes; Verizon's device lock | Ask the line count; show ranges; use regular prices, not promos; device warning in the kit |
| Weak retention without bank sync | Median monthly plans keep only 8.6% of payers at a year, and AI apps churn about 30% faster ([TechCrunch](https://techcrunch.com/2026/03/10/ai-powered-apps-struggle-with-long-term-retention-new-report-shows/)) | Switch-kit cadence, alerts, monthly re-scan; Plaid for paying users later |
| Affiliate and claims compliance | Mint's program has barred paid advertising traffic ([Commission Academy, 2023](https://commission.academy/blog/best-mobile-phone-affiliate-programs/)); auto-insurance advertisers ban "unrealistic savings" claims ([Marketcall](https://www.marketcall.com/blog/autoinsuranceguide)) | Prefer programs that allow paid social; show ranges, never "save $1,000" |
| Stale prices | MVNO promos change monthly; the table leans on a competitor's blog | `checked_on` per row; spot-check official pages tonight; a refresh script on the roadmap |
| Incumbent response | Rowan could add switching | Neutrality across carriers, plus speed |

Two uncertainties stay open, and the deck should not paper over them. No survey measures how often Americans pay for something their card or phone plan already includes, so don't put a prevalence percentage on a slide. Lead the dollar story with the phone switch, which is well documented. And no public data shows what share of users of a savings app actually complete a switch, so the affiliate line is a hypothesis to test, not a forecast.

## Conclusion

The winning move here is subtraction. The original idea already contained the two defensible wedges. What would have sunk it is the familiar shell around them: subscription tracking, cancellation, negotiation, and a "savings agent" label that matches Zimran's own Subpilot feature for feature. Stripping those out improves originality and makes the 24-hour build easier.

Two further points matter. First, switching earns money twice: a subscription plus a bounty per switch. Meanwhile the industry's success-fee negotiation is collapsing into flat subscription tiers, as Rocket Money did on 2 Nov. That gives the product a business-model story judges who live by LTV:CAC will recognise. Second, because the judges almost certainly can't feed it their own US data, the most valuable hour tonight goes into the editable statement and the "clean" persona, not into any additional feature. The open weakness after the hackathon is retention without bank sync. The honest pitch names it and shows the first test that would measure it.
