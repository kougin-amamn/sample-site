/* ビープ音サンプル。Web Audio API で音を作って鳴らす */
// ---- 状態 ----
const state = { freq: 1000, dur: 0.15, vol: 0.3, type: "sine" };
let ctx = null, master = null, analyser = null;

// AudioContext はユーザー操作後に作る（ブラウザの自動再生制限のため）
function ensureAudio() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    master.connect(analyser);
    analyser.connect(ctx.destination);
    draw();
  }
  if (ctx.state === "suspended") ctx.resume();
}

// ---- 1音を鳴らす基本関数 ----
function tone(freq, dur, type, vol, start) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  // 立ち上がり・終わりを滑らかにして「プチッ」というノイズを防ぐ
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(vol, start + 0.005);
  gain.gain.setValueAtTime(vol, start + dur - 0.01);
  gain.gain.linearRampToValueAtTime(0, start + dur);
  osc.connect(gain).connect(master);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

// 音の並びを順に鳴らす
function playSequence(seq) {
  ensureAudio();
  let t = ctx.currentTime + 0.02;
  for (const n of seq) {
    if (n.f) tone(n.f, n.d, n.type || "sine", n.v ?? state.vol, t);
    t += n.d + (n.gap || 0);
  }
}

function beep() {
  playSequence([{ f: state.freq, d: state.dur, type: state.type, v: state.vol }]);
}

// ---- プリセット ----
const presets = [
  { name: "ピッ", desc: "決定・タップ音", seq: [{ f: 1000, d: 0.08 }] },
  { name: "ピピッ", desc: "スマホの確認音", seq: [{ f: 2000, d: 0.06, gap: 0.06 }, { f: 2000, d: 0.06 }] },
  { name: "ピロリン", desc: "完了・通知", seq: [{ f: 880, d: 0.09 }, { f: 1175, d: 0.09 }, { f: 1760, d: 0.25 }] },
  { name: "ブッブー", desc: "エラー", seq: [{ f: 220, d: 0.18, type: "square", gap: 0.08 }, { f: 220, d: 0.4, type: "square" }] },
  { name: "ピーポー", desc: "警告アラーム", seq: Array.from({ length: 4 }, (_, i) => ({ f: i % 2 ? 660 : 880, d: 0.3, type: "triangle" })) },
  { name: "ピッピッピッポーン", desc: "時報", seq: [{ f: 440, d: 0.1, gap: 0.5 }, { f: 440, d: 0.1, gap: 0.5 }, { f: 440, d: 0.1, gap: 0.5 }, { f: 880, d: 1.2 }] },
];
const presetBox = document.getElementById("presets");
presets.forEach(p => {
  const b = document.createElement("button");
  b.innerHTML = `<b>${p.name}</b><span>${p.desc}</span>`;
  b.addEventListener("click", () => playSequence(p.seq));
  presetBox.appendChild(b);
});

// ---- UI ----
const $ = id => document.getElementById(id);
function sync() {
  $("freqOut").textContent = state.freq + " Hz";
  $("durOut").textContent = state.dur.toFixed(2) + " 秒";
  $("volOut").textContent = Math.round(state.vol * 100) + "%";
  $("readout").textContent = `${state.freq} Hz / ${state.type}`;
  $("code").textContent =
`const ctx = new AudioContext();

function beep() {
const osc = ctx.createOscillator();
const gain = ctx.createGain();
const t = ctx.currentTime;

osc.type = "${state.type}";
osc.frequency.value = ${state.freq};

gain.gain.setValueAtTime(0, t);
gain.gain.linearRampToValueAtTime(${state.vol}, t + 0.005);
gain.gain.setValueAtTime(${state.vol}, t + ${(state.dur - 0.01).toFixed(2)});
gain.gain.linearRampToValueAtTime(0, t + ${state.dur.toFixed(2)});

osc.connect(gain).connect(ctx.destination);
osc.start(t);
osc.stop(t + ${(state.dur + 0.02).toFixed(2)});
}

// ボタンのクリックなど、ユーザー操作の中で呼ぶ
document.querySelector("button").onclick = beep;`;
}
$("freq").addEventListener("input", e => { state.freq = +e.target.value; sync(); });
$("dur").addEventListener("input", e => { state.dur = +e.target.value; sync(); });
$("vol").addEventListener("input", e => { state.vol = +e.target.value; sync(); });
$("waves").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  state.type = b.dataset.type;
  document.querySelectorAll("#waves button").forEach(x => x.setAttribute("aria-pressed", x === b));
  sync(); beep();
});
$("beepBtn").addEventListener("click", beep);
document.addEventListener("keydown", e => {
  if (e.code === "Space" && !["INPUT", "BUTTON"].includes(document.activeElement.tagName)) {
    e.preventDefault();
    $("beepBtn").classList.add("pressed");
    beep();
  }
});
document.addEventListener("keyup", e => { if (e.code === "Space") $("beepBtn").classList.remove("pressed"); });
$("copyBtn").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText($("code").textContent); $("copyBtn").textContent = "コピーしました"; }
  catch { $("copyBtn").textContent = "コピーできませんでした"; }
  setTimeout(() => $("copyBtn").textContent = "コピー", 1500);
});

// ---- オシロスコープ表示 ----
const canvas = $("scope"), g = canvas.getContext("2d");
function drawIdle() {
  g.fillStyle = "#1a1206"; g.fillRect(0, 0, canvas.width, canvas.height);
  g.strokeStyle = "#ffb000"; g.lineWidth = 2;
  g.beginPath(); g.moveTo(0, canvas.height / 2); g.lineTo(canvas.width, canvas.height / 2); g.stroke();
}
function draw() {
  const buf = new Uint8Array(analyser.fftSize);
  (function loop() {
    analyser.getByteTimeDomainData(buf);
    g.fillStyle = "rgba(26,18,6,0.45)";
    g.fillRect(0, 0, canvas.width, canvas.height);
    g.strokeStyle = "#ffb000"; g.lineWidth = 2;
    g.shadowColor = "#ffb000"; g.shadowBlur = 6;
    g.beginPath();
    const step = canvas.width / 512;
    for (let i = 0; i < 512; i++) {
      const y = (buf[i] / 255) * canvas.height;
      i ? g.lineTo(i * step, y) : g.moveTo(0, y);
    }
    g.stroke(); g.shadowBlur = 0;
    requestAnimationFrame(loop);
  })();
}
drawIdle(); sync();
