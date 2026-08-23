/* ══════════════════════════════════════════════════════════
   АйдарЖапан шежіресі · service worker

   Нужен ради двух вещей. Первая — приложение: телефон не
   предложит сохранить сайт на экран, пока у сайта нет своего
   работника. Вторая важнее: шежіре читают в дороге, в ауле,
   в самолёте — и оно должно открываться там, где интернета нет.

   Сайт целиком лежит в браузере: люди, родство, фотографии.
   Значит и офлайн — это не «заглушка», а всё шежіре как есть.

   Как решаем, откуда брать:
     страница      — сперва сеть, не вышло — из запаса;
     свои файлы    — из запаса по точному адресу (адрес несёт ?v=,
                     новая версия — другой адрес, промаха не будет),
                     иначе сеть, иначе последний известный файл;
     фотографии    — из запаса, они не меняются;
     шрифты        — из запаса, они тем более.
   ══════════════════════════════════════════════════════════ */

/* На localhost шежіре не читают, а правят: там запас только мешает —
   файл поменялся, адрес прежний, и работник отдаёт вчерашнее. Поэтому
   дома сперва сеть, а запас остаётся про запас — офлайн проверить. */
var DEV = self.location.hostname === 'localhost' ||
          self.location.hostname === '127.0.0.1';

var SHELL = 'az-shell-1';   /* страница и «последние известные» файлы */
var ASSET = 'az-asset-1';   /* файлы по точному адресу, с ?v=         */
var PHOTO = 'az-photo-1';
var FONT  = 'az-font-1';
var MINE  = [SHELL, ASSET, PHOTO, FONT];

/* Запас на первый случай. Адреса без ?v=: точные версии осядут
   сами, когда страница их попросит, а здесь нужен просто рабочий
   комплект — на случай, если шежіре закрыли и унесли в офлайн
   раньше, чем оно успело прогреться. */
var CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/style.css',
  './assets/app.js',
  './assets/kinship.js',
  './assets/photos.js',
  './data/people.js',
  './data/stories.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(SHELL).then(function (c) {
      /* Поштучно: один отсутствующий файл не должен сорвать
         установку целиком. */
      return Promise.all(CORE.map(function (u) {
        return c.add(new Request(u, { cache: 'reload' })).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(names.map(function (n) {
        return MINE.indexOf(n) === -1 ? caches.delete(n) : null;
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* Адрес без ?v= — тот самый «последний известный файл». */
function bare(url) {
  var u = new URL(url);
  u.search = '';
  u.hash = '';
  return u.href;
}

/* Один файл — одна запись. Пришла новая версия, старые адреса
   того же файла из запаса убираем: иначе за годы правок там
   осядет десяток app.js. */
function keepOne(cache, req) {
  var here = new URL(req.url);
  cache.keys().then(function (keys) {
    keys.forEach(function (k) {
      var u = new URL(k.url);
      if (u.origin === here.origin && u.pathname === here.pathname &&
          u.search !== here.search) cache.delete(k);
    });
  });
}

function fromNet(req, cacheName, exact) {
  return fetch(req).then(function (res) {
    if (res && (res.ok || res.type === 'opaque')) {
      var exactCopy = res.clone();
      var bareCopy  = exact && res.ok ? res.clone() : null;
      caches.open(cacheName).then(function (c) {
        c.put(req, exactCopy);
        if (exact) {
          keepOne(c, req);
          /* он же под адресом без версии — как запасной */
          if (bareCopy) c.put(bare(req.url), bareCopy);
        }
      });
    }
    return res;
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);
  var mine = url.origin === self.location.origin;

  /* Шрифты Google: не меняются, тянуть их каждый раз незачем. */
  if (url.hostname === 'fonts.googleapis.com' ||
      url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.match(req).then(function (hit) {
        return hit || fromNet(req, FONT, false).catch(function () { return hit; });
      })
    );
    return;
  }

  if (!mine) return;   /* чужое — не наше дело */

  /* Страница. Сперва сеть: правки должны доходить сразу.
     Нет сети — отдаём то, что открывали в прошлый раз. */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(SHELL).then(function (c) { c.put('./index.html', copy); });
        return res;
      }).catch(function () {
        return caches.match('./index.html').then(function (hit) {
          return hit || caches.match('./');
        });
      })
    );
    return;
  }

  if (url.pathname.indexOf('/assets/photos/') !== -1) {
    e.respondWith(
      caches.match(req).then(function (hit) {
        return hit || fromNet(req, PHOTO, false);
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit && !DEV) return hit;
      return fromNet(req, ASSET, true).catch(function () {
        /* Сети нет, а адрес новый: шежіре бумажным не станет —
           отдаём последнюю версию этого же файла. */
        return hit || caches.match(bare(req.url));
      });
    })
  );
});
