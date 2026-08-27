/* ============================================================================
   ACCOUNT — sign up, sign in, sign out, and the proposal / report / block
   flows that hang off another member's profile.
   ========================================================================== */
import { h, layout, field, notice, plate } from '../lib/html.js';
import { html, redirect, form as readForm } from '../lib/http.js';
import { hashPassword, verifyPassword, startSession, endSession, checkCsrf, audit } from '../lib/auth.js';
import { now } from '../lib/db.js';
import { setCookie } from '../lib/http.js';
import * as Profile from '../engines/profile.js';
import * as Proposal from '../engines/proposal.js';
import * as Moderation from '../engines/moderation.js';
import * as Content from '../engines/content.js';
import * as Score from '../engines/score.js';
import { hit } from '../engines/rate.js';
import { notFound } from './pages.js';

const HANDLE_RX = /^[a-z0-9][a-z0-9-]{2,29}$/;

function shell(ctx, title, body) {
  return layout({ title: title + ' — Legend', ctx, body });
}

export function signupForm(ctx, res, err) {
  if (ctx.user) return redirect(res, '/dashboard');
  html(res, shell(ctx, 'Create a profile', h`
    <section class="wrap band narrow">
      <h1 class="h1">Create a profile.</h1>
      <p class="lead">Nothing is published when you sign up. Every field starts closed, and the profile
      itself stays unpublished until you choose otherwise.</p>
      ${notice(err, 'bad')}
      <form method="post" action="/signup" class="fform">
        ${field('email', 'Email', '', { type: 'email', required: true })}
        ${field('handle', 'Profile address', '', { required: true, note: 'Letters, numbers and hyphens. Your page will be /u/your-handle.' })}
        ${field('display_name', 'Display name', '', { required: true, note: 'What people see. It need not be your legal name.' })}
        ${field('password', 'Passphrase', '', { type: 'password', required: true, note: 'At least twelve characters.' })}
        <button class="btn btn--solid" type="submit">Create it</button>
      </form>
      <p class="quiet">Already have one? <a href="/signin">Sign in</a>.</p>
    </section>`));
}

export async function signup(ctx, res, req) {
  const b = await readForm(req);
  const email = String(b.email || '').trim().toLowerCase();
  const handle = String(b.handle || '').trim().toLowerCase();
  const name = String(b.display_name || '').trim();
  const pass = String(b.password || '');

  if (!hit(ctx.db, `signup:${ctx.ip}`, 5, 3600000)) return signupForm(ctx, res, 'Too many attempts. Try again later.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return signupForm(ctx, res, 'That email does not look right.');
  if (!HANDLE_RX.test(handle)) return signupForm(ctx, res, 'A profile address is 3–30 characters: letters, numbers, hyphens.');
  if (!name) return signupForm(ctx, res, 'A display name is needed.');
  if (pass.length < 12) return signupForm(ctx, res, 'Twelve characters at least — this protects a great deal about you.');
  if (ctx.db.prepare('SELECT 1 FROM users WHERE email=?').get(email)) return signupForm(ctx, res, 'That email is already registered.');
  if (ctx.db.prepare('SELECT 1 FROM users WHERE handle=?').get(handle)) return signupForm(ctx, res, 'That profile address is taken.');

  const { hash, salt } = hashPassword(pass);
  const info = ctx.db.prepare(
    'INSERT INTO users (email,handle,pass_hash,pass_salt,created_at,last_seen) VALUES (?,?,?,?,?,?)')
    .run(email, handle, hash, salt, now(), now());
  const id = Number(info.lastInsertRowid);
  Profile.ensure(ctx.db, id);
  ctx.db.prepare('UPDATE profiles SET display_name=?, photo_seed=? WHERE user_id=?').run(name, handle, id);
  Score.refresh(ctx.db, id);
  audit(ctx.db, id, 'account.create', `user:${id}`);

  const s = startSession(ctx.db, id, req.headers['user-agent']);
  setCookie(res, 'sid', s.id, { maxAge: 60 * 60 * 24 * 14 });
  redirect(res, '/dashboard/profile');
}

export function signinForm(ctx, res, err) {
  if (ctx.user) return redirect(res, '/dashboard');
  html(res, shell(ctx, 'Sign in', h`
    <section class="wrap band narrow">
      <h1 class="h1">Sign in.</h1>
      ${notice(err, 'bad')}
      <form method="post" action="/signin" class="fform">
        ${field('email', 'Email', '', { type: 'email', required: true })}
        ${field('password', 'Passphrase', '', { type: 'password', required: true })}
        <button class="btn btn--solid" type="submit">Sign in</button>
      </form>
      <p class="quiet">No profile yet? <a href="/signup">Create one</a>.</p>
    </section>`));
}

export async function signin(ctx, res, req) {
  const b = await readForm(req);
  const email = String(b.email || '').trim().toLowerCase();
  // Rate limit by address and by account, so neither a spray nor a focused
  // guess gets an unlimited number of tries.
  if (!hit(ctx.db, `signin:${ctx.ip}`, 10, 900000) || !hit(ctx.db, `signin:acct:${email}`, 8, 900000)) {
    return signinForm(ctx, res, 'Too many attempts. Wait fifteen minutes.');
  }
  const u = ctx.db.prepare('SELECT * FROM users WHERE email=?').get(email);
  const ok = u && verifyPassword(String(b.password || ''), u.pass_hash, u.pass_salt);
  // One message for both cases: a different one tells a stranger which emails exist.
  if (!ok) return signinForm(ctx, res, 'That combination is not right.');
  if (u.status === 'banned' || u.status === 'closed') return signinForm(ctx, res, 'This account is closed.');

  ctx.db.prepare('UPDATE users SET last_seen=? WHERE id=?').run(now(), u.id);
  const s = startSession(ctx.db, u.id, req.headers['user-agent']);
  setCookie(res, 'sid', s.id, { maxAge: 60 * 60 * 24 * 14 });
  audit(ctx.db, u.id, 'account.signin', `user:${u.id}`);
  redirect(res, '/dashboard');
}

export async function signout(ctx, res, req) {
  const b = await readForm(req);
  if (!ctx.session || !checkCsrf(ctx, b)) return redirect(res, '/');
  endSession(ctx.db, ctx.session.id);
  setCookie(res, 'sid', '', { maxAge: 0 });
  redirect(res, '/');
}

/* ---- proposal, report, block, follow — all against another profile ------- */

export function proposeForm(ctx, res, handle, err) {
  if (!ctx.user) return redirect(res, '/signin');
  const owner = Profile.byHandle(ctx.db, handle);
  if (!owner || !owner.published) return notFound(ctx, res);
  if (owner.user_id === ctx.userId) return redirect(res, '/u/' + handle);
  const v = Profile.publicView(ctx.db, owner, ctx.userId);
  if (!v.accepts_proposals) return notFound(ctx, res);

  html(res, shell(ctx, 'Send a proposal', h`
    <section class="wrap band narrow">
      <p class="eyebrow">To ${v.display_name}</p>
      <h1 class="h1">Write, in your own words.</h1>
      <p class="lead">One approach at a time, and a reason rather than a greeting. If it is declined you
      will be told, and you may not write again for six months.</p>
      ${notice(err, 'bad')}
      <form method="post" action="/u/${handle}/propose" class="fform">
        <input type="hidden" name="csrf" value="${ctx.session.csrf}">
        ${field('kind', 'What you are proposing', '', { options: Proposal.KINDS })}
        ${field('intent', 'What you are looking for', '', { ph: 'A long-term partnership, and nothing casual' })}
        ${field('message', 'Your message', '', { textarea: true, rows: 6,
          ph: 'Why them, specifically. Twenty characters at minimum, and a form letter is obvious to everyone who receives one.' })}
        ${field('when_txt', 'When would suit', '', { ph: 'Optional' })}
        ${field('where_txt', 'Where', '', { ph: 'Optional' })}
        <button class="btn btn--solid" type="submit">Send it</button>
      </form>
    </section>`));
}

export async function propose(ctx, res, req, handle) {
  if (!ctx.user) return redirect(res, '/signin');
  const b = await readForm(req);
  if (!checkCsrf(ctx, b)) return proposeForm(ctx, res, handle, 'Your session expired. Try again.');
  const owner = Profile.byHandle(ctx.db, handle);
  if (!owner) return notFound(ctx, res);
  const r = Proposal.send(ctx.db, ctx.userId, owner.user_id, b);
  if (r.error) return proposeForm(ctx, res, handle, r.error);
  html(res, shell(ctx, 'Sent', h`<section class="wrap band narrow">
    <h1 class="h1">Sent.</h1>
    <p class="lead">They decide whether to answer, and you are not told whether they read it. If they
    decline, you will be told that it will not go further and nothing else.</p>
    <a class="btn" href="/dashboard/proposals">Your approaches</a></section>`));
}

export function reportForm(ctx, res, handle, err) {
  if (!ctx.user) return redirect(res, '/signin');
  const owner = Profile.byHandle(ctx.db, handle);
  if (!owner) return notFound(ctx, res);
  html(res, shell(ctx, 'Report', h`
    <section class="wrap band narrow">
      <h1 class="h1">Report this profile.</h1>
      <p class="lead">It goes to a moderator, and the member is never told who reported them. You will
      be told the outcome either way, including when we do not uphold it.</p>
      ${notice(err, 'bad')}
      <form method="post" action="/u/${handle}/report" class="fform">
        <input type="hidden" name="csrf" value="${ctx.session.csrf}">
        ${field('reason', 'Reason', '', { options: Moderation.REASONS })}
        ${field('detail', 'What happened', '', { textarea: true, rows: 5 })}
        <button class="btn btn--solid" type="submit">Send the report</button>
      </form>
      <form method="post" action="/u/${handle}/block" class="fform">
        <input type="hidden" name="csrf" value="${ctx.session.csrf}">
        <button class="btn" type="submit">Block this member instead</button>
      </form>
    </section>`));
}

export async function report(ctx, res, req, handle) {
  if (!ctx.user) return redirect(res, '/signin');
  const b = await readForm(req);
  if (!checkCsrf(ctx, b)) return reportForm(ctx, res, handle, 'Your session expired.');
  const owner = Profile.byHandle(ctx.db, handle);
  if (!owner) return notFound(ctx, res);
  const r = Moderation.report(ctx.db, ctx.userId, 'user', owner.user_id, b.reason, b.detail);
  if (r.error) return reportForm(ctx, res, handle, r.error);
  html(res, shell(ctx, 'Reported', h`<section class="wrap band narrow">
    <h1 class="h1">With a moderator.</h1>
    <p class="lead">You will be told the outcome. The member is not told who raised it.</p>
    <a class="btn" href="/discover">Back to discover</a></section>`));
}

export async function block(ctx, res, req, handle) {
  if (!ctx.user) return redirect(res, '/signin');
  const b = await readForm(req);
  if (!checkCsrf(ctx, b)) return redirect(res, '/u/' + handle);
  const owner = Profile.byHandle(ctx.db, handle);
  if (!owner) return notFound(ctx, res);
  Moderation.block(ctx.db, ctx.userId, owner.user_id);
  redirect(res, '/dashboard/privacy');
}

export async function follow(ctx, res, req, handle) {
  if (!ctx.user) return redirect(res, '/signin');
  const b = await readForm(req);
  if (!checkCsrf(ctx, b)) return redirect(res, '/u/' + handle);
  const owner = Profile.byHandle(ctx.db, handle);
  if (!owner) return notFound(ctx, res);
  if (Content.isFollowing(ctx.db, ctx.userId, owner.user_id)) Content.unfollow(ctx.db, ctx.userId, owner.user_id);
  else Content.follow(ctx.db, ctx.userId, owner.user_id);
  redirect(res, '/u/' + handle);
}
