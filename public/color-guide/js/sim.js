/* 色の見え方のシミュレーションとコントラスト比の計算。DOM を使わないので Node でも読み込める。
   色覚は Machado ほか(2009)の変換行列(重さ 1.0)を、光の強さに比例する値(リニア RGB)にかけて求める。
   高齢者は水晶体の黄変(青が届きにくい)とコントラストの低下を簡単にまねた目安で、医学的な再現ではない */
(function () {
  'use strict';
  var M = {
    protan: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
    deutan: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881],
    tritan: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.3039],
  };
  /* 高齢者の目安: 緑を少し・青を大きく弱め(黄変)、明るさの幅を縮める(かすみ) */
  var AGED = { gain: [1, 0.94, 0.68], slope: 0.86, offset: 0.07 };

  var TYPES = [
    { id: 'normal', name: '一般色覚' },
    { id: 'protan', name: 'P型' },
    { id: 'deutan', name: 'D型' },
    { id: 'tritan', name: 'T型' },
    { id: 'achro', name: '1色覚' },
    { id: 'aged', name: '高齢者(目安)' },
  ];

  function toLin(c) {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }
  function toSrgb(v) {
    v = Math.max(0, Math.min(1, v));
    return Math.round((v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055) * 255);
  }
  function parse(hex) {
    var n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function hex(rgb) {
    return (
      '#' +
      rgb
        .map(function (v) {
          return ('0' + v.toString(16)).slice(-2);
        })
        .join('')
        .toUpperCase()
    );
  }

  function simulate(color, type) {
    var c = parse(color);
    if (type === 'normal') return hex(c);
    if (type === 'aged') {
      return hex(
        c.map(function (v, i) {
          return Math.round(
            Math.max(0, Math.min(255, ((v / 255) * AGED.gain[i] * AGED.slope + AGED.offset) * 255)),
          );
        }),
      );
    }
    var l = c.map(toLin);
    if (type === 'achro') {
      var y = 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
      return hex([toSrgb(y), toSrgb(y), toSrgb(y)]);
    }
    var m = M[type];
    return hex([
      toSrgb(m[0] * l[0] + m[1] * l[1] + m[2] * l[2]),
      toSrgb(m[3] * l[0] + m[4] * l[1] + m[5] * l[2]),
      toSrgb(m[6] * l[0] + m[7] * l[1] + m[8] * l[2]),
    ]);
  }

  /* WCAG 2 のコントラスト比(1〜21) */
  function luminance(color) {
    var l = parse(color).map(toLin);
    return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
  }
  function contrast(a, b) {
    var x = luminance(a),
      y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }

  /* CSS の filter: url(#...) で画面の一部をまとめて変換するための SVG フィルタ */
  function filtersSvg() {
    var s = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>';
    Object.keys(M).forEach(function (k) {
      var m = M[k];
      s +=
        '<filter id="sim-' +
        k +
        '" color-interpolation-filters="linearRGB"><feColorMatrix type="matrix" values="' +
        [m[0], m[1], m[2], 0, 0, m[3], m[4], m[5], 0, 0, m[6], m[7], m[8], 0, 0, 0, 0, 0, 1, 0].join(' ') +
        '"/></filter>';
    });
    s +=
      '<filter id="sim-achro" color-interpolation-filters="linearRGB"><feColorMatrix type="matrix" values="' +
      '0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0"/></filter>';
    var g = AGED.gain,
      a = AGED.slope,
      o = AGED.offset;
    s +=
      '<filter id="sim-aged" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="' +
      [g[0] * a, 0, 0, 0, o, 0, g[1] * a, 0, 0, o, 0, 0, g[2] * a, 0, o, 0, 0, 0, 1, 0].join(' ') +
      '"/><feGaussianBlur stdDeviation="0.6"/></filter>';
    return s + '</defs></svg>';
  }

  var api = { TYPES: TYPES, simulate: simulate, contrast: contrast, filtersSvg: filtersSvg };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.ColorSim = api;
})();
