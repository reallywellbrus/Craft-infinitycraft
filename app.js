/* =========================================================
   Craft Modes — игра, редактор режимов и каталог.
   ========================================================= */
(function () {
  'use strict';

  const Storage = window.CraftStorage;
  const Emoji = window.CraftEmoji;
  const Modes = window.CraftModes;

  const $ = (id) => document.getElementById(id);
  const Sound = window.CraftSound || {
    play() {},
    toggle() { return false; },
    unlock() {},
    isEnabled() { return false; },
  };

  const dom = {
    brandLink: $('brandLink'),
    btnLobby: $('btnLobby'),
    btnCreate: $('btnCreate'),
    btnCreate2: $('btnCreate2'),
    btnImport: $('btnImport'),
    fileInput: $('fileInput'),
    btnMenu: $('btnMenu'),
    btnSound: $('btnSound'),
    menu: $('menu'),
    btnRecipes: $('btnRecipes'),
    recipesDialog: $('recipesDialog'),
    recipesSubtitle: $('recipesSubtitle'),
    recipesSearch: $('recipesSearch'),
    recipesList: $('recipesList'),
    recipesCount: $('recipesCount'),
    topStats: $('topStats'),
    statElements: $('statElements'),
    statRules: $('statRules'),
    modeBadge: document.getElementById('modeBadge'),
    savePill: $('savePill'),
    saveText: $('saveText'),
    saveDot: $('saveDot'),

    screenLobby: $('screenLobby'),
    screenEditor: $('screenEditor'),
    screenPlay: $('screenPlay'),

    myModes: $('myModes'),
    myEmpty: $('myEmpty'),
    myCount: $('myCount'),
    catalogModes: $('catalogModes'),
    catalogEmpty: $('catalogEmpty'),
    catalogCount: $('catalogCount'),
    catalogSearch: $('catalogSearch'),

    editorTitle: $('editorTitle'),
    editorBoard: $('editorBoard'),
    editorEmpty: $('editorEmpty'),
    editorList: $('editorList'),
    editorCount: $('editorCount'),
    editorBoardCount: $('editorBoardCount'),
    editorSearch: $('editorSearch'),
    btnSaveMode: $('btnSaveMode'),
    btnClearEditor: $('btnClearEditor'),

    playTitle: $('playTitle'),
    playFound: $('playFound'),
    playTotal: $('playTotal'),
    playBoard: $('playBoard'),
    playEmpty: $('playEmpty'),
    playList: $('playList'),
    playCount: $('playCount'),
    playBoardCount: $('playBoardCount'),
    playSearch: $('playSearch'),
    btnPlayRestart: $('btnPlayRestart'),
    btnClearPlay: $('btnClearPlay'),

    craftDialog: $('craftDialog'),
    craftPair: $('craftPair'),
    craftSearch: $('craftSearch'),
    craftExisting: $('craftExisting'),
    craftNewPane: $('craftNewPane'),
    craftExistingPane: $('craftExistingPane'),
    craftName: $('craftName'),
    craftEmoji: $('craftEmoji'),
    craftEmojiHint: $('craftEmojiHint'),
    craftHint: $('craftHint'),
    craftConfirm: $('craftConfirm'),
    craftCancel: $('craftCancel'),

    publishDialog: $('publishDialog'),
    publishName: $('publishName'),
    publishDesc: $('publishDesc'),
    publishEmoji: $('publishEmoji'),
    publishAuthor: $('publishAuthor'),
    publishPreview: $('publishPreview'),
    publishHint: $('publishHint'),
    publishConfirm: $('publishConfirm'),
    publishCancel: $('publishCancel'),

    reportDialog: $('reportDialog'),
    reportModeName: $('reportModeName'),
    reportReason: $('reportReason'),
    reportComment: $('reportComment'),
    reportHint: $('reportHint'),
    reportSend: $('reportSend'),
    reportCancel: $('reportCancel'),

    confirmDialog: $('confirmDialog'),
    confirmTitle: $('confirmTitle'),
    confirmText: $('confirmText'),
    confirmOk: $('confirmOk'),
    confirmCancel: $('confirmCancel'),

    toasts: $('toasts'),
  };

  /* ---------------- утилиты ---------------- */

  let toastTimer = 0;

  function toast(icon, text) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = '<span aria-hidden="true"></span><span></span>';
    el.children[0].textContent = icon;
    el.children[1].textContent = text;
    dom.toasts.append(el);
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => el.remove(), 2800);
    window.setTimeout(() => el.remove(), 3200);
  }

  function plural(n, one, few, many) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
  }

  function elWord(n) {
    return plural(n, 'элемент', 'элемента', 'элементов');
  }

  function openDialog(dialog) {
    if (dialog && !dialog.open) dialog.showModal();
  }

  function closeDialog(dialog) {
    if (dialog && dialog.open) dialog.close();
  }

  function confirmAction(title, text, confirmLabel) {
    return new Promise((resolve) => {
      dom.confirmTitle.textContent = title;
      dom.confirmText.textContent = text;
      dom.confirmOk.textContent = confirmLabel || 'Подтвердить';
      const done = (value) => {
        dom.confirmOk.removeEventListener('click', onOk);
        dom.confirmCancel.removeEventListener('click', onCancel);
        dom.confirmDialog.removeEventListener('close', onCancel);
        closeDialog(dom.confirmDialog);
        resolve(value);
      };
      const onOk = () => done(true);
      const onCancel = () => done(false);
      dom.confirmOk.addEventListener('click', onOk);
      dom.confirmCancel.addEventListener('click', onCancel);
      dom.confirmDialog.addEventListener('close', onCancel);
      openDialog(dom.confirmDialog);
    });
  }

  function setSaveState(text, state) {
    if (!dom.saveText) return;
    dom.saveText.textContent = text;
    if (dom.savePill) dom.savePill.dataset.state = state || 'local';
  }

  function markDirty() {
    if (!dom.screenEditor.hidden || !dom.screenPlay.hidden) setSaveState('Черновик', 'dirty');
  }

  function showScreen(name) {
    dom.screenLobby.hidden = name !== 'lobby';
    dom.screenEditor.hidden = name !== 'editor';
    dom.screenPlay.hidden = name !== 'play';
    dom.btnLobby.hidden = name === 'lobby';
    dom.btnCreate.hidden = name === 'editor';
    const ownCurrent = name === 'editor' || (name === 'play' && isOwnMode(play.mode));
    dom.btnRecipes.hidden = name === 'lobby' || (name === 'play' && !ownCurrent);
    dom.topStats.hidden = name === 'lobby';
    if (dom.modeBadge) {
      dom.modeBadge.textContent = name === 'editor' ? 'редактор' : name === 'play' ? 'игра' : 'свои режимы';
    }
    if (name === 'lobby') {
      setSaveState('Локально', 'local');
      closeMenu();
      renderLobby();
    }
    if (dom.recipesDialog && dom.recipesDialog.open) closeDialog(dom.recipesDialog);
    updateMenuForMode();
  }

  /* ---------------- чипы (общий вид) ---------------- */

  function chipNode(el, extraClass) {
    const node = document.createElement('span');
    node.className = 'mini-chip' + (extraClass ? ' ' + extraClass : '');
    node.style.setProperty('--h', el.hue || 260);
    const emoji = document.createElement('span');
    emoji.className = 'mini-emoji';
    emoji.textContent = el.emoji || '✨';
    const name = document.createElement('span');
    name.textContent = el.name;
    node.append(emoji, name);
    return node;
  }

  /* =========================================================
     РЕДАКТОР РЕЖИМА
     ========================================================= */

  const editor = {
    mode: null,
    index: null,
    chips: new Map(),
    selected: null,
    drag: null,
    search: '',
    z: 10,
  };

  function editorElement(id) {
    return editor.index.byId[id];
  }

  function editorAddEl(node, x, y) {
    if (!editor.mode) return;
    editor.index = Modes.buildIndex(editor.mode);
    const el = editorElement(node.id);
    if (!el) return;
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.style.setProperty('--h', el.hue || 260);
    const emoji = document.createElement('span');
    emoji.className = 'chip-emoji';
    emoji.textContent = el.emoji || '✨';
    const name = document.createElement('span');
    name.className = 'chip-name';
    name.textContent = el.name;
    chip.append(emoji, name);
    chip.dataset.element = el.id;
    chip.dataset.uid = Modes.uid('c');
    chip.style.left = '0px';
    chip.style.top = '0px';
    chip.addEventListener('pointerdown', (e) => chipPointerDown(e, 'editor'));
    chip.addEventListener('pointermove', (e) => chipPointerMove(e, 'editor', chip));
    chip.addEventListener('pointerup', (e) => chipPointerUp(e, 'editor', chip));
    chip.addEventListener('pointercancel', (e) => chipPointerCancel(e, 'editor', chip));
    dom.editorBoard.append(chip);
    // Сначала ставим элемент, потом замеряем — так он не «уезжает» за край стола.
    const width = chip.offsetWidth || 90;
    const height = chip.offsetHeight || 34;
    const boardRect = dom.editorBoard.getBoundingClientRect();
    chip.style.left = Math.round(Math.max(4, Math.min(x, boardRect.width - width - 4))) + 'px';
    chip.style.top = Math.round(Math.max(4, Math.min(y, boardRect.height - height - 4))) + 'px';
    editor.chips.set(chip.dataset.uid, chip);
    dom.editorEmpty.hidden = true;
    updateEditorStats();
  }

  function startEditor(mode) {
    editor.mode = mode;
    editor.index = Modes.buildIndex(editor.mode);
    editor.chips.forEach((chip) => chip.remove());
    editor.chips.clear();
    editor.selected = null;
    editor.search = '';
    dom.editorSearch.value = '';
    dom.editorTitle.textContent = mode.name || 'Новый режим';
    dom.editorEmpty.hidden = true;
    renderEditorSidebar();
    updateEditorStats();
    // Сначала показываем экран, иначе у скрытого стола нулевые размеры
    // и все фишки складываются в левый верхний угол.
    showScreen('editor');
    setSaveState(mode.name ? 'Сохранено' : 'Черновик', mode.name ? 'saved' : 'dirty');

    // Раскладываем базовые элементы по столу.
    const rect = dom.editorBoard.getBoundingClientRect();
    const spots = [
      [0.24, 0.3], [0.62, 0.3], [0.24, 0.62], [0.62, 0.62],
    ];
    (mode.base || []).forEach((el, i) => {
      const spot = spots[i] || [0.3 + Math.random() * 0.4, 0.3 + Math.random() * 0.4];
      editorAddEl(el, spot[0] * rect.width - 40, spot[1] * rect.height - 16);
    });
  }

  function updateEditorStats() {
    const total = (editor.mode.base || []).length + (editor.mode.elements || []).length;
    if (dom.statElements) dom.statElements.textContent = String(total);
    if (dom.statRules) dom.statRules.textContent = String((editor.mode.rules || []).length);
    dom.editorCount.textContent = String(total);
    if (dom.editorBoardCount) dom.editorBoardCount.textContent = `${editor.chips.size} на столе`;
  }

  function renderEditorSidebar() {
    const query = Emoji.normalize(editor.search);
    dom.editorList.textContent = '';
    editor.index = Modes.buildIndex(editor.mode);
    const frag = document.createDocumentFragment();

    const list = Modes.allElements(editor.mode)
      .slice()
      .sort((a, b) => {
        const aBase = a.base ? 0 : 1;
        const bBase = b.base ? 0 : 1;
        if (aBase !== bBase) return aBase - bBase;
        return 0;
      });

    for (const el of list) {
      const name = Emoji.normalize(el.name);
      if (query && !name.includes(query)) continue;
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'el-item';
      item.dataset.element = el.id;
      const emoji = document.createElement('span');
      emoji.className = 'el-emoji';
      emoji.style.setProperty('--h', el.hue || 260);
      emoji.textContent = el.emoji || '✨';
      const label = document.createElement('span');
      label.className = 'el-name';
      label.textContent = el.name;
      const mark = document.createElement('span');
      mark.className = 'el-mark';
      mark.textContent = '+';
      item.append(emoji, label, mark);
      item.addEventListener('click', () => {
        const rect = dom.editorBoard.getBoundingClientRect();
        editorAddEl(el, rect.width * 0.3 + Math.random() * rect.width * 0.4, rect.height * 0.3 + Math.random() * rect.height * 0.4);
      });
      frag.append(item);
    }
    dom.editorList.append(frag);
    updateEditorStats();
  }

  /* =========================================================
     ИГРА ПО РЕЖИМУ
     ========================================================= */

  const play = {
    mode: null,
    index: null,
    open: null,
    chips: new Map(),
    selected: null,
    nodes: [],
    search: '',
  };

  function playAddEl(id, x, y) {
    const el = play.index.byId[id];
    if (!el) return;
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip is-new';
    chip.style.setProperty('--h', el.hue || 260);
    const emoji = document.createElement('span');
    emoji.className = 'chip-emoji';
    emoji.textContent = el.emoji || '✨';
    const name = document.createElement('span');
    name.className = 'chip-name';
    name.textContent = el.name;
    chip.append(emoji, name);
    chip.dataset.element = el.id;
    chip.dataset.uid = Modes.uid('c');
    chip.style.left = '0px';
    chip.style.top = '0px';
    chip.addEventListener('pointerdown', (e) => chipPointerDown(e, 'play'));
    chip.addEventListener('pointermove', (e) => chipPointerMove(e, 'play', chip));
    chip.addEventListener('pointerup', (e) => chipPointerUp(e, 'play', chip));
    chip.addEventListener('pointercancel', (e) => chipPointerCancel(e, 'play', chip));
    dom.playBoard.append(chip);
    const width = chip.offsetWidth || 90;
    const height = chip.offsetHeight || 34;
    const boardRect = dom.playBoard.getBoundingClientRect();
    chip.style.left = Math.round(Math.max(4, Math.min(x, boardRect.width - width - 4))) + 'px';
    chip.style.top = Math.round(Math.max(4, Math.min(y, boardRect.height - height - 4))) + 'px';
    play.chips.set(chip.dataset.uid, chip);
    dom.playEmpty.hidden = true;
    updatePlayStats();
    window.setTimeout(() => chip.classList.remove('is-new'), 500);
  }

  function startPlay(mode) {
    play.mode = mode;
    play.index = Modes.buildIndex(mode);
    const saved = Storage.playState(mode.id);
    const reach = Modes.reachable(mode);
    play.open = Object.create(null);

    if (saved && Array.isArray(saved.open)) {
      saved.open.forEach((id) => {
        if (play.index.byId[id]) play.open[id] = true;
      });
      (mode.base || []).forEach((el) => {
        play.open[el.id] = true;
      });
    } else {
      (mode.base || []).forEach((el) => {
        play.open[el.id] = true;
      });
    }

    play.chips.forEach((chip) => chip.remove());
    play.chips.clear();
    play.selected = null;
    play.search = '';
    dom.playSearch.value = '';
    dom.playTitle.textContent = mode.name || 'Режим';
    dom.playEmpty.hidden = false;
    dom.playTotal.textContent = String(reach.count);
    renderPlaySidebar();
    updatePlayStats();
    // Показываем экран до раскладки, иначе у скрытого стола нулевые размеры.
    showScreen('play');
    setSaveState('Сохранено', 'saved');

    const rect = dom.playBoard.getBoundingClientRect();
    const spots = [[0.24, 0.3], [0.62, 0.3], [0.24, 0.62], [0.62, 0.62]];
    (mode.base || []).forEach((el, i) => {
      const spot = spots[i] || [0.4, 0.4];
      playAddEl(el.id, spot[0] * rect.width - 40, spot[1] * rect.height - 16);
    });
    updatePlayStats();
  }

  function openElements() {
    return Object.keys(play.open).filter((id) => play.index.byId[id]);
  }

  function updatePlayStats() {
    const opened = openElements().length;
    dom.playFound.textContent = String(opened);
    dom.playCount.textContent = String(opened);
    if (dom.statElements) {
      dom.statElements.textContent = String((play.mode.base || []).length + (play.mode.elements || []).length);
    }
    if (dom.statRules) dom.statRules.textContent = String((play.mode.rules || []).length);
    if (dom.playBoardCount) dom.playBoardCount.textContent = `${play.chips.size} на столе`;
  }

  function clearEditorBoard() {
    if (!editor.mode) return;
    [...editor.chips.values()].forEach((node) => node.remove());
    editor.chips.clear();
    editor.selected = null;
    dom.editorBoard.classList.remove('is-dragging');
    dom.editorEmpty.hidden = false;
    updateEditorStats();
    Sound.play('delete');
    toast('🧹', 'Стол очищен');
  }

  function clearPlayBoard() {
    if (!play.mode) return;
    [...play.chips.values()].forEach((node) => node.remove());
    play.chips.clear();
    play.selected = null;
    dom.playBoard.classList.remove('is-dragging');
    dom.playEmpty.hidden = false;
    updatePlayStats();
    Sound.play('delete');
    toast('🧹', 'Стол очищен');
  }

  function clearCurrentBoard() {
    if (!dom.screenEditor.hidden) clearEditorBoard();
    else if (!dom.screenPlay.hidden) clearPlayBoard();
  }

  function saveCurrent() {
    if (!dom.screenEditor.hidden) {
      saveModeFromEditor();
      return;
    }
    if (!dom.screenPlay.hidden) {
      setSaveState('Сохранено', 'saved');
      toast('💾', 'Прогресс сохраняется автоматически');
      return;
    }
    toast('💾', 'Сначала откройте режим');
  }

  function closeMenu() {
    if (!dom.menu) return;
    dom.menu.hidden = true;
    dom.btnMenu.setAttribute('aria-expanded', 'false');
  }

  function updateSoundButton() {
    if (!dom.btnSound) return;
    const on = Sound.isEnabled();
    dom.btnSound.textContent = on ? '🔊' : '🔇';
    dom.btnSound.title = on ? 'Выключить звуки' : 'Включить звуки';
    dom.btnSound.setAttribute('aria-label', on ? 'Выключить звуки' : 'Включить звуки');
    dom.btnSound.setAttribute('aria-pressed', String(on));
  }

  function toggleMenu() {
    if (!dom.menu) return;
    const open = dom.menu.hidden;
    updateMenuForMode();
    dom.menu.hidden = !open;
    dom.btnMenu.setAttribute('aria-expanded', String(open));
  }

  function currentMode() {
    if (!dom.screenEditor.hidden) return editor.mode;
    if (!dom.screenPlay.hidden) return play.mode;
    return null;
  }

  function isOwnMode(mode) {
    if (!mode) return false;
    // Редактор всегда работает с вашим черновиком.
    if (!dom.screenEditor.hidden) return true;
    if (mode.mine === false) return false;
    if (mode.mine === true) return true;
    return Storage.listModes().some((m) => m.id === mode.id);
  }

  function updateMenuForMode() {
    if (!dom.menu) return;
    const mode = currentMode();
    const own = Boolean(mode) && isOwnMode(mode);
    const editorOpen = !dom.screenEditor.hidden;
    const set = (action, visible) => {
      const button = dom.menu.querySelector(`[data-action="${action}"]`);
      if (button) button.hidden = !visible;
    };
    // Сохранять можно только черновик; публиковать и смотреть все рецепты —
    // только в своём режиме. В чужом доступны игра, ссылка и очистка.
    set('save', editorOpen);
    set('publish', own);
    set('recipes', own);
    set('report', Boolean(mode));
    set('share', Boolean(mode));
  }

  let recipesMode = null;
  let recipesInPlay = false;

  function openRecipesDialog() {
    const mode = currentMode();
    if (!mode) {
      toast('📖', 'Сначала откройте режим');
      return;
    }
    recipesInPlay = !dom.screenPlay.hidden;
    if (recipesInPlay && !isOwnMode(play.mode)) {
      toast('🔒', 'Рецепты чужого режима скрыты');
      return;
    }
    recipesMode = mode;
    dom.recipesSubtitle.textContent = recipesInPlay
      ? 'Все правила режима и их статус в игре'
      : 'Все правила, которые вы придумали';
    dom.recipesSearch.value = '';
    renderRecipes();
    openDialog(dom.recipesDialog);
    setTimeout(() => dom.recipesSearch.focus(), 60);
  }

  function renderRecipes() {
    if (!recipesMode) return;
    const index = Modes.buildIndex(recipesMode);
    const query = Emoji.normalize(dom.recipesSearch.value);
    const rules = (recipesMode.rules || []).slice().sort((a, b) => {
      const an = index.byId[a.result] ? index.byId[a.result].name : '';
      const bn = index.byId[b.result] ? index.byId[b.result].name : '';
      return an.localeCompare(bn, 'ru');
    });

    dom.recipesList.textContent = '';
    const frag = document.createDocumentFragment();
    let shown = 0;
    for (const rule of rules) {
      const a = index.byId[rule.a];
      const b = index.byId[rule.b];
      const result = index.byId[rule.result];
      if (!a || !b || !result) continue;
      if (query && ![a.name, b.name, result.name].some((name) => Emoji.normalize(name).includes(query))) continue;
      shown += 1;

      const row = document.createElement('div');
      row.className = 'recipe-row';
      const pair = document.createElement('div');
      pair.className = 'recipe-pair';
      pair.append(chipNode(a));
      const plus = document.createElement('span');
      plus.className = 'recipe-arrow';
      plus.textContent = '+';
      pair.append(plus, chipNode(b));
      const arrow = document.createElement('span');
      arrow.className = 'recipe-arrow';
      arrow.textContent = '→';
      pair.append(arrow, chipNode(result));

      const badge = document.createElement('span');
      badge.className = 'recipe-badge';
      if (recipesInPlay) {
        const available = Boolean(play.open[a.id] && play.open[b.id]);
        const known = Boolean(play.open[result.id]);
        badge.textContent = known ? 'открыт' : available ? 'доступен' : 'закрыт';
        badge.classList.add(known ? 'is-open' : available ? 'is-available' : 'is-locked');
      } else {
        badge.textContent = 'правило';
        badge.classList.add('is-editor');
      }

      row.append(pair, badge);
      frag.append(row);
    }

    if (!shown) {
      const empty = document.createElement('div');
      empty.className = 'recipe-empty';
      empty.innerHTML = '<b>Ничего не нашлось</b><span>Попробуйте другой запрос.</span>';
      frag.append(empty);
    }
    dom.recipesList.append(frag);
    dom.recipesCount.textContent = `${shown} из ${rules.length} рецептов`;
  }

  function renderPlaySidebar() {
    const query = Emoji.normalize(play.search);
    dom.playList.textContent = '';
    const frag = document.createDocumentFragment();
    const ids = openElements().sort((a, b) => (play.index.byId[a].name || '').localeCompare(play.index.byId[b].name || '', 'ru'));
    for (const id of ids) {
      const el = play.index.byId[id];
      if (query && !Emoji.normalize(el.name).includes(query)) continue;
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'el-item';
      item.dataset.element = id;
      const emoji = document.createElement('span');
      emoji.className = 'el-emoji';
      emoji.style.setProperty('--h', el.hue || 260);
      emoji.textContent = el.emoji || '✨';
      const label = document.createElement('span');
      label.className = 'el-name';
      label.textContent = el.name;
      const mark = document.createElement('span');
      mark.className = 'el-mark';
      mark.textContent = '+';
      item.append(emoji, label, mark);
      item.addEventListener('click', () => {
        const rect = dom.playBoard.getBoundingClientRect();
        playAddEl(id, rect.width * 0.3 + Math.random() * rect.width * 0.4, rect.height * 0.3 + Math.random() * rect.height * 0.4);
      });
      frag.append(item);
    }
    dom.playList.append(frag);
    updatePlayStats();
  }

  /* =========================================================
     ПЕРЕТАСКИВАНИЕ И КРАФТ
     ========================================================= */

  function boardOf(which) {
    return which === 'editor' ? dom.editorBoard : dom.playBoard;
  }

  function stateOf(which) {
    return which === 'editor' ? editor : play;
  }

  function panelOf(which) {
    return which === 'editor'
      ? document.querySelector('#screenEditor .panel')
      : document.querySelector('#screenPlay .panel');
  }

  function pointInRect(x, y, rect) {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  function chipPointerDown(event, which, chip) {
    if (event.button !== 0) return;
    const st = stateOf(which);
    const node = event.currentTarget || chip;
    const rect = node.getBoundingClientRect();
    const boardRect = boardOf(which).getBoundingClientRect();
    st.drag = {
      uid: node.dataset.uid,
      dx: event.clientX - rect.left,
      dy: event.clientY - rect.top,
      moved: false,
      x: rect.left - boardRect.left,
      y: rect.top - boardRect.top,
      originX: rect.left - boardRect.left,
      originY: rect.top - boardRect.top,
    };
    st.z += 1;
    node.style.zIndex = String(st.z);
    node.classList.add('is-dragging');
    boardOf(which).classList.add('is-dragging');
    try {
      node.setPointerCapture(event.pointerId);
    } catch {
      // синтетические события (тесты) не создают активный указатель
    }
    event.preventDefault();
  }

  function chipPointerMove(event, which, chip) {
    const st = stateOf(which);
    const node = event.currentTarget || chip;
    if (!st.drag || st.drag.uid !== node.dataset.uid) return;
    const boardRect = boardOf(which).getBoundingClientRect();
    // Не ограничиваем фишку краем стола: её можно визуально утащить на панель.
    const x = event.clientX - boardRect.left - st.drag.dx;
    const y = event.clientY - boardRect.top - st.drag.dy;
    if (Math.abs(x - st.drag.x) > 3 || Math.abs(y - st.drag.y) > 3) st.drag.moved = true;
    st.drag.x = x;
    st.drag.y = y;
    node.style.left = Math.round(x) + 'px';
    node.style.top = Math.round(y) + 'px';

    const panel = panelOf(which);
    if (panel) {
      panel.classList.toggle('is-drop-target', pointInRect(event.clientX, event.clientY, panel.getBoundingClientRect()));
    }
  }

  function restoreChipPosition(which, node, drag) {
    if (!drag) return;
    node.style.left = Math.round(drag.originX) + 'px';
    node.style.top = Math.round(drag.originY) + 'px';
    boardOf(which).classList.remove('is-dragging');
  }

  function chipPointerCancel(event, which, chip) {
    const st = stateOf(which);
    const node = event.currentTarget || chip;
    const drag = st.drag;
    if (drag && drag.uid === node.dataset.uid) st.drag = null;
    node.classList.remove('is-dragging');
    const panel = panelOf(which);
    if (panel) panel.classList.remove('is-drop-target');
    restoreChipPosition(which, node, drag);
  }

  function chipPointerUp(event, which, chip) {
    const st = stateOf(which);
    const node = event.currentTarget || chip;
    if (!st.drag || st.drag.uid !== node.dataset.uid) return;
    node.classList.remove('is-dragging');
    boardOf(which).classList.remove('is-dragging');
    const drag = st.drag;
    st.drag = null;

    const panel = panelOf(which);
    if (panel) {
      panel.classList.remove('is-drop-target');
      // Вернули фишку на панель — убираем её со стола, коллекция не меняется.
      if (pointInRect(event.clientX, event.clientY, panel.getBoundingClientRect())) {
        removeBoardChip(which, node);
        Sound.play('delete');
        toast('🧹', 'Элемент убран со стола');
        return;
      }
    }

    // Ищем соседа под курсором.
    const boardRect = boardOf(which).getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    let target = null;
    for (const other of st.chips.values()) {
      if (other === node) continue;
      const r = other.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        target = other;
        break;
      }
    }

    if (target) {
      const a = node.dataset.element;
      const b = target.dataset.element;
      if (which === 'editor') {
        applyEditorPair(a, b, node, target, event.altKey);
      } else {
        attemptPlayCraft(a, b, [node, target]);
      }
      return;
    }

    if (!drag.moved) {
      if (which === 'editor') selectEditorChip(node, event);
      else selectPlayChip(node);
      return;
    }

    // Отпустили вне стола и не на панели — возвращаем фишку на место.
    if (!pointInRect(x, y, boardRect)) {
      restoreChipPosition(which, node, drag);
      return;
    }

    // Внутри стола фишка не должна остаться наполовину за краем.
    node.style.left = Math.round(Math.max(0, Math.min(boardRect.width - node.offsetWidth, drag.x))) + 'px';
    node.style.top = Math.round(Math.max(0, Math.min(boardRect.height - node.offsetHeight, drag.y))) + 'px';
  }

  function clearSelection(which) {
    const st = stateOf(which);
    st.chips.forEach((node) => node.classList.remove('is-selected'));
    st.selected = null;
  }

  function removeBoardChip(which, node) {
    if (!node) return;
    const st = stateOf(which);
    const uid = node.dataset.uid;
    node.remove();
    if (uid) st.chips.delete(uid);
    if (st.selected === node) st.selected = null;
    if (!st.chips.size) {
      if (which === 'editor') dom.editorEmpty.hidden = false;
      else dom.playEmpty.hidden = false;
    }
    if (which === 'editor') updateEditorStats();
    else updatePlayStats();
  }

  function midpointOf(nodes, which) {
    const board = boardOf(which);
    const boardRect = board.getBoundingClientRect();
    const rects = (nodes || [])
      .filter((node) => node && node.isConnected)
      .map((node) => node.getBoundingClientRect());
    if (rects.length) {
      const x = rects.reduce((sum, r) => sum + r.left + r.width / 2, 0) / rects.length - boardRect.left;
      const y = rects.reduce((sum, r) => sum + r.top + r.height / 2, 0) / rects.length - boardRect.top;
      return { x: x + 18, y: y + 18 };
    }
    return { x: boardRect.width * 0.45, y: boardRect.height * 0.45 };
  }

  function selectEditorChip(node, event) {
    const previous = editor.selected;
    if (previous && previous !== node) {
      const a = previous.dataset.element;
      const b = node.dataset.element;
      clearSelection('editor');
      applyEditorPair(a, b, previous, node, event && event.altKey);
      return;
    }
    const same = previous === node;
    clearSelection('editor');
    if (same) return;
    Sound.play('click');
    editor.selected = node;
    node.classList.add('is-selected');
  }

  // Если правило для пары уже есть — сразу даём результат, а не спрашиваем снова.
  // Alt+соединение открывает окно, чтобы правило можно было заменить.
  function applyEditorPair(aId, bId, nodeA, nodeB, forceDialog) {
    const rule = editor.index.byPair[Modes.pairKey(aId, bId)];
    const el = rule && editorElement(rule.result);
    if (el && !forceDialog) {
      const position = midpointOf([nodeA, nodeB], 'editor');
      removeBoardChip('editor', nodeA);
      removeBoardChip('editor', nodeB);
      editorAddEl(el, position.x, position.y);
      Sound.play('success');
      toast('✅', `${el.name}`);
      return true;
    }
    Sound.play('click');
    openCraftDialogEditor(aId, bId, nodeA, nodeB);
    return false;
  }

  function selectPlayChip(node) {
    const previous = play.selected;
    if (previous && previous !== node) {
      const a = previous.dataset.element;
      const b = node.dataset.element;
      clearSelection('play');
      attemptPlayCraft(a, b, [previous, node]);
      return;
    }
    const same = previous === node;
    clearSelection('play');
    if (same) return;
    Sound.play('click');
    play.selected = node;
    node.classList.add('is-selected');
  }

  /* ---------------- крафт в редакторе ---------------- */

  const craft = {
    mode: 'editor',
    a: null,
    b: null,
    nodes: [],
    tab: 'existing',
    chosen: null,
  };

  function ensureElement(name, emoji, hue) {
    const existing = (editor.mode.elements || []).find(
      (el) => Emoji.normalize(el.name) === Emoji.normalize(name)
    );
    if (existing) return existing;
    const el = {
      id: Modes.uid('x') + '-' + (Modes.slug(name) || 'element'),
      name,
      emoji: emoji || Emoji.pick(name),
      hue: typeof hue === 'number' ? hue : Emoji.hue(name),
    };
    editor.mode.elements.push(el);
    return el;
  }

  function openCraftDialogEditor(aId, bId, nodeA, nodeB) {
    const a = editorElement(aId);
    const b = editorElement(bId);
    if (!a || !b) return;
    craft.mode = 'editor';
    craft.a = aId;
    craft.b = bId;
    craft.nodes = [nodeA, nodeB].filter(Boolean);
    craft.tab = 'new';
    craft.chosen = null;
    dom.craftPair.textContent = '';
    dom.craftPair.append(chipNode(a), (() => {
      const plus = document.createElement('span');
      plus.className = 'pair-plus';
      plus.textContent = '+';
      return plus;
    })(), chipNode(b), (() => {
      const arrow = document.createElement('span');
      arrow.className = 'pair-plus';
      arrow.textContent = '→';
      return arrow;
    })());
    dom.craftHint.textContent = '';
    dom.craftHint.classList.remove('is-error');
    dom.craftName.value = '';
    dom.craftEmoji.value = '';
    delete dom.craftEmoji.dataset.touched;
    dom.craftSearch.value = '';
    setCraftTab('new');
    renderCraftExisting('');
    openDialog(dom.craftDialog);
    setTimeout(() => dom.craftName.focus(), 60);

    // Если правило уже есть — подставим его.
    const rule = editor.index.byPair[Modes.pairKey(aId, bId)];
    if (rule) {
      const el = editorElement(rule.result);
      if (el) {
        dom.craftHint.textContent = `Сейчас: ${el.name}. Можно заменить.`;
      }
    }
  }

  function setCraftTab(tab) {
    craft.tab = tab;
    document.querySelectorAll('#craftDialog .tab').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.tab === tab);
    });
    dom.craftExistingPane.hidden = tab !== 'existing';
    dom.craftNewPane.hidden = tab !== 'new';
    if (tab === 'new' && !dom.craftName.value) {
      setTimeout(() => dom.craftName.focus(), 60);
    }
  }

  function renderCraftExisting(query) {
    const q = Emoji.normalize(query);
    dom.craftExisting.textContent = '';
    const frag = document.createDocumentFragment();
    const list = Modes.allElements(editor.mode)
      .filter((el) => !q || Emoji.normalize(el.name).includes(q))
      .sort((a, b) => Number(!!b.base) - Number(!!a.base) || a.name.localeCompare(b.name, 'ru'));
    if (!list.length) {
      const empty = document.createElement('div');
      empty.className = 'hint';
      empty.textContent = 'Ничего не нашлось. Придумайте новый элемент на вкладке «Придумать новый».';
      frag.append(empty);
    }
    list.forEach((el) => {
      // В окне крафта это интерактивные кнопки, а не просто декоративные чипы.
      const node = document.createElement('button');
      node.type = 'button';
      node.className = 'mini-chip is-pickable';
      node.style.setProperty('--h', el.hue || 260);
      const emojiSpan = document.createElement('span');
      emojiSpan.className = 'mini-emoji';
      emojiSpan.textContent = el.emoji || '✨';
      const nameSpan = document.createElement('span');
      nameSpan.textContent = el.name;
      node.append(emojiSpan, nameSpan);
      node.style.cursor = 'pointer';
      node.dataset.element = el.id;
      node.addEventListener('click', () => {
        craft.chosen = el.id;
        dom.craftHint.textContent = `Выбрано: ${el.name}`;
        dom.craftHint.classList.remove('is-error');
        commitCraftChoice(el.id);
      });
      frag.append(node);
    });
    dom.craftExisting.append(frag);
  }

  function commitCraftChoice(resultId) {
    const key = Modes.pairKey(craft.a, craft.b);
    const position = midpointOf(craft.nodes, 'editor');
    editor.mode.rules = (editor.mode.rules || []).filter((rule) => Modes.pairKey(rule.a, rule.b) !== key);
    editor.mode.rules.push({ a: craft.a, b: craft.b, result: resultId });
    editor.mode.updatedAt = Date.now();
    editor.index = Modes.buildIndex(editor.mode);

    // Два ингредиента исчезают со стола, вместо них появляется результат.
    (craft.nodes || []).forEach((node) => removeBoardChip('editor', node));
    craft.nodes = [];
    const el = editor.index.byId[resultId];
    editorAddEl(el, position.x, position.y);
    Sound.play('new');

    renderEditorSidebar();
    closeDialog(dom.craftDialog);
    markDirty();
    toast('✨', `Правило добавлено: ${el.name}`);
  }

  function confirmCraftNew() {
    const name = dom.craftName.value.trim().replace(/\s+/g, ' ');
    if (!name) {
      dom.craftHint.textContent = 'Введите название нового элемента.';
      dom.craftHint.classList.add('is-error');
      dom.craftName.focus();
      Sound.play('error');
      return;
    }
    if (CraftFilter.find(name)) {
      dom.craftHint.textContent = 'В названии есть недопустимое слово — выберите другое.';
      dom.craftHint.classList.add('is-error');
      dom.craftName.focus();
      Sound.play('error');
      return;
    }
    const duplicate = (editor.mode.elements || []).find(
      (el) => Emoji.normalize(el.name) === Emoji.normalize(name)
    );
    if (duplicate) {
      dom.craftHint.textContent = `«${duplicate.name}» уже есть в режиме — выберите его на первой вкладке.`;
      dom.craftHint.classList.add('is-error');
      Sound.play('error');
      return;
    }
    let emoji = dom.craftEmoji.value.trim();
    if (!emoji) emoji = Emoji.pick(name);
    const el = ensureElement(name, emoji);
    commitCraftChoice(el.id);
  }

  /* ---------------- крафт в игре ---------------- */

  function playChipNodes(aId, bId) {
    const all = [...play.chips.values()];
    const first = all.find((node) => node.dataset.element === aId);
    const second = all.find((node) => node !== first && node.dataset.element === bId);
    return [first, second].filter(Boolean);
  }

  function attemptPlayCraft(aId, bId, nodes) {
    const key = Modes.pairKey(aId, bId);
    const rule = play.index.byPair[key];
    if (!rule) {
      // Без всплывающего уведомления: просто короткий звук неудачи.
      Sound.play('error');
      return;
    }

    const sources = (Array.isArray(nodes) && nodes.length ? nodes : playChipNodes(aId, bId))
      .filter((node) => node && node.isConnected);
    const position = midpointOf(sources, 'play');
    const resultEl = play.index.byId[rule.result];
    const isNew = !play.open[rule.result];

    if (isNew) {
      play.open[rule.result] = true;
      Storage.savePlayState(play.mode.id, { open: openElements() });
      Sound.play('new');
      toast('✨', `Новый элемент: ${resultEl.name}`);
    } else {
      Sound.play('success');
      toast('🔁', `${resultEl.name} уже открыт`);
    }
    setSaveState('Сохранено', 'saved');

    // Ингредиенты исчезают, результат появляется на столе.
    sources.forEach((node) => removeBoardChip('play', node));
    playAddEl(rule.result, position.x, position.y);
    renderPlaySidebar();
    updatePlayStats();
  }

  /* =========================================================
     ЛОББИ И КАТАЛОГ
     ========================================================= */

  let catalogCache = [];

  function modeCard(mode) {
    const card = document.createElement('div');
    card.className = 'mode-card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');

    const head = document.createElement('div');
    head.className = 'mode-card-head';
    const badge = document.createElement('span');
    badge.className = 'mode-badge';
    badge.style.setProperty('--h', mode.hue || 260);
    badge.textContent = mode.emoji || '🧩';
    const titles = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'mode-name';
    name.textContent = mode.name || 'Без названия';
    const author = document.createElement('div');
    author.className = 'mode-author';
    author.textContent = mode.author || 'Аноним';
    titles.append(name, author);
    head.append(badge, titles);

    const desc = document.createElement('p');
    desc.className = 'mode-desc';
    desc.textContent = mode.description || 'Без описания';

    const foot = document.createElement('div');
    foot.className = 'mode-foot';
    const count = document.createElement('span');
    const total = (mode.base || []).length + (mode.elements || []).length;
    count.textContent = `${total} ${elWord(total)}`;
    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.textContent = '·';
    const rules = document.createElement('span');
    rules.textContent = `${(mode.rules || []).length} правил`;
    foot.append(count, dot, rules);

    const report = document.createElement('button');
    report.type = 'button';
    report.className = 'mode-report';
    report.textContent = '🚩';
    report.title = 'Пожаловаться на режим';
    report.setAttribute('aria-label', 'Пожаловаться на режим');
    report.addEventListener('click', (e) => {
      e.stopPropagation();
      openReportDialog(mode);
    });
    foot.append(report);

    const like = document.createElement('button');
    like.type = 'button';
    const liked = Storage.likedIds().has(mode.id);
    like.className = 'mode-like' + (liked ? ' is-liked' : '');
    like.dataset.like = mode.id;
    like.innerHTML = '<span aria-hidden="true"></span><span></span>';
    like.children[0].textContent = liked ? '❤️' : '🤍';
    like.children[1].textContent = String(mode.likes || 0);
    like.title = 'Нравится';
    like.addEventListener('click', (e) => {
      e.stopPropagation();
      const nowLiked = Storage.toggleLike(mode.id);
      mode.likes = Math.max(0, (mode.likes || 0) + (nowLiked ? 1 : -1));
      like.classList.toggle('is-liked', nowLiked);
      like.children[0].textContent = nowLiked ? '❤️' : '🤍';
      like.children[1].textContent = String(mode.likes);
      if (!mode.mine) Storage.likeRemote(mode.id);
      const own = Storage.listModes().find((m) => m.id === mode.id);
      if (own) {
        own.likes = mode.likes;
        Storage.upsertMode(own);
      }
    });
    foot.append(like);

    card.append(head, desc, foot);
    card.addEventListener('click', () => startPlay(mode));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        startPlay(mode);
      }
    });

    if (mode.mine) {
      const tools = document.createElement('div');
      tools.className = 'mode-foot';
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'btn btn--small';
      edit.textContent = '✏️ Править';
      edit.addEventListener('click', (e) => {
        e.stopPropagation();
        startEditor(mode);
      });
      const publish = document.createElement('button');
      publish.type = 'button';
      publish.className = 'btn btn--small';
      publish.textContent = mode.remoteId ? '🌐 Опубликован' : '🌐 Опубликовать';
      publish.disabled = Boolean(mode.remoteId);
      publish.title = mode.remoteId
        ? 'Режим уже есть в каталоге. Изменения публикуются как новый режим.'
        : 'Опубликовать в общем каталоге';
      publish.addEventListener('click', (e) => {
        e.stopPropagation();
        openPublishDialog(mode);
      });
      const share = document.createElement('button');
      share.type = 'button';
      share.className = 'btn btn--small';
      share.textContent = '🔗 Ссылка';
      share.addEventListener('click', (e) => {
        e.stopPropagation();
        shareMode(mode);
      });
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'btn btn--small btn--ghost';
      remove.textContent = '🗑';
      remove.title = 'Удалить режим';
      remove.addEventListener('click', async (e) => {
        e.stopPropagation();
        const ok = await confirmAction('Удалить режим?', `«${mode.name || 'Без названия'}» будет удалён из ваших режимов.`, 'Удалить');
        if (!ok) return;
        Storage.removeMode(mode.id);
        Storage.clearPlayState(mode.id);
        renderLobby();
        toast('🗑', 'Режим удалён');
      });
      tools.append(edit, publish, share, remove);
      card.append(tools);
    }

    return card;
  }

  function renderCatalog() {
    const query = Emoji.normalize(dom.catalogSearch.value);
    const others = catalogCache.filter((m) => !m.mine).filter((m) => {
      if (!query) return true;
      return [m.name, m.author, m.description].some((value) => Emoji.normalize(value).includes(query));
    });
    dom.catalogModes.textContent = '';
    dom.catalogEmpty.hidden = others.length > 0;
    dom.catalogCount.textContent = others.length ? `${others.length}` : '';
    if (!others.length) {
      dom.catalogEmpty.textContent = query
        ? 'По этому запросу ничего не нашлось.'
        : 'Каталог пуст. Скоро здесь появятся режимы других игроков.';
    }
    others.forEach((mode) => dom.catalogModes.append(modeCard(mode)));
  }

  async function renderLobby() {
    const own = Storage.listModes();
    dom.myModes.textContent = '';
    dom.myEmpty.hidden = own.length > 0;
    dom.myCount.textContent = own.length ? `${own.length}` : '';
    own.slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).forEach((mode) => {
      dom.myModes.append(modeCard(Object.assign({ mine: true }, mode)));
    });

    catalogCache = await Storage.catalog();
    renderCatalog();
  }

  /* ---------------- публикация ---------------- */

  let publishing = null;

  function openPublishDialog(mode) {
    if (!isOwnMode(mode)) {
      toast('🔒', 'Чужой режим нельзя опубликовать');
      return;
    }
    publishing = mode;
    dom.publishName.value = mode.name || '';
    dom.publishDesc.value = mode.description || '';
    dom.publishEmoji.value = mode.emoji || '🧩';
    dom.publishAuthor.value = mode.author || Storage.author();
    dom.publishHint.textContent = '';
    dom.publishHint.classList.remove('is-error');
    updatePublishPreview();
    openDialog(dom.publishDialog);
    setTimeout(() => dom.publishName.focus(), 60);
  }

  function updatePublishPreview() {
    const total = (publishing.base || []).length + (publishing.elements || []).length;
    dom.publishPreview.innerHTML = '';
    const emoji = document.createElement('span');
    emoji.style.fontSize = '18px';
    emoji.style.fontFamily = 'var(--emoji)';
    emoji.textContent = dom.publishEmoji.value.trim() || '🧩';
    const text = document.createElement('span');
    text.append('Режим: ');
    const b = document.createElement('b');
    b.textContent = dom.publishName.value.trim() || 'Без названия';
    text.append(b, ` · ${total} ${elWord(total)} · ${(publishing.rules || []).length} правил`);
    dom.publishPreview.append(emoji, text);
  }

  async function confirmPublish() {
    const name = dom.publishName.value.trim().replace(/\s+/g, ' ');
    if (!name) {
      dom.publishHint.textContent = 'Введите название режима.';
      dom.publishHint.classList.add('is-error');
      dom.publishName.focus();
      return;
    }
    const description = dom.publishDesc.value.trim();
    const author = dom.publishAuthor.value.trim() || 'Аноним';
    const emoji = dom.publishEmoji.value.trim() || '🧩';
    if (CraftFilter.checkMode({ name, description, author, elements: publishing.elements })) {
      dom.publishHint.textContent = 'В названии, описании или имени автора есть недопустимое слово.';
      dom.publishHint.classList.add('is-error');
      return;
    }
    Storage.setAuthor(author);
    const mode = Object.assign({}, publishing, {
      name,
      description,
      author,
      emoji,
      updatedAt: Date.now(),
    });
    const clean = Modes.normalize(mode);
    Storage.upsertMode(clean);
    publishing = clean;

    dom.publishConfirm.disabled = true;
    dom.publishHint.textContent = 'Публикуем…';
    let remote = { ok: false, queued: true };
    try {
      remote = await Storage.publishRemote(clean);
    } catch (error) {
      dom.publishHint.textContent = 'Сервер недоступен — режим сохранён локально.';
      dom.publishHint.classList.add('is-error');
    } finally {
      dom.publishConfirm.disabled = false;
    }

    if (remote.ok && remote.id) {
      clean.remoteId = remote.id;
      Storage.upsertMode(clean);
      publishing = clean;
    }

    closeDialog(dom.publishDialog);
    setSaveState('Сохранено', 'saved');
    renderLobby();
    Sound.play(remote.ok ? 'publish' : 'success');
    if (remote.ok) toast('🌐', 'Режим опубликован в каталоге');
    else toast('💾', 'Режим сохранён. В каталоге он появится, когда подключим сервер');
  }

  /* ---------------- обмен ссылкой и файлом ---------------- */

  let reporting = null;

  function openReportDialog(mode) {
    if (!mode) {
      toast('🚩', 'Сначала откройте режим');
      return;
    }
    reporting = mode;
    dom.reportModeName.textContent = `«${mode.name || 'Без названия'}»`;
    dom.reportReason.value = 'bad_words';
    dom.reportComment.value = '';
    dom.reportHint.textContent = '';
    dom.reportHint.classList.remove('is-error');
    dom.reportSend.disabled = false;
    openDialog(dom.reportDialog);
  }

  async function confirmReport() {
    if (!reporting) return;
    dom.reportSend.disabled = true;
    dom.reportHint.textContent = 'Отправляем…';
    dom.reportHint.classList.remove('is-error');
    try {
      const result = await Storage.reportMode(
        reporting,
        dom.reportReason.value,
        dom.reportComment.value.trim()
      );
      closeDialog(dom.reportDialog);
      Sound.play('report');
      if (result.local) {
        toast('🚩', 'Сервер не подключён — жалоба сохранена локально');
      } else {
        toast('🚩', 'Жалоба отправлена администратору');
      }
      reporting = null;
    } catch (error) {
      dom.reportHint.textContent = 'Не удалось отправить жалобу: ' + error.message;
      dom.reportHint.classList.add('is-error');
      Sound.play('error');
    } finally {
      dom.reportSend.disabled = false;
    }
  }

  function shareMode(mode) {
    const data = Modes.toExport(mode);
    const encoded = encodeURIComponent(JSON.stringify(data));
    const url = `${location.origin}${location.pathname}#share=${encoded}`;
    const fallback = () => {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.append(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        toast('🔗', 'Ссылка скопирована');
      } catch {
        toast('🔗', 'Не удалось скопировать — ссылка в консоли');
        console.log(url);
      }
      textarea.remove();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => toast('🔗', 'Ссылка скопирована'), fallback);
    } else {
      fallback();
    }
  }

  function importFromFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = JSON.parse(String(reader.result));
        const mode = Modes.fromExport(raw);
        if (!mode) throw new Error('Неизвестный формат');
        if (CraftFilter.checkMode(mode)) {
          toast('⚠️', 'В режиме есть недопустимые слова — файл не загружен');
          return;
        }
        mode.author = mode.author || 'Аноним';
        Storage.upsertMode(mode);
        renderLobby();
        toast('📥', `Загружен режим «${mode.name}»`);
        startEditor(mode);
      } catch {
        toast('⚠️', 'Файл не подошёл — нужен JSON из Craft Modes');
      }
    };
    reader.readAsText(file);
  }

  function importFromHash() {
    const hash = location.hash || '';
    const marker = '#share=';
    if (!hash.startsWith(marker)) return;
    try {
      const raw = JSON.parse(decodeURIComponent(hash.slice(marker.length)));
      const mode = Modes.fromExport(raw);
      if (!mode) throw new Error('bad');
      if (CraftFilter.checkMode(mode)) {
        toast('⚠️', 'В режиме есть недопустимые слова');
        return;
      }
      const list = Storage.listModes();
      const same = list.find((m) => m.name === mode.name && (m.rules || []).length === mode.rules.length);
      if (same) {
        history.replaceState(null, '', location.pathname);
        startPlay(same);
        return;
      }
      Storage.upsertMode(mode);
      history.replaceState(null, '', location.pathname);
      renderLobby();
      toast('🔗', `Открыт режим «${mode.name}» — он сохранён в ваших режимах`);
      startPlay(mode);
    } catch {
      toast('⚠️', 'Ссылка повреждена');
    }
  }

  /* =========================================================
     СОХРАНЕНИЕ РЕЖИМА
     ========================================================= */

  function saveModeFromEditor() {
    const mode = editor.mode;
    if (mode.rules.length === 0) {
      toast('⚠️', 'Добавьте хотя бы одно правило крафта');
      return;
    }
    const clean = Modes.normalize(Object.assign({}, mode, { updatedAt: Date.now() }));
    if (CraftFilter.checkMode(clean)) {
      toast('⚠️', 'В режиме есть недопустимые слова');
      return;
    }
    const hasName = Boolean(clean.name && clean.name.trim());
    if (!hasName || !(clean.author || '')) {
      openPublishDialog(clean);
      return;
    }
    Storage.upsertMode(clean);
    editor.mode = clean;
    dom.editorTitle.textContent = clean.name;
    setSaveState('Сохранено', 'saved');
    toast('💾', 'Режим сохранён');
    renderLobby();
  }

  /* =========================================================
     СОБЫТИЯ
     ========================================================= */

  function bind() {
    dom.btnCreate.addEventListener('click', () => startEditor(Modes.emptyMode()));
    dom.btnCreate2.addEventListener('click', () => startEditor(Modes.emptyMode()));
    dom.btnLobby.addEventListener('click', () => {
      if (editor.mode) { /* можно потом спросить про несохранённое */ }
      showScreen('lobby');
      history.replaceState(null, '', location.pathname);
    });
    dom.brandLink.addEventListener('click', (e) => {
      e.preventDefault();
      showScreen('lobby');
    });

    dom.btnImport.addEventListener('click', () => dom.fileInput.click());
    dom.fileInput.addEventListener('change', () => {
      const file = dom.fileInput.files && dom.fileInput.files[0];
      if (file) importFromFile(file);
      dom.fileInput.value = '';
    });

    dom.btnMenu.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleMenu();
    });
    document.addEventListener('click', (event) => {
      if (dom.menu.hidden) return;
      if (!event.target.closest('#menu, #btnMenu')) closeMenu();
    });
    dom.menu.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action]');
      if (!button) return;
      const action = button.dataset.action;
      closeMenu();
      const mode = currentMode();
      if (action === 'save') saveCurrent();
      else if (action === 'publish') {
        if (!mode) toast('🌐', 'Сначала откройте режим');
        else if (!isOwnMode(mode)) toast('🔒', 'Чужой режим нельзя опубликовать');
        else openPublishDialog(mode);
      } else if (action === 'recipes') {
        openRecipesDialog();
      } else if (action === 'report') {
        if (mode) openReportDialog(mode);
        else toast('🚩', 'Сначала откройте режим');
      } else if (action === 'share') {
        if (mode) shareMode(mode);
        else toast('🔗', 'Сначала откройте режим');
      } else if (action === 'clear') clearCurrentBoard();
      else if (action === 'restart') {
        if (!dom.screenPlay.hidden && play.mode) {
          Storage.clearPlayState(play.mode.id);
          startPlay(play.mode);
          toast('↺', 'Режим начат заново');
        } else if (!dom.screenEditor.hidden) {
          clearEditorBoard();
        }
      } else if (action === 'import') {
        dom.fileInput.click();
      } else if (action === 'lobby') {
        showScreen('lobby');
        history.replaceState(null, '', location.pathname);
      }
    });
    dom.savePill.addEventListener('click', saveCurrent);
    dom.btnClearEditor.addEventListener('click', clearEditorBoard);
    dom.btnClearPlay.addEventListener('click', clearPlayBoard);
    dom.btnRecipes.addEventListener('click', openRecipesDialog);
    dom.recipesSearch.addEventListener('input', renderRecipes);

    dom.catalogSearch.addEventListener('input', renderCatalog);

    dom.editorSearch.addEventListener('input', () => {
      editor.search = dom.editorSearch.value;
      renderEditorSidebar();
    });
    dom.playSearch.addEventListener('input', () => {
      play.search = dom.playSearch.value;
      renderPlaySidebar();
    });

    // Какой раздел версии открыть по хешу.
    dom.btnSaveMode.addEventListener('click', saveModeFromEditor);

    dom.btnPlayRestart.addEventListener('click', () => {
      if (!play.mode) return;
      Storage.clearPlayState(play.mode.id);
      startPlay(play.mode);
      toast('↺', 'Режим начат заново');
    });

    // Окно крафта.
    document.querySelectorAll('#craftDialog .tab').forEach((btn) => {
      btn.addEventListener('click', () => setCraftTab(btn.dataset.tab));
    });
    dom.craftSearch.addEventListener('input', () => renderCraftExisting(dom.craftSearch.value));
    dom.craftName.addEventListener('input', () => {
      const name = dom.craftName.value.trim();
      if (name && !dom.craftEmoji.dataset.touched) {
        dom.craftEmoji.value = Emoji.pick(name);
      }
      dom.craftEmojiHint.textContent = name
        ? `Эмодзи подобрался по названию — его можно заменить.`
        : 'Эмодзи подберётся сам — его можно заменить.';
    });
    dom.craftEmoji.addEventListener('input', () => {
      dom.craftEmoji.dataset.touched = '1';
    });
    dom.craftConfirm.addEventListener('click', () => {
      if (craft.tab === 'new') confirmCraftNew();
      else if (craft.chosen) commitCraftChoice(craft.chosen);
      else {
        dom.craftHint.textContent = 'Выберите элемент из списка или перейдите на вкладку «Придумать новый».';
        dom.craftHint.classList.add('is-error');
      }
    });
    dom.craftCancel.addEventListener('click', () => closeDialog(dom.craftDialog));

    // Публикация.
    dom.publishName.addEventListener('input', updatePublishPreview);
    dom.publishEmoji.addEventListener('input', updatePublishPreview);
    dom.publishConfirm.addEventListener('click', confirmPublish);
    dom.publishCancel.addEventListener('click', () => closeDialog(dom.publishDialog));

    // Звук.
    if (dom.btnSound) {
      dom.btnSound.addEventListener('click', () => {
        Sound.toggle();
        updateSoundButton();
      });
    }
    document.addEventListener('pointerdown', () => Sound.unlock(), { passive: true });
    document.addEventListener('keydown', () => Sound.unlock());

    // Жалоба.
    dom.reportSend.addEventListener('click', confirmReport);
    dom.reportCancel.addEventListener('click', () => closeDialog(dom.reportDialog));

    // Закрытие модалок по кнопке и клику на фон.
    document.querySelectorAll('[data-close]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const dialog = btn.closest('dialog');
        if (dialog) closeDialog(dialog);
      });
    });
    document.querySelectorAll('dialog.modal').forEach((dialog) => {
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) closeDialog(dialog);
      });
    });
  }

  /* =========================================================
     СТАРТ
     ========================================================= */

  function initAdminShortcut() {
    let buffer = '';
    document.addEventListener('keydown', (event) => {
      const target = event.target;
      if (target && target.closest && target.closest('input, textarea, select, [contenteditable="true"]')) {
        buffer = '';
        return;
      }
      // Пробелы и служебные клавиши не должны сбрасывать код: можно набирать
      // «8 7 4 2 3» с пробелами или на цифровой клавиатуре.
      if (event.key === ' ' || event.key === 'Spacebar' || event.key === 'Tab') return;
      if (event.ctrlKey || event.altKey || event.metaKey) return;

      let digit = '';
      if (/^\d$/.test(event.key)) digit = event.key;
      else if (/^Numpad\d$/.test(event.code || '')) digit = event.code.slice(-1);
      if (!digit) {
        buffer = '';
        return;
      }

      buffer = (buffer + digit).slice(-5);
      if (buffer === '87423') {
        buffer = '';
        event.preventDefault();
        // Пароль не хранится во фронтенде: admin.html проверяет его через Supabase Auth.
        toast('🔐', 'Открываем вход администратора');
        setTimeout(() => window.location.assign('admin.html'), 150);
      }
    });
  }

  function boot() {
    if (window.CraftEmojiPicker) window.CraftEmojiPicker.init();
    bind();
    updateSoundButton();
    initAdminShortcut();
    renderLobby();
    if (location.hash.startsWith('#share=')) importFromHash();

    // Отладочный доступ для тестов и консоли.
    if (new URLSearchParams(location.search).has('debug')) {
      window.__craftModes = {
        Storage,
        Modes,
        state() {
          return {
            screen: dom.screenLobby.hidden ? (dom.screenEditor.hidden ? 'play' : 'editor') : 'lobby',
            editor: editor.mode ? { elements: editor.mode.elements.length, rules: editor.mode.rules.length } : null,
            play: play.mode ? { open: openElements().length, total: Modes.reachable(play.mode).count } : null,
          };
        },
        newMode() {
          startEditor(Modes.emptyMode());
          return true;
        },
        openCraft(a, b) {
          openCraftDialogEditor(a, b);
          return true;
        },
        selectedPair() {
          return craft.a && craft.b ? craft.a + ' + ' + craft.b : null;
        },
        setRule(a, b, name, emoji) {
          const el = ensureElement(name, emoji || Emoji.pick(name));
          const key = Modes.pairKey(a, b);
          editor.mode.rules = editor.mode.rules.filter((r) => Modes.pairKey(r.a, r.b) !== key);
          editor.mode.rules.push({ a, b, result: el.id });
          editor.index = Modes.buildIndex(editor.mode);
          renderEditorSidebar();
          return el.id;
        },
        save(name, author) {
          editor.mode.name = name;
          editor.mode.author = author || 'Тест';
          const clean = Modes.normalize(editor.mode);
          Storage.upsertMode(clean);
          editor.mode = clean;
          renderLobby();
          return clean.id;
        },
        play(id) {
          const mode = Storage.listModes().find((m) => m.id === id);
          if (!mode) return false;
          startPlay(mode);
          return true;
        },
        playForeign(id) {
          const mode = Storage.listModes().find((m) => m.id === id);
          if (!mode) return false;
          startPlay(Object.assign({}, mode, { id: mode.id + '-foreign', mine: false }));
          return true;
        },
        attempt(a, b) {
          attemptPlayCraft(a, b);
          return openElements();
        },
        openElements: () => openElements(),
        catalog: () => Storage.catalog(),
      };
    }
  }

  boot();
})();


