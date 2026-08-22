# What was added, and what was deliberately not

Implementation of the gap analysis. Each item states what exists now and where.

---

## The structural inconsistency — resolved

The site sold four practice areas; the application served two. **Formation** and **Continuity**
now have portal views of their own.

- **Formation** (`portal.html#formation`) — retained under the sample mandate but *not yet begun*,
  which is the honest state for a member whose first dinner is next week. The substance is the
  six postponed conversations — money, children, geography, families, becoming known, and what each
  is like at their worst — laid out as work to be done rather than as a description of a service.
- **Continuity** (`portal.html#continuity`) — *not retained*, shown as what it would add and when
  it is properly raised (the March review). It states that the house will decline to sell it to a
  member who does not need it.

Two different inactive states, deliberately: one waiting, one unbought. Neither pretends to be
populated.

---

## Tier 1 — the app could not operate without these

### 1. Onboarding and the commercial chain

`portal.html#mandate` now carries **Fees** and **Verification** alongside the mandate and the
agreement:

- The fee note for the engagement, the amendment recorded at no charge, and the standing terms
  (no monthly charge, no renewal, no outcome-contingent fee).
- An explicit line that fees are never taken in the portal and that the house never asks for bank
  details by email — a phishing defence written into the interface where it is read.
- Verification of the member themselves, stated as reciprocal: *the people you meet were told the
  same about you.*

### 2. The counterpart's side of an introduction

`portal.html#requests` — **Asked of you**. The gap was that every screen assumed the member was
the client; each member is also a candidate for someone else.

Two staged requests: first for an *outline only* (no identity), then for a name exchange that is
simultaneous or not at all. Answering either writes a row to the consent ledger in front of you.
Declining is never explained to the other party and never counted.

### 3. Advisor console — `advisor.html`

A second application, sharing the design system. Seven views:

| View | What it does |
|---|---|
| **Caseload** | Nine mandates ordered by *what is waiting on you*, not by arrival. Severity reads as a stripe before the words do. |
| **Member file** | The brief, the persona as it reads, the history — and a panel headed *What he has not been told*, with the rule that anything affecting a decision he is about to make must be told first. |
| **Candidate pipeline** | Twenty-one assessed, four reached him, and why the other seventeen did not. |
| **Write a case** | The central craft act. A serif composition surface with a word count and a five-point gate. |
| **Persona transcripts** | Read before anything influences a member. Advance, or close it and say why. |
| **Consents to obtain** | What you are waiting on and what you owe. *A refusal is a complete answer.* |
| **Conduct queue** | Reports, with the principal already notified and the reporter's standing untouched. |

The composition gate is the piece worth keeping: **Send** stays disabled until all five
undertakings are ticked *and* the case exceeds 250 words. One of the five is *"a second advisor has
read this and disagreed with something."* The standard is enforced by the tool rather than
described in a policy.

### 4. Trust and safety

`portal.html#safety` — **Safety & conduct**:

- A report form that goes to a principal, not only to the advisor, with four outcomes the member
  chooses between (record it · end contact · act · speak to me first).
- Stated plainly: this never touches your reflections, your standing, or the search.
- First-meeting arrangements — the office holds where you will be, a call at an agreed hour,
  transport home booked in our name.
- Exclusions: people you will never be shown. No reason required, the excluded party never told.

---

## Tier 2 — promised on the site, absent from the product

### 5. Consent ledger — `portal.html#consent`

The strongest single addition. The brand's central promise is *nothing is disclosed without your
consent, for that occasion*. The ledger makes it auditable: fourteen asks, nine agreed, five
refused — and the refusals are shown, struck through, sitting in the record beside the agreements.

Entries are written when the decision is made and never altered. Standing permissions (persona
exchanges, outline requests, gathering seating plans) are individually withdrawable, and one
control suspends every disclosure at once without ending the engagement.

### 6. Data and rights — `portal.html#data`

Every category the house holds, why it exists, and its retention — including the ones kept because
the law requires it, stated as such rather than hidden. Take a copy, correct something, have it
destroyed. Plus the line that matters commercially: *nothing about you is used to train any model
outside this house.*

### 7. Channel control · 8. Account security — `portal.html#account`

The application form asked whether our name should appear in a member's inbox; nothing in the
product honoured it. Now: preferred channel, *never use our name*, quiet hours, and a notification
policy that sends only what needs an answer — no activity notices.

Security: second step at sign-in (flagged as outstanding), new-device alerts, automatic session
end, a device list, and *end every session but this one*.

---

## Tier 3 — completeness

### 9. Day-one empty states

A control in the preview bar — **See it as a new member** — swaps nine views to their empty states
and hides the waiting badges. Each says what happens next rather than apologising for being empty.
The consent ledger's is the best of them: *"Your ledger is empty because nothing about you has been
shared with anyone."*

### 10. Legal pages

`privacy.html` · `terms.html` · `confidentiality.html` — written in the house voice, not boilerplate.

Three things in them are unusual and worth keeping: privacy states *we have never sold member
information and never will*; terms states plainly that **no outcome is guaranteed** and that fees
are returned unearned if the house ends an engagement; confidentiality names the **three
circumstances** in which we may disclose without consent rather than pretending there are none.

Each carries a visible **draft for review** note. They state actual practice and still need counsel
in each jurisdiction.

### 11. Professional referral channel — `referral.html`

For family offices, private banks and lawyers — a stated acquisition channel that had no page.
The position is the differentiator: **no referral fees, in either direction**, because a commission
would give the advisor an interest in the house being retained. We never approach their client, and
we never confirm whether someone made contact.

### 12. Language infrastructure

`hreflang` links and a footer selector for Français, العربية, 中文. Selecting one states that the
language is forthcoming and offers correspondence in it now.

**Deliberately not machine-translated.** A house whose entire proposition is precision of language
cannot ship automatic translation; these need professional translators, and the infrastructure is
ready for them.

---

## What was deliberately not built

**No engagement mechanics.** No notification badges beyond what needs an answer, no streaks, no
"three people viewed your profile", no public reviews, no browsable directory. The differentiator
of this brand is the *absence* of these. A product that pulls a member back three times a day is
precisely what they are paying to escape.

**Journal articles** remain at one published and five forthcoming. Writing five essays of the
required standard is a commissioning decision, not a build task.

---

## Verified

- **Portal**: 22 views route, render and carry titles. No horizontal overflow at 375 / 430 / 768 /
  1280 / 1440 / 1920. Rail fits and sign-out stays visible at every height from 650px up.
- **Advisor console**: 7 views, same widths, same result. The composition gate blocks on both
  conditions independently and re-blocks when the case is shortened.
- **Public site**: 17 pages clean at 375 / 1025 / 1440, no nav spill, no cramped columns, every
  internal link resolves, one `h1` per page.
- **Referral form**: blocks on empty required fields, rejects malformed email, reaches its
  received state.
- Two real defects found and fixed in the process: `.switch` was an inline `<label>` so its width
  was ignored, and the visually hidden radios were inheriting `width:100%` from a later stylesheet
  and pushing the layout 15px sideways.

## Still required before any of this is real

Authentication and sessions for both applications; a backend behind every action; server-side
authorisation per view (the advisor console must not be reachable by a member); a secure document
viewer; and counsel on the three legal pages. Nothing in this build transmits or stores anything.
