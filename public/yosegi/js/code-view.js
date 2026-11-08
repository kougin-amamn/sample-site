/* 「コードを見る」欄。選んだ模様の形のコード(patterns.js)と木目のコード(Canvas は wood.js、SVG は生成したフィルタ)を表示する。
   ソースは js/*.js をそのまま読み込むので、表示されるのは実際に動いているコード */
(function () {
  'use strict';
  var box = document.getElementById('code'),
    pre = document.getElementById('codeText'),
    tabs = document.getElementById('codeTabs'),
    copyBtn = document.getElementById('codeCopy'),
    fileEl = document.getElementById('codeFile'),
    src = {},
    cur = { id: null, mode: 'canvas', tab: 'shape' };

  function load(name) {
    if (!src[name])
      src[name] = fetch('js/' + name).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      });
    return src[name];
  }

  /* marker の行から、インデント2の閉じ括弧までを切り出す。直前のコメントも含める */
  function block(text, marker) {
    var s = text.indexOf(marker);
    if (s < 0) return '';
    s = text.lastIndexOf('\n', s) + 1;
    /* 直前の行がインデント2のコメントで終わっていれば、その最後のコメントだけを含める */
    var before = text.slice(0, s),
      c = before.lastIndexOf('\n  /*') + 1,
      cand = before.slice(c);
    if (c > 0 && /\*\/\n$/.test(cand) && cand.indexOf('*/') === cand.length - 3) s = c;
    var e = text.indexOf('\n  }', s);
    e = text.indexOf('\n', e + 1);
    return text
      .slice(s, e < 0 ? undefined : e)
      .replace(/^ {2}/gm, '')
      .trim();
  }

  /* SVG のフィルタは1行で作っているので、要素ごとに改行と字下げを入れて読めるようにする */
  function pretty(xml) {
    var depth = 0;
    return xml
      .replace(/<(\w+)([^>]*)><\/\1>/g, '<$1$2/>')
      .replace(/></g, '>\n<')
      .split('\n')
      .map(function (line) {
        if (/^<\//.test(line)) depth--;
        var out = '  '.repeat(Math.max(0, depth)) + line;
        if (/^<[^/!][^>]*[^/]>$/.test(line) && !/<\//.test(line)) depth++;
        return out;
      })
      .join('\n');
  }

  function render() {
    if (box.hidden || !box.open || !cur.id) return;
    var p;
    if (cur.tab === 'shape') {
      fileEl.textContent = 'js/patterns.js';
      p = load('patterns.js').then(function (t) {
        return block(t, 'P.' + cur.id + ' = {');
      });
    } else if (cur.mode === 'svg') {
      fileEl.textContent = 'SVG の <defs>(js/svg.js が生成)';
      var svg = document.getElementById('stageSvg'),
        f = svg.querySelector('filter'),
        pat = f && svg.querySelector('pattern[id="wood-' + f.id.replace('grain-', '') + '"]'),
        rot = pat && svg.querySelector('pattern[href="#' + pat.id + '"]');
      p = Promise.resolve(
        f
          ? '<!-- 木目のフィルタ(樹種ごとに1つ) -->\n' +
              pretty(f.outerHTML) +
              '\n\n<!-- フィルタをかけた正方形を敷き詰める -->\n' +
              pretty(pat.outerHTML) +
              '\n\n<!-- 木片ごとの角度は、上の pattern を回して使う -->\n' +
              (rot ? pretty(rot.outerHTML) : '')
          : '',
      );
    } else {
      fileEl.textContent = 'js/wood.js';
      p = load('wood.js').then(function (t) {
        return block(t, 'function makeTexture(');
      });
    }
    p.then(
      function (code) {
        pre.textContent = code;
      },
      function (e) {
        pre.textContent = 'コードを読み込めませんでした(' + e.message + ')';
      },
    );
  }

  tabs.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    cur.tab = b.dataset.tab;
    Array.prototype.forEach.call(tabs.children, function (x) {
      x.setAttribute('aria-pressed', String(x === b));
    });
    render();
  });
  box.addEventListener('toggle', render);
  copyBtn.addEventListener('click', function () {
    navigator.clipboard.writeText(pre.textContent).then(
      function () {
        copyBtn.textContent = 'コピーしました';
        setTimeout(function () {
          copyBtn.textContent = 'コピー';
        }, 1500);
      },
      function () {
        copyBtn.textContent = 'コピーできませんでした';
      },
    );
  });

  window.YosegiCode = {
    show: function (id, mode) {
      cur.id = id;
      cur.mode = mode;
      render();
    },
  };
})();
