/* 混色の計算。DOM を使わないので Node でも読み込める。
   絵の具を混ぜた色は、光の強さ(リニア RGB)を量の割合でかけ合わせる(重み付きの幾何平均)目安で求める */
(function () {
  'use strict';
  /* 0 があると何を混ぜても黒になるので、はね返す光の下限を 0.01 にしている */
  var FLOOR = 0.01;

  function lin(c) {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }
  function srgb(v) {
    v = Math.max(0, Math.min(1, v));
    return Math.round((v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055) * 255);
  }
  /* はね返す赤・緑・青の光(0〜1) */
  function reflect(hex) {
    return [1, 3, 5].map(function (o) {
      return lin(parseInt(hex.substr(o, 2), 16));
    });
  }
  function toHex(l) {
    return (
      '#' +
      l
        .map(function (v) {
          return ('0' + srgb(v).toString(16)).slice(-2);
        })
        .join('')
        .toUpperCase()
    );
  }
  /* parts: { id: 杯数 }、paints: { id: { hex } }。何も入っていない時は null */
  function mix(parts, paints) {
    var t = 0,
      acc = [0, 0, 0];
    Object.keys(parts).forEach(function (id) {
      var n = parts[id];
      if (!n) return;
      t += n;
      reflect(paints[id].hex).forEach(function (v, i) {
        acc[i] += n * Math.log(Math.max(FLOOR, v));
      });
    });
    if (!t) return null;
    return toHex(
      acc.map(function (a) {
        return Math.exp(a / t);
      }),
    );
  }
  /* 重色の目安: 水で薄めた(白 2 と混ぜた)2色の層を光が通り抜けるとして、はね返す光をかけ算する */
  function glaze(a, b) {
    var w = '#FFFFFF',
      ta = reflect(mix({ a: 1, w: 2 }, { a: { hex: a }, w: { hex: w } })),
      tb = reflect(mix({ b: 1, w: 2 }, { b: { hex: b }, w: { hex: w } }));
    return toHex(
      ta.map(function (v, i) {
        return v * tb[i];
      }),
    );
  }
  function luminance(hex) {
    var l = reflect(hex);
    return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
  }
  function contrast(a, b) {
    var x = luminance(a),
      y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  /* 背景色に合わせて、読みやすい文字色(黒か白)を選ぶ */
  function ink(bg) {
    return contrast(bg, '#111111') >= contrast(bg, '#FFFFFF') ? '#111111' : '#FFFFFF';
  }

  var api = { mix: mix, glaze: glaze, reflect: reflect, contrast: contrast, ink: ink };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.ColorMix = api;
})();
