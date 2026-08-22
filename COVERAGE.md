# Coverage audit — every capability, every actor

Three actors touch this product: the **member** (`portal.html`), the **advisor**
(`advisor.html`), and the **public** (the site). A capability is only finished when each of them
who should have a surface has one.

This is the audit and what it found.

---

## The result

| Capability | Public | Member | Advisor | |
|---|---|---|---|---|
| Assessment | ✓ practice | ✓ profile · persona | ✓ member file · brief | |
| Search & Introduction | ✓ practice · method | ✓ proposed · introductions | ✓ pipeline · compose | |
| Formation | ✓ practice | ✓ formation | **✓ relationship work** | fixed |
| Counsel | ✓ practice | ✓ counsel | **✓ relationship work** | fixed |
| Continuity | ✓ practice | ✓ continuity | **✓ relationship work** | fixed |
| Persona | ✓ index · intelligence | ✓ persona | ✓ transcripts | |
| Consent ledger | ✓ discretion | ✓ consent | ✓ consents to obtain | |
| Consent requests | — | ✓ asked of you | ✓ consents to obtain | |
| Verification mark | ✓ identity · verify | ✓ credential | ✓ verification | |
| Reflections & standing | — | ✓ reflections | **✓ from members** | fixed |
| Private gatherings | **✓ network · mandates** | ✓ parties | **✓ from members** | fixed |
| Concierge / assistant | — | ✓ assistant | **✓ from members** | fixed |
| Safety & conduct | ✓ confidentiality · terms | ✓ safety | ✓ conduct queue | |
| Data & rights | ✓ privacy | ✓ what we hold | — | |
| Account & security | — | ✓ account | — | |
| Intentions | — | ✓ intentions | ✓ member file | |
| Mandate · fees · agreement | ✓ mandates · terms | ✓ mandate | ✓ caseload | |
| Correspondents | ✓ index | — | — | |
| Professional referral | ✓ referral | — | — | |

---

## What the audit found

### 1. Reflections were written into a void — the worst of them

A member wrote a reflection after every meeting. The interface said *"Sent to C. Vasseur"*. The
console contained **zero** occurrences of the word.

That is worse than not having the feature: the member believes it was received, adjusts nothing,
and waits for a search to improve because of something nobody read. The single most valuable
feedback loop in the business had no receiving end.

**Fixed** — the console now has **From members**, an inbound tray. Reflections arrive with the
score and the words, are marked read (which the member can see), and can be recorded against the
brief. The badge only clears when everything has been read, and the copy says why:

> Read. Everything a member has written to you has now been seen — which is the only state this
> page should ever rest in.

It also carries the rule that matters: *a reflection that contradicts the brief twice is the
brief's fault. Telephone the member before the third candidate, not after.*

### 2. Counsel had no advisor surface at all

The newest practice area — added at the client's request — existed for the member and on the
public site, and nowhere for the person who would actually deliver it. Formation and Continuity
were named in the caseload but had no working surface either.

**Fixed** — **Relationship work**: the three non-search areas in one place, with the observation
that they fail differently from a search:

> A search that stalls is visible. Relationship work that stalls is not — nobody complains, they
> simply stop coming.

It also carries the separations that make counsel usable: notes live with the counsel and not in
the member's file; nothing said in counsel enters a profile, brief or persona; where an advisor
holds both a member's search and their counsel, they must say so and offer to hand one on.

### 3. Concierge and gathering requests had no recipient

Members filed concierge requests and asked for places at gatherings. Both landed nowhere.

**Fixed** — both now sit in the inbound tray, with the operational rule attached: every venue is
checked against the member's exclusion list before booking, and places at a gathering are
allocated by the house rather than in order of asking.

### 4. Private gatherings were invisible to the public

A real membership benefit that appeared only after sign-in. Nobody considering an engagement could
learn it existed.

**Fixed** — a section on `network.html` (*Where the network meets*), and two lines added to what
Signature and the Private Mandate include.

---

## Two defects found in passing

Chapter alternation (the dark → light → dark rhythm the design depends on) had broken on
`intelligence.html` and `discretion.html`, leaving two same-toned sections adjacent. Both
corrected; all nineteen public pages now alternate without fault.

---

## Verified after the fixes

- Public: 19 pages, no horizontal overflow at 375 or 1440, no alternation faults, one `h1` each.
- Member portal: 24 views, clean at 375×812 and 1280×720, rail fits and sign-out visible.
- Advisor console: 10 views, same widths, same result.
- The reflection loop: written by the member → appears unread in the console → marked read →
  badge decrements → tray reaches empty with an explicit statement.

## Still deliberately one-sided

Some capabilities correctly have only one surface, and the audit should not force symmetry:

- **Account & security** and **Data & rights** are the member's alone. An advisor has no business
  in either.
- **Correspondents** and **professional referral** are public acquisition surfaces with no member
  or advisor counterpart.
- **Consent requests** have no public surface by design — there is nothing about this that a
  non-member should be able to see.
