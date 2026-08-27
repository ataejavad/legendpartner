/* ============================================================================
   AUTH — passwords, sessions, CSRF.
   scrypt for passwords, a random opaque session id in an HttpOnly cookie, and
   a per-session CSRF token that every state-changing form must carry. No JWT:
   a session that cannot be revoked server-side is not worth the convenience.
   ========================================================================== */
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { now } from './db.js';

const DAY = 86400;
export const SESSION_DAYS = 14;

export function hashPassword(plain, salt = randomBytes(16).toString('hex')) {
  const hash = scryptSync(plain, salt, 64).toString('hex');
  return { hash, salt };
}
export function verifyPassword(plain, hash, salt) {
  const got = Buffer.from(scryptSync(plain, salt, 64).toString('hex'), 'hex');
  const want = Buffer.from(hash, 'hex');
  return got.length === want.length && timingSafeEqual(got, want);
}

export function startSession(db, userId, ua) {
  const id = randomBytes(24).toString('hex');
  const csrf = randomBytes(24).toString('hex');
  const expires = new Date(Date.now() + SESSION_DAYS * DAY * 1000).toISOString();
  db.prepare('INSERT INTO sessions (id,user_id,csrf,ua,created_at,expires_at) VALUES (?,?,?,?,?,?)')
    .run(id, userId, csrf, String(ua || '').slice(0, 200), now(), expires);
  return { id, csrf };
}

export function readSession(db, sid) {
  if (!sid) return null;
  const s = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sid);
  if (!s) return null;
  if (new Date(s.expires_at) < new Date()) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sid);
    return null;
  }
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(s.user_id);
  if (!u || u.status === 'banned' || u.status === 'closed') return null;
  return { session: s, user: u };
}

export function endSession(db, sid) { db.prepare('DELETE FROM sessions WHERE id = ?').run(sid); }
export function endOtherSessions(db, userId, keep) {
  db.prepare('DELETE FROM sessions WHERE user_id = ? AND id != ?').run(userId, keep);
}

export function checkCsrf(ctx, body) {
  return !!ctx.session && typeof body.csrf === 'string' &&
         body.csrf.length === ctx.session.csrf.length &&
         timingSafeEqual(Buffer.from(body.csrf), Buffer.from(ctx.session.csrf));
}

export function audit(db, actor, action, subject = '', detail = '') {
  db.prepare('INSERT INTO audit_log (actor,action,subject,detail,at) VALUES (?,?,?,?,?)')
    .run(actor, action, String(subject), String(detail).slice(0, 500), now());
}
