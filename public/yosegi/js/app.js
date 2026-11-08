/* 寄木模様帳の画面。data/*.json を読み、wood.js の木目と patterns.js の形で Canvas に描く */
(function () {
  'use strict';
  var Pat = window.YosegiPatterns,
    stage = document.getElementById('stage'),
    statusEl = document.getElementById('status'),
    listEl = document.getElementById('patterns'),
    nameEl = document.getElementById('pname'),
    descEl = document.getElementById('pdesc'),
    sizeEl = document.getElementById('size'),
    sizeOut = document.getElementById('sizeOut'),
    presetEl = document.getElementById('preset'),
    seamEl = document.getElementById('seam'),
    glossEl = document.getElementById('gloss'),
    legendEl = document.getElementById('legend'),
    saveBtn = document.getElementById('save');

  var woods = {},
    roles = {},
    presets = [],
    meta = [],
    tex = {},
    state = { id: 'asanoha', size: 44, preset: 0, seam: true, gloss: true };

  /* 木片ごとに木目の位置と明るさを少しずらし、同じ板から切り出したように見えないようにする */
  function hash(i, j, k) {
    var h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(k + 1, 2246822519);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return function (n) {
      var x = Math.imul(h ^ Math.imul(n + 7, 2654435761), 1597334677);
      return (((x ^ (x >>> 15)) >>> 0) % 10000) / 10000;
    };
  }
  function pathOf(pts) {
    var p = new Path2D();
    p.moveTo(pts[0][0], pts[0][1]);
    for (var n = 1; n < pts.length; n++) p.lineTo(pts[n][0], pts[n][1]);
    p.closePath();
    return p;
  }
  function centroid(pts) {
    var x = 0,
      y = 0;
    pts.forEach(function (p) {
      x += p[0];
      y += p[1];
    });
    return [x / pts.length, y / pts.length];
  }

  /* 模様を ctx に W×H(CSS px)で描き、使った木の役割を返す */
  function paint(ctx, W, H, id, size, opt) {
    var P = Pat[id],
      map = presets[opt.preset].map,
      fills = {},
      used = {},
      ts = (0.42 * size) / 44,
      TW = 384;
    function fillOf(role) {
      used[role] = true;
      if (!fills[role]) fills[role] = ctx.createPattern(tex[map[role]], 'repeat');
      return fills[role];
    }
    function piece(p, ox, oy, rnd) {
      var path = pathOf(p.pts),
        c = p.org || centroid(p.pts),
        f = fillOf(p.w);
      ctx.save();
      ctx.translate(ox, oy);
      if (p.clip) ctx.clip(pathOf(p.clip));
      f.setTransform(
        new DOMMatrix()
          .translate(c[0], c[1])
          .rotate(p.a)
          .scale(ts)
          .translate(-rnd(0) * TW, -rnd(1) * TW),
      );
      ctx.fillStyle = f;
      ctx.fill(path);
      var tone = rnd(2) - 0.5;
      ctx.fillStyle =
        tone > 0 ? 'rgba(255,244,220,' + tone * 0.16 + ')' : 'rgba(40,20,5,' + -tone * 0.2 + ')';
      ctx.fill(path);
      if (opt.seam && p.seam !== false) {
        ctx.strokeStyle = 'rgba(35,20,8,0.42)';
        ctx.lineWidth = Math.max(0.5, size / 70);
        ctx.lineJoin = 'round';
        ctx.stroke(path);
      }
      ctx.restore();
    }

    ctx.save();
    ctx.translate(W / 2, H / 2);
    if (P.rot) ctx.rotate((P.rot * Math.PI) / 180);
    /* 回転後の画面全体を覆う範囲(模様の座標)を求める */
    var R = Math.hypot(W, H) / 2 + size * 3,
      L = P.lattice(size),
      det = L.a[0] * L.b[1] - L.a[1] * L.b[0],
      imin = Infinity,
      imax = -Infinity,
      jmin = Infinity,
      jmax = -Infinity;
    [
      [-R, -R],
      [R, -R],
      [R, R],
      [-R, R],
    ].forEach(function (q) {
      var i = (q[0] * L.b[1] - q[1] * L.b[0]) / det,
        j = (L.a[0] * q[1] - L.a[1] * q[0]) / det;
      imin = Math.min(imin, i);
      imax = Math.max(imax, i);
      jmin = Math.min(jmin, j);
      jmax = Math.max(jmax, j);
    });
    if (P.bg)
      piece(
        {
          pts: [
            [-R, -R],
            [R, -R],
            [R, R],
            [-R, R],
          ],
          w: P.bg.w,
          a: P.bg.a,
          seam: false,
        },
        0,
        0,
        hash(0, 0, -9),
      );
    for (var j = Math.floor(jmin) - 1; j <= Math.ceil(jmax) + 1; j++)
      for (var i = Math.floor(imin) - 1; i <= Math.ceil(imax) + 1; i++) {
        var ox = i * L.a[0] + j * L.b[0],
          oy = i * L.a[1] + j * L.b[1];
        if (Math.abs(ox) > R + size * 3 || Math.abs(oy) > R + size * 3) continue;
        P.cell(i, j, size).forEach(function (p, k) {
          piece(p, ox, oy, hash(i, j, p.seed !== undefined ? 100 + p.seed : k));
        });
      }
    ctx.restore();

    if (opt.gloss) {
      var gr = ctx.createLinearGradient(0, 0, W, H);
      gr.addColorStop(0, 'rgba(255,250,235,0.20)');
      gr.addColorStop(0.35, 'rgba(255,250,235,0.03)');
      gr.addColorStop(0.6, 'rgba(0,0,0,0)');
      gr.addColorStop(1, 'rgba(50,25,5,0.20)');
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, W, H);
    }
    return used;
  }

  function fit(cv) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2),
      W = cv.clientWidth,
      H = cv.clientHeight;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
    }
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, W: W, H: H };
  }

  function draw() {
    if (!stage.clientWidth) return;
    var f = fit(stage),
      used = paint(f.ctx, f.W, f.H, state.id, state.size, state);
    legend(used);
  }

  function legend(used) {
    var map = presets[state.preset].map,
      seen = {};
    legendEl.textContent = '';
    Object.keys(roles).forEach(function (r) {
      if (!used[r] || seen[map[r]]) return;
      seen[map[r]] = true;
      var sp = woods[map[r]],
        li = document.createElement('li'),
        sw = document.createElement('canvas'),
        tx = document.createElement('span');
      sw.className = 'swatch';
      sw.width = sw.height = 64;
      sw.getContext('2d').drawImage(tex[sp.id], 0, 0, 160, 160, 0, 0, 64, 64);
      tx.innerHTML = '<b></b><small></small>';
      tx.firstChild.textContent = sp.name;
      tx.lastChild.textContent = sp.tone;
      li.append(sw, tx);
      legendEl.appendChild(li);
    });
  }

  function select(id) {
    state.id = id;
    var m = meta.filter(function (x) {
      return x.id === id;
    })[0];
    nameEl.textContent = m.name;
    descEl.textContent = m.desc;
    Array.prototype.forEach.call(listEl.children, function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.id === id));
    });
    draw();
  }

  function thumbs() {
    meta.forEach(function (m) {
      var b = document.createElement('button'),
        cv = document.createElement('canvas'),
        n = document.createElement('span');
      b.type = 'button';
      b.className = 'pat';
      b.dataset.id = m.id;
      cv.className = 'thumb';
      n.textContent = m.name;
      b.append(cv, n);
      b.addEventListener('click', function () {
        select(m.id);
      });
      listEl.appendChild(b);
    });
  }
  function drawThumbs() {
    Array.prototype.forEach.call(listEl.children, function (b) {
      var cv = b.firstChild,
        f = fit(cv);
      if (f.W) paint(f.ctx, f.W, f.H, b.dataset.id, 22, { preset: state.preset, seam: true, gloss: false });
    });
  }

  function save() {
    stage.toBlob(function (blob) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'yosegi-' + state.id + '.png';
      a.click();
      setTimeout(function () {
        URL.revokeObjectURL(a.href);
      }, 1000);
    }, 'image/png');
  }

  function start(data) {
    var wd = data[0];
    meta = data[1];
    roles = wd.roles;
    presets = wd.presets;
    wd.woods.forEach(function (w) {
      woods[w.id] = w;
    });
    presets.forEach(function (p, n) {
      var o = document.createElement('option');
      o.value = n;
      o.textContent = p.name;
      presetEl.appendChild(o);
    });
    thumbs();
    statusEl.textContent = '木目を作っています…';
    /* 木目の生成は少し時間がかかるので、文言を表示してから始める */
    setTimeout(function () {
      wd.woods.forEach(function (w) {
        tex[w.id] = YosegiWood.makeTexture(w, 384);
      });
      statusEl.hidden = true;
      select(state.id);
      drawThumbs();
    }, 30);

    sizeEl.addEventListener('input', function () {
      state.size = +sizeEl.value;
      sizeOut.textContent = sizeEl.value;
      draw();
    });
    presetEl.addEventListener('change', function () {
      state.preset = +presetEl.value;
      draw();
      drawThumbs();
    });
    seamEl.addEventListener('change', function () {
      state.seam = seamEl.checked;
      draw();
    });
    glossEl.addEventListener('change', function () {
      state.gloss = glossEl.checked;
      draw();
    });
    saveBtn.addEventListener('click', save);
    var t;
    new ResizeObserver(function () {
      clearTimeout(t);
      t = setTimeout(draw, 60);
    }).observe(stage);
  }

  Promise.all(
    ['data/woods.json', 'data/patterns.json'].map(function (u) {
      return fetch(u).then(function (r) {
        if (!r.ok) throw new Error(u + ' HTTP ' + r.status);
        return r.json();
      });
    }),
  )
    .then(start)
    .catch(function (e) {
      statusEl.textContent =
        'データを読み込めませんでした(https で配信したページで開いてください)。' + e.message;
      statusEl.classList.add('error');
    });
})();
