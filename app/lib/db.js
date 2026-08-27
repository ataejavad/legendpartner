/* ============================================================================
   DB — schema, migrations and the connection.

   node:sqlite, and no dependency beyond it. Every statement in the application
   is prepared with bound parameters; nothing anywhere concatenates a value into
   SQL. Indexes are declared beside the tables they serve rather than collected
   at the end, so adding a table means adding its indexes in the same place.
   ========================================================================== */
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export function open(file) {
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  migrate(db);
  return db;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id             INTEGER PRIMARY KEY,
  email          TEXT NOT NULL UNIQUE,
  handle         TEXT NOT NULL UNIQUE,
  pass_hash      TEXT NOT NULL,
  pass_salt      TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT 'member',      -- member | admin
  status         TEXT NOT NULL DEFAULT 'active',      -- active | suspended | banned | closed
  email_verified INTEGER NOT NULL DEFAULT 0,
  phone_verified INTEGER NOT NULL DEFAULT 0,
  id_verified    INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL,
  last_seen      TEXT
);
CREATE INDEX IF NOT EXISTS ix_users_handle ON users(handle);

CREATE TABLE IF NOT EXISTS profiles (
  user_id       INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL DEFAULT '',
  full_name     TEXT NOT NULL DEFAULT '',
  birth_year    INTEGER,
  gender        TEXT NOT NULL DEFAULT '',
  city          TEXT NOT NULL DEFAULT '',
  country       TEXT NOT NULL DEFAULT '',
  nationality   TEXT NOT NULL DEFAULT '',
  languages     TEXT NOT NULL DEFAULT '',
  profession    TEXT NOT NULL DEFAULT '',
  education     TEXT NOT NULL DEFAULT '',
  lifestyle     TEXT NOT NULL DEFAULT '',
  interests     TEXT NOT NULL DEFAULT '',
  personality   TEXT NOT NULL DEFAULT '',
  bio           TEXT NOT NULL DEFAULT '',
  intent        TEXT NOT NULL DEFAULT '',            -- what they are looking for
  goals         TEXT NOT NULL DEFAULT '',
  partner_prefs TEXT NOT NULL DEFAULT '',
  rel_status    TEXT NOT NULL DEFAULT 'Prefer not to say',
  photo_seed    TEXT NOT NULL DEFAULT '',
  published     INTEGER NOT NULL DEFAULT 0,
  searchable    INTEGER NOT NULL DEFAULT 0,
  indexable     INTEGER NOT NULL DEFAULT 0,          -- search engines; off by default
  proposals_on  INTEGER NOT NULL DEFAULT 1,
  show_stats    INTEGER NOT NULL DEFAULT 0,
  show_score    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_profiles_search ON profiles(published, searchable, country, city);

-- One row per field the member has moved off its default. Absence means the
-- privacy engine's default applies, so a new field is private until named.
CREATE TABLE IF NOT EXISTS privacy (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  field   TEXT NOT NULL,
  level   TEXT NOT NULL,                              -- public|registered|connections|private
  PRIMARY KEY (user_id, field)
);

CREATE TABLE IF NOT EXISTS photos (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  caption    TEXT NOT NULL DEFAULT '',
  seed       TEXT NOT NULL,
  level      TEXT NOT NULL DEFAULT 'private',
  ord        INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_photos_user ON photos(user_id, ord);

-- A relationship is one row naming both sides. It is never 'verified' until
-- the second side has confirmed it in their own request.
CREATE TABLE IF NOT EXISTS relationships (
  id           INTEGER PRIMARY KEY,
  a_user       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  b_user       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL DEFAULT 'In a Relationship',
  status       TEXT NOT NULL DEFAULT 'pending',       -- pending|verified|declined|ended|hidden
  started_on   TEXT,
  ended_on     TEXT,
  joint_bio    TEXT NOT NULL DEFAULT '',
  joint_values TEXT NOT NULL DEFAULT '',
  joint_goals  TEXT NOT NULL DEFAULT '',
  level        TEXT NOT NULL DEFAULT 'private',       -- visibility of the couple profile
  created_at   TEXT NOT NULL,
  confirmed_at TEXT
);
CREATE INDEX IF NOT EXISTS ix_rel_a ON relationships(a_user, status);
CREATE INDEX IF NOT EXISTS ix_rel_b ON relationships(b_user, status);

-- Audit of every status change. Held internally; never rendered publicly.
CREATE TABLE IF NOT EXISTS relationship_events (
  id      INTEGER PRIMARY KEY,
  rel_id  INTEGER NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
  actor   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action  TEXT NOT NULL,
  at      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_relev ON relationship_events(rel_id, at);

CREATE TABLE IF NOT EXISTS milestones (
  id       INTEGER PRIMARY KEY,
  rel_id   INTEGER NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
  on_date  TEXT NOT NULL,
  title    TEXT NOT NULL,
  detail   TEXT NOT NULL DEFAULT '',
  added_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS proposals (
  id         INTEGER PRIMARY KEY,
  from_user  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL,
  intent     TEXT NOT NULL DEFAULT '',
  message    TEXT NOT NULL,
  when_txt   TEXT NOT NULL DEFAULT '',
  where_txt  TEXT NOT NULL DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'sent',            -- sent|viewed|accepted|declined|expired|cancelled
  created_at TEXT NOT NULL,
  viewed_at  TEXT,
  closed_at  TEXT,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_prop_to ON proposals(to_user, status, created_at);
CREATE INDEX IF NOT EXISTS ix_prop_from ON proposals(from_user, created_at);

CREATE TABLE IF NOT EXISTS connections (
  a_user     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  b_user     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY (a_user, b_user)
);

CREATE TABLE IF NOT EXISTS follows (
  follower   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY (follower, followee)
);

CREATE TABLE IF NOT EXISTS posts (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rel_id     INTEGER REFERENCES relationships(id) ON DELETE SET NULL,
  kind       TEXT NOT NULL DEFAULT 'note',
  title      TEXT NOT NULL DEFAULT '',
  body       TEXT NOT NULL,
  level      TEXT NOT NULL DEFAULT 'private',
  hidden     INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_posts_user ON posts(user_id, created_at);

CREATE TABLE IF NOT EXISTS comments (
  id         INTEGER PRIMARY KEY,
  post_id    INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  hidden     INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_comments_post ON comments(post_id, created_at);

CREATE TABLE IF NOT EXISTS likes (
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL,
  body       TEXT NOT NULL,
  link       TEXT NOT NULL DEFAULT '',
  read       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_notif ON notifications(user_id, read, created_at);

CREATE TABLE IF NOT EXISTS reports (
  id           INTEGER PRIMARY KEY,
  reporter     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_type TEXT NOT NULL,                          -- user|post|comment|proposal
  subject_id   INTEGER NOT NULL,
  reason       TEXT NOT NULL,
  detail       TEXT NOT NULL DEFAULT '',
  status       TEXT NOT NULL DEFAULT 'open',           -- open|actioned|dismissed
  created_at   TEXT NOT NULL,
  resolved_by  INTEGER REFERENCES users(id),
  resolved_at  TEXT
);
CREATE INDEX IF NOT EXISTS ix_reports ON reports(status, created_at);

CREATE TABLE IF NOT EXISTS blocks (
  blocker    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY (blocker, blocked)
);

CREATE TABLE IF NOT EXISTS moderation_actions (
  id           INTEGER PRIMARY KEY,
  admin_id     INTEGER NOT NULL REFERENCES users(id),
  action       TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  subject_id   INTEGER NOT NULL,
  note         TEXT NOT NULL DEFAULT '',
  created_at   TEXT NOT NULL
);

-- Every sensitive action, by anyone, including administrators.
CREATE TABLE IF NOT EXISTS audit_log (
  id      INTEGER PRIMARY KEY,
  actor   INTEGER,
  action  TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  detail  TEXT NOT NULL DEFAULT '',
  at      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_audit ON audit_log(at);

CREATE TABLE IF NOT EXISTS score_snapshots (
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score       INTEGER NOT NULL,
  components  TEXT NOT NULL,
  computed_at TEXT NOT NULL,
  PRIMARY KEY (user_id, computed_at)
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  csrf       TEXT NOT NULL,
  ua         TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS rate_events (
  bucket TEXT NOT NULL,
  at     INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_rate ON rate_events(bucket, at);

CREATE TABLE IF NOT EXISTS profile_views (
  profile_user INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewer       INTEGER,
  at           TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_views ON profile_views(profile_user, at);
`;

function migrate(db) { db.exec(SCHEMA); }

export const now = () => new Date().toISOString();
