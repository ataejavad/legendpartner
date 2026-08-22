# LEGEND — Creative Direction & Brand System
*Private Relationship Management*

---

## 0. The Name

**LEGEND** — from the Latin *legenda*, "the things to be read."

Two older meanings carry the brand, and neither of them is the modern one:

1. **The legend of a seal.** The inscription running around the edge of a seal or a coin — the
   words that say whose authority the mark carries. Our own mark is a seal, and the verification
   seal has its legend around the arc. The name and the mark were made for each other.
2. **The legend of a map.** The key that tells you what you are actually looking at. Without it the
   chart is just marks on paper. That is the practice's whole function applied to a person: not
   more information, but the key that makes the information mean something.

**What the name is not.** It does not mean *legendary*. A house that called itself famous would
have failed the ten-second test in its own name. Every use of the word in our copy should be
readable as *the inscription* or *the key* — never as a boast. If a sentence would still work with
"celebrated" swapped in, rewrite the sentence.

Full lockup: **LEGEND — Private Relationship Management**
Domain: **legendpartner.com** · Office: **office@legendpartner.com**
Signature line: *In confidence.*

**Set as:** LEGEND in the wordmark at 0.42em tracking, uppercase, Inter 500. Never *Legend Partner*
in the wordmark — the domain carries the partner; the mark carries the name.

## 1. Brand Essence

> A private house of relationship advisory for people whose lives are not public property.

We are not a dating service. We are not a platform. We are a **house** — closer to a private bank,
a family office, or a members club than to anything in the consumer relationship market. Members do
not sign up. They are **introduced, assessed, and accepted.**

**Essence in one word:** Discretion.
**Essence in three:** Discretion. Precision. Judgment.

**Pillars**
1. **Discretion** — nothing here is public, ever. A standard, not a feature.
2. **Curation** — fewer introductions, considered longer.
3. **Human judgment** — technology narrows; people decide.
4. **Standards** — we decline more than we accept, on both sides.
5. **Continuity** — an advisory relationship, not a transaction.

## 2. Positioning

| We are | We are not |
|---|---|
| A private advisory house | A dating app or site |
| A curated, closed network | A searchable directory |
| Introductions by judgment | Matches by algorithm |
| A service relationship | A subscription |
| Selective by design | Available to everyone |

**Competitive frame of mind:** private wealth management, elite concierge, members clubs, high-end
hospitality, luxury consulting. **Not** the relationship category.

## 3. Audience

HNW / UHNW individuals, founders, executives, investors, public figures, senior professionals —
international, time-poor, privacy-sensitive, high-standard.

Their problem is **not** meeting people. It is: no time, low signal, no discretion, no reliable way
to assess compatibility, and no willingness to be publicly visible while looking.

So the site sells **quality of selection**, never volume.

## 4. Visual Language

**Register:** Quiet luxury. Editorial. Architectural. Contemporary-gallery restraint. Luxury is
produced by *space, type, pace and precision* — never by ornament.

**Forbidden:** gold gradients, diamonds, crowns, hearts, rings, swipe UI, glowing buttons, smiling
stock couples, script fonts, badges, confetti, glassmorphism, neon.

**Signature devices**
- Hairline rules (1px, 8–14% opacity) as the only dividers.
- Index numeration — 01 to 06, I / II / III — the language of catalogues and archives.
- Wide-tracked micro-labels (0.28em) above generous serif headlines.
- Asymmetric editorial grids; large columns held deliberately empty.
- A fine film grain over dark surfaces, for materiality rather than flatness.

## 5. Colour System

| Token | Value | Role |
|---|---|---|
| `--ink` | `#0B0B0C` | Primary ground (dark chapters) |
| `--ink-2` | `#141416` | Raised dark surface |
| `--char` | `#26262A` | Dark strokes, quiet fills |
| `--ivory` | `#F1EEE8` | Primary ground (light chapters) |
| `--off` | `#FAF8F5` | Raised light surface |
| `--champagne` | `#B7A98F` | Accent — muted, never metallic-bright |
| `--champagne-dim` | `#8C816C` | Accent on light grounds |

Accent ceiling: **~2% of any screen.** It appears in rules, index numerals, focus rings and the
underline sweep — never as a filled button on the light ground.

The site alternates **dark → light → dark** chapters. Contrast is the drama; colour is not.

## 6. Typography System

- **Display / Editorial:** *Cormorant Garamond*, weight 300. High-contrast old-style serif — the
  voice of the brand. Set large and tight (0.92–1.02 line-height), never bold.
- **Interface / Voice:** *Inter*, 300–500. Navigation, body, forms, labels, microcopy.
- **Micro-label:** Inter 500, 0.68rem, uppercase, 0.28em tracking.

Fluid scale via `clamp()`: display 3.2→8.5rem · h1 2.6→5.5rem · h2 2→3.75rem · h3 1.4→2.2rem ·
lead 1.05→1.35rem · body 1rem · micro 0.68rem.

Rule: **one serif statement per screen.** If two headlines compete, one becomes body.

## 7. Spacing & Layout

8px base. Section rhythm `clamp(6rem, 13vh, 12rem)`. Page gutter `clamp(1.5rem, 5vw, 6rem)`.
Max content width 1560px; reading measure capped at 62ch. A 12-column grid, but most compositions
use 5+7 or 4+8 asymmetry.

Whitespace is a material. If a section feels full, remove an element — do not shrink the type.

## 8. Motion Direction

Curve `cubic-bezier(.22,1,.36,1)`. Durations 600–1400ms. Everything eases in from stillness.

- Text reveals line by line under a mask, 90ms stagger.
- Rules draw horizontally from 0 to full width.
- Imagery scales 1.06 → 1.00 over 1.4s on entry.
- Hover: a hairline sweeps left to right beneath a link, 500ms.
- No bounce, no spin, no scroll-jacking, no parallax beyond 6% translate.
- `prefers-reduced-motion` disables all of it and shows the final state.

Target feeling: **calm confidence.** The site should not seem in a hurry to be liked.

## 9. Imagery Direction

No stock couples. No proposals. No smiling to camera.

Subjects: architecture and interiors, private dining rooms, coastlines from altitude, hands, fabric
and stone, silhouettes at windows, two empty chairs facing one another, corridors, thresholds,
transit. Treatment: desaturated, warm-neutral, single-source light, deep shadow, medium-format
editorial grain. Faces are implied, never marketed.

In this build, imagery is rendered as **commissioned abstract SVG compositions** (thresholds, arcs,
apertures, horizons) so no placeholder stock ever appears. Each is a drop-in slot for the eventual
photography — replace the `<svg>` inside `.plate` with an `<img>` at the same aspect ratio.

## 10. UX Philosophy

1. **Fewer decisions per screen.** One idea, one action.
2. **Earned depth.** Information reveals as the visitor descends; nothing is front-loaded.
3. **No pressure mechanics.** No urgency, no counters, no discounts, no sign-up.
4. **The form is the first service moment.** The application must feel like being received, not
   processed — one question group per step, wide margins, quiet progress.
5. **Privacy visible in the interface itself** — no public profiles, no member gallery, nothing to
   browse. The absence of a directory *is* the design statement.

## 11. Brand Voice

Intelligent · calm · confident · selective · warm but restrained · precise.

Short declaratives. The full stop over the exclamation. Never ask for the sale twice. Never use:
*soulmate, perfect match, love, sparks, journey, amazing, exclusive deal, limited spots, hurry.*
Say *introduction*, *candidate*, *consideration*, *standard*, *judgment*, *confidence*, *mandate*.

**Messaging architecture**
- Not more matches. Better matches.
- Not dating. Curation.
- Not an algorithm alone. Human judgment, sharpened by technology.
- Not public. Private.
- Not mass market. Selective.
- Not transactional. Personal.

## 12. The Mark

A minimal seal: a circle (the closed room), a single horizontal hairline (the line that is not
crossed), and one vertical stroke resting upon it (the finger, abstracted to pure geometry). It
reads as a seal or monogram long before it reads as a gesture.

Meaning: **what happens here, stays here.**

It works at 16px (favicon) and at three metres (event signage), in one colour, and is drop-in
replaceable — it lives in `assets/img/mark.svg` and is referenced everywhere by `<use>`.

## 13. Membership Nomenclature

| Tier | Name | Investment | Character |
|---|---|---|---|
| I | **Reserve** | from $8,000 | A defined search within a single market |
| II | **Signature** | from $38,000 | Full advisory, multi-market, unlimited consideration |
| III | **The Private Mandate** | from $120,000 | Bespoke, international, by invitation |

Presented as an engagement, never a pricing table. No billing cycles, no comparison checkmarks, no
"most popular."

## 14. The Ten-Second Test

A visitor who sees only the first screen must conclude: *this is expensive, private, selective, and
not designed for me unless I am exactly who they mean.* If any screen could be mistaken for a dating
app, a marriage agency, a coaching practice or a SaaS landing page — it is rebuilt.
