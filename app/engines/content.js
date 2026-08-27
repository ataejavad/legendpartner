/* ============================================================================
   CONTENT ENGINE — posts, comments, likes, follows, and couple content.
   ========================================================================== */
import { now } from '../lib/db.js';
import { relationOf, isBlocked } from './privacy.js';
import * as Rel from './relationship.js';
import { notify } from './notification.js';

export const KINDS = ['note','experience','milestone','advice','travel','event'];
export const LEVELS = ['public','registered','connections','private'];
const RANK = { public: 0, registered: 1, connections: 2, private: 3 };
const REACH = { anon: 0, registered: 1, connection: 2, self: 3 };

export function canRead(db, post, viewerId) {
  if (post.hidden) return viewerId === post.user_id;
  if (viewerId === post.user_id) return true;
  if (isBlocked(db, post.user_id, viewerId)) return false;
  if (RANK[post.level] === RANK.private) return false;
  return REACH[relationOf(db, post.user_id, viewerId)] >= RANK[post.level];
}

export function create(db, userId, fields) {
  const body = String(fields.body || '').trim();
  if (body.length < 2) return { error: 'Write something first.' };
  if (body.length > 8000) return { error: 'That is too long.' };
  const kind = KINDS.includes(fields.kind) ? fields.kind : 'note';
  const level = LEVELS.includes(fields.level) ? fields.level : 'private';

  let relId = null;
  if (fields.rel_id) {
    const rel = db.prepare('SELECT * FROM relationships WHERE id=?').get(parseInt(fields.rel_id, 10));
    // Joint content requires being half of a confirmed couple. One partner
    // cannot post as "us" on the strength of a claim.
    if (!rel || !['verified','hidden'].includes(rel.status)) return { error: 'That couple profile is not verified.' };
    if (rel.a_user !== userId && rel.b_user !== userId) return { error: 'Not your relationship.' };
    relId = rel.id;
  }

  const info = db.prepare(
    'INSERT INTO posts (user_id,rel_id,kind,title,body,level,created_at) VALUES (?,?,?,?,?,?,?)')
    .run(userId, relId, kind, String(fields.title || '').slice(0, 200), body, level, now());

  if (relId) {
    const rel = db.prepare('SELECT * FROM relationships WHERE id=?').get(relId);
    notify(db, Rel.partnerOf(rel, userId), 'post', 'Your partner published to the couple profile.', '/dashboard/posts');
  }
  return { id: Number(info.lastInsertRowid) };
}

export function edit(db, id, userId, fields) {
  const p = db.prepare('SELECT * FROM posts WHERE id=?').get(id);
  if (!p) return { error: 'No such post.' };
  if (p.user_id !== userId) return { error: 'Not yours.' };
  const level = LEVELS.includes(fields.level) ? fields.level : p.level;
  db.prepare('UPDATE posts SET title=?, body=?, level=? WHERE id=?')
    .run(String(fields.title ?? p.title).slice(0, 200), String(fields.body ?? p.body).slice(0, 8000), level, id);
  return { ok: true };
}

export function remove(db, id, userId) {
  const p = db.prepare('SELECT * FROM posts WHERE id=?').get(id);
  if (!p) return { error: 'No such post.' };
  if (p.user_id !== userId) return { error: 'Not yours.' };
  db.prepare('DELETE FROM posts WHERE id=?').run(id);
  return { ok: true };
}

export function forProfile(db, ownerId, viewerId, limit = 20) {
  return db.prepare('SELECT * FROM posts WHERE user_id=? ORDER BY created_at DESC LIMIT ?')
    .all(ownerId, limit)
    .filter((p) => canRead(db, p, viewerId));
}

export function mine(db, userId) {
  return db.prepare('SELECT * FROM posts WHERE user_id=? ORDER BY created_at DESC').all(userId);
}

export function like(db, postId, userId) {
  const p = db.prepare('SELECT * FROM posts WHERE id=?').get(postId);
  if (!p || !canRead(db, p, userId)) return { error: 'Not available.' };
  db.prepare('INSERT OR IGNORE INTO likes (post_id,user_id) VALUES (?,?)').run(postId, userId);
  return { ok: true };
}
export function unlike(db, postId, userId) {
  db.prepare('DELETE FROM likes WHERE post_id=? AND user_id=?').run(postId, userId);
  return { ok: true };
}
export function likeCount(db, postId) {
  return db.prepare('SELECT COUNT(*) n FROM likes WHERE post_id=?').get(postId).n;
}

export function comment(db, postId, userId, body) {
  const p = db.prepare('SELECT * FROM posts WHERE id=?').get(postId);
  if (!p || !canRead(db, p, userId)) return { error: 'Not available.' };
  const text = String(body || '').trim();
  if (!text) return { error: 'Write something first.' };
  db.prepare('INSERT INTO comments (post_id,user_id,body,created_at) VALUES (?,?,?,?)')
    .run(postId, userId, text.slice(0, 2000), now());
  if (p.user_id !== userId) notify(db, p.user_id, 'post', 'Someone commented on your post.', '/dashboard/posts');
  return { ok: true };
}
export function comments(db, postId) {
  return db.prepare(
    'SELECT c.*, u.handle, p.display_name FROM comments c JOIN users u ON u.id=c.user_id ' +
    'LEFT JOIN profiles p ON p.user_id=c.user_id WHERE c.post_id=? AND c.hidden=0 ORDER BY c.created_at')
    .all(postId);
}

export function follow(db, follower, followee) {
  if (follower === followee) return { error: 'You cannot follow yourself.' };
  if (isBlocked(db, follower, followee)) return { error: 'Not possible.' };
  db.prepare('INSERT OR IGNORE INTO follows (follower,followee,created_at) VALUES (?,?,?)')
    .run(follower, followee, now());
  return { ok: true };
}
export function unfollow(db, follower, followee) {
  db.prepare('DELETE FROM follows WHERE follower=? AND followee=?').run(follower, followee);
  return { ok: true };
}
export function isFollowing(db, follower, followee) {
  return !!db.prepare('SELECT 1 FROM follows WHERE follower=? AND followee=?').get(follower, followee);
}

export function milestones(db, relId) {
  return db.prepare('SELECT * FROM milestones WHERE rel_id=? ORDER BY on_date').all(relId);
}
export function addMilestone(db, relId, userId, on_date, title, detail) {
  const rel = db.prepare('SELECT * FROM relationships WHERE id=?').get(relId);
  if (!rel || !['verified','hidden'].includes(rel.status)) return { error: 'Not a verified relationship.' };
  if (rel.a_user !== userId && rel.b_user !== userId) return { error: 'Not yours.' };
  db.prepare('INSERT INTO milestones (rel_id,on_date,title,detail,added_by) VALUES (?,?,?,?,?)')
    .run(relId, on_date, String(title).slice(0, 200), String(detail || '').slice(0, 2000), userId);
  notify(db, Rel.partnerOf(rel, userId), 'relationship', 'Your partner added a milestone.', '/dashboard/relationship');
  return { ok: true };
}
