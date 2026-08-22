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
    navKin:    { kk: 'Туыс',   ru: 'Родня' },
    navTree:   { kk: 'Ағаш',   ru: 'Древо' },
    navSearch: { kk: 'Іздеу',  ru: 'Поиск' },
    close:     { kk: 'ЖАБУ',   ru: 'ЗАКРЫТЬ' },

    treeEyebrow: { kk: 'Ағаш', ru: 'Древо' },
    treeTitle:   { kk: 'Барлығы 139 адам', ru: 'Все 139 человек' },
    treeLede:    { kk: 'Ұрпақ бойынша. Кез келген есімді басыңыз',
                   ru: 'По коленам. Нажмите на любое имя' },
    kinEyebrow: { kk: 'Туыстар', ru: 'Родня' },
    kinTitle:   { kk: 'Менің туыстарым', ru: 'Мои родственники' },
    kinLede:    { kk: '139 адамның ішінен жақындарыңыз — іздеудің қажеті жоқ',
                  ru: 'Ваши близкие среди 139 — искать не нужно' },
    kinAsk:     { kk: 'Алдымен өзіңізді таңдаңыз', ru: 'Сначала выберите себя' },
    kinFar:     { kk: 'Тағы {n} алыс туыс — «Ағаш» пен «Іздеуден» қараңыз',
                  ru: 'Ещё {n} дальних родственников — смотрите в «Древе» и «Поиске»' },
    kinCount:   { kk: 'Жақын туыс: {n}', ru: 'Близкой родни: {n}' },
    kinNone:    { kk: 'Шежіреде сіздің ата-анаңыз әлі жазылмаған — сондықтан туыстық та есептелмейді',
                  ru: 'В шежіре пока не записан ваш родитель — поэтому и родство не считается' },

    cSpouse:    { kk: 'Жұбайыңыз', ru: 'Супруг(а)' },
    cParents:   { kk: 'Ата-анаңыз', ru: 'Родители' },
    cSibs:      { kk: 'Бауырларыңыз', ru: 'Братья и сёстры' },
    cKids:      { kk: 'Балаларыңыз', ru: 'Дети' },
    cGrandkids: { kk: 'Немере-шөберелеріңіз', ru: 'Внуки и правнуки' },
    cNephews:   { kk: 'Жиендеріңіз', ru: 'Племянники' },
    cNephKids:  { kk: 'Жиендеріңіздің балалары', ru: 'Дети племянников' },
    cGrandpar:  { kk: 'Ата-әжеңіз', ru: 'Дед и бабушка' },
    cUncles:    { kk: 'Әке-шешеңіздің бауырлары', ru: 'Дяди и тёти' },
    cCousins:   { kk: 'Немере ағайындарыңыз', ru: 'Двоюродные' },
    cCousKids:  { kk: 'Немере ағайынның балалары', ru: 'Дети двоюродных' },
    cGrandUnc:  { kk: 'Атаңыздың бауырлары', ru: 'Братья и сёстры деда' },
    cSecond:    { kk: 'Шөбере ағайындарыңыз', ru: 'Троюродные' },
    cInLaw:     { kk: 'Құда-жекжат', ru: 'Родня через брак' },

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

    modeTree:    { kk: 'Сызба', ru: 'Схема' },
    modeList:    { kk: 'Тізім', ru: 'Список' },
    modeGen:     { kk: 'Ұрпақ', ru: 'Колена' },
    branchTitle: { kk: 'Кімнен кім тарайды', ru: 'Кто от кого' },
    treeHintTree:{ kk: 'Сүйреп жылжытыңыз, жақындатыңыз · есімді бассаңыз — сол кісі',
                   ru: 'Тяните и приближайте · нажмите на имя — карточка' },
    treeHintList:{ kk: 'Тармақты ашу үшін санды басыңыз · есімді бассаңыз — сол кісі',
                   ru: 'Нажмите на число — раскроется ветка · на имя — карточка' },
    noKids:      { kk: 'Балалары жазылмаған', ru: 'Дети не записаны' },
    kidsOf:      { kk: '{n} бала', ru: 'детей: {n}' },
    orphanHead:  { kk: 'Ата-анасы жазылмағандар', ru: 'Родитель не записан' },
    mateHead:    { kk: 'Жұбайы арқылы', ru: 'Вошли через брак' },
    mateOf:      { kk: '{n} жұбайы', ru: 'супруг(а): {n}' },
    showBranch:  { kk: 'Тармағын көрсету', ru: 'Показать ветку' },
    sonOf:       { kk: '{n} ұлы', ru: 'отец: {n}' },
    dauOf:       { kk: '{n} қызы', ru: 'отец: {n}' },
    kidOf:       { kk: '{n} баласы', ru: 'отец: {n}' },
    sonOfF:      { kk: '{n} ұлы', ru: 'мать: {n}' },
    dauOfF:      { kk: '{n} қызы', ru: 'мать: {n}' },
    kidOfF:      { kk: '{n} баласы', ru: 'мать: {n}' },
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

  /* Казахский родительный падеж: «Қосанның ұлы», «Ізбасардың қызы»,
     «Айгүлдің баласы». Окончание выбирается по последней букве
     и по последней гласной — иначе подпись читается коряво. */
  function poss(name) {
    var s = String(name).trim();
    var last = s.slice(-1).toLowerCase();
    var vowels = s.toLowerCase().match(/[аәеёиоөуұүыіэюя]/g) || [];
    var soft = /[әеёөүіи]/.test(vowels[vowels.length - 1] || 'а');
    var set;
    if (/[аәеёиоөұүыіэюямнң]/.test(last)) set = ['ның', 'нің'];  // гласные, м, н, ң
    else if (/[йужзлр]/.test(last))       set = ['дың', 'дің'];  // й, у, ж, з, л, р
    else                                  set = ['тың', 'тің'];  // глухие
    return s + set[soft ? 1 : 0];
  }

  /* Чей он сын или дочь — этим и различаются тёзки: два Мансура,
     два Кенжебека, две Сымбат. */
  function parentPhrase(p) {
    var par = p.parent && BY[p.parent];
    if (par) {
      var key = (p.sex === 'm' ? 'sonOf' : p.sex === 'f' ? 'dauOf' : 'kidOf') +
                (par.sex === 'f' ? 'F' : '');
      return t(key, { n: lang === 'kk' ? poss(par.name) : par.name });
    }
    /* Жёны и мужья попали в шежіре не через родителей, а через пару —
       их и называем по паре, иначе строка остаётся немой. */
    var mate = (KIN.mates[p.id] || [])[0];
    if (mate && BY[mate.id]) {
      return t('mateOf', { n: lang === 'kk' ? poss(BY[mate.id].name) : BY[mate.id].name });
    }
    return '';
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
      step.dataset.id    = p.id;
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
  function personRow(p, withRel, withParent) {
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
    if (withParent) {
      var who = parentPhrase(p);
      if (who) sub.push(esc(who));
    }
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

  /* ── ветка: кто от кого ─────────────────────────────
     Список по коленам показывает, кто в каком поколении, но
     одиннадцать сыновей Қосана идут в нём одиннадцатью строками
     подряд без всякой связи между собой.

     Показываем родство так же, как на сайте близкой семьи, чтобы
     родне не пришлось привыкать заново:
       сызба — карточки и линии, тянется пальцем и приближается;
       тізім — то же дерево вертикально, ветки сворачиваются;
       ұрпақ — прежний список всех 139 по коленам.

     Схема на весь род нечитаема — это проверено ещё на прототипе,
     поэтому и схема, и список растут не от Адая, а от выбранного
     человека. Вверх ведёт дорожка над сценой. */
  /* На узком экране схема нечитаема, поэтому по умолчанию список.
     Старое значение из прежней версии сайта не подходит — проверяем. */
  var treeMode = localStorage.getItem('az-tree-mode');
  if (['tree', 'list', 'gen'].indexOf(treeMode) < 0) {
    treeMode = window.innerWidth < 760 ? 'list' : 'tree';
  }
  var focusId  = null;
  var FOLD = {};            /* свёрнутые ветки: id → true/false */
  var crumbsAll = false;

  var ROOT = (DATA.people[0] || {}).id;
  var ORPHANS = DATA.people.filter(function (p) {
    return p.id !== ROOT && (!p.parent || !BY[p.parent]);
  }).map(function (p) { return p.id; });
  /* Вошедшие через брак — не пробел в шежіре, а норма: у жены
     свой род. Пробел — это когда неизвестно вообще ничего. */
  var INLAWS = ORPHANS.filter(function (id) { return (KIN.mates[id] || []).length; });
  var LOST   = ORPHANS.filter(function (id) { return !(KIN.mates[id] || []).length; });

  var SEX_SVG = {
    m: '<svg viewBox="0 0 12 12"><circle cx="4.6" cy="7.4" r="3.1"/>' +
       '<path d="M7.1 4.9 10.4 1.6M8.1 1.6h2.5v2.5"/></svg>',
    f: '<svg viewBox="0 0 12 12"><circle cx="6" cy="4.4" r="3.1"/>' +
       '<path d="M6 7.5v3.5M4.4 9.5h3.2"/></svg>',
    u: '<svg viewBox="0 0 12 12"><circle cx="6" cy="6" r="3.1"/></svg>'
  };
  /* Два кольца — пара. Знак тот же, что на сайте близкой семьи. */
  var KNOT_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<circle class="k" cx="9" cy="12" r="5.4"/>' +
    '<circle class="k" cx="15" cy="12" r="5.4"/></svg>';

  /* Шежіре открывают ради живых, поэтому по умолчанию встаём не
     на Адая, а на отца выбранного: вокруг сразу свои. */
  function focusPerson() {
    if (focusId && BY[focusId]) return focusId;
    if (ego) {
      var p = BY[ego];
      return (p.parent && BY[p.parent]) ? p.parent : ego;
    }
    return ROOT;
  }

  function ancestryOf(id) {
    var out = [], p = BY[id], seen = {};
    while (p && p.parent && BY[p.parent] && !seen[p.parent]) {
      seen[p.parent] = 1;
      out.unshift(BY[p.parent]);
      p = BY[p.parent];
    }
    return out;
  }

  function setFocus(id) {
    if (!BY[id]) return;
    focusId = id;
    FOLD = {}; crumbsAll = false;
    if (treeMode === 'gen') treeMode = 'list';
    localStorage.setItem('az-tree-mode', treeMode);
    if (view !== 'tree') setView('tree');
    else { window.scrollTo(0, 0); renderTree(); }
  }

  function matesOf(id) {
    return (KIN.mates[id] || []).map(function (m) { return m.id; })
      .filter(function (x) { return BY[x]; });
  }
  function kidsOf(id) { return CHILDREN[id] || []; }
  /* Сколько ступеней открыто сразу. В списке две — он дешёвый
     и листается. На схеме одна: два колена сыновей с жёнами дают
     под три тысячи пикселей ширины, и всё сжимается до нечитаемого. */
  function openDepth() { return treeMode === 'tree' ? 1 : 2; }
  function folded(id, depth) {
    return FOLD[id] === undefined ? depth >= openDepth() : FOLD[id];
  }
  /* Строка под именем: кем этот человек приходится выбранному. */
  function roleLine(p) {
    if (!ego) return '';
    if (p.id === ego) return t('me');
    var r = relOf(p.id);
    return (r && r.term) ? relText(r) : '';
  }

  /* Аватар: всегда буква, фото ложится сверху. Не нашлось файла —
     картинка убирает себя, буква снова видна. Значок пола внизу
     справа: фотографий всего две на 139, без него кружки пустые. */
  function avatarHTML(p) {
    var face = (PHOTOS[p.id] || [])[0];
    face = face && (face.thumb || face.src);
    return '<span class="avatar">' +
      '<span class="ini">' + esc(p.name.charAt(0)) + '</span>' +
      (face ? '<img class="ph" alt="" loading="lazy" src="' + esc(face) + '">' : '') +
      '<span class="sex">' + (SEX_SVG[p.sex] || SEX_SVG.u) + '</span>' +
    '</span>';
  }
  function guardPhotos(root) {
    root.querySelectorAll('img.ph').forEach(function (img) {
      img.addEventListener('error', function () { img.remove(); });
    });
  }

  /* ── сызба: карточки и линии ────────────────────────── */
  var stageEl  = document.getElementById('stage');
  var treeRoot = document.getElementById('treeRoot');
  var outline  = document.getElementById('outline');
  var seq = 0;

  function personCard(p) {
    var b = el('button', 'person' + (p.id === ego ? ' is-me' : ''));
    b.type = 'button';
    b.dataset.person = p.id;
    b.dataset.sex = p.sex || 'u';
    b.style.setProperty('--i', seq++);
    var role = roleLine(p), y = years(p);
    b.innerHTML = avatarHTML(p) +
      '<span class="p-name">' + esc(p.name) + '</span>' +
      (role ? '<span class="p-role">' + esc(role) + '</span>' : '') +
      (y ? '<span class="p-year">' + esc(y) + '</span>' : '');
    guardPhotos(b);
    b.addEventListener('click', function () { openPerson(p.id); });
    return b;
  }

  function coupleEl(id) {
    var box = el('div', 'couple');
    box.appendChild(personCard(BY[id]));
    matesOf(id).forEach(function (mid) {
      box.appendChild(el('div', 'knot', KNOT_SVG));
      box.appendChild(personCard(BY[mid]));
    });
    return box;
  }

  /* Кнопка на линии: свёрнуто — «+7», раскрыто — «−». */
  function foldBtn(id, depth, n) {
    var off = folded(id, depth);
    var b = el('button', 'fold' + (off ? ' is-off' : ''), off ? '+' + n : '−');
    b.type = 'button';
    b.setAttribute('aria-label', t('kidsOf', { n: n }));
    b.addEventListener('click', function () { FOLD[id] = !off; renderTree(true); });
    return b;
  }

  function buildNode(id, depth, seen) {
    var node = el('div', 'node');
    node.dataset.person = id;
    node.appendChild(coupleEl(id));

    var kids = kidsOf(id).filter(function (k) { return !seen[k]; });
    if (!kids.length) return node;

    node.appendChild(foldBtn(id, depth, kids.length));
    if (folded(id, depth)) return node;

    var box = el('div', 'kids');
    kids.forEach(function (kid) {
      seen[kid] = 1;
      box.appendChild(buildNode(kid, depth + 1, seen));
    });
    node.appendChild(box);
    return node;
  }

  function renderStage() {
    seq = 0;
    treeRoot.innerHTML = '';
    var seen = {};
    seen[focusPerson()] = 1;
    treeRoot.appendChild(buildNode(focusPerson(), 0, seen));
    lastFitW = -1;
    fitZoom();
    drawLinks();
    /* Шрифты догружаются и меняют ширину карточек — пересчитываем
       ещё раз, когда всё улеглось. */
    setTimeout(function () {
      if (treeMode === 'tree' && view === 'tree') maybeFit(true);
    }, 320);
  }

  /* ── линии между карточками ─────────────────────────── */
  var svg    = document.getElementById('links');
  var canvas = document.getElementById('canvas');
  var zoomer = document.getElementById('zoomer');

  /* Координаты берём из layout, а не из getBoundingClientRect:
     zoomer масштабируется, и rect соврал бы. */
  function box(elm) {
    var x = 0, y = 0, n = elm;
    while (n && n !== zoomer) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return { cx: x + elm.offsetWidth / 2, top: y, bottom: y + elm.offsetHeight };
  }

  function drawLinks() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    treeRoot.querySelectorAll('.node').forEach(function (node) {
      var couple = node.querySelector(':scope > .couple');
      var kids   = node.querySelector(':scope > .kids');
      if (!couple || !kids) return;
      var from = box(couple);
      Array.prototype.forEach.call(kids.children, function (sub) {
        var lead = sub.querySelector('.person');
        if (!lead) return;
        var to  = box(lead);
        var y0  = from.bottom;
        var y1  = to.top;
        var mid = y0 + (y1 - y0) * 0.52;
        var dx  = to.cx - from.cx;
        var r   = Math.min(16, Math.abs(dx) / 2, Math.abs(y1 - y0) / 3);
        var d;
        if (Math.abs(dx) < 2) {
          d = 'M' + from.cx + ' ' + y0 + 'V' + y1;
        } else {
          var sgn = dx > 0 ? 1 : -1;
          d = 'M' + from.cx + ' ' + y0 +
              'V' + (mid - r) +
              'Q' + from.cx + ' ' + mid + ' ' + (from.cx + sgn * r) + ' ' + mid +
              'H' + (to.cx - sgn * r) +
              'Q' + to.cx + ' ' + mid + ' ' + to.cx + ' ' + (mid + r) +
              'V' + y1;
        }
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        svg.appendChild(path);
      });
    });
  }

  /* ── приближение и перетаскивание ───────────────────── */
  var STEPS = [0.35, 0.45, 0.55, 0.7, 0.85, 1];
  var MIN_FIT = 0.35;
  var zoom = 1;
  var viewport = document.getElementById('viewport');
  var zoomLabel = document.getElementById('zoomLabel');
  var lastFitW = -1, fitTimer;

  /* scale() не меняет layout-коробку, поэтому масштабированный
     размер выставляем внешнему .canvas сами — иначе останется
     пустое место и лишняя прокрутка. */
  function syncCanvasBox() {
    canvas.style.width  = Math.round(zoomer.offsetWidth  * zoom) + 'px';
    canvas.style.height = Math.round(zoomer.offsetHeight * zoom) + 'px';
  }
  function setScale() {
    zoomer.style.transform = 'scale(' + zoom + ')';
    zoomLabel.textContent = Math.round(zoom * 100) + '%';
    syncCanvasBox();
    centerScroll();
  }
  function setZoom(z) {
    zoom = Math.max(STEPS[0], Math.min(STEPS[STEPS.length - 1], z));
    setScale();
    setTimeout(drawLinks, 460);
  }
  function centerScroll() {
    [0, 120, 420].forEach(function (ms) {
      setTimeout(function () {
        var maxX = viewport.scrollWidth - viewport.clientWidth;
        if (maxX > 2) viewport.scrollLeft = maxX / 2;
      }, ms);
    });
  }
  function stageCap() {
    var narrow = window.innerWidth < 641;
    return Math.round(Math.max(280,
      Math.min(window.innerHeight * (narrow ? 0.66 : 0.76), 700)));
  }
  /* Влезает по ширине и по высоте, но мельче MIN_FIT не уходим:
     дальше имена уже не прочитать, лучше тянуть пальцем. */
  function fitZoom() {
    var cap = stageCap();
    viewport.style.maxHeight = cap + 'px';
    var cs = getComputedStyle(viewport);
    var padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    var padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    var haveW = viewport.clientWidth - padX - 2;
    var haveH = cap - padY - 2;
    var z = Math.min(1, haveW / zoomer.offsetWidth, haveH / zoomer.offsetHeight);
    zoom = Math.round(Math.max(MIN_FIT, z) * 100) / 100;
    setScale();
  }
  function maybeFit(force) {
    var w = viewport.clientWidth;
    if (!force && Math.abs(w - lastFitW) < 4) return;
    lastFitW = w;
    fitZoom();
    drawLinks();
  }
  if (window.ResizeObserver) {
    new ResizeObserver(function () {
      if (treeMode !== 'tree' || view !== 'tree') return;
      clearTimeout(fitTimer);
      fitTimer = setTimeout(function () { maybeFit(false); }, 90);
    }).observe(viewport);
  }
  document.querySelectorAll('[data-zoom]').forEach(function (b) {
    b.addEventListener('click', function () {
      var dir = parseInt(b.dataset.zoom, 10);
      if (dir === 0) { maybeFit(true); return; }
      var i = 0, best = 1e9;
      STEPS.forEach(function (s, k) {
        var d = Math.abs(s - zoom);
        if (d < best) { best = d; i = k; }
      });
      setZoom(STEPS[Math.max(0, Math.min(STEPS.length - 1, i + dir))]);
    });
  });

  (function pan() {
    var down = false, sx = 0, sy = 0, sl = 0, st = 0;
    viewport.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.person') || e.target.closest('.fold') ||
          e.target.closest('.stage-tools')) return;
      down = true;
      sx = e.clientX; sy = e.clientY;
      sl = viewport.scrollLeft; st = viewport.scrollTop;
      viewport.classList.add('dragging');
      viewport.setPointerCapture(e.pointerId);
    });
    viewport.addEventListener('pointermove', function (e) {
      if (!down) return;
      viewport.scrollLeft = sl - (e.clientX - sx);
      viewport.scrollTop  = st - (e.clientY - sy);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
      viewport.addEventListener(ev, function () {
        down = false;
        viewport.classList.remove('dragging');
      });
    });
  })();

  /* ── тізім: то же дерево вертикально ────────────────── */
  function olChip(p) {
    var b = el('button', 'ol-p' + (p.id === ego ? ' is-me' : ''));
    b.type = 'button';
    b.dataset.person = p.id;
    b.dataset.sex = p.sex || 'u';
    var meta = [];
    var y = years(p); if (y) meta.push(y);
    var role = roleLine(p); if (role) meta.push(role);
    b.innerHTML = avatarHTML(p) +
      '<span class="ol-txt">' +
        '<span class="ol-name">' + esc(p.name) + '</span>' +
        '<span class="ol-meta">' + esc(meta.join(' · ')) + '</span>' +
      '</span>';
    guardPhotos(b);
    b.addEventListener('click', function () { openPerson(p.id); });
    return b;
  }

  function olNode(id, depth, seen) {
    var li = el('li', 'ol-i');
    var row = el('div', 'ol-row');
    var tw = el('button', 'ol-tw');
    tw.type = 'button';
    row.appendChild(tw);

    var couple = el('div', 'ol-couple');
    couple.appendChild(olChip(BY[id]));
    matesOf(id).forEach(function (mid) {
      couple.appendChild(el('span', 'ol-knot', KNOT_SVG));
      couple.appendChild(olChip(BY[mid]));
    });
    row.appendChild(couple);
    li.appendChild(row);

    var kids = kidsOf(id).filter(function (k) { return !seen[k]; });
    if (!kids.length) {
      tw.className = 'ol-tw is-leaf';
      return li;
    }

    var off = folded(id, depth);
    li.classList.toggle('is-folded', off);
    tw.dataset.count = kids.length;
    tw.textContent = off ? String(kids.length) : '';
    tw.setAttribute('aria-label', t('kidsOf', { n: kids.length }));
    tw.addEventListener('click', function () { FOLD[id] = !off; renderTree(true); });

    /* Свёрнутую ветку не строим вовсе: у Адая под ней все 139. */
    if (!off) {
      var ul = el('ul', 'ol-kids');
      kids.forEach(function (kid) {
        seen[kid] = 1;
        ul.appendChild(olNode(kid, depth + 1, seen));
      });
      li.appendChild(ul);
    }
    return li;
  }

  function renderOutline() {
    outline.innerHTML = '';
    var ul = el('ul', 'ol-root');
    var seen = {};
    seen[focusPerson()] = 1;
    ul.appendChild(olNode(focusPerson(), 0, seen));
    outline.appendChild(ul);
  }

  /* Свернуть или развернуть всё сразу — иначе до дальней ветки
     добираешься десятком нажатий. */
  document.getElementById('foldBtn').addEventListener('click', function () {
    /* Сам корень открыт всегда — иначе кнопка залипала бы
       на «свернуть». Смотрим только на ветки под ним. */
    var anyOpen = false;
    (function walk(id, depth, seen) {
      var kids = kidsOf(id).filter(function (k) { return !seen[k]; });
      if (!kids.length) return;
      if (depth > 0 && !folded(id, depth)) anyOpen = true;
      kids.forEach(function (k) { seen[k] = 1; walk(k, depth + 1, seen); });
    })(focusPerson(), 0, {});

    var mark = {};
    (function walk(id, seen) {
      var kids = kidsOf(id).filter(function (k) { return !seen[k]; });
      if (!kids.length) return;
      mark[id] = anyOpen;
      kids.forEach(function (k) { seen[k] = 1; walk(k, seen); });
    })(focusPerson(), {});
    FOLD = mark;
    FOLD[focusPerson()] = false;                /* корень оставляем открытым */
    renderTree(true);
  });

  /* ── дорожка вверх ──────────────────────────────────── */
  function renderCrumbs() {
    var host = document.getElementById('crumbs');
    host.innerHTML = '';
    if (treeMode === 'gen') { host.hidden = true; return; }
    host.hidden = false;

    /* Путь от Адая — двадцать имён, на телефоне это четыре строки
       над самой веткой. Показываем начало и двух последних,
       остальные — по нажатию на многоточие. */
    var line = ancestryOf(focusPerson());
    var show = (!crumbsAll && line.length > 4)
      ? [line[0], null].concat(line.slice(-2)) : line;
    show.forEach(function (a) {
      if (!a) {
        var dots = el('button', 'crumb is-dots', '…');
        dots.type = 'button';
        dots.addEventListener('click', function () { crumbsAll = true; renderTree(true); });
        host.appendChild(dots);
        return;
      }
      var c = el('button', 'crumb', esc(a.name));
      c.type = 'button';
      c.addEventListener('click', function () { setFocus(a.id); });
      host.appendChild(c);
    });
    var here = el('span', 'crumb is-here', esc(BY[focusPerson()].name));
    host.appendChild(here);
  }

  /* ── переключение и отрисовка ───────────────────────── */
  function renderTree(keep) {
    var y = window.scrollY;
    var host = document.getElementById('treeList');
    host.innerHTML = '';

    document.getElementById('treeTitle').textContent =
      treeMode === 'gen' ? t('treeTitle') : t('branchTitle');
    document.getElementById('treeLede').textContent =
      treeMode === 'tree' ? t('treeHintTree')
      : treeMode === 'list' ? t('treeHintList') : t('treeLede');
    document.querySelectorAll('[data-tree-mode]').forEach(function (b) {
      b.classList.toggle('is-on', b.dataset.treeMode === treeMode);
      b.textContent = t(b.dataset.treeMode === 'tree' ? 'modeTree'
                      : b.dataset.treeMode === 'list' ? 'modeList' : 'modeGen');
    });

    stageEl.dataset.mode = treeMode;
    stageEl.hidden = (treeMode === 'gen');
    renderCrumbs();

    if (treeMode === 'tree') renderStage();
    else if (treeMode === 'list') renderOutline();
    else renderGenList(host);

    /* От Адая ветка доходит не до всех: у части родителя нет,
       часть вошла через брак. Прятать их нельзя — родня та же. */
    if (treeMode !== 'gen' && focusPerson() === ROOT) {
      [[t('mateHead'), INLAWS], [t('orphanHead'), LOST]].forEach(function (pair) {
        if (!pair[1].length) return;
        host.appendChild(el('div', 'group-head',
          esc(pair[0]) + ' <span>' + pair[1].length + '</span>'));
        pair[1].forEach(function (o) {
          host.appendChild(personRow(BY[o], true, true));
        });
      });
    }

    if (keep) window.scrollTo(0, y);
  }

  function renderGenList(host) {
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

  /* ── менің туыстарым ────────────────────────────────
     Шежіре открывают не ради Адая, а чтобы посмотреть на живых.
     Чтобы найти двоюродного брата, надо было либо листать 139
     строк, либо помнить, как его зовут. Здесь родня разложена
     по родству: считаем его для всех сразу и раскладываем по
     полкам — «кто мне кто» словами, а не деревом. */
  function isBlood(r, up, down, downMax) {
    if (!r || r.kind !== 'blood') return false;
    if (r.up !== up) return false;
    return downMax === undefined ? r.down === down
                                 : (r.down >= down && r.down <= downMax);
  }
  var CIRCLES = [
    ['cSpouse',   function (r) { return r.kind === 'spouse-own'; }],
    ['cParents',  function (r) { return isBlood(r, 1, 0); }],
    ['cSibs',     function (r) { return isBlood(r, 1, 1); }],
    ['cKids',     function (r) { return isBlood(r, 0, 1); }],
    ['cGrandkids',function (r) { return isBlood(r, 0, 2, 9); }],
    ['cNephews',  function (r) { return isBlood(r, 1, 2); }],
    ['cNephKids', function (r) { return isBlood(r, 1, 3, 9); }],
    ['cGrandpar', function (r) { return isBlood(r, 2, 0) || isBlood(r, 3, 0); }],
    ['cUncles',   function (r) { return isBlood(r, 2, 1); }],
    ['cCousins',  function (r) { return isBlood(r, 2, 2); }],
    ['cCousKids', function (r) { return isBlood(r, 2, 3, 9); }],
    ['cGrandUnc', function (r) { return isBlood(r, 3, 1); }],
    ['cSecond',   function (r) { return isBlood(r, 3, 2, 9); }],
    ['cInLaw',    function (r) { return r.kind === 'in-law' || r.kind === 'spouse'; }]
  ];

  function renderKin() {
    var host = document.getElementById('kinList');
    host.innerHTML = '';
    document.getElementById('kinHint').textContent = '';

    if (!ego) {
      var ask = el('button', 'cta', esc(t('kinAsk')));
      ask.type = 'button';
      ask.addEventListener('click', openPicker);
      var wrap = el('div', 'kin-empty');
      wrap.appendChild(ask);
      host.appendChild(wrap);
      return;
    }

    var groups = {}, far = 0, near = 0;
    DATA.people.forEach(function (p) {
      if (p.id === ego) return;
      var r = KIN.relate(ego, p.id);
      if (!r) return;
      for (var i = 0; i < CIRCLES.length; i++) {
        if (CIRCLES[i][1](r)) {
          (groups[CIRCLES[i][0]] = groups[CIRCLES[i][0]] || []).push(p);
          near++;
          return;
        }
      }
      if (r.kind === 'blood') far++;
    });

    /* Кто выбрал себя как супруга, видит родню своей половины —
       и должен об этом помнить, иначе «ваша мать» собьёт с толку. */
    document.getElementById('kinHint').textContent = egoVia
      ? t('forSpouse', { n: BY[egoVia].name }) + ' ' + t('kinCount', { n: near })
      : t('kinCount', { n: near });

    CIRCLES.forEach(function (c) {
      var list = groups[c[0]];
      if (!list || !list.length) return;
      host.appendChild(el('div', 'group-head',
        esc(t(c[0])) + ' <span>' + list.length + '</span>'));
      list.sort(function (a, b) { return (a.born || 9999) - (b.born || 9999); })
        .forEach(function (p) { host.appendChild(personRow(p, true, true)); });
    });

    /* У семнадцати человек родитель не записан. Если себя выбрал
       как раз такой, экран был бы пустым — а это не «родни нет»,
       это пробел в шежіре, и сказать надо именно так. */
    if (!near) host.appendChild(el('p', 'empty', esc(t('kinNone'))));
    if (far) host.appendChild(el('p', 'empty', esc(t('kinFar', { n: far }))));
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
      host.appendChild(personRow(p, withRel, true));
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

    var jump = el('div', 'card-actions');
    var toBranch = el('button', 'card-act', esc(t('showBranch')));
    toBranch.type = 'button';
    toBranch.addEventListener('click', function () { closeSheet(); setFocus(id); });
    jump.appendChild(toBranch);
    if (inChain(id)) {
      var toTape = el('button', 'card-act', esc(t('inTape')));
      toTape.type = 'button';
      toTape.addEventListener('click', function () { closeSheet(); showInTape(id); });
      jump.appendChild(toTape);
    }
    sheetBody.appendChild(jump);

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
    /* С экрана «Туыс» выбор себя не уводит: там сразу видно,
       ради чего его делали — родня уже разложена по полкам. */
    if (view === 'kin') window.scrollTo(0, 0);
    else showMeInTape();
  }

  /* Выбор себя должен быть виден. Иначе человек нажал — и, если он
     стоит наверху страницы, на экране будто ничего не произошло. */
  function showMeInTape() { showInTape(ego); }

  function inChain(id) {
    return CHAIN.some(function (p) { return p.id === id; });
  }

  function showInTape(id) {
    if (view !== 'tape') setView('tape');
    var step = tape.querySelector('.step[data-id="' + id + '"]');
    if (!step) return;
    tape.querySelectorAll('.step').forEach(function (s) { s.classList.add('in'); });
    var top = window.scrollY + step.getBoundingClientRect().top -
              window.innerHeight * 0.42;
    window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
    step.classList.remove('just-set');
    void step.offsetWidth;
    step.classList.add('just-set');
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
    ['tape', 'kin', 'tree', 'search'].forEach(function (v) {
      document.getElementById('view-' + v).hidden = (v !== name);
    });
    document.querySelectorAll('.nav-btn').forEach(function (b) {
      b.classList.toggle('is-on', b.dataset.view === name);
    });
    window.scrollTo(0, 0);
    if (name === 'kin') renderKin();
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

    if (view === 'kin') renderKin();
    if (view === 'tree') renderTree();
    if (view === 'search') search(document.getElementById('searchInput').value,
                                  document.getElementById('searchList'), true);
    observeAll();
    onScroll();
  }

  document.querySelectorAll('[data-tree-mode]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (treeMode === b.dataset.treeMode) return;
      treeMode = b.dataset.treeMode;
      localStorage.setItem('az-tree-mode', treeMode);
      window.scrollTo(0, 0);
      renderTree();
    });
  });

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
  /* При «назад» браузер сам возвращает прокрутку на прежнее место.
     Слои — наша собственная история, и такое возвращение спорит
     с переходами вроде «показать в линии»: прокруткой распоряжаемся
     сами. */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

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
