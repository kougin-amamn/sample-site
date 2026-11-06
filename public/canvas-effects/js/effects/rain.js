// 雨：斜めの線を落とし、地面に当たったら小さなしぶきを跳ねさせる
Effects.add({
  id: "rain", name: "雨", file: "js/effects/rain.js",
  hint: "左右になぞると風向きが変わります",
  about: "雨粒は短い線、しぶきは重力で落ちる小さな点です。風は雨粒の横の速さとして足しているだけで、それらしく見えます。",
  create() {
    let w = 0, h = 0, drops = [], splashes = [], wind = .2;
    const newDrop = (top) => ({ x: rand(-w * .2, w * 1.2), y: top ? rand(-h, 0) : rand(0, h), len: rand(10, 24), speed: rand(10, 16), z: rand(.4, 1) });
    return {
      resize(W, H) { w = W; h = H; drops = Array.from({ length: 400 }, () => newDrop(false)); splashes = []; },
      frame(ctx, dt, t, power) {
        const k = dt * 60, ground = h - 16;
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, "#1a2330"); sky.addColorStop(1, "#33445a");
        ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#18202b"; ctx.fillRect(0, ground, w, h - ground);

        const active = power * 40;
        ctx.lineCap = "round";
        for (let i = 0; i < active && i < drops.length; i++) {
          const d = drops[i];
          d.y += d.speed * d.z * k; d.x += wind * d.speed * d.z * k;
          if (d.y > ground) {
            for (let j = 0; j < 3; j++) splashes.push({ x: d.x, y: ground, vx: rand(-1.5, 1.5), vy: -rand(1, 3) * d.z, life: 1 });
            Object.assign(d, newDrop(true), { y: rand(-60, 0) });
          }
          ctx.strokeStyle = `rgba(180,205,235,${.25 + d.z * .35})`;
          ctx.lineWidth = d.z * 1.4;
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x - wind * d.len, d.y - d.len * d.z);
          ctx.stroke();
        }
        ctx.fillStyle = "rgba(190,215,240,.7)";
        splashes = splashes.filter(s => {
          s.vy += .2 * k; s.x += s.vx * k; s.y += s.vy * k; s.life -= .05 * k;
          if (s.life <= 0 || s.y > ground + 2) return false;
          ctx.fillRect(s.x, s.y, 1.6, 1.6);
          return true;
        });
      },
      pointer(x, y, kind) { wind = (x / w - .5) * 1.2; }
    };
  }
});
