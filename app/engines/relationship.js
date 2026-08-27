/* ============================================================================
   RELATIONSHIP ENGINE
   The rule this engine exists to enforce: nobody is ever named as another
   person's partner on that person's say-so. A relationship is created pending,
   and only the *other* side's own authenticated request can move it to
   verified. Every transition is written to an internal audit that is never
   rendered on a public page.
   ========================================================================== */
import { now } from '../lib/db.js';
import { audit } from '../lib/auth.js';
import { notify } from './notification.js';

export const KINDS = ['Dating', 'In a Relationship', 'Engaged', 'Married'];
export const STATUSES = ['pending', 'verified', 'declined', 'ended', 'hidden'];

function event(db, relId, actor, action) {
  db.prepare('INSERT INTO relationship_events (rel_id,actor,action,at) VALUES (?,?,?,?)')
    .run(relId, actor, action, now());
}

export function activeFor(db, userId) {
  return db.prepare(
    "SELECT * FROM relationships WHERE (a_user=? OR b_user=?) AND status IN ('pending','verified','hidden') " +
    'ORDER BY created_at DESC').all(userId, userId);
}

export function verifiedFor(db, userId) {
  return db.prepare(
    "SELECT * FROM relationships WHERE (a_user=? OR b_user=?) AND status='verified' LIMIT 1"
  ).get(userId, userId) || null;
}

export function partnerOf(rel, userId) { return rel.a_user === userId ? rel.b_user : rel.a_user; }

/** Claim a relationship. Creates it pending; never verified. */
export function propose(db, fromId, toId, kind, startedOn) {
  if (fromId === toId) return { error: 'You cannot be in a relationship with yourself.' };
  if (!KINDS.includes(kind)) return { error: 'Unknown relationship kind.' };
  const other = db.prepare('SELECT * FROM users WHERE id=?').get(toId);
  if (!other || other.status !== 'active') return { error: 'No such member.' };

  const existing = db.prepare(
    "SELECT * FROM relationships WHERE status IN ('pending','verified') AND " +
    '((a_user=? AND b_user=?) OR (a_user=? AND b_user=?))').get(fromId, toId, toId, fromId);
  if (existing) return { error: 'There is already a relationship on record with this member.' };

  const mine = verifiedFor(db, fromId);
  if (mine) return { error: 'End your current verified relationship before recording another.' };

  const info = db.prepare(
    'INSERT INTO relationships (a_user,b_user,kind,status,started_on,created_at) VALUES (?,?,?,?,?,?)')
    .run(fromId, toId, kind, 'pending', startedOn || null, now());
  const id = Number(info.lastInsertRowid);
  event(db, id, fromId, 'claimed');
  audit(db, fromId, 'relationship.claim', `rel:${id}`, `partner:${toId}`);
  notify(db, toId, 'relationship',
    'Someone has recorded that they are in a relationship with you. It shows nowhere until you confirm it.',
    '/dashboard/relationship');
  return { id };
}

/** Only the named partner may confirm, and only their own pending row. */
export function confirm(db, relId, actorId) {
  const rel = db.prepare('SELECT * FROM relationships WHERE id=?').get(relId);
  if (!rel) return { error: 'No such relationship.' };
  if (rel.status !== 'pending') return { error: 'This relationship is not awaiting confirmation.' };
  if (rel.b_user !== actorId) return { error: 'Only the member named as the partner can confirm this.' };

  const theirs = verifiedFor(db, actorId);
  if (theirs) return { error: 'End your current verified relationship first.' };

  db.prepare("UPDATE relationships SET status='verified', confirmed_at=? WHERE id=?").run(now(), relId);
  event(db, relId, actorId, 'confirmed');
  audit(db, actorId, 'relationship.confirm', `rel:${relId}`);
  notify(db, rel.a_user, 'relationship', 'Your partner has confirmed the relationship. It is now verified.',
    '/dashboard/relationship');
  return { ok: true };
}

export function decline(db, relId, actorId) {
  const rel = db.prepare('SELECT * FROM relationships WHERE id=?').get(relId);
  if (!rel) return { error: 'No such relationship.' };
  if (rel.b_user !== actorId) return { error: 'Only the member named as the partner can decline this.' };
  if (rel.status !== 'pending') return { error: 'Nothing to decline.' };
  db.prepare("UPDATE relationships SET status='declined' WHERE id=?").run(relId);
  event(db, relId, actorId, 'declined');
  audit(db, actorId, 'relationship.decline', `rel:${relId}`);
  // The claimant is told it did not proceed, and not told anything more.
  notify(db, rel.a_user, 'relationship', 'The relationship you recorded was not confirmed.', '/dashboard/relationship');
  return { ok: true };
}

/** Either side may end it, at any time, without a reason. */
export function end(db, relId, actorId) {
  const rel = db.prepare('SELECT * FROM relationships WHERE id=?').get(relId);
  if (!rel) return { error: 'No such relationship.' };
  if (rel.a_user !== actorId && rel.b_user !== actorId) return { error: 'Not yours to end.' };
  if (rel.status === 'ended') return { ok: true };
  db.prepare("UPDATE relationships SET status='ended', ended_on=? WHERE id=?").run(now().slice(0, 10), relId);
  event(db, relId, actorId, 'ended');
  audit(db, actorId, 'relationship.end', `rel:${relId}`);
  const other = partnerOf(rel, actorId);
  notify(db, other, 'relationship', 'A relationship on your profile has been ended.', '/dashboard/relationship');
  return { ok: true };
}

/** Hide without ending: the couple stays on record, off the public page. */
export function setHidden(db, relId, actorId, hidden) {
  const rel = db.prepare('SELECT * FROM relationships WHERE id=?').get(relId);
  if (!rel) return { error: 'No such relationship.' };
  if (rel.a_user !== actorId && rel.b_user !== actorId) return { error: 'Not yours.' };
  if (!['verified', 'hidden'].includes(rel.status)) return { error: 'Only a verified relationship can be hidden.' };
  db.prepare('UPDATE relationships SET status=? WHERE id=?').run(hidden ? 'hidden' : 'verified', relId);
  event(db, relId, actorId, hidden ? 'hidden' : 'unhidden');
  return { ok: true };
}

/** Joint content needs both sides; either may edit, both are told. */
export function editJoint(db, relId, actorId, fields) {
  const rel = db.prepare('SELECT * FROM relationships WHERE id=?').get(relId);
  if (!rel) return { error: 'No such relationship.' };
  if (rel.a_user !== actorId && rel.b_user !== actorId) return { error: 'Not yours.' };
  if (rel.status !== 'verified' && rel.status !== 'hidden')
    return { error: 'The couple profile opens once both of you have confirmed.' };
  db.prepare('UPDATE relationships SET joint_bio=?, joint_values=?, joint_goals=?, level=? WHERE id=?')
    .run(fields.joint_bio ?? rel.joint_bio, fields.joint_values ?? rel.joint_values,
         fields.joint_goals ?? rel.joint_goals, fields.level ?? rel.level, relId);
  event(db, relId, actorId, 'joint.edit');
  notify(db, partnerOf(rel, actorId), 'relationship', 'Your partner edited the couple profile.', '/dashboard/relationship');
  return { ok: true };
}

export function history(db, relId) {
  return db.prepare('SELECT * FROM relationship_events WHERE rel_id=? ORDER BY at').all(relId);
}

export function durationText(startedOn) {
  if (!startedOn) return '';
  const days = Math.floor((Date.now() - new Date(startedOn)) / 86400000);
  if (days < 0) return '';
  const y = Math.floor(days / 365), m = Math.floor((days % 365) / 30);
  if (y >= 1) return y + (y === 1 ? ' year' : ' years') + (m ? `, ${m} month${m === 1 ? '' : 's'}` : '');
  if (m >= 1) return m + (m === 1 ? ' month' : ' months');
  return days + (days === 1 ? ' day' : ' days');
}
