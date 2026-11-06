// 波：いくつかのサイン波を重ねた層を、奥から手前へ塗り重ねる
Effects.add({
  id: "waves", name: "波", file: "js/effects/waves.js",
  hint: "強さで波の高さが変わります",
  about: "周期の違う2本のサイン波を足し合わせて、自然な不規則さを出しています。奥の層ほど小さく・遅く・明るくすると遠近感が出ます。",
  create() {
    let w = 0, h = 0;
    const layers = [
      { y: .52, amp: 10, len: 90,  speed: .6,  color: "#3f6f98" },
      { y: .60, amp: 14, len: 120, speed: .8,  color: "#2d5a84" },
      { y: .70, amp: 20, len: 150, speed: 1.0, color: "#1f466d" },
      { y: .82, amp: 26, len: 190, speed: 1.3, color: "#143455" },
    ];
    return {
      resize(W, H) { w = W; h = H; },
      frame(ctx, dt, t, power) {
        // 夕暮れの空と太陽
        const sky = ctx.createLinearGradient(0, 0, 0, h * .6);
        sky.addColorStop(0, "#1c2f4d"); sky.addColorStop(1, "#e48a5b");
        ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#ffd59a";
        ctx.beginPath(); ctx.arc(w * .7, h * .5, Math.min(w, h) * .09, 0, Math.PI * 2); ctx.fill();

        const k = power / 5;
        layers.forEach(L => {
          ctx.beginPath();
          ctx.moveTo(0, h);
          for (let x = 0; x <= w + 8; x += 8) {
            const y = h * L.y + L.amp * k * (
              Math.sin(x / L.len + t * L.speed) * .65 +
              Math.sin(x / (L.len * .47) - t * L.speed * 1.4) * .35);
            ctx.lineTo(x, y);
          }
          ctx.lineTo(w, h);
          ctx.closePath();
          ctx.fillStyle = L.color;
          ctx.fill();
        });
      }
    };
  }
});
