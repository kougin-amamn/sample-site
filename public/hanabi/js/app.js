/* 花火シミュレーターの画面。data/hanabi.json から打ち上げの操作・形の表・大きさと値段の表・炎色反応を作る。
   花火の描画は sky.js(HanabiSky)を使う */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg',
    $ = function (id) {
      return document.getElementById(id);
    };
  var sky = null,
    colors = [],
    state = { size: 4, shape: 'kiku', color: 'Sr' },
    pressColor = function () {};

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  /* 背景色に合わせて文字を黒か白にする(相対輝度で判定) */
  function ink(hex) {
    var l = [1, 3, 5]
      .map(function (i) {
        var v = parseInt(hex.substr(i, 2), 16) / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      })
      .reduce(function (s, v, i) {
        return s + v * [0.2126, 0.7152, 0.0722][i];
      }, 0);
    return l > 0.18 ? '#111111' : '#FFFFFF';
  }
  function chip(hex, label) {
    var s = el('span', 'w-chip');
    s.style.background = hex;
    s.style.color = ink(hex);
    s.append(el('b', '', label), el('code', '', hex));
    return s;
  }

  /* 打ち上げ。引数を省くと画面で選んでいる値を使う */
  function colorsOf(key) {
    var c = colors.find(function (k) {
      return k.key === key;
    });
    if (c.hex) return c.hex;
    var pick = colors.filter(function (k) {
      return k.hex && k.key !== 'mix';
    });
    return pick[Math.floor(Math.random() * pick.length)].hex;
  }
  function fire(size, shape, color) {
    if (size != null) {
      state.size = size;
      $('lnSize').value = size;
    }
    if (shape) {
      state.shape = shape;
      $('lnShape').value = shape;
    }
    if (color) pressColor(color);
    $('sim').scrollIntoView({ behavior: 'smooth' });
    setTimeout(function () {
      sky.launch(state.size, state.shape, colorsOf(state.color));
    }, 450);
  }

  function sim(d) {
    $('simIntro').textContent = d.sim.intro;
    $('simNote').textContent = d.sim.note;
    var sizes = d.sizes.items;
    sky = HanabiSky($('lnCanvas'), sizes);
    colors = d.flame.items
      .filter(function (it) {
        return it.sym !== 'K';
      })
      .map(function (it) {
        return { key: it.sym, name: it.name, hex: [it.hex] };
      });
    colors.push({ key: 'mix', name: '紫(赤+青の光)', hex: ['#8A0018', '#3A30FF'] });
    colors.push({ key: 'all', name: 'いろいろ', hex: null });

    var size = $('lnSize'),
      shape = $('lnShape');
    sizes.forEach(function (s, i) {
      size.appendChild(new Option(s.name, i));
    });
    d.shapes.forEach(function (s) {
      shape.appendChild(new Option(s.name + '(' + s.yomi + ')', s.key));
    });
    size.value = state.size;
    shape.value = state.shape;
    size.onchange = function () {
      state.size = +size.value;
    };
    shape.onchange = function () {
      state.shape = shape.value;
    };

    var btns = [];
    pressColor = function (key) {
      state.color = key;
      btns.forEach(function (b) {
        b.setAttribute('aria-pressed', b.dataset.key === key);
      });
    };
    colors.forEach(function (c) {
      var b = el('button', 'ln-color'),
        sw = el('span', 'p-dot');
      b.type = 'button';
      b.dataset.key = c.key;
      sw.style.background = c.hex
        ? c.hex.length > 1
          ? 'linear-gradient(90deg,' + c.hex.join(',') + ')'
          : c.hex[0]
        : 'conic-gradient(#E8102E,#FFC21A,#9CCB2E,#1FB89A,#2A4BFF,#E8102E)';
      b.append(sw, c.name);
      b.onclick = function () {
        pressColor(c.key);
      };
      btns.push(b);
      $('lnColors').appendChild(b);
    });
    pressColor(state.color);

    function go() {
      sky.launch(state.size, state.shape, colorsOf(state.color));
    }
    $('lnGo').onclick = go;
    $('lnCanvas').onclick = go;
    var timers = [];
    function stop() {
      timers.forEach(clearTimeout);
      timers = [];
    }
    $('lnAll').onclick = function () {
      stop();
      timers = sizes.map(function (s, i) {
        return setTimeout(function () {
          sky.launch(i, state.shape, colorsOf(state.color));
        }, i * 1100);
      });
    };
    /* スターマイン: 3〜5号の玉を、形と色を変えながら次々に打ち上げる */
    $('lnStar').onclick = function () {
      stop();
      for (var k = 0; k < 28; k++) {
        timers.push(
          setTimeout(
            function () {
              var sh = d.shapes[Math.floor(Math.random() * d.shapes.length)].key;
              sky.launch(Math.floor(Math.random() * 3), sh, colorsOf('all'));
            },
            k * 220 + Math.random() * 120,
          ),
        );
      }
    };
  }

  function shapes(d) {
    var t = $('shapeTable'),
      head = document.createElement('tr');
    ['形', '読み', '開き方', '見どころ', ''].forEach(function (h) {
      head.appendChild(el('th', '', h));
    });
    t.appendChild(head);
    d.shapes.forEach(function (s) {
      var tr = document.createElement('tr'),
        td = el('td'),
        b = el('button', 'p-try', '打ち上げ');
      b.type = 'button';
      b.setAttribute('aria-label', s.name + 'を打ち上げる');
      b.onclick = function () {
        fire(null, s.key);
      };
      td.appendChild(b);
      tr.append(el('th', '', s.name), el('td', '', s.yomi), el('td', '', s.desc), el('td', '', s.tip), td);
      t.appendChild(tr);
    });
    $('shapeNote').textContent = d.shapesNote;
  }

  /* 大きさと値段 */
  function yen(v) {
    if (v >= 1e8) return Math.round(v / 1e7) / 10 + '億円';
    if (v >= 1e6) return Math.round(v / 1e4) + '万円';
    if (v >= 1e4) return Math.round(v / 1e3) / 10 + '万円';
    return v.toLocaleString('ja-JP') + '円';
  }
  function price(p, n) {
    n = n || 1;
    return p[0] === p[1] ? '約' + yen(p[0] * n) : '約' + yen(p[0] * n) + '〜' + yen(p[1] * n);
  }

  /* 表と値段の計算 */
  function table(h) {
    var t = $('hbTable'),
      head = document.createElement('tr'),
      maxOpen = h.items[h.items.length - 1].open;
    ['大きさ', '玉の直径', '打ち上げ高さ', '開いた直径', '1発の値段', 'たとえ', ''].forEach(function (s) {
      head.appendChild(el('th', '', s));
    });
    t.appendChild(head);
    h.items.forEach(function (s, i) {
      var tr = document.createElement('tr'),
        open = el('td', 'hb-open'),
        bar = el('span', 'hb-bar'),
        go = el('button', 'p-try hb-go', '打ち上げ'),
        btd = el('td');
      bar.style.width = Math.max(4, (s.open / maxOpen) * 100) + '%';
      open.append('約' + s.open + 'm', bar);
      go.type = 'button';
      go.setAttribute('aria-label', s.name + 'を打ち上げる');
      go.onclick = function () {
        fire(i);
      };
      btd.appendChild(go);
      tr.append(
        el('th', '', s.name),
        el('td', 'num', '約' + s.ball + 'cm'),
        el('td', 'num', '約' + s.height + 'm'),
        open,
        el('td', 'num', price(s.price)),
        el('td', 'hb-like', s.like || '—'),
        btd,
      );
      t.appendChild(tr);
    });

    var sel = $('hbSize'),
      cnt = $('hbCount');
    h.items.forEach(function (s, i) {
      sel.appendChild(new Option(s.name, i));
    });
    sel.value = 0;
    cnt.value = 100;
    function calc() {
      var s = h.items[sel.value],
        n = Math.max(1, Math.min(100000, Math.round(+cnt.value) || 1)),
        out = $('hbTotal');
      out.textContent = '';
      out.append(
        el('span', '', s.name + ' × ' + n.toLocaleString('ja-JP') + '発 ='),
        el('b', '', price(s.price, n)),
      );
    }
    sel.onchange = calc;
    cnt.oninput = calc;
    calc();
  }

  /* 炎色反応
     炎は白い芯から金属の色へ広がるグラデーションで描く */
  function flameSvg(hex, id, size) {
    var s = document.createElementNS(NS, 'svg'),
      defs = document.createElementNS(NS, 'defs'),
      gr = document.createElementNS(NS, 'radialGradient'),
      path = document.createElementNS(NS, 'path');
    s.setAttribute('viewBox', '0 0 100 130');
    s.setAttribute('width', size);
    s.setAttribute('aria-hidden', 'true');
    gr.id = id;
    gr.setAttribute('cx', '50%');
    gr.setAttribute('cy', '78%');
    gr.setAttribute('r', '62%');
    [
      ['0', '#FFFFFF'],
      ['0.22', '#FFFFFF'],
      ['0.55', hex],
      ['1', hex],
    ].forEach(function (st) {
      var e = document.createElementNS(NS, 'stop');
      e.setAttribute('offset', st[0]);
      e.setAttribute('stop-color', st[1]);
      gr.appendChild(e);
    });
    defs.appendChild(gr);
    path.setAttribute('d', 'M50 4C60 30 86 48 86 86A36 36 0 0 1 14 86C14 64 30 52 36 30C42 44 48 46 50 4Z');
    path.setAttribute('fill', 'url(#' + id + ')');
    s.append(defs, path);
    return s;
  }

  function flame(d) {
    $('flIntro').textContent = d.intro;
    $('flNote').textContent = d.note;
    var btns = [];
    function show(i) {
      var it = d.items[i],
        info = $('flInfo');
      $('flBig').textContent = '';
      $('flBig').appendChild(flameSvg(it.hex, 'flBigG', 150));
      info.textContent = '';
      info.append(
        el('b', 'fl-sym', it.sym),
        el('h3', '', it.name),
        el('p', 'fl-col', '炎の色: ' + it.color),
        el('code', '', it.hex),
        el('p', '', it.use),
      );
      btns.forEach(function (b, j) {
        b.setAttribute('aria-pressed', j === i);
      });
    }
    var head = document.createElement('tr');
    ['記号', '金属', '炎の色', '花火での色', '身近な例'].forEach(function (h) {
      head.appendChild(el('th', '', h));
    });
    $('flTable').appendChild(head);
    d.items.forEach(function (it, i) {
      var tr = document.createElement('tr'),
        b = el('button', 'fl-btn'),
        td = el('td'),
        col = el('td', 'fl-colcell'),
        sw = el('span', 'p-dot');
      b.type = 'button';
      b.setAttribute('aria-label', it.name + 'の炎を見る');
      b.append(flameSvg(it.hex, 'flG' + i, 22), el('b', '', it.sym));
      b.onclick = function () {
        show(i);
      };
      btns.push(b);
      td.appendChild(b);
      sw.style.background = it.hex;
      col.append(sw, it.color);
      tr.append(td, el('td', '', it.name), col, el('td', '', it.firework), el('td', '', it.near || '—'));
      $('flTable').appendChild(tr);
    });
    show(0);

    var m = $('flMemo');
    m.append(el('h4', '', d.memo.title), el('p', 'fl-memo', d.memo.text), el('p', '', d.memo.desc));

    var f = d.fireworks,
      c = $('flFire'),
      eq = el('div', 'fl-eq'),
      go = el('button', 'p-try');
    f.parts.forEach(function (pt, i) {
      if (i) eq.append(' + ');
      eq.appendChild(chip(pt.hex, pt.name));
    });
    eq.append(' = ');
    eq.appendChild(chip(f.result, '紫'));
    go.type = 'button';
    go.textContent = 'この紫を打ち上げる';
    go.onclick = function () {
      fire(null, null, 'mix');
    };
    var link = el('a', '', '混色の基本「光を重ねてみる」');
    link.href = '../color-mixing/#lightmix';
    c.append(el('h4', '', f.title), eq, el('p', '', f.desc), go, el('p', 'fl-link', '光の混色: '), link);
  }

  function build(d) {
    sim(d);
    shapes(d);
    $('hbIntro').textContent = d.sizes.intro;
    $('hbNote').textContent = d.sizes.note;
    table(d.sizes);
    flame(d.flame);
    document.querySelectorAll('.sec').forEach(function (s) {
      s.hidden = false;
    });
    $('status').remove();
  }

  fetch('data/hanabi.json')
    .then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    })
    .then(build)
    .catch(function (e) {
      $('status').textContent = 'データを読み込めませんでした(' + e.message + ')';
    });
})();
