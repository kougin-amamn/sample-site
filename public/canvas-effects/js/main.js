// 画面の動き：キャンバスの大きさ合わせ、切り替え、アニメーションのループ
const canvas = document.getElementById("stage");
const ctx = canvas.getContext("2d");
const $ = id => document.getElementById(id);

let current = null, def = null, w = 0, h = 0;
let power = 5, paused = false, last = 0, elapsed = 0, dragging = false;

// 高解像度画面でもぼやけないよう、実ピクセル数を devicePixelRatio 倍にする
function fit() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const r = canvas.getBoundingClientRect();
  w = r.width; h = r.height;
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (current) current.resize(w, h);
}

function select(id) {
  def = Effects.list.find(e => e.id === id) || Effects.list[0];
  current = def.create();
  current.resize(w, h);
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, w, h);
  $("hint").textContent = def.hint;
  $("about").textContent = def.about;
  $("file").textContent = def.file;
  document.querySelectorAll("#chips button").forEach(b => b.setAttribute("aria-selected", b.dataset.id === def.id));
}

function loop(now) {
  const dt = Math.min((now - last) / 1000 || 0, .05); // タブ復帰時などの大きな飛びを防ぐ
  last = now;
  if (!paused && current) {
    elapsed += dt;
    ctx.save();
    current.frame(ctx, dt, elapsed, power);
    ctx.restore();
  }
  requestAnimationFrame(loop);
}

// 切り替えボタン
Effects.list.forEach(e => {
  const b = document.createElement("button");
  b.textContent = e.name; b.dataset.id = e.id; b.setAttribute("role", "tab");
  b.addEventListener("click", () => select(e.id));
  $("chips").appendChild(b);
});

// タップ・なぞる
function pos(e) { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
canvas.addEventListener("pointerdown", e => { dragging = true; canvas.setPointerCapture(e.pointerId); current?.pointer?.(...pos(e), "down"); });
canvas.addEventListener("pointermove", e => current?.pointer?.(...pos(e), dragging ? "drag" : "move"));
canvas.addEventListener("pointerup", () => dragging = false);
canvas.addEventListener("pointercancel", () => dragging = false);

$("power").addEventListener("input", e => { power = +e.target.value; $("powerOut").textContent = power; });
$("pauseBtn").addEventListener("click", () => { paused = !paused; $("pauseBtn").textContent = paused ? "再生" : "一時停止"; });

window.addEventListener("resize", fit);
fit();
select("waves");
requestAnimationFrame(t => { last = t; loop(t); });
