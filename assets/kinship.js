/* ══════════════════════════════════════════════════════════
   Родство: кем человек приходится тому, кто открыл сайт.

   Считаем по дереву: поднимаемся от обоих вверх до общего
   предка. U — сколько колен вверх от вас, D — сколько вниз
   до него. Пара (U, D) и определяет термин.

     U=1 D=1  брат или сестра
     U=2 D=1  брат отца, то есть дядя
     U=2 D=2  двоюродный
     U=0 D=2  внук

   Короткий термин даём там, где он однозначен. Рядом всегда
   идёт развёрнутое описание вида «атаңыздың немересі» —
   оно строится механически и верно всегда, даже когда
   короткого слова в языке нет.

   Женская линия в шежіре почти не записана, поэтому «нағашы»
   (по матери) появляется только там, где мать известна.
   ══════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  function make(people, unions) {
    var BY = {};
    people.forEach(function (p) { BY[p.id] = p; });

    var MATES = {};
    (unions || []).forEach(function (u) {
      var a = u.partners[0], b = u.partners[1];
      (MATES[a] = MATES[a] || []).push({ id: b, status: u.status });
      (MATES[b] = MATES[b] || []).push({ id: a, status: u.status });
    });

    function parents(id) {
      var p = BY[id];
      if (!p) return [];
      return [p.parent, p.parent2].filter(function (x) { return x && BY[x]; });
    }

    /* Все предки с расстоянием и дорогой до них. Ходим по обоим
       родителям, поэтому у одного предка может быть несколько путей —
       берём самый короткий. */
    function upward(id) {
      var out = {}, queue = [{ id: id, d: 0, path: [id] }];
      while (queue.length) {
        var cur = queue.shift();
        if (out[cur.id] && out[cur.id].d <= cur.d) continue;
        out[cur.id] = { d: cur.d, path: cur.path };
        parents(cur.id).forEach(function (x) {
          queue.push({ id: x, d: cur.d + 1, path: cur.path.concat([x]) });
        });
      }
      return out;
    }

    function meet(egoId, targetId) {
      var A = upward(egoId), B = upward(targetId), best = null;
      Object.keys(B).forEach(function (k) {
        if (!A[k]) return;
        var sum = A[k].d + B[k].d;
        if (!best || sum < best.sum || (sum === best.sum && A[k].d < best.up)) {
          best = { lca: k, up: A[k].d, down: B[k].d, sum: sum,
                   upPath: A[k].path, downPath: B[k].path };
        }
      });
      return best;
    }

    /* ── словарь ──────────────────────────────────────────── */

    /* Окончание -ңыз или -ңіз зависит от гласных в слове,
       поэтому формы храним целиком, а не собираем из корня. */
    var UP_KK  = ['', 'әкеңіз', 'атаңыз', 'арғы атаңыз'];
    var UP_KKF = ['', 'анаңыз', 'әжеңіз', 'арғы әжеңіз'];

    /* родительный падеж: атаңыз -> атаңыздың, әкеңіз -> әкеңіздің */
    function gen(word) {
      return word + (/ңыз$/.test(word) ? 'дың' : 'дің');
    }

    /* «ваш отец» -> «его отец»: әкеңіз -> әкесі, атаңыз -> атасы */
    function third(word) {
      return word.replace(/ңыз$/, 'сы').replace(/ңіз$/, 'сі');
    }

    var DOWN_KK = ['', 'ұлы', 'немересі', 'шөбересі', 'шөпшегі'];
    var DOWN_KKF = ['', 'қызы', 'немересі', 'шөбересі', 'шөпшегі'];
    var DOWN_RU = ['', 'сын', 'внук', 'правнук', 'праправнук'];
    var DOWN_RUF = ['', 'дочь', 'внучка', 'правнучка', 'праправнучка'];

    function older(a, b) {
      if (!a || !b || !a.born || !b.born) return null;
      return a.born < b.born;
    }

    var UP_RU_NOM  = ['', 'ваш отец',    'ваш дед',    'ваш прадед'];
    var UP_RUF_NOM = ['', 'ваша мать',   'ваша бабушка',  'ваша прабабушка'];
    var UP_RU_GEN  = ['', 'вашего отца', 'вашего деда',   'вашего прадеда'];
    var UP_RUF_GEN = ['', 'вашей матери', 'вашей бабушки', 'вашей прабабушки'];

    /* Развёрнутое описание — работает для любой пары чисел.
       «атаңыздың немересі» — внук вашего деда, то есть двоюродный брат. */
    function describe(m) {
      var up = m.up, down = m.down;
      var target = BY[m.downPath[0]];
      var tf = target.sex === 'f';

      if (up === 0) {
        return {
          kk: 'сіздің ' + (tf ? DOWN_KKF : DOWN_KK)[Math.min(down, 4)],
          ru: (tf ? 'ваша ' : 'ваш ') + (tf ? DOWN_RUF : DOWN_RU)[Math.min(down, 4)]
        };
      }

      var lcaF = BY[m.lca].sex === 'f';
      var viaMother = up >= 2 && (BY[m.upPath[1]] || {}).sex === 'f';
      var tail = viaMother ? ' по матери' : '';

      var upKk = up <= 3 ? (lcaF ? UP_KKF : UP_KK)[up] : up + '-ші атаңыз';
      if (viaMother) upKk = 'нағашы ' + upKk;

      var nom = up <= 3 ? (lcaF ? UP_RUF_NOM : UP_RU_NOM)[up]
                        : 'ваш предок в ' + up + '-м колене';
      var genRu = up <= 3 ? (lcaF ? UP_RUF_GEN : UP_RU_GEN)[up]
                          : 'вашего предка в ' + up + '-м колене';

      if (down === 0) return { kk: upKk, ru: nom + tail };

      return {
        kk: gen(upKk) + ' ' + (tf ? DOWN_KKF : DOWN_KK)[Math.min(down, 4)],
        ru: (tf ? DOWN_RUF : DOWN_RU)[Math.min(down, 4)] + ' ' + genRu + tail
      };
    }

    /* Короткое слово — только там, где оно однозначно. */
    function shortTerm(m, egoId) {
      var ego = BY[egoId], t = BY[m.downPath[0]], up = m.up, down = m.down;
      var f = t.sex === 'f';
      var viaMother = up >= 2 && (BY[m.upPath[1]] || {}).sex === 'f';

      if (up === 0 && down === 0) return { kk: 'Бұл сіз', ru: 'Это вы' };

      if (up === 0) {
        if (down === 1) return f ? { kk: 'қызыңыз', ru: 'ваша дочь' }
                                 : { kk: 'ұлыңыз', ru: 'ваш сын' };
        if (down === 2) return { kk: 'немереңіз', ru: f ? 'ваша внучка' : 'ваш внук' };
        if (down === 3) return { kk: 'шөбереңіз', ru: f ? 'ваша правнучка' : 'ваш правнук' };
        if (down === 4) return { kk: 'шөпшегіңіз', ru: 'ваш праправнук' };
        return null;
      }

      if (down === 0) {
        if (up === 1) return f ? { kk: 'анаңыз', ru: 'ваша мать' }
                               : { kk: 'әкеңіз', ru: 'ваш отец' };
        if (up === 2) return f ? { kk: (viaMother ? 'нағашы ' : '') + 'әжеңіз',
                                   ru: 'ваша бабушка' + (viaMother ? ' по матери' : '') }
                               : { kk: (viaMother ? 'нағашы ' : '') + 'атаңыз',
                                   ru: 'ваш дед' + (viaMother ? ' по матери' : '') };
        if (up === 3) return f ? { kk: 'арғы әжеңіз', ru: 'ваша прабабушка' }
                               : { kk: 'арғы атаңыз', ru: 'ваш прадед' };
        return { kk: up + '-ші атаңыз', ru: 'ваш предок, ' + up + ' колен назад' };
      }

      /* родные братья и сёстры */
      if (up === 1 && down === 1) {
        var isOlder = older(t, ego);
        if (f) {
          if (isOlder === true)  return { kk: 'апаңыз', ru: 'ваша старшая сестра' };
          if (isOlder === false) return { kk: ego.sex === 'f' ? 'сіңліңіз' : 'қарындасыңыз',
                                          ru: 'ваша младшая сестра' };
          return { kk: 'қарындасыңыз', ru: 'ваша сестра' };
        }
        if (isOlder === true)  return { kk: 'ағаңыз', ru: 'ваш старший брат' };
        if (isOlder === false) return { kk: 'ініңіз', ru: 'ваш младший брат' };
        return { kk: 'бауырыңыз', ru: 'ваш брат' };
      }

      /* дети брата или сестры */
      if (up === 1 && down === 2) {
        var sib = BY[m.downPath[1]];
        if (sib && sib.sex === 'f') {
          return { kk: 'жиеніңіз', ru: f ? 'ваша племянница' : 'ваш племянник' };
        }
        return { kk: 'бауырыңыздың ' + (f ? 'қызы' : 'ұлы'),
                 ru: f ? 'ваша племянница' : 'ваш племянник' };
      }

      /* брат или сестра родителя */
      if (up === 2 && down === 1) {
        var par = BY[m.upPath[1]];
        if (par && par.sex === 'f') {
          return f ? { kk: 'нағашы апаңыз', ru: 'ваша тётя по матери' }
                   : { kk: 'нағашы ағаңыз', ru: 'ваш дядя по матери' };
        }
        if (f) return { kk: 'әкеңіздің қарындасы', ru: 'ваша тётя по отцу' };
        var senior = older(t, par);
        if (senior === true)  return { kk: 'әкеңіздің ағасы', ru: 'ваш дядя, старший брат отца' };
        if (senior === false) return { kk: 'әкеңіздің інісі', ru: 'ваш дядя, младший брат отца' };
        return { kk: 'әкеңіздің бауыры', ru: 'ваш дядя по отцу' };
      }

      /* брат или сестра деда, прадеда */
      if (down === 1 && (up === 3 || up === 4)) {
        var anc = BY[m.upPath[up - 1]];
        var word = up === 3 ? 'атаңыз' : 'арғы атаңыз';
        var wordRu = up === 3 ? 'вашего деда' : 'вашего прадеда';
        if (f) return { kk: gen(word) + ' қарындасы', ru: 'сестра ' + wordRu };
        var sr = older(t, anc);
        return { kk: gen(word) + (sr === true ? ' ағасы' : sr === false ? ' інісі' : ' бауыры'),
                 ru: 'брат ' + wordRu };
      }

      /* двоюродные, троюродные */
      if (up === down) {
        var isOld = older(t, ego);
        if (up === 2) {
          if (viaMother) return { kk: 'бөлеңіз',
                                  ru: f ? 'ваша двоюродная сестра по матери'
                                        : 'ваш двоюродный брат по матери' };
          if (f) return { kk: 'немере ' + (isOld === false ? 'қарындасыңыз' : 'апаңыз'),
                          ru: 'ваша двоюродная сестра' };
          return { kk: 'немере ' + (isOld === false ? 'ініңіз' : 'ағаңыз'),
                   ru: 'ваш двоюродный брат' };
        }
        if (up === 3) return { kk: 'шөбере ' + (f ? 'қарындасыңыз' : 'бауырыңыз'),
                               ru: f ? 'ваша троюродная сестра' : 'ваш троюродный брат' };
        if (up === 4) return { kk: 'шөпшек ' + (f ? 'қарындасыңыз' : 'бауырыңыз'),
                               ru: f ? 'ваша четвероюродная сестра' : 'ваш четвероюродный брат' };
      }

      return null;
    }

    /* ── главный вход ─────────────────────────────────────── */
    function relate(egoId, targetId) {
      if (!BY[egoId] || !BY[targetId]) return null;

      /* собственный супруг — отдельный случай, кровного пути тут нет */
      var own = (MATES[egoId] || []).filter(function (x) { return x.id === targetId; })[0];
      if (own) {
        var wife = BY[targetId].sex === 'f';
        return {
          kind: 'spouse-own', steps: [egoId, targetId],
          term: { kk: 'жұбайыңыз',
                  ru: (wife ? 'ваша жена' : 'ваш муж') +
                      (own.status === 'divorced' ? ' (в разводе)' : '') },
          path: { kk: wife ? 'зайыбыңыз' : 'жолдасыңыз',
                  ru: wife ? 'супруга' : 'супруг' }
        };
      }

      var blood = bloodTie(egoId, targetId);
      if (blood) return blood;

      /* кровного пути нет — значит, он вошёл в род через брак */
      var found = null;
      (MATES[targetId] || []).forEach(function (mate) {
        if (found) return;
        var r = bloodTie(egoId, mate.id);
        if (!r) return;
        var base = r.term || r.path;
        found = {
          kind: 'spouse', of: mate.id, steps: r.steps.concat([targetId]),
          term: { kk: gen(base.kk) + ' ' + (BY[targetId].sex === 'f' ? 'әйелі' : 'күйеуі'),
                  ru: (BY[targetId].sex === 'f' ? 'жена' : 'муж') + ' ' + BY[mate.id].name },
          path: { kk: BY[mate.id].name + ' — ' + base.kk,
                  ru: BY[mate.id].name + ' — ' + base.ru }
        };
      });
      if (found) return found;

      /* или родня со стороны вашего супруга */
      (MATES[egoId] || []).forEach(function (mine) {
        if (found) return;
        var r = bloodTie(mine.id, targetId);
        if (!r) return;
        var base = r.term || r.path;

        /* родителей супруга называют отдельными словами */
        if (r.up === 1 && r.down === 0) {
          var her = BY[egoId].sex === 'f';
          found = {
            kind: 'in-law', through: mine.id, steps: r.steps,
            term: BY[targetId].sex === 'f'
              ? { kk: 'қайын енеңіз', ru: her ? 'ваша свекровь' : 'ваша тёща' }
              : { kk: 'қайын атаңыз', ru: her ? 'ваш свёкор' : 'ваш тесть' },
            path: { kk: BY[mine.id].name + ' жағынан: ' + base.kk,
                    ru: 'со стороны ' + BY[mine.id].name + ': ' + base.ru }
          };
          return;
        }

        found = {
          kind: 'in-law', through: mine.id, steps: r.steps,
          term: { kk: 'жұбайыңыздың ' + third(base.kk),
                  ru: base.ru.replace(/^ваш(а|его|ей|)\s*/, '') + ' вашего супруга' },
          path: { kk: BY[mine.id].name + ' жағынан: ' + base.kk,
                  ru: 'со стороны ' + BY[mine.id].name + ': ' + base.ru }
        };
      });
      if (found) return found;

      /* Связи нет по двум разным причинам, и путать их нельзя:
         либо родитель просто не записан в шежіре, либо человек
         действительно не кровный родственник. */
      var gap = !BY[targetId].parent;
      return {
        kind: gap ? 'unknown' : 'none', steps: [], term: null,
        path: gap
          ? { kk: 'туыстық белгісіз: шежіреде оның әкесі жазылмаған',
              ru: 'родство пока не установлено: в шежіре не записан его родитель' }
          : { kk: 'қандас туыс емес', ru: 'не кровный родственник' }
      };
    }

    /* Только кровное родство. Отдельно от relate, чтобы поиск
       через супругов не зациклился сам на себе. */
    function bloodTie(egoId, targetId) {
      var m = meet(egoId, targetId);
      if (!m) return null;
      var steps = m.upPath.slice();
      for (var i = m.downPath.length - 2; i >= 0; i--) steps.push(m.downPath[i]);
      return {
        kind: 'blood', up: m.up, down: m.down, lca: m.lca, steps: steps,
        term: shortTerm(m, egoId), path: describe(m)
      };
    }

    return { relate: relate, upward: upward, parents: parents, mates: MATES };
  }

  global.KINSHIP = { make: make };
})(window);
