/* ============================================================================
   NOTIFICATION ENGINE
   Every notification says why it was sent. Nothing here is marketing and
   nothing arrives to make somebody open the site more often.
   ========================================================================== */
import { now } from '../lib/db.js';

export function notify(db, userId, kind, body, link = '') {
  db.prepare('INSERT INTO notifications (user_id,kind,body,link,created_at) VALUES (?,?,?,?,?)')
    .run(userId, kind, body, link, now());
}
export function list(db, userId, limit = 50) {
  return db.prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT ?')
    .all(userId, limit);
}
export function unread(db, userId) {
  return db.prepare('SELECT COUNT(*) n FROM notifications WHERE user_id=? AND read=0').get(userId).n;
}
export function markAllRead(db, userId) {
  db.prepare('UPDATE notifications SET read=1 WHERE user_id=?').run(userId);
}
