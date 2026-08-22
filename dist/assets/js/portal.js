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

  var TITLES = {
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

  var greet = $('#greeting');
  if (greet) {
    var h = now.getHours();
    greet.textContent = (h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening') + ', A. Marchand.';
  }

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

  /* --- Routing ------------------------------------------------------------ */
  function route() {
    var name = (location.hash || '#overview').replace('#', '');
    if (!TITLES[name]) name = 'overview';

    $$('.view').forEach(function (v) {
      v.classList.toggle('is-active', v.id === 'view-' + name);
    });
    $$('#rail-nav a').forEach(function (a) {
      var on = a.getAttribute('data-view') === name;
      if (on) { a.setAttribute('aria-current', 'page'); } else { a.removeAttribute('aria-current'); }
    });

    var title = $('#view-title');
    if (title) title.textContent = TITLES[name];

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

  route();
})();
