/* Canvas の夜空に花火を打ち上げる部品。HanabiSky(canvas, sizes) で作り、launch(大きさ, 形, 色) で打ち上げる。
   色は ['#RRGGBB', …] の配列で、2色以上なら同じ向きに粒を重ねて光の足し算で混ぜる */
(function () {
  'use strict';
  /* 夜空の上の端を SKY メートルとして、高さと開く大きさを同じ縮尺で描く */
  var SKY = 1250,
    GOLD = ['#FFB347'];

  function rgb(hex) {
    return [1, 3, 5].map(function (i) {
      return parseInt(hex.substr(i, 2), 16);
    });
  }

  window.HanabiSky = function (cv, sizes) {
    var g = cv.getContext('2d'),
      W = cv.width,
      H = cv.height,
      GY = H - 36,
      PX = (GY - 10) / SKY,
      parts = [],
      shells = [],
      later = [],
      running = false,
      label = '';

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
      g.fillText(label, 8, H - 12);
    }

    /* 1つの輪を飛ばす。r は開いた時の半径(px)、o は形ごとの動き */
    function ring(x, y, r, cols, o) {
      var n = o.n,
        drag = o.drag || 0.965;
      for (var i = 0; i < n; i++) {
        var a = (i / n) * Math.PI * 2 + Math.random() * 0.05,
          /* 抵抗 drag で止まるまでに進む距離が r になる速さ */
          sp = r * (1 - drag) * (0.92 + Math.random() * 0.12),
          life = o.life * (0.85 + Math.random() * 0.3);
        cols.forEach(function (hx) {
          parts.push({
            x: x,
            y: y,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            c: rgb(hx),
            life: life,
            age: 0,
            w: o.w,
            drag: drag,
            grav: o.grav,
            tail: o.tail || 0,
            child: o.child || null,
            hist: o.hist ? [] : null,
            histMax: o.hist || 0,
          });
        });
      }
    }

    function burst(x, y, s, shape, cols) {
      var r = (s.open / 2) * PX,
        n = Math.min(220, 44 + s.go * 5),
        w = Math.max(1.4, r / 70);
      if (shape === 'botan') ring(x, y, r, cols, { n: n, life: 95, w: w * 1.1, grav: 0.025 });
      else if (shape === 'kiku') ring(x, y, r, cols, { n: n, life: 100, w: w * 0.8, grav: 0.025, tail: 7 });
      else if (shape === 'yae') {
        ring(x, y, r, cols, { n: n, life: 100, w: w, grav: 0.02 });
        ring(x, y, r * 0.62, ['#FFFFFF'], { n: Math.round(n * 0.6), life: 95, w: w * 0.9, grav: 0.02 });
        ring(x, y, r * 0.3, cols, { n: Math.round(n * 0.35), life: 90, w: w * 0.9, grav: 0.02 });
      } else if (shape === 'kamuro')
        ring(x, y, r * 0.9, GOLD, { n: n, life: 210, w: w * 0.7, grav: 0.045, tail: 14, drag: 0.955 });
      /* 柳: 広がりを小さくし、重さと抵抗を大きくして、細く長い尾がまっすぐ垂れるようにする */ else if (
        shape === 'yanagi'
      )
        ring(x, y, r * 0.62, cols, {
          n: Math.round(n * 0.7),
          life: 240,
          w: w * 0.55,
          grav: 0.03,
          drag: 0.958,
          hist: 60,
        });
      else if (shape === 'senrin')
        ring(x, y, r * 0.55, ['#FFE7B0'], {
          n: Math.max(10, Math.round(n / 7)),
          life: 34,
          w: w * 0.8,
          grav: 0.01,
          tail: 4,
          child: { r: r * 0.22, cols: cols },
        });
    }

    function launch(i, shape, cols, x) {
      var s = sizes[i],
        r = (s.open / 2) * PX,
        y = GY - s.height * PX;
      if (x == null) x = r * 2 + 20 > W ? W / 2 : r + 10 + Math.random() * (W - 2 * r - 20);
      shells.push({ x: x, y: GY, ty: y, s: s, shape: shape, cols: cols });
      label = s.name + ' 高さ約' + s.height + 'm・開いた直径約' + s.open + 'm';
      if (!running) {
        running = true;
        requestAnimationFrame(frame);
      }
    }

    function frame() {
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = 'rgba(5,7,15,.26)';
      g.fillRect(0, 0, W, H);
      /* 光は重なるほど明るくなるので、足し算(lighter)で描く */
      g.globalCompositeOperation = 'lighter';
      shells = shells.filter(function (sh) {
        sh.y -= Math.max(4, (GY - sh.ty) / 55);
        g.fillStyle = 'rgba(255,220,170,.9)';
        g.beginPath();
        g.arc(sh.x, sh.y, 1.8, 0, Math.PI * 2);
        g.fill();
        if (sh.y > sh.ty) return true;
        burst(sh.x, sh.ty, sh.s, sh.shape, sh.cols);
        return false;
      });
      parts = parts.filter(function (p) {
        p.age++;
        p.vx *= p.drag;
        p.vy = p.vy * p.drag + p.grav;
        p.x += p.vx;
        p.y += p.vy;
        var k = 1 - p.age / p.life;
        if (k <= 0) {
          if (p.child) later.push(p);
          return false;
        }
        /* 開いた直後は白っぽく、だんだん金属の色になる */
        var wht = Math.max(0, 1 - p.age / 12),
          c = p.c.map(function (v) {
            return Math.round(v + (255 - v) * wht);
          }),
          col = 'rgba(' + c.join(',') + ',' + (0.9 * k).toFixed(3) + ')';
        if (p.hist) {
          /* 2コマに1回だけ記録して、根元から先までの長い跡を軽く残す */
          if (p.age % 2 === 1 || !p.hist.length) p.hist.push(p.x, p.y);
          if (p.hist.length > p.histMax * 2) p.hist.splice(0, 2);
          /* 古い位置ほど薄くなるように、3つに分けて描く */
          var hl = p.hist.length / 2,
            part = Math.ceil(hl / 3);
          g.lineWidth = p.w;
          for (var q = 0; q < 3; q++) {
            var from = q * part,
              to = Math.min(hl - 1, (q + 1) * part);
            if (to <= from) continue;
            g.strokeStyle = 'rgba(' + c.join(',') + ',' + (0.25 * (q + 1) * k).toFixed(3) + ')';
            g.beginPath();
            g.moveTo(p.hist[from * 2], p.hist[from * 2 + 1]);
            for (var j = from + 1; j <= to; j++) g.lineTo(p.hist[j * 2], p.hist[j * 2 + 1]);
            g.stroke();
          }
        }
        if (p.tail) {
          g.strokeStyle = col;
          g.lineWidth = p.w;
          g.beginPath();
          g.moveTo(p.x - p.vx * p.tail, p.y - p.vy * p.tail);
          g.lineTo(p.x, p.y);
          g.stroke();
        }
        g.fillStyle = col;
        g.beginPath();
        g.arc(p.x, p.y, p.w, 0, Math.PI * 2);
        g.fill();
        return true;
      });
      /* 千輪: 親の粒が消えた所で小さな牡丹を開く */
      later.forEach(function (p) {
        ring(p.x, p.y, p.child.r, p.child.cols, { n: 18, life: 60, w: 1.4, grav: 0.02 });
      });
      later = [];
      scale();
      if (shells.length || parts.length) requestAnimationFrame(frame);
      else {
        /* 薄く残る軌跡を消す */
        running = false;
        background();
        scale();
      }
    }

    background();
    scale();
    return { launch: launch };
  };
})();
