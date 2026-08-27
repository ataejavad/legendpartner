/* ============================================================================
   DATING SCORE ENGINE
   Modular by construction: the algorithm is a list of named signals, each a
   pure function returning 0..1 with a sentence explaining itself. Changing the
   weighting, adding a signal or retiring one touches SIGNALS and nothing else.

   Deliberately not a popularity score. Volume of attention received is not a
   signal — it measures how a person looks, not how they behave — and nothing
   here can be bought, because no signal reads a payment, a plan or a tier.
   ========================================================================== */
import { now } from '../lib/db.js';
import * as Referral from './referral.js';

const COMPLETION_FIELDS = [
  'display_name','birth_year','gender','city','country','languages',
  'lifestyle','interests','personality','bio','intent','goals','partner_prefs'
];

export const SIGNALS = [
  {
    key: 'completeness', label: 'Profile completeness', weight: 20,
    of(ctx) {
      const filled = COMPLETION_FIELDS.filter((f) => String(ctx.profile[f] ?? '').trim() !== '').length;
      return filled / COMPLETION_FIELDS.length;
    },
    say: (v) => `${Math.round(v * 100)}% of the profile is filled in.`
  },
  {
    key: 'verification', label: 'Verification', weight: 22,
    of(ctx) {
      const u = ctx.user;
      return (u.email_verified ? 0.3 : 0) + (u.phone_verified ? 0.2 : 0) + (u.id_verified ? 0.5 : 0);
    },
    say: (v) => v >= 1 ? 'Identity verified in person.'
      : v > 0 ? 'Partly verified. Identity verification is the largest remaining step.'
      : 'Not verified. This is the single biggest thing you can change.'
  },
  {
    key: 'responsiveness', label: 'Response behaviour', weight: 16,
    // Answering, either way, counts. Declining is an answer; ignoring is not.
    of(ctx) {
      const { received, answered } = ctx.proposals;
      if (received === 0) return 0.6;                 // nothing to judge: neutral, not zero
      return Math.min(1, answered / received);
    },
    say: (v, ctx) => ctx.proposals.received === 0
      ? 'Nothing to judge yet — this sits neutral until people write to you.'
      : `You have answered ${ctx.proposals.answered} of ${ctx.proposals.received} approaches. Declining counts; ignoring does not.`
  },
  {
    key: 'reciprocity', label: 'Quality of interaction', weight: 14,
    // Of the approaches you sent, how many were welcomed. Reads effort, not looks.
    of(ctx) {
      const { sent, accepted } = ctx.proposals;
      if (sent === 0) return 0.6;
      return Math.min(1, 0.35 + (accepted / sent) * 0.65);
    },
    say: (v, ctx) => ctx.proposals.sent === 0
      ? 'You have not written to anyone yet.'
      : `${ctx.proposals.accepted} of ${ctx.proposals.sent} approaches you sent were welcomed.`
  },
  {
    key: 'standing', label: 'Community standing', weight: 18,
    // Starts full and is only reduced by upheld reports. Good conduct is the
    // default assumption; it is misconduct that has to be evidenced.
    of(ctx) { return Math.max(0, 1 - ctx.upheldReports * 0.34); },
    say: (v) => v >= 1 ? 'Nothing recorded against you.'
      : 'Reports upheld against this account have reduced this.'
  },
  {
    key: 'vouching', label: 'Who you vouched for', weight: 8,
    // Reads accountability, not volume: introducing nobody is neutral, and a
    // hundred introductions is worth no more than one. What moves it is whether
    // the people you put your name to are still in good standing.
    of(ctx) {
      const { count, troubled } = ctx.referrals;
      if (count === 0) return 0.6;
      return troubled === 0 ? 1 : Math.max(0, 1 - troubled / count);
    },
    say: (v, ctx) => ctx.referrals.count === 0
      ? 'You have introduced nobody. This sits neutral — it is not something you are expected to do.'
      : ctx.referrals.troubled === 0
        ? `The ${ctx.referrals.count} you introduced are all in good standing.`
        : `${ctx.referrals.troubled} of the ${ctx.referrals.count} you introduced is no longer in good standing. Vouching carries this.`
  },
  {
    key: 'presence', label: 'Reliability', weight: 10,
    // Recency of use, flattened hard so that living on the site earns nothing.
    of(ctx) {
      if (!ctx.user.last_seen) return 0.4;
      const days = (Date.now() - new Date(ctx.user.last_seen)) / 86400000;
      return days <= 30 ? 1 : days <= 90 ? 0.7 : 0.4;
    },
    say: (v) => v >= 1 ? 'Recently active.' : 'Less recently active. Being here constantly earns nothing beyond this.'
  }
];

function gather(db, userId) {
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(userId);
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id=?').get(userId) || {};
  const received = db.prepare("SELECT COUNT(*) n FROM proposals WHERE to_user=?").get(userId).n;
  const answered = db.prepare(
    "SELECT COUNT(*) n FROM proposals WHERE to_user=? AND status IN ('accepted','declined')").get(userId).n;
  const sent = db.prepare("SELECT COUNT(*) n FROM proposals WHERE from_user=?").get(userId).n;
  const accepted = db.prepare(
    "SELECT COUNT(*) n FROM proposals WHERE from_user=? AND status='accepted'").get(userId).n;
  const upheldReports = db.prepare(
    "SELECT COUNT(*) n FROM reports WHERE subject_type='user' AND subject_id=? AND status='actioned'").get(userId).n;
  const referrals = Referral.standing(db, userId);
  return { user, profile, proposals: { received, answered, sent, accepted }, upheldReports, referrals };
}

export function compute(db, userId) {
  const ctx = gather(db, userId);
  if (!ctx.user) return null;
  let total = 0, sum = 0;
  const components = SIGNALS.map((s) => {
    const v = Math.max(0, Math.min(1, s.of(ctx)));
    total += s.weight; sum += s.weight * v;
    return { key: s.key, label: s.label, weight: s.weight, value: v, note: s.say(v, ctx) };
  });
  const score = Math.round((sum / total) * 100);
  return { score, components };
}

/* Snapshots make the score auditable over time and let the page render without
   recomputing on every request. */
export function refresh(db, userId) {
  const r = compute(db, userId);
  if (!r) return null;
  db.prepare('INSERT INTO score_snapshots (user_id,score,components,computed_at) VALUES (?,?,?,?)')
    .run(userId, r.score, JSON.stringify(r.components), now());
  return r;
}

export function latest(db, userId) {
  const row = db.prepare(
    'SELECT * FROM score_snapshots WHERE user_id=? ORDER BY computed_at DESC LIMIT 1').get(userId);
  if (!row) return refresh(db, userId);
  return { score: row.score, components: JSON.parse(row.components), computed_at: row.computed_at };
}

export const EXPLANATION =
  'Your score reflects verified profile information, platform activity, interaction quality, ' +
  'and community trust signals. It is not a judgement of your character, it cannot be bought, ' +
  'and volume of attention received is deliberately not one of its signals.';
