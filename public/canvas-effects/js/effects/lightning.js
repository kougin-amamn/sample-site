// カミナリ：線分の真ん中を横にずらす作業をくり返してギザギザを作り、枝分かれを足す
Effects.add({
  id: "lightning", name: "カミナリ", file: "js/effects/lightning.js",
  hint: "タップした場所に落ちます",
  about: "始点と終点を結ぶ線の中点を少し横にずらし、それを何度もくり返すと稲妻のギザギザになります（中点変位法）。落ちた瞬間に画面全体を白く光らせると迫力が出ます。",
  create() {
    let w = 0, h = 0, bolts = [], flash = 0, acc = 0;

    function jagged(x0, y0, x1, y1, disp, iter) {
      let pts = [[x0, y0], [x1, y1]];
      for (let n = 0; n < iter; n++) {
        const next = [pts[0]];
        for (let i = 1; i < pts.length; i++) {
          const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
          const len = Math.hypot(bx - ax, by - ay) || 1;
          const off = rand(-1, 1) * disp;
          next.push([(ax + bx) / 2 + (-(by - ay) / len) * off, (ay + by) / 2 + ((bx - ax) / len) * off], pts[i]);
        }
        pts = next; disp /= 2;
      }
      return pts;
    }
    function strike(x) {
      const main = jagged(x + rand(-80, 80), 0, x, h, h * .25, 7);
      const paths = [{ pts: main, width: 3 }];
      const branches = 2 + Math.floor(Math.random() * 4);
      for (let b = 0; b < branches; b++) {
        const [sx, sy] = main[Math.floor(rand(.1, .7) * main.length)];
        const len = rand(.15, .35) * h;
        const ang = Math.PI / 2 + rand(-.9, .9);
        paths.push({ pts: jagged(sx, sy, sx + Math.cos(ang) * len, sy + Math.sin(ang) * len, len * .3, 5), width: 1.3 });
      }
      bolts.push({ paths, life: 1 });
      flash = 1;
    }
    return {
      resize(W, H) { w = W; h = H; bolts = []; },
      frame(ctx, dt, t, power) {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, "#0b0f1c"); sky.addColorStop(1, "#1f2638");
        ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
        // 雲（光ると照らされる）
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = `rgba(${40 + flash * 120},${45 + flash * 120},${60 + flash * 130},.9)`;
          ctx.beginPath(); ctx.ellipse((i + .5) * w / 6 + Math.sin(t * .2 + i) * 20, 10, w / 6, h * .12, 0, 0, Math.PI * 2); ctx.fill();
        }

        acc += dt * power * .08;
        if (acc > 1) { acc = 0; strike(rand(w * .1, w * .9)); }

        ctx.globalCompositeOperation = "lighter";
        ctx.lineJoin = "round";
        bolts = bolts.filter(b => {
          b.life -= dt * 2.2;
          if (b.life <= 0) return false;
          const a = b.life > .8 || Math.random() > .3 ? b.life : b.life * .3; // 少しちらつかせる
          b.paths.forEach(p => {
            ctx.strokeStyle = `rgba(190,215,255,${a})`;
            ctx.lineWidth = p.width;
            ctx.shadowColor = "#9cc3ff"; ctx.shadowBlur = 18;
            ctx.beginPath();
            p.pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
            ctx.stroke();
          });
          return true;
        });
        ctx.shadowBlur = 0;
        ctx.globalCompositeOperation = "source-over";
        if (flash > 0) {
          ctx.fillStyle = `rgba(220,230,255,${flash * .45})`; ctx.fillRect(0, 0, w, h);
          flash = Math.max(0, flash - dt * 4);
        }
      },
      pointer(x, y, kind) { if (kind === "down") strike(x); }
    };
  }
});
