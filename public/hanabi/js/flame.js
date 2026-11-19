/* 炎色反応の炎を Canvas で動かす部品。FlameView(canvas) で作り、setColor('#RRGGBB') で炎の色を変える。
   ガスバーナーの青い炎に、白金線につけた金属の色が広がる様子を、光の粒を足し算(lighter)で重ねて描く */
(function () {
  'use strict';
  function rgb(hex) {
    return [1, 3, 5].map(function (i) {
      return parseInt(hex.substr(i, 2), 16);
    });
  }
  /* 中心が明るく外が透明な丸。粒ごとにグラデーションを作ると重いので、色ごとに1枚だけ作って使い回す */
  function sprite(c, core) {
    var s = document.createElement('canvas'),
      g = s.getContext('2d'),
      gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    s.width = s.height = 64;
    gr.addColorStop(0, 'rgba(' + c.join(',') + ',' + core + ')');
    gr.addColorStop(0.4, 'rgba(' + c.join(',') + ',' + core * 0.45 + ')');
    gr.addColorStop(1, 'rgba(' + c.join(',') + ',0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    return s;
  }

  window.FlameView = function (cv) {
    var W = 180,
      H = 250,
      dpr = Math.min(2, window.devicePixelRatio || 1),
      g = cv.getContext('2d'),
      CX = W / 2,
      NY = H - 70,
      parts = [],
      now = [90, 140, 255],
      goal = now.slice(),
      spr = sprite(now, 1),
      hot = sprite(now, 1),
      blue = sprite([70, 120, 255], 1),
      t = 0,
      visible = true,
      raf = 0,
      still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    cv.width = W * dpr;
    cv.height = H * dpr;
    cv.style.width = W + 'px';
    cv.style.height = H + 'px';
    g.scale(dpr, dpr);

    /* 炎の根元に近いほど白っぽく明るいので、白を混ぜた色も用意する */
    function remake() {
      var c = now.map(Math.round);
      spr = sprite(c, 1);
      hot = sprite(
        c.map(function (v) {
          return Math.round(v + (255 - v) * 0.22);
        }),
        1,
      );
    }
    function spawn() {
      for (var i = 0; i < 9; i++)
        parts.push({
          x: CX + (Math.random() - 0.5) * 14,
          y: NY - 6,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -(1.4 + Math.random() * 1.0),
          s: 26 + Math.random() * 12,
          age: 0,
          life: 42 + Math.random() * 22,
          seed: Math.random() * 6.28,
        });
    }
    function burner() {
      g.globalCompositeOperation = 'source-over';
      var tube = g.createLinearGradient(CX - 11, 0, CX + 11, 0);
      tube.addColorStop(0, '#3a3f4a');
      tube.addColorStop(0.45, '#9aa2b1');
      tube.addColorStop(1, '#2a2e36');
      g.fillStyle = tube;
      g.fillRect(CX - 10, NY + 2, 20, H - NY - 22);
      g.fillStyle = '#262a33';
      g.beginPath();
      g.ellipse(CX, H - 16, 34, 7, 0, 0, Math.PI * 2);
      g.fill();
      /* 白金線: 先の輪を炎のふちに入れて、金属をつけたところ */
      g.strokeStyle = '#8c929c';
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(W, NY - 26);
      g.lineTo(CX + 18, NY - 44);
      g.stroke();
      g.strokeStyle = 'rgba(255,240,220,.9)';
      g.beginPath();
      g.arc(CX + 15, NY - 45, 3, 0, Math.PI * 2);
      g.stroke();
    }
    function step() {
      t++;
      for (var i = 0; i < 3; i++) now[i] += (goal[i] - now[i]) * 0.08;
      if (t % 3 === 0) remake();
      spawn();
      parts = parts.filter(function (p) {
        p.age++;
        /* 中心へ寄せて先を細くし、ゆらぎを足す */
        p.vx += (CX - p.x) * 0.006 + Math.sin(t * 0.12 + p.seed) * 0.06;
        p.x += p.vx;
        p.y += p.vy;
        p.s *= 0.976;
        return p.age < p.life;
      });
    }
    function draw() {
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = '#0d0f15';
      g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'lighter';
      /* 根元の青い内炎 */
      var fl = 1 + Math.sin(t * 0.3) * 0.05;
      g.globalAlpha = 0.55;
      g.drawImage(blue, CX - 13, NY - 34 * fl, 26, 40 * fl);
      parts.forEach(function (p) {
        var a = p.age / p.life;
        g.globalAlpha = Math.max(0, (a < 0.12 ? a / 0.12 : 1 - (a - 0.12) / 0.88) * 0.36);
        var s = p.s * (0.8 + a * 0.4);
        g.drawImage(a < 0.08 ? blue : a < 0.3 ? hot : spr, p.x - s / 2, p.y - s / 2, s, s);
      });
      g.globalAlpha = 1;
      burner();
    }
    function loop() {
      raf = 0;
      step();
      draw();
      if (visible && !still) raf = requestAnimationFrame(loop);
    }
    function settle() {
      for (var i = 0; i < 90; i++) step();
      draw();
    }
    if ('IntersectionObserver' in window)
      new IntersectionObserver(function (e) {
        visible = e[0].isIntersecting;
        if (visible && !raf && !still) loop();
      }).observe(cv);
    if (still) settle();
    else loop();

    return {
      setColor: function (hex) {
        goal = rgb(hex);
        /* 動きを減らす設定の時は、色だけすぐに変えて止まった絵を描き直す */
        if (still) {
          now = goal.slice();
          remake();
          settle();
        }
      },
    };
  };
})();
