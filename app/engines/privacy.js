/* ============================================================================
   PRIVACY ENGINE
   One question, asked in one place: may this viewer see this field of this
   member? Every read path in the application goes through `visible` — no route
   decides for itself, and nothing is trusted from the client.

   Defaults are closed. A field with no stored level takes DEFAULTS, and a field
   not in DEFAULTS is private — so a new field added to the schema is invisible
   until somebody deliberately names it.
   ========================================================================== */
export const LEVELS = ['public', 'registered', 'connections', 'private'];

const RANK = { public: 0, registered: 1, connections: 2, private: 3 };

/* The fields a member can govern, with the level each starts at. */
export const DEFAULTS = {
  display_name: 'public',       // the page is unreachable without it
  photo:        'registered',
  age:          'registered',
  gender:       'registered',
  city:         'registered',
  country:      'public',
  nationality:  'private',
  languages:    'public',
  profession:   'private',      // occupation on a public page invites the wrong attention
  education:    'private',
  lifestyle:    'connections',
  interests:    'public',
  personality:  'connections',
  bio:          'public',
  intent:       'public',       // the line that lets anyone be matched at all
  goals:        'registered',
  partner_prefs:'connections',
  rel_status:   'registered',
  relationship: 'private',      // the couple, named
  score:        'private',
  stats:        'private',
  posts:        'registered',
  full_name:    'private'       // never defaults open, at any level
};

/* Fields the member may not open however they set them. */
const NEVER_PUBLIC = new Set(['full_name']);

export function levelOf(db, userId, field) {
  const row = db.prepare('SELECT level FROM privacy WHERE user_id=? AND field=?').get(userId, field);
  const chosen = row ? row.level : (DEFAULTS[field] || 'private');
  if (NEVER_PUBLIC.has(field) && chosen === 'public') return 'registered';
  return chosen;
}

export function setLevel(db, userId, field, level) {
  if (!LEVELS.includes(level)) throw new Error('bad level');
  if (!(field in DEFAULTS)) throw new Error('unknown field');
  db.prepare('INSERT INTO privacy (user_id,field,level) VALUES (?,?,?) ' +
             'ON CONFLICT(user_id,field) DO UPDATE SET level=excluded.level')
    .run(userId, field, level);
}

export function allLevels(db, userId) {
  const out = {};
  for (const f of Object.keys(DEFAULTS)) out[f] = levelOf(db, userId, f);
  return out;
}

/* The viewer's standing relative to the owner. */
export function relationOf(db, ownerId, viewerId) {
  if (!viewerId) return 'anon';
  if (viewerId === ownerId) return 'self';
  const c = db.prepare(
    'SELECT 1 FROM connections WHERE (a_user=? AND b_user=?) OR (a_user=? AND b_user=?)'
  ).get(ownerId, viewerId, viewerId, ownerId);
  return c ? 'connection' : 'registered';
}

const REACH = { anon: 0, registered: 1, connection: 2, self: 3 };

export function visible(db, ownerId, viewerId, field) {
  if (viewerId && viewerId === ownerId) return true;
  if (viewerId && isBlocked(db, ownerId, viewerId)) return false;
  const need = RANK[levelOf(db, ownerId, field)];
  if (need === RANK.private) return false;
  return REACH[relationOf(db, ownerId, viewerId)] >= need;
}

/* Blocks cut both ways: neither can see the other. */
export function isBlocked(db, a, b) {
  if (!a || !b) return false;
  return !!db.prepare(
    'SELECT 1 FROM blocks WHERE (blocker=? AND blocked=?) OR (blocker=? AND blocked=?)'
  ).get(a, b, b, a);
}

/* Whether the profile may appear in search at all, for this viewer. */
export function searchable(db, owner, viewerId) {
  if (!owner.published || !owner.searchable) return false;
  if (viewerId && isBlocked(db, owner.user_id, viewerId)) return false;
  return true;
}
