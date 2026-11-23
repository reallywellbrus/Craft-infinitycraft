/* =========================================================
   Режимы: данные, валидация, формат обмена.
   ========================================================= */

// Схема режима:
// {
//   id, name, description, author, emoji, hue,
//   createdAt, updatedAt, likes,
//   base: [{ id, name, emoji, hue }],           // с чего начинают игроки
//   elements: [{ id, name, emoji, hue, base? }],// все придуманные элементы
//   rules: [{ a, b, result }]                   // что из чего получается
// }

var CraftModes = (function () {
  'use strict';

  var FORMAT = 'craft-modes/v1';

  var BASE_DEFAULTS = [
    { id: 'water', name: 'Вода', emoji: '💧', hue: 200 },
    { id: 'fire', name: 'Огонь', emoji: '🔥', hue: 20 },
    { id: 'wind', name: 'Ветер', emoji: '💨', hue: 190 },
    { id: 'earth', name: 'Земля', emoji: '🌍', hue: 120 },
  ];

  function uid(prefix) {
    var rand = Math.random().toString(36).slice(2, 8);
    return (prefix || 'e') + '-' + Date.now().toString(36) + '-' + rand;
  }

  function pairKey(a, b) {
    return a < b ? a + '|' + b : b + '|' + a;
  }

  function slug(name) {
    return String(name || '')
      .toLowerCase()
      .replace(/[^0-9a-zа-яё]+/gi, '-')
      .replace(/^-+|-+$/g, '');
  }

  function baseElements() {
    return BASE_DEFAULTS.map(function (el) {
      return { id: el.id, name: el.name, emoji: el.emoji, hue: el.hue, base: true };
    });
  }

  function emptyMode() {
    return {
      id: uid('mode'),
      name: '',
      description: '',
      author: '',
      emoji: '🧩',
      hue: 260,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      base: baseElements(),
      elements: [],
      rules: [],
    };
  }

  // Индекс: id → элемент и пара → правило.
  function buildIndex(mode) {
    var byId = Object.create(null);
    (mode.base || []).forEach(function (el) {
      byId[el.id] = el;
    });
    (mode.elements || []).forEach(function (el) {
      byId[el.id] = el;
    });
    var byPair = Object.create(null);
    (mode.rules || []).forEach(function (rule) {
      byPair[pairKey(rule.a, rule.b)] = rule;
    });
    return { byId: byId, byPair: byPair };
  }

  function allElements(mode) {
    return (mode.base || []).concat(mode.elements || []);
  }

  // Чистка режима перед сохранением/публикацией.
  function normalize(mode) {
    var clean = {
      id: String(mode.id || uid('mode')),
      name: String(mode.name || '').slice(0, 60),
      description: String(mode.description || '').slice(0, 200),
      author: String(mode.author || '').slice(0, 40),
      emoji: String(mode.emoji || '🧩').slice(0, 8),
      hue: Number(mode.hue) || 260,
      createdAt: Number(mode.createdAt) || Date.now(),
      updatedAt: Number(mode.updatedAt) || Date.now(),
      likes: Number(mode.likes) || 0,
      base: baseElements(),
      elements: [],
      rules: [],
    };
    if (mode.remoteId) clean.remoteId = String(mode.remoteId);
    var seen = Object.create(null);
    clean.base.forEach(function (el) {
      seen[el.id] = true;
    });
    (mode.elements || []).forEach(function (el) {
      if (!el || !el.id || seen[el.id]) return;
      seen[el.id] = true;
      clean.elements.push({
        id: String(el.id),
        name: String(el.name || '').slice(0, 60),
        emoji: String(el.emoji || '✨').slice(0, 8),
        hue: Number(el.hue) || 260,
      });
    });
    var pairs = Object.create(null);
    (mode.rules || []).forEach(function (rule) {
      if (!rule || !rule.a || !rule.b || !rule.result) return;
      if (!seen[rule.a] || !seen[rule.b] || !seen[rule.result]) return;
      var key = pairKey(rule.a, rule.b);
      if (pairs[key]) return;
      pairs[key] = true;
      clean.rules.push({ a: String(rule.a), b: String(rule.b), result: String(rule.result) });
    });
    return clean;
  }

  function validate(mode) {
    var errors = [];
    if (!mode || typeof mode !== 'object') return ['Режим не найден'];
    if (!String(mode.name || '').trim()) errors.push('Нужно название режима');
    if (!Array.isArray(mode.rules) || mode.rules.length === 0) errors.push('Нужно хотя бы одно правило крафта');
    return errors;
  }

  // Обмен: компактный JSON, в нём — только то, что нужно для игры.
  function toExport(mode) {
    var clean = normalize(mode);
    return {
      format: FORMAT,
      name: clean.name,
      description: clean.description,
      author: clean.author,
      emoji: clean.emoji,
      hue: clean.hue,
      base: clean.base.map(function (el) {
        return { id: el.id, name: el.name, emoji: el.emoji, hue: el.hue };
      }),
      elements: clean.elements.map(function (el) {
        return { id: el.id, name: el.name, emoji: el.emoji, hue: el.hue };
      }),
      rules: clean.rules.map(function (rule) {
        return [rule.a, rule.b, rule.result];
      }),
    };
  }

  function fromExport(raw) {
    if (!raw || typeof raw !== 'object') return null;
    // Принимаем только файл Craft Modes: нужен формат, название и правила.
    if (raw.format !== FORMAT) return null;
    if (!String(raw.name || '').trim()) return null;
    if (!Array.isArray(raw.rules)) return null;
    var rules = [];
    (raw.rules || []).forEach(function (rule) {
      if (Array.isArray(rule) && rule.length === 3) rules.push({ a: rule[0], b: rule[1], result: rule[2] });
      else if (rule && rule.a && rule.b && rule.result) rules.push({ a: rule.a, b: rule.b, result: rule.result });
    });
    var elements = (raw.elements || []).map(function (el) {
      return { id: el.id, name: el.name, emoji: el.emoji, hue: el.hue };
    });
    return normalize({
      id: uid('mode'),
      name: raw.name || 'Без названия',
      description: raw.description || '',
      author: raw.author || '',
      emoji: raw.emoji || '🧩',
      hue: raw.hue || 260,
      elements: elements,
      rules: rules,
    });
  }

  // Сколько элементов открыто — для прогресса игры.
  function reachable(mode) {
    var index = buildIndex(mode);
    var open = Object.create(null);
    (mode.base || []).forEach(function (el) {
      open[el.id] = true;
    });
    var changed = true;
    while (changed) {
      changed = false;
      (mode.rules || []).forEach(function (rule) {
        if (open[rule.a] && open[rule.b] && !open[rule.result]) {
          open[rule.result] = true;
          changed = true;
        }
      });
    }
    return index && { open: open, count: Object.keys(open).length };
  }

  return {
    FORMAT: FORMAT,
    uid: uid,
    pairKey: pairKey,
    slug: slug,
    baseElements: baseElements,
    emptyMode: emptyMode,
    buildIndex: buildIndex,
    allElements: allElements,
    normalize: normalize,
    validate: validate,
    toExport: toExport,
    fromExport: fromExport,
    reachable: reachable,
  };
})();
