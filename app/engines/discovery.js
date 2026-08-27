/* ============================================================================
   DISCOVERY ENGINE
   Search reads only what the privacy engine would already have shown the
   viewer. A filter on a field the owner keeps closed cannot match it — which
   is what stops search being used to probe for private values.
   ========================================================================== */
import { visible, isBlocked } from './privacy.js';
import * as Profile from './profile.js';
import * as Score from './score.js';

export const SORTS = ['Recently joined', 'Most complete', 'Dating Score'];

export function search(db, q, viewerId) {
  const where = ['p.published=1', 'p.searchable=1', "u.status='active'"];
  const args = [];

  if (q.country) { where.push('p.country=?'); args.push(q.country); }
  if (q.city) { where.push('LOWER(p.city)=LOWER(?)'); args.push(q.city); }
  if (q.gender) { where.push('p.gender=?'); args.push(q.gender); }
  if (q.rel_status) { where.push('p.rel_status=?'); args.push(q.rel_status); }
  if (q.language) { where.push('LOWER(p.languages) LIKE ?'); args.push('%' + String(q.language).toLowerCase() + '%'); }
  if (q.interest) { where.push('LOWER(p.interests) LIKE ?'); args.push('%' + String(q.interest).toLowerCase() + '%'); }
  if (q.intent) { where.push('LOWER(p.intent) LIKE ?'); args.push('%' + String(q.intent).toLowerCase() + '%'); }
  if (q.profession) { where.push('LOWER(p.profession) LIKE ?'); args.push('%' + String(q.profession).toLowerCase() + '%'); }
  if (q.verified) { where.push('u.id_verified=1'); }
  if (q.name) {
    where.push('(LOWER(p.display_name) LIKE ? OR LOWER(u.handle) LIKE ?)');
    const like = '%' + String(q.name).toLowerCase() + '%';
    args.push(like, like);
  }
  const year = new Date().getFullYear();
  if (q.age_max) { where.push('p.birth_year >= ?'); args.push(year - parseInt(q.age_max, 10)); }
  if (q.age_min) { where.push('p.birth_year <= ?'); args.push(year - parseInt(q.age_min, 10)); }

  const rows = db.prepare(
    `SELECT u.*, p.* FROM users u JOIN profiles p ON p.user_id=u.id WHERE ${where.join(' AND ')} LIMIT 400`
  ).all(...args);

  let out = [];
  for (const r of rows) {
    if (viewerId && isBlocked(db, r.user_id, viewerId)) continue;

    // A filter may not reveal a closed field: if the viewer could not see it,
    // the row is dropped rather than returned as a silent confirmation.
    if (q.gender && !visible(db, r.user_id, viewerId, 'gender')) continue;
    if (q.city && !visible(db, r.user_id, viewerId, 'city')) continue;
    if (q.profession && !visible(db, r.user_id, viewerId, 'profession')) continue;
    if (q.rel_status && !visible(db, r.user_id, viewerId, 'rel_status')) continue;
    if ((q.age_min || q.age_max) && !visible(db, r.user_id, viewerId, 'age')) continue;

    const card = Profile.publicView(db, r, viewerId);
    if (q.score_min) {
      const s = r.show_score && visible(db, r.user_id, viewerId, 'score') ? Score.latest(db, r.user_id) : null;
      if (!s || s.score < parseInt(q.score_min, 10)) continue;
    }
    card._completeness = Profile.completeness(db, r.user_id);
    card._created = r.created_at;
    out.push(card);
  }

  if (q.sort === 'Most complete') out.sort((a, b) => b._completeness - a._completeness);
  else if (q.sort === 'Dating Score') out.sort((a, b) => (b.score || 0) - (a.score || 0));
  else out.sort((a, b) => String(b._created).localeCompare(String(a._created)));

  return out;
}

/* The directory's shelves. Each is a plain query over what is already public —
   no opaque ranking, and nothing keyed to a protected characteristic. */
export function directory(db, viewerId) {
  const all = search(db, {}, viewerId);
  const verifiedCouples = db.prepare(
    "SELECT * FROM relationships WHERE status='verified' AND level='public' ORDER BY confirmed_at DESC LIMIT 12"
  ).all().map((rel) => {
    const a = Profile.byId(db, rel.a_user), b = Profile.byId(db, rel.b_user);
    if (!a || !b) return null;
    return { rel, a: Profile.publicView(db, a, viewerId), b: Profile.publicView(db, b, viewerId) };
  }).filter(Boolean);

  return {
    verified: all.filter((p) => p.verification.identity).slice(0, 12),
    singles: all.filter((p) => p.rel_status === 'Single').slice(0, 12),
    couples: verifiedCouples,
    fresh: all.slice(0, 12),
    complete: [...all].sort((a, b) => b._completeness - a._completeness).slice(0, 12),
    total: all.length
  };
}
