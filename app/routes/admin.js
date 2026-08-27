/* ============================================================================
   ADMIN — the operator's view.
   Deliberately narrow. An administrator sees accounts, reports, the things
   reported and the audit trail; they do not get a window onto a member's
   private profile fields, correspondence or approaches. Every action is
   written to the audit log with their name on it, and reading this panel is
   itself recorded.
   ========================================================================== */
import { h, raw, layout, notice, badge } from '../lib/html.js';
import { html, redirect, form as readForm } from '../lib/http.js';
import { checkCsrf, audit } from '../lib/auth.js';
import * as Moderation from '../engines/moderation.js';
import * as Proposal from '../engines/proposal.js';
import * as Profile from '../engines/profile.js';

const TABS = [['', 'Overview'], ['reports', 'Reports'], ['users', 'Users'],
              ['signals', 'Fraud signals'], ['audit', 'Audit log']];

function shell(ctx, active, body, msg) {
  return layout({
    title: 'Admin — Legend', ctx,
    body: h`<section class="wrap dash">
      <nav class="dtabs">${TABS.map(([s, l]) => h`<a href="/admin${s ? '/' + s : ''}"${s === active ? raw(' class="is-on"') : ''}>${l}</a>`)}</nav>
      <div class="dbody">
        <p class="notice notice--warn">This panel shows accounts, reports and the audit trail. It does
        not expose members' private profile fields, their correspondence, or the contents of approaches
        that were not reported. Everything you do here is logged against your name.</p>
        ${msg ? notice(msg.text, msg.kind) : ''}${body}</div></section>`
  });
}
const CSRF = (ctx) => h`<input type="hidden" name="csrf" value="${ctx.session.csrf}">`;

export function overview(ctx, res, msg) {
  const d = ctx.db;
  const n = (sql, ...a) => d.prepare(sql).get(...a).n;
  audit(d, ctx.userId, 'admin.view', 'panel:overview');
  html(res, shell(ctx, '', h`
    <h1 class="h1">Platform.</h1>
    <div class="cards3">
      <article class="card"><h3>Members</h3><p class="big">${n('SELECT COUNT(*) n FROM users')}</p>
        <p class="quiet">${n("SELECT COUNT(*) n FROM users WHERE status='active'")} active ·
        ${n('SELECT COUNT(*) n FROM users WHERE id_verified=1')} identity verified</p></article>
      <article class="card"><h3>Open reports</h3><p class="big">${n("SELECT COUNT(*) n FROM reports WHERE status='open'")}</p>
        <a class="btn" href="/admin/reports">Queue</a></article>
      <article class="card"><h3>Verified couples</h3><p class="big">${n("SELECT COUNT(*) n FROM relationships WHERE status='verified'")}</p>
        <p class="quiet">${n("SELECT COUNT(*) n FROM relationships WHERE status='pending'")} awaiting confirmation</p></article>
    </div>
    <section class="panel"><h2>Activity</h2>
      <dl class="kv">
        <dt>Published profiles</dt><dd>${n('SELECT COUNT(*) n FROM profiles WHERE published=1')}</dd>
        <dt>Approaches sent</dt><dd>${n('SELECT COUNT(*) n FROM proposals')}</dd>
        <dt>Accepted</dt><dd>${n("SELECT COUNT(*) n FROM proposals WHERE status='accepted'")}</dd>
        <dt>Connections</dt><dd>${n('SELECT COUNT(*) n FROM connections')}</dd>
        <dt>Posts</dt><dd>${n('SELECT COUNT(*) n FROM posts')}</dd>
      </dl></section>`, msg));
}

export function reports(ctx, res, msg) {
  const open = Moderation.queue(ctx.db, 'open');
  audit(ctx.db, ctx.userId, 'admin.view', 'panel:reports');
  const subject = (r) => {
    if (r.subject_type === 'user') {
      const u = Profile.byId(ctx.db, r.subject_id);
      return u ? h`<a href="/u/${u.handle}">${u.display_name || u.handle}</a>` : 'a removed member';
    }
    if (r.subject_type === 'post') {
      const p = ctx.db.prepare('SELECT * FROM posts WHERE id=?').get(r.subject_id);
      return p ? h`<span class="quiet">post: ${String(p.body).slice(0, 160)}</span>` : 'a removed post';
    }
    return `${r.subject_type} ${r.subject_id}`;
  };
  html(res, shell(ctx, 'reports', h`
    <h1 class="h1">Reports.</h1>
    ${open.length ? open.map((r) => h`<article class="panel">
      <h2>${r.reason}</h2>
      <p>${subject(r)}</p>
      ${r.detail ? h`<p class="prose">${r.detail}</p>` : ''}
      <p class="quiet">Raised ${String(r.created_at).slice(0, 16).replace('T', ' ')}</p>
      <form method="post" action="/admin/reports/resolve" class="fform">${CSRF(ctx)}
        <input type="hidden" name="id" value="${r.id}">
        <input name="note" placeholder="Note for the record">
        <button class="btn btn--solid" name="decision" value="actioned" type="submit">Uphold and act</button>
        <button class="btn" name="decision" value="dismissed" type="submit">Dismiss</button></form>
      ${r.subject_type === 'user' ? h`<form method="post" action="/admin/user/status" class="fform">${CSRF(ctx)}
        <input type="hidden" name="id" value="${r.subject_id}">
        <input name="note" placeholder="Reason">
        <button class="btn" name="status" value="suspended" type="submit">Suspend</button>
        <button class="btn" name="status" value="banned" type="submit">Ban</button></form>` : ''}
      ${r.subject_type === 'post' ? h`<form method="post" action="/admin/post/hide" class="fform">${CSRF(ctx)}
        <input type="hidden" name="id" value="${r.subject_id}">
        <button class="btn" type="submit">Hide the post</button></form>` : ''}
    </article>`) : h`<p class="empty">The queue is empty.</p>`}`, msg));
}

export function users(ctx, res, msg) {
  const rows = ctx.db.prepare(
    'SELECT u.id,u.handle,u.email,u.status,u.role,u.created_at,u.id_verified,u.email_verified,u.phone_verified, ' +
    'p.display_name, p.published FROM users u LEFT JOIN profiles p ON p.user_id=u.id ORDER BY u.created_at DESC LIMIT 200').all();
  audit(ctx.db, ctx.userId, 'admin.view', 'panel:users');
  html(res, shell(ctx, 'users', h`
    <h1 class="h1">Members.</h1>
    <p class="quiet">Account state and verification only. Profile fields are shown as their owner's
    privacy settings would show them to anyone else.</p>
    ${rows.map((u) => h`<article class="panel">
      <div class="prow"><span><a href="/u/${u.handle}">${u.display_name || u.handle}</a> ·
        <span class="quiet">${u.status}${u.role === 'admin' ? ' · admin' : ''}${u.published ? '' : ' · unpublished'}</span></span>
        <span>${u.id_verified ? badge('Identity', 'is-id') : ''}${u.email_verified ? badge('Email') : ''}${u.phone_verified ? badge('Phone') : ''}</span></div>
      <form method="post" action="/admin/user/status" class="fform">${CSRF(ctx)}
        <input type="hidden" name="id" value="${u.id}">
        <input name="note" placeholder="Reason for the record">
        <button class="btn" name="status" value="active" type="submit">Reinstate</button>
        <button class="btn" name="status" value="suspended" type="submit">Suspend</button>
        <button class="btn" name="status" value="banned" type="submit">Ban</button></form>
      <form method="post" action="/admin/user/verify" class="fform">${CSRF(ctx)}
        <input type="hidden" name="id" value="${u.id}">
        <button class="btn" name="grant" value="identity" type="submit">Grant identity verification</button>
        <button class="btn" name="revoke" value="identity" type="submit">Withdraw it</button></form>
    </article>`)}`, msg));
}

export function signals(ctx, res) {
  const s = Moderation.signals(ctx.db);
  const sus = Proposal.suspicious(ctx.db);
  audit(ctx.db, ctx.userId, 'admin.view', 'panel:signals');
  html(res, shell(ctx, 'signals', h`
    <h1 class="h1">Fraud &amp; abuse signals.</h1>
    <p class="quiet">Computed from counts, not from reading anybody's content.</p>
    <section class="panel"><h2>Repeated display names</h2>
      ${s.dupHandles.length ? s.dupHandles.map((d) => h`<div class="prow"><span>${d.name}</span><span>${d.n} accounts</span></div>`)
        : h`<p class="empty">None.</p>`}</section>
    <section class="panel"><h2>High approach volume, last day</h2>
      ${s.highVolume.length ? s.highVolume.map((d) => h`<div class="prow"><span>user ${d.from_user}</span><span>${d.n} sent</span></div>`)
        : h`<p class="empty">None.</p>`}</section>
    <section class="panel"><h2>Mostly declined</h2>
      ${sus.length ? sus.map((d) => h`<div class="prow"><span>user ${d.from_user}</span>
        <span>${d.declined} of ${d.n} declined</span></div>`) : h`<p class="empty">None.</p>`}</section>
    <section class="panel"><h2>Disputed relationship claims</h2>
      ${s.disputed.length ? s.disputed.map((d) => h`<div class="prow"><span>report ${d.id}</span><span>${d.reason}</span></div>`)
        : h`<p class="empty">None.</p>`}</section>`));
}

export function auditLog(ctx, res) {
  const rows = ctx.db.prepare('SELECT * FROM audit_log ORDER BY at DESC LIMIT 300').all();
  html(res, shell(ctx, 'audit', h`
    <h1 class="h1">Audit log.</h1>
    <p class="quiet">Every sensitive action, including every administrator's — this page included.</p>
    <section class="panel">${rows.map((r) => h`<div class="prow">
      <span>${String(r.at).slice(0, 19).replace('T', ' ')} · ${r.action}</span>
      <span class="quiet">actor ${r.actor == null ? '—' : r.actor} · ${r.subject} ${r.detail}</span></div>`)}</section>`));
}

export async function action(ctx, res, req, what) {
  const b = await readForm(req);
  if (!checkCsrf(ctx, b)) return redirect(res, '/admin');
  const id = parseInt(b.id, 10);
  let r = { ok: true };
  if (what === 'resolve') r = Moderation.resolve(ctx.db, ctx.userId, id, b.decision, b.note);
  else if (what === 'status') r = Moderation.setUserStatus(ctx.db, ctx.userId, id, b.status, b.note);
  else if (what === 'hide') r = Moderation.hidePost(ctx.db, ctx.userId, id, true, b.note);
  else if (what === 'verify') {
    const kind = b.grant || b.revoke;
    r = Moderation.setVerification(ctx.db, ctx.userId, id, kind, !!b.grant);
  }
  const msg = r.error ? { text: r.error, kind: 'bad' } : { text: 'Done, and logged.', kind: 'ok' };
  if (what === 'resolve' || what === 'hide') return reports(ctx, res, msg);
  if (what === 'status' || what === 'verify') return users(ctx, res, msg);
  overview(ctx, res, msg);
}
