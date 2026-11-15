/* 混色の基本の画面。data/mixing.json の三原色・光の吸いこみ・紫の作り方・混色の例を並べ、絵の具を混ぜる体験ができる。
   色の計算は mix.js(ColorMix)を使う */
(function () {
  'use strict';
  var M = window.ColorMix,
    NS = 'http://www.w3.org/2000/svg',
    $ = function (id) {
      return document.getElementById(id);
    };
  var names = [],
    paints = {},
    order = [],
    count = {};

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function ink(bg) {
    return M.ink(bg);
  }
  function mix(parts) {
    return M.mix(parts, paints);
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
      var nm = el('span', 'p-name', p.name);
      if (p.kind) nm.appendChild(el('small', '', p.kind));
      row.append(dot, nm, minus, n, plus);
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
    var near = M.nearest(hex, names);
    res.append(
      el('b', '', '混ぜた色'),
      el('strong', 'p-near', '「' + near.name + '」に近い色'),
      el('code', '', hex),
      el('small', '', '全部で ' + total + ' 杯'),
    );
  }

  /* 光の吸いこみ: 赤・緑・青の光をはね返す量の棒 */
  function light(d) {
    $('lightIntro').textContent = d.intro;
    d.ids.forEach(function (id) {
      var p = paints[id],
        c = el('div', 'card l-card'),
        bars = el('div', 'l-bars');
      M.reflect(p.hex).forEach(function (v, i) {
        var b = el('div', 'l-bar'),
          f = el('span');
        f.style.height = Math.max(2, v * 100) + '%';
        f.style.background = ['#E8323C', '#2EA84A', '#2F6BE0'][i];
        b.append(f, el('small', '', ['赤', '緑', '青'][i]));
        b.title = ['赤', '緑', '青'][i] + 'の光 ' + Math.round(v * 100) + '%';
        bars.appendChild(b);
      });
      var head = el('div', 'l-head'),
        dot = el('span', 'p-tube');
      dot.style.background = p.hex;
      head.append(dot, el('b', '', p.name));
      if (p.kind) head.appendChild(el('small', '', p.kind));
      c.append(head, bars);
      $('lightCards').appendChild(c);
    });
  }

  /* 紫をきれいに作る: 赤2種 × 青2種の表と、混ぜた色と重ねた色の比べ */
  function purple(d) {
    $('purpleIntro').textContent = d.intro;
    var t = $('purpleTable'),
      hr = el('tr');
    hr.appendChild(el('th', '', ''));
    d.cols.forEach(function (b) {
      var th = el('th');
      th.append(el('b', '', paints[b].name), el('small', '', '(' + paints[b].kind + ')'));
      hr.appendChild(th);
    });
    t.appendChild(hr);
    d.rows.forEach(function (r) {
      var tr = el('tr'),
        th = el('th');
      th.append(el('b', '', paints[r].name), el('small', '', '(' + paints[r].kind + ')'));
      tr.appendChild(th);
      d.cols.forEach(function (b) {
        var parts = {},
          light2 = {},
          td = el('td'),
          pair = el('div', 'pu-pair');
        parts[r] = 1;
        parts[b] = 1;
        light2[r] = 1;
        light2[b] = 1;
        light2.w = 2;
        pair.append(chip(mix(parts), '1 : 1'), chip(mix(light2), '+ 白 2'));
        var btn = el('button', 'p-try', '混ぜてみる');
        btn.type = 'button';
        btn.onclick = function () {
          load(parts);
          $('pMixer').scrollIntoView({ behavior: 'smooth', block: 'center' });
        };
        td.append(pair, btn);
        tr.appendChild(td);
      });
      t.appendChild(tr);
    });
    d.points.forEach(function (g) {
      var c = el('div', 'card');
      c.append(el('h4', '', g.title), el('p', '', g.desc));
      $('purplePoints').appendChild(c);
    });
    var a = paints[d.glaze.a],
      b = paints[d.glaze.b],
      parts = {};
    parts[a.id] = 1;
    parts[b.id] = 1;
    parts.w = 2;
    $('glazeDesc').textContent = d.glaze.desc;
    $('glazeBox').append(
      chip(mix(parts), 'パレットで混ぜる', 'big'),
      chip(M.glaze(a.hex, b.hex), '薄く重ねる', 'big'),
    );
  }

  function build(d) {
    d.paints.forEach(function (p) {
      paints[p.id] = p;
      order.push(p.id);
    });
    /* 近い色の候補: 色名の一覧に、作り方の例で混ぜた色も加える(例と同じ分量なら例の名前が出る) */
    names = d.names.concat(
      d.recipes.map(function (r) {
        return { name: r.name, hex: mix(r.parts) };
      }),
    );
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
      /* 重なった所の色。図と同じ重ね方(絵の具は掛け算、光は足し算)で求める */
      var mixes = el('ul', 'p-mixes');
      p.mixes.forEach(function (m) {
        var li = el('li'),
          rgb = p.mode === 'add' ? [0, 0, 0] : [255, 255, 255];
        m.of.forEach(function (i) {
          var c2 = [1, 3, 5].map(function (o) {
            return parseInt(p.colors[i].substr(o, 2), 16);
          });
          rgb = rgb.map(function (v, k) {
            return p.mode === 'add' ? 255 - ((255 - v) * (255 - c2[k])) / 255 : (v * c2[k]) / 255;
          });
        });
        var hex =
          '#' +
          rgb
            .map(function (v) {
              return ('0' + Math.round(v).toString(16)).slice(-2);
            })
            .join('')
            .toUpperCase();
        m.of.forEach(function (i, n) {
          if (n) li.appendChild(el('span', 'p-op', '+'));
          var dd = el('span', 'p-dot');
          dd.style.background = p.colors[i];
          li.append(dd, el('span', '', p.labels[i]));
        });
        var out = el('span', 'p-dot big');
        out.style.background = hex;
        li.append(el('span', 'p-op', '='), out, el('b', '', m.name), el('code', '', hex));
        mixes.appendChild(li);
      });
      c.append(el('h4', '', p.title), venn(p), lab, mixes, el('p', '', p.desc));
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
    light(d.light);
    purple(d.purple);
    mixer();
    document.querySelectorAll('.sec').forEach(function (s) {
      s.hidden = false;
    });
    $('status').remove();
  }

  fetch('data/mixing.json')
    .then(function (r) {
      if (!r.ok) throw new Error('mixing.json HTTP ' + r.status);
      return r.json();
    })
    .then(build)
    .catch(function (e) {
      $('status').textContent = '読み込めませんでした(https で配信したページで開いてください)。' + e.message;
    });
})();
