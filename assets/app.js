/* ══════════════════════════════════════════════════════════
   АйдарЖапан шежіресі

   Сайт открывает не один человек, а вся родня, поэтому первым
   делом он спрашивает: «Сіз кімсіз?». Выбранный человек (ego)
   живёт в localStorage, и от него считается всё остальное —
   лента предков и родство с каждым из 139.

   Кто не выбрал себя, всё равно видит шежіре целиком: лента
   тогда строится по прямой линии, а строки «кем приходится»
   просто нет.
   ══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var DATA    = window.AIDARZHAPAN || { people: [], unions: [] };
  var STORIES = window.AIDARZHAPAN_STORIES || {};
  var PHOTOS  = window.AIDARZHAPAN_PHOTOS || {};
  var KIN     = window.KINSHIP.make(DATA.people, DATA.unions);

  var BY = {};
  DATA.people.forEach(function (p) { BY[p.id] = p; });

  var lang  = localStorage.getItem('az-lang')  || 'kk';
  var theme = localStorage.getItem('az-theme') || 'dark';
  var ego   = localStorage.getItem('az-ego')   || null;
  var egoVia = localStorage.getItem('az-ego-via') || null;   // выбран как супруг
  if (ego && !BY[ego]) { ego = null; egoVia = null; }

  /* ── адрес страницы ─────────────────────────────────
     Сайт расходится по родне ссылками в WhatsApp, поэтому
     понимает два адреса:
       ?p=qoshqar   — открыть карточку человека
       ?me=alpamys  — открыть сайт уже настроенным на человека,
                      чтобы получатель сразу видел родство от себя
     Разобрали — и сразу чистим адрес: дальше историей
     распоряжается сам сайт, слоями. */
  var Q      = new URLSearchParams(location.search);
  var linkP  = Q.get('p');
  var linkMe = Q.get('me');
  if (linkP && !BY[linkP]) linkP = null;
  if (linkMe && BY[linkMe]) {
    ego    = linkMe;
    egoVia = Q.get('via') === '1' ? linkMe : null;
    localStorage.setItem('az-ego', ego);
    if (egoVia) localStorage.setItem('az-ego-via', egoVia);
    else localStorage.removeItem('az-ego-via');
    localStorage.setItem('az-asked', '1');
  } else {
    linkMe = null;
  }
  if (location.search) history.replaceState(null, '', location.pathname);

  /* ── тексты интерфейса ──────────────────────────────── */
  var T = {
    brand:   { kk: 'АйдарЖапан', ru: 'АйдарЖапан' },
    kicker:  { kk: 'Адай · Әли · АйдарЖапан', ru: 'Адай · Әли · Айдаржапан' },
    title:   { kk: 'Шежіре', ru: 'Шежіре' },
    surname: { kk: 'АйдарЖапан әулеті', ru: 'Род АйдарЖапан' },
    lede:    { kk: '139 адам, 20 ұрпақ · Адайдан (1435) бүгінге дейін',
               ru: '139 человек, 20 поколений · от Адая (1435) до наших дней' },

    pickCta:   { kk: 'Сіз кімсіз?', ru: 'Кто вы?' },
    pickAgain: { kk: 'Басқа адамды таңдау', ru: 'Выбрать другого' },
    pickTitle: { kk: 'Сіз кімсіз?', ru: 'Кто вы?' },
    pickNote:  { kk: 'Таңдаңыз — сонда әркімнің сізге кім болатыны көрінеді. ' +
                     'Шежіреде жоқ болсаңыз (келін, күйеу бала), жұбайыңызды таңдаңыз.',
                 ru: 'Выберите себя — и рядом с каждым появится, кем он вам ' +
                     'приходится. Если вас в шежіре нет (сноха, зять), выберите супруга.' },
    pickSkip:  { kk: 'Кейінірек', ru: 'Позже' },
    hintNone:  { kk: 'Таңдасаңыз, туыстық есептеледі',
                 ru: 'Выберите — и родство посчитается' },
    hintVia:   { kk: '{n} арқылы есептелуде', ru: 'считается через {n}' },
    iamSpouse: { kk: 'жұбайымын', ru: 'я супруг(а)' },
    viaTag:    { kk: 'жұбайы', ru: 'супруг(а)' },
    forSpouse: { kk: '{n} үшін:', ru: 'для {n}:' },

    navTape:   { kk: 'Тізбек', ru: 'Линия' },
    navTree:   { kk: 'Ағаш',   ru: 'Древо' },
    navSearch: { kk: 'Іздеу',  ru: 'Поиск' },
    close:     { kk: 'ЖАБУ',   ru: 'ЗАКРЫТЬ' },

    treeEyebrow: { kk: 'Ағаш', ru: 'Древо' },
    treeTitle:   { kk: 'Барлығы 139 адам', ru: 'Все 139 человек' },
    treeLede:    { kk: 'Ұрпақ бойынша. Кез келген есімді басыңыз',
                   ru: 'По коленам. Нажмите на любое имя' },
    searchEyebrow: { kk: 'Іздеу', ru: 'Поиск' },
    searchTitle:   { kk: 'Есім бойынша', ru: 'По имени' },
    searchHint:    { kk: 'Есімнің басын жазыңыз', ru: 'Наберите начало имени' },
    nothing:       { kk: 'Ештеңе табылмады', ru: 'Ничего не найдено' },

    footAuthor: { kk: 'Шежірені жинақтаған — Досов Алпамыс Орынбасарұлы',
                  ru: 'Шежіре собрал Досов Алпамыс Орынбасарұлы' },
    footNote:   { kk: 'Деректер «АйдарЖапан ШЕЖІРЕСІ» файлынан алынды',
                  ru: 'Данные — из файла «АйдарЖапан ШЕЖІРЕСІ»' },

    era:      { kk: '{r} ғасыр', ru: '{r} век' },
    ata:      { kk: '{n}-ші ата', ru: '{n}-е колено' },
    genLabel: { kk: '{n}-ші ұрпақ', ru: '{n}-е колено' },
    railMe:   { kk: 'Сіз — Адайдан <b>{n}-шы ұрпақ</b>',
                ru: 'Вы — <b>{n}-е колено</b> от Адая' },
    railAny:  { kk: 'Шежіре тізбегі · Адайдан бүгінге',
                ru: 'Линия шежіре · от Адая до наших дней' },
    me:       { kk: 'Сіз', ru: 'Вы' },
    spouseOf: { kk: 'жұбайы {n}', ru: 'супруг(а): {n}' },

    father:   { kk: 'Әкесі', ru: 'Отец' },
    mother:   { kk: 'Анасы', ru: 'Мать' },
    children: { kk: 'Балалары', ru: 'Дети' },
    sibs:     { kk: 'Бауырлары', ru: 'Братья и сёстры' },
    mates:    { kk: 'Жұбайы', ru: 'Супруг(а)' },
    rodLabel: { kk: 'Руы', ru: 'Род' },
    inTape:   { kk: 'Тізбектен көрсету', ru: 'Показать в линии' },
    setMe:    { kk: 'Бұл менмін', ru: 'Это я' },
    noRel:    { kk: 'Өзіңізді таңдаңыз — туыстық шығады',
                ru: 'Выберите себя — появится родство' },
    pathLabel:{ kk: 'Туыстық жолы', ru: 'Путь родства' },

    share:     { kk: 'Бөлісу', ru: 'Поделиться' },
    shareMe:   { kk: '{n} үшін сілтеме — ашқан бойда өзі таңдалып тұрады',
                 ru: 'Ссылка для {n} — откроется уже выбранным' },
    shareCard: { kk: '{n} — АйдарЖапан шежіресі',
                 ru: '{n} — шежіре АйдарЖапан' },
    shareEgo:  { kk: '{n}, мынау сіздің шежіреңіз',
                 ru: '{n}, это ваше шежіре' },
    copied:    { kk: 'Сілтеме көшірілді', ru: 'Ссылка скопирована' },
    openedAs:  { kk: 'Сайт {n} ретінде ашылды · жоғарыдан ауыстыруға болады',
                 ru: 'Сайт открыт как {n} · поменять можно в шапке' }
  };

  function t(key, vars) {
    var s = (T[key] && T[key][lang]) || '';
    if (vars) Object.keys(vars).forEach(function (k) {
      s = s.split('{' + k + '}').join(vars[k]);
    });
    return s;
  }

  /* ── мелочи ─────────────────────────────────────────── */
  var ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
               'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII',
               'XIX', 'XX', 'XXI'];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function century(y) { return y ? Math.floor((y - 1) / 100) + 1 : null; }
  function years(p) {
    if (!p.born && !p.died) return '';
    if (p.born && p.died) return p.born + ' – ' + p.died;
    return String(p.born || p.died);
  }
  function fold(s) {
    return String(s).toLowerCase()
      .replace(/[әа]/g, 'а').replace(/[ғг]/g, 'г').replace(/[қк]/g, 'к')
      .replace(/[ңн]/g, 'н').replace(/[өо]/g, 'о').replace(/[ұүу]/g, 'у')
      .replace(/[hһ]/g, 'х').replace(/[іи]/g, 'и').replace(/[йи]/g, 'и');
  }

  /* ── ссылки и «поделиться» ──────────────────────────── */
  function linkTo(params) {
    var q = Object.keys(params).map(function (k) {
      return k + '=' + encodeURIComponent(params[k]);
    }).join('&');
    return location.origin + location.pathname + (q ? '?' + q : '');
  }

  var toastNode = document.getElementById('toast');
  var toastTimer = null;
  function toast(msg) {
    clearTimeout(toastTimer);
    toastNode.textContent = msg;
    toastNode.hidden = false;
    void toastNode.offsetWidth;
    toastNode.classList.add('is-on');
    toastTimer = setTimeout(function () {
      toastNode.classList.remove('is-on');
      toastTimer = setTimeout(function () { toastNode.hidden = true; }, 320);
    }, 3000);
  }

  /* Телефон делится сам, на большом экране кладём в буфер. */
  function share(url, text) {
    if (navigator.share) {
      navigator.share({ title: t('brand'), text: text, url: url })
        .catch(function () {});
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(
        function () { toast(t('copied')); },
        function () { copyFallback(url); });
      return;
    }
    copyFallback(url);
  }
  function copyFallback(s) {
    var box = el('textarea');
    box.value = s;
    box.style.cssText = 'position:fixed; top:0; left:0; opacity:0';
    document.body.appendChild(box);
    box.select();
    try { document.execCommand('copy'); toast(t('copied')); } catch (e) {}
    document.body.removeChild(box);
  }

  var CHILDREN = {};
  DATA.people.forEach(function (p) {
    [p.parent, p.parent2].forEach(function (par) {
      if (par) (CHILDREN[par] = CHILDREN[par] || []).push(p.id);
    });
  });
  Object.keys(CHILDREN).forEach(function (k) {
    CHILDREN[k] = CHILDREN[k].filter(function (v, i, a) { return a.indexOf(v) === i; })
      .sort(function (a, b) { return (BY[a].born || 9999) - (BY[b].born || 9999); });
  });

  /* Кому есть смысл послать ссылку «это вы».
     «Жив» в шежіре не записано, считаем по годам: свои, а если их
     нет — родителей и супруга. Осталось только колено: живые
     начинаются с шестнадцатого, у пришедших со стороны его нет. */
  function maybeAlive(p) {
    if (p.died) return false;
    if (p.born) return p.born >= 1930;
    var near = [p.parent, p.parent2].concat(
      (KIN.mates[p.id] || []).map(function (m) { return m.id; }));
    for (var i = 0; i < near.length; i++) {
      var k = BY[near[i]];
      if (k && (k.died || (k.born && k.born < 1900))) return false;
    }
    return (p.gen || 99) >= 16;
  }

  /* Родство целевого человека к выбранному. */
  function relOf(id) {
    if (!ego) return null;
    var r = KIN.relate(ego, id);
    if (!r) return null;
    return r;
  }
  function relText(r) {
    if (!r) return '';
    if (r.term) return r.term[lang] || r.term.kk;
    return r.path ? (r.path[lang] || r.path.kk) : '';
  }

  /* ── лента предков ──────────────────────────────────── */
  function chainFor(id) {
    var out = [], seen = {}, p = BY[id];
    while (p && !seen[p.id]) {
      seen[p.id] = 1;
      out.push(p);
      p = p.parent ? BY[p.parent] : null;
    }
    return out.reverse();
  }
  function mainLine() {
    return DATA.people.filter(function (p) { return p.line === 'main'; })
      .sort(function (a, b) { return (a.gen || 0) - (b.gen || 0); });
  }

  var tape = document.getElementById('tape');
  var CHAIN = [];

  function renderTape() {
    CHAIN = ego ? chainFor(ego) : mainLine();
    tape.innerHTML = '';
    var lastEra = null;

    CHAIN.forEach(function (p, i) {
      var c = century(p.born);
      if (c && c !== lastEra) {
        lastEra = c;
        tape.appendChild(el('p', 'era reveal', t('era', { r: ROMAN[c] })));
      }

      var isMe = (p.id === ego);
      var step = el('article', 'step reveal' + (isMe ? ' is-me' : ''));
      step.dataset.name  = p.name;
      step.dataset.era   = lastEra ? t('era', { r: ROMAN[lastEra] }) : '';
      step.dataset.roman = lastEra ? ROMAN[lastEra] : '';
      step.appendChild(el('div', 'step-node', String(i + 1)));

      var card = el('button', 'step-card');
      card.type = 'button';
      card.addEventListener('click', function () { openPerson(p.id); });

      var photo = (PHOTOS[p.id] || [])[0];
      if (photo) {
        var img = el('img', 'step-photo');
        img.src = photo.thumb || photo.src;
        img.alt = p.name;
        img.loading = 'lazy';
        card.appendChild(img);
      }

      card.appendChild(el('h3', 'step-name', esc(p.name)));

      var meta = el('div', 'step-meta');
      meta.appendChild(el('span', 'step-tag',
        isMe ? t('me') : t('ata', { n: i + 1 })));
      var y = years(p);
      if (y) meta.appendChild(el('span', 'step-years', y));
      card.appendChild(meta);

      var story = STORIES[p.id];
      if (story) {
        card.appendChild(el('p', 'step-story', esc(story[lang] || story.kk)));
        if (story.src) card.appendChild(el('p', 'step-src', esc(story.src)));
      }

      step.appendChild(card);
      tape.appendChild(step);
    });
  }

  /* ── список людей ───────────────────────────────────── */
  function personRow(p, withRel) {
    var row = el('button', 'row' + (p.id === ego ? ' is-me' : ''));
    row.type = 'button';
    row.addEventListener('click', function () { openPerson(p.id); });

    var ph = (PHOTOS[p.id] || [])[0];
    var av = el('span', 'row-av' + (ph ? ' has-photo' : ''));
    if (ph) {
      var im = el('img');
      im.src = ph.thumb || ph.src; im.alt = p.name; im.loading = 'lazy';
      av.appendChild(im);
    } else {
      av.textContent = p.name.charAt(0);
    }
    row.appendChild(av);

    var mid = el('span', 'row-mid');
    mid.appendChild(el('span', 'row-name', esc(p.name) +
      (p.alt ? ' <i>(' + esc(p.alt) + ')</i>' : '')));
    var sub = [];
    var y = years(p); if (y) sub.push(esc(y));
    if (p.gen) sub.push(t('genLabel', { n: p.gen }));
    mid.appendChild(el('span', 'row-sub', sub.join(' · ')));
    row.appendChild(mid);

    if (withRel && ego) {
      var r = relOf(p.id);
      var txt = p.id === ego ? t('me') : relText(r);
      if (txt) {
        row.appendChild(el('span', 'row-rel' +
          (r && (r.kind === 'unknown' || r.kind === 'none') ? ' is-dim' : ''),
          esc(txt)));
      }
    }
    return row;
  }

  function renderTree() {
    var host = document.getElementById('treeList');
    host.innerHTML = '';
    var groups = {};
    DATA.people.forEach(function (p) {
      var k = p.gen || 0;
      (groups[k] = groups[k] || []).push(p);
    });
    Object.keys(groups).map(Number).sort(function (a, b) { return a - b; })
      .forEach(function (g) {
        var head = el('div', 'group-head',
          g ? t('genLabel', { n: g }) + ' <span>' + groups[g].length + '</span>'
            : (lang === 'kk' ? 'Ұрпағы белгісіз <span>' + groups[g].length + '</span>'
                             : 'Колено не установлено <span>' + groups[g].length + '</span>'));
        host.appendChild(head);
        groups[g]
          .sort(function (a, b) { return (a.born || 9999) - (b.born || 9999); })
          .forEach(function (p) { host.appendChild(personRow(p, true)); });
      });
  }

  /* ── поиск ──────────────────────────────────────────── */
  function search(q, host, withRel) {
    host.innerHTML = '';
    q = fold(q.trim());
    var found = DATA.people.filter(function (p) {
      return !q || fold(p.name).indexOf(q) === 0 ||
             fold(p.name).indexOf(q) > 0 ||
             (p.alt && fold(p.alt).indexOf(q) >= 0);
    });
    if (!found.length) {
      host.appendChild(el('p', 'empty', t('nothing')));
      return;
    }
    found.sort(function (a, b) {
      var ai = fold(a.name).indexOf(q), bi = fold(b.name).indexOf(q);
      if (ai !== bi) return ai - bi;
      return (a.gen || 99) - (b.gen || 99);
    }).slice(0, 60).forEach(function (p) {
      host.appendChild(personRow(p, withRel));
    });
  }

  /* ── карточка человека ──────────────────────────────── */
  var sheet = document.getElementById('sheet');
  var sheetBody = document.getElementById('sheetBody');

  function chip(id, label) {
    var b = el('button', 'chip');
    b.type = 'button';
    b.innerHTML = esc(BY[id] ? BY[id].name : id) +
      (label ? ' <span>' + esc(label) + '</span>' : '');
    b.addEventListener('click', function () { openPerson(id); });
    return b;
  }
  function chipRow(title, ids) {
    if (!ids || !ids.length) return null;
    var box = el('div', 'chips');
    box.appendChild(el('p', 'chips-title', esc(title)));
    var wrap = el('div', 'chips-wrap');
    ids.forEach(function (id) { if (BY[id]) wrap.appendChild(chip(id)); });
    box.appendChild(wrap);
    return box;
  }

  function openPerson(id) {
    var p = BY[id];
    if (!p) return;
    sheetBody.innerHTML = '';
    sheetBody.scrollTop = 0;

    var gal = PHOTOS[id] || [];
    if (gal.length) {
      var hero = el('img', 'card-photo');
      hero.src = gal[0].src; hero.alt = p.name;
      sheetBody.appendChild(hero);
    }

    sheetBody.appendChild(el('h2', 'card-name', esc(p.name) +
      (p.alt ? ' <i>(' + esc(p.alt) + ')</i>' : '')));

    var meta = [];
    var y = years(p); if (y) meta.push(esc(y));
    if (p.gen) meta.push(t('genLabel', { n: p.gen }));
    if (p.ru && p.ru.length) meta.push(esc(p.ru.join(' · ')));
    sheetBody.appendChild(el('p', 'card-meta', meta.join('  ·  ')));

    /* главное: кем он приходится выбранному */
    if (ego && id !== ego) {
      var r = relOf(id);
      var box = el('div', 'rel' + (r && r.kind === 'unknown' ? ' is-gap' : ''));
      if (egoVia) {
        box.appendChild(el('p', 'rel-via',
          esc(t('forSpouse', { n: BY[egoVia].name }))));
      }
      box.appendChild(el('p', 'rel-term', esc(relText(r))));
      if (r && r.term && r.path) {
        box.appendChild(el('p', 'rel-path', esc(r.path[lang] || r.path.kk)));
      }
      if (r && r.steps && r.steps.length > 1) {
        var chain = el('p', 'rel-chain');
        chain.innerHTML = r.steps.map(function (s, i) {
          return '<span' + (i === 0 ? ' class="is-me"' : '') + '>' +
                 esc(BY[s] ? BY[s].name : s) + '</span>';
        }).join('<i>→</i>');
        box.appendChild(chain);
      }
      sheetBody.appendChild(box);
    } else if (!ego) {
      var ask = el('button', 'rel is-ask', esc(t('noRel')));
      ask.type = 'button';
      ask.addEventListener('click', function () { closeSheet(); openPicker(); });
      sheetBody.appendChild(ask);
    }

    if (p.note) sheetBody.appendChild(el('p', 'card-note', esc(p.note)));
    var story = STORIES[id];
    if (story) sheetBody.appendChild(el('p', 'card-story',
      esc(story[lang] || story.kk)));

    [chipRow(t('father'), p.parent ? [p.parent] : null),
     chipRow(t('mother'), p.parent2 ? [p.parent2] : null),
     chipRow(t('mates'), (KIN.mates[id] || []).map(function (m) { return m.id; })),
     chipRow(t('children'), CHILDREN[id]),
     chipRow(t('sibs'), (CHILDREN[p.parent] || []).filter(function (s) {
       return s !== id;
     }))].forEach(function (n) { if (n) sheetBody.appendChild(n); });

    if (gal.length > 1) {
      var g = el('div', 'gallery');
      gal.slice(1).forEach(function (ph) {
        var im = el('img');
        im.src = ph.thumb || ph.src; im.alt = p.name; im.loading = 'lazy';
        g.appendChild(im);
      });
      sheetBody.appendChild(g);
    }

    var actions = el('div', 'card-actions');
    if (id !== ego) {
      var b = el('button', 'card-act', esc(t('setMe')));
      b.type = 'button';
      b.addEventListener('click', function () { closeSheet(); setEgo(id, null); });
      actions.appendChild(b);
    }
    var sh = el('button', 'card-act', esc(t('share')));
    sh.type = 'button';
    sh.addEventListener('click', function () {
      share(linkTo({ p: id }), t('shareCard', { n: p.name }));
    });
    actions.appendChild(sh);
    sheetBody.appendChild(actions);

    /* Вторая ссылка — «это вы»: получатель откроет сайт уже
       выбранным и увидит родство от себя, ничего не нажимая.
       Предлагаем её тем, кто, судя по записям, жив. */
    if (id !== ego && maybeAlive(p)) {
      var shMe = el('button', 'card-share-me', esc(t('shareMe', { n: p.name })));
      shMe.type = 'button';
      shMe.addEventListener('click', function () {
        share(linkTo({ me: id }), t('shareEgo', { n: p.name }));
      });
      sheetBody.appendChild(shMe);
    }

    openLayer(sheet, '?p=' + encodeURIComponent(id));
  }

  /* ── «Сіз кімсіз?» ──────────────────────────────────── */
  var picker = document.getElementById('picker');
  var pickInput = document.getElementById('pickInput');

  function pickerRow(p) {
    var wrap = el('div', 'pick-row');

    var row = el('button', 'row');
    row.type = 'button';
    row.addEventListener('click', function () { closeLayer(); setEgo(p.id, null); });
    row.appendChild(el('span', 'row-av', esc(p.name.charAt(0))));

    var mid = el('span', 'row-mid');
    mid.appendChild(el('span', 'row-name', esc(p.name)));
    var sub = [];
    var y = years(p); if (y) sub.push(esc(y));
    if (p.parent && BY[p.parent]) sub.push(esc(BY[p.parent].name) +
      (lang === 'kk' ? 'дың баласы' : ' — отец'));
    mid.appendChild(el('span', 'row-sub', sub.join(' · ')));
    row.appendChild(mid);
    wrap.appendChild(row);

    /* Жён и мужей в шежіре почти нет. Кто себя не нашёл — отмечается
       супругом, и родство честно считается от его половины. */
    var alt = el('button', 'pick-alt', esc(t('iamSpouse')));
    alt.type = 'button';
    alt.addEventListener('click', function () { closeLayer(); setEgo(p.id, p.id); });
    wrap.appendChild(alt);

    return wrap;
  }

  function renderPicker(q) {
    var host = document.getElementById('pickList');
    host.innerHTML = '';
    q = fold((q || '').trim());
    var list = DATA.people.filter(function (p) {
      return !q || fold(p.name).indexOf(q) >= 0 ||
             (p.alt && fold(p.alt).indexOf(q) >= 0);
    });
    if (!list.length) { host.appendChild(el('p', 'empty', t('nothing'))); return; }
    list.sort(function (a, b) {
      return (b.gen || 0) - (a.gen || 0) || (a.born || 9999) - (b.born || 9999);
    }).slice(0, 80).forEach(function (p) { host.appendChild(pickerRow(p)); });
  }

  function openPicker() {
    var skip = document.getElementById('pickSkip');
    skip.textContent = t('pickSkip');
    renderPicker(pickInput.value);
    openLayer(picker, location.pathname);
    setTimeout(function () { pickInput.focus(); }, 120);
  }

  function setEgo(id, via) {
    ego = id; egoVia = via || null;
    localStorage.setItem('az-ego', id);
    if (via) localStorage.setItem('az-ego-via', via);
    else localStorage.removeItem('az-ego-via');
    paint();
    showMeInTape();
  }

  /* Выбор себя должен быть виден. Иначе человек нажал — и, если он
     стоит наверху страницы, на экране будто ничего не произошло. */
  function showMeInTape() {
    if (view !== 'tape') { setView('tape'); }
    var mine = tape.querySelector('.step.is-me');
    if (!mine) return;
    tape.querySelectorAll('.step').forEach(function (s) { s.classList.add('in'); });
    var top = window.scrollY + mine.getBoundingClientRect().top -
              window.innerHeight * 0.42;
    window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
    mine.classList.remove('just-set');
    void mine.offsetWidth;
    mine.classList.add('just-set');
  }

  /* ── слои и системная «назад» ───────────────────────── */
  var layer = null;
  /* Своя запись в истории — ровно одна, и мы про неё знаем.
     Раньше признаком служил history.state, но он меняется не сразу:
     после нескольких открытий-закрытий back() начинал листать
     настоящую историю браузера и уводил со страницы. */
  var pushed = false;
  var navClose = document.getElementById('navClose');

  function openLayer(node, url) {
    if (layer && layer !== node) layer.hidden = true;
    layer = node;
    node.hidden = false;
    document.body.classList.add('locked');
    navClose.hidden = false;
    document.querySelectorAll('.nav-btn').forEach(function (b) { b.hidden = true; });
    /* Карточка живёт по своему адресу — его можно скопировать
       прямо из строки браузера и отправить как есть. */
    if (!pushed) {
      history.pushState({ layer: true }, '', url || null);
      pushed = true;
    } else {
      history.replaceState({ layer: true }, '', url || location.pathname);
    }
  }
  /* Прячем сразу и только потом трогаем историю. Наоборот было
     хрупко: если перерисовка спотыкалась, popstate не приходил
     и слой оставался висеть на экране. */
  function closeLayer() {
    hideLayer();
    if (pushed) { pushed = false; history.back(); }
    else if (location.search) history.replaceState(null, '', location.pathname);
  }
  function hideLayer() {
    if (layer) layer.hidden = true;
    layer = null;
    document.body.classList.remove('locked');
    navClose.hidden = true;
    document.querySelectorAll('.nav-btn').forEach(function (b) { b.hidden = false; });
  }
  function closeSheet() { closeLayer(); }

  /* «Вперёд» возвращает на адрес карточки — открываем её снова,
     не заводя новой записи в истории. */
  window.addEventListener('popstate', function () {
    var back = new URLSearchParams(location.search).get('p');
    if (back && BY[back]) { pushed = true; openPerson(back); return; }
    pushed = false;
    hideLayer();
  });
  document.querySelectorAll('[data-close]').forEach(function (n) {
    n.addEventListener('click', closeLayer);
  });
  navClose.addEventListener('click', closeLayer);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && layer) closeLayer();
  });

  /* ── переключение экранов ───────────────────────────── */
  var view = 'tape';
  function setView(name) {
    view = name;
    ['tape', 'tree', 'search'].forEach(function (v) {
      document.getElementById('view-' + v).hidden = (v !== name);
    });
    document.querySelectorAll('.nav-btn').forEach(function (b) {
      b.classList.toggle('is-on', b.dataset.view === name);
    });
    window.scrollTo(0, 0);
    if (name === 'tree') renderTree();
    if (name === 'search') {
      search(document.getElementById('searchInput').value,
             document.getElementById('searchList'), true);
      setTimeout(function () { document.getElementById('searchInput').focus(); }, 100);
    }
  }
  document.querySelectorAll('.nav-btn').forEach(function (b) {
    b.addEventListener('click', function () { setView(b.dataset.view); });
  });

  document.getElementById('searchInput').addEventListener('input', function () {
    search(this.value, document.getElementById('searchList'), true);
  });
  pickInput.addEventListener('input', function () { renderPicker(this.value); });
  document.getElementById('meBtn').addEventListener('click', openPicker);
  document.getElementById('heroPick').addEventListener('click', openPicker);

  /* ── прокрутка ленты ────────────────────────────────── */
  var railNow = document.getElementById('railNow');
  var railProgress = document.getElementById('railProgress');
  var ticking = false;

  function onScroll() {
    if (view !== 'tape' || ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var box = tape.getBoundingClientRect();
      var anchor = window.innerHeight * 0.42;
      var done = Math.min(Math.max(anchor - box.top, 0), box.height);
      var ratio = box.height ? done / box.height : 0;

      tape.style.setProperty('--thread', (ratio * 100).toFixed(2) + '%');
      railProgress.style.width = (ratio * 100).toFixed(2) + '%';

      var steps = tape.querySelectorAll('.step'), cur = null;
      for (var i = 0; i < steps.length; i++) {
        if (steps[i].getBoundingClientRect().top <= anchor) cur = steps[i];
      }
      var short = cur ? cur.dataset.roman : '';
      var long  = cur ? (cur.dataset.era + ' · ' + cur.dataset.name) : '';
      if (railNow.dataset.long !== long) {
        railNow.dataset.long = long;
        railNow.innerHTML = '<span class="now-short">' + esc(short) +
                            '</span><span class="now-long">' + esc(long) + '</span>';
      }
    });
  }

  /* ── появление карточек ─────────────────────────────── */
  var io = null;
  function observeAll() {
    if (io) io.disconnect();
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    document.querySelectorAll('.reveal, .orn').forEach(function (n) { io.observe(n); });
  }

  /* ── перерисовка ────────────────────────────────────── */
  function paint() {
    document.documentElement.dataset.lang = lang;
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach(function (n) {
      n.textContent = t(n.dataset.i18n);
    });
    document.querySelectorAll('[data-lang-set]').forEach(function (b) {
      b.classList.toggle('is-on', b.dataset.langSet === lang);
    });

    document.getElementById('searchInput').placeholder = t('searchHint');
    pickInput.placeholder = t('searchHint');

    var meLabel = document.getElementById('meLabel');
    meLabel.textContent = !ego ? t('pickCta')
      : BY[ego].name + (egoVia ? ' · ' + t('viaTag') : '');
    document.getElementById('meBtn').classList.toggle('is-set', !!ego);
    document.getElementById('heroPick').textContent =
      ego ? t('pickAgain') : t('pickCta');
    document.getElementById('heroHint').textContent =
      ego ? (egoVia ? t('hintVia', { n: BY[egoVia].name }) : '') : t('hintNone');

    renderTape();
    document.getElementById('railMain').innerHTML =
      ego ? t('railMe', { n: CHAIN.length }) : t('railAny');

    if (view === 'tree') renderTree();
    if (view === 'search') search(document.getElementById('searchInput').value,
                                  document.getElementById('searchList'), true);
    observeAll();
    onScroll();
  }

  document.querySelectorAll('[data-lang-set]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (lang === b.dataset.langSet) return;
      lang = b.dataset.langSet;
      localStorage.setItem('az-lang', lang);
      paint();
    });
  });

  function applyTheme() {
    document.documentElement.dataset.theme = theme;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0C1418' : '#F7F1E5');
  }
  document.getElementById('themeBtn').addEventListener('click', function () {
    theme = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('az-theme', theme);
    applyTheme();
  });

  /* ── старт ──────────────────────────────────────────── */
  applyTheme();
  paint();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  /* Пришёл по ссылке — показываем то, ради чего её прислали.
     Иначе, если человек здесь впервые, спрашиваем, кто он. */
  if (linkMe) toast(t('openedAs', { n: BY[linkMe].name }));
  if (linkP) {
    openPerson(linkP);
  } else if (!ego && !localStorage.getItem('az-asked')) {
    localStorage.setItem('az-asked', '1');
    setTimeout(openPicker, 700);
  }
})();
