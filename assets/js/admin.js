/* ============================================================================
   LEGEND — Principal Panel
   A preview build: no network, no storage, no authentication. Every figure and
   name is illustrative, and every action is local to the page.
   ========================================================================== */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var now = new Date();

  var TITLES = {
    house:      'The house',
    admissions: 'Admissions',
    conduct:    'Conduct',
    members:    'Members',
    people:     'Advisors',
    fees:       'Fees & renewals',
    identity:   'Identity service',
    audit:      'Audit trail',
    settings:   'Standards & terms'
  };

  var el = $('#today');
  if (el) el.textContent = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  var greet = $('#greeting');
  if (greet) {
    var h = now.getHours();
    greet.textContent = (h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening') + ', M. Aumont.';
  }

  /* --- Entry -------------------------------------------------------------- */
  var lock = $('#lock'), panel = $('#portal'), lockForm = $('#lock-form');
  if (lockForm) {
    lockForm.addEventListener('submit', function (e) {
      e.preventDefault();          // nothing validated, sent, or stored
      lock.hidden = true;
      panel.hidden = false;
      route();
    });
  }
  var out = $('#sign-out');
  if (out) {
    out.addEventListener('click', function (e) {
      e.preventDefault();
      panel.hidden = true;
      lock.hidden = false;
      document.title = 'The House — Legend';
      window.scrollTo(0, 0);
    });
  }

  /* --- Routing ------------------------------------------------------------ */
  function route() {
    var name = (location.hash || '#house').replace('#', '');
    if (!TITLES[name]) name = 'house';

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
    if (view && !panel.hidden) {
      document.title = TITLES[name] + ' — Legend';
      view.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    }
  }
  window.addEventListener('hashchange', route);
  $$('[data-go]').forEach(function (a) {
    a.addEventListener('click', function () { location.hash = '#' + a.getAttribute('data-go'); });
  });

  /* --- A decision, and the line it writes to the audit trail -------------- */
  // Every principal decision is recorded. Writing it here, in the same gesture
  // that takes it, is the whole point of the instrument.
  function toAudit(who, what, tag, flag) {
    var audit = $('.audit');
    if (!audit) return;
    var row = document.createElement('div');
    row.className = 'audit__row' + (flag ? ' audit__row--flag' : '');
    [['audit__when', 'Just now'],
     ['audit__who', who],
     ['audit__what', what],
     ['audit__tag', tag]
    ].forEach(function (pair) {
      var s = document.createElement('span');
      s.className = pair[0];
      s.textContent = pair[1];
      row.appendChild(s);
    });
    audit.insertBefore(row, audit.firstChild);
  }

  function settle(card, pillClass, pillText, message) {
    var pill = $('.pill', card);
    if (pill) { pill.className = 'pill ' + pillClass; pill.textContent = pillText; }
    var acts = $('.decision__acts', card);
    if (acts) {
      var note = document.createElement('p');
      note.className = 'note-inline';
      note.style.marginTop = '0';
      note.textContent = message;
      acts.replaceWith(note);
    }
    card.classList.remove('decision--open', 'decision--grave');
  }

  function retally(selector, view) {
    var left = $$(selector + ' .pill--action').length;
    var badge = $('#rail-nav a[data-view="' + view + '"] .count');
    if (badge) { if (left) { badge.textContent = left; } else { badge.remove(); } }
  }

  /* --- Admissions --------------------------------------------------------- */
  $$('[data-adm-act]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var card = btn.closest('[data-adm]');
      var act = btn.getAttribute('data-adm-act');
      var ref = $('.quiet', card).textContent.split('·')[0].trim();

      var copy = {
        accept:  ['pill--live', 'Accepted', 'Accepted. The advisor is told today and writes to the applicant themselves — an acceptance from a principal reads as a formality, which it is not.'],
        decline: ['pill--rest', 'Declined', 'Declined, and it goes out over your name with a reason in it. No form letter, and no charge has been made at any point.'],
        defer:   ['pill--rest', 'Deferred', 'Deferred until you have spoken to the advisor. The applicant is told there is no decision yet rather than left silent.']
      }[act];

      settle(card, copy[0], copy[1], copy[2]);
      toAudit('M. Aumont', ref + ' — ' + copy[1].toLowerCase() + ' by a principal', 'Admission', false);
      retally('#admissions', 'admissions');
    });
  });

  /* --- Conduct ------------------------------------------------------------ */
  $$('[data-cond-act]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var card = btn.closest('[data-cond]');
      var act = btn.getAttribute('data-cond-act');

      var copy = {
        remove: ['pill--rest', 'Removed from the network',
                 'Removed. The engagement ends today, the fee is not returned, and the other party is told what the house has done and why. The reporting member is not named to anyone, now or later. Recorded permanently against your name.'],
        warn:   ['pill--action', 'Principal to speak to him',
                 'A call, on the record, with a second principal present. He is told there have been two reports and that a third ends the engagement. She is told what was decided before he is.'],
        review: ['pill--action', 'Both reports opened',
                 'Both reports opened in full. This reading is itself written to the audit trail — a principal reading a member file is not exempt from the instrument.']
      }[act];

      settle(card, copy[0], copy[1], copy[2]);
      toAudit('M. Aumont', 'Conduct 2608-03 — ' + copy[1].toLowerCase(), 'Principal', act === 'remove');
      retally('#view-conduct', 'conduct');
    });
  });

  /* --- Small disclosures -------------------------------------------------- */
  function note(trigger, text) {
    var anchor = trigger.closest('tr, .toggle-row, .decision') || trigger;
    var existing = anchor.nextElementSibling;
    if (existing && existing.classList && existing.classList.contains('note-inline')) { existing.remove(); return; }
    $$('.note-inline.is-transient').forEach(function (n) { n.remove(); });

    var div = document.createElement('div');
    div.className = 'note-inline is-transient';
    div.setAttribute('role', 'status');
    div.textContent = text;

    // A table row cannot take a div as a sibling; hang it under the table.
    if (anchor.tagName === 'TR') {
      var wrap = anchor.closest('.table-wrap') || anchor.closest('table');
      wrap.parentNode.insertBefore(div, wrap.nextSibling);
    } else {
      anchor.parentNode.insertBefore(div, anchor.nextSibling);
    }
  }

  $$('[data-note]').forEach(function (b) {
    b.addEventListener('click', function () { note(b, b.getAttribute('data-note')); });
  });

  route();
})();
