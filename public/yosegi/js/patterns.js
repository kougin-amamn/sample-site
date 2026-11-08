/* 寄木の模様の形。各模様は格子(a, b のずらし)と、1マス分の木片(多角形・木の役割・木目の角度)を返す。依存なし
   木の役割は w 白 / y 黄 / b 茶 / d こげ茶 / k 黒 / g 緑 / r 赤。実際の樹種は配色(woods.json)で決まる */
(function () {
  'use strict';
  var R3 = Math.sqrt(3);

  function ang(p, q) {
    return (Math.atan2(q[1] - p[1], q[0] - p[0]) * 180) / Math.PI;
  }
  function rect(x0, y0, x1, y1) {
    return [
      [x0, y0],
      [x1, y0],
      [x1, y1],
      [x0, y1],
    ];
  }
  function quarter(p, c, k) {
    var x = p[0] - c[0],
      y = p[1] - c[1];
    for (var n = 0; n < k; n++) {
      var t = x;
      x = -y;
      y = t;
    }
    return [c[0] + x, c[1] + y];
  }
  function diamond(cx, cy, hx, hy) {
    return [
      [cx, cy - hy],
      [cx + hx, cy],
      [cx, cy + hy],
      [cx - hx, cy],
    ];
  }
  /* 半径 r の円2つが重なる部分(七宝の花びら)を折れ線で近似する */
  function petal(P, Q, r) {
    var mx = (P[0] + Q[0]) / 2,
      my = (P[1] + Q[1]) / 2,
      dx = Q[0] - P[0],
      dy = Q[1] - P[1],
      dd = Math.hypot(dx, dy),
      h = Math.sqrt(r * r - (dd * dd) / 4),
      ux = -dy / dd,
      uy = dx / dd,
      X1 = [mx + ux * h, my + uy * h],
      X2 = [mx - ux * h, my - uy * h],
      pts = [];
    function arc(C, A, B) {
      var a1 = Math.atan2(A[1] - C[1], A[0] - C[0]),
        a2 = Math.atan2(B[1] - C[1], B[0] - C[0]),
        dl = a2 - a1;
      while (dl > Math.PI) dl -= 2 * Math.PI;
      while (dl < -Math.PI) dl += 2 * Math.PI;
      for (var i = 0; i < 14; i++) {
        var t = a1 + (dl * i) / 14;
        pts.push([C[0] + r * Math.cos(t), C[1] + r * Math.sin(t)]);
      }
    }
    arc(P, X1, X2);
    arc(Q, X2, X1);
    return { pts: pts, a: ang(X1, X2) };
  }

  var P = {};

  /* 三角格子の三角形を重心から三つに割り、さらに辺の中点で二つに割る。小さな三角形はそれが触れる格子の頂点の色にする。
     頂点は (i - j) mod 3 で塗り分けられるので、頂点ごとに6枚の葉が同じ木の星になり、葉の中心に筋が通る */
  P.asanoha = {
    lattice: function (s) {
      var L = s * 2;
      return { a: [L, 0], b: [L / 2, (L * R3) / 2] };
    },
    cell: function (i, j, s) {
      var L = s * 2,
        h = (L * R3) / 2,
        woods = ['w', 'y', 'b'],
        out = [];
      function V(di, dj) {
        return { p: [di * L + (dj * L) / 2, dj * h], w: woods[(((i + di - j - dj) % 3) + 3) % 3] };
      }
      [
        [V(0, 0), V(1, 0), V(0, 1)],
        [V(1, 0), V(1, 1), V(0, 1)],
      ].forEach(function (T) {
        var g = [(T[0].p[0] + T[1].p[0] + T[2].p[0]) / 3, (T[0].p[1] + T[1].p[1] + T[2].p[1]) / 3];
        for (var k = 0; k < 3; k++) {
          var A = T[k],
            B = T[(k + 1) % 3],
            m = [(A.p[0] + B.p[0]) / 2, (A.p[1] + B.p[1]) / 2];
          out.push({ pts: [g, A.p, m], w: A.w, a: ang(A.p, g) });
          out.push({ pts: [g, m, B.p], w: B.w, a: ang(B.p, g) });
        }
      });
      return out;
    },
  };

  /* 卍を格子 (4,2)・(-2,4) に並べると腕と鉤がつながって紗綾型になる。線は間隔2の升目の上に太さ 2h で引き、
     同じところを二度塗らないよう、各線分の端の角をどちらが受け持つか決めてある */
  P.sayagata = {
    rot: 45,
    bg: { w: 'w', a: 0 },
    lattice: function (s) {
      var g = s * 0.42;
      return { a: [4 * g, 2 * g], b: [-2 * g, 4 * g] };
    },
    cell: function (i, j, s) {
      var g = s * 0.42,
        h = 0.36;
      function R(x0, y0, x1, y1, a) {
        return { pts: rect(x0 * g, y0 * g, x1 * g, y1 * g), w: 'k', a: a };
      }
      return [
        R(-h, -h, 2 + h, h, 0),
        R(2 - h, h, 2 + h, 2 - h, 90),
        R(2 - h, 2 - h, 4 - h, 2 + h, 0),
        R(-h, h, h, 2 + h, 90),
        R(-2 + h, 2 - h, -h, 2 + h, 0),
        R(-2 - h, 2 - h, -2 + h, 4 - h, 90),
      ];
    },
  };

  /* 青海波と同じ重ね方(下の段が上の段の下半分を隠す)で、入れ子の菱形を並べる */
  P.hishiseigaiha = {
    lattice: function (s) {
      var r = s * 1.1;
      return { a: [2 * r, 0], b: [r, r * 0.375] };
    },
    cell: function (i, j, s) {
      var r = s * 1.1,
        rh = r * 0.75,
        n = 4,
        woods = ['b', 'w', 'y', 'w'],
        out = [];
      for (var k = 0; k < n; k++) {
        var hx = (r * (n - k)) / n,
          hy = (rh * (n - k)) / n,
          top = [0, -hy],
          bot = [0, hy],
          L = [-hx, 0],
          R = [hx, 0];
        out.push({ pts: [top, L, bot], w: woods[k], a: ang(L, top) });
        out.push({ pts: [top, bot, R], w: woods[k], a: ang(top, R) });
      }
      return out;
    },
  };

  P.uroko = {
    lattice: function (s) {
      var L = s * 1.6;
      return { a: [L, 0], b: [L / 2, (L * R3) / 2] };
    },
    cell: function (i, j, s) {
      var L = s * 1.6,
        h = (L * R3) / 2;
      return [
        {
          pts: [
            [0, h],
            [L / 2, 0],
            [L, h],
          ],
          w: 'b',
          a: 0,
        },
        {
          pts: [
            [L / 2, 0],
            [1.5 * L, 0],
            [L, h],
          ],
          w: 'w',
          a: 0,
        },
      ];
    },
  };

  /* 尖った頂点が上下にある六角形を敷き詰め、各六角形に尖った軸と平行な縞を左右対称に入れる。縞の向きは 90・30・150 度の3通りで、
     (i - j) mod 3 で割り当てると、1つの頂点に集まる3枚の軸がそこから外へ向き、三つ巴のように見える */
  P.kikkou = {
    lattice: function (s) {
      var R = s * 1.5;
      return { a: [R3 * R, 0], b: [(R3 / 2) * R, 1.5 * R] };
    },
    cell: function (i, j, s) {
      var R = s * 1.5,
        hw = (R3 / 2) * R,
        axis = [90, 150, 30][(((i - j) % 3) + 3) % 3],
        rot = ((axis - 90) * Math.PI) / 180,
        cs = Math.cos(rot),
        sn = Math.sin(rot),
        bands = [
          [0.2, 'w'],
          [0.17, 'b'],
          [0.07, 'y'],
          [0.22, 'w'],
          [0.14, 'b'],
          [0.06, 'y'],
          [0.14, 'w'],
        ],
        out = [];
      function ym(x) {
        return R - Math.abs(x) / R3;
      }
      function turn(p) {
        return [p[0] * cs - p[1] * sn, p[0] * sn + p[1] * cs];
      }
      function strip(x0, x1, w) {
        var pts = [
          [x0, -ym(x0)],
          [x1, -ym(x1)],
          [x1, ym(x1)],
          [x0, ym(x0)],
        ];
        out.push({ pts: pts.map(turn), w: w, a: axis });
      }
      [1, -1].forEach(function (side) {
        var t = 0;
        bands.forEach(function (bd) {
          var t1 = Math.min(1, t + bd[0]);
          strip(side * t * hw, side * t1 * hw, bd[1]);
          t = t1;
        });
      });
      return out;
    },
  };

  /* 横 2×1 と縦 1×2 の板を斜めの鎖にしてずらし並べる(矢筈組み)。板は三枚の薄板の貼り合わせ */
  P.ajiro = {
    lattice: function (s) {
      var g = s * 0.75;
      return { a: [g, g], b: [2 * g, -2 * g] };
    },
    cell: function (i, j, s) {
      var g = s * 0.75,
        t = g / 3,
        out = [],
        hw = ['w', 'b', 'w'],
        vw = ['y', 'd', 'y'];
      for (var k = 0; k < 3; k++) {
        out.push({ pts: rect(0, k * t, 2 * g, (k + 1) * t), w: hw[k], a: 0 });
        out.push({ pts: rect(k * t, g, (k + 1) * t, 3 * g), w: vw[k], a: 90 });
      }
      return out;
    },
  };

  /* 上に七宝(円の中心を (r, r) に置いた4枚の花びら)、黒い細帯をはさんで矢羽を2列 */
  P.shippoyabane = {
    lattice: function (s) {
      var r = s * 0.75,
        t = s * 0.16,
        hY = r * 0.8;
      return { a: [2 * r, 0], b: [0, 2 * r + 2 * t + 3 * hY] };
    },
    cell: function (i, j, s) {
      var r = s * 0.75,
        t = s * 0.16,
        hY = r * 0.8,
        sl = r * 0.55,
        rows = 3,
        y0 = 2 * r + t,
        Hy = rows * hY,
        C = [r, r],
        out = [{ pts: rect(0, 0, 2 * r, 2 * r), w: 'w', a: 0 }];
      [
        [0, 0],
        [2 * r, 0],
        [2 * r, 2 * r],
        [0, 2 * r],
      ].forEach(function (Q) {
        var p = petal(C, Q, r);
        out.push({ pts: p.pts, w: 'r', a: p.a });
      });
      out.push({ pts: rect(0, 2 * r, 2 * r, y0), w: 'k', a: 0 });
      for (var c = 0; c < 2; c++) {
        var x0 = c * r,
          ci = i * 2 + c,
          up = ci % 2 === 0,
          clip = rect(x0, y0, x0 + r, y0 + Hy);
        for (var row = -1; row <= rows; row++) {
          var ya = y0 + row * hY,
            yb = ya + hY,
            pts = up
              ? [
                  [x0, ya],
                  [x0 + r, ya + sl],
                  [x0 + r, yb + sl],
                  [x0, yb],
                ]
              : [
                  [x0, ya + sl],
                  [x0 + r, ya],
                  [x0 + r, yb],
                  [x0, yb + sl],
                ];
          out.push({
            pts: pts,
            w: (((row + i) % 2) + 2) % 2 ? 'y' : 'b',
            a: ang(pts[0], pts[1]),
            clip: clip,
          });
        }
      }
      out.push({ pts: rect(0, y0 + Hy, 2 * r, y0 + Hy + t), w: 'k', a: 0 });
      return out;
    },
  };

  /* 左上の 1/4 を対角線で二つに割り、中心のまわりに 90 度ずつ回して羽根にする */
  P.fuusha = {
    lattice: function (s) {
      var S = s * 1.5;
      return { a: [S, 0], b: [0, S] };
    },
    cell: function (i, j, s) {
      var S = s * 1.5,
        m = S / 2,
        c = [m, m],
        alt = (((i + j) % 2) + 2) % 2,
        A = [
          [0, 0],
          [m, 0],
          [m, m],
        ],
        B = [
          [0, 0],
          [m, m],
          [0, m],
        ],
        out = [];
      for (var k = 0; k < 4; k++) {
        out.push({
          pts: A.map(function (p) {
            return quarter(p, c, k);
          }),
          w: alt ? 'r' : 'k',
          a: 90 * k,
        });
        out.push({
          pts: B.map(function (p) {
            return quarter(p, c, k);
          }),
          w: alt ? 'w' : 'y',
          a: 90 + 90 * k,
        });
      }
      return out;
    },
  };

  P.ichimatsu = {
    lattice: function (s) {
      var S = s * 1.3;
      return { a: [S, 0], b: [0, S] };
    },
    cell: function (i, j, s) {
      var S = s * 1.3;
      if ((((i + j) % 2) + 2) % 2 === 0) return [{ pts: rect(0, 0, S, S), w: 'y', a: 0 }];
      var out = [],
        woods = ['d', 'w', 'd', 'w', 'd'];
      for (var k = 0; k < 5; k++)
        out.push({ pts: rect((k * S) / 5, 0, ((k + 1) * S) / 5, S), w: woods[k], a: 90 });
      return out;
    },
  };

  P.nikuzushi = {
    lattice: function (s) {
      var S = s * 0.9;
      return { a: [S, 0], b: [0, S] };
    },
    cell: function (i, j, s) {
      var S = s * 0.9,
        hz = (((i + j) % 2) + 2) % 2 === 0;
      return hz
        ? [
            { pts: rect(0, 0, S, S / 2), w: 'b', a: 0 },
            { pts: rect(0, S / 2, S, S), w: 'w', a: 0 },
          ]
        : [
            { pts: rect(0, 0, S / 2, S), w: 'b', a: 90 },
            { pts: rect(S / 2, 0, S, S), w: 'w', a: 90 },
          ];
    },
  };

  /* 大きな菱と上下の小さな菱を同じ木で重ねて一つの形にする(重なりの継ぎ目は引かない)。内側は縁の幅だけ縮めた同じ形 */
  P.matsukawa = {
    bg: { w: 'g', a: 0 },
    lattice: function (s) {
      var W = s * 1.2,
        H = W * 0.6;
      return { a: [2.2 * W, 0], b: [1.1 * W, 1.55 * H] };
    },
    cell: function (i, j, s) {
      var W = s * 1.2,
        H = W * 0.6,
        d = s * 0.13,
        parts = [
          [0, 0, W, H],
          [0, -0.75 * H, 0.55 * W, 0.55 * H],
          [0, 0.75 * H, 0.55 * W, 0.55 * H],
        ],
        inner = ((j % 2) + 2) % 2 ? 'r' : 'y',
        out = [];
      function shape(inset, w) {
        parts.forEach(function (p) {
          var e = Math.hypot(p[2], p[3]),
            hx = p[2] - (inset * e) / p[3],
            hy = p[3] - (inset * e) / p[2];
          out.push({ pts: diamond(p[0], p[1], hx, hy), w: w, a: 0, seam: false });
        });
      }
      shape(0, 'k');
      shape(d, inner);
      return out;
    },
  };

  /* 細い帯・細い帯・太い帯をくり返す格子を、縦横の帯番号の和の偶奇で市松に塗る。太い升の四方を明るい長方形が囲み、
     「井」の字が浮かぶ。帯3本 × 色2つの周期なので、1マスは帯6本分 */
  P.igeta = {
    lattice: function (s) {
      var n = s * 0.55,
        w = s * 1.1,
        S = 2 * (2 * n + w);
      return { a: [S, 0], b: [0, S] };
    },
    cell: function (i, j, s) {
      var n = s * 0.55,
        w = s * 1.1,
        widths = [w, n, n, w, n, n],
        pos = [0],
        out = [];
      widths.forEach(function (x, k) {
        pos.push(pos[k] + x);
      });
      for (var r = 0; r < 6; r++)
        for (var c = 0; c < 6; c++) {
          var x0 = pos[c],
            x1 = pos[c + 1],
            y0 = pos[r],
            y1 = pos[r + 1];
          out.push({
            pts: rect(x0, y0, x1, y1),
            w: (r + c) % 2 ? 'w' : 'b',
            a: x1 - x0 > y1 - y0 + 0.01 ? 0 : 90,
          });
        }
      return out;
    },
  };

  window.YosegiPatterns = P;
})();
