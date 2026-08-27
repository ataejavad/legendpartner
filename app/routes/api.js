/* ============================================================================
   JSON API
   The same engines the pages use, so an endpoint cannot be more permissive
   than the page. Authorisation is checked here, server-side, on every call —
   the client's opinion of what it may do is never consulted.
   ========================================================================== */
import { json, form as readForm } from '../lib/http.js';
import { checkCsrf } from '../lib/auth.js';
import * as Profile from '../engines/profile.js';
import * as Discovery from '../engines/discovery.js';
import * as Rel from '../engines/relationship.js';
import * as Proposal from '../engines/proposal.js';
import * as Content from '../engines/content.js';
import * as Score from '../engines/score.js';
import * as Privacy from '../engines/privacy.js';
import * as Notif from '../engines/notification.js';
import * as Moderation from '../engines/moderation.js';
import * as Referral from '../engines/referral.js';

const need = (ctx, res) => { if (!ctx.user) { json(res, { error: 'Sign in required.' }, 401); return false; } return true; };
const csrf = async (ctx, res, req) => {
  const b = await readForm(req);
  if (!checkCsrf(ctx, b)) { json(res, { error: 'Bad or missing CSRF token.' }, 403); return null; }
  return b;
};

export const routes = {
  'GET /api/profile/:handle': (ctx, res, p) => {
    const owner = Profile.byHandle(ctx.db, p.handle);
    if (!owner || (!owner.published && ctx.userId !== owner.user_id)) return json(res, { error: 'Not found.' }, 404);
    json(res, Profile.publicView(ctx.db, owner, ctx.userId));
  },
  'GET /api/search': (ctx, res, p, url) =>
    json(res, { results: Discovery.search(ctx.db, Object.fromEntries(url.searchParams), ctx.userId) }),
  'GET /api/me': (ctx, res) => {
    if (!need(ctx, res)) return;
    json(res, {
      handle: ctx.user.handle, role: ctx.user.role,
      profile: Profile.byId(ctx.db, ctx.userId),
      privacy: Privacy.allLevels(ctx.db, ctx.userId),
      score: Score.latest(ctx.db, ctx.userId),
      unread: Notif.unread(ctx.db, ctx.userId),
      csrf: ctx.session.csrf
    });
  },
  'GET /api/score/:handle': (ctx, res, p) => {
    const owner = Profile.byHandle(ctx.db, p.handle);
    if (!owner) return json(res, { error: 'Not found.' }, 404);
    // The score is a private field unless its owner published it.
    if (ctx.userId !== owner.user_id &&
        (!owner.show_score || !Privacy.visible(ctx.db, owner.user_id, ctx.userId, 'score')))
      return json(res, { error: 'Not available.' }, 403);
    const s = Score.latest(ctx.db, owner.user_id);
    json(res, { score: s.score, explanation: Score.EXPLANATION,
      components: ctx.userId === owner.user_id ? s.components : undefined });
  },
  'POST /api/profile': async (ctx, res, p, url, req) => {
    if (!need(ctx, res)) return;
    const b = await csrf(ctx, res, req); if (!b) return;
    Profile.update(ctx.db, ctx.userId, b);
    json(res, { ok: true, profile: Profile.byId(ctx.db, ctx.userId) });
  },
  'POST /api/privacy': async (ctx, res, p, url, req) => {
    if (!need(ctx, res)) return;
    const b = await csrf(ctx, res, req); if (!b) return;
    const bad = [];
    for (const [k, v] of Object.entries(b)) {
      if (k === 'csrf') continue;
      try { Privacy.setLevel(ctx.db, ctx.userId, k, v); } catch { bad.push(k); }
    }
    json(res, { ok: true, rejected: bad, privacy: Privacy.allLevels(ctx.db, ctx.userId) });
  },
  'POST /api/relationship/claim': async (ctx, res, p, url, req) => {
    if (!need(ctx, res)) return;
    const b = await csrf(ctx, res, req); if (!b) return;
    const other = ctx.db.prepare('SELECT * FROM users WHERE handle=?').get(String(b.handle || '').toLowerCase());
    if (!other) return json(res, { error: 'No such member.' }, 404);
    const r = Rel.propose(ctx.db, ctx.userId, other.id, b.kind || 'In a Relationship', b.started_on);
    json(res, r, r.error ? 400 : 200);
  },
  'POST /api/relationship/confirm': async (ctx, res, p, url, req) => {
    if (!need(ctx, res)) return;
    const b = await csrf(ctx, res, req); if (!b) return;
    const r = Rel.confirm(ctx.db, parseInt(b.id, 10), ctx.userId);
    json(res, r, r.error ? 403 : 200);
  },
  'POST /api/relationship/end': async (ctx, res, p, url, req) => {
    if (!need(ctx, res)) return;
    const b = await csrf(ctx, res, req); if (!b) return;
    const r = Rel.end(ctx.db, parseInt(b.id, 10), ctx.userId);
    json(res, r, r.error ? 403 : 200);
  },
  'POST /api/proposal': async (ctx, res, p, url, req) => {
    if (!need(ctx, res)) return;
    const b = await csrf(ctx, res, req); if (!b) return;
    const to = ctx.db.prepare('SELECT * FROM users WHERE handle=?').get(String(b.handle || '').toLowerCase());
    if (!to) return json(res, { error: 'No such member.' }, 404);
    const r = Proposal.send(ctx.db, ctx.userId, to.id, b);
    json(res, r, r.error ? 400 : 200);
  },
  'POST /api/proposal/respond': async (ctx, res, p, url, req) => {
    if (!need(ctx, res)) return;
    const b = await csrf(ctx, res, req); if (!b) return;
    const r = Proposal.respond(ctx.db, parseInt(b.id, 10), ctx.userId, b.decision);
    json(res, r, r.error ? 403 : 200);
  },
  'POST /api/post': async (ctx, res, p, url, req) => {
    if (!need(ctx, res)) return;
    const b = await csrf(ctx, res, req); if (!b) return;
    const r = Content.create(ctx.db, ctx.userId, b);
    json(res, r, r.error ? 400 : 200);
  },
  'POST /api/block': async (ctx, res, p, url, req) => {
    if (!need(ctx, res)) return;
    const b = await csrf(ctx, res, req); if (!b) return;
    const other = ctx.db.prepare('SELECT * FROM users WHERE handle=?').get(String(b.handle || '').toLowerCase());
    if (!other) return json(res, { error: 'No such member.' }, 404);
    json(res, Moderation.block(ctx.db, ctx.userId, other.id));
  },
  'POST /api/report': async (ctx, res, p, url, req) => {
    if (!need(ctx, res)) return;
    const b = await csrf(ctx, res, req); if (!b) return;
    const other = ctx.db.prepare('SELECT * FROM users WHERE handle=?').get(String(b.handle || '').toLowerCase());
    if (!other) return json(res, { error: 'No such member.' }, 404);
    const r = Moderation.report(ctx.db, ctx.userId, 'user', other.id, b.reason, b.detail);
    json(res, r, r.error ? 400 : 200);
  },
  'GET /api/referrals': (ctx, res) => {
    if (!need(ctx, res)) return;
    json(res, {
      issued: Referral.issuedBy(ctx.db, ctx.userId),
      introduced: Referral.introduced(ctx.db, ctx.userId),
      referred_by: Referral.referrerOf(ctx.db, ctx.userId),
      limits: Referral.LIMITS
    });
  },
  'GET /api/referral/:code': (ctx, res, p) => {
    // Deliberately answers only whether the code is open and who is vouching:
    // it is reached before sign-in, so it must reveal nothing else.
    const inv = Referral.look(ctx.db, p.code);
    if (!inv) return json(res, { error: 'Not open.' }, 404);
    json(res, { code: inv.code, to_name: inv.to_name, note: inv.note, by: inv.by });
  },
  'POST /api/referral': async (ctx, res, p, url, req) => {
    if (!need(ctx, res)) return;
    const b = await csrf(ctx, res, req); if (!b) return;
    const r = Referral.issue(ctx.db, ctx.userId, b);
    if (r.id) Score.refresh(ctx.db, ctx.userId);
    json(res, r, r.error ? 400 : 200);
  },
  'POST /api/referral/revoke': async (ctx, res, p, url, req) => {
    if (!need(ctx, res)) return;
    const b = await csrf(ctx, res, req); if (!b) return;
    const r = Referral.revoke(ctx.db, parseInt(b.id, 10), ctx.userId);
    json(res, r, r.error ? 403 : 200);
  },
  'GET /api/notifications': (ctx, res) => {
    if (!need(ctx, res)) return;
    json(res, { unread: Notif.unread(ctx.db, ctx.userId), items: Notif.list(ctx.db, ctx.userId) });
  }
};
