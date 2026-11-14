/* ユニバーサルデザイン 天気アイコン集の画面。data/icons.json の一覧を分類ごとに並べ、svg/*.svg を読み込んでページに埋め込む。
   data/forecast-sample.json(架空の週間予報)で使い方の例も表示する。
   アイコンはセットごとに別ファイル(svg/mono・svg/tv・svg/flat)で、選んだセットを初めて表示する時に読み込む。
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
    setEl = document.getElementById('set'),
    dlg = document.getElementById('detail'),
    root = document.documentElement,
    icons = [],
    svgCache = {},
    days = [],
    current = null;

  /* 暗い配色の時は、最初のアイコンの色を明るくして背景に埋もれないようにする */
  if (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) colorEl.value = '#e6ebf5';

  function applyVars() {
    root.style.setProperty('--size', sizeEl.value + 'px');
    root.style.setProperty('--stroke', strokeEl.value);
    root.style.setProperty('--icon', colorEl.value);
    /* 色を選べるのはモノトーンだけ。テレビ風は線の太さを部品ごとに決めているので太さも変えない */
    colorEl.disabled = setEl.value !== 'mono';
    strokeEl.disabled = setEl.value === 'tv';
    strokeOut.textContent = strokeEl.value;
  }

  function iconEl(id) {
    var span = document.createElement('span');
    span.className = 'icon';
    span.setAttribute('aria-hidden', 'true');
    span.innerHTML = svgCache[setEl.value][id];
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

  /* コピー・保存する SVG。モノトーンとフラットは今の線の太さを入れる。色はファイルに書いてあるとおり */
  function exportText(ic) {
    var t = svgCache[setEl.value][ic.id];
    return setEl.value === 'tv' ? t : t.replace('stroke-width="2"', 'stroke-width="' + strokeEl.value + '"');
  }

  function open(ic) {
    current = ic;
    document.getElementById('dCat').textContent = ic.cat;
    document.getElementById('dName').textContent = ic.name;
    document.getElementById('dDesc').textContent = ic.desc;
    document.getElementById('dFile').textContent = 'svg/' + setEl.value + '/' + ic.id + '.svg';
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

  /* 週間予報の例。アイコンは飾りにして(aria-hidden)、天気は文字で読めるようにする */
  function week() {
    var ol = document.getElementById('week');
    ol.textContent = '';
    days.forEach(function (d) {
      var li = document.createElement('li');
      li.innerHTML =
        '<span class="day"></span><span class="tx"></span><span class="temp"><b></b> / <span></span></span><span class="pop"></span>';
      li.querySelector('.day').textContent = d.day;
      var sm = document.createElement('small');
      sm.textContent = d.date;
      li.querySelector('.day').appendChild(sm);
      li.insertBefore(iconEl(d.icon), li.querySelector('.tx'));
      li.querySelector('.tx').textContent = d.text;
      li.querySelector('.temp b').textContent = d.hi + '℃';
      li.querySelector('.temp span').textContent = d.lo + '℃';
      li.querySelector('.pop').textContent = '降水確率 ' + d.pop + '%';
      li.setAttribute(
        'aria-label',
        d.day +
          '曜日 ' +
          d.date +
          ' ' +
          d.text +
          ' 最高' +
          d.hi +
          '度 最低' +
          d.lo +
          '度 降水確率' +
          d.pop +
          'パーセント',
      );
      ol.appendChild(li);
    });
  }

  function loadSet(name) {
    if (svgCache[name]) return Promise.resolve();
    var box = {};
    return Promise.all(
      icons.map(function (ic) {
        return fetch('svg/' + name + '/' + ic.id + '.svg')
          .then(function (r) {
            if (!r.ok) throw new Error(name + '/' + ic.id + '.svg HTTP ' + r.status);
            return r.text();
          })
          .then(function (t) {
            box[ic.id] = t.trim();
          });
      }),
    ).then(function () {
      svgCache[name] = box;
    });
  }

  qEl.addEventListener('input', render);
  [sizeEl, strokeEl, colorEl].forEach(function (el) {
    el.addEventListener('input', applyVars);
  });
  setEl.addEventListener('change', function () {
    loadSet(setEl.value).then(function () {
      applyVars();
      render();
      week();
    });
  });
  applyVars();

  fetch('data/icons.json')
    .then(function (r) {
      if (!r.ok) throw new Error('icons.json HTTP ' + r.status);
      return r.json();
    })
    .then(function (list) {
      icons = list;
      return Promise.all([
        loadSet(setEl.value),
        fetch('data/forecast-sample.json').then(function (r) {
          if (!r.ok) throw new Error('forecast-sample.json HTTP ' + r.status);
          return r.json();
        }),
      ]);
    })
    .then(function (res) {
      days = res[1];
      statusEl.remove();
      render();
      week();
    })
    .catch(function (e) {
      statusEl.textContent =
        'アイコンを読み込めませんでした(https で配信したページで開いてください)。' + e.message;
    });
})();
