// 柄とパレットの定義（SVG のタイル）
// 新しい柄は PATTERNS に1つ追加するだけで、画面にも自動で並びます。

const r2 = n => Math.round(n * 100) / 100;

// ===== 柄の定義：1枚のタイル（w×h）の中身を返す =====
const PATTERNS = {
  dots:    { name: "ドット", def: { size: 32, weight: 8, rot: 0 },
    tile: (s, t, fg) => ({ w: s, h: s, body: `<circle cx="${s/2}" cy="${s/2}" r="${r2(t*0.6)}" fill="${fg}"/>` }) },
  stripes: { name: "ストライプ", def: { size: 24, weight: 10, rot: 45 },
    tile: (s, t, fg) => ({ w: s, h: s, body: `<rect width="${s}" height="${Math.min(t, s)}" fill="${fg}"/>` }) },
  grid:    { name: "格子", def: { size: 36, weight: 3, rot: 0 },
    tile: (s, t, fg) => ({ w: s, h: s, body: `<rect width="${s}" height="${t}" fill="${fg}"/><rect width="${t}" height="${s}" fill="${fg}"/>` }) },
  checker: { name: "市松", def: { size: 48, weight: 1, rot: 0 },
    tile: (s, t, fg) => ({ w: s, h: s, body: `<rect width="${s/2}" height="${s/2}" fill="${fg}"/><rect x="${s/2}" y="${s/2}" width="${s/2}" height="${s/2}" fill="${fg}"/>` }) },
  zigzag:  { name: "山形", def: { size: 40, weight: 4, rot: 0 },
    tile: (s, t, fg) => { const h = s/2;
      return { w: s, h, body: `<path d="M${-s/2} ${r2(h*.2)}L0 ${r2(h*.8)}L${s/2} ${r2(h*.2)}L${s} ${r2(h*.8)}L${s*1.5} ${r2(h*.2)}" fill="none" stroke="${fg}" stroke-width="${t}"/>` }; } },
  waves:   { name: "波", def: { size: 60, weight: 3, rot: 0 },
    tile: (s, t, fg) => { const h = s/2, a = h*.45, y = h/2;
      return { w: s, h, body: `<path d="M${-s/2} ${y}Q${-s/4} ${r2(y+a)} 0 ${y}T${s/2} ${y}T${s} ${y}T${s*1.5} ${y}" fill="none" stroke="${fg}" stroke-width="${t}" stroke-linecap="round"/>` }; } },
  seigaiha:{ name: "青海波", def: { size: 64, weight: 5, rot: 0 },
    tile: (s, t, fg, bg) => { const r = s/2;
      const rings = (cx, cy) => [1, .75, .5, .25].map(k => `<circle cx="${cx}" cy="${cy}" r="${r2(r*k)}" fill="${bg}" stroke="${fg}" stroke-width="${r2(t/2.5)}"/>`).join("");
      return { w: s, h: s/2, body: rings(0,0) + rings(s,0) + rings(s/2, s/4) + rings(0, s/2) + rings(s, s/2) }; } },
  uroko:   { name: "鱗", def: { size: 40, weight: 1, rot: 0 },
    tile: (s, t, fg) => ({ w: s, h: s, body:
      `<polygon points="${s/2},0 0,${s/2} ${s},${s/2}" fill="${fg}"/><polygon points="0,${s/2} ${-s/2},${s} ${s/2},${s}" fill="${fg}"/><polygon points="${s},${s/2} ${s/2},${s} ${s*1.5},${s}" fill="${fg}"/>` }) },
  shippo:  { name: "七宝", def: { size: 48, weight: 5, rot: 0 },
    tile: (s, t, fg) => ({ w: s, h: s, body:
      [[0,0],[s,0],[0,s],[s,s],[s/2,s/2]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="${s/2}" fill="none" stroke="${fg}" stroke-width="${r2(t/2.5)}"/>`).join("") }) },
  cross:   { name: "十字", def: { size: 36, weight: 6, rot: 0 },
    tile: (s, t, fg) => { const L = r2(s*.45), th = r2(t/1.5), c = s/2;
      return { w: s, h: s, body: `<rect x="${r2(c-L/2)}" y="${r2(c-th/2)}" width="${L}" height="${th}" fill="${fg}"/><rect x="${r2(c-th/2)}" y="${r2(c-L/2)}" width="${th}" height="${L}" fill="${fg}"/>` }; } },
};

const PALETTES = [
  { name: "藍", fg: "#22406b", bg: "#eef1f3" },
  { name: "朱", fg: "#c8321e", bg: "#f3ece4" },
  { name: "墨", fg: "#1d262d", bg: "#d9dee2" },
  { name: "若竹", fg: "#3a8a5c", bg: "#e6f1ea" },
  { name: "桜", fg: "#d9798f", bg: "#fbeff2" },
  { name: "夜", fg: "#ffb000", bg: "#1a1206" },
];
