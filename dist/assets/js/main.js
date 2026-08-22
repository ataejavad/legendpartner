/* ============================================================================
   LEGEND — interaction layer
   Principles: nothing moves without reason; everything eases in from stillness;
   all motion is disabled under prefers-reduced-motion.
   ========================================================================== */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* --- 01. Entry ---------------------------------------------------------- */
  window.addEventListener('load', function () {
    document.body.classList.add('is-loaded');
  });
  // Failsafe: never leave a visitor behind a curtain.
  setTimeout(function () { document.body.classList.add('is-loaded'); }, 2200);

  /* --- 02. Reveal on scroll ---------------------------------------------- */
  var staggered = $$('[data-stagger]');
  staggered.forEach(function (group) {
    var step = parseInt(group.getAttribute('data-stagger'), 10) || 90;
    $$('.mask-line, [data-child]', group).forEach(function (el, i) {
      el.style.setProperty('--delay', (i * step) + 'ms');
    });
  });

  var targets = $$('[data-reveal]');
  if (reduced || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    targets.forEach(function (el) { io.observe(el); });

    // Safety net: if the observer never fires (exotic embeds, prerender, printing),
    // anything already within the viewport is shown rather than left invisible.
    setTimeout(function () {
      targets.forEach(function (el) {
        if (el.classList.contains('is-in')) return;
        if (el.getBoundingClientRect().top < window.innerHeight) { el.classList.add('is-in'); }
      });
    }, 3000);
  }

  /* --- 03. Navigation ----------------------------------------------------- */
  var nav = $('.nav');

  // Mark the page we are on, in both the bar and the mobile menu.
  (function () {
    var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    $$('.nav__links a, .menu__links a').forEach(function (a) {
      var target = (a.getAttribute('href') || '').toLowerCase();
      if (target === here) { a.setAttribute('aria-current', 'page'); }
    });
  })();

  var chapters = $$('.chapter, .hero, .footer');
  var lastY = window.pageYOffset;

  function tone() {
    if (!nav) return;
    var probe = nav.offsetHeight * 0.55;
    var current = null;
    for (var i = 0; i < chapters.length; i++) {
      var r = chapters[i].getBoundingClientRect();
      if (r.top <= probe && r.bottom > probe) { current = chapters[i]; }
    }
    var light = current && current.classList.contains('chapter--light');
    nav.classList.toggle('nav--onlight', !!light);
  }

  function onScroll() {
    if (!nav) return;
    var y = window.pageYOffset;
    nav.classList.toggle('is-stuck', y > 40);
    // Retire the bar while descending; return it the moment the reader looks up.
    var hide = y > 420 && y > lastY && !document.body.classList.contains('menu-open');
    nav.classList.toggle('is-hidden', hide);
    lastY = y;
    tone();
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () { onScroll(); ticking = false; });
  }, { passive: true });
  window.addEventListener('resize', tone);
  onScroll();

  /* --- 04. Mobile menu ---------------------------------------------------- */
  var toggle = $('.nav__toggle');
  var menu = $('.menu');
  if (toggle && menu) {
    $$('.menu__links a').forEach(function (a, i) {
      a.style.transitionDelay = (120 + i * 55) + 'ms';
    });
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.setAttribute('aria-hidden', open ? 'false' : 'true');
      if (open) { nav.classList.remove('is-hidden'); }
    });
    $$('.menu a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
        document.body.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* --- 05. Accordion ------------------------------------------------------ */
  $$('.acc').forEach(function (acc) {
    var items = $$('.acc__item', acc);
    items.forEach(function (item) {
      var q = $('.acc__q', item);
      var a = $('.acc__a', item);
      if (!q || !a) return;
      q.addEventListener('click', function () {
        var open = item.classList.contains('is-open');
        items.forEach(function (other) {
          if (other === item) return;
          other.classList.remove('is-open');
          $('.acc__a', other).style.height = '0px';
          $('.acc__q', other).setAttribute('aria-expanded', 'false');
        });
        item.classList.toggle('is-open', !open);
        q.setAttribute('aria-expanded', !open ? 'true' : 'false');
        a.style.height = !open ? a.firstElementChild.offsetHeight + 'px' : '0px';
      });
    });
    window.addEventListener('resize', function () {
      items.forEach(function (item) {
        if (item.classList.contains('is-open')) {
          var a = $('.acc__a', item);
          a.style.height = a.firstElementChild.offsetHeight + 'px';
        }
      });
    });
  });

  /* --- 06. Subtle depth on hero art -------------------------------------- */
  var heroArt = $('.hero__bg');
  if (heroArt && !reduced) {
    window.addEventListener('scroll', function () {
      var y = window.pageYOffset;
      if (y < window.innerHeight * 1.2) {
        heroArt.style.transform = 'translate3d(0,' + (y * 0.06) + 'px,0)';
      }
    }, { passive: true });
  }

  /* --- 07. Private application — staged intake --------------------------- */
  var form = $('#application');
  if (form) {
    var panels = $$('.step-panel', form);
    var stepsList = $$('.steps li');
    var bar = $('.progress i');
    var counter = $('.counter');
    var back = $('#back');
    var next = $('#next');
    var index = 0;

    function paint() {
      panels.forEach(function (p, i) { p.classList.toggle('is-active', i === index); });
      stepsList.forEach(function (s, i) {
        s.classList.toggle('is-active', i === index);
        s.classList.toggle('is-done', i < index);
      });
      if (bar) bar.style.width = ((index) / (panels.length - 1) * 100) + '%';
      if (counter) counter.textContent = pad(index + 1) + ' / ' + pad(panels.length);
      if (back) back.style.visibility = index === 0 ? 'hidden' : 'visible';
      if (next) {
        var last = index === panels.length - 1;
        next.querySelector('.label').textContent = last ? 'Submit application' : 'Continue';
      }
      var top = form.getBoundingClientRect().top + window.pageYOffset - 110;
      if (window.pageYOffset > top + 40) window.scrollTo({ top: top, behavior: reduced ? 'auto' : 'smooth' });
    }

    function pad(n) { return (n < 10 ? '0' : '') + n; }

    function validate(panel) {
      var ok = true;
      $$('[required]', panel).forEach(function (input) {
        var field = input.closest('.field') || input.closest('.field-group');
        var valid = input.type === 'checkbox' ? input.checked : String(input.value).trim() !== '';
        if (valid && input.type === 'email') {
          valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
        }
        if (field) field.classList.toggle('is-error', !valid);
        if (!valid && ok) { input.focus(); }
        if (!valid) ok = false;
      });
      return ok;
    }

    form.addEventListener('input', function (e) {
      var field = e.target.closest('.field, .field-group');
      if (field) field.classList.remove('is-error');
    });

    if (next) {
      next.addEventListener('click', function () {
        if (!validate(panels[index])) return;
        if (index < panels.length - 1) { index++; paint(); return; }
        // Final step — no backend in this build; the intake is handed to the office.
        form.classList.add('hide');
        var done = $('#received');
        if (done) {
          done.classList.remove('hide');
          done.setAttribute('tabindex', '-1');
          done.focus();
          window.scrollTo({ top: done.getBoundingClientRect().top + window.pageYOffset - 120, behavior: reduced ? 'auto' : 'smooth' });
        }
      });
    }
    if (back) {
      back.addEventListener('click', function () { if (index > 0) { index--; paint(); } });
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    form.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); next && next.click(); }
    });
    paint();
  }

  /* --- 08. Year stamp ----------------------------------------------------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();

/* --- Professional referral enquiry ---------------------------------------
   Front-end only, like the application: wire to a secure endpoint at launch. */
(function () {
  var form = document.getElementById('referral-form');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    Array.prototype.forEach.call(form.querySelectorAll('[required]'), function (input) {
      var field = input.closest('.field');
      var valid = String(input.value).trim() !== '';
      if (valid && input.type === 'email') {
        valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
      }
      if (field) field.classList.toggle('is-error', !valid);
      if (!valid && ok) input.focus();
      if (!valid) ok = false;
    });
    if (!ok) return;
    form.classList.add('hide');
    var done = document.getElementById('referral-done');
    if (done) { done.classList.remove('hide'); done.setAttribute('tabindex', '-1'); done.focus(); }
  });
  form.addEventListener('input', function (e) {
    var field = e.target.closest('.field');
    if (field) field.classList.remove('is-error');
  });
})();

/* --- Language selector ----------------------------------------------------
   Translations are not shipped yet. Rather than route to a page that does not
   exist, the control states plainly that the language is forthcoming. A luxury
   brand cannot ship machine translation; these need professional translators. */
(function () {
  var links = document.querySelectorAll('[data-lang]');
  if (!links.length) return;
  var NAMES = { fr: 'Français', ar: 'العربية', zh: '中文' };
  Array.prototype.forEach.call(links, function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var code = a.getAttribute('data-lang');
      var row = a.closest('.footer__lang');
      var existing = row.querySelector('.lang-note');
      if (existing) existing.remove();
      var note = document.createElement('span');
      note.className = 'lang-note';
      note.setAttribute('role', 'status');
      note.style.cssText = 'display:block;margin-top:.6rem;color:var(--champagne);letter-spacing:.06em';
      note.textContent = NAMES[code] + ' — forthcoming. Write to the office and we will correspond with you in it now.';
      row.appendChild(note);
    });
  });
})();

/* --- Correspondent enquiry (home page) ------------------------------------
   Same contract as the other intakes: front-end only until an endpoint exists. */
(function () {
  var form = document.getElementById('correspondent-form');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    Array.prototype.forEach.call(form.querySelectorAll('[required]'), function (input) {
      var field = input.closest('.field');
      var valid = String(input.value).trim() !== '';
      if (valid && input.type === 'email') {
        valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
      }
      if (field) field.classList.toggle('is-error', !valid);
      if (!valid && ok) input.focus();
      if (!valid) ok = false;
    });
    if (!ok) return;
    form.classList.add('hide');
    var done = document.getElementById('correspondent-done');
    if (done) { done.classList.remove('hide'); done.setAttribute('tabindex', '-1'); done.focus(); }
  });
  form.addEventListener('input', function (e) {
    var field = e.target.closest('.field');
    if (field) field.classList.remove('is-error');
  });
})();

/* --- Verification lookup --------------------------------------------------
   Preview only: two codes are answered from a local table. In the real build
   this is a server lookup that is rate limited, non-enumerable, and returns
   only the fields the holder has chosen to reveal. Never expose a list. */
(function () {
  var form = document.getElementById('verify-form');
  if (!form) return;

  var RECORDS = {
    '7K4M-2QX9-8HTD': {
      state: 'valid',
      name: 'Marguerite',
      attest: [
        ['Verified', 'In person, by an advisor of the house'],
        ['Identity', 'Confirmed against documents, 5 August 2026'],
        ['Circumstances', 'Confirmed as described at that date'],
        ['Revealed by holder', 'First name and city'],
        ['City', 'London'],
        ['Mark placed on', 'A professional profile'],
        ['Status', 'Active — last confirmed by the holder 18 August 2026']
      ]
    },
    '3PN7-XKD2-9RWA': {
      state: 'void',
      name: 'Withdrawn',
      attest: [
        ['Status', 'Withdrawn by the holder, 11 June 2026'],
        ['What this means', 'The mark is no longer current. It may have been retired for an ordinary reason — a profile closed, a code replaced — or because the house withdrew it.'],
        ['What we will not say', 'Which of those it was'],
        ['If it is still displayed', 'Treat it as an image, not as verification']
      ]
    }
  };

  var box = document.getElementById('vf-result');
  var input = document.getElementById('vf-code');

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function render(code) {
    var rec = RECORDS[code];
    box.hidden = false;

    if (!rec) {
      box.className = 'result result--void';
      box.innerHTML =
        '<p class="result__state">No such mark</p>' +
        '<p class="result__name">We do not recognise this code.</p>' +
        '<p class="quiet mt-m" style="max-width:56ch">Check it character by character — there is no O, I or U in a Legend code. ' +
        'If it is written correctly and still not recognised, the mark was not issued by us and you should treat whatever it is attached to accordingly.</p>';
      return;
    }

    box.className = 'result result--' + (rec.state === 'valid' ? 'valid' : 'void');
    var rows = rec.attest.map(function (r) {
      return '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>';
    }).join('');

    box.innerHTML =
      '<p class="result__state">' + (rec.state === 'valid' ? 'Mark is current' : 'Mark withdrawn') + '</p>' +
      '<p class="result__name">' + esc(rec.name) + '</p>' +
      '<dl class="attest">' + rows + '</dl>' +
      '<p class="quiet mt-m" style="max-width:60ch">This confirms identity as at the date shown. It is not a statement about ' +
      'character, conduct or safety, and it does not mean the holder is a client of ours.</p>';
  }

  function normalise(v) {
    var clean = v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
    return clean.replace(/(.{4})(?=.)/g, '$1-');
  }

  input.addEventListener('input', function () {
    var pos = input.selectionStart === input.value.length;
    input.value = normalise(input.value);
    if (pos) input.setSelectionRange(input.value.length, input.value.length);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var code = normalise(input.value);
    if (code.replace(/-/g, '').length < 12) {
      box.hidden = false;
      box.className = 'result result--void';
      box.innerHTML = '<p class="result__state">Incomplete</p><p class="result__name">A code is twelve characters.</p>';
      return;
    }
    render(code);
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-try]'), function (b) {
    b.addEventListener('click', function () {
      input.value = b.getAttribute('data-try');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
  });
})();

/* --- Legend Identity — appointment request ---------------------------------
   A service request, not an application: nobody is assessed or declined. */
(function () {
  var form = document.getElementById('identity-form');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    Array.prototype.forEach.call(form.querySelectorAll('[required]'), function (input) {
      var field = input.closest('.field') || input.closest('.field-group');
      var valid = input.type === 'checkbox' ? input.checked : String(input.value).trim() !== '';
      if (valid && input.type === 'email') {
        valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
      }
      if (field) field.classList.toggle('is-error', !valid);
      if (!valid && ok) input.focus();
      if (!valid) ok = false;
    });
    if (!ok) return;
    form.classList.add('hide');
    var done = document.getElementById('identity-done');
    if (done) { done.classList.remove('hide'); done.setAttribute('tabindex', '-1'); done.focus(); }
  });
  form.addEventListener('input', function (e) {
    var field = e.target.closest('.field, .field-group');
    if (field) field.classList.remove('is-error');
  });
})();
