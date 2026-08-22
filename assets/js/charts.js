/* ============================================================================
   LEGEND — dashboard charts
   Small, dependency-free SVG charts for the member dashboard.
   Forms are picked by the job the data does; colour only encodes where there
   is more than one series, and that palette was validated before use.
   Every chart ships a hover layer and a table view.
   ========================================================================== */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(name, attrs) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) { if (attrs[k] !== undefined) n.setAttribute(k, attrs[k]); }
    return n;
  }
  function css(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || name;
  }

  /* --- the tooltip layer, shared by every chart --------------------------- */
  function tipFor(host) {
    var t = document.createElement('div');
    t.className = 'chart__tip';
    host.appendChild(t);
    return t;
  }
  function showTip(tip, host, x, y, title, rows) {
    tip.innerHTML = '';
    var b = document.createElement('b');
    b.textContent = title;
    tip.appendChild(b);
    rows.forEach(function (r) {
      var s = document.createElement('span');
      var i = document.createElement('i');
      i.style.background = r.colour;
      s.appendChild(i);
      s.appendChild(document.createTextNode(r.label + '  ' + r.value));
      tip.appendChild(s);
    });
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
    tip.style.opacity = '1';
  }

  /* --- a table view, so identity is never colour-alone -------------------- */
  function tableView(host, cols, rows) {
    var wrap = document.createElement('div');
    wrap.hidden = true;
    var t = document.createElement('table');
    t.className = 'chart-table';
    var thead = document.createElement('thead');
    var tr = document.createElement('tr');
    cols.forEach(function (c) { var th = document.createElement('th'); th.textContent = c; tr.appendChild(th); });
    thead.appendChild(tr); t.appendChild(thead);
    var tb = document.createElement('tbody');
    rows.forEach(function (r) {
      var row = document.createElement('tr');
      r.forEach(function (v) { var td = document.createElement('td'); td.textContent = v; row.appendChild(td); });
      tb.appendChild(row);
    });
    t.appendChild(tb); wrap.appendChild(t);
    host.parentNode.appendChild(wrap);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chart-toggle';
    btn.textContent = 'Table';
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function () {
      var open = !wrap.hidden;
      wrap.hidden = open;
      host.hidden = !open;
      btn.textContent = open ? 'Table' : 'Chart';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
    return btn;
  }

  /* --- line chart: change over time, one or two series -------------------- */
  function lineChart(host, cfg) {
    var W = 440, H = 150, P = { t: 14, r: 14, b: 26, l: 30 };
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': cfg.alt });
    var max = cfg.max || Math.max.apply(null, cfg.series.reduce(function (a, s) { return a.concat(s.data); }, []));
    max = Math.ceil(max * 1.15);
    var iw = W - P.l - P.r, ih = H - P.t - P.b;
    var X = function (i) { return P.l + (i / (cfg.labels.length - 1)) * iw; };
    var Y = function (v) { return P.t + ih - (v / max) * ih; };

    // recessive grid
    var g = el('g', { class: 'grid' });
    [0, 0.5, 1].forEach(function (f) {
      g.appendChild(el('line', { x1: P.l, x2: W - P.r, y1: Y(max * f), y2: Y(max * f) }));
    });
    svg.appendChild(g);

    // axis labels — selective, never one per point
    var ax = el('g', { class: 'axis' });
    cfg.labels.forEach(function (l, i) {
      if (i % cfg.every !== 0 && i !== cfg.labels.length - 1) return;
      var t = el('text', { x: X(i), y: H - 8, 'text-anchor': 'middle' });
      t.textContent = l;
      ax.appendChild(t);
    });
    var top = el('text', { x: 0, y: Y(max) + 3, class: 'val' });
    top.textContent = max;
    ax.appendChild(top);
    svg.appendChild(ax);

    var colours = [css('--s1'), css('--s2'), css('--s3')];
    cfg.series.forEach(function (s, si) {
      var d = s.data.map(function (v, i) { return (i ? 'L' : 'M') + X(i) + ' ' + Y(v); }).join(' ');
      svg.appendChild(el('path', { class: 'line', d: d, stroke: colours[si] }));
      s.data.forEach(function (v, i) {
        svg.appendChild(el('circle', { class: 'dot', cx: X(i), cy: Y(v), fill: colours[si] }));
      });
    });

    var cross = el('line', { class: 'cross', y1: P.t, y2: P.t + ih });
    svg.appendChild(cross);
    var hit = el('rect', { class: 'hit', x: P.l, y: P.t, width: iw, height: ih });
    svg.appendChild(hit);
    host.appendChild(svg);

    var tip = tipFor(host);
    hit.addEventListener('pointermove', function (e) {
      var box = svg.getBoundingClientRect();
      var rel = (e.clientX - box.left) / box.width * W;
      var i = Math.round((rel - P.l) / iw * (cfg.labels.length - 1));
      i = Math.max(0, Math.min(cfg.labels.length - 1, i));
      cross.setAttribute('x1', X(i)); cross.setAttribute('x2', X(i));
      cross.style.opacity = '1';
      showTip(tip, host, X(i) / W * box.width, Y(cfg.series[0].data[i]) / H * box.height,
        cfg.labels[i],
        cfg.series.map(function (s, si) { return { colour: colours[si], label: s.name, value: s.data[i] }; }));
    });
    hit.addEventListener('pointerleave', function () {
      cross.style.opacity = '0'; tip.style.opacity = '0';
    });

    if (cfg.series.length > 1) {
      var lg = document.createElement('div');
      lg.className = 'legend-row';
      cfg.series.forEach(function (s, si) {
        var sp = document.createElement('span');
        var i = document.createElement('i');
        i.style.background = colours[si];
        sp.appendChild(i);
        sp.appendChild(document.createTextNode(s.name));
        lg.appendChild(sp);
      });
      host.parentNode.appendChild(lg);
      lg.appendChild(tableView(host, [cfg.xTitle].concat(cfg.series.map(function (s) { return s.name; })),
        cfg.labels.map(function (l, i) { return [l].concat(cfg.series.map(function (s) { return s.data[i]; })); })));
    } else {
      var only = document.createElement('div');
      only.className = 'legend-row';
      only.appendChild(tableView(host, [cfg.xTitle, cfg.series[0].name],
        cfg.labels.map(function (l, i) { return [l, cfg.series[0].data[i]]; })));
      host.parentNode.appendChild(only);
    }
  }

  /* --- horizontal bars: magnitude across a few categories ----------------- */
  function barChart(host, cfg) {
    var rows = cfg.data.length;
    var W = 440, rh = 30, P = { t: 6, r: 40, b: 6, l: 96 };
    var H = P.t + rows * rh + P.b;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': cfg.alt });
    var max = Math.max.apply(null, cfg.data.map(function (d) { return d.v; }));
    var iw = W - P.l - P.r;
    var colour = cfg.colour ? css(cfg.colour) : css('--s1');

    var tip = tipFor(host);
    cfg.data.forEach(function (d, i) {
      var y = P.t + i * rh;
      var w = Math.max(3, (d.v / max) * iw);
      var lab = el('text', { x: 0, y: y + rh / 2 + 3, class: 'val' });
      lab.textContent = d.k;
      svg.appendChild(lab);
      // 4px rounded data-end, anchored to the baseline
      var bar = el('rect', { class: 'bar', x: P.l, y: y + 5, width: w, height: rh - 14, fill: colour, opacity: .92 });
      svg.appendChild(bar);
      var v = el('text', { x: P.l + w + 8, y: y + rh / 2 + 3, class: 'val' });
      v.textContent = d.v;
      svg.appendChild(v);

      var hit = el('rect', { class: 'hit', x: 0, y: y, width: W, height: rh });
      svg.appendChild(hit);
      hit.addEventListener('pointerenter', function () {
        bar.setAttribute('opacity', '1');
        var box = svg.getBoundingClientRect();
        showTip(tip, host, (P.l + w / 2) / W * box.width, (y + rh / 2) / H * box.height,
          d.k, [{ colour: colour, label: cfg.unit, value: d.v }]);
      });
      hit.addEventListener('pointerleave', function () { bar.setAttribute('opacity', '.92'); tip.style.opacity = '0'; });
    });
    host.appendChild(svg);

    var row = document.createElement('div');
    row.className = 'legend-row';
    row.appendChild(tableView(host, [cfg.xTitle, cfg.unit], cfg.data.map(function (d) { return [d.k, d.v]; })));
    host.parentNode.appendChild(row);
  }

  /* --- build the dashboard's charts --------------------------------------- */
  function build() {
    var a = document.getElementById('chart-pipeline');
    if (a && !a.dataset.done) {
      a.dataset.done = '1';
      lineChart(a, {
        alt: 'Candidates assessed each month against those brought to you',
        xTitle: 'Month', every: 2,
        labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
        series: [
          { name: 'Assessed', data: [0, 0, 0, 0, 1, 2, 3, 2, 4, 5, 4] },
          { name: 'Brought to you', data: [0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 1] }
        ]
      });
    }
    var b = document.getElementById('chart-outcomes');
    if (b && !b.dataset.done) {
      b.dataset.done = '1';
      barChart(b, {
        alt: 'Introductions by outcome', xTitle: 'Outcome', unit: 'Introductions',
        data: [
          { k: 'Meeting arranged', v: 1 },
          { k: 'Concluded', v: 1 },
          { k: 'Declined by you', v: 1 },
          { k: 'Awaiting you', v: 1 }
        ]
      });
    }
    var c = document.getElementById('chart-persona');
    if (c && !c.dataset.done) {
      c.dataset.done = '1';
      lineChart(c, {
        alt: 'Persona completeness across sessions', xTitle: 'Session', every: 1, max: 100,
        labels: ['1', '2', '3', '4'],
        series: [{ name: 'Complete', data: [24, 41, 58, 72] }]
      });
    }
    var d = document.getElementById('chart-standing');
    if (d && !d.dataset.done) {
      d.dataset.done = '1';
      lineChart(d, {
        alt: 'Your standing after each meeting, out of five', xTitle: 'Meeting', every: 1, max: 5,
        labels: ['1', '2', '3', '4', '5'],
        series: [{ name: 'Out of five', data: [4, 5, 4, 5, 5] }]
      });
    }
  }

  // The dashboard may be hidden when the script runs; build on entry and on view.
  window.addEventListener('load', build);
  document.addEventListener('click', function () { setTimeout(build, 60); });
  window.addEventListener('hashchange', function () { setTimeout(build, 60); });
  setTimeout(build, 300);
})();
