/* ============================================================================
   HTTP — request parsing and responses.
   Small on purpose: a router, a body reader with a hard cap, cookies, and the
   handful of response shapes the application uses.
   ========================================================================== */
const MAX_BODY = 256 * 1024;

export async function readBody(req) {
  return new Promise((resolve, reject) => {
    let n = 0; const parts = [];
    req.on('data', (c) => {
      n += c.length;
      if (n > MAX_BODY) { req.destroy(); reject(new Error('body too large')); return; }
      parts.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(parts).toString('utf8')));
    req.on('error', reject);
  });
}

export async function form(req) {
  const raw = await readBody(req);
  const type = String(req.headers['content-type'] || '');
  if (type.includes('application/json')) {
    try { return JSON.parse(raw || '{}'); } catch { return {}; }
  }
  const out = Object.create(null);
  for (const [k, v] of new URLSearchParams(raw)) out[k] = v;
  return out;
}

export function cookies(req) {
  const out = Object.create(null);
  const raw = req.headers.cookie;
  if (!raw) return out;
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function setCookie(res, name, value, opts = {}) {
  const bits = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (opts.maxAge != null) bits.push(`Max-Age=${opts.maxAge}`);
  if (opts.secure) bits.push('Secure');
  const prev = res.getHeader('Set-Cookie');
  const all = prev ? (Array.isArray(prev) ? prev.slice() : [prev]) : [];
  all.push(bits.join('; '));
  res.setHeader('Set-Cookie', all);
}

const SECURITY = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // No inline event handlers anywhere; scripts are served as files.
  'Content-Security-Policy':
    "default-src 'self'; img-src 'self' data:; style-src 'self' https://fonts.googleapis.com; " +
    "font-src https://fonts.gstatic.com; script-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"
};

function head(res, code, type, extra = {}) {
  res.writeHead(code, { 'Content-Type': type, ...SECURITY, ...extra });
}

export function html(res, body, code = 200, extra = {}) {
  head(res, code, 'text/html; charset=utf-8', extra);
  res.end(body);
}
export function json(res, obj, code = 200) {
  head(res, code, 'application/json; charset=utf-8');
  res.end(JSON.stringify(obj));
}
export function text(res, body, code = 200, type = 'text/plain; charset=utf-8') {
  head(res, code, type);
  res.end(body);
}
export function redirect(res, to, code = 303) {
  res.writeHead(code, { Location: to, ...SECURITY });
  res.end();
}

/* A router with :params. Routes are matched in declaration order. */
export function Router() {
  const routes = [];
  const add = (method, pattern, handler) => {
    const keys = [];
    const rx = new RegExp('^' + pattern.replace(/:[A-Za-z_]+/g, (m) => {
      keys.push(m.slice(1)); return '([^/]+)';
    }) + '$');
    routes.push({ method, rx, keys, handler });
  };
  return {
    get:  (p, h) => add('GET', p, h),
    post: (p, h) => add('POST', p, h),
    match(method, path) {
      for (const r of routes) {
        if (r.method !== method) continue;
        const m = r.rx.exec(path);
        if (!m) continue;
        const params = Object.create(null);
        r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
        return { handler: r.handler, params };
      }
      return null;
    }
  };
}
