/* SVG 国旗帳。flags.json の一覧を読み、svg フォルダの国旗を地域ごとに並べる */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  let flags = [];
  let current = 'すべて';

  function card(f) {
    const li = document.createElement('li');
    const box = document.createElement('div');
    const img = document.createElement('img');
    box.className = 'flag-box';
    img.src = 'svg/' + f.code + '.svg';
    img.alt = f.name + 'の国旗';
    img.loading = 'lazy';
    box.appendChild(img);

    const name = document.createElement('p');
    name.className = 'name';
    name.textContent = f.name;
    const en = document.createElement('p');
    en.className = 'en';
    en.textContent = f.en;
    const meta = document.createElement('div');
    meta.className = 'meta';
    for (const t of [f.code.toUpperCase(), '縦横比 ' + f.ratio]) {
      const s = document.createElement('span');
      s.textContent = t;
      meta.appendChild(s);
    }
    const div = document.createElement('div');
    div.className = 'card';
    div.append(box, name, en, meta);
    if (f.note) {
      const n = document.createElement('p');
      n.className = 'note';
      n.textContent = '※ ' + f.note;
      div.appendChild(n);
    }
    li.appendChild(div);
    return li;
  }

  /* 地域は flags.json に出てきた順に並べる */
  function regions() {
    return [...new Set(flags.map((f) => f.region))];
  }

  function render() {
    const list = $('list');
    list.textContent = '';
    for (const r of regions()) {
      if (current !== 'すべて' && current !== r) continue;
      const items = flags.filter((f) => f.region === r);
      const sec = document.createElement('section');
      sec.className = 'region';
      const h = document.createElement('h2');
      h.textContent = r;
      const n = document.createElement('span');
      n.textContent = items.length + '件';
      h.appendChild(n);
      const ul = document.createElement('ul');
      ul.className = 'grid';
      items.forEach((f) => ul.appendChild(card(f)));
      sec.append(h, ul);
      list.appendChild(sec);
    }
    $('filters').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.region === current)));
  }

  function buildFilters() {
    const box = $('filters');
    for (const r of ['すべて', ...regions()]) {
      const b = document.createElement('button');
      b.dataset.region = r;
      b.textContent = r;
      const n = document.createElement('span');
      n.textContent = r === 'すべて' ? flags.length : flags.filter((f) => f.region === r).length;
      b.appendChild(n);
      b.addEventListener('click', () => {
        current = r;
        render();
      });
      box.appendChild(b);
    }
  }

  fetch('flags.json')
    .then((r) => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then((list) => {
      flags = list;
      $('status').hidden = true;
      buildFilters();
      render();
    })
    .catch(() => {
      $('status').textContent = '国旗の一覧（flags.json）を読み込めませんでした。https で配信したページで開いてください。';
      $('status').classList.add('error');
    });
})();
