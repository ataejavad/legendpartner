/* ============================================================================
   MODERATION ENGINE
   Reports, blocks, and the operator's actions — every one of the latter
   written to the audit log with the administrator's name on it.
   ========================================================================== */
import { now } from '../lib/db.js';
import { audit } from '../lib/auth.js';
import { notify } from './notification.js';

export const REASONS = ['Impersonation','Harassment','Spam or soliciting','Fake profile',
                        'Inappropriate content','A false relationship claim','Something else'];

export function report(db, reporterId, subjectType, subjectId, reason, detail) {
  if (!['user','post','comment','proposal'].includes(subjectType)) return { error: 'Unknown subject.' };
  if (!REASONS.includes(reason)) return { error: 'Choose a reason.' };
  if (subjectType === 'user' && Number(subjectId) === reporterId) return { error: 'You cannot report yourself.' };
  const dup = db.prepare(
    "SELECT 1 FROM reports WHERE reporter=? AND subject_type=? AND subject_id=? AND status='open'")
    .get(reporterId, subjectType, subjectId);
  if (dup) return { error: 'You have already reported this. It is open with the moderators.' };
  db.prepare('INSERT INTO reports (reporter,subject_type,subject_id,reason,detail,created_at) VALUES (?,?,?,?,?,?)')
    .run(reporterId, subjectType, Number(subjectId), reason, String(detail || '').slice(0, 2000), now());
  audit(db, reporterId, 'report.create', `${subjectType}:${subjectId}`, reason);
  return { ok: true };
}

export function block(db, blockerId, blockedId) {
  if (blockerId === blockedId) return { error: 'You cannot block yourself.' };
  db.prepare('INSERT OR IGNORE INTO blocks (blocker,blocked,created_at) VALUES (?,?,?)')
    .run(blockerId, blockedId, now());
  // A block ends what was open between them, in both directions.
  db.prepare("UPDATE proposals SET status='cancelled', closed_at=? WHERE status IN ('sent','viewed') AND " +
             '((from_user=? AND to_user=?) OR (from_user=? AND to_user=?))')
    .run(now(), blockerId, blockedId, blockedId, blockerId);
  db.prepare('DELETE FROM follows WHERE (follower=? AND followee=?) OR (follower=? AND followee=?)')
    .run(blockerId, blockedId, blockedId, blockerId);
  audit(db, blockerId, 'block', `user:${blockedId}`);
  return { ok: true };
}
export function unblock(db, blockerId, blockedId) {
  db.prepare('DELETE FROM blocks WHERE blocker=? AND blocked=?').run(blockerId, blockedId);
  return { ok: true };
}
export function blocked(db, userId) {
  return db.prepare(
    'SELECT b.*, u.handle, p.display_name FROM blocks b JOIN users u ON u.id=b.blocked ' +
    'LEFT JOIN profiles p ON p.user_id=b.blocked WHERE b.blocker=?').all(userId);
}

/* ---- operator side ------------------------------------------------------ */

export function queue(db, status = 'open') {
  return db.prepare('SELECT * FROM reports WHERE status=? ORDER BY created_at').all(status);
}

export function resolve(db, adminId, reportId, decision, note) {
  if (!['actioned','dismissed'].includes(decision)) return { error: 'Unknown decision.' };
  const r = db.prepare('SELECT * FROM reports WHERE id=?').get(reportId);
  if (!r || r.status !== 'open') return { error: 'Not an open report.' };
  db.prepare('UPDATE reports SET status=?, resolved_by=?, resolved_at=? WHERE id=?')
    .run(decision, adminId, now(), reportId);
  db.prepare('INSERT INTO moderation_actions (admin_id,action,subject_type,subject_id,note,created_at) VALUES (?,?,?,?,?,?)')
    .run(adminId, `report.${decision}`, r.subject_type, r.subject_id, String(note || ''), now());
  audit(db, adminId, `moderation.report.${decision}`, `report:${reportId}`, String(note || ''));
  notify(db, r.reporter, 'account',
    decision === 'actioned' ? 'A report you made was upheld and acted on.'
                            : 'A report you made was reviewed and not upheld. You are told either way.',
    '/dashboard/notifications');
  return { ok: true };
}

export function setUserStatus(db, adminId, userId, status, note) {
  if (!['active','suspended','banned'].includes(status)) return { error: 'Unknown status.' };
  db.prepare('UPDATE users SET status=? WHERE id=?').run(status, userId);
  if (status !== 'active') db.prepare('DELETE FROM sessions WHERE user_id=?').run(userId);
  db.prepare('INSERT INTO moderation_actions (admin_id,action,subject_type,subject_id,note,created_at) VALUES (?,?,?,?,?,?)')
    .run(adminId, `user.${status}`, 'user', userId, String(note || ''), now());
  audit(db, adminId, `moderation.user.${status}`, `user:${userId}`, String(note || ''));
  notify(db, userId, 'account', `Your account status was changed to ${status}. You may appeal by writing to the office.`, '');
  return { ok: true };
}

export function hidePost(db, adminId, postId, hidden, note) {
  db.prepare('UPDATE posts SET hidden=? WHERE id=?').run(hidden ? 1 : 0, postId);
  db.prepare('INSERT INTO moderation_actions (admin_id,action,subject_type,subject_id,note,created_at) VALUES (?,?,?,?,?,?)')
    .run(adminId, hidden ? 'post.hide' : 'post.restore', 'post', postId, String(note || ''), now());
  audit(db, adminId, hidden ? 'moderation.post.hide' : 'moderation.post.restore', `post:${postId}`);
  return { ok: true };
}

export function setVerification(db, adminId, userId, kind, on) {
  const col = { email: 'email_verified', phone: 'phone_verified', identity: 'id_verified' }[kind];
  if (!col) return { error: 'Unknown verification.' };
  db.prepare(`UPDATE users SET ${col}=? WHERE id=?`).run(on ? 1 : 0, userId);
  audit(db, adminId, `verification.${kind}.${on ? 'grant' : 'revoke'}`, `user:${userId}`);
  notify(db, userId, 'verification',
    `Your ${kind} verification was ${on ? 'granted' : 'withdrawn'}.`, '/dashboard/verification');
  return { ok: true };
}

/* Signals for the operator, computed rather than stored, so nothing here is a
   private field being surfaced. */
export function signals(db) {
  const dupHandles = db.prepare(
    'SELECT LOWER(p.display_name) name, COUNT(*) n FROM profiles p WHERE p.display_name != \'\' ' +
    'GROUP BY LOWER(p.display_name) HAVING n > 1').all();
  const highVolume = db.prepare(
    "SELECT from_user, COUNT(*) n FROM proposals WHERE created_at > datetime('now','-1 day') " +
    'GROUP BY from_user HAVING n >= 8').all();
  const disputed = db.prepare(
    "SELECT r.* FROM reports r WHERE r.reason='A false relationship claim' AND r.status='open'").all();
  return { dupHandles, highVolume, disputed };
}
