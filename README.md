# LEGEND — Website Build

> **Restructured as a private relationship management practice.** The information architecture,
> navigation and home narrative now follow the four practice areas rather than a single search
> service. See [STRUCTURE.md](STRUCTURE.md) for the new architecture and what changed.

A complete, production-ready static site for a private relationship management practice. No
framework, no build dependencies, no tracking. Fourteen pages, two stylesheets, two scripts.

**Open `index.html` in a browser.** Nothing to install.

---

## 1. What is here

```
legend/
├── index.html                 Home
├── practice.html              THE PRACTICE — the four areas (new spine)
├── method.html                How an engagement runs — six movements
├── mandates.html              Mandates — three levels of engagement
├── network.html               The Private Network
├── philosophy.html            Philosophy
├── intelligence.html          Intelligence — how judgment is supported
├── discretion.html            Discretion
├── about.html                 The House
├── journal.html               The Journal (index)
├── journal-scarcity.html      Journal essay No. 04
├── faq.html                   Enquiries
├── apply.html                 Private application — seven-stage intake
├── portal.html                Private Client Portal — member dashboard (preview)
│
├── assets/
│   ├── css/main.css           The entire design system (15 numbered sections)
│   ├── css/portal.css         Portal architecture, layered on the same tokens
│   ├── js/main.js             Reveal, navigation, menu, accordion, staged form
│   ├── js/portal.js           Portal routing, master/detail, decisions, composer
│   └── img/mark.svg           The seal · favicon.svg
│
├── src/                       Page sources — EDIT THESE, then rebuild
│   ├── _head.html             Shared <head>, nav bar, mobile menu
│   ├── _foot.html             Shared footer + script tag
│   └── *.body.html            One file per page: the <main> only
│
├── build.ps1                  Assembles src/ into the flat .html pages
├── CREATIVE-DIRECTION.md      Brand system: essence, colour, type, motion, voice
└── README.md                  This file
```

### Editing

Change a page → edit `src/<page>.body.html`. Change the nav or footer → edit `src/_head.html`
or `src/_foot.html` **once**. Then:

```bash
powershell -ExecutionPolicy Bypass -File build.ps1
```

Page titles and meta descriptions live in the `$pages` table at the top of `build.ps1`.
(If you prefer not to keep a build step, the twelve root `.html` files are complete and
self-contained — you can edit them directly and delete `src/` and `build.ps1`.)

---

## 2. Sitemap

> The authoritative architecture now lives in **[STRUCTURE.md](STRUCTURE.md)** — sitemap,
> the four practice areas, the home narrative, and what the repositioning changed.

## 3. Headline inventory

| Page | Headline | Supporting line |
|---|---|---|
| Home | *The one thing you never delegated.* | For a small number of exceptional people, we manage the private relationship life — understanding it, finding it, forming it, and keeping it well over years. |
| Home §I | You retain people for your capital, your health, your affairs. For *this*, you have had nobody. | — |
| Practice | A relationship, *managed*. | Four areas of work, retained singly or together. An introduction is one of them. |
| Home §VI | Discretion is not a feature. It is a *standard*. | — |
| Method | Nothing to browse. Everything *considered*. | — |
| Mandates | An engagement, not a *subscription*. | You are not purchasing a package. You are entering a private service relationship. |
| Network | A network you cannot *browse*. | There is no directory, no gallery and no search bar. |
| Philosophy | We decline more than we *accept*. | Selectivity is not a marketing posture. It is the only way this work can be done well. |
| Intelligence | Technology narrows the field. *People decide*. | We are not a technology company. |
| Discretion | Not a feature. A *standard*. | What happens here stays here. |
| About | An institution, not a *startup*. | — |
| Journal | Written slowly, read *quietly*. | — |
| Apply | Begin a private application. | Seven short stages. Nothing you write here leaves this house. |

**Messaging architecture** (Home §II, as a contrast list): Not an introduction service → A practice ·
Not more matches → Better judgment · Not an algorithm alone → People who answer for it ·
Not public → Private · Not mass market → Selective · Not a transaction → A retainer.

---

## 4. CTA & microcopy system

**Primary CTA** — *Request a private consultation*. Secondary — *What we manage*, *The practice in full*,
*Apply for a mandate*, *Begin a private application*, *Inside the network*.

Never used anywhere in the build: buy, sign up, get started, free, limited, hurry, discount,
today only, join now, most popular, save.

Supporting microcopy in place:
- Hero: "By application only. Membership is not offered publicly."
- Menu: "By application. All enquiries are held in confidence."
- Membership: "Engagements are agreed privately and in full before any work begins."
- Apply aside: "Reviewed personally by a member of the advisory team. There is no charge and no obligation at this stage. We reply to every application, including those we decline."
- Apply, Stage 04 hint: "We ask directly because these considerations decide more introductions than any other."
- Apply, Stage 06 hint: "Some members ask that our name never appear in their correspondence. That is arranged easily."
- Confirmation: "Nothing you have written will be shared with anyone outside the house."

---

## 5. SEO

Titles and descriptions are set per page in `build.ps1`. Structured data (`ProfessionalService`)
ships in every `<head>`. One `<h1>` per page, verified.

| Page | Title | Target intent |
|---|---|---|
| index | Legend — Private Relationship Management | private relationship management |
| practice | The Practice — Four Areas of Relationship Management \| Legend | relationship advisory / management |
| method | The Method — How an Engagement Runs \| Legend | how elite matchmaking works |
| mandates | Mandates — Levels of Engagement \| Legend | matchmaking cost / packages |
| network | The Private Network — Curated & Unpublished \| Legend | exclusive matchmaking network |
| philosophy | Philosophy — Why Relationship Management Exists \| Legend | selective matchmaking |
| intelligence | Intelligence — Judgment, Sharpened \| Legend | compatibility / matching technology |
| discretion | Discretion — A Standard, Not a Feature \| Legend | discreet / confidential matchmaking |
| about | The House — Legend | elite matchmaking agency |
| journal | The Journal — Writing on Partnership & Privacy \| Legend | editorial / long-tail |
| journal-scarcity | The Scarcity Nobody Names: Time, Not Options \| Legend Journal | long-tail essay |
| faq | Enquiries — Frequently Asked \| Legend | executive matchmaking questions |
| apply | Private Application — Request a Consultation \| Legend | conversion |

Note the trade-off recorded in STRUCTURE.md §8.4: the primary term moves toward *private
relationship management*, which has little search volume today. Keyword density is deliberately
low. Luxury first, SEO second — the terms appear in titles,
descriptions and headings, never stuffed into body copy.

---

## 6. Design system (summary — full rationale in CREATIVE-DIRECTION.md)

**Colour** `--ink #0B0B0C` · `--ink-2 #141416` · `--ivory #F1EEE8` · `--off #FAF8F5` ·
`--champagne #B7A98F` (dark grounds) / `#8C816C` (light grounds). Accent occupies under ~2% of
any screen. Chapters alternate dark → light → dark.

**Type** Cormorant Garamond 300 (display/editorial) + Inter 300–500 (interface). Fluid `clamp()`
scale: display 3.1→8.5rem, h1 2.5→5.5rem, h2 1.95→3.7rem, h3 1.35→2.15rem, lead 1.02→1.32rem,
body 0.94→1.02rem, micro 0.68rem at 0.28em tracking.

**Spacing** 8px base · section rhythm `clamp(6rem,13vh,12rem)` · gutter `clamp(1.5rem,5vw,6rem)` ·
max width 1560px · reading measure 62ch · 12-column grid on `minmax(0,1fr)` tracks.

**Buttons** three only:
`.btn` (underline sweep + extending rule, the default) · `.btn--framed` (hairline box, for
section-closing CTAs) · `.btn--solid` (ivory fill, reserved for form submission). No filled
accent buttons, no shadows, no radii.

**Motion** curve `cubic-bezier(.22,1,.36,1)`, 600–1400ms. Line-masked headline reveals with 90ms
stagger, scaleX rule draws, 1.06→1.00 image settles, 6% hero parallax, hairline hover sweeps.
Fully disabled under `prefers-reduced-motion`, which also removes the entry curtain.

**Imagery** commissioned abstract SVG compositions — an arch of light (home), a colonnade
(experience), concentric apertures (membership), a constellation (network), thresholds
(discretion), a lit window (about). Each is a drop-in slot: replace the `<svg>` inside `.plate`
or `.hero__bg` with an `<img>` at the same aspect ratio when photography is commissioned. Art
direction for that shoot is in CREATIVE-DIRECTION.md §9.

**Layout behaviour** Desktop uses asymmetric 5+7 and 4+8 compositions with columns held
deliberately empty. Below 1024px columns collapse to full width and the bar becomes a full-screen
overlay menu; below 820px the process/entry rows stack; below 700px the contrast lists and paired
fields go single-column. The application page drops from a sticky two-pane shell to a single
column with the stage list hidden and the progress rule retained.

---

## 7. The application flow

Seven stages — Basic information · Lifestyle · Relationship intentions · Preferences ·
Standards & expectations · Privacy & availability · Private consultation — with a hairline
progress rule, a sticky stage index, per-stage validation, inline errors, and a received state.

Required fields are deliberately few: name, email, city, occupation, situation, intention,
search radius, one open answer, and consent. Everything else can be left for the consultation,
which is stated on the page.

---

## 7b. The Private Client Portal (`portal.html`)

A working front-end preview of the member dashboard described in §28 of the brief.

**Entry points on the public site** (added at the client's request):

| Where | What it is |
|---|---|
| Nav bar, right of the primary links | `Member access` — set apart from navigation by a hairline, above 1024px |
| Mobile menu, beneath the consultation CTA | `Member access` |
| Home, section VIII — *Where your file actually lives* | The private profile explained, how access is issued, and the three things the portal holds |
| Footer, Membership column | `Member access` |
| Technology page | The portal panel, relabelled *In preview*, links through |

> **This is now a public door onto a build with no authentication.** It opens on any input, by
> design, so the experience can be reviewed. It must be gated before the site goes to a live
> domain — see §9.9.

**Entry** — a member-access screen (email + access reference). No authentication is performed and
nothing is transmitted or stored; any entry opens the portal. The screen says so, in place.

**Fifteen views**, routed by hash so any one can be deep-linked or demonstrated directly:

| View | What it holds |
|---|---|
| **Overview** | What is waiting, the next appointment, the engagement spine, the advisor's latest word, three action panels, four quiet figures |
| **Proposed for you** | Candidates put forward for a full case. Accept or decline; the rail badge follows |
| **Introductions** | Master/detail. Four introductions; selecting one opens its written case |
| **Appointments** | Upcoming and past, each moveable without explanation |
| **Messages** | One thread, with the advisor only, plus a composer |
| **Persona** | The conversation that builds the model, the traits it has derived, and the record of persona-to-persona screenings |
| **Private profile** | The confidential portrait, **editable by the member** — 18 fields across four sections, with a live completeness meter and a change log |
| **The brief** | The live search brief, with the recorded reasoning for each revision |
| **Intentions** | What the member is seeking, on the record — matched only where both sides state the same thing |
| **Reflections & standing** | Write up a meeting (including a 1–5 figure); see your own standing and what is said most often |
| **What we have learned** | Advisor observations and factual counts — no algorithmic verdicts |
| **Private gatherings** | Dinners and salons, with requests rather than instant booking |
| **Assistant** | A request form and the recent log |
| **Mandate & agreement** | The plan retained, areas held, fee status, the signed agreement and its amendment history |
| **Documents** | Engagement papers and written cases |

**On the persona.** This is the intended differentiator: the member talks to an assistant, the
assistant builds a working model, and with mutual consent two members' personas hold a structured
exchange *before* either spends an evening. The UI is built and honest about its limits — the
assistant's replies are scripted in this build and **no model is connected**. Three product rules
are written into the interface itself, and they are what keep it compatible with the brand:
a persona conversation only ever *narrows*, an advisor still reads and argues every candidate, and
where persona and advisor disagree the advisor prevails.

**On the 1–5 figure.** Built as asked, with three constraints: it is symmetric (everyone assesses
and is assessed), it is private to the member and their advisor, and there is no leaderboard,
ranking or public display anywhere. Individual assessments are never shown verbatim or attributed.
Without those constraints it becomes a rating marketplace, which is the opposite of the house this
site describes.

**Not built: a browsable listing of women for short-term arrangements.** A one-directional
catalogue that paying clients select from — combined with scoring the same people out of five — is
a brokerage pattern, whatever it is called. `Intentions` replaces it and covers the underlying
need: every member states what they are seeking, matching happens only where both sides state the
same thing, consent is per introduction, and nobody is listed or browsable. It also happens to be
the only version consistent with "no directory, no browsing" on `discretion.html`.

**Where a member's information actually goes.** Three places, deliberately:

1. **`apply.html`** — 55 fields across seven stages. This is where the portrait is *created*,
   before membership exists.
2. **Portal → Private profile** — where it is *completed and maintained*. Facts the member owns
   (name, cities, languages, occupation, household) save directly; judgments that steer the search
   (standards, family considerations, non-negotiables) save too but are flagged for the advisor,
   who raises them before the brief actually changes. A completeness meter names what is still
   open, field by field.
3. **Portal → Persona** — what a form cannot reach. The harder material surfaces in conversation
   rather than in a text box.

Reflections after each meeting feed the same portrait from a fourth direction.

**Two further design decisions worth keeping:**

1. **An introduction is a written case, not a profile card.** No photograph, no name, no employer
   until the member accepts — the panel states exactly what is withheld and that the other party
   has not been told who the member is. The portal therefore reproduces the brand promise in its
   interface rather than describing it.
2. **No metrics theatre.** No charts, no compatibility percentages, no "match score". The figures
   shown are counts of things that actually happened (21 assessed, 4 brought to you), and the
   insight view is signed prose from a named advisor that the member is invited to disagree with.

**Interactions that genuinely work:** hash routing with focus management, master/detail selection,
accept/decline on Introduction No. 07 (which cascades to the row, the case header, the rail badge
and the overview panel), sending a message, filing a concierge request, requesting profile and
brief amendments, and document disclosures. All local; typed text is inserted via `textContent`,
never `innerHTML`.

Before it becomes real: authentication and session handling, a backend for every action listed
above, server-side authorisation on each view, and a genuine secure viewer for documents. The
sample member (A. Marchand), advisor (C. Vasseur) and all correspondence are illustrative.

---

## 8. Verified in-browser

- No horizontal overflow on any of the 12 public pages at 375 / 768 / 1100 / 1440px, nor on any of
  the portal's nine views at those widths (the rail's scrolling nav was forcing the shell to
  ~970px until `min-width:0` was applied to the grid and flex children).
- No cramped text columns: every element carrying a span class measures its full share of the
  grid at 1100 and 1440px, and no paragraph renders in a column narrower than 150px.

  > **Fixed after review.** The span classes were written as `grid-column: span N`, which the
  > shorthand expands to `start: span N; end: auto`. Any element that also carried a `.startN`
  > class had its start overwritten, leaving `end: auto` — so it occupied **one** 57px track
  > instead of seven, and its prose broke one word per line in the middle of the page. Every
  > offset composition on the site was affected above 1024px, while mobile looked correct because
  > the breakpoint reset both properties. Spans are now set on `grid-column-end`, which survives
  > an explicit start. Two smaller defects went with it: the brand subtitle wrapped into three
  > stacked lines in the bar, and the hero scroll cue sat on top of the cities row.
- All sampled text meets WCAG AA 4.5:1 on both dark and light grounds, public site and portal
  alike (the faint token was raised from .38/.42 to .52/.60 alpha for this; it is still quiet,
  just legible). Portal figures measured against the composited background chain: 4.89–14.4:1.
- Portal flow: lock → enter, hash routing across all fifteen views, master/detail, the accept
  cascade, message composer (with escaping confirmed), persona conversation, proposal decisions,
  reflection logging, gathering requests, toggles and disclosures.
- Portal rail verified at 650 / 720 / 800 / 860 / 940 / 1080px viewport heights: the rail never
  exceeds the viewport, the advisor block and sign-out stay pinned and visible, and the nav
  scrolls internally only when the screen is under ~940px tall.

  > **Fixed after review.** The rail's inner wrapper was `display:block`, so the nav's
  > `flex:1; overflow-y:auto` never engaged. Once the nav grew from 10 to 15 items the wrapper
  > ran to 1083px inside a 720px rail — the last nav items fell below the fold and the advisor
  > block and sign-out were off screen entirely. The wrapper is now a shrinkable flex column
  > (`min-height:0`), so the nav is the only part that scrolls; the rhythm was also tightened
  > under 940px height so most laptops need no scrolling at all.
- Staged form: blocks on empty required fields, rejects malformed email, advances the progress
  rule, requires consent, and reaches the received state.
- Accordion: exclusive open, measured heights, `aria-expanded` maintained.
- All internal links resolve; no duplicate element IDs; exactly one `<h1>` per page.
- Fonts load and Cormorant renders; page works with JavaScript disabled (`<noscript>` reveals
  all content and the curtain is removed).

---

## 9. Before launch

1. **Wire the application form.** It is front-end only — nothing is transmitted. Point the
   submit handler in `assets/js/main.js` §07 at a secure endpoint, and add server-side
   validation, rate limiting and encrypted storage. Given the sensitivity of stage 3–6 answers,
   treat this data as you would client files, not as marketing leads.
2. **Replace the placeholders**: the domain in `<link rel="canonical">` and the JSON-LD `url`
   (both in `src/_head.html` and `build.ps1`), and `office@legendpartner.com` throughout.
3. **Confirm the factual claims** before they go live: the five city names, "usually within two
   working days", and the three fee thresholds. They are written as the house's own commitments
   and should only ship if they are true.
4. **Commission the photography** and swap it into the `.plate` and `.hero__bg` slots.
5. **Add the legal pages** — privacy policy, terms, confidentiality undertaking. The footer
   links to them as plain text today.
6. **Self-host the two fonts** to remove the Google Fonts request, if privacy posture requires it
   (recommended for this brand). Everything else is already local.
7. **Add `sitemap.xml` and `robots.txt`**, and an OG share image (1200×630) — the meta tags are
   present and awaiting the file.
8. The name **Legend** and the seal are proposed, not cleared. Run trademark and domain checks
   before adopting them.
9. **The portal is a preview, and it is now linked from the public site** (nav, home section VIII,
   mobile menu, footer, Technology page). Before this goes to a live domain it needs real
   authentication, session handling, server-side authorisation on every view, and a backend behind
   each action. Today it opens on any input. Either ship the gate first, or remove the five entry
   points listed in §7b — searching the source for `portal.html` finds all of them.
