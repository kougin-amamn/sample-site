/* 絵の具の色の作り方の章。data/paint.json の三原色・混色の例・調整の仕方を並べ、絵の具を混ぜる体験ができる。
   文字色の選択とコントラスト比は sim.js(ColorSim)を使う */
(function () {
  'use strict';
  var S = window.ColorSim,
    NS = 'http://www.w3.org/2000/svg',
    $ = function (id) {
      return document.getElementById(id);
    };
  var paints = {},
    order = [],
    count = {};

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function ink(bg) {
    return S.contrast(bg, '#111111') >= S.contrast(bg, '#ffffff') ? '#111111' : '#ffffff';
  }
  function lin(c) {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }
  function srgb(v) {
    return Math.round((v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055) * 255);
  }
  /* 減法混色の目安: 光の強さ(リニア RGB)を量の割合でかけ合わせる(重み付きの幾何平均)。
     0 があると何を混ぜても黒になるので、下限を 0.01 にしている */
  function mix(parts) {
    var t = 0,
      acc = [0, 0, 0];
    Object.keys(parts).forEach(function (id) {
      var n = parts[id],
        h = paints[id].hex;
      if (!n) return;
      t += n;
      [1, 3, 5].forEach(function (o, i) {
        acc[i] += n * Math.log(Math.max(0.01, lin(parseInt(h.substr(o, 2), 16))));
      });
    });
    if (!t) return null;
    return (
      '#' +
      acc
        .map(function (a) {
          return ('0' + srgb(Math.exp(a / t)).toString(16)).slice(-2);
        })
        .join('')
        .toUpperCase()
    );
  }

  function chip(hex, label, cls) {
    var s = el('span', 'w-chip ' + (cls || ''));
    s.style.background = hex;
    s.style.color = ink(hex);
    if (hex.toUpperCase() === '#FFFFFF') s.classList.add('edge');
    s.append(el('b', '', label), el('code', '', hex));
    return s;
  }
  /* 「赤 1 + 黄 2」のような材料の並び */
  function formula(parts) {
    var f = el('div', 'p-formula');
    Object.keys(parts).forEach(function (id, i) {
      if (i) f.appendChild(el('span', 'p-op', '+'));
      var d = el('span', 'p-dot');
      d.style.background = paints[id].hex;
      f.append(d, el('span', 'p-amt', paints[id].name + ' ' + parts[id]));
    });
    return f;
  }

  /* 三原色の重なり。絵の具は掛け合わせ(multiply)、光は足し合わせ(screen)で重ねる */
  function venn(p) {
    var s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', '0 0 220 200');
    s.setAttribute('role', 'img');
    s.setAttribute('aria-label', p.title);
    var bg = document.createElementNS(NS, 'rect');
    bg.setAttribute('width', 220);
    bg.setAttribute('height', 200);
    bg.setAttribute('rx', 12);
    bg.setAttribute('fill', p.mode === 'add' ? '#000000' : '#ffffff');
    s.appendChild(bg);
    var g = document.createElementNS(NS, 'g');
    g.setAttribute('style', 'isolation:isolate');
    [
      [82, 78],
      [138, 78],
      [110, 126],
    ].forEach(function (c, i) {
      var e = document.createElementNS(NS, 'circle');
      e.setAttribute('cx', c[0]);
      e.setAttribute('cy', c[1]);
      e.setAttribute('r', 52);
      e.setAttribute('fill', p.colors[i]);
      e.setAttribute('style', 'mix-blend-mode:' + (p.mode === 'add' ? 'screen' : 'multiply'));
      g.appendChild(e);
    });
    s.appendChild(g);
    return s;
  }

  function mixer() {
    var box = $('pPaints');
    order.forEach(function (id) {
      var p = paints[id],
        row = el('div', 'p-paint'),
        dot = el('span', 'p-tube'),
        minus = el('button', 'p-btn', '−'),
        plus = el('button', 'p-btn', '+'),
        n = el('output', 'p-n', '0');
      dot.style.background = p.hex;
      minus.type = plus.type = 'button';
      minus.setAttribute('aria-label', p.name + 'を減らす');
      plus.setAttribute('aria-label', p.name + 'を足す');
      minus.onclick = function () {
        set(id, count[id] - 1);
      };
      plus.onclick = function () {
        set(id, count[id] + 1);
      };
      row.append(dot, el('span', 'p-name', p.name), minus, n, plus);
      row.dataset.id = id;
      box.appendChild(row);
    });
    $('pReset').onclick = function () {
      load({});
    };
    load({ y: 2, b: 1 });
  }
  function set(id, v) {
    count[id] = Math.max(0, Math.min(10, v));
    render();
  }
  function load(parts) {
    order.forEach(function (id) {
      count[id] = parts[id] || 0;
    });
    render();
  }
  function render() {
    var total = 0,
      used = {};
    order.forEach(function (id) {
      var row = $('pPaints').querySelector('[data-id="' + id + '"]');
      row.querySelector('.p-n').textContent = count[id];
      row.classList.toggle('on', count[id] > 0);
      if (count[id]) {
        used[id] = count[id];
        total += count[id];
      }
    });
    var hex = mix(used),
      res = $('pResult'),
      bar = $('pBar');
    bar.textContent = '';
    Object.keys(used).forEach(function (id) {
      var s = el('span');
      s.style.background = paints[id].hex;
      s.style.flex = used[id];
      s.title = paints[id].name + ' ' + used[id];
      bar.appendChild(s);
    });
    if (!hex) {
      res.style.background = '';
      res.style.color = '';
      res.className = 'p-result empty';
      res.textContent = '絵の具を「+」で足してください';
      return;
    }
    res.className = 'p-result';
    res.style.background = hex;
    res.style.color = ink(hex);
    res.textContent = '';
    res.append(el('b', '', '混ぜた色'), el('code', '', hex), el('small', '', '全部で ' + total + ' 杯'));
  }

  function build(d) {
    d.paints.forEach(function (p) {
      paints[p.id] = p;
      order.push(p.id);
    });
    $('paintIntro').textContent = d.intro;
    $('paintNote').textContent = d.note;

    d.primaries.forEach(function (p) {
      var c = el('div', 'card p-prim'),
        lab = el('div', 'p-labels');
      p.labels.forEach(function (l, i) {
        var d2 = el('span', 'p-dot');
        d2.style.background = p.colors[i];
        lab.append(d2, el('span', '', l));
      });
      c.append(el('h4', '', p.title), venn(p), lab, el('p', '', p.desc));
      $('paintPrimaries').appendChild(c);
    });

    d.recipes.forEach(function (r) {
      var c = el('div', 'card p-recipe'),
        hex = mix(r.parts),
        btn = el('button', 'p-try', '混ぜてみる');
      btn.type = 'button';
      btn.onclick = function () {
        load(r.parts);
        $('pMixer').scrollIntoView({ behavior: 'smooth', block: 'center' });
      };
      c.append(chip(hex, r.name, 'big'), formula(r.parts), el('p', '', r.tip), btn);
      $('paintRecipes').appendChild(c);
    });

    d.adjust.forEach(function (a) {
      var c = el('div', 'card'),
        row = el('div', 'p-steps');
      a.parts.forEach(function (p, i) {
        if (i) row.appendChild(el('span', 'p-op', '→'));
        var hex = mix(p),
          s = el('span', 'p-step');
        s.style.background = hex;
        s.title = hex;
        row.appendChild(s);
      });
      c.append(el('h4', '', a.title), row, el('p', '', a.desc));
      $('paintAdjust').appendChild(c);
    });

    d.tips.forEach(function (t) {
      var c = el('div', 'card');
      c.append(el('h4', '', t.title), el('p', '', t.desc));
      $('paintTips').appendChild(c);
    });
    mixer();
  }

  fetch('data/paint.json')
    .then(function (r) {
      if (!r.ok) throw new Error('paint.json HTTP ' + r.status);
      return r.json();
    })
    .then(build)
    .catch(function (e) {
      $('paintIntro').textContent = '絵の具の章を読み込めませんでした。' + e.message;
    });
})();
