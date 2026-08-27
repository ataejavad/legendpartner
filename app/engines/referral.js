/* ============================================================================
   REFERRAL ENGINE
   One member introducing another. Deliberately not a growth mechanism: an
   invitation is issued to a named person with a reason attached, a member holds
   only a few open at once, and vouching carries consequence — if somebody you
   introduced is acted against, that is visible on your own standing.

   The alternative (an unlimited code anyone can paste anywhere) turns a vouch
   into a coupon, which is the opposite of what a trust product needs.
   ========================================================================== */
import { randomBytes } from 'node:crypto';
import { now } from '../lib/db.js';
import { audit } from '../lib/auth.js';
import { notify } from './notification.js';
import { hit } from './rate.js';

export const LIMITS = {
  open: 5,             // invitations a member may have outstanding at once
  perWeek: 8,          // issued in any seven days
  expiryDays: 90
};

/* No I, O or U, so a code read aloud or off paper is unambiguous. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTVWXYZ23456789';
function makeCode() {
  const bytes = randomBytes(12);
  let out = '';
  for (let i = 0; i < 12; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
    if (i % 4 === 3 && i < 11) out += '-';
  }
  return out;
}

export function sweep(db) {
  db.prepare("UPDATE referrals SET status='expired' WHERE status='open' AND expires_at < ?").run(now());
}

export function issue(db, referrerId, fields) {
  sweep(db);
  const me = db.prepare('SELECT * FROM users WHERE id=?').get(referrerId);
  if (!me || me.status !== 'active') return { error: 'This account cannot issue invitations.' };

  // Vouching means putting your own standing behind someone. An account that
  // has not been verified has no standing to lend.
  if (!me.id_verified) {
    return { error: 'Introductions can be made once your own identity is verified. Vouching for someone puts your standing behind them, and standing has to exist first.' };
  }

  const name = String(fields.to_name || '').trim();
  const note = String(fields.note || '').trim();
  if (name.length < 2) return { error: 'Name the person you are introducing.' };
  if (note.length < 20) return { error: 'Say why, in a sentence or two. An introduction without a reason is a link, not a vouch.' };

  const open = db.prepare("SELECT COUNT(*) n FROM referrals WHERE referrer=? AND status='open'").get(referrerId).n;
  if (open >= LIMITS.open) {
    return { error: `You have ${LIMITS.open} invitations outstanding, which is the limit. Withdraw one, or wait for it to be used.` };
  }
  if (!hit(db, `ref:${referrerId}`, LIMITS.perWeek, 7 * 86400000)) {
    return { error: 'That is as many introductions as one member makes in a week.' };
  }

  const email = String(fields.to_email || '').trim().toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { error: 'That email does not look right.' };
  if (email && db.prepare('SELECT 1 FROM users WHERE email=?').get(email)) {
    // Said plainly rather than silently accepted: a quiet failure here would
    // leave the member believing they had introduced somebody.
    return { error: 'Somebody is already registered with that address.' };
  }

  const code = makeCode();
  const expires = new Date(Date.now() + LIMITS.expiryDays * 86400000).toISOString();
  const info = db.prepare(
    'INSERT INTO referrals (referrer,code,to_name,to_email,note,created_at,expires_at) VALUES (?,?,?,?,?,?,?)')
    .run(referrerId, code, name.slice(0, 120), email.slice(0, 200), note.slice(0, 2000), now(), expires);
  audit(db, referrerId, 'referral.issue', `referral:${info.lastInsertRowid}`);
  return { id: Number(info.lastInsertRowid), code };
}

export function revoke(db, id, actorId) {
  const r = db.prepare('SELECT * FROM referrals WHERE id=?').get(id);
  if (!r) return { error: 'No such invitation.' };
  if (r.referrer !== actorId) return { error: 'Not yours to withdraw.' };
  if (r.status !== 'open') return { error: 'That invitation is no longer open.' };
  db.prepare("UPDATE referrals SET status='revoked', revoked_at=? WHERE id=?").run(now(), id);
  audit(db, actorId, 'referral.revoke', `referral:${id}`);
  return { ok: true };
}

/** Look a code up without consuming it — for showing who is vouching at signup. */
export function look(db, code) {
  if (!code) return null;
  sweep(db);
  const r = db.prepare('SELECT * FROM referrals WHERE code=?').get(String(code).trim().toUpperCase());
  if (!r || r.status !== 'open') return null;
  const by = db.prepare(
    'SELECT u.handle, p.display_name FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.id=?')
    .get(r.referrer);
  return { id: r.id, code: r.code, to_name: r.to_name, note: r.note,
           by: by ? { handle: by.handle, name: by.display_name || by.handle } : null };
}

/** Redeem at sign-up. One code, one member, once. */
export function redeem(db, code, newUserId) {
  const r = db.prepare('SELECT * FROM referrals WHERE code=?').get(String(code || '').trim().toUpperCase());
  if (!r || r.status !== 'open') return { error: 'That invitation is not open.' };
  if (r.referrer === newUserId) return { error: 'You cannot introduce yourself.' };
  if (new Date(r.expires_at) < new Date()) {
    db.prepare("UPDATE referrals SET status='expired' WHERE id=?").run(r.id);
    return { error: 'That invitation has expired.' };
  }
  db.prepare("UPDATE referrals SET status='accepted', accepted_by=?, accepted_at=? WHERE id=?")
    .run(newUserId, now(), r.id);
  audit(db, newUserId, 'referral.redeem', `referral:${r.id}`, `by:${r.referrer}`);
  notify(db, r.referrer, 'referral',
    `${r.to_name} has joined on your introduction. Your standing is attached to theirs — you are told if a report against them is ever upheld.`,
    '/dashboard/referrals');
  return { ok: true, referrer: r.referrer };
}

export function issuedBy(db, userId) {
  sweep(db);
  return db.prepare('SELECT * FROM referrals WHERE referrer=? ORDER BY created_at DESC').all(userId);
}

/** Who introduced this member, if anyone. */
export function referrerOf(db, userId) {
  const r = db.prepare("SELECT * FROM referrals WHERE accepted_by=? AND status='accepted'").get(userId);
  if (!r) return null;
  const by = db.prepare(
    'SELECT u.id, u.handle, u.status, p.display_name FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.id=?')
    .get(r.referrer);
  return by ? { id: by.id, handle: by.handle, name: by.display_name || by.handle, on: r.accepted_at } : null;
}

/** The members somebody introduced, with the standing of each. */
export function introduced(db, userId) {
  const rows = db.prepare(
    "SELECT r.*, u.handle, u.status AS acct_status, p.display_name FROM referrals r " +
    'JOIN users u ON u.id=r.accepted_by LEFT JOIN profiles p ON p.user_id=r.accepted_by ' +
    "WHERE r.referrer=? AND r.status='accepted' ORDER BY r.accepted_at DESC").all(userId);
  return rows.map((r) => ({
    ...r,
    name: r.display_name || r.handle,
    upheld: db.prepare(
      "SELECT COUNT(*) n FROM reports WHERE subject_type='user' AND subject_id=? AND status='actioned'")
      .get(r.accepted_by).n
  }));
}

/** Counts for the score and for the profile, computed rather than stored. */
export function standing(db, userId) {
  const list = introduced(db, userId);
  const inGoodStanding = list.filter((m) => m.acct_status === 'active' && m.upheld === 0).length;
  const troubled = list.filter((m) => m.acct_status !== 'active' || m.upheld > 0).length;
  return { count: list.length, inGoodStanding, troubled };
}
