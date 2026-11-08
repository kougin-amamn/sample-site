/* SVG 版の描画。木目は feTurbulence(横に長いノイズ)→ feComponentTransfer(年輪の筋)→ feColorMatrix(樹種の色)で作り、
   <pattern> に入れて木片ごとの角度で回す。layout.js の後に読み込む */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg',
    Lay = window.YosegiLayout,
    T = 320;

  function rgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  function f(n) {
    return Math.round(n * 1000) / 1000;
  }

  /* 年輪の筋: ノイズの値を細かい段に分け、段の境目だけ濃くする表。筋の数は樹種の rings に合わせる */
  function ringTable(sp) {
    var steps = Math.max(6, Math.round(sp.rings / 2)),
      v = [];
    for (var n = 0; n < steps; n++) {
      v.push(0.12, 0.05, 0.1, 0.3, 1);
    }
    v.push(0.12);
    return v.join(' ');
  }

  function grainFilter(sp, n) {
    var b = rgb(sp.base),
      d = rgb(sp.dark),
      k = sp.contrast * 1.25,
      row = function (c) {
        return f((d[c] - b[c]) * k) + ' 0 0 0 ' + f(b[c]);
      };
    return (
      '<filter id="grain-' +
      sp.id +
      '" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.0035 0.045" numOctaves="3" seed="' +
      (n * 7 + 3) +
      '" stitchTiles="stitch" result="ring"/>' +
      '<feComponentTransfer in="ring" result="lines"><feFuncR type="table" tableValues="' +
      ringTable(sp) +
      '"/></feComponentTransfer>' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.02 0.7" numOctaves="2" seed="' +
      (n * 7 + 5) +
      '" stitchTiles="stitch" result="fiber"/>' +
      '<feComposite in="lines" in2="fiber" operator="arithmetic" k2="0.85" k3="' +
      f(sp.fiber * 0.9) +
      '" k4="' +
      f(-sp.fiber * 0.45) +
      '" result="mix"/>' +
      '<feColorMatrix in="mix" type="matrix" values="' +
      row(0) +
      ' ' +
      row(1) +
      ' ' +
      row(2) +
      ' 0 0 0 0 1"/>' +
      '</filter>'
    );
  }

  /* svg 要素に模様を描き、使った木の役割を返す */
  function paint(svg, W, H, id, size, opt, woods, map) {
    var defs = [],
      body = [],
      used = {},
      pats = {},
      filters = {},
      ts = (0.55 * size) / 44,
      sw = Math.max(0.5, size / 70);
    function patternOf(role, a, v) {
      var sp = woods[map[role]],
        ang = ((Math.round(a) % 180) + 180) % 180,
        key = sp.id + '-' + ang + '-' + v;
      used[role] = true;
      if (!filters[sp.id]) {
        filters[sp.id] = true;
        defs.push(grainFilter(sp, Object.keys(filters).length));
        defs.push(
          '<pattern id="wood-' +
            sp.id +
            '" width="' +
            T +
            '" height="' +
            T +
            '" patternUnits="userSpaceOnUse"><rect width="' +
            T +
            '" height="' +
            T +
            '" filter="url(#grain-' +
            sp.id +
            ')"/></pattern>',
        );
      }
      if (!pats[key]) {
        pats[key] = true;
        defs.push(
          '<pattern id="w-' +
            key +
            '" href="#wood-' +
            sp.id +
            '" patternTransform="rotate(' +
            ang +
            ') translate(' +
            v * 131 +
            ' ' +
            v * 77 +
            ') scale(' +
            f(ts) +
            ')"/>',
        );
      }
      return 'url(#w-' + key + ')';
    }
    var rot = Lay.each(id, size, W, H, function (p, ox, oy, rnd) {
      var pts = p.clip ? Lay.clipPoly(p.pts, p.clip) : p.pts;
      if (pts.length < 3) return;
      var d =
        'M' +
        pts
          .map(function (q) {
            return f(q[0] + ox) + ' ' + f(q[1] + oy);
          })
          .join('L') +
        'Z';
      body.push(
        '<path d="' +
          d +
          '" fill="' +
          patternOf(p.w, p.a, Math.floor(rnd(0) * 3)) +
          '"' +
          (opt.seam && p.seam !== false ? '' : ' stroke="none"') +
          '/>',
      );
    });
    defs.push(
      '<linearGradient id="gloss" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffaeb" stop-opacity=".2"/>' +
        '<stop offset=".35" stop-color="#fffaeb" stop-opacity=".03"/><stop offset=".6" stop-opacity="0"/>' +
        '<stop offset="1" stop-color="#321905" stop-opacity=".2"/></linearGradient>',
    );
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.innerHTML =
      '<defs>' +
      defs.join('') +
      '</defs>' +
      '<g transform="translate(' +
      W / 2 +
      ' ' +
      H / 2 +
      ') rotate(' +
      rot +
      ')" stroke="rgba(35,20,8,0.42)" stroke-width="' +
      f(sw) +
      '" stroke-linejoin="round">' +
      body.join('') +
      '</g>' +
      (opt.gloss ? '<rect width="' + W + '" height="' + H + '" fill="url(#gloss)"/>' : '');
    return used;
  }

  /* 保存用: 単体で開ける SVG ファイルの文字列 */
  function serialize(svg) {
    var c = svg.cloneNode(true);
    c.setAttribute('xmlns', NS);
    c.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    c.querySelectorAll('pattern[href]').forEach(function (p) {
      p.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', p.getAttribute('href'));
    });
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + c.outerHTML;
  }

  window.YosegiSVG = { paint: paint, serialize: serialize };
})();
