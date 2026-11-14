/* 色のユニバーサルデザイン帳の画面。data/*.json の内容を並べ、sim.js で見え方の計算とコントラスト比を出す */
(function () {
  'use strict';
  var S = window.ColorSim,
    $ = function (id) {
      return document.getElementById(id);
    };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  /* 背景色に合わせて、読みやすい文字色(黒か白)を選ぶ */
  function ink(bg) {
    return S.contrast(bg, '#111111') >= S.contrast(bg, '#ffffff') ? '#111111' : '#ffffff';
  }
  function chip(color, label) {
    var c = el('span', 'chip');
    c.style.background = color;
    c.style.color = ink(color);
    if (label) c.textContent = label;
    return c;
  }

  /* 色の心理的効果 */
  function psychology(d) {
    $('psyNote').textContent = d.note;
    d.general.forEach(function (g) {
      var c = el('div', 'card');
      c.append(el('h4', '', g.title), el('p', '', g.desc));
      $('psyGeneral').appendChild(c);
    });
    d.colors.forEach(function (c) {
      var card = el('article', 'psy'),
        top = el('div', 'psy-top'),
        body = el('div', 'psy-body');
      top.style.background = c.hex;
      top.style.color = ink(c.hex);
      top.append(el('h3', '', c.name), el('code', '', c.hex));
      if (c.hex.toUpperCase() === '#FFFFFF') top.classList.add('edge');
      function row(label, list, cls) {
        var p = el('p', 'row ' + cls);
        p.appendChild(el('b', '', label));
        list.forEach(function (w) {
          p.appendChild(el('span', 'tag', w));
        });
        return p;
      }
      body.append(row('よい印象', c.good, 'pos'), row('注意したい印象', c.bad, 'neg'));
      var u = el('p', 'uses');
      u.appendChild(el('b', '', 'よく使われる場面'));
      u.appendChild(document.createTextNode(c.uses.join('、')));
      body.append(u, el('p', 'care', c.care));
      card.append(top, body);
      $('psyColors').appendChild(card);
    });
  }

  /* 2色の組み合わせを、見え方ごとに並べる */
  function pairRows(box, pairs, types) {
    var head = el('div', 'pair head');
    head.appendChild(el('span', 'pl', '組み合わせ'));
    types.forEach(function (t) {
      head.appendChild(el('span', 'pt', t.name));
    });
    box.appendChild(head);
    pairs.forEach(function (p) {
      var r = el('div', 'pair'),
        lab = el('span', 'pl');
      lab.appendChild(el('b', '', p.label));
      if (p.for) lab.appendChild(el('small', '', p.for));
      r.appendChild(lab);
      types.forEach(function (t) {
        var cell = el('span', 'pc');
        cell.title = t.name;
        var a = el('i'),
          b = el('i');
        a.style.background = S.simulate(p.a, t.id);
        b.style.background = S.simulate(p.b, t.id);
        cell.append(a, b);
        r.appendChild(cell);
      });
      box.appendChild(r);
    });
  }

  function palette(title, source, groups) {
    var wrap = el('div', 'palette');
    wrap.appendChild(el('h4', '', title));
    wrap.appendChild(el('p', 'note', '制作: ' + source + '。色の上の 16 進数を押すとコピーできます。'));
    var types = S.TYPES.filter(function (t) {
      return t.id !== 'achro';
    });
    groups.forEach(function (g) {
      if (g.name) wrap.appendChild(el('p', 'gname', g.name));
      var grid = el('div', 'pal-grid');
      var head = el('div', 'pal-row head');
      head.appendChild(el('span', 'pn', '色'));
      types.forEach(function (t) {
        head.appendChild(el('span', '', t.name));
      });
      grid.appendChild(head);
      g.colors.forEach(function (c) {
        var row = el('div', 'pal-row'),
          name = el('button', 'pn');
        name.type = 'button';
        name.title = c.hex + ' をコピー';
        name.append(el('b', '', c.name), el('code', '', c.hex));
        name.addEventListener('click', function () {
          navigator.clipboard.writeText(c.hex).then(function () {
            name.lastChild.textContent = 'コピーしました';
            setTimeout(function () {
              name.lastChild.textContent = c.hex;
            }, 1200);
          });
        });
        row.appendChild(name);
        types.forEach(function (t) {
          var sw = el('span', 'sw');
          sw.style.background = S.simulate(c.hex, t.id);
          row.appendChild(sw);
        });
        grid.appendChild(row);
      });
      wrap.appendChild(grid);
    });
    return wrap;
  }

  function vision(d, pal) {
    $('visionIntro').textContent = d.intro;
    d.types.forEach(function (t) {
      var tr = el('tr');
      [t.name, t.cells, t.how, t.share].forEach(function (v, i) {
        tr.appendChild(el(i ? 'td' : 'th', '', v));
      });
      $('visionTypes').appendChild(tr);
    });
    pairRows($('visionPairs'), d.pairs, S.TYPES);
    $('palettes').appendChild(palette(pal.cud.title, pal.cud.source, pal.cud.groups));
    $('palettes').appendChild(
      palette(pal.okabe.title, pal.okabe.source, [{ name: '', colors: pal.okabe.colors }]),
    );
    d.tips.forEach(function (t) {
      $('visionTips').appendChild(el('li', '', t));
    });
  }

  function aging(d) {
    $('agingIntro').textContent = d.intro;
    $('agingSource').textContent = d.stats.source;
    d.stats.rows.forEach(function (r) {
      var tr = el('tr');
      tr.append(el('th', '', r.age), el('td', '', r.early), el('td', '', r.mid));
      $('agingStats').appendChild(tr);
    });
    d.changes.forEach(function (c) {
      var card = el('div', 'card');
      card.append(el('h4', '', c.title), el('p', '', c.desc));
      $('agingChanges').appendChild(card);
    });
    pairRows(
      $('agingHard'),
      d.hard,
      S.TYPES.filter(function (t) {
        return t.id === 'normal' || t.id === 'aged';
      }),
    );
    d.good.forEach(function (g) {
      var c = el('div', 'good-item'),
        r = S.contrast(g.fg, g.bg);
      c.style.background = g.bg;
      c.style.color = g.fg;
      c.append(
        el('b', '', g.label),
        el('span', '', '読みやすい文字 Aa 123'),
        el('small', '', 'コントラスト比 ' + r.toFixed(1) + ' : 1'),
      );
      $('agingGood').appendChild(c);
    });
    d.tips.forEach(function (t) {
      $('agingTips').appendChild(el('li', '', t));
    });
  }

  /* シミュレーターの見本。よくない例(赤・緑・茶の色分けだけ)と、よい例(推奨配色+模様+名前)を並べる */
  function demo() {
    var bad = ['#FF0000', '#00A000', '#996600'],
      good = ['#FF4B00', '#005AFF', '#03AF7A'],
      vals = [62, 45, 78],
      names = ['A店', 'B店', 'C店'];
    function chart(colors, withPattern, title) {
      var w = 300,
        h = 170,
        s =
          '<svg viewBox="0 0 ' +
          w +
          ' ' +
          h +
          '" role="img" aria-label="' +
          title +
          '"><defs><pattern id="pt-' +
          (withPattern ? 'g' : 'b') +
          '" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="' +
          colors[1] +
          '"/><rect width="2" height="6" fill="#fff" opacity=".55"/></pattern></defs>';
      vals.forEach(function (v, i) {
        var x = 30 + i * 90,
          bh = v * 1.6,
          fill = withPattern && i === 1 ? 'url(#pt-g)' : colors[i];
        s +=
          '<rect x="' + x + '" y="' + (150 - bh) + '" width="56" height="' + bh + '" fill="' + fill + '"/>';
        if (withPattern) {
          s +=
            '<text x="' +
            (x + 28) +
            '" y="' +
            (144 - bh) +
            '" text-anchor="middle" font-size="13" fill="currentColor">' +
            names[i] +
            ' ' +
            v +
            '</text>';
        }
      });
      s += '<line x1="20" y1="150" x2="290" y2="150" stroke="currentColor"/>';
      if (!withPattern) {
        colors.forEach(function (c, i) {
          s +=
            '<rect x="' +
            (40 + i * 80) +
            '" y="158" width="10" height="10" fill="' +
            c +
            '"/><text x="' +
            (54 + i * 80) +
            '" y="167" font-size="11" fill="currentColor">' +
            names[i] +
            '</text>';
        });
      }
      return s + '</svg>';
    }
    var box = $('simDemo');
    box.innerHTML =
      '<div class="demo-grid">' +
      '<figure><figcaption>よくない例: 色だけで区別</figcaption>' +
      chart(bad, false, '色だけで区別した棒グラフ') +
      '</figure>' +
      '<figure><figcaption>よい例: 推奨配色+模様+名前</figcaption>' +
      chart(good, true, '推奨配色と模様と名前で区別した棒グラフ') +
      '</figure>' +
      '<figure><figcaption>状態の表示</figcaption><ul class="status-demo">' +
      '<li><span class="dot" style="background:#E60012"></span>赤い丸だけ</li>' +
      '<li><span class="dot" style="background:#009944"></span>緑の丸だけ</li>' +
      '<li><span class="mark ng" style="background:#FF4B00">×</span>エラー</li>' +
      '<li><span class="mark ok" style="background:#005AFF">✓</span>完了</li></ul></figure>' +
      '<figure><figcaption>文字の色</figcaption><div class="text-demo">' +
      '<p style="background:#1A1A1A;color:#C00000">黒地に赤い文字</p>' +
      '<p style="background:#1A1A1A;color:#1E3F99">黒地に紺の文字</p>' +
      '<p style="background:#FFFFFF;color:#E8C800">白地に黄の文字</p>' +
      '<p style="background:#FFFFFF;color:#1A1A1A">白地に黒の文字</p>' +
      '<p style="background:#1B3A6B;color:#FFFFFF">紺地に白の文字</p></div></figure>' +
      '</div>';
    var seg = $('simTypes');
    S.TYPES.forEach(function (t, i) {
      var b = el('button', '', t.name);
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(i === 0));
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(seg.children, function (x) {
          x.setAttribute('aria-checked', String(x === b));
        });
        box.style.filter = t.id === 'normal' ? '' : 'url(#sim-' + t.id + ')';
      });
      seg.appendChild(b);
    });
  }

  /* コントラスト比 */
  function contrastTool() {
    function update() {
      var fg = $('fg').value.toUpperCase(),
        bg = $('bg').value.toUpperCase(),
        r = S.contrast(fg, bg);
      $('fgHex').textContent = fg;
      $('bgHex').textContent = bg;
      $('ratio').textContent = r.toFixed(2);
      var judge = [
        ['AAA(通常の文字)', 7],
        ['AA(通常の文字)', 4.5],
        ['AA(大きな文字・図形)', 3],
      ];
      $('judge').textContent = '';
      judge.forEach(function (j) {
        var li = el('li', r >= j[1] ? 'ok' : 'ng');
        li.textContent = (r >= j[1] ? '合格 ' : '不足 ') + j[0] + ' … ' + j[1] + ' : 1 以上';
        $('judge').appendChild(li);
      });
      var pv = $('ccPreview');
      pv.textContent = '';
      S.TYPES.forEach(function (t) {
        var f = S.simulate(fg, t.id),
          b = S.simulate(bg, t.id),
          card = el('div', 'cc-card');
        card.style.background = b;
        card.style.color = f;
        card.append(
          el('b', '', t.name),
          el('span', '', 'あいう Aa 123'),
          el('small', '', S.contrast(f, b).toFixed(1) + ' : 1'),
        );
        pv.appendChild(card);
      });
    }
    $('fg').addEventListener('input', update);
    $('bg').addEventListener('input', update);
    $('swap').addEventListener('click', function () {
      var t = $('fg').value;
      $('fg').value = $('bg').value;
      $('bg').value = t;
      update();
    });
    update();
  }

  document.body.insertAdjacentHTML('beforeend', S.filtersSvg());
  Promise.all(
    ['psychology', 'vision', 'aging', 'palettes'].map(function (n) {
      return fetch('data/' + n + '.json').then(function (r) {
        if (!r.ok) throw new Error(n + '.json HTTP ' + r.status);
        return r.json();
      });
    }),
  )
    .then(function (d) {
      psychology(d[0]);
      vision(d[1], d[3]);
      aging(d[2]);
      demo();
      contrastTool();
      document.querySelectorAll('.sec').forEach(function (s) {
        s.hidden = false;
      });
      $('status').remove();
    })
    .catch(function (e) {
      $('status').textContent = '読み込めませんでした(https で配信したページで開いてください)。' + e.message;
    });
})();
