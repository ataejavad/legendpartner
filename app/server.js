/* ============================================================================
   SERVER — routing, the request context, and the guards.

   Authorisation happens here and in the engines, never in a template. A route
   that needs a member is wrapped in `member`; one that needs an operator is
   wrapped in `admin`. Neither reads anything the client sent about who it is.
   ========================================================================== */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize } from 'node:path';
import { open, now } from './lib/db.js';
import { Router, cookies, redirect, html, json, text } from './lib/http.js';
import { readSession } from './lib/auth.js';
import * as Pages from './routes/pages.js';
import * as Account from './routes/account.js';
import * as Dash from './routes/dashboard.js';
import * as Admin from './routes/admin.js';
import { routes as apiRoutes } from './routes/api.js';
import { hit } from './engines/rate.js';

const HERE = dirname(fileURLToPath(import.meta.url));
export const DB_FILE = process.env.DB_FILE || join(HERE, 'data', 'legend.db');

const TYPES = { '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
                '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };

export function build(db) {
  const r = Router();

  /* public */
  r.get('/', (c, res) => Pages.home(c, res));
  r.get('/about', (c, res) => Pages.about(c, res));
  r.get('/discover', (c, res, p, url) => Pages.discover(c, res, url));
  r.get('/u/:handle', (c, res, p) => Pages.profile(c, res, p.handle));
  r.get('/c/:id', (c, res, p) => Pages.couple(c, res, p.id));
  r.get('/robots.txt', (c, res) => Pages.robots(res));
  r.get('/sitemap.xml', (c, res) => Pages.sitemap(c, res));

  /* account */
  r.get('/signup', (c, res, p, url) => Account.signupForm(c, res, null, url.searchParams.get('ref')));
  r.post('/signup', (c, res, p, url, req) => Account.signup(c, res, req));
  r.get('/signin', (c, res) => Account.signinForm(c, res));
  r.post('/signin', (c, res, p, url, req) => Account.signin(c, res, req));
  r.post('/signout', (c, res, p, url, req) => Account.signout(c, res, req));

  /* against another profile */
  r.get('/u/:handle/propose', member((c, res, p) => Account.proposeForm(c, res, p.handle)));
  r.post('/u/:handle/propose', member((c, res, p, url, req) => Account.propose(c, res, req, p.handle)));
  r.get('/u/:handle/report', member((c, res, p) => Account.reportForm(c, res, p.handle)));
  r.post('/u/:handle/report', member((c, res, p, url, req) => Account.report(c, res, req, p.handle)));
  r.post('/u/:handle/block', member((c, res, p, url, req) => Account.block(c, res, req, p.handle)));
  r.post('/u/:handle/follow', member((c, res, p, url, req) => Account.follow(c, res, req, p.handle)));

  /* dashboard */
  r.get('/dashboard', member((c, res) => Dash.overview(c, res)));
  r.get('/dashboard/profile', member((c, res) => Dash.profileForm(c, res)));
  r.post('/dashboard/profile', member((c, res, p, url, req) => Dash.saveProfile(c, res, req)));
  r.post('/dashboard/publish', member((c, res, p, url, req) => Dash.publish(c, res, req)));
  r.post('/dashboard/photo', member((c, res, p, url, req) => Dash.addPhoto(c, res, req)));
  r.post('/dashboard/photo/delete', member((c, res, p, url, req) => Dash.deletePhoto(c, res, req)));
  r.get('/dashboard/relationship', member((c, res) => Dash.relationship(c, res)));
  for (const a of ['claim', 'confirm', 'decline', 'end', 'hide', 'joint', 'milestone']) {
    r.post('/dashboard/relationship/' + a, member((c, res, p, url, req) => Dash.relAction(c, res, req, a)));
  }
  r.get('/dashboard/score', member((c, res) => Dash.score(c, res)));
  r.get('/dashboard/proposals', member((c, res) => Dash.proposals(c, res)));
  for (const a of ['accept', 'decline', 'cancel']) {
    r.post('/dashboard/proposals/' + a, member((c, res, p, url, req) => Dash.proposalAction(c, res, req, a)));
  }
  r.get('/dashboard/connections', member((c, res) => Dash.connections(c, res)));
  r.get('/dashboard/posts', member((c, res) => Dash.posts(c, res)));
  r.post('/dashboard/posts', member((c, res, p, url, req) => Dash.postAction(c, res, req, 'create')));
  r.post('/dashboard/posts/delete', member((c, res, p, url, req) => Dash.postAction(c, res, req, 'delete')));
  r.get('/dashboard/referrals', member((c, res) => Dash.referrals(c, res)));
  r.post('/dashboard/referrals', member((c, res, p, url, req) => Dash.referralAction(c, res, req, 'issue')));
  r.post('/dashboard/referrals/revoke', member((c, res, p, url, req) => Dash.referralAction(c, res, req, 'revoke')));
  r.get('/dashboard/privacy', member((c, res) => Dash.privacy(c, res)));
  r.post('/dashboard/privacy', member((c, res, p, url, req) => Dash.savePrivacy(c, res, req)));
  r.post('/dashboard/unblock', member((c, res, p, url, req) => Dash.unblock(c, res, req)));
  r.get('/dashboard/verification', member((c, res) => Dash.verification(c, res)));
  r.post('/dashboard/verification', member((c, res, p, url, req) => Dash.requestVerification(c, res, req)));
  r.get('/dashboard/security', member((c, res) => Dash.security(c, res)));
  r.post('/dashboard/password', member((c, res, p, url, req) => Dash.changePassword(c, res, req)));
  r.post('/dashboard/sessions/end', member((c, res, p, url, req) => Dash.endSessions(c, res, req)));
  r.get('/dashboard/export', member((c, res) => Dash.exportData(c, res)));
  r.post('/dashboard/delete', member((c, res, p, url, req) => Dash.deleteAccount(c, res, req)));
  r.get('/dashboard/notifications', member((c, res) => Dash.notifications(c, res)));

  /* admin */
  r.get('/admin', admin((c, res) => Admin.overview(c, res)));
  r.get('/admin/reports', admin((c, res) => Admin.reports(c, res)));
  r.get('/admin/users', admin((c, res) => Admin.users(c, res)));
  r.get('/admin/signals', admin((c, res) => Admin.signals(c, res)));
  r.get('/admin/audit', admin((c, res) => Admin.auditLog(c, res)));
  r.post('/admin/reports/resolve', admin((c, res, p, url, req) => Admin.action(c, res, req, 'resolve')));
  r.post('/admin/user/status', admin((c, res, p, url, req) => Admin.action(c, res, req, 'status')));
  r.post('/admin/user/verify', admin((c, res, p, url, req) => Admin.action(c, res, req, 'verify')));
  r.post('/admin/post/hide', admin((c, res, p, url, req) => Admin.action(c, res, req, 'hide')));

  /* api */
  for (const [key, fn] of Object.entries(apiRoutes)) {
    const [method, path] = key.split(' ');
    (method === 'GET' ? r.get : r.post)(path, fn);
  }
  return r;
}

function member(fn) {
  return (c, res, p, url, req) => {
    if (!c.user) return redirect(res, '/signin');
    if (c.user.status !== 'active') return html(res, 'This account is suspended.', 403);
    return fn(c, res, p, url, req);
  };
}
function admin(fn) {
  return (c, res, p, url, req) => {
    if (!c.user) return redirect(res, '/signin');
    // A non-administrator is answered exactly as if the route did not exist.
    if (c.user.role !== 'admin') return Pages.notFound(c, res);
    return fn(c, res, p, url, req);
  };
}

async function serveStatic(res, path) {
  const rel = normalize(path.replace('/static/', '')).replace(/^(\.\.[/\\])+/, '');
  const file = join(HERE, 'static', rel);
  if (!file.startsWith(join(HERE, 'static'))) return text(res, 'Not found', 404);
  try {
    const buf = await readFile(file);
    const ext = file.slice(file.lastIndexOf('.'));
    res.writeHead(200, { 'Content-Type': TYPES[ext] || 'application/octet-stream',
                         'Cache-Control': 'public, max-age=300' });
    res.end(buf);
  } catch { text(res, 'Not found', 404); }
}

export function createApp(dbFile = DB_FILE) {
  const db = open(dbFile);
  const router = build(db);

  return createServer(async (req, res) => {
    const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
    const ip = (req.socket.remoteAddress || 'local').replace(/^::ffff:/, '');

    if (url.pathname.startsWith('/static/')) return serveStatic(res, url.pathname);

    const found = readSession(db, cookies(req).sid);
    const ctx = {
      db, ip,
      user: found ? found.user : null,
      session: found ? found.session : null,
      userId: found ? found.user.id : null
    };
    if (ctx.user) db.prepare('UPDATE users SET last_seen=? WHERE id=?').run(now(), ctx.user.id);

    // A floor under everything, so no single address can hammer the site.
    if (!hit(db, `req:${ip}`, 600, 60000)) return text(res, 'Too many requests.', 429);

    const m = router.match(req.method, url.pathname);
    if (!m) {
      if (url.pathname.startsWith('/api/')) return json(res, { error: 'Not found.' }, 404);
      return Pages.notFound(ctx, res);
    }
    try {
      await m.handler(ctx, res, m.params, url, req);
    } catch (err) {
      // The message goes to the log, never to the visitor.
      console.error('[500]', req.method, url.pathname, err && err.message);
      if (!res.headersSent) {
        if (url.pathname.startsWith('/api/')) json(res, { error: 'Something went wrong.' }, 500);
        else html(res, '<h1>Something went wrong.</h1>', 500);
      }
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT || 8910);
  createApp().listen(port, () => console.log(`Legend running on http://localhost:${port}`));
}
