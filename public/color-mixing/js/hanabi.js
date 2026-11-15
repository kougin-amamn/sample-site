/* 番外編「花火の大きさと値段」「花火を打ち上げる」。data/mixing.json の hanabi と flame を受け取り、
   表・値段の計算・Canvas の花火を作る。app.js から Hanabi.init(hanabi, flame) で呼ぶ */
(function () {
  'use strict';
  var $ = function (id) {
    return document.getElementById(id);
  };
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
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
  function table(h, launchSize) {
    var t = $('hbTable'),
      head = document.createElement('tr'),
      maxOpen = h.sizes[h.sizes.length - 1].open;
    ['大きさ', '玉の直径', '打ち上げ高さ', '開いた直径', '1発の値段', 'たとえ', ''].forEach(function (s) {
      head.appendChild(el('th', '', s));
    });
    t.appendChild(head);
    h.sizes.forEach(function (s, i) {
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
        launchSize(i);
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
    h.sizes.forEach(function (s, i) {
      sel.appendChild(new Option(s.name, i));
    });
    sel.value = 0;
    cnt.value = 100;
    function calc() {
      var s = h.sizes[sel.value],
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

  /* Canvas の花火
     夜空の上の端を SKY メートルとして、実際の高さと開く大きさを同じ縮尺で描く */
  var SKY = 1250;
  function sky(h, flame) {
    var cv = $('lnCanvas'),
      g = cv.getContext('2d'),
      W = cv.width,
      H = cv.height,
      GY = H - 36,
      PX = (GY - 10) / SKY,
      parts = [],
      shells = [],
      running = false,
      last = '',
      size = 4,
      color = 'Sr',
      timers = [];
    var colors = flame.items
      .filter(function (it) {
        return it.sym !== 'K';
      })
      .map(function (it) {
        return { key: it.sym, name: it.name, hex: [it.hex] };
      });
    colors.push({ key: 'mix', name: '紫(赤+青の光)', hex: ['#8A0018', '#3A30FF'] });
    colors.push({ key: 'all', name: 'いろいろ', hex: null });

    function rgb(hex) {
      return [1, 3, 5].map(function (i) {
        return parseInt(hex.substr(i, 2), 16);
      });
    }
    function background() {
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = '#05070f';
      g.fillRect(0, 0, W, H);
    }
    function scale() {
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = '#0b0e18';
      g.fillRect(0, GY, W, H - GY);
      g.font = '13px sans-serif';
      [
        [333, '東京タワー 333m'],
        [634, 'スカイツリー 634m'],
      ].forEach(function (m) {
        var y = GY - m[0] * PX;
        g.strokeStyle = 'rgba(255,255,255,.18)';
        g.setLineDash([4, 6]);
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(W, y);
        g.stroke();
        g.setLineDash([]);
        g.fillStyle = 'rgba(255,255,255,.45)';
        g.fillText(m[1], 8, y - 5);
      });
      g.fillStyle = 'rgba(255,255,255,.75)';
      g.fillText(last, 8, H - 12);
    }

    function burst(x, y, s, c) {
      var r = (s.open / 2) * PX,
        n = Math.min(260, 50 + s.go * 6),
        pick = c.hex || colors[Math.floor(Math.random() * (colors.length - 2))].hex;
      for (var i = 0; i < n; i++) {
        var a = (i / n) * Math.PI * 2 + Math.random() * 0.05,
          sp = (r / 28) * (0.92 + Math.random() * 0.12),
          life = 80 + Math.random() * 30;
        /* 紫は赤と青の粒を同じ向きに重ねて飛ばし、光の足し算(lighter)で紫に見せる */
        pick.forEach(function (hx) {
          parts.push({
            x: x,
            y: y,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            c: rgb(hx),
            life: life,
            age: 0,
            w: Math.max(1.4, r / 70),
          });
        });
      }
    }
    function launch(i, c) {
      var s = h.sizes[i],
        r = (s.open / 2) * PX,
        y = GY - s.height * PX,
        x = r * 2 + 20 > W ? W / 2 : r + 10 + Math.random() * (W - 2 * r - 20);
      shells.push({
        x: x,
        y: GY,
        ty: y,
        s: s,
        c:
          c ||
          colors.find(function (k) {
            return k.key === color;
          }),
      });
      last = s.name + ' 高さ約' + s.height + 'm・開いた直径約' + s.open + 'm';
      if (!running) {
        running = true;
        requestAnimationFrame(frame);
      }
    }
    function frame() {
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = 'rgba(5,7,15,.26)';
      g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'lighter';
      shells = shells.filter(function (sh) {
        var step = Math.max(4, (GY - sh.ty) / 55);
        sh.y -= step;
        g.fillStyle = 'rgba(255,220,170,.9)';
        g.beginPath();
        g.arc(sh.x, sh.y, 1.8, 0, Math.PI * 2);
        g.fill();
        if (sh.y <= sh.ty) {
          burst(sh.x, sh.ty, sh.s, sh.c);
          return false;
        }
        return true;
      });
      parts = parts.filter(function (p) {
        p.age++;
        p.vx *= 0.965;
        p.vy = p.vy * 0.965 + 0.025;
        p.x += p.vx;
        p.y += p.vy;
        var k = 1 - p.age / p.life;
        if (k <= 0) return false;
        /* 開いた直後は白っぽく、だんだん金属の色になる */
        var wht = Math.max(0, 1 - p.age / 12),
          c = p.c.map(function (v) {
            return Math.round(v + (255 - v) * wht);
          });
        g.fillStyle = 'rgba(' + c.join(',') + ',' + (0.9 * k).toFixed(3) + ')';
        g.beginPath();
        g.arc(p.x, p.y, p.w, 0, Math.PI * 2);
        g.fill();
        return true;
      });
      scale();
      if (shells.length || parts.length) requestAnimationFrame(frame);
      else {
        /* 薄く残る軌跡を消す */
        running = false;
        background();
        scale();
      }
    }

    var sel = $('lnSize');
    h.sizes.forEach(function (s, i) {
      sel.appendChild(new Option(s.name, i));
    });
    sel.value = size;
    sel.onchange = function () {
      size = +sel.value;
    };
    var btns = [];
    colors.forEach(function (c) {
      var b = el('button', 'ln-color'),
        sw = el('span', 'p-dot');
      b.type = 'button';
      sw.style.background = c.hex
        ? c.hex.length > 1
          ? 'linear-gradient(90deg,' + c.hex.join(',') + ')'
          : c.hex[0]
        : 'conic-gradient(#E8102E,#FFC21A,#9CCB2E,#1FB89A,#2A4BFF,#E8102E)';
      b.append(sw, c.name);
      b.onclick = function () {
        color = c.key;
        btns.forEach(function (x) {
          x.setAttribute('aria-pressed', x === b);
        });
      };
      b.setAttribute('aria-pressed', c.key === color);
      btns.push(b);
      $('lnColors').appendChild(b);
    });
    $('lnGo').onclick = function () {
      launch(size);
    };
    cv.onclick = function () {
      launch(size);
    };
    $('lnAll').onclick = function () {
      timers.forEach(clearTimeout);
      timers = h.sizes.map(function (s, i) {
        return setTimeout(function () {
          launch(i);
        }, i * 1100);
      });
    };
    background();
    scale();
    return function (i) {
      size = i;
      sel.value = i;
      $('launch').scrollIntoView({ behavior: 'smooth' });
      setTimeout(function () {
        launch(i);
      }, 500);
    };
  }

  window.Hanabi = {
    init: function (h, flame) {
      $('hbIntro').textContent = h.intro;
      $('hbNote').textContent = h.note;
      $('lnIntro').textContent = h.launch.intro;
      $('lnNote').textContent = h.launch.note;
      var go = sky(h, flame);
      table(h, go);
    },
  };
})();
