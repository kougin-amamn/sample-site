/* サンプル一覧。samples.json を読み、サンプルごとにカードを作る */
(function () {
  'use strict';
  const list = document.getElementById('list');
  const status = document.getElementById('status');

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function card(s) {
    const a = el('a', 'card');
    a.href = s.href || s.slug + '/';
    const thumbs = el('div', 'thumbs' + ((s.thumbs || []).length === 1 ? ' one' : ''));
    (s.thumbs || []).slice(0, 4).forEach((src) => {
      const img = el('img');
      img.src = src;
      img.alt = '';
      img.loading = 'lazy';
      thumbs.appendChild(img);
    });
    const body = el('div', 'body');
    body.append(el('h2', 'title', s.title), el('p', 'desc', s.desc || ''));
    if (s.tags && s.tags.length) {
      const tags = el('div', 'tags');
      s.tags.forEach((t) => tags.appendChild(el('span', '', t)));
      body.appendChild(tags);
    }
    a.append(thumbs, body);
    const li = el('li');
    li.appendChild(a);
    return li;
  }

  fetch('samples.json')
    .then((r) => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then((samples) => {
      samples.forEach((s) => list.appendChild(card(s)));
      status.hidden = true;
    })
    .catch(() => {
      status.textContent = 'サンプルの一覧（samples.json）を読み込めませんでした。https で配信したページで開いてください。';
      status.classList.add('error');
    });
})();
