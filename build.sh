#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Legend — static page assembler (POSIX twin of build.ps1)
#
# Composes src/_head.html + src/<name>.body.html + src/_foot.html into the flat
# .html files at the project root. Identical output to build.ps1; this one runs
# where PowerShell does not — the Linux sandbox behind claude.ai/code, Git Bash,
# a CI runner.
#
#     ./build.sh            rebuild the 20 public pages
#     ./build.sh --dist     rebuild, then refresh dist/ (the deploy payload)
#
# Keep this file and build.ps1 in step. If you add a page, add it to BOTH page
# lists — a page that exists in one builder and not the other is how dist/ went
# stale in the first place.
# ---------------------------------------------------------------------------
set -euo pipefail

cd "$(dirname "$0")"

[ -f src/_head.html ] || { echo "build.sh: run me from the project (src/_head.html not found)" >&2; exit 1; }

# Command substitution eats trailing newlines, and build.ps1 keeps them: each
# fragment carries its own, and the join adds one more, which is the blank line
# between head and body. The sentinel byte preserves them exactly, so the two
# builders produce the same file down to the last byte.
slurp() { local s; s=$(cat "$1"; printf 'X'); printf '%s' "${s%X}"; }

# Literal find-and-replace. NOT ${var//a/b}: since bash 5.2 an unescaped & on
# the replacement side expands to the matched text, so "Curated & Unpublished"
# put {{TITLE}} straight back into the title it was meant to fill. sed has the
# same trap. This walks the string instead, and means what it says on any bash.
replace() {
  local hay=$1 needle=$2 rep=$3 out='' before
  while [ -n "$hay" ]; do
    before=${hay%%"$needle"*}
    if [ "$before" = "$hay" ]; then out+=$hay; break; fi
    out+="$before$rep"
    hay=${hay#*"$needle"}
  done
  printf '%s' "$out"
}

head_tpl=$(slurp src/_head.html; printf 'X'); head_tpl=${head_tpl%X}
foot_tpl=$(slurp src/_foot.html; printf 'X'); foot_tpl=${foot_tpl%X}

built=0
missing=0

# build <name> <title> <description>
build() {
  local name=$1 title=$2 desc=$3
  local body_path="src/${name}.body.html"

  if [ ! -f "$body_path" ]; then
    printf 'missing: %s\n' "$body_path" >&2
    missing=$((missing + 1))
    return
  fi

  local slug=''
  [ "$name" != 'index' ] && slug="${name}.html"

  local out
  out=$(replace "$head_tpl" '{{TITLE}}' "$title"; printf 'X'); out=${out%X}
  out=$(replace "$out" '{{DESC}}' "$desc"; printf 'X');        out=${out%X}
  out=$(replace "$out" '{{SLUG}}' "$slug"; printf 'X');        out=${out%X}

  local body; body=$(slurp "$body_path"; printf 'X'); body=${body%X}

  printf '%s\n%s\n%s' "$out" "$body" "$foot_tpl" > "${name}.html"
  printf 'built  %s.html\n' "$name"
  built=$((built + 1))
}

build 404 \
  'Not Found | Legend' \
  'There is nothing at this address.'
build index \
  'Legend — Private Relationship Management' \
  'A private practice managing the relationship life of exceptional people: assessment, search and introduction, formation, and continuity over years. By application only.'
build practice \
  'The Practice — Five Areas of Relationship Management | Legend' \
  'Assessment, Search & Introduction, Formation, Counsel and Continuity. Retained singly or held together as a mandate — for members who are unattached, already in a relationship, or at a threshold.'
build method \
  'The Method — How an Engagement Runs | Legend' \
  'Six movements, conducted quietly: private consultation, personal profile, curation, assessment, introduction and ongoing advisory. How a Legend engagement is actually run.'
build mandates \
  'Mandates — Levels of Engagement | Legend' \
  'Three levels of private engagement: Reserve, Signature and The Private Mandate. Relationship management from $8,000, agreed privately before any work begins.'
build network \
  'The Private Network — Curated & Unpublished | Legend' \
  'A closed circle of verified individuals, personally met by our advisors. No public profiles, no directory, no browsing — and dedicated search where the right person is not yet known to us.'
build philosophy \
  'Philosophy — Why Relationship Management Exists | Legend' \
  'Why we decline more than we accept, why the work does not end at an introduction, and what we mean by judgment in a private relationship practice.'
build intelligence \
  'Intelligence — Judgment, Sharpened | Legend' \
  'How Legend uses compatibility analysis, preference mapping and private candidate discovery to narrow the field — and why the decision always remains with a person.'
build discretion \
  'Discretion — A Standard, Not a Feature | Legend' \
  'No public profiles, no member directory, no browsing. How confidentiality, consent and controlled introductions are handled at Legend.'
build about \
  'The House — Legend' \
  'Legend is a private relationship management practice serving international clients from London, New York, Geneva, Dubai and Singapore. Our standards, method and perspective.'
build journal \
  'The Journal — Writing on Partnership & Privacy | Legend' \
  'Considered essays on modern relationships, compatibility, privacy and partnership for people living demanding, international lives.'
build journal-scarcity \
  'The Scarcity Nobody Names: Time, Not Options | Legend Journal' \
  'An essay on why accomplished people struggle to meet the right person — and why the constraint is almost never the number of available candidates.'
build faq \
  'Enquiries — Frequently Asked | Legend' \
  'Answers on application, confidentiality, timelines, introductions, international reach and how a relationship management engagement with Legend works.'
build apply \
  'Private Application — Request a Consultation | Legend' \
  'Begin a private application. Seven short stages, held in confidence, reviewed personally by a member of the advisory team.'
build identity \
  'Legend Identity | Verified in Person' \
  'A standalone identity verification service. One appointment, one code, checkable by anyone. Holding a mark does not make you a client of anything else this house does.'
build verify \
  'Verify a Mark | Legend' \
  'Check a Legend verification code. It confirms that a person was verified in person on a stated date — not their character, their conduct, or their membership of this house.'
build referral \
  'For Professional Advisors — Referrals | Legend' \
  'For family offices, private banks and lawyers whose clients raise something they cannot answer. No referral fees, in either direction, and we never approach your client.'
build privacy \
  'Privacy — What We Hold, and Why | Legend' \
  'What Legend holds about applicants and members, why, who sees it, how long it is kept, and what you can instruct us to do with it.'
build terms \
  'Terms of Engagement | Legend' \
  'What the house undertakes, what we ask of members, how fees work, and how a mandate ends. Your own engagement letter prevails.'
build confidentiality \
  'Confidentiality Undertaking | Legend' \
  'The undertaking given by the house, its advisors and every member — including the three stated limits.'

printf '\n%d built' "$built"
[ "$missing" -gt 0 ] && printf ', %d missing' "$missing"
printf '\n'

# --- dist/ -----------------------------------------------------------------
# The deploy payload. Not a by-product of the page build — the three
# applications are authored directly, not composed from src/ — so it is
# refreshed by copying rather than generating, and only when asked.
if [ "${1:-}" = '--dist' ]; then
  echo
  echo 'refreshing dist/'

  rm -rf dist
  mkdir -p dist

  for f in *.html; do
    case "$f" in
      portal-preview.html|site-preview.html) continue ;;   # artifact bundles, not deployed
    esac
    cp "$f" dist/
  done

  cp -r assets dist/
  for f in robots.txt sitemap.xml CNAME; do
    [ -f "$f" ] && cp "$f" dist/
  done

  printf 'dist/  %s files, %s\n' \
    "$(find dist -type f | wc -l | tr -d ' ')" \
    "$(du -sh dist | cut -f1)"

  cat >&2 <<'WARNING'

  ---------------------------------------------------------------------------
  dist/ now contains portal.html, advisor.html and admin.html.

  None of the three has any authentication — they open on any input, and
  admin.html carries fees, advisor caseloads and the audit trail. robots.txt
  keeps them out of search results; it does not stop anyone who has the URL.

  Gate them or delete them from dist/ before this goes to a live domain.
  ---------------------------------------------------------------------------
WARNING
fi
