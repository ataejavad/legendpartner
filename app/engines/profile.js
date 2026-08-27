/* ============================================================================
   PROFILE ENGINE
   Reading a profile is always "for a viewer": there is no such thing here as
   the profile itself, only the view of it that a particular person is entitled
   to. Fields the viewer may not see are absent from the object rather than
   present and blanked, so a template cannot leak one by accident.
   ========================================================================== */
import { now } from '../lib/db.js';
import { visible, relationOf } from './privacy.js';
import * as Rel from './relationship.js';
import * as Score from './score.js';
import * as Proposal from './proposal.js';
import * as Referral from './referral.js';

export const EDITABLE = [
  'display_name','full_name','birth_year','gender','city','country','nationality','languages',
  'profession','education','lifestyle','interests','personality','bio','intent','goals',
  'partner_prefs','rel_status'
];
export const REL_STATUS = ['Single','Dating','In a Relationship','Engaged','Married','Separated','Prefer not to say'];
export const GENDERS = ['Woman','Man','Non-binary','Prefer not to say'];

export function byHandle(db, handle) {
  return db.prepare(
    'SELECT u.*, p.* FROM users u JOIN profiles p ON p.user_id=u.id WHERE u.handle=?').get(handle);
}
export function byId(db, id) {
  return db.prepare(
    'SELECT u.*, p.* FROM users u JOIN profiles p ON p.user_id=u.id WHERE u.id=?').get(id);
}

export function ensure(db, userId) {
  const has = db.prepare('SELECT 1 FROM profiles WHERE user_id=?').get(userId);
  if (!has) {
    db.prepare('INSERT INTO profiles (user_id,created_at,updated_at) VALUES (?,?,?)')
      .run(userId, now(), now());
  }
}

export function update(db, userId, fields) {
  const sets = [], vals = [];
  for (const f of EDITABLE) {
    if (!(f in fields)) continue;
    let v = fields[f];
    if (f === 'birth_year') {
      v = parseInt(v, 10);
      if (!Number.isFinite(v) || v < 1900 || v > new Date().getFullYear() - 18) v = null;
    } else {
      v = String(v ?? '').slice(0, 4000);
      if (f === 'rel_status' && !REL_STATUS.includes(v)) continue;
      if (f === 'gender' && v && !GENDERS.includes(v)) continue;
    }
    sets.push(`${f}=?`); vals.push(v);
  }
  if (!sets.length) return { ok: true };
  vals.push(now(), userId);
  db.prepare(`UPDATE profiles SET ${sets.join(', ')}, updated_at=? WHERE user_id=?`).run(...vals);
  Score.refresh(db, userId);
  return { ok: true };
}

export function setFlags(db, userId, flags) {
  const allow = ['published','searchable','indexable','proposals_on','show_stats','show_score'];
  const sets = [], vals = [];
  for (const f of allow) {
    if (!(f in flags)) continue;
    sets.push(`${f}=?`); vals.push(flags[f] ? 1 : 0);
  }
  if (!sets.length) return;
  vals.push(now(), userId);
  db.prepare(`UPDATE profiles SET ${sets.join(', ')}, updated_at=? WHERE user_id=?`).run(...vals);
}

export function age(birthYear) {
  return birthYear ? new Date().getFullYear() - birthYear : null;
}

/**
 * The whole of what a viewer may see. Every branch asks the privacy engine;
 * nothing is included on the strength of the route that asked for it.
 */
export function publicView(db, owner, viewerId) {
  const uid = owner.user_id ?? owner.id;
  const self = viewerId === uid;
  const can = (f) => visible(db, uid, viewerId, f);
  const v = {
    handle: owner.handle,
    user_id: uid,
    self,
    published: !!owner.published,
    relation: relationOf(db, uid, viewerId),
    display_name: can('display_name') ? owner.display_name || owner.handle : owner.handle,
    verification: {
      email: !!owner.email_verified, phone: !!owner.phone_verified, identity: !!owner.id_verified
    },
    accepts_proposals: !!owner.proposals_on
  };

  if (can('photo')) v.photo_seed = owner.photo_seed || owner.handle;
  if (can('age')) v.age = age(owner.birth_year);
  if (can('gender') && owner.gender) v.gender = owner.gender;
  if (can('city') && owner.city) v.city = owner.city;
  if (can('country') && owner.country) v.country = owner.country;
  if (can('nationality') && owner.nationality) v.nationality = owner.nationality;
  if (can('languages') && owner.languages) v.languages = owner.languages;
  if (can('profession') && owner.profession) v.profession = owner.profession;
  if (can('education') && owner.education) v.education = owner.education;
  if (can('lifestyle') && owner.lifestyle) v.lifestyle = owner.lifestyle;
  if (can('interests') && owner.interests) v.interests = owner.interests;
  if (can('personality') && owner.personality) v.personality = owner.personality;
  if (can('bio') && owner.bio) v.bio = owner.bio;
  if (can('intent') && owner.intent) v.intent = owner.intent;
  if (can('goals') && owner.goals) v.goals = owner.goals;
  if (can('partner_prefs') && owner.partner_prefs) v.partner_prefs = owner.partner_prefs;
  if (can('rel_status')) v.rel_status = owner.rel_status;
  if (can('full_name') && owner.full_name) v.full_name = owner.full_name;

  if (owner.show_score && can('score')) {
    const s = Score.latest(db, uid);
    v.score = s ? s.score : null;
  }
  if (owner.show_stats && can('stats')) v.stats = Proposal.stats(db, uid);

  // Being introduced is a fact about two people, so it needs both of them to
  // have opened it: the member's own setting, and the referrer's.
  if (can('referred_by')) {
    const by = Referral.referrerOf(db, uid);
    if (by && (by.id === viewerId || visible(db, by.id, viewerId, 'display_name'))) {
      v.referred_by = { handle: by.handle, name: by.name, on: by.on };
    }
  }
  if (can('referrals')) v.referrals = Referral.standing(db, uid);

  // The couple is shown only when it is verified AND the owner has opened it.
  if (can('relationship')) {
    const rel = Rel.verifiedFor(db, uid);
    if (rel) {
      const partner = byId(db, Rel.partnerOf(rel, uid));
      v.relationship = {
        id: rel.id,
        kind: rel.kind,
        verified: true,
        since: rel.started_on,
        duration: Rel.durationText(rel.started_on),
        joint_bio: rel.joint_bio,
        joint_values: rel.joint_values,
        joint_goals: rel.joint_goals,
        partner: partner ? {
          handle: partner.handle,
          name: visible(db, partner.user_id, viewerId, 'display_name')
            ? (partner.display_name || partner.handle) : partner.handle,
          photo_seed: visible(db, partner.user_id, viewerId, 'photo') ? (partner.photo_seed || partner.handle) : null
        } : null
      };
    }
  }

  if (can('photo')) {
    v.photos = db.prepare('SELECT * FROM photos WHERE user_id=? ORDER BY ord').all(uid)
      .filter((p) => self || visible(db, uid, viewerId, 'photo') && reach(db, uid, viewerId, p.level));
  }
  return v;
}

/* A photo carries its own level, checked the same way a field is. */
function reach(db, ownerId, viewerId, level) {
  const RANK = { public: 0, registered: 1, connections: 2, private: 3 };
  const REACH = { anon: 0, registered: 1, connection: 2, self: 3 };
  if (RANK[level] === RANK.private) return false;
  return REACH[relationOf(db, ownerId, viewerId)] >= RANK[level];
}

export function recordView(db, ownerId, viewerId) {
  if (viewerId === ownerId) return;
  db.prepare('INSERT INTO profile_views (profile_user,viewer,at) VALUES (?,?,?)')
    .run(ownerId, viewerId || null, now());
}

export function completeness(db, userId) {
  const s = Score.compute(db, userId);
  const c = s && s.components.find((x) => x.key === 'completeness');
  return c ? Math.round(c.value * 100) : 0;
}
