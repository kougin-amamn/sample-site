// 雪：大きさ（＝近さ）ごとに落ちる速さを変え、左右にゆらゆら揺らす
Effects.add({
  id: "snow", name: "雪", file: "js/effects/snow.js",
  hint: "左右になぞると風が吹きます",
  about: "近い雪ほど大きく、速く、はっきり見えるようにすると奥行きが出ます。横の揺れは雪ごとにずらしたサイン波です。",
  create() {
    let w = 0, h = 0, flakes = [], wind = 0, target = 0;
    const flake = (top) => { const z = rand(.3, 1); return { x: rand(0, w), y: top ? rand(-40, 0) : rand(0, h), z, r: z * 3.2, phase: rand(0, 6.28) }; };
    return {
      resize(W, H) { w = W; h = H; flakes = Array.from({ length: 320 }, () => flake(false)); },
      frame(ctx, dt, t, power) {
        const k = dt * 60;
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, "#0f1b2e"); sky.addColorStop(1, "#2b3f5c");
        ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
        wind += (target - wind) * .02 * k;
        const active = power * 32;
        for (let i = 0; i < active && i < flakes.length; i++) {
          const f = flakes[i];
          f.y += (.4 + f.z * 1.2) * k;
          f.x += (Math.sin(t * 1.2 + f.phase) * .4 + wind * f.z) * k;
          if (f.y > h + 5) Object.assign(f, flake(true));
          if (f.x > w + 5) f.x = -5; if (f.x < -5) f.x = w + 5;
          ctx.fillStyle = `rgba(255,255,255,${.35 + f.z * .6})`;
          ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
        }
      },
      pointer(x) { target = (x / w - .5) * 4; }
    };
  }
});
