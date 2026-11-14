/* 寄木の模様の形。各模様は格子(a, b のずらし)と、1マス分の木片(多角形・木の役割・木目の角度)を返す。依存なし
   木の役割は w 白 / y 黄 / h 飴色 / b 茶 / d こげ茶 / k 黒 / g 緑 / r 赤。実際の樹種は配色(woods.json)で決まる */
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

  /* 紗綾型(菱万字)。帯と隙間が同じ幅の升目で、境目だけに明るい木の細線(inlay)をはめ込む。
     升目の1周期は (5,5)・(5,-5) の50升で、表の各升は [u, v, 右辺に線, 下辺に線, 横向きの帯] (いただいた正確な柄の画像から読み取った)。
     最後に升目の横軸を (1, 0.5)、縦軸を (1, -0.5) の向きに押しつぶして菱形にする。木目は同じ向きの帯で1枚の板がつながるように揃える */
  P.sayagata = {
    /* 升の境目の塗り残し(アンチエイリアスの隙間)を同じ木で埋める */
    bg: { w: 'd', a: 26.565 },
    inlay: { w: 'y', k: 0.1 },
    cells: [
      [0, 0, 0, 1, 1],
      [1, -1, 0, 1, 1],
      [2, -2, 1, 1, 1],
      [3, -3, 1, 0, 1],
      [4, -4, 1, 0, 0],
      [1, 0, 0, 0, 1],
      [2, -1, 0, 1, 1],
      [3, -2, 1, 0, 0],
      [4, -3, 1, 0, 0],
      [5, -4, 1, 0, 0],
      [1, 1, 1, 1, 0],
      [2, 0, 1, 1, 1],
      [3, -1, 1, 0, 1],
      [4, -2, 1, 0, 0],
      [5, -3, 0, 0, 1],
      [2, 1, 0, 1, 1],
      [3, 0, 1, 0, 0],
      [4, -1, 1, 0, 0],
      [5, -2, 1, 0, 0],
      [6, -3, 1, 1, 1],
      [2, 2, 1, 0, 0],
      [3, 1, 1, 0, 1],
      [4, 0, 1, 0, 0],
      [5, -1, 0, 0, 1],
      [6, -2, 0, 1, 1],
      [3, 2, 1, 1, 0],
      [4, 1, 1, 0, 0],
      [5, 0, 1, 0, 0],
      [6, -1, 0, 1, 1],
      [7, -2, 0, 1, 1],
      [3, 3, 0, 1, 1],
      [4, 2, 1, 0, 0],
      [5, 1, 0, 0, 1],
      [6, 0, 0, 1, 1],
      [7, -1, 0, 1, 1],
      [4, 3, 0, 1, 1],
      [5, 2, 1, 1, 0],
      [6, 1, 1, 1, 1],
      [7, 0, 0, 0, 1],
      [8, -1, 0, 1, 1],
      [4, 4, 0, 1, 1],
      [5, 3, 0, 1, 1],
      [6, 2, 1, 0, 0],
      [7, 1, 1, 1, 0],
      [8, 0, 0, 1, 1],
      [5, 4, 0, 1, 1],
      [6, 3, 0, 1, 1],
      [7, 2, 0, 1, 1],
      [8, 1, 1, 0, 0],
      [9, 0, 0, 0, 1],
    ],
    hishi: function (g, u, v) {
      return [g * (u + v), (g * (u - v)) / 2];
    },
    lattice: function (s) {
      var g = s * 0.5;
      return { a: this.hishi(g, 5, 5), b: this.hishi(g, 5, -5) };
    },
    cell: function (i, j, s) {
      var self = this,
        g = s * 0.5,
        SA = (Math.atan(0.5) * 180) / Math.PI,
        L = this.lattice(s),
        org = [-(i * L.a[0] + j * L.b[0]), -(i * L.a[1] + j * L.b[1])],
        out = [];
      function H(u, v) {
        return self.hishi(g, u, v);
      }
      this.cells.forEach(function (c) {
        var u = c[0],
          v = c[1];
        out.push({
          pts: [H(u, v), H(u + 1, v), H(u + 1, v + 1), H(u, v + 1)],
          w: 'd',
          a: c[4] ? SA : -SA,
          seam: false,
          seed: c[4] ? 1 : 2,
          global: true,
          org: org,
        });
        if (c[2]) out.push({ edge: [H(u + 1, v), H(u + 1, v + 1)] });
        if (c[3]) out.push({ edge: [H(u, v + 1), H(u + 1, v + 1)] });
      });
      return out;
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

  /* からみ桝。45 度回した座標で、帯の幅 u の正方形の枠(桝・外寸 4u、内寸 2u)を置く。帯は 黒/明るい木に茶の細筋/黒 の3層。
     枠の中の対角の2升は明るい木、残りの2升には左右から来る横の帯が枠の上を渡って入り、端で直角に曲がって枠へつながる。
     右へ出た帯は u だけ上にずれた隣の枠の左の帯になり(格子 (5u,-u))、枠の上下は縦の帯でつなぐ(格子 (-u,5u)) */
  P.karamimasu = {
    rot: 45,
    bg: { w: 'h', a: 0 },
    lattice: function (s) {
      var u = s * 0.9;
      return { a: [5 * u, -u], b: [-u, 5 * u] };
    },
    cell: function (i, j, s) {
      var u = s * 0.9,
        /* 帯の3層を、さらに明るい木・茶の細筋・明るい木に分けた5層の境目(帯の幅に対する割合)と木 */
        cuts = [0, 1 / 3, 0.45, 0.55, 2 / 3, 1],
        woods = ['k', 'h', 'b', 'h', 'k'],
        out = [];
      function at(x0, y0, x, y) {
        return [(x0 + x) * u, (y0 + y) * u];
      }
      /* 真っすぐな帯。(x0, y0) から幅 w・高さ h(u 単位)。horiz を省くと長い方を帯の向きにする */
      function bar(x0, y0, w, h, horiz) {
        if (horiz === undefined) horiz = w > h;
        for (var k = 0; k < 5; k++) {
          var a = cuts[k] * (horiz ? h : w),
            b2 = cuts[k + 1] * (horiz ? h : w);
          out.push({
            pts: horiz
              ? [at(x0, y0, 0, a), at(x0, y0, w, a), at(x0, y0, w, b2), at(x0, y0, 0, b2)]
              : [at(x0, y0, a, 0), at(x0, y0, b2, 0), at(x0, y0, b2, h), at(x0, y0, a, h)],
            w: woods[k],
            a: horiz ? 0 : 90,
          });
        }
      }
      /* 1升の角。外側の角が fx, fy(0 か 1)の側にあり、層が L 字に曲がる。縦の腕と横の腕で木目の向きを変える */
      function corner(x0, y0, fx, fy) {
        function P2(x, y) {
          return at(x0, y0, fx ? 1 - x : x, fy ? 1 - y : y);
        }
        for (var k = 0; k < 5; k++) {
          var a = cuts[k],
            b2 = cuts[k + 1];
          out.push({ pts: [P2(a, a), P2(b2, b2), P2(b2, 1), P2(a, 1)], w: woods[k], a: 90 });
          out.push({ pts: [P2(a, a), P2(1, a), P2(1, b2), P2(b2, b2)], w: woods[k], a: 0 });
        }
      }
      corner(0, 0, 0, 0);
      corner(3, 0, 1, 0);
      corner(0, 3, 0, 1);
      corner(3, 3, 1, 1);
      bar(1, 0, 2, 1);
      bar(1, 3, 2, 1);
      bar(0, 1, 1, 2);
      bar(3, 1, 1, 2);
      out.push({ pts: [at(1, 1, 0, 0), at(1, 1, 1, 0), at(1, 1, 1, 1), at(1, 1, 0, 1)], w: 'h', a: 0 });
      out.push({ pts: [at(2, 2, 0, 0), at(2, 2, 1, 0), at(2, 2, 1, 1), at(2, 2, 0, 1)], w: 'h', a: 0 });
      bar(0, 2, 1, 1, true);
      corner(1, 2, 1, 0);
      bar(3, 1, 2, 1);
      corner(2, 1, 0, 1);
      bar(2, -1, 1, 1, false);
      return out;
    },
  };

  /* 鱗六角。三角格子(辺 L)の頂点を中心に、まわりの6枚の三角形を黄色い六角形(上下2枚の板)、その外側の6枚を濃い三角(星の角)にする。
     星は格子の辺3本おき((3L, 0)・(1.5L, 3L×√3/2))に並び、1周期18枚のうち残りの6枚が地の三角になる */
  P.urokorokkaku = {
    lattice: function (s) {
      var L = s * 1.1;
      return { a: [3 * L, 0], b: [1.5 * L, (3 * L * R3) / 2] };
    },
    cell: function (i, j, s) {
      var L = s * 1.1,
        h = (L * R3) / 2,
        lat = this.lattice(s),
        n = [],
        out = [];
      for (var k = 0; k < 6; k++) n.push([L * Math.cos((k * Math.PI) / 3), L * Math.sin((k * Math.PI) / 3)]);
      /* 六角形は上下2枚の板。木目を揃えるため、どちらも中心を木目の原点にする */
      out.push({
        pts: [
          [-L, 0],
          [-L / 2, -h],
          [L / 2, -h],
          [L, 0],
        ],
        w: 'y',
        a: 0,
        org: [0, 0],
        seed: 1,
      });
      out.push({
        pts: [
          [-L, 0],
          [L, 0],
          [L / 2, h],
          [-L / 2, h],
        ],
        w: 'y',
        a: 0,
        org: [0, 0],
        seed: 2,
      });
      for (k = 0; k < 6; k++) {
        var p = n[k],
          q = n[(k + 1) % 6];
        out.push({ pts: [p, [p[0] + q[0], p[1] + q[1]], q], w: 'd', a: ang(p, q) });
      }
      /* 地の三角: この星にいちばん近い三角形のうち、六角形と星の角(重心までの距離が L/√3・2L/√3)以外 */
      for (var a = -3; a <= 3; a++)
        for (var b2 = -3; b2 <= 3; b2++) {
          var P0 = [a * L + (b2 * L) / 2, b2 * h],
            tris = [
              [P0, [P0[0] + L, P0[1]], [P0[0] + L / 2, P0[1] + h]],
              [
                [P0[0] + L, P0[1]],
                [P0[0] + 1.5 * L, P0[1] + h],
                [P0[0] + L / 2, P0[1] + h],
              ],
            ];
          tris.forEach(function (T) {
            var c = [(T[0][0] + T[1][0] + T[2][0]) / 3, (T[0][1] + T[1][1] + T[2][1]) / 3],
              d0 = Math.hypot(c[0], c[1]);
            if (d0 < 1.3 * L) return;
            for (var m = -1; m <= 1; m++)
              for (var nn = -1; nn <= 1; nn++) {
                if (!m && !nn) continue;
                var sx = m * lat.a[0] + nn * lat.b[0],
                  sy = m * lat.a[1] + nn * lat.b[1],
                  d1 = Math.hypot(c[0] - sx, c[1] - sy);
                /* 距離が同じ時は、向きで決まった側の星だけが受け持つ */
                if (d1 < d0 - 1e-6 || (Math.abs(d1 - d0) < 1e-6 && (sy < 0 || (sy === 0 && sx < 0)))) return;
              }
            out.push({ pts: T, w: 'h', a: 0 });
          });
        }
      return out;
    },
  };

  window.YosegiPatterns = P;
})();
