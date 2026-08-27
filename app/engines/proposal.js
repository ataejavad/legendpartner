/* ============================================================================
   PROPOSAL ENGINE
   Approaches, with the abuse controls in the engine rather than in the route —
   so every caller gets them, including anything added later.
   ========================================================================== */
import { now } from '../lib/db.js';
import { audit } from '../lib/auth.js';
import { notify } from './notification.js';
import { isBlocked } from './privacy.js';
import { hit, count } from './rate.js';

export const KINDS = ['A conversation', 'A coffee', 'Dinner', 'An introduction', 'Something else'];
export const DAY = 86400000;
export const LIMITS = {
  perDay: 10,          // approaches one member may send in a day
  perRecipient: 1,     // open approaches to the same person
  cooldownDays: 180,   // after a decline, before the same pair may be approached again
  expiryDays: 30
};

export function send(db, fromId, toId, fields) {
  if (fromId === toId) return { error: 'You cannot write to yourself.' };
  const to = db.prepare('SELECT * FROM users WHERE id=?').get(toId);
  if (!to || to.status !== 'active') return { error: 'No such member.' };
  const prof = db.prepare('SELECT * FROM profiles WHERE user_id=?').get(toId);
  if (!prof || !prof.published) return { error: 'That profile is not published.' };
  if (!prof.proposals_on) return { error: 'This member is not accepting approaches.' };
  if (isBlocked(db, fromId, toId)) return { error: 'This is not possible.' };

  const message = String(fields.message || '').trim();
  if (message.length < 20) return { error: 'Write at least a couple of sentences — a reason, in your own words.' };
  if (message.length > 2000) return { error: 'That is too long. Two thousand characters at most.' };
  if (!KINDS.includes(fields.kind)) return { error: 'Choose what you are proposing.' };

  const open = db.prepare(
    "SELECT COUNT(*) n FROM proposals WHERE from_user=? AND to_user=? AND status IN ('sent','viewed')")
    .get(fromId, toId).n;
  if (open >= LIMITS.perRecipient) return { error: 'You already have an approach open with this member.' };

  // A decline is answered once and not revisited.
  const declined = db.prepare(
    "SELECT closed_at FROM proposals WHERE from_user=? AND to_user=? AND status='declined' " +
    'ORDER BY closed_at DESC LIMIT 1').get(fromId, toId);
  if (declined && declined.closed_at &&
      Date.now() - new Date(declined.closed_at) < LIMITS.cooldownDays * DAY) {
    return { error: 'This member declined. You may not write again for six months.' };
  }

  if (!hit(db, `prop:${fromId}`, LIMITS.perDay, DAY)) {
    return { error: `That is ${LIMITS.perDay} approaches today, which is the limit. It exists so that this is not a numbers game.` };
  }

  const expires = new Date(Date.now() + LIMITS.expiryDays * DAY).toISOString();
  const info = db.prepare(
    'INSERT INTO proposals (from_user,to_user,kind,intent,message,when_txt,where_txt,status,created_at,expires_at) ' +
    "VALUES (?,?,?,?,?,?,?,'sent',?,?)")
    .run(fromId, toId, fields.kind, String(fields.intent || '').slice(0, 120), message,
         String(fields.when_txt || '').slice(0, 120), String(fields.where_txt || '').slice(0, 120),
         now(), expires);
  const id = Number(info.lastInsertRowid);
  audit(db, fromId, 'proposal.send', `proposal:${id}`, `to:${toId}`);
  notify(db, toId, 'proposal', 'Someone has written to you with an approach.', '/dashboard/proposals');
  return { id };
}

export function markViewed(db, id, viewerId) {
  const p = db.prepare('SELECT * FROM proposals WHERE id=?').get(id);
  if (!p || p.to_user !== viewerId || p.status !== 'sent') return;
  db.prepare("UPDATE proposals SET status='viewed', viewed_at=? WHERE id=?").run(now(), id);
}

export function respond(db, id, actorId, decision) {
  const p = db.prepare('SELECT * FROM proposals WHERE id=?').get(id);
  if (!p) return { error: 'No such approach.' };
  if (p.to_user !== actorId) return { error: 'Not yours to answer.' };
  if (!['sent', 'viewed'].includes(p.status)) return { error: 'This has already been answered.' };
  if (!['accepted', 'declined'].includes(decision)) return { error: 'Unknown decision.' };

  db.prepare('UPDATE proposals SET status=?, closed_at=? WHERE id=?').run(decision, now(), id);
  audit(db, actorId, `proposal.${decision}`, `proposal:${id}`);

  if (decision === 'accepted') {
    const [a, b] = [p.from_user, p.to_user].sort((x, y) => x - y);
    db.prepare('INSERT OR IGNORE INTO connections (a_user,b_user,created_at) VALUES (?,?,?)').run(a, b, now());
    notify(db, p.from_user, 'proposal', 'Your approach was accepted. You are now connected.', '/dashboard/connections');
  } else {
    // The sender is told it will not go further, and never why.
    notify(db, p.from_user, 'proposal', 'An approach you sent will not be going further.', '/dashboard/proposals');
  }
  return { ok: true };
}

export function cancel(db, id, actorId) {
  const p = db.prepare('SELECT * FROM proposals WHERE id=?').get(id);
  if (!p) return { error: 'No such approach.' };
  if (p.from_user !== actorId) return { error: 'Not yours to withdraw.' };
  if (!['sent', 'viewed'].includes(p.status)) return { error: 'Already closed.' };
  db.prepare("UPDATE proposals SET status='cancelled', closed_at=? WHERE id=?").run(now(), id);
  return { ok: true };
}

/** Expiry is lazy: swept whenever the box is read, so no scheduler is needed. */
export function expire(db) {
  db.prepare("UPDATE proposals SET status='expired', closed_at=? WHERE status IN ('sent','viewed') AND expires_at < ?")
    .run(now(), now());
}

export function inbox(db, userId) {
  expire(db);
  return db.prepare('SELECT * FROM proposals WHERE to_user=? ORDER BY created_at DESC').all(userId);
}
export function outbox(db, userId) {
  expire(db);
  return db.prepare('SELECT * FROM proposals WHERE from_user=? ORDER BY created_at DESC').all(userId);
}

/** Public counts, and only when the member has switched them on. */
export function stats(db, userId) {
  const received = db.prepare('SELECT COUNT(*) n FROM proposals WHERE to_user=?').get(userId).n;
  const accepted = db.prepare("SELECT COUNT(*) n FROM proposals WHERE to_user=? AND status='accepted'").get(userId).n;
  const connections = db.prepare('SELECT COUNT(*) n FROM connections WHERE a_user=? OR b_user=?').get(userId, userId).n;
  const views = db.prepare('SELECT COUNT(*) n FROM profile_views WHERE profile_user=?').get(userId).n;
  return { received, accepted, connections, views };
}

/** Suspicious-approach detection for the moderation queue. */
export function suspicious(db) {
  return db.prepare(
    "SELECT from_user, COUNT(*) n, SUM(status='declined') declined FROM proposals " +
    'GROUP BY from_user HAVING n >= 5 AND declined * 2 >= n ORDER BY n DESC').all();
}
