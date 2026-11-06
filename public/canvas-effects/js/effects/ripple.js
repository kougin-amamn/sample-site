// 波紋：水面の高さを格子で持ち、隣のマスの平均から次の高さを計算する（古典的な水面シミュレーション）
Effects.add({
  id: "ripple", name: "波紋", file: "js/effects/ripple.js",
  hint: "タップ・なぞると波紋が広がります",
  about: "水面を小さなマスに分け、「周りの平均 − 1つ前の高さ」で次の瞬間の高さを求めています。高さの傾きを明るさに変えると、光が反射しているように見えます。",
  create() {
    const CELL = 4;                 // 1マスの大きさ（px）。小さいほど細かいが重くなる
    let w = 0, h = 0, cols = 0, rows = 0, cur, prev, off, octx, img, acc = 0;

    function drop(x, y, strength = 500) {
      const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const X = cx + dx, Y = cy + dy;
        if (X > 0 && Y > 0 && X < cols - 1 && Y < rows - 1 && dx * dx + dy * dy <= 4) cur[Y * cols + X] = strength;
      }
    }
    return {
      resize(W, H) {
        w = W; h = H;
        cols = Math.ceil(w / CELL); rows = Math.ceil(h / CELL);
        cur = new Float32Array(cols * rows); prev = new Float32Array(cols * rows);
        off = document.createElement("canvas"); off.width = cols; off.height = rows;
        octx = off.getContext("2d"); img = octx.createImageData(cols, rows);
        for (let i = 0; i < cols * rows; i++) img.data.set([18, 90, 118, 255], i * 4); // 端のマスも水の色に
      },
      frame(ctx, dt, t, power) {
        // 雨粒のような自然な波紋
        acc += dt * power * .5;
        while (acc > 1) { acc -= 1; drop(rand(0, w), rand(0, h), rand(200, 400)); }

        // 1ステップ進める
        for (let y = 1; y < rows - 1; y++) {
          for (let x = 1; x < cols - 1; x++) {
            const i = y * cols + x;
            prev[i] = ((cur[i - 1] + cur[i + 1] + cur[i - cols] + cur[i + cols]) / 2 - prev[i]) * .975;
          }
        }
        [cur, prev] = [prev, cur];

        // 傾きを明るさにして色を塗る
        const d = img.data;
        for (let y = 1; y < rows - 1; y++) {
          for (let x = 1; x < cols - 1; x++) {
            const i = y * cols + x, p = i * 4;
            const light = (cur[i - 1] - cur[i + 1] + cur[i - cols] - cur[i + cols]) * .35;
            d[p] = 18 + light; d[p + 1] = 78 + y / rows * 30 + light; d[p + 2] = 118 + light; d[p + 3] = 255;
          }
        }
        octx.putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(off, 0, 0, w, h);
      },
      pointer(x, y, kind) { if (kind !== "move") drop(x, y, kind === "down" ? 700 : 300); }
    };
  }
});
