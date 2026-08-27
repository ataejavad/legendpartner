# Dating & Relationship Public Profile

A working application, not a mockup: HTTP server, database, sessions, APIs,
public pages, member dashboard, admin panel and moderation.

## Running it

```
node seed.js            # demonstration data (six members, one verified couple, one operator)
node server.js          # http://localhost:8910
node test/e2e.js        # 76 end-to-end checks against a real server
```

Node 22.5 or newer. **No dependencies** — the database is `node:sqlite`, the
server is `node:http`, and password hashing is `node:crypto` scrypt. Nothing to
install and nothing in the supply chain.

Demonstration sign-ins: `a-marchand@example.com` / `a-long-enough-passphrase`,
operator `office@example.com` / `an-administrator-passphrase`.

## Shape

```
lib/        db (schema + migrations) · http (router, cookies, headers) · auth · html
engines/    profile privacy relationship verification score proposal
            discovery content notification moderation rate
routes/     pages (public) · account · dashboard · admin · api
static/     app.css · app.js
test/       e2e.js
```

The engines are the product. Routes render what an engine returned and never
decide anything themselves, so the JSON API cannot be more permissive than the
page, and a new surface inherits the rules rather than re-implementing them.

## The decisions worth knowing

**Nobody can name you as their partner.** A relationship is created `pending`
and reaches `verified` only through the *other* person's own authenticated
request. A third party cannot confirm it, the claimant cannot confirm their own
claim, and either side can end it without a reason. Every transition is written
to an internal audit that no public page reads.

**Privacy is one function.** `privacy.visible(db, owner, viewer, field)` is
asked on every read path. Defaults are closed, and a field with no default is
private — so a column added to the schema is invisible until somebody names it.
`full_name` cannot be made public at any setting.

**Search cannot probe.** Filtering on a field the owner keeps closed drops the
row rather than confirming a match, so discovery cannot be used to learn what
somebody hid.

**A private page and a missing page answer identically.** Both 404. A
distinguishable "this is hidden" would itself be a disclosure.

**The score is a list of named signals** (`engines/score.js`), each a pure
function with a sentence explaining itself. Changing the algorithm touches
`SIGNALS` and nothing else. Volume of attention received is deliberately not a
signal, and no signal reads a payment, plan or tier — there is nothing to buy.

**The operator panel is narrow.** Accounts, reports, the reported items and the
audit trail. Not private profile fields, not correspondence, not the contents of
approaches nobody reported. Every administrative action — and every read of the
panel — is logged against the administrator's name.

## Security

Sessions are opaque random ids in `HttpOnly; SameSite=Lax` cookies, revocable
server-side. Every state-changing request carries a per-session CSRF token,
compared in constant time. Every SQL statement is prepared with bound
parameters. Every interpolation into HTML is escaped by the `h` tag; opting out
requires writing `raw()`. CSP, `nosniff`, `DENY` framing and a referrer policy
are on every response. Rate limits sit in the engines rather than the routes:
per-address on requests, sign-in and sign-up; per-member on approaches, with a
six-month cooldown after a decline.

Members can export everything held about them as JSON and delete the account
outright — both are rights, both are audited, and the export carries no password
material.

## What is deliberately not built

Photograph **upload** is a caption plus a generated abstract plate. Inventing
faces for a consent product would be dishonest, and a real upload path needs
type sniffing, size limits, stripping EXIF and out-of-process storage — worth
doing properly rather than gesturing at.

Email and telephone verification confirm immediately in this build; identity
verification is *requested* here and granted by a person in the admin panel,
because the whole value of that mark is that somebody looked.

There is no payment, plan or tier anywhere. Monetisation would attach at the
membership layer without touching the score, which is why no signal reads one.
