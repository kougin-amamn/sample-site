/* 木目の画像を作る。上下左右につなげても継ぎ目が出ないよう、周期のあるノイズで描く。依存なし */
(function () {
  'use strict';

  function rng(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function seedOf(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h;
  }
  function rgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  /* 横 gx 個 × 縦 gy 個の格子で周期的に繰り返す値ノイズ(0〜1)。u, v は 0〜1 */
  function noise(rand, gx, gy) {
    var v = new Float32Array(gx * gy);
    for (var i = 0; i < v.length; i++) v[i] = rand();
    return function (u, w) {
      var x = u * gx,
        y = w * gy,
        xi = Math.floor(x),
        yi = Math.floor(y),
        fx = x - xi,
        fy = y - yi;
      xi = ((xi % gx) + gx) % gx;
      yi = ((yi % gy) + gy) % gy;
      var x1 = (xi + 1) % gx,
        y1 = (yi + 1) % gy,
        sx = fx * fx * (3 - 2 * fx),
        sy = fy * fy * (3 - 2 * fy),
        a = v[yi * gx + xi] + (v[yi * gx + x1] - v[yi * gx + xi]) * sx,
        b = v[y1 * gx + xi] + (v[y1 * gx + x1] - v[y1 * gx + xi]) * sx;
      return a + (b - a) * sy;
    };
  }
  function fbm(rand, gx, gy, oct) {
    var ns = [];
    for (var o = 0; o < oct; o++) ns.push(noise(rand, gx << o, gy << o));
    return function (u, v) {
      var s = 0,
        amp = 0.5,
        tot = 0;
      for (var o = 0; o < oct; o++) {
        s += ns[o](u, v) * amp;
        tot += amp;
        amp *= 0.5;
      }
      return s / tot;
    };
  }

  /* 木目は横向き(x 方向)に流れる。寄木は柾目(まっすぐな木目)の板を使うので、年輪の線はほぼ平行にしている */
  function makeTexture(sp, size) {
    var N = size || 384,
      c = document.createElement('canvas');
    c.width = c.height = N;
    var g = c.getContext('2d'),
      img = g.createImageData(N, N),
      d = img.data,
      rand = rng(seedOf(sp.id)),
      warp = fbm(rand, 2, 5, 3),
      fiber = noise(rand, 6, Math.round(N / 2.2)),
      slow = fbm(rand, 2, 3, 2),
      base = rgb(sp.base),
      dark = rgb(sp.dark);
    for (var y = 0; y < N; y++) {
      var v = y / N;
      for (var x = 0; x < N; x++) {
        var u = x / N,
          t = v * sp.rings + (warp(u, v) - 0.5) * sp.warp * 2,
          fr = t - Math.floor(t),
          late = Math.pow(0.5 - 0.5 * Math.cos(fr * 2 * Math.PI), sp.sharp),
          k = late * sp.contrast + (fiber(u, v) - 0.5) * sp.fiber + (slow(u, v) - 0.5) * 0.45 * sp.contrast,
          i = (y * N + x) * 4;
        for (var ch = 0; ch < 3; ch++) {
          var val = k >= 0 ? base[ch] + (dark[ch] - base[ch]) * k : base[ch] + (255 - base[ch]) * -k * 0.5;
          d[i + ch] = val < 0 ? 0 : val > 255 ? 255 : val;
        }
        d[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);

    /* 道管(木目に沿った細い溝)。端にかかった分は反対側にも描いて、つなぎ目を出さない */
    var n = Math.round(sp.pores * N * 1.4);
    g.fillStyle = 'rgba(30,15,5,0.28)';
    for (var p = 0; p < n; p++) {
      var px = rand() * N,
        py = rand() * N,
        len = 2 + rand() * 6,
        th = 0.5 + rand() * 0.7;
      for (var ox = -N; ox <= N; ox += N)
        for (var oy = -N; oy <= N; oy += N) {
          if (px + ox + len < 0 || px + ox - len > N || py + oy + th < 0 || py + oy - th > N) continue;
          g.beginPath();
          g.ellipse(px + ox, py + oy, len, th, 0, 0, Math.PI * 2);
          g.fill();
        }
    }
    return c;
  }

  window.YosegiWood = { makeTexture: makeTexture };
})();
