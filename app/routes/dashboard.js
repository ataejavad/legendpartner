/* ============================================================================
   DASHBOARD — everything the member controls about their own identity.
   Every handler re-derives the owner from the session. Nothing takes an id
   from the request and trusts it.
   ========================================================================== */
import { h, raw, layout, field, notice, plate, badge } from '../lib/html.js';
import { html, redirect, form as readForm } from '../lib/http.js';
import { checkCsrf, endOtherSessions, audit, hashPassword, verifyPassword } from '../lib/auth.js';
import { now } from '../lib/db.js';
import * as Profile from '../engines/profile.js';
import * as Privacy from '../engines/privacy.js';
import * as Rel from '../engines/relationship.js';
import * as Proposal from '../engines/proposal.js';
import * as Content from '../engines/content.js';
import * as Score from '../engines/score.js';
import * as Notif from '../engines/notification.js';
import * as Moderation from '../engines/moderation.js';
import * as Referral from '../engines/referral.js';

const TABS = [
  ['', 'Overview'], ['profile', 'My profile'], ['relationship', 'My relationship'],
  ['score', 'Dating Score'], ['proposals', 'Proposals'], ['connections', 'Connections'],
  ['posts', 'Posts'], ['referrals', 'Referrals'], ['privacy', 'Privacy'], ['verification', 'Verification'],
  ['security', 'Security'], ['notifications', 'Notifications']
];

function shell(ctx, active, title, body, msg) {
  return layout({
    title: title + ' — Legend', ctx,
    body: h`<section class="wrap dash">
      <nav class="dtabs">${TABS.map(([slug, label]) => h`
        <a href="/dashboard${slug ? '/' + slug : ''}"${slug === active ? raw(' class="is-on"') : ''}>${label}</a>`)}</nav>
      <div class="dbody">${msg ? notice(msg.text, msg.kind) : ''}${body}</div>
    </section>`
  });
}
const CSRF = (ctx) => h`<input type="hidden" name="csrf" value="${ctx.session.csrf}">`;

export function overview(ctx, res, msg) {
  const p = Profile.byId(ctx.db, ctx.userId);
  const s = Score.latest(ctx.db, ctx.userId);
  const stats = Proposal.stats(ctx.db, ctx.userId);
  const pending = Rel.activeFor(ctx.db, ctx.userId).filter((r) => r.status === 'pending' && r.b_user === ctx.userId);
  const waiting = Proposal.inbox(ctx.db, ctx.userId).filter((x) => ['sent', 'viewed'].includes(x.status));
  html(res, shell(ctx, '', 'Dashboard', h`
    <h1 class="h1">Your identity.</h1>
    <div class="cards3">
      <article class="card"><h3>Profile</h3>
        <p class="big">${Profile.completeness(ctx.db, ctx.userId)}%</p>
        <p class="quiet">${p.published ? 'Published' : 'Not published — nobody can see it'}</p>
        <a class="btn" href="/dashboard/profile">Edit</a></article>
      <article class="card"><h3>Dating Score</h3>
        <p class="big">${s.score}<span class="quiet">/100</span></p>
        <a class="btn" href="/dashboard/score">What it is made of</a></article>
      <article class="card"><h3>Waiting on you</h3>
        <p class="big">${pending.length + waiting.length}</p>
        <p class="quiet">${pending.length} relationship${pending.length === 1 ? '' : 's'} to confirm · ${waiting.length} approach${waiting.length === 1 ? '' : 'es'}</p>
        <a class="btn" href="/dashboard/proposals">Open</a></article>
    </div>
    <section class="panel"><h2>Where you stand</h2>
      <dl class="kv">
        <dt>Approaches received</dt><dd>${stats.received}</dd>
        <dt>Accepted</dt><dd>${stats.accepted}</dd>
        <dt>Connections</dt><dd>${stats.connections}</dd>
        <dt>Profile views</dt><dd>${stats.views}</dd>
      </dl>
      <p class="quiet">These are yours. They appear on your public page only if you switch them on
      under Privacy, and they are off by default.</p></section>`, msg));
}

/* ---- profile ------------------------------------------------------------ */
export function profileForm(ctx, res, msg) {
  const p = Profile.byId(ctx.db, ctx.userId);
  html(res, shell(ctx, 'profile', 'My profile', h`
    <h1 class="h1">My profile.</h1>
    <form method="post" action="/dashboard/profile" class="fform">
      ${CSRF(ctx)}
      <div class="two">
        ${field('display_name', 'Display name', p.display_name)}
        ${field('full_name', 'Full name', p.full_name, { note: 'Held for verification. It can never be set to public.' })}
        ${field('birth_year', 'Year of birth', p.birth_year, { type: 'number' })}
        ${field('gender', 'Gender', p.gender, { options: ['', ...Profile.GENDERS] })}
        ${field('city', 'City', p.city)}
        ${field('country', 'Country', p.country)}
        ${field('nationality', 'Nationality', p.nationality)}
        ${field('languages', 'Languages', p.languages, { ph: 'English, French' })}
        ${field('profession', 'Profession', p.profession)}
        ${field('education', 'Education', p.education)}
        ${field('rel_status', 'Relationship status', p.rel_status, { options: Profile.REL_STATUS })}
      </div>
      ${field('bio', 'About you', p.bio, { textarea: true, rows: 4, ph: 'In your own words. Nobody improves this for you.' })}
      ${field('intent', 'What you are looking for', p.intent, { ph: 'A long-term partnership' })}
      ${field('goals', 'What you hope for', p.goals, { textarea: true, rows: 2 })}
      ${field('partner_prefs', 'In a partner', p.partner_prefs, { textarea: true, rows: 2 })}
      ${field('lifestyle', 'Lifestyle', p.lifestyle, { textarea: true, rows: 2 })}
      ${field('interests', 'Interests', p.interests, { ph: 'Travel, art, sailing' })}
      ${field('personality', 'Personality', p.personality, { textarea: true, rows: 2 })}
      <button class="btn btn--solid" type="submit">Save</button>
    </form>

    <section class="panel"><h2>Publication</h2>
      <form method="post" action="/dashboard/publish" class="fform">
        ${CSRF(ctx)}
        <label class="chk"><input type="checkbox" name="published" value="1"${p.published ? raw(' checked') : ''}> Publish my profile</label>
        <label class="chk"><input type="checkbox" name="searchable" value="1"${p.searchable ? raw(' checked') : ''}> Let members find me in search</label>
        <label class="chk"><input type="checkbox" name="indexable" value="1"${p.indexable ? raw(' checked') : ''}> Allow search engines to index my profile</label>
        <label class="chk"><input type="checkbox" name="proposals_on" value="1"${p.proposals_on ? raw(' checked') : ''}> Accept approaches</label>
        <label class="chk"><input type="checkbox" name="show_score" value="1"${p.show_score ? raw(' checked') : ''}> Show my Dating Score publicly</label>
        <label class="chk"><input type="checkbox" name="show_stats" value="1"${p.show_stats ? raw(' checked') : ''}> Show my activity statistics publicly</label>
        <button class="btn btn--solid" type="submit">Save</button>
      </form>
      <p class="quiet">Unpublished, the link answers exactly as a page that does not exist — the
      difference between hidden and absent reveals something, so there is none.</p>
      <p class="quiet">Your page: <a href="/u/${ctx.user.handle}">/u/${ctx.user.handle}</a></p>
    </section>

    <section class="panel"><h2>Photographs</h2>
      <div class="gal">${ctx.db.prepare('SELECT * FROM photos WHERE user_id=? ORDER BY ord').all(ctx.userId)
        .map((ph) => h`<figure><img src="${plate(ph.seed)}" alt="">
          <figcaption>${ph.caption} · ${ph.level}</figcaption>
          <form method="post" action="/dashboard/photo/delete">${CSRF(ctx)}
            <input type="hidden" name="id" value="${ph.id}">
            <button class="btn btn--sm" type="submit">Remove</button></form></figure>`)}</div>
      <form method="post" action="/dashboard/photo" class="fform">
        ${CSRF(ctx)}
        ${field('caption', 'Caption', '')}
        ${field('level', 'Who sees it', 'private', { options: Privacy.LEVELS })}
        <button class="btn" type="submit">Add a photograph</button>
      </form>
      <p class="quiet">This preview generates an abstract plate rather than accepting an upload — it
      would be dishonest to invent faces. In service this is a file upload with type and size checks.</p>
    </section>`, msg));
}

export async function saveProfile(ctx, res, req) {
  const b = await readForm(req);
  if (!checkCsrf(ctx, b)) return profileForm(ctx, res, { text: 'Session expired.', kind: 'bad' });
  Profile.update(ctx.db, ctx.userId, b);
  audit(ctx.db, ctx.userId, 'profile.update', `user:${ctx.userId}`);
  profileForm(ctx, res, { text: 'Saved.', kind: 'ok' });
}

export async function publish(ctx, res, req) {
  const b = await readForm(req);
  if (!checkCsrf(ctx, b)) return profileForm(ctx, res, { text: 'Session expired.', kind: 'bad' });
  Profile.setFlags(ctx.db, ctx.userId, {
    published: b.published, searchable: b.searchable, indexable: b.indexable,
    proposals_on: b.proposals_on, show_score: b.show_score, show_stats: b.show_stats
  });
  audit(ctx.db, ctx.userId, 'profile.publish', `user:${ctx.userId}`, b.published ? 'on' : 'off');
  profileForm(ctx, res, { text: 'Saved.', kind: 'ok' });
}

export async function addPhoto(ctx, res, req) {
  const b = await readForm(req);
  if (!checkCsrf(ctx, b)) return redirect(res, '/dashboard/profile');
  const n = ctx.db.prepare('SELECT COUNT(*) n FROM photos WHERE user_id=?').get(ctx.userId).n;
  if (n >= 12) return profileForm(ctx, res, { text: 'Twelve photographs is the limit.', kind: 'bad' });
  const level = Privacy.LEVELS.includes(b.level) ? b.level : 'private';
  ctx.db.prepare('INSERT INTO photos (user_id,caption,seed,level,ord,created_at) VALUES (?,?,?,?,?,?)')
    .run(ctx.userId, String(b.caption || '').slice(0, 120), `${ctx.user.handle}-${n}-${Date.now()}`, level, n, now());
  profileForm(ctx, res, { text: 'Added.', kind: 'ok' });
}

export async function deletePhoto(ctx, res, req) {
  const b = await readForm(req);
  if (!checkCsrf(ctx, b)) return redirect(res, '/dashboard/profile');
  // Scoped by owner: an id from the request can never reach another member's row.
  ctx.db.prepare('DELETE FROM photos WHERE id=? AND user_id=?').run(parseInt(b.id, 10), ctx.userId);
  profileForm(ctx, res, { text: 'Removed.', kind: 'ok' });
}

/* ---- relationship ------------------------------------------------------- */
export function relationship(ctx, res, msg) {
  const rels = Rel.activeFor(ctx.db, ctx.userId);
  const toConfirm = rels.filter((r) => r.status === 'pending' && r.b_user === ctx.userId);
  const awaiting = rels.filter((r) => r.status === 'pending' && r.a_user === ctx.userId);
  const live = rels.filter((r) => ['verified', 'hidden'].includes(r.status));
  const nameOf = (id) => {
    const u = Profile.byId(ctx.db, id);
    return u ? (u.display_name || u.handle) : 'a member';
  };

  html(res, shell(ctx, 'relationship', 'My relationship', h`
    <h1 class="h1">My relationship.</h1>

    ${toConfirm.length ? h`<section class="panel panel--act"><h2>Waiting on you</h2>
      ${toConfirm.map((r) => h`<div class="rrow">
        <div><p class="rrow__t">${nameOf(r.a_user)} says you are ${r.kind.toLowerCase()} with them.</p>
        <p class="quiet">It shows nowhere until you confirm it. Declining is not passed on with a reason.</p></div>
        <div class="rrow__a">
          <form method="post" action="/dashboard/relationship/confirm">${CSRF(ctx)}
            <input type="hidden" name="id" value="${r.id}">
            <button class="btn btn--solid" type="submit">I confirm this</button></form>
          <form method="post" action="/dashboard/relationship/decline">${CSRF(ctx)}
            <input type="hidden" name="id" value="${r.id}">
            <button class="btn" type="submit">Decline</button></form>
        </div></div>`)}</section>` : ''}

    ${awaiting.map((r) => h`<section class="panel"><h2>Awaiting confirmation</h2>
      <p>You recorded a relationship with ${nameOf(r.b_user)}. It is not shown anywhere and will not be
      until they confirm it themselves.</p>
      <form method="post" action="/dashboard/relationship/end">${CSRF(ctx)}
        <input type="hidden" name="id" value="${r.id}">
        <button class="btn" type="submit">Withdraw it</button></form></section>`)}

    ${live.map((r) => h`<section class="panel"><h2>${r.status === 'verified' ? badge('Verified relationship', 'is-rel') : badge('Hidden', 'is-off')}</h2>
      <dl class="kv"><dt>Partner</dt><dd><a href="/u/${(Profile.byId(ctx.db, Rel.partnerOf(r, ctx.userId)) || {}).handle}">${nameOf(Rel.partnerOf(r, ctx.userId))}</a></dd>
        <dt>Status</dt><dd>${r.kind}</dd>
        ${r.started_on ? h`<dt>Since</dt><dd>${r.started_on} · ${Rel.durationText(r.started_on)}</dd>` : ''}</dl>
      <form method="post" action="/dashboard/relationship/joint" class="fform">${CSRF(ctx)}
        <input type="hidden" name="id" value="${r.id}">
        ${field('joint_bio', 'About the two of you', r.joint_bio, { textarea: true, rows: 3 })}
        ${field('joint_values', 'What you value', r.joint_values, { textarea: true, rows: 2 })}
        ${field('joint_goals', 'What you are building', r.joint_goals, { textarea: true, rows: 2 })}
        ${field('level', 'Who can see the couple page', r.level, { options: Privacy.LEVELS })}
        <button class="btn btn--solid" type="submit">Save the couple profile</button></form>
      <form method="post" action="/dashboard/relationship/milestone" class="fform">${CSRF(ctx)}
        <input type="hidden" name="id" value="${r.id}">
        ${field('on_date', 'Date', '', { type: 'date' })}
        ${field('title', 'Milestone', '', { ph: 'We moved in together' })}
        <button class="btn" type="submit">Add a milestone</button></form>
      <div class="rrow__a">
        <form method="post" action="/dashboard/relationship/hide">${CSRF(ctx)}
          <input type="hidden" name="id" value="${r.id}">
          <input type="hidden" name="hidden" value="${r.status === 'verified' ? '1' : '0'}">
          <button class="btn" type="submit">${r.status === 'verified' ? 'Hide it from my profile' : 'Show it again'}</button></form>
        <form method="post" action="/dashboard/relationship/end">${CSRF(ctx)}
          <input type="hidden" name="id" value="${r.id}">
          <button class="btn" type="submit">End the relationship</button></form>
      </div>
      <p class="quiet">Ending it needs no reason and no agreement from your partner. They are told it
      has ended, and not why.</p></section>`)}

    ${!live.length && !awaiting.length ? h`<section class="panel"><h2>Record a relationship</h2>
      <p>Name the member you are with. They receive a request and it shows nowhere until they confirm
      it in their own words. You cannot make someone your partner by saying so.</p>
      <form method="post" action="/dashboard/relationship/claim" class="fform">${CSRF(ctx)}
        ${field('handle', 'Their profile address', '', { ph: 'their-handle', required: true })}
        ${field('kind', 'What it is', 'In a Relationship', { options: Rel.KINDS })}
        ${field('started_on', 'Together since', '', { type: 'date' })}
        <button class="btn btn--solid" type="submit">Send the request</button></form></section>` : ''}`, msg));
}

export async function relAction(ctx, res, req, what) {
  const b = await readForm(req);
  if (!checkCsrf(ctx, b)) return relationship(ctx, res, { text: 'Session expired.', kind: 'bad' });
  const id = parseInt(b.id, 10);
  let r;
  if (what === 'claim') {
    const other = ctx.db.prepare('SELECT * FROM users WHERE handle=?').get(String(b.handle || '').trim().toLowerCase());
    if (!other) return relationship(ctx, res, { text: 'No member with that profile address.', kind: 'bad' });
    r = Rel.propose(ctx.db, ctx.userId, other.id, b.kind, b.started_on);
  } else if (what === 'confirm') r = Rel.confirm(ctx.db, id, ctx.userId);
  else if (what === 'decline') r = Rel.decline(ctx.db, id, ctx.userId);
  else if (what === 'end') r = Rel.end(ctx.db, id, ctx.userId);
  else if (what === 'hide') r = Rel.setHidden(ctx.db, id, ctx.userId, b.hidden === '1');
  else if (what === 'joint') r = Rel.editJoint(ctx.db, id, ctx.userId, b);
  else if (what === 'milestone') r = Content.addMilestone(ctx.db, id, ctx.userId, b.on_date, b.title, b.detail);
  relationship(ctx, res, r && r.error ? { text: r.error, kind: 'bad' } : { text: 'Done.', kind: 'ok' });
}

/* ---- score, proposals, connections, posts ------------------------------- */
export function score(ctx, res) {
  const s = Score.refresh(ctx.db, ctx.userId);
  html(res, shell(ctx, 'score', 'Dating Score', h`
    <h1 class="h1">Dating Score</h1>
    <p class="score__big">${s.score}<span>/100</span></p>
    <p class="lead">${Score.EXPLANATION}</p>
    <section class="panel"><h2>What it is made of</h2>
      ${s.components.map((c) => h`<div class="sig">
        <div class="sig__h"><span>${c.label}</span><span class="quiet">${c.weight}% of the score</span></div>
        <div class="bar"><i style="width:${Math.round(c.value * 100)}%"></i></div>
        <p class="quiet">${c.note}</p></div>`)}
      <p class="quiet">Volume of attention received is deliberately not a signal, and no signal reads a
      payment, a plan or a tier — there is nothing here to buy.</p></section>`));
}

export function proposals(ctx, res, msg) {
  const inbox = Proposal.inbox(ctx.db, ctx.userId);
  const outbox = Proposal.outbox(ctx.db, ctx.userId);
  inbox.filter((p) => p.status === 'sent').forEach((p) => Proposal.markViewed(ctx.db, p.id, ctx.userId));
  const who = (id) => { const u = Profile.byId(ctx.db, id); return u ? (u.display_name || u.handle) : 'a member'; };

  html(res, shell(ctx, 'proposals', 'Proposals', h`
    <h1 class="h1">Proposals.</h1>
    <section class="panel"><h2>Received</h2>
      ${inbox.length ? inbox.map((p) => h`<article class="prop">
        <div><p class="prop__t">${who(p.from_user)} · ${p.kind}</p>
          <p class="prop__m">${p.message}</p>
          <p class="quiet">${p.intent ? p.intent + ' · ' : ''}${p.when_txt} ${p.where_txt} · ${p.status}</p></div>
        ${['sent', 'viewed'].includes(p.status) ? h`<div class="rrow__a">
          <form method="post" action="/dashboard/proposals/accept">${CSRF(ctx)}
            <input type="hidden" name="id" value="${p.id}"><button class="btn btn--solid" type="submit">Accept</button></form>
          <form method="post" action="/dashboard/proposals/decline">${CSRF(ctx)}
            <input type="hidden" name="id" value="${p.id}"><button class="btn" type="submit">Decline</button></form>
        </div>` : ''}</article>`) : h`<p class="empty">Nothing received.</p>`}
      <p class="quiet">Ignoring one is always allowed. Answering, either way, is what the score reads —
      declining counts for as much as accepting.</p></section>
    <section class="panel"><h2>Sent</h2>
      ${outbox.length ? outbox.map((p) => h`<article class="prop">
        <div><p class="prop__t">${who(p.to_user)} · ${p.kind}</p><p class="quiet">${p.status}</p></div>
        ${['sent', 'viewed'].includes(p.status) ? h`<form method="post" action="/dashboard/proposals/cancel">${CSRF(ctx)}
          <input type="hidden" name="id" value="${p.id}"><button class="btn" type="submit">Withdraw</button></form>` : ''}
      </article>`) : h`<p class="empty">Nothing sent.</p>`}</section>`, msg));
}

export async function proposalAction(ctx, res, req, what) {
  const b = await readForm(req);
  if (!checkCsrf(ctx, b)) return proposals(ctx, res, { text: 'Session expired.', kind: 'bad' });
  const id = parseInt(b.id, 10);
  const r = what === 'cancel' ? Proposal.cancel(ctx.db, id, ctx.userId)
                              : Proposal.respond(ctx.db, id, ctx.userId, what === 'accept' ? 'accepted' : 'declined');
  Score.refresh(ctx.db, ctx.userId);
  proposals(ctx, res, r.error ? { text: r.error, kind: 'bad' } : { text: 'Done.', kind: 'ok' });
}

export function connections(ctx, res) {
  const rows = ctx.db.prepare(
    'SELECT * FROM connections WHERE a_user=? OR b_user=? ORDER BY created_at DESC').all(ctx.userId, ctx.userId);
  const following = ctx.db.prepare(
    'SELECT u.handle, p.display_name FROM follows f JOIN users u ON u.id=f.followee ' +
    'LEFT JOIN profiles p ON p.user_id=f.followee WHERE f.follower=?').all(ctx.userId);
  html(res, shell(ctx, 'connections', 'Connections', h`
    <h1 class="h1">Connections.</h1>
    <section class="panel"><h2>Connected</h2>
      ${rows.length ? rows.map((c) => {
        const other = Profile.byId(ctx.db, c.a_user === ctx.userId ? c.b_user : c.a_user);
        return other ? h`<div class="rrow"><div><p class="rrow__t">
          <a href="/u/${other.handle}">${other.display_name || other.handle}</a></p>
          <p class="quiet">Connected ${String(c.created_at).slice(0, 10)}</p></div></div>` : '';
      }) : h`<p class="empty">Nobody yet. A connection is made when an approach is accepted.</p>`}</section>
    <section class="panel"><h2>Following</h2>
      ${following.length ? following.map((f) => h`<div class="rrow"><div><p class="rrow__t">
        <a href="/u/${f.handle}">${f.display_name || f.handle}</a></p></div></div>`)
        : h`<p class="empty">Not following anyone.</p>`}</section>`));
}

export function posts(ctx, res, msg) {
  const mine = Content.mine(ctx.db, ctx.userId);
  const rel = Rel.verifiedFor(ctx.db, ctx.userId);
  html(res, shell(ctx, 'posts', 'Posts', h`
    <h1 class="h1">Posts &amp; experiences.</h1>
    <section class="panel"><h2>Write</h2>
      <form method="post" action="/dashboard/posts" class="fform">${CSRF(ctx)}
        ${field('title', 'Title', '')}
        ${field('kind', 'Kind', 'note', { options: Content.KINDS })}
        ${field('body', 'What happened', '', { textarea: true, rows: 5 })}
        ${field('level', 'Who can see it', 'private', { options: Content.LEVELS })}
        ${rel ? h`<label class="chk"><input type="checkbox" name="rel_id" value="${rel.id}">
          Publish this to our couple profile</label>` : ''}
        <button class="btn btn--solid" type="submit">Publish</button></form></section>
    <section class="panel"><h2>Yours</h2>
      ${mine.length ? mine.map((p) => h`<article class="post">
        ${p.title ? h`<h3>${p.title}</h3>` : ''}
        <p class="post__m">${p.kind} · ${p.level} · ${String(p.created_at).slice(0, 10)}${p.rel_id ? ' · couple' : ''}${p.hidden ? ' · hidden by a moderator' : ''}</p>
        <p>${p.body}</p>
        <form method="post" action="/dashboard/posts/delete">${CSRF(ctx)}
          <input type="hidden" name="id" value="${p.id}"><button class="btn btn--sm" type="submit">Delete</button></form>
      </article>`) : h`<p class="empty">Nothing written yet.</p>`}</section>`, msg));
}

export async function postAction(ctx, res, req, what) {
  const b = await readForm(req);
  if (!checkCsrf(ctx, b)) return posts(ctx, res, { text: 'Session expired.', kind: 'bad' });
  const r = what === 'delete' ? Content.remove(ctx.db, parseInt(b.id, 10), ctx.userId)
                              : Content.create(ctx.db, ctx.userId, b);
  posts(ctx, res, r.error ? { text: r.error, kind: 'bad' } : { text: 'Done.', kind: 'ok' });
}

/* ---- referrals ---------------------------------------------------------- */
export function referrals(ctx, res, msg) {
  const issued = Referral.issuedBy(ctx.db, ctx.userId);
  const open = issued.filter((r) => r.status === 'open');
  const joined = Referral.introduced(ctx.db, ctx.userId);
  const by = Referral.referrerOf(ctx.db, ctx.userId);
  const origin = process.env.PUBLIC_ORIGIN || 'http://localhost:8910';

  html(res, shell(ctx, 'referrals', 'Referrals', h`
    <h1 class="h1">Introducing someone.</h1>
    <p class="lead">A member introduces a person, not a link. You name who it is and why you are
    vouching for them, and your own standing is attached to theirs from the day they join.</p>

    ${by ? h`<section class="panel"><h2>You were introduced by</h2>
      <div class="rrow"><div>
        <p class="rrow__t"><a href="/u/${by.handle}">${by.name}</a></p>
        <p class="quiet">On ${String(by.on).slice(0, 10)}. Shown on your profile only if you open
        <em>Who introduced me</em> under Privacy — and only if they have not closed their own name.</p>
      </div></div></section>` : ''}

    <section class="panel"><h2>Introduce someone</h2>
      ${ctx.user.id_verified ? h`
        <form method="post" action="/dashboard/referrals" class="fform">${CSRF(ctx)}
          ${field('to_name', 'Who they are', '', { required: true, ph: 'Their name, as you would say it' })}
          ${field('to_email', 'Their email', '', { type: 'email', ph: 'Optional. We do not write to them — you send the link yourself.' })}
          ${field('note', 'Why you are vouching for them', '', { textarea: true, rows: 3,
            ph: 'How you know them, and why you would put your name to it. A sentence or two at minimum.' })}
          <button class="btn btn--solid" type="submit">Issue an invitation</button></form>
        <p class="quiet">${Referral.LIMITS.open} open at a time, ${Referral.LIMITS.perWeek} in any week,
        and each lapses after ${Referral.LIMITS.expiryDays} days. The scarcity is the point: an
        invitation that costs nothing to give is worth nothing to receive.</p>`
      : h`<p class="empty">Introductions open once your own identity is verified. Vouching for
        someone puts your standing behind them, and standing has to exist first.</p>
        <a class="btn" href="/dashboard/verification">Verification</a>`}
    </section>

    <section class="panel"><h2>Open invitations</h2>
      ${open.length ? open.map((r) => h`<div class="rrow">
        <div>
          <p class="rrow__t">${r.to_name}${r.to_email ? h` · ${r.to_email}` : ''}</p>
          <p class="ref-code">${r.code}</p>
          <p class="quiet">${r.note}</p>
          <p class="quiet">Lapses ${String(r.expires_at).slice(0, 10)}</p>
        </div>
        <div class="rrow__a">
          <button class="btn btn--sm" type="button" data-copy="${origin}/signup?ref=${r.code}">Copy the link</button>
          <form method="post" action="/dashboard/referrals/revoke">${CSRF(ctx)}
            <input type="hidden" name="id" value="${r.id}">
            <button class="btn btn--sm" type="submit">Withdraw</button></form>
        </div></div>`) : h`<p class="empty">None outstanding.</p>`}
    </section>

    <section class="panel"><h2>Members you introduced</h2>
      ${joined.length ? joined.map((m) => h`<div class="rrow">
        <div><p class="rrow__t"><a href="/u/${m.handle}">${m.name}</a></p>
          <p class="quiet">Joined ${String(m.accepted_at).slice(0, 10)}</p></div>
        <div>${m.acct_status === 'active' && m.upheld === 0
          ? badge('In good standing')
          : badge(m.acct_status !== 'active' ? m.acct_status : 'A report was upheld', 'is-off')}</div>
      </div>`) : h`<p class="empty">Nobody yet.</p>`}
      <p class="quiet">If a report against one of them is ever upheld, you are told, and it shows on
      your own score under <em>Who you vouched for</em>. Introducing a hundred people is worth no more
      there than introducing one — what it reads is whether they are still in good standing.</p>
    </section>

    ${issued.filter((r) => r.status !== 'open' && r.status !== 'accepted').length ? h`
      <section class="panel"><h2>Lapsed and withdrawn</h2>
        ${issued.filter((r) => r.status !== 'open' && r.status !== 'accepted').map((r) => h`
          <div class="prow"><span>${r.to_name}</span><span class="quiet">${r.status}</span></div>`)}
      </section>` : ''}`, msg));
}

export async function referralAction(ctx, res, req, what) {
  const b = await readForm(req);
  if (!checkCsrf(ctx, b)) return referrals(ctx, res, { text: 'Session expired.', kind: 'bad' });
  const r = what === 'revoke'
    ? Referral.revoke(ctx.db, parseInt(b.id, 10), ctx.userId)
    : Referral.issue(ctx.db, ctx.userId, b);
  Score.refresh(ctx.db, ctx.userId);
  referrals(ctx, res, r.error ? { text: r.error, kind: 'bad' }
    : { text: r.code ? `Issued. The code is ${r.code} — send it to them yourself.` : 'Withdrawn.', kind: 'ok' });
}

/* ---- privacy, verification, security, notifications --------------------- */
export function privacy(ctx, res, msg) {
  const levels = Privacy.allLevels(ctx.db, ctx.userId);
  const blocks = Moderation.blocked(ctx.db, ctx.userId);
  const LABEL = {
    display_name: 'Display name', photo: 'Photographs', age: 'Age', gender: 'Gender', city: 'City',
    country: 'Country', nationality: 'Nationality', languages: 'Languages', profession: 'Profession',
    education: 'Education', lifestyle: 'Lifestyle', interests: 'Interests', personality: 'Personality',
    bio: 'About you', intent: 'What you are looking for', goals: 'What you hope for',
    partner_prefs: 'In a partner', rel_status: 'Relationship status', relationship: 'My partner, named',
    score: 'Dating Score', stats: 'Activity statistics', posts: 'Posts',
    referred_by: 'Who introduced me', referrals: 'Members I introduced', full_name: 'Full name'
  };
  html(res, shell(ctx, 'privacy', 'Privacy', h`
    <h1 class="h1">Privacy.</h1>
    <p class="lead">Every field, and who reaches it. Defaults are closed: a field you have never
    touched is private or near it, and one added to the system later starts private too.</p>
    <form method="post" action="/dashboard/privacy" class="fform">${CSRF(ctx)}
      ${Object.keys(levels).map((f) => h`<div class="prow">
        <span>${LABEL[f] || f}</span>
        <select name="lvl_${f}">${Privacy.LEVELS.map((l) => h`<option value="${l}"${l === levels[f] ? raw(' selected') : ''}>${l}</option>`)}</select>
      </div>`)}
      <button class="btn btn--solid" type="submit">Save</button></form>
    <p class="quiet">Full name cannot be made public at any setting.</p>
    <section class="panel"><h2>Blocked</h2>
      ${blocks.length ? blocks.map((b) => h`<div class="rrow"><div><p class="rrow__t">${b.display_name || b.handle}</p></div>
        <form method="post" action="/dashboard/unblock">${CSRF(ctx)}
          <input type="hidden" name="id" value="${b.blocked}"><button class="btn" type="submit">Unblock</button></form></div>`)
        : h`<p class="empty">Nobody is blocked.</p>`}
      <p class="quiet">A block is mutual and silent: neither of you sees the other, and they are not told.</p></section>`, msg));
}

export async function savePrivacy(ctx, res, req) {
  const b = await readForm(req);
  if (!checkCsrf(ctx, b)) return privacy(ctx, res, { text: 'Session expired.', kind: 'bad' });
  for (const [k, v] of Object.entries(b)) {
    if (!k.startsWith('lvl_')) continue;
    try { Privacy.setLevel(ctx.db, ctx.userId, k.slice(4), v); } catch { /* unknown field or level */ }
  }
  audit(ctx.db, ctx.userId, 'privacy.update', `user:${ctx.userId}`);
  privacy(ctx, res, { text: 'Saved.', kind: 'ok' });
}

export async function unblock(ctx, res, req) {
  const b = await readForm(req);
  if (!checkCsrf(ctx, b)) return redirect(res, '/dashboard/privacy');
  Moderation.unblock(ctx.db, ctx.userId, parseInt(b.id, 10));
  privacy(ctx, res, { text: 'Unblocked.', kind: 'ok' });
}

export function verification(ctx, res, msg) {
  const u = ctx.user;
  html(res, shell(ctx, 'verification', 'Verification', h`
    <h1 class="h1">Verification.</h1>
    <p class="lead">Four separate marks with four separate meanings. None of them is a statement about
    character, and none of them makes this platform responsible for how anyone behaves.</p>
    <section class="panel">
      <div class="prow"><span>Email verified</span><span>${u.email_verified ? badge('Verified', 'is-id') : badge('Not yet', 'is-off')}</span></div>
      <div class="prow"><span>Phone verified</span><span>${u.phone_verified ? badge('Verified', 'is-id') : badge('Not yet', 'is-off')}</span></div>
      <div class="prow"><span>Identity verified</span><span>${u.id_verified ? badge('Verified', 'is-id') : badge('Not yet', 'is-off')}</span></div>
      <div class="prow"><span>Relationship verified</span><span>${Rel.verifiedFor(ctx.db, ctx.userId) ? badge('Verified', 'is-rel') : badge('None', 'is-off')}</span></div>
      <form method="post" action="/dashboard/verification" class="fform">${CSRF(ctx)}
        <button class="btn" name="want" value="email" type="submit">Verify my email</button>
        <button class="btn" name="want" value="phone" type="submit">Verify my telephone</button>
        <button class="btn" name="want" value="identity" type="submit">Request identity verification</button>
      </form>
      <p class="quiet">In this preview email and telephone confirm immediately. Identity verification is
      requested here and granted by a person — it is never automatic, because the point of it is that
      somebody looked.</p></section>`, msg));
}

export async function requestVerification(ctx, res, req) {
  const b = await readForm(req);
  if (!checkCsrf(ctx, b)) return verification(ctx, res, { text: 'Session expired.', kind: 'bad' });
  if (b.want === 'email') ctx.db.prepare('UPDATE users SET email_verified=1 WHERE id=?').run(ctx.userId);
  else if (b.want === 'phone') ctx.db.prepare('UPDATE users SET phone_verified=1 WHERE id=?').run(ctx.userId);
  else if (b.want === 'identity') {
    audit(ctx.db, ctx.userId, 'verification.identity.request', `user:${ctx.userId}`);
    Notif.notify(ctx.db, ctx.userId, 'verification',
      'Your identity verification request is with the office. A person reviews it; it is never automatic.', '/dashboard/verification');
  }
  Score.refresh(ctx.db, ctx.userId);
  ctx.user = ctx.db.prepare('SELECT * FROM users WHERE id=?').get(ctx.userId);
  verification(ctx, res, { text: 'Done.', kind: 'ok' });
}

export function security(ctx, res, msg) {
  const sessions = ctx.db.prepare('SELECT * FROM sessions WHERE user_id=? ORDER BY created_at DESC').all(ctx.userId);
  const logins = ctx.db.prepare(
    "SELECT * FROM audit_log WHERE actor=? AND action='account.signin' ORDER BY at DESC LIMIT 10").all(ctx.userId);
  html(res, shell(ctx, 'security', 'Security', h`
    <h1 class="h1">Security.</h1>
    <section class="panel"><h2>Passphrase</h2>
      <form method="post" action="/dashboard/password" class="fform">${CSRF(ctx)}
        ${field('current', 'Current passphrase', '', { type: 'password' })}
        ${field('next', 'New passphrase', '', { type: 'password', note: 'Twelve characters at least.' })}
        <button class="btn btn--solid" type="submit">Change it</button></form></section>
    <section class="panel"><h2>Where this account is open</h2>
      ${sessions.map((s) => h`<div class="prow"><span>${s.id === ctx.session.id ? 'This session' : 'Another session'} · ${String(s.created_at).slice(0, 16).replace('T', ' ')}</span>
        <span class="quiet">${String(s.ua).slice(0, 40)}</span></div>`)}
      <form method="post" action="/dashboard/sessions/end">${CSRF(ctx)}
        <button class="btn" type="submit">End every other session</button></form></section>
    <section class="panel"><h2>Recent sign-ins</h2>
      ${logins.map((l) => h`<div class="prow"><span>${String(l.at).slice(0, 16).replace('T', ' ')}</span></div>`)}</section>
    <section class="panel"><h2>Your data</h2>
      <p class="quiet">A copy of everything held about you, and deletion, are rights rather than favours.</p>
      <div class="rrow__a">
        <a class="btn" href="/dashboard/export">Download everything we hold</a>
        <form method="post" action="/dashboard/delete">${CSRF(ctx)}
          <button class="btn" type="submit">Delete my account and all of it</button></form>
      </div></section>`, msg));
}

export async function changePassword(ctx, res, req) {
  const b = await readForm(req);
  if (!checkCsrf(ctx, b)) return security(ctx, res, { text: 'Session expired.', kind: 'bad' });
  if (!verifyPassword(String(b.current || ''), ctx.user.pass_hash, ctx.user.pass_salt))
    return security(ctx, res, { text: 'The current passphrase is not right.', kind: 'bad' });
  if (String(b.next || '').length < 12)
    return security(ctx, res, { text: 'Twelve characters at least.', kind: 'bad' });
  const { hash, salt } = hashPassword(String(b.next));
  ctx.db.prepare('UPDATE users SET pass_hash=?, pass_salt=? WHERE id=?').run(hash, salt, ctx.userId);
  endOtherSessions(ctx.db, ctx.userId, ctx.session.id);
  audit(ctx.db, ctx.userId, 'account.password', `user:${ctx.userId}`);
  ctx.user = ctx.db.prepare('SELECT * FROM users WHERE id=?').get(ctx.userId);
  security(ctx, res, { text: 'Changed, and every other session ended.', kind: 'ok' });
}

export async function endSessions(ctx, res, req) {
  const b = await readForm(req);
  if (!checkCsrf(ctx, b)) return redirect(res, '/dashboard/security');
  endOtherSessions(ctx.db, ctx.userId, ctx.session.id);
  security(ctx, res, { text: 'Every other session ended.', kind: 'ok' });
}

export function exportData(ctx, res) {
  const d = ctx.db, id = ctx.userId;
  const bundle = {
    exported_at: now(),
    account: (({ pass_hash, pass_salt, ...rest }) => rest)(d.prepare('SELECT * FROM users WHERE id=?').get(id)),
    profile: d.prepare('SELECT * FROM profiles WHERE user_id=?').get(id),
    privacy: d.prepare('SELECT * FROM privacy WHERE user_id=?').all(id),
    photos: d.prepare('SELECT * FROM photos WHERE user_id=?').all(id),
    relationships: d.prepare('SELECT * FROM relationships WHERE a_user=? OR b_user=?').all(id, id),
    proposals_sent: d.prepare('SELECT * FROM proposals WHERE from_user=?').all(id),
    proposals_received: d.prepare('SELECT * FROM proposals WHERE to_user=?').all(id),
    posts: d.prepare('SELECT * FROM posts WHERE user_id=?').all(id),
    notifications: d.prepare('SELECT * FROM notifications WHERE user_id=?').all(id),
    score: Score.latest(d, id)
  };
  audit(d, id, 'account.export', `user:${id}`);
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Disposition': `attachment; filename="legend-${ctx.user.handle}.json"`
  });
  res.end(JSON.stringify(bundle, null, 2));
}

export async function deleteAccount(ctx, res, req) {
  const b = await readForm(req);
  if (!checkCsrf(ctx, b)) return redirect(res, '/dashboard/security');
  audit(ctx.db, ctx.userId, 'account.delete', `user:${ctx.userId}`);
  // Cascades take the profile, photos, posts, proposals and relationships with it.
  ctx.db.prepare('DELETE FROM users WHERE id=?').run(ctx.userId);
  redirect(res, '/');
}

export function notifications(ctx, res) {
  const list = Notif.list(ctx.db, ctx.userId);
  Notif.markAllRead(ctx.db, ctx.userId);
  html(res, shell(ctx, 'notifications', 'Notifications', h`
    <h1 class="h1">Notifications.</h1>
    <section class="panel">
      ${list.length ? list.map((n) => h`<div class="nrow">
        <p class="nrow__b">${n.body}</p>
        <p class="quiet">${n.kind} · ${String(n.created_at).slice(0, 16).replace('T', ' ')}
        ${n.link ? h` · <a href="${n.link}">Open</a>` : ''}</p></div>`)
        : h`<p class="empty">Nothing yet.</p>`}
      <p class="quiet">Every one of these says why it was sent. None of it is marketing.</p></section>`));
}
