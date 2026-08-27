/* ============================================================================
   PUBLIC PAGES — the profile, the directory, search, and the couple page.
   Nothing here decides what may be shown; it renders what the profile engine
   returned, which is already the viewer's entitled view.
   ========================================================================== */
import { h, raw, esc, layout, plate, badge, notice } from '../lib/html.js';
import { html, redirect } from '../lib/http.js';
import * as Profile from '../engines/profile.js';
import * as Discovery from '../engines/discovery.js';
import * as Content from '../engines/content.js';
import * as Score from '../engines/score.js';
import * as Rel from '../engines/relationship.js';
import { visible } from '../engines/privacy.js';

const ORIGIN = process.env.PUBLIC_ORIGIN || 'http://localhost:8910';

function marks(v) {
  const out = [];
  if (v.verification.identity) out.push(badge('Identity verified', 'is-id'));
  if (v.verification.email) out.push(badge('Email verified'));
  if (v.verification.phone) out.push(badge('Phone verified'));
  if (v.relationship && v.relationship.verified) out.push(badge('Verified relationship', 'is-rel'));
  return out.length ? out : [badge('Not yet verified', 'is-off')];
}

export function home(ctx, res) {
  const d = Discovery.directory(ctx.db, ctx.userId);
  html(res, layout({
    title: 'Legend — Relationship Identity',
    description: 'A relationship identity: verified information, voluntary transparency, and a profile you control.',
    noindex: false, canonical: ORIGIN + '/', ctx,
    body: h`
      <section class="hero">
        <div class="wrap">
          <p class="eyebrow">Dating &amp; Relationship Identity</p>
          <h1 class="display">Who you are,<br>and <em>who says so</em>.</h1>
          <p class="lead">
            A profile for dating and relationships in which the claims are checked, the relationship
            is confirmed by both people, and every field is closed until you open it.
          </p>
          <div class="row">
            <a class="btn btn--solid" href="/signup">Create a profile</a>
            <a class="btn" href="/discover">Discover ${d.total} profiles</a>
          </div>
        </div>
      </section>
      <section class="wrap band">
        <div class="cards3">
          <article class="card"><h3>Confirmed by both</h3>
            <p>Nobody can name you as their partner. A relationship shows as verified only after you have confirmed it yourself, and either of you can end it without a reason.</p></article>
          <article class="card"><h3>Closed by default</h3>
            <p>Every field starts private or near it. Search cannot match on something you have kept closed, so a filter can never be used to probe for it.</p></article>
          <article class="card"><h3>A score you can read</h3>
            <p>Six named signals, each explained, none of them the volume of attention you receive. It cannot be bought and it is not a judgement of character.</p></article>
        </div>
      </section>`
  }));
}

export function about(ctx, res) {
  html(res, layout({
    title: 'What this is — Legend', ctx, noindex: false, canonical: ORIGIN + '/about',
    body: h`<section class="wrap band">
      <h1 class="h1">What this is, and what it is not.</h1>
      <div class="prose">
        <p>This is a relationship identity: a place to hold a dating profile, to record a relationship
        that the other person has confirmed, and to be discovered by people who are looking for what
        you are looking for.</p>
        <h2>What it does not claim</h2>
        <p>It cannot tell you whether someone will be faithful, kind, or honest with you. No system can,
        and a product that implies otherwise makes people less careful rather than safer. What it offers
        is narrower and real: information that has been checked, a relationship status that two people
        agreed to, and controls that are closed until you open them.</p>
        <h2>Verification</h2>
        <p>Email, phone and identity are separate marks with separate meanings. Identity verification
        confirms that a person is who they say on a stated date. It is not a background check, not a
        character reference, and not a guarantee of anything that happens afterwards.</p>
        <h2>The Dating Score</h2>
        <p>${Score.EXPLANATION}</p>
      </div></section>`
  }));
}

/* ---- the public profile ------------------------------------------------- */
export function profile(ctx, res, handle) {
  const owner = Profile.byHandle(ctx.db, handle);
  if (!owner || owner.status === 'banned' || owner.status === 'closed') return notFound(ctx, res);

  const self = ctx.userId === owner.user_id;
  if (!owner.published && !self) return notFound(ctx, res);

  const v = Profile.publicView(ctx.db, owner, ctx.userId);
  Profile.recordView(ctx.db, owner.user_id, ctx.userId);
  const posts = Content.forProfile(ctx.db, owner.user_id, ctx.userId, 10);
  const indexable = !!owner.indexable && !!owner.published;

  const facts = [
    ['Looking for', v.intent], ['Relationship status', v.rel_status], ['Languages', v.languages],
    ['Lifestyle', v.lifestyle], ['Interests', v.interests], ['Profession', v.profession],
    ['Education', v.education], ['Nationality', v.nationality], ['Personality', v.personality],
    ['What they hope for', v.goals], ['In a partner', v.partner_prefs]
  ].filter(([, val]) => val);

  const where = [v.city, v.country].filter(Boolean).join(', ');
  const heading = [v.display_name, v.age].filter(Boolean).join(', ');

  html(res, layout({
    title: `${v.display_name} — Legend`,
    description: v.bio ? String(v.bio).slice(0, 155) : 'A relationship identity on Legend.',
    noindex: !indexable,
    canonical: indexable ? `${ORIGIN}/u/${owner.handle}` : null,
    og: indexable ? {
      'og:type': 'profile', 'og:title': `${v.display_name} — Legend`,
      'og:description': v.bio ? String(v.bio).slice(0, 155) : 'A relationship identity on Legend.',
      'og:url': `${ORIGIN}/u/${owner.handle}`
    } : null,
    ctx,
    body: h`
      ${!owner.published && self ? notice('This profile is not published. Only you can see this page.', 'warn') : ''}
      <section class="wrap profile">
        <header class="phead">
          <img class="phead__plate" src="${v.photo_seed ? plate(v.photo_seed) : plate('anon')}" alt="">
          <div class="phead__who">
            <h1 class="h1">${heading}</h1>
            ${where ? h`<p class="phead__where">${where}</p>` : ''}
            <div class="marks">${marks(v)}</div>
          </div>
          <div class="phead__side">
            ${v.score != null ? h`
              <div class="score"><span class="score__n">${v.score}</span><span class="score__d">/100</span>
                <span class="score__l">Dating Score</span></div>` : ''}
            <div class="phead__acts">
              ${ctx.userId && !v.self && v.accepts_proposals
                ? h`<a class="btn btn--solid" href="/u/${owner.handle}/propose">Send a proposal</a>` : ''}
              ${ctx.userId && !v.self ? h`
                <form method="post" action="/u/${owner.handle}/follow" class="inline">
                  <input type="hidden" name="csrf" value="${ctx.session.csrf}">
                  <button class="btn" type="submit">${Content.isFollowing(ctx.db, ctx.userId, owner.user_id) ? 'Unfollow' : 'Follow'}</button>
                </form>
                <a class="btn" href="/u/${owner.handle}/report">Report</a>` : ''}
              ${v.self ? h`<a class="btn" href="/dashboard/profile">Edit profile</a>` : ''}
              <button class="btn" type="button" data-copy="${ORIGIN}/u/${owner.handle}">Copy link</button>
            </div>
            ${!v.accepts_proposals && !v.self ? h`<p class="quiet">Not accepting approaches at present.</p>` : ''}
          </div>
        </header>

        ${v.bio ? h`<section class="panel"><h2>About</h2><p class="prose">${v.bio}</p></section>` : ''}

        ${facts.length ? h`<section class="panel"><h2>Dating</h2>
          <dl class="kv">${facts.map(([k, val]) => h`<dt>${k}</dt><dd>${val}</dd>`)}</dl></section>` : ''}

        ${v.relationship ? h`
          <section class="panel panel--rel">
            <h2>Relationship ${badge('Verified relationship', 'is-rel')}</h2>
            <div class="couple">
              <img src="${plate(v.photo_seed || owner.handle)}" alt="">
              <span class="couple__amp">&amp;</span>
              <img src="${v.relationship.partner && v.relationship.partner.photo_seed
                ? plate(v.relationship.partner.photo_seed) : plate('partner')}" alt="">
            </div>
            <dl class="kv">
              <dt>Status</dt><dd>${v.relationship.kind}</dd>
              ${v.relationship.partner ? h`<dt>Partner</dt>
                <dd><a href="/u/${v.relationship.partner.handle}">${v.relationship.partner.name}</a></dd>` : ''}
              ${v.relationship.since ? h`<dt>Together since</dt><dd>${v.relationship.since} · ${v.relationship.duration}</dd>` : ''}
              ${v.relationship.joint_bio ? h`<dt>About them</dt><dd>${v.relationship.joint_bio}</dd>` : ''}
              ${v.relationship.joint_values ? h`<dt>What they value</dt><dd>${v.relationship.joint_values}</dd>` : ''}
            </dl>
            <p class="quiet">Both people confirmed this. Neither could have recorded it alone.</p>
            <a class="btn" href="/c/${v.relationship.id}">The couple page</a>
          </section>` : ''}

        ${v.referred_by || (v.referrals && v.referrals.count) ? h`
          <section class="panel"><h2>Introductions</h2>
            <dl class="kv">
              ${v.referred_by ? h`<dt>Introduced by</dt>
                <dd><a href="/u/${v.referred_by.handle}">${v.referred_by.name}</a>
                  <span class="quiet"> · ${String(v.referred_by.on).slice(0, 10)}</span></dd>` : ''}
              ${v.referrals && v.referrals.count ? h`<dt>Members introduced</dt>
                <dd>${v.referrals.count}, of whom ${v.referrals.inGoodStanding} in good standing</dd>` : ''}
            </dl>
            <p class="quiet">A member who introduces someone has their own standing attached to that
            person's. It is shown here because both sides opened it.</p>
          </section>` : ''}

        <section class="panel"><h2>Trust &amp; verification</h2>
          <div class="marks">${marks(v)}</div>
          <p class="quiet">A mark confirms what it names and nothing else. It is not a statement about
          character, conduct, or safety.</p>
        </section>

        ${v.score != null ? h`<section class="panel"><h2>Dating Score</h2>
          <p class="score__big">${v.score}<span>/100</span></p>
          <p class="quiet">${Score.EXPLANATION}</p></section>` : ''}

        ${v.stats ? h`<section class="panel"><h2>Activity</h2>
          <dl class="kv">
            <dt>Approaches received</dt><dd>${v.stats.received}</dd>
            <dt>Approaches accepted</dt><dd>${v.stats.accepted}</dd>
            <dt>Connections</dt><dd>${v.stats.connections}</dd>
            <dt>Profile views</dt><dd>${v.stats.views}</dd>
          </dl>
          <p class="quiet">Shown because this member chose to show it. It is off by default.</p></section>` : ''}

        ${v.photos && v.photos.length ? h`<section class="panel"><h2>Photographs</h2>
          <div class="gal">${v.photos.map((p) => h`<figure><img src="${plate(p.seed)}" alt="">
            <figcaption>${p.caption}</figcaption></figure>`)}</div></section>` : ''}

        ${posts.length ? h`<section class="panel"><h2>Posts &amp; experiences</h2>
          ${posts.map((p) => h`<article class="post">
            ${p.title ? h`<h3>${p.title}</h3>` : ''}
            <p class="post__m">${p.kind} · ${String(p.created_at).slice(0, 10)}${p.rel_id ? ' · with their partner' : ''}</p>
            <p>${p.body}</p>
            <p class="quiet">${Content.likeCount(ctx.db, p.id)} likes</p>
          </article>`)}</section>` : ''}
      </section>`
  }));
}

export function couple(ctx, res, relId) {
  const rel = ctx.db.prepare('SELECT * FROM relationships WHERE id=?').get(parseInt(relId, 10));
  if (!rel || rel.status !== 'verified') return notFound(ctx, res);
  const mine = ctx.userId === rel.a_user || ctx.userId === rel.b_user;
  // The couple page follows the same privacy question as the field does.
  if (!mine && !visible(ctx.db, rel.a_user, ctx.userId, 'relationship')) return notFound(ctx, res);

  const a = Profile.byId(ctx.db, rel.a_user), b = Profile.byId(ctx.db, rel.b_user);
  const av = Profile.publicView(ctx.db, a, ctx.userId), bv = Profile.publicView(ctx.db, b, ctx.userId);
  const ms = Content.milestones(ctx.db, rel.id);
  const posts = ctx.db.prepare('SELECT * FROM posts WHERE rel_id=? ORDER BY created_at DESC').all(rel.id)
    .filter((p) => Content.canRead(ctx.db, p, ctx.userId));

  html(res, layout({
    title: `${av.display_name} & ${bv.display_name} — Legend`, ctx,
    description: rel.joint_bio ? String(rel.joint_bio).slice(0, 155) : 'A verified couple on Legend.',
    body: h`<section class="wrap profile">
      <header class="phead phead--couple">
        <div class="couple couple--lg">
          <img src="${plate(av.photo_seed || a.handle)}" alt="">
          <span class="couple__amp">&amp;</span>
          <img src="${plate(bv.photo_seed || b.handle)}" alt="">
        </div>
        <div class="phead__who">
          <h1 class="h1"><a href="/u/${a.handle}">${av.display_name}</a> &amp; <a href="/u/${b.handle}">${bv.display_name}</a></h1>
          <div class="marks">${badge('Verified couple', 'is-rel')}</div>
          <p class="phead__where">${rel.kind}${rel.started_on ? ` · since ${esc(rel.started_on)} · ${esc(Rel.durationText(rel.started_on))}` : ''}</p>
        </div>
      </header>
      ${rel.joint_bio ? h`<section class="panel"><h2>Together</h2><p class="prose">${rel.joint_bio}</p></section>` : ''}
      ${rel.joint_values || rel.joint_goals ? h`<section class="panel"><h2>What they hold to</h2>
        <dl class="kv">${rel.joint_values ? h`<dt>Values</dt><dd>${rel.joint_values}</dd>` : ''}
        ${rel.joint_goals ? h`<dt>Goals</dt><dd>${rel.joint_goals}</dd>` : ''}</dl></section>` : ''}
      ${ms.length ? h`<section class="panel"><h2>Milestones</h2>
        ${ms.map((m) => h`<div class="ms"><span class="ms__d">${m.on_date}</span>
          <div><p class="ms__t">${m.title}</p><p class="quiet">${m.detail}</p></div></div>`)}</section>` : ''}
      ${posts.length ? h`<section class="panel"><h2>Together, published</h2>
        ${posts.map((p) => h`<article class="post">${p.title ? h`<h3>${p.title}</h3>` : ''}
          <p class="post__m">${String(p.created_at).slice(0, 10)}</p><p>${p.body}</p></article>`)}</section>` : ''}
      <p class="quiet">Both people confirmed this relationship. Either of them can end it at any time.</p>
    </section>`
  }));
}

/* ---- discovery ---------------------------------------------------------- */
export function discover(ctx, res, url) {
  const q = Object.fromEntries(url.searchParams);
  const any = ['name','country','city','gender','rel_status','language','interest','intent',
               'profession','age_min','age_max','score_min','verified','sort']
    .some((k) => q[k]);
  const results = any ? Discovery.search(ctx.db, q, ctx.userId) : null;
  const d = any ? null : Discovery.directory(ctx.db, ctx.userId);

  const card = (p) => h`<a class="pcard" href="/u/${p.handle}">
    <img src="${p.photo_seed ? plate(p.photo_seed) : plate('anon')}" alt="">
    <div class="pcard__b">
      <p class="pcard__n">${[p.display_name, p.age].filter(Boolean).join(', ')}</p>
      <p class="pcard__w">${[p.city, p.country].filter(Boolean).join(', ')}</p>
      ${p.rel_status ? h`<p class="pcard__s">${p.rel_status}</p>` : ''}
      ${p.bio ? h`<p class="pcard__bio">${String(p.bio).slice(0, 110)}</p>` : ''}
      ${p.interests ? h`<p class="pcard__i">${String(p.interests).slice(0, 70)}</p>` : ''}
      <div class="marks marks--sm">
        ${p.verification.identity ? badge('Verified', 'is-id') : ''}
        ${p.relationship ? badge('In a verified relationship', 'is-rel') : ''}
        ${p.score != null ? badge(`Score ${p.score}`) : ''}
      </div>
    </div></a>`;

  const shelf = (title, list) => list && list.length
    ? h`<section class="shelf"><h2>${title}</h2><div class="grid">${list.map(card)}</div></section>` : '';

  html(res, layout({
    title: 'Discover — Legend', ctx, noindex: false, canonical: ORIGIN + '/discover',
    description: 'Discover relationship identities: verified profiles, singles, and verified couples.',
    body: h`<section class="wrap band">
      <h1 class="h1">Discover</h1>
      <p class="lead">Only what people have chosen to publish. A filter cannot match a field somebody
      has kept closed, which is why searching here cannot be used to find out what they hid.</p>

      <form class="search" method="get" action="/discover">
        <input name="name" value="${q.name || ''}" placeholder="Name">
        <input name="city" value="${q.city || ''}" placeholder="City">
        <input name="country" value="${q.country || ''}" placeholder="Country">
        <input name="interest" value="${q.interest || ''}" placeholder="Interest">
        <input name="language" value="${q.language || ''}" placeholder="Language">
        <input name="age_min" value="${q.age_min || ''}" placeholder="Age from" inputmode="numeric">
        <input name="age_max" value="${q.age_max || ''}" placeholder="to" inputmode="numeric">
        <select name="rel_status"><option value="">Any status</option>
          ${Profile.REL_STATUS.map((s) => h`<option${s === q.rel_status ? raw(' selected') : ''}>${s}</option>`)}</select>
        <select name="gender"><option value="">Any</option>
          ${Profile.GENDERS.map((g) => h`<option${g === q.gender ? raw(' selected') : ''}>${g}</option>`)}</select>
        <select name="sort">${Discovery.SORTS.map((s) => h`<option${s === q.sort ? raw(' selected') : ''}>${s}</option>`)}</select>
        <label class="chk"><input type="checkbox" name="verified" value="1"${q.verified ? raw(' checked') : ''}> Verified only</label>
        <button class="btn btn--solid" type="submit">Search</button>
      </form>

      ${results ? h`<p class="quiet">${results.length} profile${results.length === 1 ? '' : 's'}.</p>
        ${results.length ? h`<div class="grid">${results.map(card)}</div>`
          : h`<p class="empty">Nothing matches. That may mean nobody fits, or that those who do have kept the field you searched on closed.</p>`}`
        : h`
        ${shelf('Verified profiles', d.verified)}
        ${shelf('Singles', d.singles)}
        ${d.couples.length ? h`<section class="shelf"><h2>Verified couples</h2>
          <div class="grid">${d.couples.map((c) => h`<a class="pcard pcard--couple" href="/c/${c.rel.id}">
            <div class="couple"><img src="${plate(c.a.photo_seed || c.a.handle)}" alt="">
              <span class="couple__amp">&amp;</span>
              <img src="${plate(c.b.photo_seed || c.b.handle)}" alt=""></div>
            <div class="pcard__b"><p class="pcard__n">${c.a.display_name} &amp; ${c.b.display_name}</p>
              <p class="pcard__s">${c.rel.kind}</p>
              <div class="marks marks--sm">${badge('Verified couple', 'is-rel')}</div></div></a>`)}</div></section>` : ''}
        ${shelf('Most complete', d.complete)}
        ${shelf('Recently joined', d.fresh)}`}
    </section>`
  }));
}

export function notFound(ctx, res) {
  html(res, layout({
    title: 'Not found — Legend', ctx,
    body: h`<section class="wrap band"><h1 class="h1">Nothing here.</h1>
      <p class="lead">There is no page at this address. If you were given a link to a profile, it may
      not be published — a profile that is private answers exactly as one that does not exist, so that
      the difference reveals nothing.</p>
      <a class="btn" href="/discover">Discover</a></section>`
  }), 404);
}

export function robots(res) {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('User-agent: *\nDisallow: /dashboard\nDisallow: /admin\nDisallow: /u/*/propose\nAllow: /\n');
}

export function sitemap(ctx, res) {
  const rows = ctx.db.prepare(
    'SELECT handle FROM users u JOIN profiles p ON p.user_id=u.id WHERE p.published=1 AND p.indexable=1').all();
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>${ORIGIN}/</loc></url><url><loc>${ORIGIN}/discover</loc></url>
${rows.map((r) => `<url><loc>${ORIGIN}/u/${esc(r.handle)}</loc></url>`).join('\n')}
</urlset>`;
  res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
  res.end(body);
}
