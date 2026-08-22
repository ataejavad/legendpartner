/* ============================================================================
   LEGEND — Advisor Console
   A preview build: no network, no storage, no authentication. The caseload is
   illustrative and every action is local to the page.
   ========================================================================== */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var now = new Date();

  var TITLES = {
    caseload: 'Caseload',
    file: 'Member file',
    inbound: 'From members',
    relationship: 'Relationship work',
    pipeline: 'Candidate pipeline',
    compose: 'Write a case',
    transcripts: 'Persona transcripts',
    verification: 'Verification',
    consents: 'Consents to obtain',
    queue: 'Conduct queue'
  };

  var el = $('#today');
  if (el) el.textContent = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  /* --- Entry -------------------------------------------------------------- */
  var lock = $('#lock'), portal = $('#portal'), lockForm = $('#lock-form');
  if (lockForm) {
    lockForm.addEventListener('submit', function (e) {
      e.preventDefault();          // nothing validated, sent, or stored
      lock.hidden = true;
      portal.hidden = false;
      route();
    });
  }
  var out = $('#sign-out');
  if (out) {
    out.addEventListener('click', function (e) {
      e.preventDefault();
      portal.hidden = true;
      lock.hidden = false;
      document.title = 'Advisor Console — Legend';
      window.scrollTo(0, 0);
    });
  }

  /* --- Routing ------------------------------------------------------------ */
  function route() {
    var name = (location.hash || '#caseload').replace('#', '');
    if (!TITLES[name]) name = 'caseload';

    $$('.view').forEach(function (v) { v.classList.toggle('is-active', v.id === 'view-' + name); });
    $$('#rail-nav a').forEach(function (a) {
      if (a.getAttribute('data-view') === name) { a.setAttribute('aria-current', 'page'); }
      else { a.removeAttribute('aria-current'); }
    });

    var title = $('#view-title');
    if (title) title.textContent = TITLES[name];

    var current = $('#rail-nav a[aria-current="page"]');
    if (current && current.scrollIntoView) {
      current.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
    }

    var view = $('#view-' + name);
    if (view && !portal.hidden) {
      document.title = TITLES[name] + ' — Legend Console';
      view.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    }
  }
  window.addEventListener('hashchange', route);
  $$('[data-go]').forEach(function (a) {
    a.addEventListener('click', function () { location.hash = '#' + a.getAttribute('data-go'); });
  });

  /* --- Caseload → file ---------------------------------------------------- */
  var rows = $$('.case-row[data-member]');
  rows.forEach(function (row) {
    row.addEventListener('click', function () {
      rows.forEach(function (r) {
        if (r === row) { r.setAttribute('aria-current', 'true'); } else { r.removeAttribute('aria-current'); }
      });
      // Only one file is written out in this preview; the rest state so honestly.
      if (row.getAttribute('data-member') === 'marchand') {
        location.hash = '#file';
      } else {
        note(row, 'Only A. Marchand’s file is written out in this preview. The console opens any member the same way.');
      }
    });
  });

  /* --- Composing a case --------------------------------------------------- */
  var body = $('#case-body');
  var checks = $$('#checks input');
  var send = $('#send-case');

  function words(s) {
    var t = s.trim();
    return t ? t.split(/\s+/).length : 0;
  }

  function paintCompose() {
    if (!body) return;
    var n = words(body.value);
    var count = $('#case-count');
    if (count) count.textContent = n + (n === 1 ? ' word' : ' words');

    var done = checks.filter(function (c) { return c.checked; }).length;
    var label = $('#check-count');
    if (label) {
      label.textContent = done + ' of ' + checks.length;
      label.className = 'pill ' + (done === checks.length ? 'pill--live' : 'pill--action');
    }
    if (send) send.disabled = !(done === checks.length && n >= 250);
  }

  if (body) {
    body.addEventListener('input', paintCompose);
    checks.forEach(function (c) { c.addEventListener('change', paintCompose); });
    paintCompose();
  }

  if (send) {
    send.addEventListener('click', function () {
      note(send, 'Sent. It appears in his portal as an introduction awaiting consideration, and nothing is said to the other party until he agrees.');
      send.disabled = true;
    });
  }

  /* --- Verification: the advisor's half of the mark ----------------------- */
  // Same alphabet as the member side: no O, I or U, so a code is never misread.
  var ALPHABET = '0123456789ABCDEFGHJKLMNPQRSTVWXYZ';

  function issueMark() {
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

  var vqChecks = $$('#vq-checks input');
  var vqIssue = $('#vq-issue');

  function paintVerify() {
    var done = vqChecks.filter(function (c) { return c.checked; }).length;
    var label = $('#vq-count');
    if (label) {
      label.textContent = done + ' of ' + vqChecks.length;
      label.className = 'pill ' + (done === vqChecks.length ? 'pill--live' : 'pill--action');
    }
    if (vqIssue) vqIssue.disabled = done !== vqChecks.length;
  }
  if (vqChecks.length) {
    vqChecks.forEach(function (c) { c.addEventListener('change', paintVerify); });
    paintVerify();
  }

  if (vqIssue) {
    vqIssue.addEventListener('click', function () {
      var code = issueMark();
      var stamp = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });

      var out = $('#vq-issued');
      out.hidden = false;
      out.className = 'note-inline';
      out.textContent = 'Verified and issued — ' + code + '. Recorded against your name, dated ' +
        stamp + '. It is now in N. Haddad’s portal, where they choose where to place it and what ' +
        'it reveals. Nobody but they can withdraw it, except the house.';

      // It also appears in the list of marks this advisor stands behind.
      var row = document.createElement('div');
      row.className = 'placement';
      var left = document.createElement('div');
      var who = document.createElement('p');
      who.className = 'where';
      who.textContent = 'N. Haddad';
      var meta = document.createElement('p');
      meta.className = 'meta';
      var codeEl = document.createElement('span');
      codeEl.className = 'code code--sm';
      codeEl.textContent = code;
      meta.appendChild(codeEl);
      meta.appendChild(document.createTextNode(' · issued ' + stamp + ' · not yet checked'));
      left.appendChild(who); left.appendChild(meta);

      var pill = document.createElement('span');
      pill.className = 'pill pill--live';
      pill.textContent = 'Active';

      var kill = document.createElement('button');
      kill.className = 'btn btn--quiet';
      kill.type = 'button';
      kill.setAttribute('data-withdraw', '');
      kill.textContent = 'Withdraw';
      wireWithdraw(kill);

      row.appendChild(left); row.appendChild(pill); row.appendChild(kill);
      $('#adv-marks').appendChild(row);

      vqIssue.disabled = true;
      vqChecks.forEach(function (c) { c.checked = false; c.disabled = true; });
      paintVerify();
      var badge = $('#rail-nav a[data-view="verification"] .count');
      if (badge) badge.textContent = '1';
    });
  }

  function wireWithdraw(btn) {
    btn.addEventListener('click', function () {
      var row = btn.closest('.placement');
      row.classList.add('placement--void');
      var pill = $('.pill', row);
      pill.className = 'pill pill--rest';
      pill.textContent = 'Withdrawn';
      $('.meta', row).appendChild(document.createTextNode(' · withdrawn by the house, today'));
      btn.replaceWith(document.createTextNode('—'));
      note(row, 'Withdrawn at once and permanently. Anyone checking that code is told the mark was withdrawn. A new verification in person would be needed to issue another.');
    });
  }
  $$('[data-withdraw]').forEach(wireWithdraw);

  /* --- Reading what members sent ------------------------------------------ */
  // A reflection that is written and never read is worse than one never written:
  // the member believes it was received. Marking one read decrements the tray.
  $$('[data-readref]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.queue__item');
      item.classList.remove('queue__item--urgent');
      var pill = $('.pill', item);
      pill.className = 'pill pill--rest';
      pill.textContent = 'Read';
      btn.replaceWith(document.createTextNode(''));

      var left = $$('#reflections-in .pill--action').length;
      var badge = $('#rail-nav a[data-view="inbound"] .count');
      if (badge) {
        var n = Math.max(0, parseInt(badge.textContent, 10) - 1);
        if (n) { badge.textContent = n; } else { badge.remove(); }
      }
      note(item, left
        ? 'Read, and the member can see that it was. One reflection still unread.'
        : 'Read. Everything a member has written to you has now been seen — which is the only state this page should ever rest in.');
    });
  });

  /* --- Small disclosures -------------------------------------------------- */
  function note(trigger, text) {
    var anchor = trigger.closest('.case-row, .queue__item') || trigger;
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

  route();
})();
