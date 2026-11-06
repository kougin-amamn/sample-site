// 花火：打ち上げた玉が頂点で弾け、粒が重力と空気抵抗で広がりながら落ちる
Effects.add({
  id: "fireworks", name: "花火", file: "js/effects/fireworks.js",
  hint: "タップした高さで花火が開きます",
  about: "背景を毎回少しだけ暗く塗り重ねると、前の絵がうっすら残って光の尾ができます。粒は放射状に速さを与え、毎フレーム少し減速させて丸く開かせています。",
  create() {
    let w = 0, h = 0, rockets = [], sparks = [], acc = 0;
    function launch(x, ty) {
      rockets.push({ x, y: h, tx: x + rand(-40, 40), ty, hue: Math.floor(rand(0, 360)) });
    }
    function burst(r) {
      const n = 90, speed = rand(3, 5);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2, s = speed * rand(.6, 1);
        sparks.push({ x: r.x, y: r.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, decay: rand(.01, .018), hue: r.hue + rand(-20, 20) });
      }
    }
    return {
      resize(W, H) { w = W; h = H; rockets = []; sparks = []; },
      frame(ctx, dt, t, power) {
        const k = dt * 60;
        ctx.fillStyle = "rgba(6,8,18,.22)"; ctx.fillRect(0, 0, w, h);

        acc += dt * power * .25;
        if (acc > 1) { acc = 0; launch(rand(w * .15, w * .85), rand(h * .15, h * .45)); }

        ctx.globalCompositeOperation = "lighter";
        rockets = rockets.filter(r => {
          const dy = r.ty - r.y;
          r.y += Math.min(-3, dy * .06) * k; r.x += (r.tx - r.x) * .03 * k;
          ctx.fillStyle = `hsl(${r.hue},100%,80%)`;
          ctx.fillRect(r.x - 1.5, r.y - 1.5, 3, 3);
          if (r.y <= r.ty + 2) { burst(r); return false; }
          return true;
        });
        sparks = sparks.filter(s => {
          s.vx *= Math.pow(.96, k); s.vy = s.vy * Math.pow(.96, k) + .05 * k;
          s.x += s.vx * k; s.y += s.vy * k; s.life -= s.decay * k;
          if (s.life <= 0) return false;
          ctx.fillStyle = `hsla(${s.hue},100%,${55 + s.life * 25}%,${s.life})`;
          ctx.beginPath(); ctx.arc(s.x, s.y, 1.8, 0, Math.PI * 2); ctx.fill();
          return true;
        });
      },
      pointer(x, y, kind) { if (kind === "down") launch(x, Math.min(y, h * .8)); }
    };
  }
});
