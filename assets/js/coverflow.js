/* ============================================================================
   LEGEND — Coverflow
   A vanilla port of the client's React CoverflowCarousel. The geometry and the
   feel are unchanged:
     · fractional position is the single source of truth
     · distance folded onto the shorter way round the ring (no cloned nodes)
     · ramp = distance^falloff, so the rake eases off rather than folding shut
     · tilt capped short of edge-on so a far card never turns its back
     · a card is faded out by the time it teleports at half a turn
     · drag carries a velocity throw, capped at two cards
     · settle is an exponential ease-out at 0.16, not a spring
   Painted straight to the DOM — sixty updates a second is not React's business.
   ========================================================================== */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var MARK =
    '<svg class="mk" viewBox="0 0 40 40" fill="none" aria-hidden="true">' +
    '<circle cx="20" cy="20" r="18.4" stroke="currentColor" stroke-width=".9" opacity=".5"/>' +
    '<path d="M11.6 25.4h16.8" stroke="currentColor" stroke-width="1.15" stroke-linecap="square"/>' +
    '<path d="M20 10.2v15.2" stroke="currentColor" stroke-width="1.15" stroke-linecap="square"/></svg>';

  var CHEV = function (dir) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' +
      (dir === 'prev' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6') + '"/></svg>';
  };

  /* --- the artwork -------------------------------------------------------- */
  // Drawn rather than fetched: the artifact sandbox blocks remote images, and
  // this house does not use stock photography. Swap the returned string for an
  // <img src="…"> when real photography is commissioned — nothing else changes.
  function art(seed, tint) {
    var a = (seed * 37) % 360, b = (seed * 71) % 360;
    return '' +
      '<svg viewBox="0 0 600 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<defs>' +
      '<linearGradient id="g' + seed + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="hsl(' + a + ',18%,22%)"/>' +
      '<stop offset="1" stop-color="hsl(' + b + ',22%,9%)"/></linearGradient>' +
      '<radialGradient id="r' + seed + '" cx=".68" cy=".26" r=".7">' +
      '<stop offset="0" stop-color="' + tint + '" stop-opacity=".34"/>' +
      '<stop offset="1" stop-color="' + tint + '" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      '<rect width="600" height="600" fill="url(#g' + seed + ')"/>' +
      '<rect width="600" height="600" fill="url(#r' + seed + ')"/>' +
      '<g fill="none" stroke="' + tint + '" stroke-opacity=".22">' +
      '<path d="M' + (120 + seed * 17 % 200) + ' 600V' + (200 + seed * 23 % 160) +
      'a' + (70 + seed * 11 % 60) + ' ' + (70 + seed * 11 % 60) + ' 0 0 1 ' +
      (140 + seed * 13 % 90) + ' 0v' + (300 - seed * 7 % 60) + '"/>' +
      '<path d="M0 ' + (430 + seed * 19 % 90) + 'h600"/>' +
      '</g>' +
      '<g fill="' + tint + '" fill-opacity=".5">' +
      '<circle cx="' + (90 + seed * 43 % 420) + '" cy="' + (120 + seed * 29 % 300) + '" r="3.4"/>' +
      '<circle cx="' + (200 + seed * 53 % 340) + '" cy="' + (200 + seed * 31 % 260) + '" r="2.4"/>' +
      '</g></svg>';
  }

  /* --- one carousel ------------------------------------------------------- */
  function build(host) {
    var slides;
    try { slides = JSON.parse(host.getAttribute('data-slides')); }
    catch (e) { return; }
    if (!slides || !slides.length) return;

    var count = slides.length;
    var rotate = +host.dataset.rotate || 44;
    var depth = host.dataset.depth ? +host.dataset.depth : 0.6;
    var falloff = host.dataset.falloff ? +host.dataset.falloff : 0.56;
    var fade = host.dataset.fade ? +host.dataset.fade : 0.1;
    var gap = host.dataset.gap ? +host.dataset.gap : 0.05;
    var loop = host.dataset.loop !== 'false';

    var pos = 0, target = 0, width = 0, raf = null, drag = null, selected = 0;

    // --- markup
    var frame = document.createElement('div');
    frame.className = 'cf__frame';
    frame.tabIndex = 0;
    frame.setAttribute('role', 'region');
    frame.setAttribute('aria-roledescription', 'carousel');
    frame.setAttribute('aria-label', host.dataset.label || 'Carousel');

    var stage = document.createElement('div');
    stage.className = 'cf__stage';
    frame.appendChild(stage);

    var cards = slides.map(function (s, i) {
      var c = document.createElement('div');
      c.className = 'cf__card' + (s.open ? ' cf__card--open' : '');
      c.setAttribute('role', 'group');
      c.setAttribute('aria-roledescription', 'slide');
      c.setAttribute('aria-label', (i + 1) + ' of ' + count + ' — ' + (s.title || ''));
      var tag = s.tag ? '<span class="cf__tag">' + s.tag + '</span>' : '';
      c.innerHTML = tag + (s.open
        ? art(i + 3, s.tint || '#E4D6B6')
        : '<div class="cf__sealed">' + MARK + '<span class="cap">' + (s.sealed || 'Withheld until you accept') + '</span></div>');
      stage.appendChild(c);
      return c;
    });

    var wrap = document.createElement('div');
    wrap.style.position = 'relative';
    wrap.appendChild(frame);

    var prev = document.createElement('button');
    prev.type = 'button'; prev.className = 'cf__nav cf__nav--prev';
    prev.setAttribute('aria-label', 'Previous'); prev.innerHTML = CHEV('prev');
    var next = document.createElement('button');
    next.type = 'button'; next.className = 'cf__nav cf__nav--next';
    next.setAttribute('aria-label', 'Next'); next.innerHTML = CHEV('next');
    wrap.appendChild(prev); wrap.appendChild(next);
    host.appendChild(wrap);

    var cap = document.createElement('div');
    cap.className = 'cf__cap';
    cap.setAttribute('aria-live', 'polite');
    host.appendChild(cap);

    var dots = document.createElement('div');
    dots.className = 'cf__dots';
    var dotEls = slides.map(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Go to ' + (i + 1));
      b.addEventListener('click', function () { goTo(i); });
      dots.appendChild(b);
      return b;
    });
    host.appendChild(dots);

    // --- geometry
    function indexAt(p) { return ((Math.round(p) % count) + count) % count; }

    function paint() {
      if (!width) return;
      var pitch = width * (1 + gap);
      cards.forEach(function (card, index) {
        var offset = index - pos;
        if (loop) {
          offset = ((offset % count) + count) % count;
          if (offset > count / 2) offset -= count;
        }
        var distance = Math.abs(offset);
        var ramp = Math.pow(distance, falloff);
        var tilt = Math.min(rotate * ramp, 82) * Math.sign(offset);

        card.style.transform =
          'translateX(calc(-50% + ' + (offset * pitch) + 'px)) ' +
          'translateZ(' + (-depth * width * ramp) + 'px) rotateY(' + (-tilt) + 'deg)';

        var edge = loop ? Math.min(1, Math.max(0, count / 2 - distance)) : 1;
        card.style.opacity = String(Math.max(0, 1 - fade * distance) * edge);
        card.style.zIndex = String(100 - Math.round(distance));
      });
    }

    function drawCaption() {
      var s = slides[selected];
      if (!s || !s.title) { cap.innerHTML = ''; return; }
      var html = '<h4>' + s.title + '</h4>';
      if (s.subtitle) html += '<p>' + s.subtitle + '</p>';
      if (s.meta && s.meta.length) {
        html += '<dl class="cf__meta">';
        s.meta.forEach(function (m) {
          html += '<div><dt>' + m.label + '</dt><dd>' + m.value + '</dd></div>';
        });
        html += '</dl>';
      }
      cap.innerHTML = html;
      dotEls.forEach(function (d, i) { d.setAttribute('aria-current', i === selected ? 'true' : 'false'); });
    }

    function select(i) { if (i !== selected) { selected = i; drawCaption(); } }

    function settle(to) {
      if (raf !== null) cancelAnimationFrame(raf);
      target = to;
      select(indexAt(to));
      if (reduced) { pos = to; paint(); raf = null; return; }
      var step = function () {
        var remaining = target - pos;
        if (Math.abs(remaining) < 0.0004) { pos = target; paint(); raf = null; return; }
        pos += remaining * 0.16;
        paint();
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }

    function clamp(p) { return loop ? p : Math.max(0, Math.min(count - 1, p)); }
    function goTo(i) {
      var to = loop ? i + Math.round((target - i) / count) * count : i;
      settle(clamp(to));
    }
    function nudge(by) { settle(clamp(Math.round(target) + by)); }

    prev.addEventListener('click', function () { nudge(-1); });
    next.addEventListener('click', function () { nudge(1); });
    frame.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); nudge(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); nudge(1); }
    });

    // --- drag
    frame.addEventListener('pointerdown', function (e) {
      if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
      frame.setPointerCapture(e.pointerId);
      target = pos;
      drag = { id: e.pointerId, x: e.clientX, pos: pos, v: 0, t: performance.now() };
    });
    frame.addEventListener('pointermove', function (e) {
      if (!drag || drag.id !== e.pointerId) return;
      var pitch = width * (1 + gap);
      if (!pitch) return;
      var now = performance.now();
      var previous = pos;
      pos = clamp(drag.pos - (e.clientX - drag.x) / pitch);
      drag.v = ((pos - previous) / Math.max(now - drag.t, 1)) * 1000;
      drag.t = now;
      select(indexAt(pos));
      paint();
    });
    function endDrag(e) {
      if (!drag || drag.id !== e.pointerId) return;
      drag = null;
      var carried = Math.max(-2, Math.min(2, arguments[1] === undefined ? 0 : 0));
      settle(clamp(Math.round(pos + carried)));
    }
    frame.addEventListener('pointerup', function (e) {
      if (!drag || drag.id !== e.pointerId) return;
      var v = drag.v;
      drag = null;
      var carried = Math.max(-2, Math.min(2, v * 0.18));
      settle(clamp(Math.round(pos + carried)));
    });
    frame.addEventListener('pointercancel', endDrag);

    // --- measure: card width drives pitch, depth and perspective
    function measure() {
      if (!cards[0]) return;
      var w = cards[0].offsetWidth;
      if (!w) return;
      width = w;
      paint();
    }
    measure();
    if (window.ResizeObserver) { new ResizeObserver(measure).observe(frame); }
    window.addEventListener('resize', measure);

    drawCaption();
    host.dataset.built = '1';
    // The deck may be built while its view is hidden and has no box yet.
    host._cfMeasure = measure;
  }

  function boot() {
    document.querySelectorAll('.cf[data-slides]').forEach(function (host) {
      if (!host.dataset.built) build(host);
      else if (host._cfMeasure) host._cfMeasure();
    });
  }

  window.addEventListener('load', boot);
  window.addEventListener('hashchange', function () { setTimeout(boot, 80); });
  document.addEventListener('click', function () { setTimeout(boot, 80); });
  setTimeout(boot, 350);
})();
