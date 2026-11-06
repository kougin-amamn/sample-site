// 画面の動き（patterns.js の後に読み込む）

const $ = id => document.getElementById(id);

const state = { type: "seigaiha", size: 64, weight: 5, rot: 0, fg: "#22406b", bg: "#eef1f3", tab: "svg" };

// ===== SVG を組み立てる =====
let uid = 0;
function fullSVG(o, W, H) {
  const p = PATTERNS[o.type].tile(o.size, o.weight, o.fg, o.bg);
  const id = "pt" + (uid++);
  const dims = W ? `width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"` : `width="100%" height="100%"`;
  const tf = o.rot ? ` patternTransform="rotate(${o.rot})"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" ${dims}>
<defs>
  <pattern id="${id}" width="${p.w}" height="${p.h}" patternUnits="userSpaceOnUse"${tf}>
    ${p.body}
  </pattern>
</defs>
<rect width="100%" height="100%" fill="${o.bg}"/>
<rect width="100%" height="100%" fill="url(#${id})"/>
</svg>`;
}
function tileSVG(o) {
  const p = PATTERNS[o.type].tile(o.size, o.weight, o.fg, o.bg);
  return { p, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${p.w}" height="${p.h}" viewBox="0 0 ${p.w} ${p.h}"><rect width="${p.w}" height="${p.h}" fill="${o.bg}"/>${p.body}</svg>` };
}
const exportSVG = () => fullSVG(state, 1200, 1200).replace(/id="pt\d+"/, 'id="pattern"').replace(/url\(#pt\d+\)/, "url(#pattern)");

// ===== 画面の更新 =====
function render() {
  $("preview").innerHTML = fullSVG(state);
  $("sizeOut").textContent = state.size + " px";
  $("weightOut").textContent = state.weight;
  $("rotOut").textContent = state.rot + "°";
  $("size").value = state.size; $("weight").value = state.weight; $("rot").value = state.rot;
  $("fg").value = state.fg; $("bg").value = state.bg;

  document.querySelectorAll("#gallery button").forEach(b => {
    const type = b.dataset.type;
    b.setAttribute("aria-pressed", type === state.type);
    const d = PATTERNS[type].def;
    b.querySelector(".thumb").innerHTML = fullSVG({ type, size: Math.round(d.size * .6), weight: Math.max(1, Math.round(d.weight * .6)), rot: d.rot, fg: state.fg, bg: state.bg });
  });

  if (state.tab === "svg") {
    $("code").textContent = exportSVG();
    $("note").textContent = "HTML にそのまま貼るか、.svg ファイルとして保存して使えます。";
  } else {
    $("code").textContent = cssCode();
  }
}

function cssCode() {
  const enc = s => encodeURIComponent(s.replace(/\s*\n\s*/g, " ")).replace(/'/g, "%27");
  if (state.rot % 180 === 0) {
    const { p, svg } = tileSVG(state);
    $("note").textContent = "小さなタイルを敷き詰める書き方なので、どんなに広い要素でも継ぎ目なく軽く表示できます。";
    return `.pattern {
background-color: ${state.bg};
background-image: url("data:image/svg+xml,${enc(svg)}");
background-size: ${p.w}px ${p.h}px;
}`;
  }
  $("note").textContent = "回転しているため、600px 四方の画像として敷き詰めています。継ぎ目が気になる場合は回転を 0° にしてください。";
  return `.pattern {
background-color: ${state.bg};
background-image: url("data:image/svg+xml,${enc(fullSVG(state, 600, 600))}");
background-size: 600px 600px;
}`;
}

// ===== ギャラリーとパレット =====
Object.entries(PATTERNS).forEach(([type, p]) => {
  const b = document.createElement("button");
  b.dataset.type = type;
  b.innerHTML = `<div class="thumb"></div><span>${p.name}</span>`;
  b.addEventListener("click", () => { state.type = type; Object.assign(state, p.def); render(); });
  $("gallery").appendChild(b);
});
PALETTES.forEach(pl => {
  const b = document.createElement("button");
  b.innerHTML = `<span class="swatch" style="background:${pl.bg};border-color:${pl.fg}"></span>${pl.name}`;
  b.addEventListener("click", () => { state.fg = pl.fg; state.bg = pl.bg; render(); });
  $("palettes").appendChild(b);
});

// ===== 操作 =====
["size", "weight", "rot"].forEach(k => $(k).addEventListener("input", e => { state[k] = +e.target.value; render(); }));
["fg", "bg"].forEach(k => $(k).addEventListener("input", e => { state[k] = e.target.value; render(); }));
$("swapBtn").addEventListener("click", () => { [state.fg, state.bg] = [state.bg, state.fg]; render(); });
$("randomBtn").addEventListener("click", () => {
  const types = Object.keys(PATTERNS);
  state.type = types[Math.floor(Math.random() * types.length)];
  const d = PATTERNS[state.type].def;
  state.size = Math.round(d.size * (0.7 + Math.random() * 0.8));
  state.weight = Math.max(1, Math.round(d.weight * (0.6 + Math.random() * 0.9)));
  state.rot = Math.random() < .3 ? [15, 30, 45, 60][Math.floor(Math.random() * 4)] : d.rot;
  const pl = PALETTES[Math.floor(Math.random() * PALETTES.length)];
  state.fg = pl.fg; state.bg = pl.bg;
  render();
});
document.querySelectorAll(".tabs button").forEach(b => b.addEventListener("click", () => {
  state.tab = b.dataset.tab;
  document.querySelectorAll(".tabs button").forEach(x => x.setAttribute("aria-selected", x === b));
  render();
}));
$("copyBtn").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText($("code").textContent); toast("コピーしました"); }
  catch { toast("コピーできませんでした"); }
});

// ===== 保存（公開ページでは確認つき保存、手元のファイルでは通常のダウンロード） =====
async function saveFile(filename, data) {
  if (window.claude && window.claude.use) {
    const dl = await window.claude.use("downloads");
    if (dl) {
      try { await dl.save({ filename, data }); toast("保存しました"); }
      catch (e) { if (e && e.code !== "declined") toast("保存できませんでした"); }
      return;
    }
  }
  const blob = data instanceof Blob ? data : new Blob([data], { type: "image/svg+xml" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const fileBase = () => "pattern-" + state.type;
$("dlSvg").addEventListener("click", () => saveFile(fileBase() + ".svg", exportSVG()));
$("dlPng").addEventListener("click", () => {
  const img = new Image();
  img.onload = () => {
    const c = document.createElement("canvas"); c.width = 1200; c.height = 1200;
    c.getContext("2d").drawImage(img, 0, 0, 1200, 1200);
    c.toBlob(blob => blob ? saveFile(fileBase() + ".png", blob) : toast("PNG を作れませんでした"), "image/png");
  };
  img.onerror = () => toast("PNG を作れませんでした");
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(exportSVG());
});

function toast(message, ms = 2200) {
  const el = document.createElement("div");
  el.className = "toast"; el.textContent = message;
  $("toastArea").appendChild(el);
  setTimeout(() => { el.classList.add("out"); el.addEventListener("animationend", () => el.remove()); }, ms);
}

render();
