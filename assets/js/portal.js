/* ============================================================================
   LEGEND — Private Client Portal
   A preview build: no network, no storage, no authentication. Every action is
   local to the page so the experience can be reviewed end to end.
   ========================================================================== */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Six categories in the rail; everything else is a section beneath one of them.
  var TITLES = {
    verified:        'Legend Verified',
    academy:         'Legend Academy',
    find:            'Find a partner',
    occasions:              'Events & Companionship',
    'occasions-parties':    'Parties',
    'occasions-events':     'Events',
    'occasions-business':   'Business events',
    'occasions-travel':     'Travel companionship',
    'occasions-social':     'Social occasions',
    'find-long':     'Long-term relationship',
    'find-short':    'Short-term relationship',
    'find-casual':   'Casual dating',
    'find-companion':'Event & party companion',
    long:       'Long partner',
    short:      'Short partner',
    events:     'Party & event',
    management: 'Relationship management',
    me:         'Profile & Persona',
    settings:   'Settings',
    overview: 'Overview',
    proposed: 'Proposed for you',
    requests: 'Asked of you',
    introductions: 'Introductions',
    appointments: 'Appointments',
    messages: 'Correspondence',
    persona: 'Your persona',
    profile: 'Private profile',
    preferences: 'The brief',
    intentions: 'Intentions',
    reflections: 'Reflections & standing',
    insights: 'What we have learned',
    formation: 'Formation',
    counsel: 'Counsel',
    continuity: 'Continuity',
    parties: 'Private gatherings',
    assistant: 'Your assistant',
    mandate: 'Mandate & agreement',
    documents: 'Documents',
    consent: 'Consent ledger',
    credential: 'Your verification mark',
    data: 'What we hold',
    safety: 'Safety & conduct',
    account: 'Account & security'
  };

  /* --- Dates & greeting --------------------------------------------------- */
  var now = new Date();
  var today = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  var el = $('#today');
  if (el) el.textContent = today;

  // The greeting is the overview's title in the bar now, so it is held here and
  // route() decides where it goes. Salutation and name are kept apart because a
  // narrow bar has room for the name but not for both. The element lookup stays,
  // so any view that still shows it inline keeps working.
  var hour = now.getHours();
  var SALUTATION = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  var MEMBER = 'A. Marchand.';
  var GREETING = SALUTATION + ', ' + MEMBER;
  var greet = $('#greeting');
  if (greet) greet.textContent = GREETING;

  /* --- Lock screen -------------------------------------------------------- */
  var lock = $('#lock');
  var portal = $('#portal');
  var lockForm = $('#lock-form');

  function enter() {
    lock.hidden = true;
    portal.hidden = false;
    document.title = 'Overview — Legend Portal';
    route();
  }

  if (lockForm) {
    lockForm.addEventListener('submit', function (e) {
      e.preventDefault();   // nothing is validated, sent, or stored in this build
      enter();
    });
  }

  var out = $('#sign-out');
  if (out) {
    out.addEventListener('click', function (e) {
      e.preventDefault();
      portal.hidden = true;
      lock.hidden = false;
      document.title = 'Member Access — Legend';
      window.scrollTo(0, 0);
    });
  }

  // Which category a section belongs to, so the rail still shows where you are
  // once you have gone one level down.
  var PARENT = {
    'find-long': 'find', 'find-short': 'find',
    'find-casual': 'find',
    // Companionship moved under Events & Companionship; the page stays where it
    // is and this is what gives it the right way back up.
    'find-companion': 'occasions',
    'occasions-parties': 'occasions', 'occasions-events': 'occasions',
    'occasions-business': 'occasions', 'occasions-travel': 'occasions',
    'occasions-social': 'occasions',
    // These four were the working sections of the retired Long partner category;
    // Find a partner is what carries that ground now.
    proposed: 'find', requests: 'find', introductions: 'find', appointments: 'find',
    preferences: 'me', reflections: 'me', intentions: 'me', persona: 'me', profile: 'me',
    insights: 'management', formation: 'management', counsel: 'management', continuity: 'management',
    parties: 'events',
    consent: 'settings', data: 'settings', account: 'settings', safety: 'settings',
    mandate: 'settings', documents: 'settings',
    messages: null, assistant: null, overview: null
  };

  /* --- Routing ------------------------------------------------------------ */
  function route() {
    var name = (location.hash || '#overview').replace('#', '');
    if (!TITLES[name]) name = 'overview';

    $$('.view').forEach(function (v) {
      v.classList.toggle('is-active', v.id === 'view-' + name);
    });

    // A section highlights the category it sits under.
    var mark = TITLES[name] && PARENT[name] !== undefined ? (PARENT[name] || name) : name;
    $$('#rail-nav a').forEach(function (a) {
      var on = a.getAttribute('data-view') === mark;
      if (on) { a.setAttribute('aria-current', 'page'); } else { a.removeAttribute('aria-current'); }
    });

    // Give every section a way back up to its category, without editing 23 views.
    var view = $('#view-' + name);
    var parent = PARENT[name];
    if (view && parent && !$('.up', view)) {
      var up = document.createElement('a');
      up.className = 'up';
      up.href = '#' + parent;
      up.textContent = TITLES[parent];
      view.insertBefore(up, view.firstChild);
    }

    var title = $('#view-title');
    // On the overview the member is greeted; everywhere else the bar names the
    // view, which is what carries you back out of a section. The salutation is
    // its own span so a narrow bar can drop it and keep the name.
    if (title) {
      title.textContent = '';
      if (name === 'overview') {
        var sal = document.createElement('span');
        sal.className = 'title__salutation';
        sal.textContent = SALUTATION;
        title.appendChild(sal);               // the name lives once, top right
      } else {
        title.textContent = TITLES[name];
      }
    }

    // A category with children in the rail opens its list when it or one of them
    // is current, and folds away otherwise, so the rail stays the length of its
    // categories rather than the length of everything under them.
    $$('.rail__sub').forEach(function (sub) {
      var root = sub.getAttribute('data-branch');
      var cat = $('#rail-nav a[data-view="' + root + '"]');
      if (!cat) return;
      var open = mark === root;
      sub.hidden = !open;
      cat.setAttribute('aria-expanded', open ? 'true' : 'false');
      // One aria-current per page: it moves to the child only when the child is
      // itself in this list. A branch can also parent sections that are not
      // listed here — the working sections of a search, say — and those must
      // leave the mark on the category, or nothing in the rail is marked at all.
      var listed = $('a[data-view="' + name + '"]', sub);
      if (open && listed) { cat.removeAttribute('aria-current'); cat.classList.add('is-branch'); }
      else { cat.classList.remove('is-branch'); }
      $$('a', sub).forEach(function (a) {
        if (a.getAttribute('data-view') === name) { a.setAttribute('aria-current', 'page'); }
        else { a.removeAttribute('aria-current'); }
      });
    });

    // The nav can scroll on short screens — keep the current item in sight.
    var current = $('#rail-nav a[aria-current="page"]');
    if (current && current.scrollIntoView) {
      current.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
    }

    var view = $('#view-' + name);
    if (view && !portal.hidden) {
      document.title = TITLES[name] + ' — Legend Portal';
      view.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    }
  }
  window.addEventListener('hashchange', route);

  // In-page links that jump to another view
  $$('[data-go]').forEach(function (a) {
    a.addEventListener('click', function () { location.hash = '#' + a.getAttribute('data-go'); });
  });

  /* --- Introductions: master / detail ------------------------------------- */
  var rows = $$('.intro-row');
  rows.forEach(function (row) {
    row.addEventListener('click', function () {
      var id = row.getAttribute('data-case');
      rows.forEach(function (r) {
        if (r === row) { r.setAttribute('aria-current', 'true'); } else { r.removeAttribute('aria-current'); }
      });
      $$('[data-case-panel]').forEach(function (p) {
        p.hidden = p.getAttribute('data-case-panel') !== id;
      });
    });
  });

  /* --- The one decision in the portal ------------------------------------- */
  function decide(kind) {
    var actions = $('#case-actions-07');
    var decided = $('#case-decided-07');
    var stamp = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });

    if (actions) actions.hidden = true;
    if (decided) {
      decided.hidden = false;
      decided.innerHTML = kind === 'accept'
        ? '<strong style="color:#EDEAE3">Accepted on ' + stamp + '.</strong> C. Vasseur will approach the other party and write to you within a few days. Nothing about you is disclosed to them until they have accepted as well.'
        : '<strong style="color:#EDEAE3">Declined on ' + stamp + '.</strong> No approach will be made and nothing has been disclosed. You will not be asked to explain, and the search continues unchanged.';
    }

    // The row, the badge and the overview panel all follow the decision.
    var row = $('.intro-row[data-case="07"]');
    if (row) {
      var pill = $('.pill', row);
      pill.className = 'pill ' + (kind === 'accept' ? 'pill--live' : 'pill--rest');
      pill.textContent = kind === 'accept' ? 'Accepted' : 'Declined';
    }
    var head = $('[data-case-panel="07"] .case__head .pill');
    if (head) {
      head.className = 'pill ' + (kind === 'accept' ? 'pill--live' : 'pill--rest');
      head.textContent = kind === 'accept' ? 'Accepted — awaiting the other party' : 'Declined';
    }
    var count = $('#rail-nav .count');
    if (count) count.remove();

    var panel = $('.panel--accent');
    if (panel) {
      panel.classList.remove('panel--accent');
      var p = $('.panel__head .pill', panel);
      if (p) { p.className = 'pill pill--rest'; p.textContent = kind === 'accept' ? 'With your advisor' : 'Closed'; }
      var h2 = $('.panel__head h2', panel);
      if (h2) h2.textContent = kind === 'accept' ? 'Accepted — with your advisor' : 'Nothing awaiting you';
    }
  }

  var acc = $('#accept-07'), dec = $('#decline-07');
  if (acc) acc.addEventListener('click', function () { decide('accept'); });
  if (dec) dec.addEventListener('click', function () { decide('decline'); });

  /* --- Correspondence ----------------------------------------------------- */
  var composer = $('#composer');
  if (composer) {
    composer.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = $('#msg-input');
      var text = input.value.trim();
      if (!text) { input.focus(); return; }

      var wrap = document.createElement('div');
      wrap.className = 'msg msg--me';
      var who = document.createElement('p');
      who.className = 'who';
      who.textContent = 'You · ' + now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
      var bubble = document.createElement('div');
      bubble.className = 'bubble';
      bubble.textContent = text;          // textContent, never innerHTML, for anything typed
      wrap.appendChild(who); wrap.appendChild(bubble);

      $('#thread').appendChild(wrap);
      input.value = '';
      wrap.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
    });
  }

  /* --- Concierge ---------------------------------------------------------- */
  var conc = $('#concierge-form');
  if (conc) {
    conc.addEventListener('submit', function (e) {
      e.preventDefault();
      var type = $('#c-type').value;
      var when = $('#c-when').value.trim();
      var detail = $('#c-detail').value.trim();
      if (!detail && !when) { $('#c-detail').focus(); return; }

      var log = $('#concierge-log');
      var dt = document.createElement('dt');
      dt.textContent = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }) + ' · ' + type;
      var dd = document.createElement('dd');
      dd.textContent = (when ? when + '. ' : '') + detail;
      log.insertBefore(dd, log.firstChild);
      log.insertBefore(dt, log.firstChild);

      $('#c-when').value = ''; $('#c-detail').value = '';
      note(conc.querySelector('button[type="submit"]'), 'Received by the office. You will hear from us today; nothing is confirmed until we write back.');
    });
  }

  /* --- Persona: the conversation that builds the model -------------------- */
  // Scripted follow-ups. No model is connected in this build; the assistant's
  // side is pre-written so the shape of the exchange can be reviewed honestly.
  var PERSONA_REPLIES = [
    'Noted. And when it goes wrong between you and someone — do you want it resolved that evening, or do you need the night first?',
    'That is worth recording. Now something harder: name a thing you have compromised on before and regretted.',
    'Thank you. Last one for this session — what would someone who has known you fifteen years say you are difficult about?',
    'That is enough for today. I will put this to C. Vasseur and she will read it before anything is changed on your file.'
  ];
  var personaTurn = 0;
  var personaForm = $('#persona-form');

  function personaSay(cls, who, text) {
    var wrap = document.createElement('div');
    wrap.className = 'msg ' + cls;
    var w = document.createElement('p');
    w.className = 'who';
    w.textContent = who;
    var b = document.createElement('div');
    b.className = 'bubble';
    b.textContent = text;                 // never innerHTML for member input
    wrap.appendChild(w); wrap.appendChild(b);
    $('#persona-thread').appendChild(wrap);
    wrap.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
  }

  if (personaForm) {
    personaForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = $('#persona-input');
      var text = input.value.trim();
      if (!text) { input.focus(); return; }
      personaSay('msg--me', 'You', text);
      input.value = '';

      var reply = PERSONA_REPLIES[Math.min(personaTurn, PERSONA_REPLIES.length - 1)];
      personaTurn++;
      setTimeout(function () { personaSay('msg--ai', 'Legend · Assistant', reply); }, reduced ? 0 : 700);

      // Completeness advances as the conversation does, capped short of certainty.
      var pct = Math.min(72 + personaTurn * 4, 92);
      var bar = $('#persona-bar'), label = $('#persona-pct');
      if (bar) bar.style.width = pct + '%';
      if (label) label.innerHTML = pct + '<small style="font-size:.4em">%</small>';
    });
  }


  /* --- The rail as a dock -------------------------------------------------
     A vertical port of the client's framer-motion Dock. Same model: an item's
     target scale is interpolated from its distance to the pointer over
     [-distance, 0, distance] -> [1, magnification, 1], and the value is chased
     by a spring rather than a tween.

     framer's useSpring(mass, stiffness, damping) is a damped harmonic
     oscillator; integrated directly here so no library is needed:

        a = (-k(x - target) - c·v) / m
        v += a·dt ,  x += v·dt

     with the original's mass .1 / stiffness 150 / damping 12. Magnification is
     pulled back from 2× to 1.42× — a lift, not a bounce.

     Live only while the rail is collapsed on desktop: expanded, the rows carry
     text and nothing should move under the reader.
     -------------------------------------------------------------------- */
  (function dock() {
    var nav = $('#rail-nav');
    var shell = $('.portal');
    if (!nav || !shell || reduced) return;

    var MASS = 0.1, STIFF = 150, DAMP = 12;

    // The oscillator is solved in closed form rather than integrated. At these
    // parameters the fast mode has a time constant of about 8ms — shorter than
    // a frame — and stepping it with forward Euler diverges outright. The exact
    // solution is also frame-rate independent, so a 144Hz screen and a stuttering
    // one settle identically.
    var W0 = Math.sqrt(STIFF / MASS);                        // natural frequency
    var ZETA = DAMP / (2 * Math.sqrt(STIFF * MASS));         // damping ratio

    function advance(item, dt) {
      var x0 = item.x - item.target, v0 = item.v;
      var a = ZETA * W0, e = Math.exp(-a * dt), x, v;
      if (ZETA < 1) {                                        // underdamped
        var wd = W0 * Math.sqrt(1 - ZETA * ZETA);
        var c2 = (v0 + a * x0) / wd;
        var cos = Math.cos(wd * dt), sin = Math.sin(wd * dt);
        x = e * (x0 * cos + c2 * sin);
        v = e * ((c2 * wd - a * x0) * cos - (x0 * wd + a * c2) * sin);
      } else {                                               // over / critical
        var wo = W0 * Math.sqrt(Math.max(ZETA * ZETA - 1, 1e-9));
        var c2o = (v0 + a * x0) / wo;
        var ch = Math.cosh(wo * dt), sh = Math.sinh(wo * dt);
        x = e * (x0 * ch + c2o * sh);
        v = e * ((c2o * wo - a * x0) * ch + (x0 * wo - a * c2o) * sh);
      }
      item.x = item.target + x;
      item.v = v;
    }
    var MAG = 1.42;          // the original's 2x is a launcher; this is a rail
    var DISTANCE = 132;      // px of travel over which a neighbour responds

    var items = $$('a.cat', nav).map(function (el) {
      return { el: el, icon: $('.nav-ic', el), x: 1, v: 0, target: 1 };
    });
    if (!items.length || !items[0].icon) return;

    var pointer = null, frame = null, last = 0;

    function live() {
      return shell.getAttribute('data-rail') === 'collapsed' &&
             window.matchMedia('(min-width: 901px)').matches;
    }

    function retarget() {
      items.forEach(function (item) {
        if (pointer === null || !live()) { item.target = 1; return; }
        var box = item.el.getBoundingClientRect();
        var d = Math.abs(pointer - (box.top + box.height / 2));
        // linear interpolation over the falloff, clamped at the far end
        item.target = d >= DISTANCE ? 1 : 1 + (MAG - 1) * (1 - d / DISTANCE);
      });
    }

    function step(now) {
      var dt = Math.min((now - last) / 1000, 1 / 30);   // clamp a tab that slept
      last = now;
      var moving = false;

      items.forEach(function (item) {
        advance(item, dt);
        if (Math.abs(item.x - item.target) > 0.0006 || Math.abs(item.v) > 0.0006) moving = true;
        else { item.x = item.target; item.v = 0; }
        item.icon.style.setProperty('--dock', item.x.toFixed(4));
      });

      frame = moving ? requestAnimationFrame(step) : null;
    }

    function run() {
      retarget();
      if (frame === null) { last = performance.now(); frame = requestAnimationFrame(step); }
    }

    // DockLabel. One element on <body>, placed against whichever row is under
    // the pointer: the collapsed nav scrolls, and a scrolling box clips a child
    // that tries to sit outside it.
    var tip = document.createElement('div');
    tip.className = 'rail__tip';
    tip.setAttribute('role', 'presentation');
    document.body.appendChild(tip);

    function label(el) {
      if (!el || !live()) { tip.classList.remove('is-on'); return; }
      var box = el.getBoundingClientRect();
      tip.textContent = el.getAttribute('data-label') || '';
      tip.style.left = Math.round(box.right + 10) + 'px';
      tip.style.top = Math.round(box.top + box.height / 2) + 'px';
      tip.classList.add('is-on');
    }

    nav.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch' || !live()) return;
      pointer = e.clientY;
      label(e.target.closest ? e.target.closest('a.cat') : null);
      run();
    });
    nav.addEventListener('pointerleave', function () {
      pointer = null;
      tip.classList.remove('is-on');
      run();
    });
    // A scroll moves the row out from under a label that is already showing.
    nav.addEventListener('scroll', function () { tip.classList.remove('is-on'); });

    // Collapsing or expanding the rail settles every icon back to rest.
    new MutationObserver(function () {
      pointer = null;
      tip.classList.remove('is-on');
      run();
    }).observe(shell, { attributes: true, attributeFilter: ['data-rail'] });

    // Keyboard users get the same lift, and the same label.
    items.forEach(function (item) {
      item.el.addEventListener('focus', function () {
        if (!live()) return;
        var box = item.el.getBoundingClientRect();
        pointer = box.top + box.height / 2;
        label(item.el);
        run();
      });
      item.el.addEventListener('blur', function () {
        pointer = null;
        tip.classList.remove('is-on');
        run();
      });
    });
  })();

  /* --- Ask the house: the assistant on the Overview ------------------------
     Distinct from the persona. The persona is the model of the member and
     speaks to other members; this answers to the member and speaks to nobody.

     No language model is connected in this build. Replies are matched against
     a fixed rule set drawn from the same figures the dashboard already shows,
     so the shape of the exchange — including what it refuses — can be reviewed
     honestly. The panel says so in plain sight rather than implying otherwise.
     When a model is connected, replace pick() and keep everything else: the
     refusal on withheld identity is a rule of the house, not of the model, and
     belongs on the server side of it.
     -------------------------------------------------------------------- */
  var ASK_RULES = [
    { k: ['waiting', 'outstanding', 'need', 'todo', 'to do', 'action', 'answer', 'pending', 'anything from me'],
      r: 'Two things. Introduction No. 07 is written and waiting on your acceptance, and your ' +
         'advisor is still owed your account of the meeting on the 28th. Nothing else this week ' +
         'needs you at all.',
      a: ['Read the case', 'introductions'] },

    { k: ['appointment', 'appointments', 'meeting', 'dinner', 'calendar', 'diary', 'when am i', 'schedule', 'next'],
      r: 'Friday 28 August, 20:00, in Marylebone. Dinner following Introduction No. 06, and the ' +
         'table is held in our name rather than yours. It can be moved without you giving a ' +
         'reason — tell me and I will put it to your advisor tonight.',
      a: ['All appointments', 'appointments'] },

    { k: ['who is', 'their name', 'her name', 'his name', 'photograph', 'photo', 'picture', 'identity',
          'no. 07', 'no 07', 'number 07', 'what do they do', 'where do they work', 'surname', 'show me'],
      r: 'I cannot tell you. Their name, profession and photograph stay withheld until you accept ' +
         'the case — and they have not been told who you are either. That is the same protection ' +
         'running in your direction. What I can give you is the whole of the written case: ' +
         'circumstances, the reasoning, and what your advisor made of them across two meetings.',
      a: ['Read the case', 'introductions'] },

    { k: ['proposed', 'candidate', 'candidates', 'matches', 'match', 'suggested', 'options', 'shortlist'],
      r: 'Two are proposed for you and neither has been approached; nobody has been told you ' +
         'exist. Twenty-one were assessed this year and seventeen did not reach you. That ' +
         'seventeen is the part of the mandate you are actually paying for.',
      a: ['Open proposed', 'proposed'] },

    { k: ['reflection', 'reflections', 'feedback', 'how did it go', 'after the meeting', 'write up', 'account of'],
      r: 'One is outstanding — your account of the 28th. It is the single most useful thing a ' +
         'member does, because it changes what your advisor searches for next rather than sitting ' +
         'in a file. Five minutes, in your own words, however blunt.',
      a: ['Record it', 'reflections'] },

    { k: ['standing', 'my score', 'out of five', 'out of 5', 'rating', 'rated', '4.6', 'how am i seen'],
      r: 'Four point six of five, from the two people you have met. It is never shown to anyone ' +
         'you are introduced to and never attributed — you cannot see who gave what, and neither ' +
         'can they. It exists so conduct has a consequence, not so anyone is ranked.',
      a: ['Open standing', 'reflections'] },

    { k: ['persona', 'model of me', 'my profile ai', 'screening', 'speaks first', 'first stage'],
      r: 'Seventy-two per cent built, over four sessions; around six is where it stops changing ' +
         'much. It is a different thing from me — the persona is the model of you and, with your ' +
         'permission, holds a first exchange with another member’s persona. I only answer to ' +
         'you. Neither of us has ever decided anything.',
      a: ['Open persona', 'persona'] },

    { k: ['fee', 'fees', 'cost', 'price', 'pay', 'payment', 'invoice', 'mandate', 'contract', 'agreement', 'terms', 'tier'],
      r: 'Signature tier, commenced 14 March, no fixed term. The full schedule and the ' +
         'countersigned agreement are on your mandate — I will not quote you a figure from memory ' +
         'when the paper itself is one click away.',
      a: ['Mandate & agreement', 'mandate'] },

    { k: ['party', 'parties', 'event', 'events', 'gathering', 'salon', 'season', 'guest list'],
      r: 'Three this season — London in September, Geneva in October, Paris in November. You have ' +
         'one confirmed. Attending is never a condition of anything, and a decline is not recorded ' +
         'against you anywhere.',
      a: ['This season', 'parties'] },

    { k: ['advisor', 'vasseur', 'a person', 'human', 'speak to someone', 'call', 'talk to', 'message her', 'write to'],
      r: 'C. Vasseur, in London. She wrote to you two days ago and deliberately did not ask you ' +
         'for an answer. I can leave a note at the top of her morning with the wording you have ' +
         'used here.',
      a: ['Open correspondence', 'messages'] },

    { k: ['consent', 'privacy', 'my data', 'what do you hold', 'who knows', 'discretion', 'delete', 'erase', 'ledger'],
      r: 'Fourteen entries in your consent ledger, including every time you said no. Each one ' +
         'records what we proposed to disclose, in the exact wording we would have used, and what ' +
         'you answered. What we hold beyond that, and how to have it destroyed, sits under ' +
         'Settings.',
      a: ['Consent ledger', 'consent'] },

    { k: ['brief', 'looking for', 'criteria', 'preferences', 'search for', 'what are you searching', 'requirements'],
      r: 'Revised four times since March, last on 11 June. Every revision has the reasoning ' +
         'recorded beside it, so you can see what changed your mind as well as what changed on ' +
         'the page.',
      a: ['The brief', 'preferences'] },

    { k: ['short partner', 'short term', 'companionship', 'intention', 'intentions'],
      r: 'Your stated intention is what everything is matched against, and you are only ever put ' +
         'to members who have stated the same one. There is no list to browse and nobody is shown ' +
         'to you as a choice — the horizon changes what two people are agreeing to, not how they ' +
         'are found.',
      a: ['Your intentions', 'intentions'] },

    { k: ['thank', 'thanks', 'hello', 'hi ', 'good morning', 'good evening', 'salam'],
      r: 'At your service. Ask me anything on your file — or tell me to put something to your ' +
         'advisor and I will draft it for you to send.' }
  ];

  var ASK_FALLBACK = {
    r: 'I do not know that, and I would rather say so than construct something plausible. I have ' +
       'put the question to C. Vasseur in the words you used; she reads everything before anyone ' +
       'else does and will come back to you directly.',
    a: ['Open correspondence', 'messages']
  };

  function askPick(text) {
    var q = ' ' + text.toLowerCase().replace(/[^\w\s.]/g, ' ').replace(/\s+/g, ' ') + ' ';
    var best = null, bestScore = 0;
    ASK_RULES.forEach(function (rule) {
      var score = 0;
      rule.k.forEach(function (word) { if (q.indexOf(word) > -1) score += word.length; });
      if (score > bestScore) { bestScore = score; best = rule; }
    });
    return best || ASK_FALLBACK;
  }

  var askThread = $('#ask-thread');
  var askForm = $('#ask-form');

  function askSay(cls, who, text, action) {
    var wrap = document.createElement('div');
    wrap.className = 'msg ' + cls;
    var w = document.createElement('p');
    w.className = 'who';
    w.textContent = who;
    var b = document.createElement('div');
    b.className = 'bubble';
    b.textContent = text;                    // never innerHTML for member input
    if (action) {
      var go = document.createElement('button');
      go.type = 'button';
      go.className = 'act';
      go.textContent = action[0];
      go.addEventListener('click', function () { location.hash = '#' + action[1]; });
      b.appendChild(go);
    }
    wrap.appendChild(w); wrap.appendChild(b);
    askThread.appendChild(wrap);
    askThread.scrollTop = askThread.scrollHeight;
    return wrap;
  }

  function askWait() {
    var wrap = document.createElement('div');
    wrap.className = 'msg msg--ai';
    wrap.innerHTML = '<p class="who">Legend &middot; Assistant</p>' +
      '<div class="bubble"><span class="ask__wait" aria-label="Composing"><i></i><i></i><i></i></span></div>';
    askThread.appendChild(wrap);
    askThread.scrollTop = askThread.scrollHeight;
    return wrap;
  }

  function askSend(text) {
    if (!text) return;
    askSay('msg--me', 'You', text);
    var rule = askPick(text);
    if (reduced) { askSay('msg--ai', 'Legend · Assistant', rule.r, rule.a); return; }
    var beat = askWait();
    setTimeout(function () {
      beat.remove();
      askSay('msg--ai', 'Legend · Assistant', rule.r, rule.a);
    }, 620);
  }

  if (askForm && askThread) {
    askForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = $('#ask-input');
      var text = input.value.trim();
      if (!text) { input.focus(); return; }
      input.value = '';
      askSend(text);
    });

    // Enter sends; shift+enter keeps the paragraph going.
    $('#ask-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        askForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      }
    });

    // Openings retire as they are used, so the row does not become wallpaper.
    $$('#ask-chips button').forEach(function (chip) {
      chip.addEventListener('click', function () {
        askSend(chip.getAttribute('data-ask'));
        chip.remove();
      });
    });
  }

  /* --- Profile: the member fills in their own portrait -------------------- */
  var profileForm = $('#profile-form');
  if (profileForm) {
    var fields = $$('input, textarea, select', profileForm);

    function completeness() {
      var filled = fields.filter(function (f) { return String(f.value).trim() !== ''; }).length;
      return Math.round(filled / fields.length * 100);
    }

    function stillOpen() {
      return fields
        .filter(function (f) { return String(f.value).trim() === ''; })
        .map(function (f) {
          var label = profileForm.querySelector('label[for="' + f.id + '"]');
          return label ? label.textContent.trim().toLowerCase() : f.id;
        });
    }

    function paintProfile() {
      var pct = completeness();
      var bar = $('#profile-bar'), label = $('#profile-pct'), missing = $('#profile-missing');
      if (bar) bar.style.width = pct + '%';
      if (label) label.innerHTML = pct + '<small style="font-size:.4em">%</small>';
      if (missing) {
        var open = stillOpen();
        missing.textContent = open.length
          ? 'Still open: ' + open.join(', ') + '.'
          : 'Complete. Your advisor has everything she asked for — the rest comes from conversation.';
      }
    }

    profileForm.addEventListener('input', paintProfile);
    profileForm.addEventListener('change', paintProfile);
    paintProfile();

    $$('[data-save]', profileForm).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var panel = btn.closest('[data-section]');
        var name = $('.panel__head h2', panel).textContent;
        // Sections that steer the search are held for the advisor; facts are not.
        var steers = $('.pill--action', panel) !== null;

        var log = $('#profile-log');
        if (log) {
          var dt = document.createElement('dt');
          dt.textContent = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }) + ' · ' + name;
          var dd = document.createElement('dd');
          dd.textContent = steers
            ? 'Saved to your file and flagged for C. Vasseur. The search is unchanged until you have spoken.'
            : 'Saved to your file. No discussion needed.';
          log.insertBefore(dd, log.firstChild);
          log.insertBefore(dt, log.firstChild);
        }

        note(btn, steers
          ? 'Saved. Because this section steers the search, C. Vasseur will raise it with you before anything changes — she will not adjust the brief silently.'
          : 'Saved to your file. Your advisor can see what changed and when.');
        paintProfile();
      });
    });
  }

  /* --- Proposals ---------------------------------------------------------- */
  $$('[data-propose]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var card = btn.closest('.proposal');
      var yes = btn.getAttribute('data-propose') === 'yes';
      var pill = $('.pill', card);
      pill.className = 'pill ' + (yes ? 'pill--live' : 'pill--rest');
      pill.textContent = yes ? 'Case being written' : 'Declined';
      var acts = $('.proposal__acts', card);
      var msg = document.createElement('p');
      msg.className = 'note-inline';
      msg.style.marginTop = '0';
      msg.textContent = yes
        ? 'C. Vasseur will write the full case and put it to you within a few days. Nothing has been disclosed to the other party.'
        : 'Closed. No approach was made and nothing was disclosed. You will not be asked why.';
      acts.replaceWith(msg);
      // The rail badge tracks what is genuinely still waiting.
      var left = $$('.proposal .pill--action').length;
      var badge = $('#rail-nav a[data-view="proposed"] .count');
      if (badge) { if (left) { badge.textContent = left; } else { badge.remove(); } }
    });
  });

  /* --- Reflections -------------------------------------------------------- */
  var refForm = $('#reflection-form');
  if (refForm) {
    refForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var which = $('#ref-who').value;
      var text = $('#ref-text').value.trim();
      var score = refForm.querySelector('input[name="score"]:checked');
      var again = refForm.querySelector('input[name="again"]:checked');
      if (!text && !score) { $('#ref-text').focus(); return; }

      var log = $('#reflection-log');
      var dt = document.createElement('dt');
      dt.textContent = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }) + ' · ' + which.split(' — ')[0];
      var dd = document.createElement('dd');
      dd.textContent = (again ? ({ yes: 'Would meet again. ', unsure: 'Undecided. ', no: 'Would not meet again. ' })[again.value] : '')
        + (text ? '“' + text + '”' : '')
        + (score ? ' · ' + score.value + ' / 5' : '');
      log.insertBefore(dd, log.firstChild);
      log.insertBefore(dt, log.firstChild);

      $('#ref-text').value = '';
      if (score) score.checked = false;
      if (again) again.checked = false;
      note(refForm.querySelector('button[type="submit"]'),
        'Sent to C. Vasseur, and to no one else. The other party sees nothing of this — not the words, not the figure, not that you wrote it.');
    });
  }

  /* --- Gatherings --------------------------------------------------------- */
  $$('[data-rsvp]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var name = btn.getAttribute('data-rsvp');
      var log = $('#rsvp-log');
      if (log) {
        var dt = document.createElement('dt');
        dt.textContent = 'Requested — ' + now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
        var dd = document.createElement('dd');
        dd.textContent = name + '. With the office; you will hear before the end of the week.';
        log.insertBefore(dd, log.firstChild);
        log.insertBefore(dt, log.firstChild);
      }
      btn.textContent = 'Requested';
      btn.disabled = true;
      btn.style.opacity = '.5';
      note(btn, 'Requested. Places are allocated by the house rather than in order of asking, and your advisor will confirm.');
    });
  });

  /* --- Verification mark -------------------------------------------------- */
  // Codes use an unambiguous alphabet: no O, I or U, so nothing is misread as
  // 0, 1 or V. Non-sequential by design — a code must never hint at another.
  var ALPHABET = '0123456789ABCDEFGHJKLMNPQRSTVWXYZ';

  function issueCode() {
    var out = '', bytes;
    if (window.crypto && window.crypto.getRandomValues) {
      bytes = new Uint8Array(12);
      window.crypto.getRandomValues(bytes);
    }
    for (var i = 0; i < 12; i++) {
      var n = bytes ? bytes[i] : Math.floor(Math.random() * 256);
      out += ALPHABET[n % ALPHABET.length];
      if (i % 4 === 3 && i < 11) out += '-';
    }
    return out;
  }

  var issue = $('#issue-code');
  if (issue) {
    issue.addEventListener('click', function () {
      var where = $('#pl-where');
      var label = where.value.trim();
      if (!label) { where.focus(); return; }

      var code = issueCode();
      var row = document.createElement('div');
      row.className = 'placement';

      var left = document.createElement('div');
      var w = document.createElement('p');
      w.className = 'where';
      w.textContent = label;                       // never innerHTML for typed text
      var meta = document.createElement('p');
      meta.className = 'meta';
      var codeEl = document.createElement('span');
      codeEl.className = 'code code--sm';
      codeEl.textContent = code;
      meta.appendChild(codeEl);
      meta.appendChild(document.createTextNode(
        ' · placed ' + now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }) + ' · not yet checked'
      ));
      left.appendChild(w); left.appendChild(meta);

      var pill = document.createElement('span');
      pill.className = 'pill pill--live';
      pill.textContent = 'Active';

      var kill = document.createElement('button');
      kill.className = 'btn btn--quiet';
      kill.type = 'button';
      kill.textContent = 'Withdraw';
      kill.setAttribute('data-revoke', code);
      wireRevoke(kill);

      row.appendChild(left); row.appendChild(pill); row.appendChild(kill);
      $('#placements').appendChild(row);

      where.value = '';
      note(issue, 'Issued. Place the code wherever you like — in a bio, a signature, or beneath the seal. Anyone can check it at legendpartner.com/verify, and only you can withdraw it.');
    });
  }

  function wireRevoke(btn) {
    btn.addEventListener('click', function () {
      var row = btn.closest('.placement');
      row.classList.add('placement--void');
      var pill = $('.pill', row);
      pill.className = 'pill pill--rest';
      pill.textContent = 'Withdrawn';
      var meta = $('.meta', row);
      meta.appendChild(document.createTextNode(' · withdrawn by you, today'));
      btn.replaceWith(document.createTextNode('—'));
      note(row, 'Withdrawn, and it takes effect at once. Anyone checking that code from now on is told the mark was withdrawn — not that it never existed.');
    });
  }
  $$('[data-revoke]').forEach(wireRevoke);

  // Turning off what the mark reveals is worth an explanation, not a silent save.
  $$('[data-reveals]').forEach(function (input) {
    input.addEventListener('change', function () {
      var what = input.getAttribute('data-reveals');
      var row = input.closest('.toggle-row');
      if (what === 'membership' && input.checked) {
        note(row, 'This discloses that you are a member of this house — which tells a stranger you are looking. We would counsel against it, but it is your decision and you can reverse it at any moment.');
      } else {
        note(row, input.checked
          ? 'Now shown to anyone who checks one of your codes.'
          : 'No longer shown. The date of verification is always shown; everything else is yours.');
      }
    });
  });

  /* --- Collapsing the rail ------------------------------------------------ */
  // A category that is waiting on the member has to say so even when the rail
  // is a 62px strip, so the count is mirrored onto the link as a class.
  $$('#rail-nav a.cat').forEach(function (a) {
    if ($('.count', a)) a.classList.add('has-count');
  });

  var railToggle = $('#rail-toggle');
  if (railToggle) {
    var setRail = function (collapsed) {
      portal.setAttribute('data-rail', collapsed ? 'collapsed' : 'open');
      railToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      railToggle.setAttribute('title', collapsed ? 'Expand the rail' : 'Collapse the rail');
      try { localStorage.setItem('legend.rail', collapsed ? 'collapsed' : 'open'); } catch (e) {}
      // Card widths change with the column, and the decks measure off them.
      window.dispatchEvent(new Event('resize'));
    };
    railToggle.addEventListener('click', function () {
      setRail(portal.getAttribute('data-rail') !== 'collapsed');
    });
    var remembered = null;
    try { remembered = localStorage.getItem('legend.rail'); } catch (e) {}
    setRail(remembered === 'collapsed');
  }

  /* --- Palette switch (preview only) -------------------------------------- */
  // The dashboard architecture is palette-agnostic: the same markup renders in
  // Legend's own colours or in the reference palette, by swapping tokens.
  $$('[data-palette-set]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var set = btn.getAttribute('data-palette-set');
      if (set === 'reference') { document.documentElement.setAttribute('data-palette', 'reference'); }
      else { document.documentElement.removeAttribute('data-palette'); }
      $$('[data-palette-set]').forEach(function (b) {
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
    });
  });

  /* --- Consent requests: the counterpart's side --------------------------- */
  $$('[data-consent]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var card = btn.closest('.request');
      var yes = btn.getAttribute('data-consent') === 'yes';
      var pill = $('.pill', card);
      pill.className = 'pill ' + (yes ? 'pill--live' : 'pill--rest');
      pill.textContent = yes ? 'You agreed' : 'You declined';

      var msg = document.createElement('p');
      msg.className = 'note-inline';
      msg.style.marginTop = '0';
      msg.textContent = yes
        ? 'Agreed, and written to your consent ledger with today’s date. Only what is listed above will be said, and you will be asked again before anything further.'
        : 'Declined. Nothing was disclosed, the other advisor is told only that the answer was no, and no reason is given. Written to your ledger.';
      $('.request__acts', card).replaceWith(msg);

      // The ledger is the record; a decision here writes to it.
      var ledger = $('#ledger');
      if (ledger) {
        var row = document.createElement('div');
        row.className = 'ledger__row' + (yes ? '' : ' ledger__row--withheld');
        var when = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        [['ledger__when', when],
         ['ledger__what', card.getAttribute('data-request') === 'b' ? 'Your first name and city' : 'Your outline — age band, city, profession in general terms'],
         ['ledger__to', yes ? 'Disclosure authorised by you' : 'Requested and refused — nothing was said'],
         ['ledger__by', yes ? 'You agreed · today' : 'You declined']
        ].forEach(function (pair) {
          var s = document.createElement('span');
          s.className = pair[0];
          s.textContent = pair[1];
          row.appendChild(s);
        });
        ledger.insertBefore(row, ledger.firstChild);
      }

      var left = $$('.request .pill--action').length;
      var badge = $('#rail-nav a[data-view="requests"] .count');
      if (badge) { if (left) { badge.textContent = left; } else { badge.remove(); } }
    });
  });

  /* --- Standing permissions ----------------------------------------------- */
  $$('[data-perm]').forEach(function (input) {
    input.addEventListener('change', function () {
      var row = input.closest('.toggle-row');
      note(row, input.checked
        ? 'Permission restored. It applies from now on and does not reach back over anything already declined.'
        : 'Permission withdrawn. Nothing further will be asked of you under it, and any request in progress has stopped.');
    });
  });

  // A switch may carry its own note for the moment it is turned on.
  $$('input[data-note-on]').forEach(function (input) {
    input.addEventListener('change', function () {
      if (input.checked) { note(input.closest('.toggle-row'), input.getAttribute('data-note-on')); }
    });
  });

  /* --- Reporting misconduct ----------------------------------------------- */
  var reportForm = $('#report-form');
  if (reportForm) {
    reportForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var what = $('#rep-what').value.trim();
      if (!what) { $('#rep-what').focus(); return; }
      $('#rep-what').value = '';
      note(reportForm.querySelector('button[type="submit"]'),
        'Sent to a principal of the house, not to your advisor alone. You will hear today. Nothing you have written here touches your reflections, your standing, or the search.');
    });
  }

  /* --- Day-one view: the empty states a new member actually sees ---------- */
  var emptyToggle = $('#empty-toggle');
  if (emptyToggle) {
    var EMPTIES = {
      'view-proposed':      ['Nothing proposed yet', 'Your advisor is assessing candidates. She will not bring you anyone until she can argue the case — that usually takes some weeks, and the first is rarely the fastest.', 'Next: your consultation on the 14th'],
      'view-requests':      ['Nothing asked of you', 'When another advisor believes you may suit their member, the request appears here first. Nothing about you moves before you answer it.', 'Nothing required of you'],
      'view-introductions': ['No introductions yet', 'Each one will arrive here as a written case with the reasoning behind it, and what remains withheld. You decide; nothing is arranged before you do.', 'Assessment comes first'],
      'view-appointments':  ['Nothing in the diary', 'Your consultation will be arranged around your calendar once your advisor has read your application.', 'Next: your first consultation'],
      'view-reflections':   ['Nothing to reflect on yet', 'After each meeting you write privately to your advisor. It is the single most useful thing a member does, and it begins after your first introduction.', 'Your standing begins at your first meeting'],
      'view-parties':       ['No gatherings open to you yet', 'Members are invited by their advisor once an engagement is established. The next dinner is in September.', 'Your advisor will raise it'],
      'view-consent':       ['Nothing disclosed, ever', 'Your ledger is empty because nothing about you has been shared with anyone. Every future disclosure will be written here as it happens.', 'This page will fill slowly, by design'],
      'view-counsel':       ['Available whenever you ask', 'Counsel begins when you ask for it, and it can be asked for at any point — including years after we last spoke. We will not suggest you need it.', 'Nothing required of you'],
      'view-formation':     ['Not yet applicable', 'Formation opens when a relationship establishes and both people agree to it.', 'Retained under your mandate'],
      'view-persona':       ['Your persona is not built yet', 'It comes from conversation rather than a form. Your first session usually runs to twenty minutes, and you can stop whenever you like.', 'Begin whenever suits you'],
      'view-credential':    ['You do not hold a mark yet', 'A mark is issued only after an advisor has seen your documents in person — never remotely and never from a scan. Ask for one at your consultation, or request it here and your advisor will arrange the appointment.', 'Requested at the consultation, issued the same day']
    };
    var emptyOn = false;
    var stash = {};

    emptyToggle.addEventListener('click', function () {
      emptyOn = !emptyOn;
      emptyToggle.textContent = emptyOn ? 'Back to the established member' : 'See it as a new member';

      Object.keys(EMPTIES).forEach(function (id) {
        var view = document.getElementById(id);
        if (!view) return;
        if (emptyOn) {
          stash[id] = view.innerHTML;
          var e = EMPTIES[id];
          view.innerHTML =
            '<p class="lede">' + (TITLES[id.replace('view-', '')] || '') + '</p>' +
            '<div class="empty" style="margin-top:2.6rem">' +
              '<div class="mk" aria-hidden="true"></div>' +
              '<h3>' + e[0] + '</h3><p>' + e[1] + '</p>' +
              '<p class="next">' + e[2] + '</p>' +
            '</div>';
        } else if (stash[id]) {
          view.innerHTML = stash[id];
        }
      });

      // Waiting badges belong to an established engagement, not to day one.
      $$('#rail-nav .count').forEach(function (c) { c.style.display = emptyOn ? 'none' : ''; });
      if (!emptyOn) { location.reload(); }
    });
  }

  /* --- Small disclosures -------------------------------------------------- */
  function note(trigger, text) {
    var anchor = trigger.closest('.appt, .doc') || trigger;
    var existing = anchor.nextElementSibling;
    if (existing && existing.classList.contains('note-inline')) { existing.remove(); return; }
    $$('.note-inline.is-transient').forEach(function (n) { n.remove(); });
    var div = document.createElement('div');
    div.className = 'note-inline is-transient';
    div.setAttribute('role', 'status');
    div.textContent = text;
    anchor.parentNode.insertBefore(div, anchor.nextSibling);
  }

  $$('[data-note]').forEach(function (b) {
    b.addEventListener('click', function () { note(b, b.getAttribute('data-note')); });
  });

  $$('[data-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var box = document.getElementById(b.getAttribute('data-toggle'));
      if (!box) return;
      box.hidden = !box.hidden;
      if (!box.hidden) { var f = $('textarea, input', box); if (f) f.focus(); }
    });
  });

  /* --- Live tiles ---------------------------------------------------------
     Three behaviours on one row:
       · the figures count up once, when the row first arrives;
       · each tile turns to a second face carrying the sentence behind the
         figure, staggered so the row is never all in motion at once;
       · the member can reorder the row by drag or keyboard, and the order is
         remembered on the device.
     Nothing here decides anything — it is presentation of what is already on
     the file, and all of it is off under prefers-reduced-motion.            */
  var tilesRow = $('#tiles');
  if (tilesRow) (function () {
    var TILE_KEY = 'legend.tiles';
    var tiles = function () { return $$('.tile', tilesRow); };

    function stamp() {
      tiles().forEach(function (t, i) { t.style.setProperty('--i', i); });
    }

    /* -- remembered order ------------------------------------------------- */
    function save() {
      var order = tiles().map(function (t) { return t.getAttribute('data-tile'); });
      try { localStorage.setItem(TILE_KEY, order.join(',')); } catch (e) {}
      if (resetBtn) resetBtn.hidden = false;
    }

    var DEFAULT_ORDER = tiles().map(function (t) { return t.getAttribute('data-tile'); });
    var resetBtn = $('#tiles-reset');

    function restore() {
      var raw = null;
      try { raw = localStorage.getItem(TILE_KEY); } catch (e) {}
      if (!raw) return;
      var order = raw.split(',');
      // Only honour a remembered order that still names exactly these tiles;
      // a stale list from an older build is discarded rather than half-applied.
      var same = order.length === DEFAULT_ORDER.length &&
        order.every(function (n) { return DEFAULT_ORDER.indexOf(n) > -1; });
      if (!same) { try { localStorage.removeItem(TILE_KEY); } catch (e) {} return; }
      order.forEach(function (name) {
        var t = $('.tile[data-tile="' + name + '"]', tilesRow);
        if (t) tilesRow.appendChild(t);
      });
      if (resetBtn) resetBtn.hidden = false;
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        DEFAULT_ORDER.forEach(function (name) {
          var t = $('.tile[data-tile="' + name + '"]', tilesRow);
          if (t) tilesRow.appendChild(t);
        });
        try { localStorage.removeItem(TILE_KEY); } catch (e) {}
        resetBtn.hidden = true;
        stamp();
        announce('The tiles are back in their original order.');
      });
    }

    /* -- a live region, so reordering is audible as well as visible -------- */
    var say = document.createElement('p');
    say.className = 'sr-only';
    say.setAttribute('role', 'status');
    say.setAttribute('aria-live', 'polite');
    tilesRow.parentNode.insertBefore(say, tilesRow.nextSibling);
    function announce(text) { say.textContent = text; }

    function label(t) {
      // The front label is broken over two lines, and a <br> yields no space in
      // textContent; the back face carries the same words unbroken.
      var l = $('.tile__face--b .tile__l', t) || $('.tile__l', t);
      return l ? l.textContent.replace(/\s+/g, ' ').trim() : 'Tile';
    }

    /* -- drag to reorder --------------------------------------------------- */
    var dragged = null, dragging = false;

    tiles().forEach(function (t) {
      t.addEventListener('dragstart', function (e) {
        dragged = t; dragging = true;
        t.classList.add('is-dragging');
        try {
          e.dataTransfer.effectAllowed = 'move';
          // Firefox will not start a drag without payload.
          e.dataTransfer.setData('text/plain', t.getAttribute('data-tile'));
        } catch (err) {}
      });
      t.addEventListener('dragend', function () {
        t.classList.remove('is-dragging');
        tiles().forEach(function (o) { o.classList.remove('is-over'); });
        dragged = null;
        stamp();
        // The click that ends a drag must not also navigate.
        setTimeout(function () { dragging = false; }, 60);
      });
      t.addEventListener('dragenter', function () {
        if (dragged && dragged !== t) t.classList.add('is-over');
      });
      t.addEventListener('dragleave', function () { t.classList.remove('is-over'); });
      t.addEventListener('dragover', function (e) { e.preventDefault(); });
      t.addEventListener('drop', function (e) {
        e.preventDefault();
        t.classList.remove('is-over');
        if (!dragged || dragged === t) return;
        var list = tiles();
        var from = list.indexOf(dragged), to = list.indexOf(t);
        tilesRow.insertBefore(dragged, from < to ? t.nextSibling : t);
        settle(dragged);
        save(); stamp();
        announce(label(dragged) + ' moved to position ' + (tiles().indexOf(dragged) + 1) + ' of ' + list.length + '.');
      });

      // A drag ends in a click on the anchor; swallow that one.
      t.addEventListener('click', function (e) {
        if (dragging) { e.preventDefault(); e.stopImmediatePropagation(); }
      }, true);

      /* -- keyboard reordering: Alt + arrow -------------------------------- */
      t.addEventListener('keydown', function (e) {
        if (!e.altKey || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
        e.preventDefault();
        var list = tiles(), i = list.indexOf(t);
        var j = e.key === 'ArrowLeft' ? i - 1 : i + 1;
        if (j < 0 || j >= list.length) return;
        tilesRow.insertBefore(t, e.key === 'ArrowLeft' ? list[j] : list[j].nextSibling);
        settle(t); save(); stamp(); t.focus();
        announce(label(t) + ' moved to position ' + (j + 1) + ' of ' + list.length + '.');
      });
    });

    function settle(t) {
      if (reduced) return;
      t.classList.remove('is-settling');
      void t.offsetWidth;                    // restart the animation
      t.classList.add('is-settling');
      setTimeout(function () { t.classList.remove('is-settling'); }, 460);
    }

    restore();
    stamp();

    /* -- entrance, counters, and the turning ------------------------------- */
    function countUp(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
      if (isNaN(target)) return;
      var t0 = null, ms = 900;
      function frame(now) {
        if (t0 === null) t0 = now;
        var k = Math.min((now - t0) / ms, 1);
        k = 1 - Math.pow(1 - k, 3);          // ease out
        el.textContent = (target * k).toFixed(dec);
        if (k < 1) requestAnimationFrame(frame);
        else el.textContent = target.toFixed(dec);
      }
      requestAnimationFrame(frame);
    }

    var paused = false, turnTimer = null, turnIdx = 0;

    // One tile is turned at a time: shown for a beat, returned, then a pause
    // before the next. A recursive timeout rather than an interval, so the
    // hold and the gap can differ and can never overlap.
    function turnNext() {
      var list = tiles();
      if (!list.length) return;
      // Folded away for a question, off-screen, or held under the pointer:
      // all three mean nobody is looking, so nothing should turn.
      if (paused || document.hidden || tilesRow.closest('.is-asking')) {
        turnTimer = setTimeout(turnNext, 1400); return;
      }
      var t = list[turnIdx % list.length];
      turnIdx++;
      t.classList.add('is-flipped');
      turnTimer = setTimeout(function () {
        t.classList.remove('is-flipped');
        turnTimer = setTimeout(turnNext, 1500);
      }, 3600);
    }

    function startTurning() {
      if (reduced || turnTimer) return;
      turnTimer = setTimeout(turnNext, 600);
    }

    // The entrance itself is a CSS animation, so the row is never dependent on
    // this running. What waits for the row to be seen is the counting and the
    // turning, neither of which is worth doing off-screen.
    function reveal() {
      if (!reduced) $$('.tile__num', tilesRow).forEach(countUp);
      startTurning();
    }

    if (reduced || !('IntersectionObserver' in window)) { reveal(); }
    else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { io.disconnect(); reveal(); }
        });
      }, { threshold: .25 });
      io.observe(tilesRow);
    }
  })();

  /* --- Asking clears the room ---------------------------------------------
     At rest the assistant is one bar. The moment a question is being typed the
     tiles stand down and the panel opens into the conversation; closing it
     brings the tiles back as they were. The thread is kept, so returning to a
     question already asked does not lose the answer.                        */
  var dashView = $('#view-overview');
  var mosaic = $('#tiles');
  var askInput = $('#ask-input');
  if (dashView && mosaic && askInput) (function () {
    var asking = false;
    var sent = false;                      // has the member actually asked anything?
    var foldTimer = null;

    // Two phases: the tiles fade, then they leave the grid so the bar can take
    // the whole width. Reversed on the way back, so the bar never jumps before
    // the tiles have somewhere to land.
    function setAsking(on) {
      if (asking === on) return;
      asking = on;
      clearTimeout(foldTimer);

      if (on) {
        dashView.classList.add('is-asking');
        if (reduced) mosaic.classList.add('is-folded');
        else foldTimer = setTimeout(function () {
          if (asking) mosaic.classList.add('is-folded');
        }, 320);
      } else {
        mosaic.classList.remove('is-folded');
        void mosaic.offsetHeight;          // let the grid settle before fading in
        dashView.classList.remove('is-asking');
      }

      // Hidden means hidden: nothing in there should be reachable by tab or
      // readable by a screen reader while it is folded away.
      $$('.mosaic > a.tile').forEach(function (t) {
        if ('inert' in HTMLElement.prototype) t.inert = on;
        t.setAttribute('aria-hidden', on ? 'true' : 'false');
      });

      // A film nobody can see should not keep decoding.
      $$('.tile__video', mosaic).forEach(function (v) {
        if (on) { try { v.pause(); } catch (e) {} }
        else if (!reduced) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      });
    }

    askInput.addEventListener('input', function () {
      if (askInput.value.trim() !== '') { setAsking(true); return; }
      // Cleared without ever asking anything — treat it as never having started.
      if (!sent) setAsking(false);
    });

    // A suggested opening is a question too.
    $$('#ask-chips button').forEach(function (chip) {
      chip.addEventListener('click', function () { sent = true; setAsking(true); });
    });
    if (askForm) askForm.addEventListener('submit', function () { sent = true; });

    function close() {
      setAsking(false);
      askInput.value = '';
      askInput.blur();
    }

    var closeBtn = $('#ask-close');
    if (closeBtn) closeBtn.addEventListener('click', close);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && asking) { e.preventDefault(); close(); }
    });

    // Leaving the overview entirely puts the room back as it was.
    window.addEventListener('hashchange', function () {
      if (asking && location.hash.replace('#', '') !== 'overview') close();
    });

    // Under prefers-reduced-motion a film should not play on its own.
    if (reduced) $$('.tile__video', mosaic).forEach(function (v) {
      v.autoplay = false; try { v.pause(); } catch (e) {}
    });
  })();

  /* --- Shared by the matching surfaces ------------------------------------
     Long-term and short-term are different products with different weights and
     different questions, but they draw the same card, the same filter field and
     the same plate. These live out here so there is one of each.            */
  var MATCH = {
    el: function (tag, cls, text) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text != null) e.textContent = text;
      return e;
    },
    // An abstract plate, not a photograph, and not pretending to be one: the
    // house does not publish faces.
    plate: function (seed) {
      var h = 0; for (var i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
        '<defs><linearGradient id="a" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="hsl(' + h + ',12%,26%)"/>' +
        '<stop offset="1" stop-color="hsl(' + h + ',14%,11%)"/></linearGradient>' +
        '<radialGradient id="b" cx=".62" cy=".34" r=".55">' +
        '<stop offset="0" stop-color="#E4D6B6" stop-opacity=".30"/>' +
        '<stop offset="1" stop-color="#E4D6B6" stop-opacity="0"/></radialGradient></defs>' +
        '<rect width="400" height="300" fill="url(#a)"/><rect width="400" height="300" fill="url(#b)"/>' +
        '<path d="M248 300c0-38-24-62-58-62s-58 24-58 62Z" fill="#E4D6B6" fill-opacity=".13"/>' +
        '<circle cx="190" cy="196" r="30" fill="#E4D6B6" fill-opacity=".13"/></svg>';
      return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    },
    field: function (def, store, onChange, prefix) {
      var el = MATCH.el;
      var wrap = el('div', 'ltr-field');
      var id = (prefix || 'ltr') + '-f-' + def.k;
      var lab = el('label', null, def.label); lab.setAttribute('for', id);
      var input;
      if (def.type === 'select') {
        input = el('select');
        def.options.forEach(function (o) {
          var opt = el('option', null, o); opt.value = o;
          if (store[def.k] === o || (store[def.k] == null && def.value === o)) opt.selected = true;
          input.appendChild(opt);
        });
      } else if (def.type === 'date') {
        input = el('input'); input.type = 'date';
        input.value = store[def.k] != null ? store[def.k] : (def.value || '');
      } else {
        input = el('input'); input.type = 'number'; input.min = '18'; input.max = '99';
        input.value = store[def.k] != null ? store[def.k] : (def.value || '');
      }
      input.id = id;
      if (store[def.k] == null && def.value != null) store[def.k] = def.value;
      input.addEventListener('change', function () { store[def.k] = input.value; onChange(); });
      wrap.appendChild(lab); wrap.appendChild(input);
      return wrap;
    },
    head: function (title, pill) {
      var h = MATCH.el('div', 'panel__head');
      h.appendChild(MATCH.el('h2', null, title));
      if (pill) h.appendChild(MATCH.el('span', 'pill pill--rest', pill));
      return h;
    },
    // A verification badge, or an honest absence of one.
    badge: function (verified) {
      var el = MATCH.el;
      if (!verified) return el('span', 'ltr-vfd ltr-vfd--no', 'Verification in progress');
      var v = el('span', 'ltr-vfd');
      v.appendChild(el('i', null, '\u2713'));
      v.appendChild(el('span', null, 'Legend Verified'));
      return v;
    }
  };

  /* --- Long-term relationship: discovery and matching ----------------------
     A matching surface rather than a list of people. Every figure on this page
     is computed here, in the page, from the sample below: the weights are data
     so they can be retuned without touching the logic, and the explanations are
     written from the same factors the score is, so the number and the sentence
     can never disagree.

     Preview only: no network, no storage beyond this tab, nothing leaves the
     page.                                                                    */
  var ltrView = $('#view-find-long');
  if (ltrView) (function () {

    /* -- what the score is made of. Data, not literals in the maths. ------- */
    var WEIGHTS = {
      goals: 30, lifestyle: 15, communication: 15,
      interests: 10, values: 15, age: 5, location: 5, activity: 5
    };
    var FACTOR_LABELS = {
      goals: 'Relationship goals', lifestyle: 'Lifestyle',
      communication: 'Communication style', interests: 'Interests',
      values: 'Values', age: 'Age', location: 'Location', activity: 'Activity'
    };

    /* -- the member, as this page needs them ------------------------------- */
    var ME = {
      goal: 'Long-Term Partner',
      city: 'London', country: 'United Kingdom',
      ageMin: 32, ageMax: 46,
      interests: ['Travel', 'Art', 'Sailing', 'Wine', 'Architecture'],
      social: 'Small rooms', style: 'Direct', wantsChildren: 'Open'
    };

    /* -- sample members ---------------------------------------------------- */
    var PEOPLE = [
      { id:'p1', name:'Sophia', age:36, city:'Zurich', country:'Switzerland', verified:true,
        goal:'Marriage', occupation:'Founder, medical devices', active:2, joined:210,
        interests:['Travel','Art','Sailing','Languages'],
        smoking:'No', children:'None', wantsChildren:'Yes', education:'MSc',
        languages:['German','English','French'], social:'Small rooms', style:'Direct',
        relocate:'Open to relocating',
        about:'Built one company, sold it, and is deliberately taking the year more slowly. Sails badly and often.',
        f:{ goals:96, lifestyle:91, communication:89, interests:84, values:88 },
        diff:['Prefers to stay within Switzerland','Wants children sooner than most'] },

      { id:'p2', name:'Isabelle', age:41, city:'Paris', country:'France', verified:true,
        goal:'Life Partner', occupation:'Barrister', active:1, joined:640,
        interests:['Architecture','Wine','Opera','Riding'],
        smoking:'No', children:'One, grown', wantsChildren:'No', education:'Doctorate',
        languages:['French','English'], social:'Small rooms', style:'Direct',
        relocate:'Not relocating',
        about:'Reads three papers a day and will tell you when you are wrong, which is the point.',
        f:{ goals:92, lifestyle:88, communication:94, interests:87, values:90 },
        diff:['Does not want more children','Will not leave Paris'] },

      { id:'p3', name:'Marguerite', age:39, city:'London', country:'United Kingdom', verified:true,
        goal:'Long-Term Partner', occupation:'Curator', active:1, joined:95,
        interests:['Art','Architecture','Travel','Wine'],
        smoking:'No', children:'None', wantsChildren:'Open', education:'MA',
        languages:['English','Italian'], social:'Small rooms', style:'Considered',
        relocate:'Open to relocating',
        about:'Spends her working life deciding what deserves a wall, and is careful about it elsewhere too.',
        f:{ goals:94, lifestyle:93, communication:86, interests:96, values:89 },
        diff:['Works most evenings in the season'] },

      { id:'p4', name:'Beatrice', age:34, city:'Milan', country:'Italy', verified:true,
        goal:'Serious Relationship', occupation:'Architect', active:4, joined:40,
        interests:['Architecture','Sailing','Food','Cycling'],
        smoking:'Occasionally', children:'None', wantsChildren:'Yes', education:'MArch',
        languages:['Italian','English','Spanish'], social:'Large rooms', style:'Warm',
        relocate:'Open to relocating',
        about:'Draws buildings that get built. Talks with her hands and does not apologise for it.',
        f:{ goals:83, lifestyle:79, communication:81, interests:88, values:80 },
        diff:['Smokes occasionally','Much more social than you are'] },

      { id:'p5', name:'Helena', age:44, city:'Geneva', country:'Switzerland', verified:true,
        goal:'Long-Term Partner', occupation:'Private banker', active:6, joined:800,
        interests:['Sailing','Wine','Skiing','Travel'],
        smoking:'No', children:'Two, teenage', wantsChildren:'No', education:'MBA',
        languages:['French','English','German'], social:'Small rooms', style:'Direct',
        relocate:'Not relocating',
        about:'Has arranged other people’s lives for twenty years and is candid that hers came second.',
        f:{ goals:88, lifestyle:85, communication:90, interests:82, values:86 },
        diff:['Two teenage children at home','Will not leave Geneva'] },

      { id:'p6', name:'Anouk', age:37, city:'Amsterdam', country:'Netherlands', verified:false,
        goal:'Exclusive Relationship', occupation:'Documentary producer', active:1, joined:18,
        interests:['Travel','Film','Cycling','Food'],
        smoking:'No', children:'None', wantsChildren:'Open', education:'BA',
        languages:['Dutch','English','German'], social:'Large rooms', style:'Warm',
        relocate:'Open to relocating',
        about:'Away four months of the year and honest that this is the thing to discuss first.',
        f:{ goals:76, lifestyle:71, communication:84, interests:70, values:79 },
        diff:['Travels four months a year','Verification not yet complete'] },

      { id:'p7', name:'Clara', age:43, city:'Vienna', country:'Austria', verified:true,
        goal:'Marriage', occupation:'Orchestral conductor', active:3, joined:300,
        interests:['Opera','Art','Wine','Languages'],
        smoking:'No', children:'None', wantsChildren:'No', education:'Doctorate',
        languages:['German','English','Italian'], social:'Small rooms', style:'Considered',
        relocate:'Open to relocating',
        about:'Rehearses in the morning, reads in the afternoon, and keeps her evenings.',
        f:{ goals:90, lifestyle:87, communication:88, interests:79, values:92 },
        diff:['Does not want children','Season runs September to June'] },

      { id:'p8', name:'Rosalind', age:33, city:'London', country:'United Kingdom', verified:true,
        goal:'Long-Term Partner', occupation:'Surgeon', active:5, joined:150,
        interests:['Travel','Cycling','Wine','Art'],
        smoking:'No', children:'None', wantsChildren:'Yes', education:'MD',
        languages:['English','French'], social:'Small rooms', style:'Direct',
        relocate:'Not relocating',
        about:'Operates three days a week and is unromantic about how little time that leaves.',
        f:{ goals:91, lifestyle:82, communication:87, interests:83, values:85 },
        diff:['On call most weekends','Will not leave London'] },

      { id:'p9', name:'Ingrid', age:46, city:'Copenhagen', country:'Denmark', verified:true,
        goal:'Open to Exploring', occupation:'Novelist', active:9, joined:520,
        interests:['Art','Languages','Sailing','Food'],
        smoking:'No', children:'One, grown', wantsChildren:'No', education:'MA',
        languages:['Danish','English','German'], social:'Small rooms', style:'Considered',
        relocate:'Open to relocating',
        about:'Not certain she wants this, and would rather say so than perform certainty.',
        f:{ goals:64, lifestyle:83, communication:85, interests:80, values:82 },
        diff:['Not yet decided what she is looking for'] },

      { id:'p10', name:'Camille', age:35, city:'Brussels', country:'Belgium', verified:false,
        goal:'Serious Relationship', occupation:'Diplomat', active:12, joined:9,
        interests:['Languages','Travel','Food','Opera'],
        smoking:'No', children:'None', wantsChildren:'Open', education:'MA',
        languages:['French','English','Arabic','Dutch'], social:'Large rooms', style:'Warm',
        relocate:'Posted every three years',
        about:'Moves country on a schedule she does not control, and says so before anything else.',
        f:{ goals:80, lifestyle:68, communication:83, interests:74, values:81 },
        diff:['Posted to a new country every three years','Verification not yet complete'] },

      { id:'p11', name:'Freya', age:38, city:'Edinburgh', country:'United Kingdom', verified:true,
        goal:'Life Partner', occupation:'Distiller', active:2, joined:60,
        interests:['Wine','Sailing','Food','Travel'],
        smoking:'No', children:'None', wantsChildren:'Yes', education:'BSc',
        languages:['English'], social:'Small rooms', style:'Direct',
        relocate:'Open to relocating',
        about:'Runs a distillery her grandmother started and is the fourth to do it.',
        f:{ goals:93, lifestyle:89, communication:85, interests:86, values:87 },
        diff:['One language','Rarely in London'] },

      { id:'p12', name:'Livia', age:40, city:'Rome', country:'Italy', verified:true,
        goal:'Long-Term Partner', occupation:'Restorer', active:7, joined:410,
        interests:['Art','Architecture','Food','Languages'],
        smoking:'No', children:'None', wantsChildren:'Open', education:'MA',
        languages:['Italian','English','Latin'], social:'Small rooms', style:'Considered',
        relocate:'Not relocating',
        about:'Spends months on a single square metre of fresco and finds that a reasonable pace.',
        f:{ goals:89, lifestyle:86, communication:84, interests:91, values:88 },
        diff:['Will not leave Rome'] }
    ];

    /* -- derived factors: the ones we can actually compute ------------------ */
    function ageFit(p) {
      if (p.age >= ME.ageMin && p.age <= ME.ageMax) return 100;
      var out = p.age < ME.ageMin ? ME.ageMin - p.age : p.age - ME.ageMax;
      return Math.max(0, 100 - out * 12);
    }
    function locationFit(p) {
      if (p.city === ME.city) return 100;
      if (p.country === ME.country) return 88;
      return /Open to relocating/.test(p.relocate) ? 74 : 58;
    }
    function activityFit(p) { return Math.max(40, 100 - p.active * 5); }
    function interestFit(p) {
      var shared = p.interests.filter(function (i) { return ME.interests.indexOf(i) > -1; });
      return { pct: Math.round(shared.length / Math.max(3, ME.interests.length) * 100), shared: shared };
    }

    function factorsOf(p) {
      return {
        goals: p.f.goals, lifestyle: p.f.lifestyle, communication: p.f.communication,
        interests: p.f.interests, values: p.f.values,
        age: ageFit(p), location: locationFit(p), activity: activityFit(p)
      };
    }
    function scoreOf(p) {
      var f = factorsOf(p), total = 0, sum = 0;
      Object.keys(WEIGHTS).forEach(function (k) { total += WEIGHTS[k]; sum += WEIGHTS[k] * (f[k] || 0); });
      return Math.round(sum / total);
    }
    PEOPLE.forEach(function (p) { p.factors = factorsOf(p); p.score = scoreOf(p); });

    /* -- an abstract plate per member. Not a photograph, and not pretending
          to be one: the house does not publish faces.                        */
    function plate(p) {
      return MATCH.plate(p.id + p.name);
    }

    /* -- per-visit state ---------------------------------------------------- */
    var STATE = {
      goal: ME.goal, q: '', verifiedOnly: false, savedOnly: false,
      section: 'recommended', shown: 6,
      basic: {}, advanced: {}, prefs: {}
    };
    var SAVED = {};                       // id -> true
    var STATUS = {};                      // id -> 'sent' | 'connected'

    var GOALS = ['Serious Relationship','Long-Term Partner','Life Partner','Marriage',
                 'Exclusive Relationship','Open to Exploring'];
    var SECTIONS = [
      { id:'recommended', label:'Recommended for you', note:'Best overall, on your weights' },
      { id:'compatible',  label:'Highly compatible',   note:'Ninety per cent and above' },
      { id:'new',         label:'New to Legend',       note:'Joined in the last three months' },
      { id:'active',      label:'Recently active',     note:'Seen in the last three days' },
      { id:'persona',     label:'Similar to your persona', note:'Your social and communication style' },
      { id:'saved',       label:'Saved',               note:'Kept for later' }
    ];

    /* -- filter definitions. Rendered from data, read back from data. ------- */
    var BASIC = [
      { k:'ageMin', label:'Minimum age', type:'number', value:ME.ageMin },
      { k:'ageMax', label:'Maximum age', type:'number', value:ME.ageMax },
      { k:'country', label:'Country', type:'select', options:['Any'] },
      { k:'city', label:'City', type:'select', options:['Any'] },
      { k:'relocate', label:'Willing to relocate', type:'select', options:['Any','Open to relocating','Not relocating'] },
      { k:'goal', label:'Their relationship goal', type:'select', options:['Any'].concat(GOALS) }
    ];
    var ADVANCED = [
      { k:'smoking', label:'Smoking', type:'select', options:['Any','No','Occasionally'] },
      { k:'children', label:'Has children', type:'select', options:['Any','None','Has children'] },
      { k:'wantsChildren', label:'Wants children', type:'select', options:['Any','Yes','No','Open'] },
      { k:'education', label:'Education', type:'select', options:['Any','BA','BSc','MA','MSc','MBA','MArch','MD','Doctorate'] },
      { k:'language', label:'Speaks', type:'select', options:['Any'] },
      { k:'social', label:'Social style', type:'select', options:['Any','Small rooms','Large rooms'] },
      { k:'style', label:'Communication style', type:'select', options:['Any','Direct','Considered','Warm'] }
    ];
    var PREFS = [
      { k:'pAgeMin', label:'Age from', type:'number', value:ME.ageMin },
      { k:'pAgeMax', label:'Age to', type:'number', value:ME.ageMax },
      { k:'pCountry', label:'Countries', type:'select', options:['Any'] },
      { k:'pGoal', label:'Relationship', type:'select', options:GOALS, value:ME.goal },
      { k:'pSmoking', label:'Smoking', type:'select', options:['Any','No'] },
      { k:'pChildren', label:'Children', type:'select', options:['Any','Wants children','Does not want children'] }
    ];
    // the option lists that come from the data itself
    var countries = ['Any'].concat(PEOPLE.map(function (p) { return p.country; })
      .filter(function (v, i, a) { return a.indexOf(v) === i; }).sort());
    var cities = ['Any'].concat(PEOPLE.map(function (p) { return p.city; })
      .filter(function (v, i, a) { return a.indexOf(v) === i; }).sort());
    var langs = ['Any'].concat(PEOPLE.reduce(function (a, p) { return a.concat(p.languages); }, [])
      .filter(function (v, i, a) { return a.indexOf(v) === i; }).sort());
    BASIC[2].options = countries; BASIC[3].options = cities;
    ADVANCED[4].options = langs;  PREFS[2].options = countries;

    /* -- filtering ---------------------------------------------------------- */
    function matches(p) {
      var b = STATE.basic, a = STATE.advanced;
      if (STATE.verifiedOnly && !p.verified) return false;
      if (STATE.savedOnly && !SAVED[p.id]) return false;
      if (b.ageMin && p.age < +b.ageMin) return false;
      if (b.ageMax && p.age > +b.ageMax) return false;
      if (b.country && b.country !== 'Any' && p.country !== b.country) return false;
      if (b.city && b.city !== 'Any' && p.city !== b.city) return false;
      if (b.relocate && b.relocate !== 'Any' && p.relocate.indexOf(b.relocate) !== 0) return false;
      if (b.goal && b.goal !== 'Any' && p.goal !== b.goal) return false;
      if (a.smoking && a.smoking !== 'Any' && p.smoking !== a.smoking) return false;
      if (a.children && a.children !== 'Any') {
        var has = p.children !== 'None';
        if (a.children === 'None' && has) return false;
        if (a.children === 'Has children' && !has) return false;
      }
      if (a.wantsChildren && a.wantsChildren !== 'Any' && p.wantsChildren !== a.wantsChildren) return false;
      if (a.education && a.education !== 'Any' && p.education !== a.education) return false;
      if (a.language && a.language !== 'Any' && p.languages.indexOf(a.language) < 0) return false;
      if (a.social && a.social !== 'Any' && p.social !== a.social) return false;
      if (a.style && a.style !== 'Any' && p.style !== a.style) return false;
      if (STATE.q) {
        var hay = (p.name + ' ' + p.occupation + ' ' + p.city + ' ' + p.country + ' ' +
                   p.interests.join(' ') + ' ' + p.languages.join(' ')).toLowerCase();
        if (hay.indexOf(STATE.q.toLowerCase()) < 0) return false;
      }
      return true;
    }
    function inSection(p) {
      switch (STATE.section) {
        case 'compatible': return p.score >= 90;
        case 'new':        return p.joined <= 90;
        case 'active':     return p.active <= 3;
        case 'persona':    return p.social === ME.social && p.style === ME.style;
        case 'saved':      return !!SAVED[p.id];
        default:           return true;
      }
    }
    function results() {
      return PEOPLE.filter(function (p) { return matches(p) && inSection(p); })
                   .sort(function (x, y) { return y.score - x.score; });
    }

    /* -- why the number is the number --------------------------------------- */
    function strengths(p) {
      return Object.keys(p.factors)
        .filter(function (k) { return p.factors[k] >= 85; })
        .sort(function (a, b) { return p.factors[b] - p.factors[a]; })
        .map(function (k) { return FACTOR_LABELS[k]; });
    }
    function insight(p) {
      var s = strengths(p), fit = interestFit(p);
      var lead = 'You and ' + p.name + ' ';
      if (s.length >= 2) lead += 'line up most on ' + s[0].toLowerCase() + ' and ' + s[1].toLowerCase() + '.';
      else if (s.length === 1) lead += 'line up most on ' + s[0].toLowerCase() + '.';
      else lead += 'have no single factor that stands out, which is itself worth knowing.';
      if (fit.shared.length) lead += ' You share ' + fit.shared.slice(0, 3).join(', ').toLowerCase() + '.';
      if (p.goal === STATE.goal) lead += ' You are both asking for the same thing: ' + p.goal.toLowerCase() + '.';
      else lead += ' She is looking for ' + p.goal.toLowerCase() + ', where you have said ' + STATE.goal.toLowerCase() + '.';
      return lead;
    }
    var ASK = [
      { q:'Why do you think we are compatible?', a:function (p) { return insight(p); } },
      { q:'What should I know before contacting her?', a:function (p) {
          return p.diff.length
            ? 'The things worth raising early: ' + p.diff.join('; ').toLowerCase() + '. None of them is a reason not to meet — they are the reasons to be direct at the first meeting rather than the fourth.'
            : 'Nothing on her file conflicts with yours in a way worth raising in advance. That is unusual, and not the same as saying it will work.'; } },
      { q:'Where are we least alike?', a:function (p) {
          var low = Object.keys(p.factors).sort(function (a, b) { return p.factors[a] - p.factors[b]; })[0];
          return 'Lowest of the eight factors is ' + FACTOR_LABELS[low].toLowerCase() + ', at ' + p.factors[low] + ' per cent. ' +
                 'It is weighted at ' + WEIGHTS[low] + ' of 100 in your score, so it moves the figure less than it may matter to you.'; } },
      { q:'How was this figure worked out?', a:function (p) {
          return 'Eight factors, each weighted: ' + Object.keys(WEIGHTS).map(function (k) {
            return FACTOR_LABELS[k].toLowerCase() + ' ' + WEIGHTS[k]; }).join(', ') +
            '. Her weighted average is ' + p.score + '. The weights are your advisor’s to change, and they are not fixed for every member.'; } }
    ];

    /* -- rendering ----------------------------------------------------------- */
    var el = MATCH.el, field = MATCH.field, headOf = MATCH.head;

    function card(p) {
      var a = el('article', 'ltr-card' + (SAVED[p.id] ? ' is-saved' : ''));
      var img = el('img', 'ltr-card__plate');
      img.src = plate(p); img.alt = ''; img.setAttribute('aria-hidden', 'true'); img.loading = 'lazy';
      a.appendChild(img);

      var body = el('div', 'ltr-card__body');
      if (p.verified) {
        var v = el('span', 'ltr-vfd'); v.appendChild(el('i', null, '✓'));
        v.appendChild(el('span', null, 'Legend Verified')); body.appendChild(v);
      } else {
        body.appendChild(el('span', 'ltr-vfd ltr-vfd--no', 'Verification in progress'));
      }
      body.appendChild(el('h3', 'ltr-card__name', p.name + ', ' + p.age));
      body.appendChild(el('p', 'ltr-card__where', p.city + ', ' + p.country));
      body.appendChild(el('p', 'ltr-card__goal', p.goal));

      var sc = el('div', 'ltr-score');
      sc.appendChild(el('span', 'ltr-score__n', p.score + '%'));
      sc.appendChild(el('span', 'ltr-score__l', 'Compatibility'));
      var bar = el('span', 'ltr-score__bar');
      var fill = el('span'); fill.style.width = p.score + '%'; bar.appendChild(fill);
      sc.appendChild(bar);
      body.appendChild(sc);

      body.appendChild(el('p', 'ltr-card__occ', p.occupation));
      var tags = el('p', 'ltr-card__tags', p.interests.slice(0, 4).join(' · '));
      body.appendChild(tags);
      body.appendChild(el('p', 'ltr-card__seen',
        (STATUS[p.id] === 'connected' ? 'Connected · ' : STATUS[p.id] === 'sent' ? 'Request sent · ' : '') +
        (p.active <= 1 ? 'Active today' : 'Active ' + p.active + ' days ago')));

      var acts = el('div', 'ltr-card__acts');
      var view = el('button', 'btn', null); view.type = 'button';
      view.appendChild(el('span', null, 'View profile')); view.appendChild(el('i', 'arrow'));
      view.addEventListener('click', function () { openSheet(p); });
      var save = el('button', 'ltr-heart'); save.type = 'button';
      save.setAttribute('aria-pressed', SAVED[p.id] ? 'true' : 'false');
      save.setAttribute('aria-label', (SAVED[p.id] ? 'Remove ' : 'Save ') + p.name);
      save.textContent = SAVED[p.id] ? '♥' : '♡';
      save.addEventListener('click', function () {
        SAVED[p.id] = !SAVED[p.id]; render();
        announce((SAVED[p.id] ? 'Saved ' : 'Removed ') + p.name + '.');
      });
      acts.appendChild(view); acts.appendChild(save);
      body.appendChild(acts);

      a.appendChild(body);
      return a;
    }

    var grid = $('#ltr-grid'), empty = $('#ltr-empty'), moreBtn = $('#ltr-more'), shownP = $('#ltr-shown');
    var live = el('p', 'sr-only'); live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite');
    ltrView.appendChild(live);
    function announce(t) { live.textContent = t; }

    function render() {
      var all = results();
      var page = all.slice(0, STATE.shown);
      grid.textContent = '';
      page.forEach(function (p) { grid.appendChild(card(p)); });
      empty.hidden = all.length > 0;
      moreBtn.hidden = all.length <= STATE.shown;
      shownP.textContent = all.length
        ? 'Showing ' + page.length + ' of ' + all.length + ' in this group.'
        : '';
      $('#ltr-count').textContent = PEOPLE.filter(matches).length;
      $('#ltr-where').textContent = (STATE.basic.city && STATE.basic.city !== 'Any')
        ? STATE.basic.city : (STATE.basic.country && STATE.basic.country !== 'Any' ? STATE.basic.country : 'Anywhere');
      $('#ltr-goal').textContent = STATE.goal;
      $('#ltr-verified').textContent = STATE.verifiedOnly ? 'Verified only' : 'All members';
      $$('#ltr-sections button').forEach(function (b) {
        var on = b.getAttribute('data-section') === STATE.section;
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
    }

    /* -- the profile, opened over the page ---------------------------------- */
    var sheet = $('#ltr-sheet'), sheetBody = $('#ltr-sheet-body'), lastFocus = null;

    function bars(p) {
      var wrap = el('div', 'ltr-bars');
      Object.keys(p.factors).forEach(function (k) {
        var row = el('div', 'ltr-bars__row');
        row.appendChild(el('span', 'k', FACTOR_LABELS[k]));
        var b = el('span', 'b'); var f = el('i'); f.style.width = p.factors[k] + '%'; b.appendChild(f);
        row.appendChild(b);
        row.appendChild(el('span', 'v', p.factors[k] + '%'));
        wrap.appendChild(row);
      });
      return wrap;
    }

    function openSheet(p) {
      lastFocus = document.activeElement;
      sheetBody.textContent = '';

      var head = el('div', 'ltr-sheet__head');
      var img = el('img', 'ltr-sheet__plate'); img.src = plate(p); img.alt = ''; img.setAttribute('aria-hidden','true');
      head.appendChild(img);
      var hb = el('div');
      if (p.verified) {
        var v = el('span', 'ltr-vfd'); v.appendChild(el('i', null, '✓'));
        v.appendChild(el('span', null, 'Legend Verified')); hb.appendChild(v);
      }
      var h = el('h2', null, p.name + ', ' + p.age); h.id = 'ltr-sheet-name'; hb.appendChild(h);
      hb.appendChild(el('p', 'ltr-sheet__where', p.city + ', ' + p.country + ' · ' + p.occupation));
      hb.appendChild(el('p', 'ltr-sheet__score', p.score + '% compatible'));
      head.appendChild(hb);
      sheetBody.appendChild(head);

      // actions, and the connect flow
      var acts = el('div', 'ltr-sheet__acts');
      var connect = el('button', 'btn btn--solid'); connect.type = 'button';
      var msg = el('button', 'btn'); msg.type = 'button'; msg.appendChild(el('span', null, 'Message'));
      var save2 = el('button', 'btn'); save2.type = 'button';
      var report = el('button', 'btn btn--quiet', 'Report'); report.type = 'button';
      var block = el('button', 'btn btn--quiet', 'Block'); block.type = 'button';

      function paintActions() {
        connect.textContent = STATUS[p.id] === 'connected' ? 'Connected'
          : STATUS[p.id] === 'sent' ? 'Request sent' : 'Connect';
        connect.disabled = !!STATUS[p.id];
        msg.hidden = STATUS[p.id] !== 'connected';
        save2.textContent = SAVED[p.id] ? '♥ Saved' : '♡ Save';
      }
      connect.addEventListener('click', function () { openConnect(p, paintActions); });
      save2.addEventListener('click', function () { SAVED[p.id] = !SAVED[p.id]; paintActions(); render(); });
      msg.addEventListener('click', function () { location.hash = '#messages'; });
      report.addEventListener('click', function () { openReport(p); });
      block.addEventListener('click', function () {
        STATUS[p.id] = 'blocked'; note(block, p.name + ' is blocked. She is not shown to you again, is not told, and any request between you is withdrawn.');
      });
      [connect, msg, save2, report, block].forEach(function (b) { acts.appendChild(b); });
      paintActions();
      sheetBody.appendChild(acts);

      var connectBox = el('div', 'ltr-connect'); connectBox.hidden = true;
      sheetBody.appendChild(connectBox);
      function openConnect(person, done) {
        connectBox.hidden = false; connectBox.textContent = '';
        connectBox.appendChild(el('p', 'ask__lbl', 'Connect with ' + person.name));
        connectBox.appendChild(el('p', 'quiet', 'Why would you like to connect? A sentence is enough, and it is optional.'));
        var ta = el('textarea'); ta.rows = 3; ta.placeholder = 'Optional message';
        ta.setAttribute('aria-label', 'Optional message to ' + person.name);
        connectBox.appendChild(ta);
        var send = el('button', 'btn btn--solid', 'Send connection request'); send.type = 'button';
        send.addEventListener('click', function () {
          STATUS[person.id] = 'sent';
          connectBox.textContent = '';
          connectBox.appendChild(el('p', 'ltr-sent', 'Request sent. She decides whether to answer, and is told nothing about you beyond what you have agreed to disclose.'));
          done(); render(); announce('Connection request sent to ' + person.name + '.');
        });
        connectBox.appendChild(send);
        ta.focus();
      }
      function openReport(person) {
        connectBox.hidden = false; connectBox.textContent = '';
        connectBox.appendChild(el('p', 'ask__lbl', 'Report ' + person.name));
        var sel = el('select');
        ['Fake profile','Misrepresentation','Harassment','Inappropriate behaviour','Scam or fraud','Safety concern','Other']
          .forEach(function (o) { var op = el('option', null, o); op.value = o; sel.appendChild(op); });
        sel.setAttribute('aria-label', 'Reason for reporting');
        connectBox.appendChild(sel);
        var ta = el('textarea'); ta.rows = 3; ta.placeholder = 'Anything you would like the house to know';
        ta.setAttribute('aria-label', 'Details');
        connectBox.appendChild(ta);
        var send = el('button', 'btn btn--solid', 'Send to the house'); send.type = 'button';
        send.addEventListener('click', function () {
          connectBox.textContent = '';
          connectBox.appendChild(el('p', 'ltr-sent', 'Read by a person today, not a queue. You are told what was done, and she is never told who reported her.'));
        });
        connectBox.appendChild(send);
      }

      // about, and the persona note
      var about = el('div', 'panel');
      about.appendChild(headOf('About ' + p.name));
      var ab = el('div', 'panel__body');
      ab.appendChild(el('p', 'ltr-about', p.about));
      ab.appendChild(el('p', 'ask__lbl', 'Persona note'));
      ab.appendChild(el('p', 'quiet', 'Shown with her permission. ' + p.name + ' reads as ' +
        p.style.toLowerCase() + ' in conversation and prefers ' + p.social.toLowerCase() + '. ' +
        'Her persona is her own; it is not a judgement, and it is not shown to anyone she has not agreed to.'));
      about.appendChild(ab);
      sheetBody.appendChild(about);

      // why the score is the score
      var why = el('div', 'panel');
      why.appendChild(headOf('Why you are compatible', p.score + '% overall'));
      var wb = el('div', 'panel__body');
      wb.appendChild(bars(p));
      var st = strengths(p);
      if (st.length) {
        wb.appendChild(el('p', 'ask__lbl', 'Strong compatibility in'));
        var ul = el('ul', 'includes');
        st.forEach(function (s) { ul.appendChild(el('li', null, s)); });
        wb.appendChild(ul);
      }
      if (p.diff.length) {
        wb.appendChild(el('p', 'ask__lbl', 'Potential differences'));
        var ul2 = el('ul', 'includes includes--not');
        p.diff.forEach(function (d) { ul2.appendChild(el('li', null, d)); });
        wb.appendChild(ul2);
      }
      why.appendChild(wb);
      sheetBody.appendChild(why);

      // the assistant, in the context of this one person
      var ai = el('div', 'panel');
      ai.appendChild(headOf('Ask Legend about this match', 'Reads both files'));
      var aib = el('div', 'panel__body');
      aib.appendChild(el('p', 'ltr-insight', insight(p)));
      var thread = el('div', 'ltr-ai-thread');
      aib.appendChild(thread);
      var chips = el('div', 'ask__chips');
      ASK.forEach(function (item) {
        var b = el('button', null, item.q); b.type = 'button';
        b.addEventListener('click', function () {
          thread.appendChild(el('p', 'ltr-ai-q', item.q));
          thread.appendChild(el('p', 'ltr-ai-a', item.a(p)));
          b.remove();
        });
        chips.appendChild(b);
      });
      aib.appendChild(chips);
      aib.appendChild(el('p', 'quiet', 'Written rules over the two files, not a language model, and nothing here is sent anywhere.'));
      ai.appendChild(aib);
      sheetBody.appendChild(ai);

      // what she is looking for, and how she lives
      var facts = el('div', 'panel');
      facts.appendChild(headOf('Goals, and how she lives'));
      var fb = el('div', 'panel__body');
      var dl = el('dl', 'kv');
      [['Looking for', p.goal], ['Relocating', p.relocate], ['Children', p.children],
       ['Wants children', p.wantsChildren], ['Smoking', p.smoking], ['Education', p.education],
       ['Languages', p.languages.join(', ')], ['Social', p.social], ['Communication', p.style],
       ['Interests', p.interests.join(', ')]].forEach(function (r) {
        dl.appendChild(el('dt', null, r[0])); dl.appendChild(el('dd', null, r[1]));
      });
      fb.appendChild(dl);
      fb.appendChild(el('div', 'note-inline',
        'What is withheld stays withheld: her surname, her photograph and her address are not on this page and are not ours to give. They are disclosed by her, to you, if she answers.'));
      facts.appendChild(fb);
      sheetBody.appendChild(facts);

      sheet.hidden = false;
      document.body.style.overflow = 'hidden';
      $('.ltr-sheet__close', sheet).focus();
    }
    function closeSheet() {
      sheet.hidden = true;
      document.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    $$('[data-ltr-close]').forEach(function (b) { b.addEventListener('click', closeSheet); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !sheet.hidden) { e.preventDefault(); closeSheet(); }
    });

    /* -- build the controls --------------------------------------------------- */
    var goalsWrap = $('#ltr-goals');
    GOALS.forEach(function (g) {
      var b = el('button', 'chip' + (g === STATE.goal ? ' is-on' : ''), g);
      b.type = 'button'; b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', g === STATE.goal ? 'true' : 'false');
      b.addEventListener('click', function () {
        STATE.goal = g;
        $$('button', goalsWrap).forEach(function (o) {
          var on = o === b;
          o.classList.toggle('is-on', on);
          o.setAttribute('aria-checked', on ? 'true' : 'false');
        });
        render(); announce('Your goal is now ' + g + '.');
      });
      goalsWrap.appendChild(b);
    });

    function build(list, host, store) {
      var wrap = $(host);
      list.forEach(function (def) { wrap.appendChild(field(def, store, function () { STATE.shown = 6; render(); })); });
    }
    build(BASIC, '#ltr-basic', STATE.basic);
    build(ADVANCED, '#ltr-advanced', STATE.advanced);
    build(PREFS, '#ltr-prefs', STATE.prefs);

    var sectionsWrap = $('#ltr-sections');
    SECTIONS.forEach(function (s) {
      var b = el('button'); b.type = 'button';
      b.setAttribute('data-section', s.id);
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', s.id === STATE.section ? 'true' : 'false');
      b.appendChild(el('span', 'ltr-tab__l', s.label));
      b.appendChild(el('span', 'ltr-tab__n', s.note));
      b.addEventListener('click', function () { STATE.section = s.id; STATE.shown = 6; render(); });
      sectionsWrap.appendChild(b);
    });

    $('#ltr-q').addEventListener('input', function () { STATE.q = this.value.trim(); STATE.shown = 6; render(); });
    $('#ltr-verified-only').addEventListener('change', function () { STATE.verifiedOnly = this.checked; render(); });
    $('#ltr-saved-only').addEventListener('change', function () { STATE.savedOnly = this.checked; render(); });
    moreBtn.addEventListener('click', function () { STATE.shown += 6; render(); });
    $('#ltr-clear').addEventListener('click', function () {
      STATE.q = ''; STATE.basic = {}; STATE.advanced = {}; STATE.verifiedOnly = false;
      STATE.savedOnly = false; STATE.shown = 6;
      $('#ltr-q').value = ''; $('#ltr-verified-only').checked = false; $('#ltr-saved-only').checked = false;
      $('#ltr-basic').textContent = ''; $('#ltr-advanced').textContent = '';
      build(BASIC, '#ltr-basic', STATE.basic); build(ADVANCED, '#ltr-advanced', STATE.advanced);
      render(); announce('Filters cleared.');
    });
    $('#ltr-save-prefs').addEventListener('click', function (e) {
      note(e.target, 'Saved to your file and sent to C. Vasseur. These are the standing instructions she works to between your visits.');
    });

    render();
  })();

  /* --- Short-term relationship: intent, timing, place ----------------------
     A different product from the long-term surface, not a re-skin of it. Three
     questions decide a short-term match — what, when, where — so they carry
     half the weight between them, the card leads with dates rather than
     values, and the connect flow opens on the overlap the two people actually
     share rather than on a message box.                                      */
  var stmView = $('#view-find-short');
  if (stmView && typeof MATCH !== 'undefined') (function () {
    var el = MATCH.el, field = MATCH.field, headOf = MATCH.head;

    /* -- weights: timing and intent lead here ------------------------------ */
    var WEIGHTS = {
      intent: 25, availability: 20, location: 15, preferences: 15,
      lifestyle: 10, interests: 5, communication: 5, persona: 5
    };
    var LABELS = {
      intent:'Intent', availability:'Timing', location:'Location',
      preferences:'Relationship preferences', lifestyle:'Lifestyle',
      interests:'Interests', communication:'Communication', persona:'Persona'
    };

    var INTENTS = ['Short-Term Relationship','Casual Dating','Short-Term Companionship',
                   'Dating During Travel','Social Companionship','Open to Exploring'];
    var DURATIONS = ['A few days','1–2 weeks','2–4 weeks','1–3 months','3–6 months','Flexible'];
    var STYLES = ['Casual','Romantic','Exclusive for the duration','Non-exclusive','Flexible'];

    /* -- dates. Everything here is a day number, so overlap is arithmetic. -- */
    var DAY = 86400000;
    function d(iso) { return new Date(iso + 'T00:00:00'); }
    function iso(dt) { return dt.toISOString().slice(0, 10); }
    function fmt(isoStr) {
      var dt = d(isoStr);
      return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
    function overlap(aFrom, aTo, bFrom, bTo) {
      var s = Math.max(d(aFrom).getTime(), d(bFrom).getTime());
      var e = Math.min(d(aTo).getTime(), d(bTo).getTime());
      if (e < s) return null;
      return { from: iso(new Date(s)), to: iso(new Date(e)), days: Math.round((e - s) / DAY) + 1 };
    }
    // sample dates hang off today, so the page never goes stale
    var t0 = new Date(); t0.setHours(0, 0, 0, 0);
    function plus(n) { return iso(new Date(t0.getTime() + n * DAY)); }

    var ME = {
      intent: null, duration: '2–4 weeks', styles: ['Casual'],
      city: 'London', country: 'United Kingdom',
      from: plus(0), to: plus(20),
      travel: false, travelCity: 'Paris', travelFrom: plus(12), travelTo: plus(18),
      interests: ['Travel','Dining','Art','Culture'],
      social: 'Small rooms', style: 'Direct'
    };

    var PEOPLE = [
      { id:'s1', name:'Sofia', age:34, city:'Berlin', country:'Germany', verified:true,
        intent:'Short-Term Relationship', duration:'2–4 weeks', styles:['Romantic','Exclusive for the duration'],
        from:plus(3), to:plus(24), active:0, mode:'Local',
        interests:['Travel','Dining','Art','Music'], smoking:'No', fitness:'Often',
        languages:['German','English'], social:'Small rooms', comms:'Direct',
        looking:'Someone for dinners, galleries and a few days away during a quiet month at work.',
        f:{ intent:96, preferences:90, lifestyle:88, interests:85, communication:87, persona:86 } },

      { id:'s2', name:'Elena', age:31, city:'London', country:'United Kingdom', verified:true,
        intent:'Casual Dating', duration:'1–3 months', styles:['Casual','Non-exclusive'],
        from:plus(0), to:plus(40), active:0, mode:'Local',
        interests:['Dining','Nightlife','Fashion','Travel'], smoking:'No', fitness:'Sometimes',
        languages:['English','Spanish'], social:'Large rooms', comms:'Warm',
        looking:'Good dinners and better conversation, without either of us pretending it is more.',
        f:{ intent:82, preferences:78, lifestyle:84, interests:80, communication:83, persona:76 } },

      { id:'s3', name:'Margot', age:37, city:'Paris', country:'France', verified:true,
        intent:'Dating During Travel', duration:'1–2 weeks', styles:['Romantic','Flexible'],
        from:plus(10), to:plus(21), active:1, mode:'Visiting soon',
        interests:['Art','Culture','Dining','Travel'], smoking:'No', fitness:'Often',
        languages:['French','English','Italian'], social:'Small rooms', comms:'Direct',
        looking:'In one city for a fortnight at a time. I would rather see it with someone than alone.',
        f:{ intent:91, preferences:88, lifestyle:86, interests:94, communication:89, persona:90 } },

      { id:'s4', name:'Nadia', age:29, city:'London', country:'United Kingdom', verified:false,
        intent:'Social Companionship', duration:'Flexible', styles:['Casual','Flexible'],
        from:plus(2), to:plus(60), active:2, mode:'Local',
        interests:['Events','Music','Fashion','Dining'], smoking:'Occasionally', fitness:'Rarely',
        languages:['English','Russian'], social:'Large rooms', comms:'Warm',
        looking:'Company for the season — openings, dinners, the odd weekend. Nothing heavier.',
        f:{ intent:74, preferences:70, lifestyle:69, interests:72, communication:78, persona:68 } },

      { id:'s5', name:'Juliette', age:35, city:'Geneva', country:'Switzerland', verified:true,
        intent:'Short-Term Companionship', duration:'2–4 weeks', styles:['Casual','Exclusive for the duration'],
        from:plus(25), to:plus(50), active:1, mode:'Local',
        interests:['Travel','Wellness','Dining','Art'], smoking:'No', fitness:'Often',
        languages:['French','English','German'], social:'Small rooms', comms:'Considered',
        looking:'A month between contracts, and a preference for spending it well rather than alone.',
        f:{ intent:88, preferences:85, lifestyle:87, interests:83, communication:86, persona:88 } },

      { id:'s6', name:'Ava', age:33, city:'Paris', country:'France', verified:true,
        intent:'Short-Term Relationship', duration:'1–3 months', styles:['Romantic','Exclusive for the duration'],
        from:plus(8), to:plus(35), active:0, mode:'Local',
        interests:['Art','Dining','Culture','Music'], smoking:'No', fitness:'Sometimes',
        languages:['French','English'], social:'Small rooms', comms:'Direct',
        looking:'Here until the winter. Honest that it ends, and would like it to be good until it does.',
        f:{ intent:93, preferences:91, lifestyle:85, interests:90, communication:88, persona:89 } },

      { id:'s7', name:'Lucia', age:38, city:'Milan', country:'Italy', verified:true,
        intent:'Dating During Travel', duration:'A few days', styles:['Casual','Flexible'],
        from:plus(14), to:plus(19), active:3, mode:"I'm traveling",
        interests:['Travel','Dining','Fashion','Culture'], smoking:'No', fitness:'Often',
        languages:['Italian','English'], social:'Large rooms', comms:'Warm',
        looking:'Four days in a city I do not know well, and no interest in seeing it from a hotel bar.',
        f:{ intent:85, preferences:80, lifestyle:82, interests:88, communication:84, persona:79 } },

      { id:'s8', name:'Ines', age:32, city:'Lisbon', country:'Portugal', verified:true,
        intent:'Open to Exploring', duration:'Flexible', styles:['Flexible'],
        from:plus(1), to:plus(90), active:5, mode:'Local',
        interests:['Wellness','Travel','Music','Dining'], smoking:'No', fitness:'Often',
        languages:['Portuguese','English','Spanish'], social:'Small rooms', comms:'Considered',
        looking:'Not sure what I am looking for, and would rather say that than choose a label.',
        f:{ intent:62, preferences:68, lifestyle:80, interests:76, communication:81, persona:78 } },

      { id:'s9', name:'Petra', age:36, city:'Vienna', country:'Austria', verified:true,
        intent:'Short-Term Relationship', duration:'2–4 weeks', styles:['Romantic','Casual'],
        from:plus(30), to:plus(58), active:2, mode:'Local',
        interests:['Music','Art','Dining','Culture'], smoking:'No', fitness:'Sometimes',
        languages:['German','English'], social:'Small rooms', comms:'Direct',
        looking:'A season off between productions, spent somewhere other than a rehearsal room.',
        f:{ intent:90, preferences:86, lifestyle:84, interests:87, communication:85, persona:87 } },

      { id:'s10', name:'Yasmin', age:30, city:'London', country:'United Kingdom', verified:true,
        intent:'Casual Dating', duration:'1–2 weeks', styles:['Casual','Non-exclusive'],
        from:plus(0), to:plus(12), active:0, mode:'Local',
        interests:['Nightlife','Dining','Sports','Music'], smoking:'No', fitness:'Often',
        languages:['English','Arabic'], social:'Large rooms', comms:'Warm',
        looking:'Two weeks before I move for work. Light, and clear about the date it ends.',
        f:{ intent:80, preferences:76, lifestyle:79, interests:74, communication:82, persona:73 } },

      { id:'s11', name:'Delphine', age:39, city:'Paris', country:'France', verified:false,
        intent:'Short-Term Companionship', duration:'1–3 months', styles:['Casual','Flexible'],
        from:plus(11), to:plus(45), active:6, mode:'Local',
        interests:['Art','Culture','Travel','Wellness'], smoking:'No', fitness:'Sometimes',
        languages:['French','English'], social:'Small rooms', comms:'Considered',
        looking:'Company on stated terms, for the length of a project that keeps me in one place.',
        f:{ intent:84, preferences:82, lifestyle:83, interests:86, communication:80, persona:82 } },

      { id:'s12', name:'Clara', age:34, city:'Amsterdam', country:'Netherlands', verified:true,
        intent:'Social Companionship', duration:'A few days', styles:['Casual'],
        from:plus(4), to:plus(9), active:1, mode:'Visiting soon',
        interests:['Events','Art','Dining','Business'], smoking:'No', fitness:'Often',
        languages:['Dutch','English'], social:'Large rooms', comms:'Direct',
        looking:'In town for a conference and a dinner I would rather not attend by myself.',
        f:{ intent:77, preferences:74, lifestyle:81, interests:75, communication:83, persona:72 } },
    ];

    /* -- the three that decide it ------------------------------------------ */
    function myWindow() {
      return ME.travel ? { from: ME.travelFrom, to: ME.travelTo, city: ME.travelCity }
                       : { from: ME.from, to: ME.to, city: ME.city };
    }
    function overlapOf(p) {
      var w = myWindow();
      return overlap(w.from, w.to, p.from, p.to);
    }
    function timingFit(p) {
      var o = overlapOf(p);
      if (!o) return 0;
      var mine = Math.round((d(myWindow().to) - d(myWindow().from)) / DAY) + 1;
      return Math.min(100, Math.round(o.days / Math.max(1, Math.min(mine, 21)) * 100));
    }
    function locationFit(p) {
      var w = myWindow();
      if (p.city === w.city) return 100;
      if (p.country === ME.country) return 78;
      return /travel|visit/i.test(p.mode) ? 70 : 52;
    }
    function intentFit(p) {
      if (!ME.intent) return p.f.intent;                 // nothing chosen yet
      if (p.intent === ME.intent) return 100;
      var loose = { 'Open to Exploring': 70 };
      if (loose[p.intent]) return loose[p.intent];
      return Math.max(45, p.f.intent - 20);
    }
    function factorsOf(p) {
      return {
        intent: intentFit(p), availability: timingFit(p), location: locationFit(p),
        preferences: p.f.preferences, lifestyle: p.f.lifestyle,
        interests: p.f.interests, communication: p.f.communication, persona: p.f.persona
      };
    }
    function scoreOf(f) {
      var total = 0, sum = 0;
      Object.keys(WEIGHTS).forEach(function (k) { total += WEIGHTS[k]; sum += WEIGHTS[k] * (f[k] || 0); });
      return Math.round(sum / total);
    }
    function recompute() {
      PEOPLE.forEach(function (p) {
        p.overlap = overlapOf(p);
        p.factors = factorsOf(p);
        p.score = scoreOf(p.factors);
      });
    }

    /* -- state -------------------------------------------------------------- */
    var STATE = { q:'', verifiedOnly:false, overlapOnly:false, savedOnly:false,
                  section:'now', shown:6, basic:{}, advanced:{} };
    var SAVED = {}, STATUS = {};

    var SECTIONS = [
      { id:'now',    label:'Available now',    note:'Open today' },
      { id:'best',   label:'Your best matches', note:'Highest overall' },
      { id:'dates',  label:'Matching my dates', note:'Seven days of overlap or more' },
      { id:'nearby', label:'Nearby',            note:'In the city you are in' },
      { id:'travel', label:'Travel matches',    note:'Visiting, or on the move' },
      { id:'active', label:'Recently active',   note:'Seen in the last two days' },
      { id:'saved',  label:'Saved',             note:'Kept for later' }
    ];

    var WHEN = [
      { k:'from', label:'Available from', type:'date', value:ME.from },
      { k:'to',   label:'Available until', type:'date', value:ME.to },
      { k:'city', label:'City', type:'select', options:[] },
      { k:'mode', label:'Your situation', type:'select',
        options:["I'm local","I'm staying in this city","I'm visiting soon","I'm traveling"] }
    ];
    var TRAVEL = [
      { k:'travelCity', label:'Travelling to', type:'select', options:[] },
      { k:'travelFrom', label:'Arrival', type:'date', value:ME.travelFrom },
      { k:'travelTo',   label:'Departure', type:'date', value:ME.travelTo }
    ];
    var BASIC = [
      { k:'ageMin', label:'Minimum age', type:'number', value:28 },
      { k:'ageMax', label:'Maximum age', type:'number', value:44 },
      { k:'city',   label:'Their city', type:'select', options:[] },
      { k:'intent', label:'Their intent', type:'select', options:['Any'].concat(INTENTS) },
      { k:'duration', label:'Their duration', type:'select', options:['Any'].concat(DURATIONS) },
      { k:'mode',   label:'Their situation', type:'select',
        options:['Any','Local','Visiting soon',"I'm traveling"] }
    ];
    var ADVANCED = [
      { k:'smoking', label:'Smoking', type:'select', options:['Any','No','Occasionally'] },
      { k:'fitness', label:'Fitness', type:'select', options:['Any','Often','Sometimes','Rarely'] },
      { k:'language', label:'Speaks', type:'select', options:[] },
      { k:'social', label:'Social lifestyle', type:'select', options:['Any','Small rooms','Large rooms'] },
      { k:'comms', label:'Communication', type:'select', options:['Any','Direct','Considered','Warm'] },
      { k:'interest', label:'Interested in', type:'select', options:[] },
      { k:'style', label:'Relationship style', type:'select', options:['Any'].concat(STYLES) }
    ];
    var cities = PEOPLE.map(function (p) { return p.city; })
      .concat([ME.city, ME.travelCity])
      .filter(function (v, i, a) { return a.indexOf(v) === i; }).sort();
    var langs = PEOPLE.reduce(function (a, p) { return a.concat(p.languages); }, [])
      .filter(function (v, i, a) { return a.indexOf(v) === i; }).sort();
    var ints = PEOPLE.reduce(function (a, p) { return a.concat(p.interests); }, [])
      .filter(function (v, i, a) { return a.indexOf(v) === i; }).sort();
    WHEN[2].options = cities; WHEN[2].value = ME.city;
    TRAVEL[0].options = cities; TRAVEL[0].value = ME.travelCity;
    BASIC[2].options = ['Any'].concat(cities);
    ADVANCED[2].options = ['Any'].concat(langs);
    ADVANCED[5].options = ['Any'].concat(ints);

    /* -- filtering ---------------------------------------------------------- */
    function passes(p) {
      var b = STATE.basic, a = STATE.advanced;
      if (STATE.verifiedOnly && !p.verified) return false;
      if (STATE.savedOnly && !SAVED[p.id]) return false;
      if (STATE.overlapOnly && !p.overlap) return false;
      if (b.ageMin && p.age < +b.ageMin) return false;
      if (b.ageMax && p.age > +b.ageMax) return false;
      if (b.city && b.city !== 'Any' && p.city !== b.city) return false;
      if (b.intent && b.intent !== 'Any' && p.intent !== b.intent) return false;
      if (b.duration && b.duration !== 'Any' && p.duration !== b.duration) return false;
      if (b.mode && b.mode !== 'Any' && p.mode !== b.mode) return false;
      if (a.smoking && a.smoking !== 'Any' && p.smoking !== a.smoking) return false;
      if (a.fitness && a.fitness !== 'Any' && p.fitness !== a.fitness) return false;
      if (a.language && a.language !== 'Any' && p.languages.indexOf(a.language) < 0) return false;
      if (a.social && a.social !== 'Any' && p.social !== a.social) return false;
      if (a.comms && a.comms !== 'Any' && p.comms !== a.comms) return false;
      if (a.interest && a.interest !== 'Any' && p.interests.indexOf(a.interest) < 0) return false;
      if (a.style && a.style !== 'Any' && p.styles.indexOf(a.style) < 0) return false;
      if (STATE.q) {
        var hay = (p.name + ' ' + p.city + ' ' + p.country + ' ' + p.intent + ' ' +
                   p.interests.join(' ') + ' ' + p.languages.join(' ')).toLowerCase();
        if (hay.indexOf(STATE.q.toLowerCase()) < 0) return false;
      }
      return true;
    }
    function inSection(p) {
      var w = myWindow();
      switch (STATE.section) {
        case 'best':   return p.score >= 80;
        case 'dates':  return p.overlap && p.overlap.days >= 7;
        case 'nearby': return p.city === w.city;
        case 'travel': return /travel|visit/i.test(p.mode) || ME.travel;
        case 'active': return p.active <= 2;
        case 'saved':  return !!SAVED[p.id];
        default:       return p.overlap && d(p.from) <= t0 && d(p.to) >= t0;   // available now
      }
    }
    function results() {
      return PEOPLE.filter(function (p) { return passes(p) && inSection(p); })
                   .sort(function (x, y) { return y.score - x.score; });
    }

    /* -- what the timing actually says --------------------------------------- */
    function timingLine(p) {
      if (!p.overlap) return 'No overlap with your dates';
      var n = p.overlap.days;
      var q = n >= 10 ? 'Great timing match' : n >= 5 ? 'Workable overlap' : 'Narrow overlap';
      return q + ' · ' + n + ' day' + (n === 1 ? '' : 's') + ', ' + fmt(p.overlap.from) + '–' + fmt(p.overlap.to);
    }
    function insight(p) {
      var bits = [];
      if (p.overlap) bits.push('you are both free for ' + p.overlap.days + ' of the same days (' +
        fmt(p.overlap.from) + '–' + fmt(p.overlap.to) + ')');
      else bits.push('your dates do not currently meet, which is the first thing to fix');
      var w = myWindow();
      if (p.city === w.city) bits.push('you are both in ' + p.city);
      else bits.push('she is in ' + p.city + ' and you are in ' + w.city);
      if (ME.intent && p.intent === ME.intent) bits.push('you are asking for the same thing');
      else if (ME.intent) bits.push('she is looking for ' + p.intent.toLowerCase() + ', where you have said ' + ME.intent.toLowerCase());
      var shared = p.interests.filter(function (i) { return ME.interests.indexOf(i) > -1; });
      if (shared.length) bits.push('you share ' + shared.slice(0, 3).join(', ').toLowerCase());
      return 'You and ' + p.name + ': ' + bits.join('; ') + '.';
    }
    var ASK = [
      { q:'Why this match?', a:insight },
      { q:'What should I talk about first?', a:function (p) {
          var shared = p.interests.filter(function (i) { return ME.interests.indexOf(i) > -1; });
          return (shared.length ? 'Start with ' + shared[0].toLowerCase() + ' — it is on both files, so it is not a guess. '
                                : 'You share no stated interest, so ask rather than assume. ') +
                 'Then the dates: she is open ' + fmt(p.from) + '–' + fmt(p.to) + ', and being plain about that early is the whole advantage of this track.'; } },
      { q:'Give me a good opening.', a:function (p) {
          var shared = p.interests.filter(function (i) { return ME.interests.indexOf(i) > -1; });
          return '"' + (shared.length
            ? 'I see we both put ' + shared[0].toLowerCase() + ' down. I am free ' + fmt(p.overlap ? p.overlap.from : ME.from) + ' onwards — would you like dinner in that window?'
            : 'Our dates line up more than most. I am free ' + fmt(ME.from) + '–' + fmt(ME.to) + ' — would dinner suit?') + '"'; } },
      { q:'How was this figure worked out?', a:function (p) {
          return 'Eight factors, weighted for a short-term search: ' + Object.keys(WEIGHTS).map(function (k) {
            return LABELS[k].toLowerCase() + ' ' + WEIGHTS[k]; }).join(', ') +
            '. Intent, timing and location carry sixty of the hundred, which is the difference between this page and the long-term one.'; } }
    ];

    /* -- rendering ------------------------------------------------------------ */
    var grid = $('#stm-grid'), empty = $('#stm-empty'), moreBtn = $('#stm-more'), shownP = $('#stm-shown');
    var live = el('p', 'sr-only'); live.setAttribute('role','status'); live.setAttribute('aria-live','polite');
    stmView.appendChild(live);
    function announce(t) { live.textContent = t; }

    function card(p) {
      var a = el('article', 'ltr-card stm-card' + (SAVED[p.id] ? ' is-saved' : ''));
      var img = el('img', 'ltr-card__plate');
      img.src = MATCH.plate(p.id + p.name); img.alt = ''; img.setAttribute('aria-hidden','true'); img.loading = 'lazy';
      a.appendChild(img);

      var body = el('div', 'ltr-card__body');
      body.appendChild(MATCH.badge(p.verified));
      body.appendChild(el('h3', 'ltr-card__name', p.name + ', ' + p.age));
      body.appendChild(el('p', 'ltr-card__where', p.city + ', ' + p.country + ' · ' + p.mode));

      // dates lead on this card, where values lead on the long-term one
      var av = el('div', 'stm-when' + (p.overlap ? '' : ' stm-when--none'));
      av.appendChild(el('span', 'stm-when__d', 'Available ' + fmt(p.from) + '–' + fmt(p.to)));
      av.appendChild(el('span', 'stm-when__o', timingLine(p)));
      body.appendChild(av);

      body.appendChild(el('p', 'ltr-card__goal', p.intent + ' · ' + p.duration));

      var sc = el('div', 'ltr-score');
      sc.appendChild(el('span', 'ltr-score__n', p.score + '%'));
      sc.appendChild(el('span', 'ltr-score__l', 'Compatibility'));
      var bar = el('span', 'ltr-score__bar'); var fill = el('span');
      fill.style.width = p.score + '%'; bar.appendChild(fill); sc.appendChild(bar);
      body.appendChild(sc);

      body.appendChild(el('p', 'ltr-card__tags', p.interests.slice(0, 4).join(' · ')));
      body.appendChild(el('p', 'ltr-card__seen',
        (STATUS[p.id] === 'connected' ? 'Connected · ' : STATUS[p.id] === 'sent' ? 'Request sent · ' : '') +
        (p.active === 0 ? 'Active today' : 'Active ' + p.active + ' day' + (p.active === 1 ? '' : 's') + ' ago')));

      var acts = el('div', 'ltr-card__acts');
      var view = el('button', 'btn'); view.type = 'button';
      view.appendChild(el('span', null, 'View profile')); view.appendChild(el('i', 'arrow'));
      view.addEventListener('click', function () { openSheet(p); });
      var save = el('button', 'ltr-heart'); save.type = 'button';
      save.setAttribute('aria-pressed', SAVED[p.id] ? 'true' : 'false');
      save.setAttribute('aria-label', (SAVED[p.id] ? 'Remove ' : 'Save ') + p.name);
      save.textContent = SAVED[p.id] ? '♥' : '♡';
      save.addEventListener('click', function () {
        SAVED[p.id] = !SAVED[p.id]; render();
        announce((SAVED[p.id] ? 'Saved ' : 'Removed ') + p.name + '.');
      });
      acts.appendChild(view); acts.appendChild(save);
      body.appendChild(acts);
      a.appendChild(body);
      return a;
    }

    function render() {
      recompute();
      var all = results(), page = all.slice(0, STATE.shown);
      grid.textContent = '';
      page.forEach(function (p) { grid.appendChild(card(p)); });
      empty.hidden = all.length > 0;
      moreBtn.hidden = all.length <= STATE.shown;
      shownP.textContent = all.length ? 'Showing ' + page.length + ' of ' + all.length + ' in this group.' : '';
      var w = myWindow();
      $('#stm-count').textContent = PEOPLE.filter(passes).length;
      $('#stm-where').textContent = w.city + (ME.travel ? ' (travel)' : '');
      $('#stm-when').textContent = fmt(w.from) + '–' + fmt(w.to);
      $('#stm-verified').textContent = STATE.verifiedOnly ? 'Verified only' : 'All members';
      var pill = $('#stm-intent-pill');
      pill.textContent = ME.intent ? ME.intent : 'Intent required';
      pill.className = 'pill ' + (ME.intent ? 'pill--rest' : 'pill--action');
      $$('#stm-sections button').forEach(function (b) {
        b.setAttribute('aria-selected', b.getAttribute('data-section') === STATE.section ? 'true' : 'false');
      });
    }

    /* -- the profile ---------------------------------------------------------- */
    var sheet = $('#ltr-sheet'), sheetBody = $('#ltr-sheet-body'), lastFocus = null;
    function bars(p) {
      var wrap = el('div', 'ltr-bars');
      Object.keys(p.factors).forEach(function (k) {
        var row = el('div', 'ltr-bars__row');
        row.appendChild(el('span', 'k', LABELS[k]));
        var b = el('span', 'b'); var f = el('i'); f.style.width = p.factors[k] + '%'; b.appendChild(f);
        row.appendChild(b); row.appendChild(el('span', 'v', p.factors[k] + '%'));
        wrap.appendChild(row);
      });
      return wrap;
    }
    function openSheet(p) {
      lastFocus = document.activeElement;
      sheetBody.textContent = '';

      var head = el('div', 'ltr-sheet__head');
      var img = el('img', 'ltr-sheet__plate'); img.src = MATCH.plate(p.id + p.name);
      img.alt = ''; img.setAttribute('aria-hidden','true'); head.appendChild(img);
      var hb = el('div');
      if (p.verified) hb.appendChild(MATCH.badge(true));
      var h = el('h2', null, p.name + ', ' + p.age); h.id = 'ltr-sheet-name'; hb.appendChild(h);
      hb.appendChild(el('p', 'ltr-sheet__where', p.city + ', ' + p.country + ' · ' + p.mode));
      hb.appendChild(el('p', 'ltr-sheet__score', p.score + '% compatible · ' + timingLine(p)));
      head.appendChild(hb);
      sheetBody.appendChild(head);

      var acts = el('div', 'ltr-sheet__acts');
      var connect = el('button', 'btn btn--solid'); connect.type = 'button';
      var msg = el('button', 'btn'); msg.type = 'button'; msg.appendChild(el('span', null, 'Message'));
      var save2 = el('button', 'btn'); save2.type = 'button';
      var report = el('button', 'btn btn--quiet', 'Report'); report.type = 'button';
      var block = el('button', 'btn btn--quiet', 'Block'); block.type = 'button';
      function paint() {
        connect.textContent = STATUS[p.id] === 'connected' ? 'Connected'
          : STATUS[p.id] === 'sent' ? 'Request sent' : 'Connect';
        connect.disabled = !!STATUS[p.id];
        msg.hidden = STATUS[p.id] !== 'connected';
        save2.textContent = SAVED[p.id] ? '♥ Saved' : '♡ Save';
      }
      var box = el('div', 'ltr-connect'); box.hidden = true;
      connect.addEventListener('click', function () {
        box.hidden = false; box.textContent = '';
        box.appendChild(el('p', 'ask__lbl', 'Connect with ' + p.name));
        // the overlap, spelled out, because it is the thing being agreed
        var w = myWindow();
        var dl = el('dl', 'kv');
        [['Your availability', fmt(w.from) + '–' + fmt(w.to)],
         ['Her availability', fmt(p.from) + '–' + fmt(p.to)],
         ['Shared', p.overlap ? fmt(p.overlap.from) + '–' + fmt(p.overlap.to) + ' · ' + p.overlap.days + ' days' : 'None — the dates do not meet']]
          .forEach(function (r) { dl.appendChild(el('dt', null, r[0])); dl.appendChild(el('dd', null, r[1])); });
        box.appendChild(dl);
        var ta = el('textarea'); ta.rows = 3; ta.placeholder = 'Optional message';
        ta.setAttribute('aria-label', 'Optional message to ' + p.name);
        box.appendChild(ta);
        var send = el('button', 'btn btn--solid', 'Send connection request'); send.type = 'button';
        send.addEventListener('click', function () {
          STATUS[p.id] = 'sent'; box.textContent = '';
          box.appendChild(el('p', 'ltr-sent', 'Request sent.' + (p.overlap
            ? ' If she accepts you have ' + p.overlap.days + ' days in common, and the conversation opens on those dates.'
            : ' Your dates do not currently meet, and she is shown that too — one of you would have to move.')));
          paint(); render(); announce('Connection request sent to ' + p.name + '.');
        });
        box.appendChild(send); ta.focus();
      });
      save2.addEventListener('click', function () { SAVED[p.id] = !SAVED[p.id]; paint(); render(); });
      msg.addEventListener('click', function () { location.hash = '#messages'; });
      report.addEventListener('click', function () {
        box.hidden = false; box.textContent = '';
        box.appendChild(el('p', 'ask__lbl', 'Report ' + p.name));
        var sel = el('select');
        ['Fake profile','Misrepresentation','Harassment','Scam or fraud','Inappropriate behaviour','Safety concern','Other']
          .forEach(function (o) { var op = el('option', null, o); op.value = o; sel.appendChild(op); });
        sel.setAttribute('aria-label', 'Reason for reporting'); box.appendChild(sel);
        var ta = el('textarea'); ta.rows = 3; ta.placeholder = 'Anything you would like the house to know';
        ta.setAttribute('aria-label','Details'); box.appendChild(ta);
        var send = el('button', 'btn btn--solid', 'Send to the house'); send.type = 'button';
        send.addEventListener('click', function () {
          box.textContent = '';
          box.appendChild(el('p', 'ltr-sent', 'Read by a person today, not a queue. You are told what was done, and she is never told who reported her.'));
        });
        box.appendChild(send);
      });
      block.addEventListener('click', function () {
        STATUS[p.id] = 'blocked';
        note(block, p.name + ' is blocked. She is not shown to you again, is not told, and any request between you is withdrawn.');
      });
      [connect, msg, save2, report, block].forEach(function (b) { acts.appendChild(b); });
      paint();
      sheetBody.appendChild(acts);
      sheetBody.appendChild(box);

      var about = el('div', 'panel');
      about.appendChild(headOf('What ' + p.name + ' is looking for'));
      var ab = el('div', 'panel__body');
      ab.appendChild(el('p', 'ltr-about', p.looking));
      var dl2 = el('dl', 'kv');
      [['Intent', p.intent], ['Duration', p.duration], ['Style', p.styles.join(', ')],
       ['Available', fmt(p.from) + ' – ' + fmt(p.to)], ['Situation', p.mode],
       ['Interests', p.interests.join(', ')], ['Languages', p.languages.join(', ')],
       ['Smoking', p.smoking], ['Fitness', p.fitness]]
        .forEach(function (r) { dl2.appendChild(el('dt', null, r[0])); dl2.appendChild(el('dd', null, r[1])); });
      ab.appendChild(dl2);
      ab.appendChild(el('div', 'note-inline',
        'A city, never an address. Her availability closes on its own end date rather than staying up until she remembers to take it down.'));
      about.appendChild(ab);
      sheetBody.appendChild(about);

      var why = el('div', 'panel');
      why.appendChild(headOf('Compatibility', p.score + '% overall'));
      var wb = el('div', 'panel__body');
      wb.appendChild(bars(p));
      var strong = [];
      if (p.overlap && p.overlap.days >= 7) strong.push('Your dates overlap by ' + p.overlap.days + ' days');
      if (ME.intent && p.intent === ME.intent) strong.push('Same relationship intent');
      if (p.city === myWindow().city) strong.push('Same city for the period');
      var shared = p.interests.filter(function (i) { return ME.interests.indexOf(i) > -1; });
      if (shared.length) strong.push('Shared interests: ' + shared.join(', '));
      if (strong.length) {
        wb.appendChild(el('p', 'ask__lbl', 'Strong matches'));
        var ul = el('ul', 'includes');
        strong.forEach(function (t) { ul.appendChild(el('li', null, t)); });
        wb.appendChild(ul);
      }
      var weak = Object.keys(p.factors).filter(function (k) { return p.factors[k] < 75; });
      if (weak.length) {
        wb.appendChild(el('p', 'ask__lbl', 'Worth raising early'));
        var ul2 = el('ul', 'includes includes--not');
        weak.forEach(function (k) { ul2.appendChild(el('li', null, LABELS[k] + ' — ' + p.factors[k] + '%')); });
        wb.appendChild(ul2);
      }
      why.appendChild(wb);
      sheetBody.appendChild(why);

      var ai = el('div', 'panel');
      ai.appendChild(headOf('Ask Legend about this match', 'Reads both files'));
      var aib = el('div', 'panel__body');
      aib.appendChild(el('p', 'ltr-insight', insight(p)));
      var thread = el('div', 'ltr-ai-thread'); aib.appendChild(thread);
      var chips = el('div', 'ask__chips');
      ASK.forEach(function (item) {
        var b = el('button', null, item.q); b.type = 'button';
        b.addEventListener('click', function () {
          thread.appendChild(el('p', 'ltr-ai-q', item.q));
          thread.appendChild(el('p', 'ltr-ai-a', item.a(p)));
          b.remove();
        });
        chips.appendChild(b);
      });
      aib.appendChild(chips);
      aib.appendChild(el('p', 'quiet', 'Written rules over the two files, not a language model, and nothing here is sent anywhere.'));
      ai.appendChild(aib);
      sheetBody.appendChild(ai);

      sheet.hidden = false;
      document.body.style.overflow = 'hidden';
      $('.ltr-sheet__close', sheet).focus();
    }

    /* -- controls -------------------------------------------------------------- */
    function chipRow(host, list, current, multi, onPick) {
      var wrap = $(host);
      list.forEach(function (v) {
        var on = multi ? current.indexOf(v) > -1 : current === v;
        var b = el('button', 'chip' + (on ? ' is-on' : ''), v);
        b.type = 'button';
        b.setAttribute('role', multi ? 'checkbox' : 'radio');
        b.setAttribute(multi ? 'aria-checked' : 'aria-checked', on ? 'true' : 'false');
        b.addEventListener('click', function () {
          if (multi) {
            var ix = current.indexOf(v);
            if (ix > -1) current.splice(ix, 1); else current.push(v);
            b.classList.toggle('is-on');
            b.setAttribute('aria-checked', current.indexOf(v) > -1 ? 'true' : 'false');
          } else {
            $$('button', wrap).forEach(function (o) {
              o.classList.toggle('is-on', o === b);
              o.setAttribute('aria-checked', o === b ? 'true' : 'false');
            });
          }
          onPick(v); STATE.shown = 6; render();
        });
        wrap.appendChild(b);
      });
    }
    chipRow('#stm-intents', INTENTS, ME.intent, false, function (v) {
      ME.intent = v; announce('Your intent is now ' + v + '.');
    });
    chipRow('#stm-durations', DURATIONS, ME.duration, false, function (v) { ME.duration = v; });
    chipRow('#stm-styles', STYLES, ME.styles, true, function () {});

    function build(list, host, store, prefix) {
      var wrap = $(host);
      list.forEach(function (def) {
        wrap.appendChild(field(def, store, function () { STATE.shown = 6; render(); }, prefix));
      });
    }
    build(WHEN, '#stm-when-fields', ME, 'stm-when');
    build(TRAVEL, '#stm-travel-fields', ME, 'stm-travel');
    build(BASIC, '#stm-basic', STATE.basic, 'stm');
    build(ADVANCED, '#stm-advanced', STATE.advanced, 'stm-a');

    var sectionsWrap = $('#stm-sections');
    SECTIONS.forEach(function (s) {
      var b = el('button'); b.type = 'button';
      b.setAttribute('data-section', s.id); b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', s.id === STATE.section ? 'true' : 'false');
      b.appendChild(el('span', 'ltr-tab__l', s.label));
      b.appendChild(el('span', 'ltr-tab__n', s.note));
      b.addEventListener('click', function () { STATE.section = s.id; STATE.shown = 6; render(); });
      sectionsWrap.appendChild(b);
    });

    $('#stm-travel-on').addEventListener('change', function () {
      ME.travel = this.checked;
      $('#stm-travel-fields').hidden = !this.checked;
      STATE.shown = 6; render();
      announce(this.checked ? 'Travel mode on. Matches are for ' + ME.travelCity + '.' : 'Travel mode off.');
    });
    $('#stm-q').addEventListener('input', function () { STATE.q = this.value.trim(); STATE.shown = 6; render(); });
    $('#stm-verified-only').addEventListener('change', function () { STATE.verifiedOnly = this.checked; render(); });
    $('#stm-overlap-only').addEventListener('change', function () { STATE.overlapOnly = this.checked; render(); });
    $('#stm-saved-only').addEventListener('change', function () { STATE.savedOnly = this.checked; render(); });
    moreBtn.addEventListener('click', function () { STATE.shown += 6; render(); });
    $('#stm-clear').addEventListener('click', function () {
      STATE.q = ''; STATE.basic = {}; STATE.advanced = {};
      STATE.verifiedOnly = STATE.overlapOnly = STATE.savedOnly = false; STATE.shown = 6;
      $('#stm-q').value = '';
      ['#stm-verified-only','#stm-overlap-only','#stm-saved-only'].forEach(function (s) { $(s).checked = false; });
      $('#stm-basic').textContent = ''; $('#stm-advanced').textContent = '';
      build(BASIC, '#stm-basic', STATE.basic, 'stm');
      build(ADVANCED, '#stm-advanced', STATE.advanced, 'stm-a');
      render(); announce('Filters cleared.');
    });

    render();
  })();

  /* --- Casual dating: curated, private, and explicit about expectations -----
     Not a feed. The house proposes a few people rather than many, so there is
     no infinite scroll and no swipe: the two verbs here are read the profile
     and request a connection. Expectations are stated by both sides and
     compared before a request can be sent, because the failure mode on this
     track is not a bad match — it is two people who wanted different things
     and never said so.                                                       */
  var casView = $('#view-find-casual');
  if (casView && typeof MATCH !== 'undefined') (function () {
    var el = MATCH.el, field = MATCH.field, headOf = MATCH.head;

    var WEIGHTS = {
      intent: 25, lifestyle: 20, location: 15, availability: 15,
      communication: 10, interests: 5, persona: 5, verification: 5
    };
    var LABELS = {
      intent:'Dating intent', lifestyle:'Lifestyle', location:'Location',
      availability:'Availability', communication:'Communication style',
      interests:'Interests', persona:'Persona', verification:'Verification'
    };

    var INTENTS = ['Casual Dating','Casual Connection','Social Dating',
                   'Romantic Connection','Short-Term Dating','Open to Exploring'];
    var EXPECT  = ['No Long-Term Commitment','Open to Something More',
                   'Exclusive During Dating','Non-Exclusive','Flexible'];
    var AVAIL   = ['Available Now','This Week','This Weekend','Flexible'];
    var LIFESTYLES = ['Social','Fitness','Travel','Business','Arts & Culture','Dining','Nightlife'];

    var ME = {
      intent: null, expect: 'No Long-Term Commitment', avail: 'This Week',
      city: 'Munich', country: 'Germany',
      interests: ['Fine Dining','Art','Travel','Culture'],
      lifestyle: 'Arts & Culture', comms: 'Direct',
      privateProfile: false
    };

    /* -- the house's own curation. A short list, by design. ----------------- */
    var PEOPLE = [
      { id:'c1', name:'Sophia', age:34, city:'Munich', country:'Germany', verified:true,
        intent:'Casual Dating', expect:'No Long-Term Commitment', avail:'This Week',
        lifestyle:'Arts & Culture', comms:'Direct', active:0,
        interests:['Travel','Art','Fine Dining','Culture'],
        about:'Two evenings a week that are mine, and a preference for spending them somewhere good.',
        f:{ lifestyle:94, communication:92, interests:95, persona:90 } },

      { id:'c2', name:'Valentina', age:31, city:'Munich', country:'Germany', verified:true,
        intent:'Social Dating', expect:'Flexible', avail:'This Weekend',
        lifestyle:'Social', comms:'Warm', active:0,
        interests:['Dining','Music','Fashion','Travel'],
        about:'Out most weekends and would rather be out with someone worth talking to.',
        f:{ lifestyle:82, communication:85, interests:78, persona:80 } },

      { id:'c3', name:'Amelie', age:36, city:'Vienna', country:'Austria', verified:true,
        intent:'Casual Connection', expect:'No Long-Term Commitment', avail:'Flexible',
        lifestyle:'Arts & Culture', comms:'Considered', active:1,
        interests:['Art','Culture','Fine Dining','Music'],
        about:'Clear that this is not going anywhere, and entirely serious about it being good anyway.',
        f:{ lifestyle:90, communication:88, interests:92, persona:89 } },

      { id:'c4', name:'Renata', age:33, city:'Munich', country:'Germany', verified:true,
        intent:'Romantic Connection', expect:'Open to Something More', avail:'Available Now',
        lifestyle:'Fitness', comms:'Direct', active:0,
        interests:['Sports','Travel','Dining','Wellness'],
        about:'Up at five, and honest that she is open to this turning into something.',
        f:{ lifestyle:74, communication:86, interests:70, persona:76 } },

      { id:'c5', name:'Léa', age:29, city:'Zurich', country:'Switzerland', verified:true,
        intent:'Casual Dating', expect:'Non-Exclusive', avail:'This Week',
        lifestyle:'Business', comms:'Direct', active:2,
        interests:['Business','Travel','Fine Dining','Fashion'],
        about:'Travels for work three weeks in four and says so before the first dinner.',
        f:{ lifestyle:78, communication:84, interests:80, persona:77 } },

      { id:'c6', name:'Marta', age:38, city:'Munich', country:'Germany', verified:false,
        intent:'Open to Exploring', expect:'Flexible', avail:'Flexible',
        lifestyle:'Nightlife', comms:'Warm', active:4,
        interests:['Nightlife','Music','Fashion','Dining'],
        about:'Not sure what she wants, and would rather explore than pretend otherwise.',
        f:{ lifestyle:66, communication:75, interests:64, persona:68 } },

      { id:'c7', name:'Nour', age:32, city:'Munich', country:'Germany', verified:true,
        intent:'Casual Dating', expect:'Exclusive During Dating', avail:'This Weekend',
        lifestyle:'Arts & Culture', comms:'Considered', active:1,
        interests:['Art','Fine Dining','Culture','Travel'],
        about:'Nothing permanent, but exclusive while it lasts, and firm about that.',
        f:{ lifestyle:92, communication:87, interests:94, persona:88 } },

      { id:'c8', name:'Giulia', age:35, city:'Milan', country:'Italy', verified:true,
        intent:'Short-Term Dating', expect:'No Long-Term Commitment', avail:'Flexible',
        lifestyle:'Dining', comms:'Warm', active:3,
        interests:['Fine Dining','Fashion','Art','Travel'],
        about:'In Munich often enough for this to be reasonable, and never for long.',
        f:{ lifestyle:85, communication:83, interests:88, persona:84 } }
    ];

    /* -- factors ------------------------------------------------------------ */
    function intentFit(p) {
      if (!ME.intent) return 75;
      if (p.intent === ME.intent) return 100;
      var near = { 'Casual Dating':['Casual Connection','Short-Term Dating'],
                   'Casual Connection':['Casual Dating','Social Dating'],
                   'Social Dating':['Casual Connection'],
                   'Romantic Connection':['Short-Term Dating'],
                   'Short-Term Dating':['Casual Dating','Romantic Connection'],
                   'Open to Exploring':[] };
      if ((near[ME.intent] || []).indexOf(p.intent) > -1) return 82;
      if (p.intent === 'Open to Exploring') return 66;
      return 52;
    }
    // Expectations are the thing people get wrong on this track, so they are
    // compared as a rule rather than folded into a number and forgotten.
    function expectationsAgree(p) {
      if (p.expect === ME.expect) return true;
      var compatible = {
        'No Long-Term Commitment': ['Non-Exclusive','Flexible','Exclusive During Dating'],
        'Open to Something More':  ['Flexible','Exclusive During Dating'],
        'Exclusive During Dating': ['No Long-Term Commitment','Open to Something More','Flexible'],
        'Non-Exclusive':           ['No Long-Term Commitment','Flexible'],
        'Flexible':                EXPECT
      };
      return (compatible[ME.expect] || []).indexOf(p.expect) > -1;
    }
    function availFit(p) {
      if (p.avail === ME.avail) return 100;
      if (p.avail === 'Flexible' || ME.avail === 'Flexible') return 84;
      if (p.avail === 'Available Now') return 78;
      return 62;
    }
    function locationFit(p) {
      if (p.city === ME.city) return 100;
      if (p.country === ME.country) return 74;
      return 55;
    }
    function factorsOf(p) {
      return { intent: intentFit(p), lifestyle: p.f.lifestyle, location: locationFit(p),
               availability: availFit(p), communication: p.f.communication,
               interests: p.f.interests, persona: p.f.persona,
               verification: p.verified ? 100 : 40 };
    }
    function scoreOf(f) {
      var t = 0, s = 0;
      Object.keys(WEIGHTS).forEach(function (k) { t += WEIGHTS[k]; s += WEIGHTS[k] * (f[k] || 0); });
      return Math.round(s / t);
    }
    function recompute() {
      PEOPLE.forEach(function (p) {
        p.factors = factorsOf(p); p.score = scoreOf(p.factors);
        p.agree = expectationsAgree(p);
      });
    }

    var STATE = { q:'', verifiedOnly:true, intentOnly:false, section:'curated', filters:{} };
    var SHORT = {}, STATUS = {};
    var PRIVACY = {};

    // Curated means curated: each group is capped, and the cap is stated.
    var SECTIONS = [
      { id:'curated', label:'Curated for you', note:'Chosen by your advisor', cap:3 },
      { id:'compat',  label:'Highly compatible', note:'Ninety per cent and above', cap:4 },
      { id:'avail',   label:'Recently available', note:'Free now or this week', cap:4 },
      { id:'near',    label:'Nearby', note:'In your city', cap:4 },
      { id:'new',     label:'New verified members', note:'Checked in the last month', cap:4 },
      { id:'short',   label:'Private shortlist', note:'Yours alone', cap:12 }
    ];

    var WHERE = [
      { k:'city', label:'Your city', type:'select', options:[], value:ME.city },
      { k:'lifestyle', label:'Your lifestyle', type:'select', options:LIFESTYLES, value:ME.lifestyle }
    ];
    var PRIV = [
      { k:'profile', label:'Profile visible to', type:'select',
        options:['Curated matches only','Members I have accepted','Nobody until I ask'] },
      { k:'photo', label:'Photograph visible to', type:'select',
        options:['Members I have accepted','Curated matches only','Nobody until I ask'] },
      { k:'contact', label:'Who can contact me', type:'select',
        options:['Curated matches only','Verified members','Nobody until I ask'] },
      { k:'location', label:'Location shown as', type:'select', options:['City only','Country only','Hidden'] },
      { k:'online', label:'Online status', type:'select', options:['Hidden','Shown to accepted members'] },
      { k:'activity', label:'Activity status', type:'select', options:['Hidden','Shown to accepted members'] },
      { k:'persona', label:'Persona visible to', type:'select',
        options:['Nobody','Members I have accepted','Curated matches only'] }
    ];
    var FILTERS = [
      { k:'ageMin', label:'Minimum age', type:'number', value:28 },
      { k:'ageMax', label:'Maximum age', type:'number', value:42 },
      { k:'city', label:'Their city', type:'select', options:[] },
      { k:'intent', label:'Their intent', type:'select', options:['Any'].concat(INTENTS) },
      { k:'avail', label:'Their availability', type:'select', options:['Any'].concat(AVAIL) },
      { k:'lifestyle', label:'Their lifestyle', type:'select', options:['Any'].concat(LIFESTYLES) }
    ];
    var cities = PEOPLE.map(function (p) { return p.city; }).concat([ME.city])
      .filter(function (v, i, a) { return a.indexOf(v) === i; }).sort();
    WHERE[0].options = cities;
    FILTERS[2].options = ['Any'].concat(cities);

    function passes(p) {
      var f = STATE.filters;
      if (STATE.verifiedOnly && !p.verified) return false;
      if (STATE.intentOnly && !p.agree) return false;
      if (f.ageMin && p.age < +f.ageMin) return false;
      if (f.ageMax && p.age > +f.ageMax) return false;
      if (f.city && f.city !== 'Any' && p.city !== f.city) return false;
      if (f.intent && f.intent !== 'Any' && p.intent !== f.intent) return false;
      if (f.avail && f.avail !== 'Any' && p.avail !== f.avail) return false;
      if (f.lifestyle && f.lifestyle !== 'Any' && p.lifestyle !== f.lifestyle) return false;
      if (STATE.q) {
        var hay = (p.name + ' ' + p.city + ' ' + p.country + ' ' + p.intent + ' ' +
                   p.lifestyle + ' ' + p.interests.join(' ')).toLowerCase();
        if (hay.indexOf(STATE.q.toLowerCase()) < 0) return false;
      }
      return true;
    }
    function inSection(p) {
      switch (STATE.section) {
        case 'compat': return p.score >= 90;
        case 'avail':  return p.avail === 'Available Now' || p.avail === 'This Week';
        case 'near':   return p.city === ME.city;
        case 'new':    return p.verified && p.active <= 1;
        case 'short':  return !!SHORT[p.id];
        default:       return p.agree;                    // curated: expectations must meet
      }
    }
    function section() { return SECTIONS.filter(function (s) { return s.id === STATE.section; })[0]; }
    function results() {
      var s = section();
      return PEOPLE.filter(function (p) { return passes(p) && inSection(p); })
                   .sort(function (x, y) { return y.score - x.score; })
                   .slice(0, s.cap);
    }

    /* -- the sentence behind the number -------------------------------------- */
    function insight(p) {
      var bits = [];
      bits.push(ME.intent && p.intent === ME.intent
        ? 'you are both here for ' + p.intent.toLowerCase()
        : 'she is here for ' + p.intent.toLowerCase() + (ME.intent ? ', where you have said ' + ME.intent.toLowerCase() : ''));
      bits.push(p.agree ? 'your expectations agree' : 'your expectations differ, and that is worth settling first');
      if (p.city === ME.city) bits.push('you are both in ' + p.city);
      var shared = p.interests.filter(function (i) { return ME.interests.indexOf(i) > -1; });
      if (shared.length) bits.push('you share ' + shared.slice(0, 3).join(', ').toLowerCase());
      return 'You and ' + p.name + ': ' + bits.join('; ') + '.';
    }
    var ASK = [
      { q:'Why might we be compatible?', a:insight },
      { q:'What do we have in common?', a:function (p) {
          var shared = p.interests.filter(function (i) { return ME.interests.indexOf(i) > -1; });
          return (shared.length ? 'On the files: ' + shared.join(', ') + '. ' : 'Nothing on the files overlaps, which is not fatal but is worth knowing. ') +
                 (p.lifestyle === ME.lifestyle ? 'You also live the same way — both ' + p.lifestyle.toLowerCase() + '. ' : 'She lives differently: ' + p.lifestyle.toLowerCase() + ' where you are ' + ME.lifestyle.toLowerCase() + '. ') +
                 (p.comms === ME.comms ? 'And you talk the same way.' : 'She is ' + p.comms.toLowerCase() + ' in conversation where you are ' + ME.comms.toLowerCase() + '.'); } },
      { q:'How should I start the conversation?', a:function (p) {
          var shared = p.interests.filter(function (i) { return ME.interests.indexOf(i) > -1; });
          return 'Say what you are here for in the first message — she has, and this track only works if both people do. ' +
                 (shared.length ? 'Then ' + shared[0].toLowerCase() + ', which is on both files. ' : '') +
                 'She is free ' + p.avail.toLowerCase() + ', so propose something real rather than asking how her week is.'; } },
      { q:'What should I know before connecting?', a:function (p) {
          if (!p.agree) return 'Her expectation is "' + p.expect + '" and yours is "' + ME.expect + '". Those do not sit together comfortably. Say so first, plainly, or do not send the request — this is the one thing that ends badly when it is left unsaid.';
          var weak = Object.keys(p.factors).filter(function (k) { return p.factors[k] < 75; });
          return 'Expectations agree: "' + p.expect + '" on both sides. ' +
                 (weak.length ? 'Weakest of the eight is ' + LABELS[weak[0]].toLowerCase() + ' at ' + p.factors[weak[0]] + ' per cent. '
                              : 'Nothing on the eight factors falls below seventy-five. ') +
                 (p.verified ? 'She is verified in person by an advisor.' : 'She is not yet verified, and until she is the house will not vouch for anything on her file.'); } },
      { q:'How was this figure worked out?', a:function () {
          return 'Eight factors, weighted for a casual search: ' + Object.keys(WEIGHTS).map(function (k) {
            return LABELS[k].toLowerCase() + ' ' + WEIGHTS[k]; }).join(', ') +
            '. Intent and lifestyle carry forty-five of the hundred; on the long-term page values and goals carry that weight instead.'; } }
    ];

    /* -- rendering ------------------------------------------------------------ */
    var grid = $('#cas-grid'), empty = $('#cas-empty'), noteP = $('#cas-note');
    var live = el('p', 'sr-only'); live.setAttribute('role','status'); live.setAttribute('aria-live','polite');
    casView.appendChild(live);
    function announce(t) { live.textContent = t; }

    // Deliberately spare: a name, a place, a figure, an intent, four interests.
    function card(p) {
      var a = el('article', 'ltr-card cas-card' + (SHORT[p.id] ? ' is-saved' : ''));
      var img = el('img', 'ltr-card__plate');
      img.src = MATCH.plate(p.id + p.name); img.alt = ''; img.setAttribute('aria-hidden','true'); img.loading = 'lazy';
      a.appendChild(img);
      var body = el('div', 'ltr-card__body');
      body.appendChild(MATCH.badge(p.verified));
      body.appendChild(el('h3', 'ltr-card__name', p.name + ', ' + p.age));
      body.appendChild(el('p', 'ltr-card__where', p.city));

      var sc = el('div', 'ltr-score');
      sc.appendChild(el('span', 'ltr-score__n', p.score + '%'));
      sc.appendChild(el('span', 'ltr-score__l', 'Match'));
      var bar = el('span', 'ltr-score__bar'); var fill = el('span');
      fill.style.width = p.score + '%'; bar.appendChild(fill); sc.appendChild(bar);
      body.appendChild(sc);

      body.appendChild(el('p', 'ltr-card__goal', p.intent));
      var av = el('p', 'cas-avail' + (p.agree ? '' : ' cas-avail--warn'),
        p.agree ? 'Available ' + p.avail.toLowerCase() : 'Expectations differ · ' + p.expect);
      body.appendChild(av);
      body.appendChild(el('p', 'ltr-card__tags', p.interests.slice(0, 4).join(' · ')));

      var acts = el('div', 'cas-acts');
      var view = el('button', 'btn'); view.type = 'button';
      view.appendChild(el('span', null, 'View profile')); view.appendChild(el('i', 'arrow'));
      view.addEventListener('click', function () { openSheet(p); });
      var req = el('button', 'btn btn--solid'); req.type = 'button';
      req.textContent = STATUS[p.id] === 'sent' ? 'Request sent' : 'Request connection';
      req.disabled = !!STATUS[p.id];
      req.addEventListener('click', function () { openSheet(p, true); });
      acts.appendChild(view); acts.appendChild(req);
      body.appendChild(acts);
      a.appendChild(body);
      return a;
    }

    function render() {
      recompute();
      var s = section(), all = results();
      grid.textContent = '';
      all.forEach(function (p) { grid.appendChild(card(p)); });
      empty.hidden = all.length > 0;
      var eligible = PEOPLE.filter(function (p) { return passes(p) && inSection(p); }).length;
      noteP.textContent = all.length
        ? s.label + ' — ' + all.length + ' of a possible ' + eligible +
          '. The house shows a few rather than many; ' + s.note.toLowerCase() + '.'
        : '';
      $('#cas-count').textContent = PEOPLE.filter(function (p) { return passes(p) && p.agree; }).length;
      $('#cas-where').textContent = ME.city;
      $('#cas-when').textContent = ME.avail;
      $('#cas-shortlist').textContent = Object.keys(SHORT).filter(function (k) { return SHORT[k]; }).length;
      var pill = $('#cas-intent-pill');
      pill.textContent = ME.intent || 'Intent required';
      pill.className = 'pill ' + (ME.intent ? 'pill--rest' : 'pill--action');
      var pp = $('#cas-privacy-pill');
      pp.textContent = ME.privateProfile ? 'Private profile' : 'Standard';
      pp.className = 'pill ' + (ME.privateProfile ? 'pill--live' : 'pill--rest');
      $$('#cas-sections button').forEach(function (b) {
        b.setAttribute('aria-selected', b.getAttribute('data-section') === STATE.section ? 'true' : 'false');
      });
    }

    /* -- profile, and the request that checks intent first -------------------- */
    var sheet = $('#ltr-sheet'), sheetBody = $('#ltr-sheet-body');
    function bars(p) {
      var wrap = el('div', 'ltr-bars');
      Object.keys(p.factors).forEach(function (k) {
        var row = el('div', 'ltr-bars__row');
        row.appendChild(el('span', 'k', LABELS[k]));
        var b = el('span', 'b'); var f = el('i'); f.style.width = p.factors[k] + '%'; b.appendChild(f);
        row.appendChild(b); row.appendChild(el('span', 'v', p.factors[k] + '%'));
        wrap.appendChild(row);
      });
      return wrap;
    }
    function openSheet(p, straightToRequest) {
      sheetBody.textContent = '';
      var head = el('div', 'ltr-sheet__head');
      var img = el('img', 'ltr-sheet__plate'); img.src = MATCH.plate(p.id + p.name);
      img.alt = ''; img.setAttribute('aria-hidden','true'); head.appendChild(img);
      var hb = el('div');
      if (p.verified) hb.appendChild(MATCH.badge(true));
      var h = el('h2', null, p.name + ', ' + p.age); h.id = 'ltr-sheet-name'; hb.appendChild(h);
      hb.appendChild(el('p', 'ltr-sheet__where', p.city + ', ' + p.country));
      hb.appendChild(el('p', 'ltr-sheet__score', p.score + '% match · available ' + p.avail.toLowerCase()));
      head.appendChild(hb);
      sheetBody.appendChild(head);

      var acts = el('div', 'ltr-sheet__acts');
      var req = el('button', 'btn btn--solid'); req.type = 'button';
      var msg = el('button', 'btn'); msg.type = 'button'; msg.appendChild(el('span', null, 'Message'));
      var save = el('button', 'btn'); save.type = 'button';
      var report = el('button', 'btn btn--quiet', 'Report'); report.type = 'button';
      var block = el('button', 'btn btn--quiet', 'Block'); block.type = 'button';
      var box = el('div', 'ltr-connect'); box.hidden = true;
      function paint() {
        req.textContent = STATUS[p.id] === 'sent' ? 'Request sent' : 'Request connection';
        req.disabled = !!STATUS[p.id];
        msg.hidden = STATUS[p.id] !== 'accepted';
        save.textContent = SHORT[p.id] ? '♥ On your shortlist' : '♡ Add to shortlist';
      }
      function openRequest() {
        box.hidden = false; box.textContent = '';
        box.appendChild(el('p', 'ask__lbl', 'Request a private connection'));
        // the mutual-intent check, before anything is sent
        var check = el('div', 'cas-check' + (p.agree ? '' : ' cas-check--warn'));
        var dl = el('dl', 'kv');
        [['Your intent', ME.intent || 'Not stated yet'], ['Her intent', p.intent],
         ['You expect', ME.expect], ['She expects', p.expect]]
          .forEach(function (r) { dl.appendChild(el('dt', null, r[0])); dl.appendChild(el('dd', null, r[1])); });
        check.appendChild(dl);
        check.appendChild(el('p', 'cas-check__v', p.agree
          ? '✓ Compatible intent. Both of you have said the same thing, and both will see that you did.'
          : '⚠ Your relationship expectations may differ. She will be shown this too. Say it in the message rather than hoping it resolves itself.'));
        box.appendChild(check);
        var ta = el('textarea'); ta.rows = 3;
        ta.placeholder = p.agree ? 'Optional message' : 'Worth saying something about the difference above';
        ta.setAttribute('aria-label', 'Optional message to ' + p.name);
        box.appendChild(ta);
        var send = el('button', 'btn btn--solid', 'Send private request'); send.type = 'button';
        send.addEventListener('click', function () {
          STATUS[p.id] = 'sent'; box.textContent = '';
          box.appendChild(el('p', 'ltr-sent',
            'Sent privately. She sees your first name, your intent and your expectation — nothing else until she answers, and nothing at all if she does not.'));
          paint(); render(); announce('Private request sent to ' + p.name + '.');
        });
        box.appendChild(send); ta.focus();
      }
      req.addEventListener('click', openRequest);
      save.addEventListener('click', function () { SHORT[p.id] = !SHORT[p.id]; paint(); render(); });
      msg.addEventListener('click', function () { location.hash = '#messages'; });
      report.addEventListener('click', function () {
        box.hidden = false; box.textContent = '';
        box.appendChild(el('p', 'ask__lbl', 'Report ' + p.name));
        var sel = el('select');
        ['Fake profile','Misrepresentation','Harassment','Scam or fraud','Inappropriate behaviour','Safety concern','Other']
          .forEach(function (o) { var op = el('option', null, o); op.value = o; sel.appendChild(op); });
        sel.setAttribute('aria-label','Reason for reporting'); box.appendChild(sel);
        var ta = el('textarea'); ta.rows = 3; ta.setAttribute('aria-label','Details');
        ta.placeholder = 'Anything you would like the house to know'; box.appendChild(ta);
        var send = el('button', 'btn btn--solid', 'Send to the house'); send.type = 'button';
        send.addEventListener('click', function () {
          box.textContent = '';
          box.appendChild(el('p', 'ltr-sent', 'Read by a person today, not a queue. You are told what was done, and she is never told who reported her.'));
        });
        box.appendChild(send);
      });
      block.addEventListener('click', function () {
        STATUS[p.id] = 'blocked';
        note(block, p.name + ' is blocked. She is not curated to you again, is not told, and any request between you is withdrawn.');
      });
      [req, msg, save, report, block].forEach(function (b) { acts.appendChild(b); });
      paint();
      sheetBody.appendChild(acts);
      sheetBody.appendChild(box);

      var about = el('div', 'panel');
      about.appendChild(headOf('About ' + p.name));
      var ab = el('div', 'panel__body');
      ab.appendChild(el('p', 'ltr-about', p.about));
      var dl2 = el('dl', 'kv');
      [['Intent', p.intent], ['Expects', p.expect], ['Available', p.avail],
       ['Lifestyle', p.lifestyle], ['Interests', p.interests.join(', ')],
       ['Communication', p.comms], ['Location', p.city + ', ' + p.country]]
        .forEach(function (r) { dl2.appendChild(el('dt', null, r[0])); dl2.appendChild(el('dd', null, r[1])); });
      ab.appendChild(dl2);
      ab.appendChild(el('p', 'ask__lbl', 'Persona'));
      ab.appendChild(el('p', 'quiet', 'Shown with her permission: ' + p.comms.toLowerCase() +
        ' in conversation, ' + p.lifestyle.toLowerCase() + ' by habit. Her private persona and anything the house has inferred are not shown here and are not hers to share by accident.'));
      about.appendChild(ab);
      sheetBody.appendChild(about);

      var why = el('div', 'panel');
      why.appendChild(headOf('Why this match', p.score + '% overall'));
      var wb = el('div', 'panel__body');
      wb.appendChild(bars(p));
      wb.appendChild(el('div', p.agree ? 'note-inline' : 'note-inline cas-check--warn',
        p.agree ? 'Expectations agree on both sides: "' + p.expect + '".'
                : 'Expectations differ: you have said "' + ME.expect + '" and she has said "' + p.expect + '".'));
      why.appendChild(wb);
      sheetBody.appendChild(why);

      var ai = el('div', 'panel');
      ai.appendChild(headOf('Ask Legend about this match', 'Reads both files'));
      var aib = el('div', 'panel__body');
      aib.appendChild(el('p', 'ltr-insight', insight(p)));
      var thread = el('div', 'ltr-ai-thread'); aib.appendChild(thread);
      var chips = el('div', 'ask__chips');
      ASK.forEach(function (item) {
        var b = el('button', null, item.q); b.type = 'button';
        b.addEventListener('click', function () {
          thread.appendChild(el('p', 'ltr-ai-q', item.q));
          thread.appendChild(el('p', 'ltr-ai-a', item.a(p)));
          b.remove();
        });
        chips.appendChild(b);
      });
      aib.appendChild(chips);
      aib.appendChild(el('p', 'quiet', 'Written rules over the two files, not a language model, and only over what each of you has agreed may be used.'));
      ai.appendChild(aib);
      sheetBody.appendChild(ai);

      sheet.hidden = false;
      document.body.style.overflow = 'hidden';
      $('.ltr-sheet__close', sheet).focus();
      if (straightToRequest && !STATUS[p.id]) openRequest();
    }

    /* -- controls -------------------------------------------------------------- */
    function chipRow(host, list, current, onPick) {
      var wrap = $(host);
      list.forEach(function (v) {
        var b = el('button', 'chip' + (current === v ? ' is-on' : ''), v);
        b.type = 'button'; b.setAttribute('role','radio');
        b.setAttribute('aria-checked', current === v ? 'true' : 'false');
        b.addEventListener('click', function () {
          $$('button', wrap).forEach(function (o) {
            o.classList.toggle('is-on', o === b);
            o.setAttribute('aria-checked', o === b ? 'true' : 'false');
          });
          onPick(v); render();
        });
        wrap.appendChild(b);
      });
    }
    chipRow('#cas-intents', INTENTS, ME.intent, function (v) { ME.intent = v; announce('Your intent is now ' + v + '.'); });
    chipRow('#cas-expect', EXPECT, ME.expect, function (v) { ME.expect = v; });
    chipRow('#cas-avail', AVAIL, ME.avail, function (v) { ME.avail = v; });

    function build(list, host, store, prefix) {
      var wrap = $(host);
      list.forEach(function (def) { wrap.appendChild(field(def, store, render, prefix)); });
    }
    build(WHERE, '#cas-where-fields', ME, 'cas-w');
    build(PRIV, '#cas-privacy', PRIVACY, 'cas-p');
    build(FILTERS, '#cas-filters', STATE.filters, 'cas');

    var sectionsWrap = $('#cas-sections');
    SECTIONS.forEach(function (s) {
      var b = el('button'); b.type = 'button';
      b.setAttribute('data-section', s.id); b.setAttribute('role','tab');
      b.setAttribute('aria-selected', s.id === STATE.section ? 'true' : 'false');
      b.appendChild(el('span', 'ltr-tab__l', s.label));
      b.appendChild(el('span', 'ltr-tab__n', s.note));
      b.addEventListener('click', function () { STATE.section = s.id; render(); });
      sectionsWrap.appendChild(b);
    });

    $('#cas-private').addEventListener('change', function () {
      ME.privateProfile = this.checked;
      if (this.checked) {
        // the quietest setting actually sets the controls, rather than only saying so
        PRIVACY.profile = 'Nobody until I ask'; PRIVACY.photo = 'Nobody until I ask';
        PRIVACY.contact = 'Nobody until I ask'; PRIVACY.online = 'Hidden';
        PRIVACY.activity = 'Hidden'; PRIVACY.persona = 'Nobody';
        $('#cas-privacy').textContent = '';
        build(PRIV, '#cas-privacy', PRIVACY, 'cas-p');
      }
      render();
      announce(this.checked ? 'Private profile on. Nobody sees you until you agree, one at a time.' : 'Private profile off.');
    });
    $('#cas-q').addEventListener('input', function () { STATE.q = this.value.trim(); render(); });
    $('#cas-verified-only').addEventListener('change', function () { STATE.verifiedOnly = this.checked; render(); });
    $('#cas-intent-only').addEventListener('change', function () { STATE.intentOnly = this.checked; render(); });
    $('#cas-clear').addEventListener('click', function () {
      STATE.q = ''; STATE.filters = {}; STATE.intentOnly = false; STATE.verifiedOnly = true;
      $('#cas-q').value = ''; $('#cas-intent-only').checked = false; $('#cas-verified-only').checked = true;
      $('#cas-filters').textContent = '';
      build(FILTERS, '#cas-filters', STATE.filters, 'cas');
      render(); announce('Filters cleared.');
    });

    render();
  })();

  /* --- Profile & Persona ---------------------------------------------------
     Two entities, not one page with two headings. The profile is what the
     member wrote. The persona is what the house inferred, and the governing
     rule is that it is never a black box: every line carries where it came
     from, how sure we are, and whether the member has confirmed it — and only
     confirmed lines reach the matching engine. Removing a permission unsources
     the lines that came from it, on the spot.                                */
  var ppView = $('#view-me');
  if (ppView && typeof MATCH !== 'undefined') (function () {
    var el = MATCH.el, field = MATCH.field;

    var SOURCES = {
      user:        'You told us',
      interview:   'Persona interview',
      conversation:'Conversation with the assistant',
      behaviour:   'How you have used the portal',
      corrected:   'You corrected this'
    };
    // which permission each source depends on
    var SOURCE_PERM = { user:'profile', interview:'interview', conversation:'conversation',
                        behaviour:'activity', corrected:'profile' };

    var PERMS = [
      { k:'profile',      label:'My profile and preferences', on:true,  note:'What you have written yourself' },
      { k:'interview',    label:'My persona interview',       on:true,  note:'The questions you have answered' },
      { k:'conversation', label:'My conversations with the assistant', on:true, note:'What you have asked it' },
      { k:'messages',     label:'My correspondence with members', on:false, note:'Never on by default' },
      { k:'history',      label:'My relationship history',    on:false, note:'Formation, counsel and continuity notes' },
      { k:'activity',     label:'How I use the portal',       on:false, note:'What you open, and how long you stay' }
    ];
    var PERM = {}; PERMS.forEach(function (p) { PERM[p.k] = p.on; });

    /* -- the persona, as rows rather than prose ---------------------------- */
    // trait · value · confidence · source · confirmed · updated
    var TRAITS = [
      { g:'Personality', k:'Independence',   v:'High',     c:.87, s:'conversation', ok:true,  d:'12 Aug' },
      { g:'Personality', k:'Curiosity',      v:'High',     c:.81, s:'interview',    ok:true,  d:'2 Aug' },
      { g:'Personality', k:'Social energy',  v:'Selective',c:.74, s:'conversation', ok:false, d:'19 Aug' },
      { g:'Personality', k:'Ambition',       v:'High',     c:.69, s:'behaviour',    ok:false, d:'20 Aug' },
      { g:'Communication', k:'Style',        v:'Direct',   c:.91, s:'interview',    ok:true,  d:'2 Aug' },
      { g:'Communication', k:'Pace',         v:'Considered',c:.72,s:'conversation', ok:false, d:'18 Aug' },
      { g:'Relationship', k:'Closeness',     v:'Independent, warm', c:.79, s:'interview', ok:true, d:'2 Aug' },
      { g:'Relationship', k:'Structure',     v:'Spontaneous', c:.63, s:'behaviour',  ok:false, d:'21 Aug' },
      { g:'Values', k:'Trust',               v:'Central',  c:.93, s:'interview',    ok:true,  d:'2 Aug' },
      { g:'Values', k:'Privacy',             v:'Central',  c:.88, s:'user',         ok:true,  d:'14 Mar' },
      { g:'Values', k:'Freedom',             v:'High',     c:.76, s:'conversation', ok:false, d:'12 Aug' },
      { g:'Values', k:'Family',              v:'Open',     c:.58, s:'conversation', ok:false, d:'12 Aug' },
      { g:'Interests', k:'Travel',           v:'Confirmed',c:.95, s:'user',         ok:true,  d:'14 Mar' },
      { g:'Interests', k:'Art',              v:'Confirmed',c:.94, s:'user',         ok:true,  d:'14 Mar' },
      { g:'Interests', k:'Architecture',     v:'Detected', c:.71, s:'conversation', ok:false, d:'18 Aug' },
      { g:'Interests', k:'Sailing',          v:'Detected', c:.66, s:'behaviour',    ok:false, d:'20 Aug' }
    ];
    var GROUPS = ['Personality','Communication','Relationship','Values','Interests'];

    // what the matching engine is allowed to read: confirmed, and sourced from
    // something still permitted
    function usable(t) { return t.ok && PERM[SOURCE_PERM[t.s]]; }

    var COMPAT = [
      { k:'Communication', from:['Style','Pace'] },
      { k:'Lifestyle',     from:['Curiosity','Structure'] },
      { k:'Social style',  from:['Social energy'] },
      { k:'Adventure',     from:['Curiosity','Sailing','Travel'] },
      { k:'Independence',  from:['Independence','Freedom'] },
      { k:'Emotional style', from:['Closeness','Trust'] }
    ];
    function compatScore(row) {
      var ts = TRAITS.filter(function (t) { return row.from.indexOf(t.k) > -1 && usable(t); });
      if (!ts.length) return null;
      return Math.round(ts.reduce(function (a, t) { return a + t.c; }, 0) / ts.length * 100);
    }

    /* -- profile completion, computed from real gaps ------------------------ */
    var PROFILE = [
      { k:'Identity',   done:true,  what:'Name, age, city, languages',
        v:'A. Marchand · 41 · London · English, French' },
      { k:'About me',   done:true,  what:'How you describe yourself',
        v:'Reads more than he writes. Keeps two evenings a week for nothing in particular.' },
      { k:'Photographs',done:false, what:'A portrait, and two more',
        v:'One held on file, none released', todo:'Add two photographs' },
      { k:'Lifestyle',  done:true,  what:'Occupation, education, how you live',
        v:'Investor · Doctorate · Travels monthly' },
      { k:'Interests',  done:false, what:'At least six',
        v:'Travel, Art, Sailing, Wine', todo:'Add two more interests' },
      { k:'Location',   done:true,  what:'City, and where you often are',
        v:'London · often Geneva, New York' },
      { k:'Relationship goals', done:true, what:'What you are looking for',
        v:'Long-term partner' },
      { k:'Preferences', done:false, what:'Age, place, family, lifestyle',
        v:'Age and place set; family and lifestyle not', todo:'Complete relationship preferences' },
      { k:'Verification', done:true, what:'Seen in person by an advisor',
        v:'Legend Verified · 14 March 2026' },
      { k:'Privacy',    done:true,  what:'Who sees what',
        v:'City only · persona private' }
    ];

    var VIS = [
      { k:'profile', label:'Profile visible to', type:'select',
        options:['Members I am introduced to','Verified members','Nobody until I agree'] },
      { k:'photos', label:'Photographs visible to', type:'select',
        options:['Members I have accepted','Members I am introduced to','Nobody until I agree'] },
      { k:'location', label:'Location shown as', type:'select', options:['City only','Country only','Hidden'] },
      { k:'persona', label:'Persona visible to', type:'select',
        options:['Nobody — the house only','Members I have accepted','Members I am introduced to'] },
      { k:'online', label:'Online status', type:'select', options:['Hidden','Shown to accepted members'] }
    ];
    var VISV = {};

    /* -- rendering ----------------------------------------------------------- */
    var live = el('p', 'sr-only'); live.setAttribute('role','status'); live.setAttribute('aria-live','polite');
    ppView.appendChild(live);
    function announce(t) { live.textContent = t; }

    $('#pp-plate').src = MATCH.plate('A. Marchand');

    function completion() {
      var done = PROFILE.filter(function (r) { return r.done; }).length;
      return Math.round(done / PROFILE.length * 100);
    }
    function renderHead() {
      var pct = completion();
      $('#pp-pct').textContent = pct + '%';
      $('#pp-bar').style.width = pct + '%';
      var todo = PROFILE.filter(function (r) { return !r.done; }).map(function (r) { return r.todo; });
      var unconfirmed = TRAITS.filter(function (t) { return !t.ok; }).length;
      if (unconfirmed) todo.push('Confirm or remove ' + unconfirmed + ' persona line' + (unconfirmed === 1 ? '' : 's'));
      $('#pp-todo').textContent = todo.length
        ? 'To finish: ' + todo.join(' · ') + '.'
        : 'Nothing outstanding. Your profile is complete and every persona line is confirmed.';
    }

    function renderProfile() {
      var g = $('#pp-profile-grid'); g.textContent = '';
      PROFILE.forEach(function (r) {
        var p = el('div', 'panel');
        var h = el('div', 'panel__head');
        h.appendChild(el('h2', null, r.k));
        h.appendChild(el('span', 'pill ' + (r.done ? 'pill--rest' : 'pill--action'), r.done ? 'Complete' : 'Outstanding'));
        p.appendChild(h);
        var b = el('div', 'panel__body');
        b.appendChild(el('p', 'pp-what', r.what));
        b.appendChild(el('p', 'pp-val', r.v));
        if (r.todo) b.appendChild(el('p', 'pp-todo-line', r.todo));
        p.appendChild(b);
        g.appendChild(p);
      });
    }

    function traitRow(t) {
      var row = el('div', 'pp-trait' + (t.ok ? ' is-ok' : '') + (usable(t) ? '' : ' is-unused'));
      var main = el('div', 'pp-trait__main');
      main.appendChild(el('span', 'pp-trait__k', t.k));
      main.appendChild(el('span', 'pp-trait__v', t.v));
      row.appendChild(main);

      var meta = el('div', 'pp-trait__meta');
      var conf = el('span', 'pp-conf');
      conf.appendChild(el('i', null, ''));
      conf.lastChild.style.width = Math.round(t.c * 100) + '%';
      meta.appendChild(conf);
      // a word, not a decimal: a probability read as a verdict is the thing to avoid
      var word = t.c >= .85 ? 'High confidence' : t.c >= .7 ? 'Moderate confidence' : 'Low confidence';
      meta.appendChild(el('span', 'pp-trait__c', word));
      meta.appendChild(el('span', 'pp-trait__s', SOURCES[t.s] + ' · ' + t.d));
      if (!PERM[SOURCE_PERM[t.s]]) meta.appendChild(el('span', 'pp-trait__off', 'Source switched off — not used'));
      row.appendChild(meta);

      var acts = el('div', 'pp-trait__acts');
      var ok = el('button', 'pp-btn' + (t.ok ? ' is-on' : '')); ok.type = 'button';
      ok.textContent = t.ok ? '✓ Confirmed' : 'Confirm';
      ok.setAttribute('aria-pressed', t.ok ? 'true' : 'false');
      ok.addEventListener('click', function () {
        t.ok = !t.ok; if (t.ok) { t.s = 'corrected'; t.c = Math.max(t.c, .95); }
        render(); announce(t.k + (t.ok ? ' confirmed.' : ' unconfirmed.'));
      });
      var edit = el('button', 'pp-btn', 'Edit'); edit.type = 'button';
      edit.addEventListener('click', function () {
        var v = prompt('What should ' + t.k.toLowerCase() + ' say?', t.v);
        if (v == null) return;
        t.v = v.trim() || t.v; t.ok = true; t.s = 'corrected'; t.c = 1; t.d = 'today';
        render(); announce(t.k + ' corrected.');
      });
      var del = el('button', 'pp-btn pp-btn--rm', 'Remove'); del.type = 'button';
      del.addEventListener('click', function () {
        TRAITS.splice(TRAITS.indexOf(t), 1);
        render(); announce(t.k + ' removed from your persona.');
      });
      [ok, edit, del].forEach(function (b) { acts.appendChild(b); });
      row.appendChild(acts);
      return row;
    }

    function renderTraits() {
      var host = $('#pp-traits'); host.textContent = '';
      GROUPS.forEach(function (g) {
        var rows = TRAITS.filter(function (t) { return t.g === g; });
        if (!rows.length) return;
        host.appendChild(el('p', 'ask__lbl', g));
        rows.forEach(function (t) { host.appendChild(traitRow(t)); });
      });
      $('#pp-confirmed').textContent = TRAITS.filter(function (t) { return t.ok; }).length;
      $('#pp-total').textContent = TRAITS.length;
    }

    function renderCompat() {
      var host = $('#pp-compat'); host.textContent = '';
      COMPAT.forEach(function (row) {
        var v = compatScore(row);
        var r = el('div', 'ltr-bars__row');
        r.appendChild(el('span', 'k', row.k));
        var b = el('span', 'b'); var f = el('i');
        f.style.width = (v || 0) + '%'; b.appendChild(f); r.appendChild(b);
        r.appendChild(el('span', 'v', v == null ? '—' : v + '%'));
        host.appendChild(r);
      });
    }

    function label() {
      var ind = TRAITS.filter(function (t) { return t.k === 'Independence' && usable(t); })[0];
      var cur = TRAITS.filter(function (t) { return t.k === 'Curiosity' && usable(t); })[0];
      if (ind && cur) return 'The Independent Explorer';
      if (ind) return 'The Independent';
      if (cur) return 'The Explorer';
      return 'Not yet drawn';
    }
    function summary() {
      var used = TRAITS.filter(usable);
      if (!used.length) return 'Nothing is confirmed yet, so there is no persona to show. Confirm a line below, or answer a few more questions, and it will draw itself.';
      var vals = used.filter(function (t) { return t.g === 'Values'; }).map(function (t) { return t.k.toLowerCase(); });
      var style = used.filter(function (t) { return t.k === 'Style'; })[0];
      return 'Drawn from ' + used.length + ' confirmed line' + (used.length === 1 ? '' : 's') + '. ' +
        (style ? style.v.toLowerCase() + ' in conversation' : 'Style not yet confirmed') +
        (vals.length ? ', and holds ' + vals.slice(0, 3).join(', ') + ' at the centre' : '') + '.';
    }
    function renderPersona() {
      $('#pp-persona-label').textContent = label();
      $('#pp-persona-summary').textContent = summary();
      var recent = TRAITS.filter(function (t) { return /Aug/.test(t.d); }).length;
      $('#pp-updated').textContent = 'Last updated 21 Aug';
      var evo = $('#pp-evo'); evo.textContent = '';
      evo.appendChild(el('p', 'ask__lbl', 'What changed'));
      var ul = el('ul', 'includes');
      [recent + ' line' + (recent === 1 ? '' : 's') + ' added or revised this month',
       'Communication pace detected from your last three conversations',
       'Two interests detected that you have not yet confirmed']
        .forEach(function (t) { ul.appendChild(el('li', null, t)); });
      evo.appendChild(ul);
    }

    function renderInsights() {
      var host = $('#pp-insights'); host.textContent = '';
      var used = TRAITS.filter(usable);
      var ind = used.filter(function (t) { return t.k === 'Independence'; })[0];
      var soc = used.filter(function (t) { return t.k === 'Social energy'; })[0];
      var lines = [];
      if (ind) lines.push('You are likely to connect best with people who keep their own life running alongside yours.');
      if (soc) lines.push('Small rooms suit you better than large ones, and the house weights introductions accordingly.');
      if (!lines.length) lines.push('Too little is confirmed to say anything useful yet. That is the honest position rather than a placeholder.');
      lines.forEach(function (t) { host.appendChild(el('p', 'ltr-insight', t)); });

      var chips = $('#pp-ask-chips'); chips.textContent = '';
      var thread = $('#pp-ai-thread');
      [ { q:'What does the house think it knows?', a:function () {
            return used.length + ' of ' + TRAITS.length + ' lines are confirmed and in use. ' +
              (TRAITS.length - used.length) + ' are either unconfirmed or come from a source you have switched off, and none of those reach matching.'; } },
        { q:'Where did this come from?', a:function () {
            var by = {};
            TRAITS.forEach(function (t) { by[t.s] = (by[t.s] || 0) + 1; });
            return Object.keys(by).map(function (k) { return SOURCES[k] + ': ' + by[k]; }).join('. ') + '.'; } },
        { q:'What is it least sure about?', a:function () {
            var low = TRAITS.slice().sort(function (a, b) { return a.c - b.c; })[0];
            return low ? low.k + ' — "' + low.v + '", at ' + Math.round(low.c * 100) + ' per cent, from ' +
              SOURCES[low.s].toLowerCase() + '. Worth correcting or removing rather than leaving.' : 'Nothing is left.'; } },
        { q:'What is used for matching?', a:function () {
            return 'Only confirmed lines from permitted sources: ' + used.map(function (t) { return t.k.toLowerCase(); }).join(', ') + '. Nothing else.'; } }
      ].forEach(function (item) {
        var b = el('button', null, item.q); b.type = 'button';
        b.addEventListener('click', function () {
          thread.appendChild(el('p', 'ltr-ai-q', item.q));
          thread.appendChild(el('p', 'ltr-ai-a', item.a()));
          b.remove();
        });
        chips.appendChild(b);
      });
    }

    function renderPerms() {
      var host = $('#pp-perms'); host.textContent = '';
      PERMS.forEach(function (p) {
        var row = el('label', 'pp-perm');
        var cb = el('input'); cb.type = 'checkbox'; cb.checked = PERM[p.k];
        cb.addEventListener('change', function () {
          PERM[p.k] = cb.checked; render();
          announce(p.label + (cb.checked ? ' switched on.' : ' switched off; lines from it are no longer used.'));
        });
        row.appendChild(cb);
        var t = el('span');
        t.appendChild(el('b', null, p.label));
        t.appendChild(el('span', 'pp-perm__n', p.note));
        var n = TRAITS.filter(function (x) { return SOURCE_PERM[x.s] === p.k; }).length;
        if (n) t.appendChild(el('span', 'pp-perm__n', n + ' persona line' + (n === 1 ? '' : 's') + ' come from this'));
        row.appendChild(t);
        host.appendChild(row);
      });
      $('#pp-perm-count').textContent = PERMS.filter(function (p) { return PERM[p.k]; }).length + ' of ' + PERMS.length + ' on';
    }

    function renderData() {
      var host = $('#pp-data'); host.textContent = '';
      [ ['Export my persona', 'A file of every line, its source and its confidence.'],
        ['Reset my persona', 'Clears every inferred line. Your profile is untouched.'],
        ['Delete conversation history', 'Removes what the persona was built from, and the persona with it.'] ]
        .forEach(function (r) {
          var b = el('button', 'btn btn--quiet', r[0]); b.type = 'button';
          b.addEventListener('click', function () {
            if (r[0] === 'Reset my persona') {
              TRAITS.length = 0; render();
              note(b, 'Persona cleared. Your profile is untouched, and nothing is used for matching until you build it again.');
            } else {
              note(b, r[1] + ' In service this is done the same day, by a person, and you are told when it is finished.');
            }
          });
          host.appendChild(b);
        });
    }

    function render() {
      renderHead(); renderProfile(); renderTraits(); renderCompat();
      renderPersona(); renderInsights(); renderPerms();
    }

    /* -- tabs, and the rest ---------------------------------------------------- */
    $$('.pp-tabs button').forEach(function (b) {
      b.addEventListener('click', function () {
        var which = b.getAttribute('data-pp');
        $$('.pp-tabs button').forEach(function (o) {
          o.setAttribute('aria-selected', o === b ? 'true' : 'false');
        });
        ['profile','persona','settings'].forEach(function (p) {
          $('#pp-pane-' + p).hidden = p !== which;
        });
      });
    });
    VIS.forEach(function (def) { $('#pp-visibility').appendChild(field(def, VISV, function () {}, 'pp-v')); });
    renderData();

    $('#pp-preview').addEventListener('click', function (e) {
      note(e.target, 'Opens your profile exactly as a member you have been introduced to would see it — ' +
        'city only, no surname, and your persona withheld unless you have said otherwise.');
    });
    $('#pp-interview').addEventListener('click', function (e) {
      note(e.target, 'Six questions, about twenty minutes, and you can stop at any of them. ' +
        'Every answer becomes a line you can see, correct or remove — never a score you cannot.');
    });
    $('#pp-ask').addEventListener('click', function () {
      $$('.pp-tabs button').forEach(function (o) { o.setAttribute('aria-selected', o.getAttribute('data-pp') === 'persona' ? 'true' : 'false'); });
      ['profile','persona','settings'].forEach(function (p) { $('#pp-pane-' + p).hidden = p !== 'persona'; });
      var c = $('#pp-ask-chips'); if (c.firstChild) c.firstChild.focus();
    });

    render();
  })();

  /* --- Events & Companionship ----------------------------------------------
     Discover, curate, match, request, confirm — in that order, and the page is
     built so it cannot be short-circuited into search-and-book. A companion is
     requested against a named evening, never in the abstract; the request has
     real states rather than a boolean; and the concierge is a person on the
     page rather than a support link at the bottom.                           */
  var evView = $('#view-occasions');
  if (evView && typeof MATCH !== 'undefined') (function () {
    var el = MATCH.el, field = MATCH.field;

    var WEIGHTS = { event:25, availability:20, location:15, social:15,
                    interests:10, communication:5, lifestyle:5, persona:5 };
    var LABELS = { event:'Event fit', availability:'Availability', location:'Location',
                   social:'Social style', interests:'Interests',
                   communication:'Communication', lifestyle:'Lifestyle', persona:'Persona' };

    var DAY = 86400000, t0 = new Date(); t0.setHours(0,0,0,0);
    function iso(d) { return d.toISOString().slice(0,10); }
    function plus(n) { return iso(new Date(t0.getTime() + n*DAY)); }
    function fmt(s) {
      return new Date(s + 'T00:00:00').toLocaleDateString('en-GB', { day:'numeric', month:'short' });
    }

    var ME = { city:'Munich', social:'Confident, selective', comms:'Direct',
               lifestyle:'Arts & Culture', interests:['Art','Fine Dining','Travel','Culture'] };

    /* -- the evenings the house is holding --------------------------------- */
    var CATS = [
      { id:'curated',  label:'Curated for you', note:'Weighted to your preferences' },
      { id:'private',  label:'Private',   note:'Dinners, gatherings, celebrations' },
      { id:'social',   label:'Social',    note:'Cocktails, dinners, gatherings' },
      { id:'business', label:'Business',  note:'Dinners, conferences, networking' },
      { id:'culture',  label:'Culture & lifestyle', note:'Art, music, theatre, dining' },
      { id:'travel',   label:'Travel',    note:'Weekends and city experiences' }
    ];
    var EVENTS = [
      { id:'e1', cat:'private', name:'Private dinner', city:'Munich', date:plus(23), time:'19:30',
        venue:'A private room, Lehel', guests:8, privacy:'Invitation only', dress:'Black tie optional',
        host:'The house', curated:true, interests:['Fine Dining','Art'],
        about:'Eight people, one table, and a house rule that nobody discusses what they do until the second course.' },
      { id:'e2', cat:'culture', name:'Private view — Blaue Reiter', city:'Munich', date:plus(9), time:'18:00',
        venue:'Lenbachhaus, after hours', guests:24, privacy:'Members only', dress:'Informal',
        host:'The house', curated:true, interests:['Art','Culture'],
        about:'The rooms to ourselves for two hours, with the curator who hung them.' },
      { id:'e3', cat:'business', name:'Business dinner — technology', city:'Munich', date:plus(15), time:'20:00',
        venue:'Restaurant, Maxvorstadt', guests:12, privacy:'Members only', dress:'Business',
        host:'A member', curated:false, interests:['Business','Fine Dining'],
        about:'Twelve people who build things, and a companion briefed on the room rather than scripted for it.' },
      { id:'e4', cat:'social', name:'Autumn cocktails', city:'Munich', date:plus(5), time:'19:00',
        venue:'A private bar, Altstadt', guests:30, privacy:'Members only', dress:'Cocktail',
        host:'The house', curated:true, interests:['Culture','Fine Dining'],
        about:'The largest room the house uses, which is still only thirty people.' },
      { id:'e5', cat:'travel', name:'A weekend in Salzburg', city:'Salzburg', date:plus(31), time:'—',
        venue:'Two nights, arranged', guests:6, privacy:'Invitation only', dress:'As you like',
        host:'The house', curated:true, interests:['Culture','Travel','Art'],
        about:'Six people, two nights, one concert, and no obligation to be sociable at breakfast.' },
      { id:'e6', cat:'private', name:'A celebration', city:'Vienna', date:plus(44), time:'20:00',
        venue:'A private house', guests:16, privacy:'Invitation only', dress:'Black tie',
        host:'A member', curated:false, interests:['Fine Dining','Culture'],
        about:'A member marking something, and asking the house to fill four of the sixteen chairs.' },
      { id:'e7', cat:'culture', name:'Opera, and dinner after', city:'Munich', date:plus(12), time:'17:30',
        venue:'Nationaltheater, then Schwabing', guests:4, privacy:'Invitation only', dress:'Formal',
        host:'The house', curated:true, interests:['Culture','Art','Fine Dining'],
        about:'Four seats the house keeps, and a table held for afterwards whether or not it is wanted.' },
      { id:'e8', cat:'business', name:'Founders, off the record', city:'Zurich', date:plus(27), time:'19:00',
        venue:'A private room', guests:10, privacy:'Invitation only', dress:'Business',
        host:'The house', curated:false, interests:['Business'],
        about:'No press, no notes, no attribution. That is the whole proposition.' }
    ];

    var KINDS = ['Social companion','Dinner companion','Event companion',
                 'Business event companion','Travel companion'];
    var COMPANIONS = [
      { id:'k1', name:'Sophia', age:34, city:'Munich', verified:true,
        social:'Confident, selective', comms:'Direct', lifestyle:'Arts & Culture',
        interests:['Art','Travel','Fine Dining','Culture'], langs:['German','English','French'],
        kinds:['Event companion','Dinner companion','Social companion'],
        free:[plus(3), plus(30)], attended:14,
        about:'At ease in a room of strangers and uninterested in being the reason anyone remembers it.' },
      { id:'k2', name:'Katharina', age:37, city:'Munich', verified:true,
        social:'Warm, sociable', comms:'Warm', lifestyle:'Social',
        interests:['Fine Dining','Music','Fashion','Culture'], langs:['German','English'],
        kinds:['Social companion','Dinner companion'],
        free:[plus(0), plus(20)], attended:31,
        about:'Talks to everyone, remembers all of it, and repeats none of it.' },
      { id:'k3', name:'Elisa', age:32, city:'Munich', verified:true,
        social:'Quiet, observant', comms:'Considered', lifestyle:'Arts & Culture',
        interests:['Art','Culture','Travel','Photography'], langs:['Italian','German','English'],
        kinds:['Event companion','Travel companion'],
        free:[plus(6), plus(40)], attended:9,
        about:'Reads a room before she speaks in it, which is rarer than it should be.' },
      { id:'k4', name:'Johanna', age:39, city:'Munich', verified:true,
        social:'Confident, selective', comms:'Direct', lifestyle:'Business',
        interests:['Business','Fine Dining','Travel','Technology'], langs:['German','English','Mandarin'],
        kinds:['Business event companion','Event companion','Dinner companion'],
        free:[plus(10), plus(35)], attended:22,
        about:'Briefed rather than scripted. Will not claim an expertise she does not have.' },
      { id:'k5', name:'Marta', age:30, city:'Vienna', verified:false,
        social:'Warm, sociable', comms:'Warm', lifestyle:'Social',
        interests:['Music','Fashion','Culture','Nightlife'], langs:['German','English'],
        kinds:['Social companion'],
        free:[plus(20), plus(60)], attended:3,
        about:'New to the house, and verification is not yet finished.' },
      { id:'k6', name:'Ines', age:35, city:'Salzburg', verified:true,
        social:'Quiet, observant', comms:'Considered', lifestyle:'Arts & Culture',
        interests:['Culture','Art','Travel','Wellness'], langs:['German','English'],
        kinds:['Travel companion','Event companion'],
        free:[plus(25), plus(50)], attended:11,
        about:'Comfortable with two days of somebody else’s company, and honest when she is not.' }
    ];

    /* -- states, per the brief --------------------------------------------- */
    var FLOW = ['Requested','Accepted','Confirmed','Completed'];
    var REQ = {};                                     // eventId+companionId -> state
    var BOOKED = [
      { ev:'e2', comp:'k1', state:'Confirmed' }
    ];
    BOOKED.forEach(function (b) { REQ[b.ev + '|' + b.comp] = b.state; });

    /* -- matching ------------------------------------------------------------ */
    var STATE = { cat:'curated', forEvent:null, kind:'Event companion',
                  verifiedOnly:true, cprefs:{}, prefs:{}, priv:{} };

    function ev(id) { return EVENTS.filter(function (e) { return e.id === id; })[0]; }
    function freeFor(c, e) {
      return e && c.free[0] <= e.date && c.free[1] >= e.date;
    }
    function factors(c, e) {
      var shared = c.interests.filter(function (i) { return (e ? e.interests : ME.interests).indexOf(i) > -1; });
      return {
        event: e ? (c.kinds.indexOf(STATE.kind) > -1 ? 100 : 62) : 70,
        availability: e ? (freeFor(c, e) ? 100 : 35) : 80,
        location: e ? (c.city === e.city ? 100 : 62) : (c.city === ME.city ? 100 : 62),
        social: c.social === ME.social ? 100 : 74,
        interests: Math.round(shared.length / 4 * 100),
        communication: c.comms === ME.comms ? 100 : 78,
        lifestyle: c.lifestyle === ME.lifestyle ? 100 : 76,
        persona: Math.min(100, 60 + c.attended * 2)
      };
    }
    function score(f) {
      var t = 0, s = 0;
      Object.keys(WEIGHTS).forEach(function (k) { t += WEIGHTS[k]; s += WEIGHTS[k] * f[k]; });
      return Math.round(s / t);
    }
    function eventFit(e) {
      var shared = e.interests.filter(function (i) { return ME.interests.indexOf(i) > -1; });
      var here = e.city === ME.city ? 1 : .78;
      return Math.round((60 + shared.length * 12) * here);
    }

    /* -- rendering ----------------------------------------------------------- */
    var live = el('p', 'sr-only'); live.setAttribute('role','status'); live.setAttribute('aria-live','polite');
    evView.appendChild(live);
    function announce(t) { live.textContent = t; }

    function renderUpcoming() {
      var host = $('#ev-upcoming'); host.textContent = '';
      var mine = Object.keys(REQ).map(function (k) {
        var p = k.split('|');
        return { e: ev(p[0]), c: COMPANIONS.filter(function (x) { return x.id === p[1]; })[0], s: REQ[k] };
      }).filter(function (r) { return r.e && r.c && r.s !== 'Declined'; });
      $('#ev-upcoming-n').textContent = mine.length + (mine.length === 1 ? ' arrangement' : ' arrangements');
      if (!mine.length) {
        host.appendChild(el('p', 'quiet', 'Nothing arranged. Choose an evening below, or ask the concierge to find one.'));
        return;
      }
      mine.forEach(function (r) {
        var row = el('div', 'ev-up');
        var l = el('div');
        l.appendChild(el('p', 'ev-up__n', r.e.name));
        l.appendChild(el('p', 'ev-up__d', fmt(r.e.date) + ' · ' + r.e.time + ' · ' + r.e.city + ' · ' + r.e.venue));
        l.appendChild(el('p', 'ev-up__c', 'Companion: ' + r.c.name + (r.s === 'Confirmed' || r.s === 'Completed' ? ' ✓' : '')));
        row.appendChild(l);
        var right = el('div', 'ev-up__r');
        // the state machine, shown as a track rather than a word
        var track = el('div', 'ev-track');
        FLOW.forEach(function (st) {
          var done = FLOW.indexOf(st) <= FLOW.indexOf(r.s);
          track.appendChild(el('span', 'ev-track__s' + (done ? ' is-done' : ''), st));
        });
        right.appendChild(track);
        var acts = el('div', 'ev-up__acts');
        var det = el('button', 'btn'); det.type = 'button';
        det.appendChild(el('span', null, 'Details')); det.appendChild(el('i', 'arrow'));
        det.addEventListener('click', function () { openEvent(r.e, r.c); });
        var conc = el('button', 'btn btn--quiet', 'Contact concierge'); conc.type = 'button';
        conc.addEventListener('click', function () { showPane('concierge'); });
        var canc = el('button', 'btn btn--quiet', 'Cancel'); canc.type = 'button';
        canc.addEventListener('click', function () {
          delete REQ[r.e.id + '|' + r.c.id];
          renderUpcoming(); renderCompanions();
          note(canc, 'Cancelled. ' + r.c.name + ' is told the evening is off and nothing else; the venue is released by the concierge today.');
        });
        [det, conc, canc].forEach(function (b) { acts.appendChild(b); });
        right.appendChild(acts);
        row.appendChild(right);
        host.appendChild(row);
      });
    }

    function eventCard(e) {
      var a = el('article', 'ev-card');
      var img = el('img', 'ev-card__img');
      img.src = MATCH.plate(e.id + e.name); img.alt = ''; img.setAttribute('aria-hidden','true'); img.loading = 'lazy';
      a.appendChild(img);
      var b = el('div', 'ev-card__body');
      b.appendChild(el('p', 'ev-card__cat', e.privacy));
      b.appendChild(el('h3', 'ev-card__n', e.name));
      b.appendChild(el('p', 'ev-card__d', e.city + ' · ' + fmt(e.date) + (e.time !== '—' ? ' · ' + e.time : '')));
      b.appendChild(el('p', 'ev-card__g', e.guests + ' guests · ' + e.dress));
      if (e.curated) {
        var v = el('span', 'ltr-vfd'); v.appendChild(el('i', null, '✓'));
        v.appendChild(el('span', null, 'Legend curated')); b.appendChild(v);
      }
      var open = el('button', 'btn'); open.type = 'button';
      open.appendChild(el('span', null, 'View experience')); open.appendChild(el('i', 'arrow'));
      open.addEventListener('click', function () { openEvent(e); });
      b.appendChild(open);
      a.appendChild(b);
      return a;
    }

    function renderEvents() {
      var list = EVENTS.filter(function (e) {
        return STATE.cat === 'curated' ? e.curated : e.cat === STATE.cat;
      }).sort(function (x, y) { return eventFit(y) - eventFit(x); });
      var g = $('#ev-grid'); g.textContent = '';
      list.forEach(function (e) { g.appendChild(eventCard(e)); });
      $('#ev-empty').hidden = list.length > 0;
      var cat = CATS.filter(function (c) { return c.id === STATE.cat; })[0];
      $('#ev-note').textContent = list.length
        ? cat.label + ' — ' + list.length + ' held. ' + cat.note + '.' : '';
      $$('#ev-cats button').forEach(function (b) {
        b.setAttribute('aria-selected', b.getAttribute('data-cat') === STATE.cat ? 'true' : 'false');
      });
    }

    function companionCard(c, e) {
      var f = factors(c, e), s = score(f);
      var a = el('article', 'ltr-card cas-card');
      var img = el('img', 'ltr-card__plate');
      img.src = MATCH.plate(c.id + c.name); img.alt = ''; img.setAttribute('aria-hidden','true'); img.loading = 'lazy';
      a.appendChild(img);
      var b = el('div', 'ltr-card__body');
      b.appendChild(MATCH.badge(c.verified));
      b.appendChild(el('h3', 'ltr-card__name', c.name + ', ' + c.age));
      b.appendChild(el('p', 'ltr-card__where', c.city));
      var sc = el('div', 'ltr-score');
      sc.appendChild(el('span', 'ltr-score__n', s + '%'));
      sc.appendChild(el('span', 'ltr-score__l', 'Event compatibility'));
      var bar = el('span', 'ltr-score__bar'); var fill = el('span');
      fill.style.width = s + '%'; bar.appendChild(fill); sc.appendChild(bar);
      b.appendChild(sc);
      var shared = c.interests.filter(function (i) { return (e ? e.interests : ME.interests).indexOf(i) > -1; });
      b.appendChild(el('p', 'ltr-card__tags', shared.length ? 'Shared: ' + shared.join(' · ') : 'No shared interest on file'));
      b.appendChild(el('p', 'cas-avail' + (e && !freeFor(c, e) ? ' cas-avail--warn' : ''),
        e ? (freeFor(c, e) ? 'Free on ' + fmt(e.date) : 'Not free on ' + fmt(e.date)) : 'Free ' + fmt(c.free[0]) + '–' + fmt(c.free[1])));
      b.appendChild(el('p', 'ltr-card__goal', c.social));

      var acts = el('div', 'cas-acts');
      var view = el('button', 'btn'); view.type = 'button';
      view.appendChild(el('span', null, 'View profile')); view.appendChild(el('i', 'arrow'));
      view.addEventListener('click', function () { openCompanion(c, e); });
      var req = el('button', 'btn btn--solid'); req.type = 'button';
      var key = e ? e.id + '|' + c.id : null;
      req.textContent = key && REQ[key] ? REQ[key] : 'Request companion';
      req.disabled = !e || !!(key && REQ[key]);
      if (!e) req.title = 'Choose an evening first';
      req.addEventListener('click', function () { openCompanion(c, e, true); });
      acts.appendChild(view); acts.appendChild(req);
      b.appendChild(acts);
      a.appendChild(b);
      return a;
    }

    function renderCompanions() {
      var e = STATE.forEvent ? ev(STATE.forEvent) : null;
      var list = COMPANIONS.filter(function (c) {
        if (STATE.verifiedOnly && !c.verified) return false;
        var p = STATE.cprefs;
        if (p.ageMin && c.age < +p.ageMin) return false;
        if (p.ageMax && c.age > +p.ageMax) return false;
        if (p.language && p.language !== 'Any' && c.langs.indexOf(p.language) < 0) return false;
        if (p.social && p.social !== 'Any' && c.social !== p.social) return false;
        if (p.comms && p.comms !== 'Any' && c.comms !== p.comms) return false;
        return true;
      }).sort(function (x, y) { return score(factors(y, e)) - score(factors(x, e)); }).slice(0, 6);
      var g = $('#ev-companions'); g.textContent = '';
      list.forEach(function (c) { g.appendChild(companionCard(c, e)); });
      $('#ev-cempty').hidden = list.length > 0;
      $('#ev-cnote').textContent = list.length
        ? (e ? 'The house selected ' + list.length + ' members who may suit ' + e.name.toLowerCase() +
               ' on ' + fmt(e.date) + '.' : 'Choose an evening above and these are re-scored against it.')
        : '';
      var pill = $('#ev-for-pill');
      pill.textContent = e ? e.name + ' · ' + fmt(e.date) : 'Choose an evening';
      pill.className = 'pill ' + (e ? 'pill--rest' : 'pill--action');
    }

    /* -- the sheet ------------------------------------------------------------ */
    var sheet = $('#ltr-sheet'), sheetBody = $('#ltr-sheet-body');
    function openEvent(e, withCompanion) {
      sheetBody.textContent = '';
      var head = el('div', 'ltr-sheet__head');
      var img = el('img', 'ltr-sheet__plate'); img.src = MATCH.plate(e.id + e.name);
      img.alt=''; img.setAttribute('aria-hidden','true'); head.appendChild(img);
      var hb = el('div');
      var h = el('h2', null, e.name); h.id = 'ltr-sheet-name'; hb.appendChild(h);
      hb.appendChild(el('p', 'ltr-sheet__where', e.city + ' · ' + fmt(e.date) + (e.time !== '—' ? ' · ' + e.time : '')));
      hb.appendChild(el('p', 'ltr-sheet__score', e.privacy + ' · ' + e.guests + ' guests'));
      head.appendChild(hb); sheetBody.appendChild(head);

      var p = el('div', 'panel');
      p.appendChild(MATCH.head('The evening'));
      var pb = el('div', 'panel__body');
      pb.appendChild(el('p', 'ltr-about', e.about));
      var dl = el('dl', 'kv');
      [['Venue', e.venue], ['Dress', e.dress], ['Guests', String(e.guests)],
       ['Host', e.host], ['Privacy', e.privacy],
       ['Curated', e.curated ? 'By the house' : 'By a member, vetted by the house']]
        .forEach(function (r) { dl.appendChild(el('dt',null,r[0])); dl.appendChild(el('dd',null,r[1])); });
      pb.appendChild(dl);
      if (withCompanion) {
        pb.appendChild(el('p', 'ask__lbl', 'Your companion'));
        pb.appendChild(el('p', 'pp-val', withCompanion.name + ' · ' + withCompanion.city +
          ' · ' + (REQ[e.id + '|' + withCompanion.id] || 'Requested')));
      }
      pb.appendChild(el('div', 'note-inline',
        'Your attendance is not shown on your profile, to anyone, at any setting. The venue is told a number and a name for the table, and nothing else.'));
      p.appendChild(pb); sheetBody.appendChild(p);

      var foot = el('div', 'ltr-sheet__acts');
      var find = el('button', 'btn btn--solid', 'Find a companion for this'); find.type = 'button';
      find.addEventListener('click', function () {
        STATE.forEvent = e.id; closeSheet(); showPane('companion');
        $$('#ev-for button').forEach(function (o) {
          var on = o.getAttribute('data-ev-id') === e.id;
          o.classList.toggle('is-on', on); o.setAttribute('aria-checked', on ? 'true':'false');
        });
        renderCompanions(); announce('Companions re-scored for ' + e.name + '.');
      });
      var conc = el('button', 'btn', 'Ask the concierge'); conc.type = 'button';
      conc.addEventListener('click', function () { closeSheet(); showPane('concierge'); });
      foot.appendChild(find); foot.appendChild(conc);
      sheetBody.appendChild(foot);

      sheet.hidden = false; document.body.style.overflow = 'hidden';
      $('.ltr-sheet__close', sheet).focus();
    }

    function openCompanion(c, e, straightToRequest) {
      sheetBody.textContent = '';
      var f = factors(c, e), s = score(f);
      var head = el('div', 'ltr-sheet__head');
      var img = el('img', 'ltr-sheet__plate'); img.src = MATCH.plate(c.id + c.name);
      img.alt=''; img.setAttribute('aria-hidden','true'); head.appendChild(img);
      var hb = el('div');
      if (c.verified) hb.appendChild(MATCH.badge(true));
      var h = el('h2', null, c.name + ', ' + c.age); h.id = 'ltr-sheet-name'; hb.appendChild(h);
      hb.appendChild(el('p', 'ltr-sheet__where', c.city + ' · ' + c.langs.join(', ')));
      hb.appendChild(el('p', 'ltr-sheet__score', s + '% event compatibility' + (e ? ' for ' + e.name.toLowerCase() : '')));
      head.appendChild(hb); sheetBody.appendChild(head);

      var acts = el('div', 'ltr-sheet__acts');
      var req = el('button', 'btn btn--solid'); req.type = 'button';
      var report = el('button', 'btn btn--quiet', 'Report'); report.type = 'button';
      var block = el('button', 'btn btn--quiet', 'Block'); block.type = 'button';
      var box = el('div', 'ltr-connect'); box.hidden = true;
      var key = e ? e.id + '|' + c.id : null;
      function paint() {
        req.textContent = !e ? 'Choose an evening first' : (REQ[key] || 'Request companion');
        req.disabled = !e || !!REQ[key];
      }
      function openReq() {
        if (!e) return;
        box.hidden = false; box.textContent = '';
        box.appendChild(el('p','ask__lbl','Request ' + c.name + ' for this evening'));
        var dl = el('dl','kv');
        [['Event', e.name], ['Date', fmt(e.date) + ' · ' + e.time], ['Location', e.city + ' · ' + e.venue],
         ['Dress', e.dress], ['She is', freeFor(c, e) ? 'free that evening' : 'not free that evening']]
          .forEach(function (r) { dl.appendChild(el('dt',null,r[0])); dl.appendChild(el('dd',null,r[1])); });
        box.appendChild(dl);
        var ta = el('textarea'); ta.rows = 3; ta.placeholder = 'Optional message';
        ta.setAttribute('aria-label','Optional message to ' + c.name);
        box.appendChild(ta);
        var send = el('button','btn btn--solid','Send private request'); send.type='button';
        send.addEventListener('click', function () {
          REQ[key] = 'Requested';
          box.textContent = '';
          box.appendChild(el('p','ltr-sent',
            'Requested. She sees the evening, the hour and the dress — not your surname, and nothing about why you are going. ' +
            'If she accepts, the concierge confirms the table and writes to you both.'));
          paint(); renderUpcoming(); renderCompanions();
          announce('Companion requested for ' + e.name + '.');
        });
        box.appendChild(send); ta.focus();
      }
      req.addEventListener('click', openReq);
      report.addEventListener('click', function () { note(report, 'Read by a person today, not a queue. She is never told who reported her.'); });
      block.addEventListener('click', function () { note(block, c.name + ' is blocked and will not be curated to you again.'); });
      [req, report, block].forEach(function (b) { acts.appendChild(b); });
      paint(); sheetBody.appendChild(acts); sheetBody.appendChild(box);

      var about = el('div','panel');
      about.appendChild(MATCH.head('About ' + c.name));
      var ab = el('div','panel__body');
      ab.appendChild(el('p','ltr-about', c.about));
      var dl2 = el('dl','kv');
      [['Social style', c.social], ['Communication', c.comms], ['Lifestyle', c.lifestyle],
       ['Interests', c.interests.join(', ')], ['Languages', c.langs.join(', ')],
       ['Evenings attended', String(c.attended)], ['Available for', c.kinds.join(', ')]]
        .forEach(function (r) { dl2.appendChild(el('dt',null,r[0])); dl2.appendChild(el('dd',null,r[1])); });
      ab.appendChild(dl2);
      ab.appendChild(el('div','note-inline',
        'Which evenings she has attended, and with whom, is not shown here and is not shown to anyone. The count is all the house will say.'));
      about.appendChild(ab); sheetBody.appendChild(about);

      var why = el('div','panel');
      why.appendChild(MATCH.head('Event compatibility', s + '%'));
      var wb = el('div','panel__body');
      var bars = el('div','ltr-bars');
      Object.keys(f).forEach(function (k) {
        var r = el('div','ltr-bars__row');
        r.appendChild(el('span','k',LABELS[k]));
        var bb = el('span','b'); var fi = el('i'); fi.style.width = f[k] + '%'; bb.appendChild(fi);
        r.appendChild(bb); r.appendChild(el('span','v',f[k] + '%'));
        bars.appendChild(r);
      });
      wb.appendChild(bars);
      wb.appendChild(el('p','ltr-insight', e
        ? 'For ' + e.name.toLowerCase() + ' on ' + fmt(e.date) + ': ' +
          (freeFor(c,e) ? 'she is free' : 'she is not free that evening, which is the first thing to fix') +
          ', ' + (c.city === e.city ? 'already in ' + e.city : 'she would travel from ' + c.city) +
          (c.kinds.indexOf(STATE.kind) > -1 ? ', and she takes this kind of evening.' : ', though this is not a kind of evening she usually takes.')
        : 'Choose an evening and this is recomputed against its date, its city and its kind — the three that move the figure most.'));
      why.appendChild(wb); sheetBody.appendChild(why);

      sheet.hidden = false; document.body.style.overflow = 'hidden';
      $('.ltr-sheet__close', sheet).focus();
      if (straightToRequest) openReq();
    }
    function closeSheet() { sheet.hidden = true; document.body.style.overflow = ''; }

    /* -- controls -------------------------------------------------------------- */
    function showPane(which) {
      $$('.ev-tabs button').forEach(function (b) {
        b.setAttribute('aria-selected', b.getAttribute('data-ev') === which ? 'true' : 'false');
      });
      ['discover','companion','prefs','concierge'].forEach(function (p) {
        $('#ev-pane-' + p).hidden = p !== which;
      });
    }
    $$('.ev-tabs button').forEach(function (b) {
      b.addEventListener('click', function () { showPane(b.getAttribute('data-ev')); });
    });

    var catsWrap = $('#ev-cats');
    CATS.forEach(function (c) {
      var b = el('button'); b.type='button'; b.setAttribute('data-cat', c.id); b.setAttribute('role','tab');
      b.setAttribute('aria-selected', c.id === STATE.cat ? 'true':'false');
      b.appendChild(el('span','ltr-tab__l', c.label));
      b.appendChild(el('span','ltr-tab__n', c.note));
      b.addEventListener('click', function () { STATE.cat = c.id; renderEvents(); });
      catsWrap.appendChild(b);
    });

    var forWrap = $('#ev-for');
    EVENTS.forEach(function (e) {
      var b = el('button','chip', e.name + ' · ' + fmt(e.date));
      b.type='button'; b.setAttribute('role','radio'); b.setAttribute('aria-checked','false');
      b.setAttribute('data-ev-id', e.id);
      b.addEventListener('click', function () {
        STATE.forEvent = e.id;
        $$('button', forWrap).forEach(function (o) {
          o.classList.toggle('is-on', o === b); o.setAttribute('aria-checked', o === b ? 'true':'false');
        });
        renderCompanions(); announce('Companions re-scored for ' + e.name + '.');
      });
      forWrap.appendChild(b);
    });
    var kindWrap = $('#ev-kind');
    KINDS.forEach(function (k) {
      var b = el('button', 'chip' + (k === STATE.kind ? ' is-on' : ''), k);
      b.type='button'; b.setAttribute('role','radio');
      b.setAttribute('aria-checked', k === STATE.kind ? 'true':'false');
      b.addEventListener('click', function () {
        STATE.kind = k;
        $$('button', kindWrap).forEach(function (o) {
          o.classList.toggle('is-on', o === b); o.setAttribute('aria-checked', o === b ? 'true':'false');
        });
        renderCompanions();
      });
      kindWrap.appendChild(b);
    });

    var langs = ['Any'].concat(COMPANIONS.reduce(function (a,c) { return a.concat(c.langs); }, [])
      .filter(function (v,i,a) { return a.indexOf(v) === i; }).sort());
    [ { k:'ageMin', label:'Minimum age', type:'number', value:28 },
      { k:'ageMax', label:'Maximum age', type:'number', value:44 },
      { k:'language', label:'Speaks', type:'select', options:langs },
      { k:'social', label:'Social style', type:'select', options:['Any','Confident, selective','Warm, sociable','Quiet, observant'] },
      { k:'comms', label:'Communication', type:'select', options:['Any','Direct','Warm','Considered'] }
    ].forEach(function (d) { $('#ev-cprefs').appendChild(field(d, STATE.cprefs, renderCompanions, 'ev-c')); });

    [ { k:'city', label:'Preferred city', type:'select', options:['Munich','Vienna','Zurich','Salzburg'], value:'Munich' },
      { k:'size', label:'Group size', type:'select', options:['Any','Four to eight','Eight to sixteen','Sixteen or more'] },
      { k:'time', label:'Preferred time', type:'select', options:['Any','Evening','Afternoon','Weekend'] },
      { k:'dress', label:'Dress', type:'select', options:['Any','Informal','Business','Cocktail','Black tie'] }
    ].forEach(function (d) { $('#ev-prefs').appendChild(field(d, STATE.prefs, renderEvents, 'ev-p')); });

    [ { k:'activity', label:'My event activity visible to', type:'select', options:['Nobody','My advisor only','Members I have accepted'] },
      { k:'travel', label:'My travel plans visible to', type:'select', options:['Nobody','My advisor only','Members I am introduced to'] },
      { k:'companion', label:'Who I attended with', type:'select', options:['Nobody — the two of us and my advisor'] },
      { k:'contact', label:'Who may request me as a companion', type:'select', options:['Verified members','Members I am introduced to','Nobody'] }
    ].forEach(function (d) { $('#ev-privacy').appendChild(field(d, STATE.priv, function () {}, 'ev-pv')); });

    var conciergeKinds = ['Find a companion','Change an arrangement','Arrange transport',
                          'Recommend a restaurant','A private venue','A special request'];
    var concPick = conciergeKinds[0];
    conciergeKinds.forEach(function (k) {
      var b = el('button','chip' + (k === concPick ? ' is-on' : ''), k);
      b.type='button'; b.setAttribute('role','radio');
      b.setAttribute('aria-checked', k === concPick ? 'true':'false');
      b.addEventListener('click', function () {
        concPick = k;
        $$('#ev-conc-kinds button').forEach(function (o) {
          o.classList.toggle('is-on', o === b); o.setAttribute('aria-checked', o === b ? 'true':'false');
        });
      });
      $('#ev-conc-kinds').appendChild(b);
    });
    $('#ev-conc-send').addEventListener('click', function () {
      var out = $('#ev-conc-out'); out.textContent = '';
      out.appendChild(el('p','ltr-sent',
        '"' + concPick + '" is with the concierge. A person, by name, in your own hours — they will telephone rather than write unless you have said otherwise, and you will hear today.'));
      $('#ev-conc-text').value = '';
      announce('Sent to the concierge.');
    });
    $('#ev-verified-only').addEventListener('change', function () {
      STATE.verifiedOnly = this.checked; renderCompanions();
    });

    renderUpcoming(); renderEvents(); renderCompanions();
  })();

  route();
})();
