/* 模様を画面いっぱいに敷き詰める時の木片の並べ方。Canvas 版と SVG 版の両方が使う。patterns.js の後に読み込む */
(function () {
  'use strict';
  var Pat = window.YosegiPatterns;

  /* 木片ごとに木目の位置と明るさを少しずらし、同じ板から切り出したように見えないようにする */
  function hash(i, j, k) {
    var h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(k + 1, 2246822519);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return function (n) {
      var x = Math.imul(h ^ Math.imul(n + 7, 2654435761), 1597334677);
      return (((x ^ (x >>> 15)) >>> 0) % 10000) / 10000;
    };
  }

  /* 画面の中心を原点、模様の回転(rot 度)をかけた座標で、W×H を覆う木片を順に cb(piece, ox, oy, rnd) へ渡す */
  function each(id, size, W, H, cb) {
    var P = Pat[id],
      R = Math.hypot(W, H) / 2 + size * 3,
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
      cb(
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
          cb(p, ox, oy, hash(i, j, p.seed !== undefined ? 100 + p.seed : k));
        });
      }
    return P.rot || 0;
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

  /* 凸多角形 clip で多角形を切り抜く(Sutherland–Hodgman)。clip は時計回り・反時計回りどちらでもよい */
  function clipPoly(pts, clip) {
    var area = 0;
    for (var n = 0; n < clip.length; n++) {
      var c0 = clip[n],
        c1 = clip[(n + 1) % clip.length];
      area += c0[0] * c1[1] - c1[0] * c0[1];
    }
    var sgn = area > 0 ? 1 : -1,
      out = pts;
    for (n = 0; n < clip.length && out.length; n++) {
      var A = clip[n],
        B = clip[(n + 1) % clip.length],
        inp = out;
      out = [];
      var side = function (p) {
        return sgn * ((B[0] - A[0]) * (p[1] - A[1]) - (B[1] - A[1]) * (p[0] - A[0]));
      };
      for (var m = 0; m < inp.length; m++) {
        var P = inp[m],
          Q = inp[(m + 1) % inp.length],
          sp = side(P),
          sq = side(Q);
        if (sp >= 0) out.push(P);
        if (sp >= 0 !== sq >= 0) {
          var t = sp / (sp - sq);
          out.push([P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t]);
        }
      }
    }
    return out;
  }

  window.YosegiLayout = { each: each, centroid: centroid, clipPoly: clipPoly };
})();
