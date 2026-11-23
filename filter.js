/* =========================================================
   Фильтр нежелательных слов в пользовательских крафтах.
   Проверяет имена элементов, названия/описания режимов и авторов.
   ========================================================= */
(function (global) {
  'use strict';

  // Корни, которые проверяются в «сжатом» тексте (без пробелов и знаков).
  const RU_ROOTS = [
    'хуй', 'хуя', 'хуе', 'хуи',
    'пизд',
    'бляд', 'блят', 'блядь',
    'ебат', 'ебал', 'ебан', 'ебуч', 'ебен', 'ебет', 'ебеш',
    'залуп',
    'пидор', 'пидар', 'педик',
    'гандон',
    'дроч',
    'сука',
    'срак', 'срать', 'срал',
    'говн',
    'дерьм',
    'мудак', 'мудил',
    'уеб', 'уебан',
    'долбоеб',
    'жоп',
    'еблан', 'чмо',
  ];

  // Английские слова проверяем по границам слов, чтобы не ловить
  // «class», «glass», «document» и подобное.
  const EN_WORDS = [
    'fuck', 'fucking', 'fucked', 'motherfuck',
    'shit', 'shitty', 'bullshit',
    'bitch', 'bitches',
    'cunt',
    'dick', 'dicks',
    'pussy',
    'whore', 'slut',
    'asshole', 'bastard',
    'nigger', 'nigga',
    'faggot', 'retard',
    'douche', 'cock', 'cum',
  ];

  // Эти слова проверяем и без пробелов/точек: f.u.c.k, s h i t и т.п.
  // «cock» и «cum» сюда не входят, чтобы не ловить cocktail/document.
  const EN_COMPACT = [
    'fuck', 'fucking', 'fucked', 'motherfuck',
    'shit', 'shitty', 'bullshit',
    'bitch', 'cunt', 'pussy', 'whore',
    'asshole', 'bastard', 'nigger', 'nigga',
    'faggot', 'retard',
  ];

  function normalize(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/[0@]/g, 'о')
      .replace(/[1!|]/g, 'и')
      .replace(/3/g, 'е')
      .replace(/4/g, 'а')
      .replace(/5[$]/g, 'с')
      .replace(/7/g, 'т')
      .replace(/8/g, 'в')
      .replace(/9/g, 'д');
  }

  function compact(text) {
    return normalize(text).replace(/[^a-zа-я0-9]+/g, '');
  }

  function spaced(text) {
    return normalize(text).replace(/[^a-zа-я0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // Отдельная нормализация для латиницы: sh1t → shit, f.u.c.k → fuck.
  function latinCompact(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/0/g, 'o')
      .replace(/1/g, 'i')
      .replace(/3/g, 'e')
      .replace(/4/g, 'a')
      .replace(/5/g, 's')
      .replace(/7/g, 't')
      .replace(/[^a-z]+/g, '');
  }

  function find(text) {
    const raw = normalize(text);
    if (!raw.trim()) return null;
    const compactText = compact(text);
    const spacedText = spaced(text);
    const latinText = latinCompact(text);
    for (const root of RU_ROOTS) {
      if (compactText.includes(root)) return root;
    }
    for (const word of EN_WORDS) {
      if (new RegExp('(^| )' + word + '( |$)').test(spacedText)) return word;
    }
    for (const word of EN_COMPACT) {
      if (latinText.includes(word) || compactText.includes(word)) return word;
    }
    return null;
  }

  function checkMode(mode) {
    if (!mode) return null;
    const texts = [mode.name, mode.description, mode.author];
    for (const el of (mode.elements || [])) texts.push(el && el.name);
    for (const text of texts) {
      const hit = find(text);
      if (hit) return hit;
    }
    return null;
  }

  global.CraftFilter = { find, checkMode, normalize };
})(window);
