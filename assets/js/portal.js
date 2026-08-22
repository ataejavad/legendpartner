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
      var h = 0; for (var i = 0; i < p.id.length + p.name.length; i++) h = (h * 31 + (p.id + p.name).charCodeAt(i)) % 360;
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
    function el(tag, cls, text) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text != null) e.textContent = text;
      return e;
    }
    function field(def, store, onChange) {
      var wrap = el('div', 'ltr-field');
      var id = 'ltr-f-' + def.k;
      var lab = el('label', null, def.label); lab.setAttribute('for', id);
      var input;
      if (def.type === 'select') {
        input = el('select');
        def.options.forEach(function (o) {
          var opt = el('option', null, o); opt.value = o;
          if (store[def.k] === o || (store[def.k] == null && def.value === o)) opt.selected = true;
          input.appendChild(opt);
        });
      } else {
        input = el('input'); input.type = 'number'; input.min = '18'; input.max = '99';
        input.value = store[def.k] != null ? store[def.k] : (def.value || '');
      }
      input.id = id;
      if (store[def.k] == null && def.value != null) store[def.k] = def.value;
      input.addEventListener('change', function () { store[def.k] = input.value; onChange(); });
      wrap.appendChild(lab); wrap.appendChild(input);
      return wrap;
    }

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
    function headOf(title, pill) {
      var h = el('div', 'panel__head');
      h.appendChild(el('h2', null, title));
      if (pill) h.appendChild(el('span', 'pill pill--rest', pill));
      return h;
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

  route();
})();
