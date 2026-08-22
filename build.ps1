# ---------------------------------------------------------------------------
# Legend — static page assembler
# Composes src/_head.html + src/<name>.body.html + src/_foot.html into the
# flat .html files at the project root. Edit the body files and re-run:
#     powershell -ExecutionPolicy Bypass -File build.ps1
# ---------------------------------------------------------------------------
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$utf8 = New-Object System.Text.UTF8Encoding($false)
function Read-Utf8($path) { return [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8) }

$head = Read-Utf8 (Join-Path $root 'src\_head.html')
$foot = Read-Utf8 (Join-Path $root 'src\_foot.html')

$pages = @(
  @{ n='404';              t='Not Found | Legend';
     d='There is nothing at this address.' },
  @{ n='index';            t='Legend — Private Relationship Management';
     d='A private practice managing the relationship life of exceptional people: assessment, search and introduction, formation, and continuity over years. By application only.' },
  @{ n='practice';         t='The Practice — Five Areas of Relationship Management | Legend';
     d='Assessment, Search & Introduction, Formation, Counsel and Continuity. Retained singly or held together as a mandate — for members who are unattached, already in a relationship, or at a threshold.' },
  @{ n='method';           t='The Method — How an Engagement Runs | Legend';
     d='Six movements, conducted quietly: private consultation, personal profile, curation, assessment, introduction and ongoing advisory. How a Legend engagement is actually run.' },
  @{ n='mandates';         t='Mandates — Levels of Engagement | Legend';
     d='Three levels of private engagement: Reserve, Signature and The Private Mandate. Relationship management from $8,000, agreed privately before any work begins.' },
  @{ n='network';          t='The Private Network — Curated & Unpublished | Legend';
     d='A closed circle of verified individuals, personally met by our advisors. Visibility set by consent on both sides — and dedicated search where the right person is not yet known to us.' },
  @{ n='philosophy';       t='Philosophy — Why Relationship Management Exists | Legend';
     d='Why we decline more than we accept, why the work does not end at an introduction, and what we mean by judgment in a private relationship practice.' },
  @{ n='intelligence';     t='Intelligence — Judgment, Sharpened | Legend';
     d='How Legend uses compatibility analysis, preference mapping and private candidate discovery to narrow the field — and why the decision always remains with a person.' },
  @{ n='discretion';       t='Discretion — A Standard, Not a Feature | Legend';
     d='Visibility by consent, on both sides, withdrawn at a word. How confidentiality, consent and controlled introductions are handled at Legend.' },
  @{ n='about';            t='The House — Legend';
     d='Legend is a private relationship management practice serving international clients from London, New York, Geneva, Dubai and Singapore. Our standards, method and perspective.' },
  @{ n='journal';          t='The Journal — Writing on Partnership & Privacy | Legend';
     d='Considered essays on modern relationships, compatibility, privacy and partnership for people living demanding, international lives.' },
  @{ n='journal-scarcity'; t='The Scarcity Nobody Names: Time, Not Options | Legend Journal';
     d='An essay on why accomplished people struggle to meet the right person — and why the constraint is almost never the number of available candidates.' },
  @{ n='faq';              t='Enquiries — Frequently Asked | Legend';
     d='Answers on application, confidentiality, timelines, introductions, international reach and how a relationship management engagement with Legend works.' },
  @{ n='apply';            t='Private Application — Request a Consultation | Legend';
     d='Begin a private application. Seven short stages, held in confidence, reviewed personally by a member of the advisory team.' },
  @{ n='identity';         t='Legend Identity | Verified in Person';
     d='A standalone identity verification service. One appointment, one code, checkable by anyone. Holding a mark does not make you a client of anything else this house does.' },
  @{ n='verify';           t='Verify a Mark | Legend';
     d='Check a Legend verification code. It confirms that a person was verified in person on a stated date — not their character, their conduct, or their membership of this house.' },
  @{ n='referral';         t='For Professional Advisors — Referrals | Legend';
     d='For family offices, private banks and lawyers whose clients raise something they cannot answer. No referral fees, in either direction, and we never approach your client.' },
  @{ n='privacy';          t='Privacy — What We Hold, and Why | Legend';
     d='What Legend holds about applicants and members, why, who sees it, how long it is kept, and what you can instruct us to do with it.' },
  @{ n='terms';            t='Terms of Engagement | Legend';
     d='What the house undertakes, what we ask of members, how fees work, and how a mandate ends. Your own engagement letter prevails.' },
  @{ n='confidentiality';  t='Confidentiality Undertaking | Legend';
     d='The undertaking given by the house, its advisors and every member — including the three stated limits.' }
)

foreach ($p in $pages) {
  $bodyPath = Join-Path $root ("src\" + $p.n + ".body.html")
  if (-not (Test-Path $bodyPath)) { Write-Warning ("missing: " + $bodyPath); continue }
  $body = Read-Utf8 $bodyPath
  $slug = if ($p.n -eq 'index') { '' } else { $p.n + '.html' }
  $out = $head.Replace('{{TITLE}}', $p.t).Replace('{{DESC}}', $p.d).Replace('{{SLUG}}', $slug)
  $out = $out + "`r`n" + $body + "`r`n" + $foot
  $target = Join-Path $root ($p.n + '.html')
  [System.IO.File]::WriteAllText($target, $out, $utf8)
  Write-Host ("built  " + $p.n + ".html")
}
Write-Host "done."
