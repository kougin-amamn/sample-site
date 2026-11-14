/* ユニバーサルデザイン アイコン集の画面。data/icons.json の一覧を分類ごとに並べ、svg/*.svg を読み込んでページに埋め込む。
   埋め込むのは、色(currentColor)と線の太さを CSS で変えられるようにするため */
(function () {
  'use strict';
  var listEl = document.getElementById('list'),
    statusEl = document.getElementById('status'),
    catsEl = document.getElementById('cats'),
    qEl = document.getElementById('q'),
    sizeEl = document.getElementById('size'),
    strokeEl = document.getElementById('stroke'),
    strokeOut = document.getElementById('strokeOut'),
    colorEl = document.getElementById('color'),
    dlg = document.getElementById('detail'),
    root = document.documentElement,
    icons = [],
    svgText = {},
    current = null;

  /* 暗い配色の時は、最初のアイコンの色を明るくして背景に埋もれないようにする */
  if (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) colorEl.value = '#e6ebf5';

  function applyVars() {
    root.style.setProperty('--size', sizeEl.value + 'px');
    root.style.setProperty('--stroke', strokeEl.value);
    root.style.setProperty('--icon', colorEl.value);
    strokeOut.textContent = strokeEl.value;
  }

  function iconEl(id) {
    var span = document.createElement('span');
    span.className = 'icon';
    span.setAttribute('aria-hidden', 'true');
    span.innerHTML = svgText[id];
    return span;
  }

  /* 検索は名前・用途・分類・ファイル名のどれかに含まれていれば出す(大文字小文字は区別しない) */
  function matches(ic, q) {
    if (!q) return true;
    return (ic.name + ' ' + ic.desc + ' ' + ic.cat + ' ' + ic.id).toLowerCase().indexOf(q) >= 0;
  }

  function render() {
    var q = qEl.value.trim().toLowerCase(),
      cats = [],
      by = {};
    icons.forEach(function (ic) {
      if (!by[ic.cat]) {
        by[ic.cat] = [];
        cats.push(ic.cat);
      }
      if (matches(ic, q)) by[ic.cat].push(ic);
    });
    listEl.textContent = '';
    catsEl.textContent = '';
    var shown = 0;
    cats.forEach(function (c, n) {
      var items = by[c];
      if (!items.length) return;
      shown += items.length;
      var sec = document.createElement('section'),
        h = document.createElement('h2'),
        cnt = document.createElement('span'),
        ul = document.createElement('ul');
      sec.className = 'cat';
      sec.id = 'cat' + n;
      h.textContent = c;
      cnt.textContent = items.length + '個';
      h.appendChild(cnt);
      ul.className = 'grid';
      items.forEach(function (ic) {
        var li = document.createElement('li'),
          b = document.createElement('button'),
          nm = document.createElement('span'),
          id = document.createElement('span');
        b.type = 'button';
        b.className = 'item';
        b.setAttribute('aria-label', ic.name + '(' + ic.desc + ')');
        nm.className = 'name';
        nm.textContent = ic.name;
        id.className = 'id';
        id.textContent = ic.id;
        b.append(iconEl(ic.id), nm, id);
        b.addEventListener('click', function () {
          open(ic);
        });
        li.appendChild(b);
        ul.appendChild(li);
      });
      sec.append(h, ul);
      listEl.appendChild(sec);

      var a = document.createElement('a'),
        s = document.createElement('span');
      a.href = '#cat' + n;
      a.textContent = c;
      s.textContent = items.length;
      a.appendChild(s);
      catsEl.appendChild(a);
    });
    if (!shown) {
      var p = document.createElement('p');
      p.className = 'empty';
      p.textContent = '「' + qEl.value + '」に当てはまるアイコンはありません。';
      listEl.appendChild(p);
    }
  }

  /* コピー・保存する SVG。今の線の太さを入れ、色は currentColor のまま残す */
  function exportText(ic) {
    return svgText[ic.id].replace('stroke-width="2"', 'stroke-width="' + strokeEl.value + '"');
  }

  function open(ic) {
    current = ic;
    document.getElementById('dCat').textContent = ic.cat;
    document.getElementById('dName').textContent = ic.name;
    document.getElementById('dDesc').textContent = ic.desc;
    document.getElementById('dFile').textContent = 'svg/' + ic.id + '.svg';
    document.getElementById('dCode').textContent = exportText(ic);
    ['dBig', 'd16', 'd24', 'd48', 'dDark'].forEach(function (k) {
      var box = document.getElementById(k),
        el = iconEl(ic.id),
        px = { dBig: 150, d16: 16, d24: 24, d48: 48, dDark: 32 }[k],
        svg = el.firstElementChild;
      svg.style.width = svg.style.height = px + 'px';
      el.style.width = el.style.height = 'auto';
      box.textContent = '';
      box.appendChild(el);
    });
    if (dlg.showModal) dlg.showModal();
    else dlg.setAttribute('open', '');
  }

  document.getElementById('dCopy').addEventListener('click', function () {
    var b = this;
    navigator.clipboard.writeText(exportText(current)).then(
      function () {
        b.textContent = 'コピーしました';
        setTimeout(function () {
          b.textContent = 'SVG をコピー';
        }, 1500);
      },
      function () {
        b.textContent = 'コピーできませんでした';
      },
    );
  });
  document.getElementById('dSave').addEventListener('click', function () {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([exportText(current)], { type: 'image/svg+xml' }));
    a.download = current.id + '.svg';
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
    }, 1000);
  });

  qEl.addEventListener('input', render);
  [sizeEl, strokeEl, colorEl].forEach(function (el) {
    el.addEventListener('input', applyVars);
  });
  applyVars();

  fetch('data/icons.json')
    .then(function (r) {
      if (!r.ok) throw new Error('icons.json HTTP ' + r.status);
      return r.json();
    })
    .then(function (list) {
      icons = list;
      return Promise.all(
        list.map(function (ic) {
          return fetch('svg/' + ic.id + '.svg')
            .then(function (r) {
              if (!r.ok) throw new Error(ic.id + '.svg HTTP ' + r.status);
              return r.text();
            })
            .then(function (t) {
              svgText[ic.id] = t.trim();
            });
        }),
      );
    })
    .then(function () {
      statusEl.remove();
      render();
    })
    .catch(function (e) {
      statusEl.textContent =
        'アイコンを読み込めませんでした(https で配信したページで開いてください)。' + e.message;
    });
})();
