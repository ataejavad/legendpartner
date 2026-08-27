/* ============================================================================
   HTML — escaping and the page shell.
   `h` is a tagged template that escapes every interpolation. Anything already
   built as markup is passed through `raw`, which is the only way to opt out —
   so an un-escaped value has to be written deliberately and reads as such.
   ========================================================================== */
export function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
const RAW = Symbol('raw');
export function raw(s) { return { [RAW]: String(s) }; }
function one(v) {
  if (v == null || v === false) return '';
  if (Array.isArray(v)) return v.map(one).join('');
  if (typeof v === 'object' && RAW in v) return v[RAW];
  return esc(v);
}
export function h(strings, ...vals) {
  let out = strings[0];
  for (let i = 0; i < vals.length; i++) out += one(vals[i]) + strings[i + 1];
  return raw(out);
}

/* An abstract plate derived from a seed. Never a photograph of anyone: this is
   a demonstration system and inventing faces for it would be dishonest. */
export function plate(seed, size = 400) {
  let n = 0;
  const s = String(seed || 'x');
  for (let i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) % 360;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">` +
    `<defs><linearGradient id="a" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="hsl(${n},13%,27%)"/><stop offset="1" stop-color="hsl(${n},15%,11%)"/>` +
    `</linearGradient><radialGradient id="b" cx=".6" cy=".34" r=".6">` +
    `<stop offset="0" stop-color="#E4D6B6" stop-opacity=".26"/>` +
    `<stop offset="1" stop-color="#E4D6B6" stop-opacity="0"/></radialGradient></defs>` +
    `<rect width="${size}" height="${size}" fill="url(#a)"/>` +
    `<rect width="${size}" height="${size}" fill="url(#b)"/>` +
    `<circle cx="${size / 2}" cy="${size * 0.4}" r="${size * 0.13}" fill="#E4D6B6" fill-opacity=".16"/>` +
    `<path d="M${size * 0.24} ${size} a${size * 0.26} ${size * 0.26} 0 0 1 ${size * 0.52} 0Z" fill="#E4D6B6" fill-opacity=".16"/>` +
    `</svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

export function layout({ title, description, body, ctx, og, noindex = true, canonical }) {
  const nav = ctx && ctx.user
    ? h`<a href="/discover">Discover</a><a href="/dashboard">Dashboard</a>
        <a href="/u/${ctx.user.handle}">My profile</a>
        ${ctx.user.role === 'admin' ? h`<a href="/admin">Admin</a>` : ''}
        <form class="navform" method="post" action="/signout">
          <input type="hidden" name="csrf" value="${ctx.session.csrf}">
          <button type="submit">Sign out</button>
        </form>`
    : h`<a href="/discover">Discover</a><a href="/signin">Sign in</a><a class="nav__cta" href="/signup">Create a profile</a>`;

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description || '')}">
${noindex ? '<meta name="robots" content="noindex,nofollow">' : '<meta name="robots" content="index,follow">'}
${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ''}
${og ? Object.entries(og).map(([k, v]) => `<meta property="${esc(k)}" content="${esc(v)}">`).join('\n') : ''}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/static/app.css">
</head><body>
<header class="nav"><div class="nav__inner">
  <a class="brand" href="/"><span class="brand__mark" aria-hidden="true"></span>
    <span class="brand__type">Legend<span class="brand__sub">Relationship Identity</span></span></a>
  <nav class="nav__links">${one(nav)}</nav>
</div></header>
<main id="main">${one(body)}</main>
<footer class="foot"><div class="wrap">
  <p>Legend — a private relationship identity. Verified information, voluntary transparency, and tools for safer discovery.</p>
  <p class="quiet">We do not claim to predict how anyone will behave. Verification confirms who a person is; it is never a warranty of character.</p>
  <p class="quiet"><a href="/discover">Discover</a> · <a href="/about">What this is</a> · <a href="/dashboard/privacy">Privacy controls</a></p>
</div></footer>
<script src="/static/app.js"></script>
</body></html>`;
}

export function field(name, label, value, opts = {}) {
  const id = 'f-' + name;
  if (opts.options) {
    return h`<div class="fld"><label for="${id}">${label}</label>
      <select id="${id}" name="${name}">
        ${opts.options.map((o) => h`<option value="${o}"${o === value ? raw(' selected') : ''}>${o}</option>`)}
      </select>${opts.note ? h`<p class="fld__n">${opts.note}</p>` : ''}</div>`;
  }
  if (opts.textarea) {
    return h`<div class="fld"><label for="${id}">${label}</label>
      <textarea id="${id}" name="${name}" rows="${opts.rows || 3}" placeholder="${opts.ph || ''}">${value || ''}</textarea>
      ${opts.note ? h`<p class="fld__n">${opts.note}</p>` : ''}</div>`;
  }
  return h`<div class="fld"><label for="${id}">${label}</label>
    <input id="${id}" name="${name}" type="${opts.type || 'text'}" value="${value == null ? '' : value}"
      placeholder="${opts.ph || ''}"${opts.required ? raw(' required') : ''}>
    ${opts.note ? h`<p class="fld__n">${opts.note}</p>` : ''}</div>`;
}

export function badge(text, kind = '') { return h`<span class="badge ${kind}">${text}</span>`; }
export function notice(msg, kind = 'ok') { return msg ? h`<p class="notice notice--${kind}">${msg}</p>` : ''; }
