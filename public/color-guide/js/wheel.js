/* 色相環と補色の章。data/wheel.json の24色を SVG の輪に並べ、押した色の補色と配色の例を表示する。
   見え方の計算とコントラスト比は sim.js(ColorSim)を使う */
(function () {
  'use strict';
  var S = window.ColorSim,
    NS = 'http://www.w3.org/2000/svg',
    $ = function (id) {
      return document.getElementById(id);
    };
  var data,
    sel = 0,
    segs = [];

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function svg(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function ink(bg) {
    return S.contrast(bg, '#111111') >= S.contrast(bg, '#ffffff') ? '#111111' : '#ffffff';
  }
  function at(i) {
    return data.colors[(((sel + i) % 24) + 24) % 24];
  }
  /* 角度は真上を 0 度として時計回り */
  function pt(r, deg) {
    var a = (deg * Math.PI) / 180;
    return [(r * Math.sin(a)).toFixed(2), (-r * Math.cos(a)).toFixed(2)];
  }
  function sector(r0, r1, a0, a1) {
    var p = [pt(r1, a0), pt(r1, a1), pt(r0, a1), pt(r0, a0)];
    return (
      'M' +
      p[0] +
      'A' +
      r1 +
      ' ' +
      r1 +
      ' 0 0 1 ' +
      p[1] +
      'L' +
      p[2] +
      'A' +
      r0 +
      ' ' +
      r0 +
      ' 0 0 0 ' +
      p[3] +
      'Z'
    );
  }

  function drawWheel() {
    var root = svg('svg', { viewBox: '-215 -215 430 430', role: 'group', 'aria-label': '24色の色相環' });
    /* 中心の暖色系・寒色系(画像と同じく上半分と下半分) */
    root.append(
      svg('path', { d: 'M-72 0A72 72 0 0 1 72 0Z', fill: '#F6C9DC' }),
      svg('path', { d: 'M-72 0A72 72 0 0 0 72 0Z', fill: '#BFE0F7' }),
    );
    var guide = svg('g', { class: 'w-guide' });
    [0, 45, 90, 135].forEach(function (d) {
      var a = pt(118, d),
        b = pt(118, d + 180);
      guide.appendChild(svg('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1] }));
    });
    root.appendChild(guide);
    var t1 = svg('text', { x: 0, y: -24, class: 'w-zone' }),
      t2 = svg('text', { x: 0, y: 40, class: 'w-zone' });
    t1.textContent = '暖色系';
    t2.textContent = '寒色系';
    root.append(t1, t2);
    root.appendChild(svg('line', { id: 'wLink', class: 'w-link' }));

    data.colors.forEach(function (c, i) {
      var d = i * 15,
        g = svg('g', { class: 'w-seg', tabindex: 0, role: 'button', 'aria-label': c.name + ' ' + c.hex });
      g.appendChild(svg('path', { d: sector(124, 210, d - 6.9, d + 6.9), fill: c.hex }));
      /* 文字は中心から外へ向けて書き、左半分は逆さまにならないよう 180 度回す */
      var left = d > 180,
        m = pt(167, d),
        tx = svg('text', {
          x: m[0],
          y: m[1],
          fill: ink(c.hex),
          transform: 'rotate(' + (d - 90 + (left ? 180 : 0)) + ' ' + m[0] + ' ' + m[1] + ')',
        });
      tx.textContent = c.name;
      g.appendChild(tx);
      g.addEventListener('click', function () {
        pick(i);
      });
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          pick(i);
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          pick((i + (e.key === 'ArrowRight' ? 1 : 23)) % 24);
          segs[sel].focus();
        }
      });
      segs.push(g);
      root.appendChild(g);
    });
    $('wheelSvg').appendChild(root);
  }

  function chip(c, cls) {
    var s = el('span', 'w-chip ' + (cls || ''));
    s.style.background = c.hex;
    s.style.color = ink(c.hex);
    s.append(el('b', '', c.name), el('code', '', c.hex));
    return s;
  }

  function pick(i) {
    sel = i;
    var comp = at(12),
      base = at(0);
    segs.forEach(function (g, k) {
      g.classList.toggle('on', k === sel);
      g.classList.toggle('comp', k === (sel + 12) % 24);
      g.setAttribute('aria-pressed', k === sel ? 'true' : 'false');
    });
    var a = pt(122, sel * 15),
      b = pt(122, sel * 15 + 180),
      ln = $('wLink');
    ln.setAttribute('x1', a[0]);
    ln.setAttribute('y1', a[1]);
    ln.setAttribute('x2', b[0]);
    ln.setAttribute('y2', b[1]);

    var pair = $('wPair');
    pair.textContent = '';
    pair.append(chip(base, 'big'), el('span', 'w-vs', '⇔'), chip(comp, 'big'));
    $('wPairNote').textContent =
      '「' +
      base.name +
      '」の補色は「' +
      comp.name +
      '」です。明るさの差(コントラスト比)は ' +
      S.contrast(base.hex, comp.hex).toFixed(1) +
      ' : 1 です。';

    /* 補色の組を各見え方で並べる */
    var sims = $('wSims');
    sims.textContent = '';
    S.TYPES.forEach(function (t) {
      var x = S.simulate(base.hex, t.id),
        y = S.simulate(comp.hex, t.id),
        r = S.contrast(x, y),
        card = el('div', 'w-sim'),
        sw = el('div', 'w-sw');
      var l = el('span'),
        rr = el('span');
      l.style.background = x;
      rr.style.background = y;
      sw.append(l, rr);
      card.append(el('b', '', t.name), sw, el('small', r < 1.5 ? 'warn' : '', r.toFixed(1) + ' : 1'));
      sims.appendChild(card);
    });

    var box = $('wSchemes');
    box.textContent = '';
    data.schemes.forEach(function (s) {
      var c = el('div', 'card w-scheme'),
        row = el('div', 'w-row');
      s.steps.forEach(function (k) {
        row.appendChild(chip(at(k)));
      });
      c.append(el('h4', '', s.title), row, el('p', '', s.desc));
      box.appendChild(c);
    });
  }

  function list() {
    var t = $('wList');
    data.colors.forEach(function (c, i) {
      var tr = el('tr'),
        sw = el('td'),
        cp = data.colors[(i + 12) % 24],
        cs = el('td');
      var s = el('span', 'w-dot');
      s.style.background = c.hex;
      sw.appendChild(s);
      var s2 = el('span', 'w-dot');
      s2.style.background = cp.hex;
      cs.append(s2, document.createTextNode(cp.name));
      var hx = el('td');
      hx.appendChild(el('code', '', c.hex));
      tr.append(el('td', 'num', String(i + 1)), sw, el('td', '', c.name), hx, cs);
      tr.addEventListener('click', function () {
        pick(i);
        $('wheelSvg').scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      t.appendChild(tr);
    });
  }

  fetch('data/wheel.json')
    .then(function (r) {
      if (!r.ok) throw new Error('wheel.json HTTP ' + r.status);
      return r.json();
    })
    .then(function (d) {
      data = d;
      $('wheelIntro').textContent = d.intro;
      $('wheelSource').textContent = d.source;
      d.groups.forEach(function (g) {
        var c = el('div', 'card');
        c.append(el('h4', '', g.title), el('p', '', g.desc));
        $('wheelGroups').appendChild(c);
      });
      d.ud.forEach(function (g) {
        var c = el('div', 'card');
        c.append(el('h4', '', g.title), el('p', '', g.desc));
        $('wheelUd').appendChild(c);
      });
      drawWheel();
      list();
      pick(0);
    })
    .catch(function (e) {
      $('wheelIntro').textContent = '色相環を読み込めませんでした。' + e.message;
    });
})();
