// 炎：下から湧く粒を「加算合成」で重ね、寿命に応じて白→黄→橙→赤と色を変える
Effects.add({
  id: "fire", name: "炎", file: "js/effects/fire.js",
  hint: "なぞると炎が付いてきます",
  about: "たくさんの半透明の円を上へ流し、重なるほど明るくなる加算合成（lighter）で描いています。生まれたては白く、時間とともに赤く小さく消えていきます。",
  create() {
    let w = 0, h = 0, sx = 0, parts = [];
    return {
      resize(W, H) { w = W; h = H; sx = w / 2; parts = []; },
      frame(ctx, dt, t, power) {
        const k = dt * 60, base = Math.min(w, h);
        ctx.fillStyle = "#0c0604"; ctx.fillRect(0, 0, w, h);

        const n = Math.round(power * 3 * k);
        for (let i = 0; i < n; i++) {
          parts.push({
            x: sx + rand(-1, 1) * base * .07, y: h - 10,
            vx: rand(-.4, .4), vy: -rand(1.5, 3.5) * base / 400,
            life: 1, decay: rand(.012, .025), r: rand(.03, .06) * base
          });
        }
        // 火の粉
        if (Math.random() < .2 * k) parts.push({ x: sx + rand(-30, 30), y: h - 20, vx: rand(-1, 1), vy: -rand(2, 5), life: 1, decay: .01, r: 2, spark: true });

        ctx.globalCompositeOperation = "lighter";
        parts = parts.filter(p => {
          p.x += (p.vx + Math.sin(t * 3 + p.y * .02) * .3) * k;
          p.y += p.vy * k;
          p.life -= p.decay * k;
          if (!p.spark) p.r *= Math.pow(.985, k);
          if (p.life <= 0) return false;
          const L = p.life;
          const c = p.spark ? "255,200,120" : L > .75 ? "255,235,170" : L > .45 ? "255,150,40" : "200,50,20";
          ctx.fillStyle = `rgba(${c},${(p.spark ? 1 : .45) * L})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
          return true;
        });
      },
      pointer(x) { sx = x; }
    };
  }
});
