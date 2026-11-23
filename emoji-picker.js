/* =========================================================
   Emoji keyboard: категории, поиск и выбор эмодзи.
   ========================================================= */
(function (global) {
  'use strict';

  const GROUPS = [
    {
      id: 'smile',
      title: 'Смайлы',
      icon: '😀',
      items: '😀 😃 😄 😁 😆 😅 😂 🤣 🙂 🙃 😉 😊 😇 🥰 😍 🤩 😘 😗 😚 😙 😋 😛 😜 🤪 😝 🤑 🤗 🤭 🤫 🤔 🤐 🤨 😐 😑 😶 😏 😒 🙄 😬 😮 😯 😲 😳 🥺 😢 😭 😱 😨 😰 😥 😓 🤯 😤 😠 😡 🤬 😈 👿 💀 💩 🤡 👻 👽 🤖 😺 😸 😹 😻 😼 😽 🙀 😿 😾'.split(' '),
    },
    {
      id: 'people',
      title: 'Люди',
      icon: '🧑',
      items: '👋 🤚 🖐️ ✋ 🖖 👌 🤌 🤏 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 🖕 👇 ☝️ 👍 👎 ✊ 👊 🤛 🤜 👏 🙌 👐 🤲 🤝 🙏 💅 🤳 💪 🦾 🦿 🦵 🦶 👂 🦻 👃 🧠 🫀 🫁 🦷 🦴 👀 👁️ 👅 👄 💋 🩸 👶 🧒 👦 👧 🧑 👨 👩 🧓 👴 👵 🧔 👱 👨‍🦰 👩‍🦰 👨‍🦱 👩‍🦱 👨‍🦳 👩‍🦳 👨‍🦲 👩‍🦲 🧕 👳 👲 🧙 🧚 🧛 🧜 🧝 🧞 🧟'.split(' '),
    },
    {
      id: 'animals',
      title: 'Животные',
      icon: '🐾',
      items: '🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🐔 🐧 🐦 🐤 🦆 🦅 🦉 🦇 🐺 🐗 🐴 🦄 🐝 🐛 🦋 🐌 🐞 🐜 🦂 🐢 🐍 🦎 🐙 🦑 🦐 🦞 🦀 🐡 🐠 🐟 🐬 🐳 🐋 🦈 🐊 🐅 🐆 🦓 🦍 🐘 🦏 🐪 🐫 🦒 🦘 🐃 🐂 🐄 🐎 🐖 🐏 🐑 🐐 🦌 🐕 🐩 🐈 🐓 🦃 🦚 🦜 🦢 🦩 🕊️ 🐇 🦝 🦨 🦦 🦥 🐁 🐀 🐿️ 🦔'.split(' '),
    },
    {
      id: 'food',
      title: 'Еда',
      icon: '🍕',
      items: '🍏 🍎 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🫐 🍈 🍒 🍑 🥭 🍍 🥥 🥝 🍅 🍆 🥑 🥦 🥬 🥒 🌶️ 🫑 🌽 🥕 🧄 🧅 🥔 🍠 🥐 🍞 🥖 🥨 🧀 🥚 🍳 🧈 🥞 🧇 🥓 🥩 🍗 🍖 🌭 🍔 🍟 🍕 🥪 🥙 🧆 🌮 🌯 🥗 🥘 🍝 🍜 🍲 🍛 🍣 🍱 🥟 🍤 🍙 🍚 🍘 🍥 🥠 🥮 🍢 🍡 🍧 🍨 🍦 🥧 🧁 🍰 🎂 🍮 🍭 🍬 🍫 🍿 🍩 🍪 🌰 🥜 🍯 🥛 🍼 ☕ 🍵 🧃 🥤 🍶 🍺 🍻 🥂 🍷 🥃 🍸 🍹 🧉'.split(' '),
    },
    {
      id: 'nature',
      title: 'Природа',
      icon: '🌿',
      items: '🌱 🌲 🌳 🌴 🌵 🌾 🌿 ☘️ 🍀 🍁 🍂 🍃 🌷 🌹 🥀 🌺 🌻 🌼 🌸 💐 🍄 🌰 🌊 🌈 ☀️ 🌤️ ⛅ 🌥️ ☁️ 🌦️ 🌧️ ⛈️ 🌩️ 🌨️ ❄️ ☃️ ⛄ 🌬️ 💨 🌪️ 🌫️ 💧 💦 ☔ ⚡ 🔥 🌋 🌍 🌎 🌏 🌑 🌒 🌓 🌔 🌕 🌖 🌗 🌘 🌙 🌚 🌛 🌜 🌝 🌞 ⭐ 🌟 💫 ✨ ☄️ 🪐'.split(' '),
    },
    {
      id: 'objects',
      title: 'Предметы',
      icon: '💡',
      items: '⌚ 📱 💻 ⌨️ 🖥️ 🖨️ 🖱️ 💽 💾 💿 📀 🎥 📷 📸 📹 📼 🔍 🔎 💡 🔦 🏮 🕯️ 📔 📕 📖 📗 📘 📙 📚 📓 📒 📃 📜 📄 📰 🗞️ 📑 🔖 🏷️ 💰 🪙 💳 💎 ⚖️ 🔧 🔨 ⚒️ 🛠️ ⛏️ 🔩 ⚙️ 🧱 ⛓️ 🧲 🔫 💣 🧨 🪓 🔪 🗡️ ⚔️ 🛡️ 🚬 ⚰️ 🏺 🔮 📿 🧿 💈 ⚗️ 🧪 🧫 🧬 🔬 🔭 📡 💉 💊 🩹 🩺 🚪 🛏️ 🛋️ 🪑 🚽 🪠 🚿 🛁 🧴 🧷 🧹 🧺 🧻 🧼 🪒 🧽 🧯 🛒 🎁 🎈 🎀 🎊 🎉'.split(' '),
    },
    {
      id: 'activity',
      title: 'Активности',
      icon: '🎮',
      items: '⚽ 🏀 🏈 ⚾ 🥎 🎾 🏐 🏉 🥏 🎱 🪀 🏓 🏸 🏒 🏑 🥍 🏏 🪃 🥅 ⛳ 🪁 🏹 🎣 🤿 🥊 🥋 🎽 🛹 🛼 🛷 ⛸️ 🥌 🎿 ⛷️ 🏂 🪂 🏋️ 🤼 🤸 ⛹️ 🤺 🤾 🏌️ 🏇 🧘 🏄 🏊 🤽 🚣 🧗 🚵 🚴 🏆 🥇 🥈 🥉 🏅 🎖️ 🎗️ 🎫 🎟️ 🎪 🎭 🎨 🎬 🎤 🎧 🎼 🎹 🥁 🪘 🎷 🎺 🪗 🎸 🪕 🎻 🎲 ♟️ 🎯 🎳 🎮 🎰 🧩'.split(' '),
    },
    {
      id: 'places',
      title: 'Места',
      icon: '🚗',
      items: '🚗 🚕 🚙 🚌 🚎 🏎️ 🚓 🚑 🚒 🚐 🛻 🚚 🚛 🚜 🛴 🚲 🛵 🏍️ 🛺 🚨 🚔 🚍 🚘 🚖 🚡 🚠 🚟 🚃 🚋 🚞 🚝 🚄 🚅 🚈 🚂 🚆 🚇 🚊 🚉 ✈️ 🛫 🛬 🛩️ 💺 🛰️ 🚀 🛸 🚁 🛶 ⛵ 🚤 🛥️ 🛳️ ⛴️ 🚢 ⚓ 🪝 🚧 🚦 🚥 🚏 🗺️ 🗿 🗽 🗼 🏰 🏯 🏟️ 🎡 🎢 🎠 ⛲ ⛱️ 🏖️ 🏝️ 🏜️ ⛰️ 🏔️ 🗻 🏕️ ⛺ 🏠 🏡 🏘️ 🏚️ 🏗️ 🏭 🏢 🏬 🏣 🏤 🏥 🏦 🏨 🏪 🏫 🏩 💒 🏛️ ⛪ 🕌 🕍 🛕 🕋 ⛩️'.split(' '),
    },
    {
      id: 'symbols',
      title: 'Символы',
      icon: '❤️',
      items: '❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 💟 ☮️ ✝️ ☪️ 🕉️ ☸️ ✡️ 🔯 🕎 ☯️ ☦️ 🛐 ⛎ ♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓ ⚛️ ☢️ ☣️ ❌ ⭕ 🛑 ⛔ 📛 🚫 💯 💢 ♨️ ⚠️ ♻️ ✅ ❇️ ✳️ ❎ 🌐 💠 Ⓜ️ 🌀 💤 ⚜️ 🔰 🔱 📶 ℹ️ 🔤 🔡 🔠 🆖 🆗 🆙 🆒 🆕 🆓 0️⃣ 1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣ 8️⃣ 9️⃣ 🔟 🔢 #️⃣ *️⃣ ▶️ ⏸️ ⏯️ ⏹️ ⏺️ ⏭️ ⏮️ ⏩ ⏪ ⏫ ⏬ ◀️ 🔼 🔽 ➡️ ⬅️ ⬆️ ⬇️ ↗️ ↘️ ↙️ ↖️ ↕️ ↔️ ↩️ ↪️ ⤴️ ⤵️ 🔀 🔁 🔂 🔄 🔃 ➕ ➖ ➗ ✖️ ♾️ 💲 💱 ©️ ®️ ™️ 🔚 🔙 🔛 🔝 🔜 〰️ ➰ ➿ ✔️ ☑️ 🔘 🔴 🟠 🟡 🟢 🔵 🟣 ⚫ ⚪ 🟤 🔺 🔻 🔸 🔹 🔶 🔷 🔳 🔲 ▪️ ▫️ ◾ ◽ ◼️ ◻️ 🟥 🟧 🟨 🟩 🟦 🟪 ⬛ ⬜ 🟫 🔈 🔇 🔉 🔊 🔔 🔕 📣 📢 💬 💭 🗯️ ♠️ ♣️ ♥️ ♦️ 🃏 🀄 🎴'.split(' '),
    },
  ];

  // Ключевые слова для поиска. Для остальных достаточно категории.
  const LABELS = {
    '😀': 'улыбка смайл радость смех',
    '😂': 'смех слёзы',
    '😍': 'любовь влюблённый',
    '😎': 'крутой очки',
    '😢': 'слёзы грусть',
    '😡': 'злость',
    '🤖': 'робот',
    '👻': 'призрак',
    '👽': 'инопланетянин',
    '💀': 'череп смерть',
    '💩': 'какашка',
    '🐶': 'собака пёс',
    '🐱': 'кот кошка',
    '🦊': 'лиса',
    '🐻': 'медведь',
    '🐼': 'панда',
    '🦁': 'лев',
    '🐸': 'жаба лягушка',
    '🐧': 'пингвин',
    '🦄': 'единорог',
    '🐉': 'дракон',
    '🐍': 'змея',
    '🐙': 'осьминог',
    '🦋': 'бабочка',
    '🐝': 'пчела',
    '🐢': 'черепаха',
    '🦈': 'акула',
    '🐬': 'дельфин',
    '🐳': 'кит',
    '🐘': 'слон',
    '🦒': 'жираф',
    '🐎': 'конь лошадь',
    '🐄': 'корова',
    '🐑': 'овца',
    '🐓': 'петух курица',
    '🦉': 'сова',
    '🦇': 'летучая мышь',
    '🕷️': 'паук',
    '🐌': 'улитка',
    '🐜': 'муравей',
    '🦂': 'скорпион',
    '🦎': 'ящерица',
    '🦕': 'динозавр',
    '🦖': 'динозавр',
    '🍄': 'гриб',
    '🌳': 'дерево',
    '🌲': 'ёлка лес',
    '🌵': 'кактус',
    '🌹': 'роза',
    '🌻': 'подсолнух',
    '🌷': 'тюльпан',
    '🌸': 'цветок сакура',
    '🍀': 'клевер удача',
    '🔥': 'огонь пламя',
    '💧': 'вода капля',
    '🌊': 'волна вода',
    '❄️': 'снег холод',
    '⚡': 'молния энергия',
    '☀️': 'солнце',
    '🌙': 'луна',
    '⭐': 'звезда',
    '🌈': 'радуга',
    '☁️': 'облако',
    '🌪️': 'торнадо',
    '🌋': 'вулкан',
    '🏔️': 'гора',
    '🏝️': 'остров',
    '🪐': 'планета',
    '🌍': 'земля планета',
    '🚀': 'ракета',
    '✈️': 'самолёт',
    '🚗': 'машина',
    '🚲': 'велосипед',
    '🏠': 'дом',
    '🏰': 'замок',
    '💎': 'алмаз камень',
    '💰': 'деньги золото',
    '🗡️': 'меч',
    '🛡️': 'щит',
    '🎮': 'игра геймпад',
    '🎸': 'гитара',
    '🎨': 'искусство',
    '📚': 'книги',
    '🧪': 'химия',
    '⚙️': 'механизм',
    '🧲': 'магнит',
    '🪨': 'камень',
    '🌱': 'росток растение',
    '🍕': 'пицца',
    '🍔': 'бургер',
    '🍣': 'суши',
    '🍎': 'яблоко',
    '🍌': 'банан',
    '🍓': 'клубника',
    '🍫': 'шоколад',
    '☕': 'кофе',
    '🍵': 'чай',
    '🍺': 'пиво',
    '🎂': 'торт',
    '🛋️': 'диван',
    '🪑': 'стул',
    '🛏️': 'кровать',
    '🚪': 'дверь',
    '🪟': 'окно',
    '💡': 'лампа свет',
    '⌚': 'часы',
    '💻': 'компьютер',
    '📱': 'телефон',
    '🧟': 'зомби',
    '🧛': 'вампир',
    '😈': 'дьявол',
    '😇': 'ангел',
    '❤️': 'сердце любовь',
    '💔': 'разбитое сердце',
    '🎵': 'музыка',
    '🎬': 'кино',
    '🏆': 'победа',
    '🥇': 'золото',
    '⚽': 'футбол',
    '🏀': 'баскетбол',
    '🎯': 'цель',
    '🧩': 'пазл',
    '🗺️': 'карта',
    '🌫️': 'туман',
    '🩸': 'кровь',
    '🦴': 'кость',
    '🧠': 'мозг',
    '👁️': 'глаз',
    '👑': 'корона',
    '💍': 'кольцо',
    '🎁': 'подарок',
    '🔮': 'магия',
    '🧿': 'амулет',
    '🕯️': 'свеча',
    '⚗️': 'алхимия',
    '🧬': 'днк',
    '🦠': 'вирус',
    '💊': 'лекарство',
    '🩺': 'врач',
    '🏥': 'больница',
    '🏫': 'школа',
    '👨': 'мужчина',
    '👩': 'женщина',
    '👶': 'ребёнок',
    '🐾': 'следы',
    '🌾': 'пшеница',
    '🪷': 'лотос',
    '🐚': 'ракушка',
    '🦀': 'краб',
    '🐟': 'рыба',
    '🐊': 'крокодил',
  };

  let target = null;
  let category = 'smile';
  let query = '';

  function el(id) {
    return document.getElementById(id);
  }

  function matches(emoji, q) {
    if (!q) return true;
    if (emoji.includes(q)) return true;
    const label = LABELS[emoji] || '';
    return label.includes(q);
  }

  function renderTabs() {
    const tabs = el('emojiTabs');
    if (!tabs) return;
    tabs.textContent = '';
    for (const group of GROUPS) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'emoji-tab' + (group.id === category ? ' is-active' : '');
      button.dataset.group = group.id;
      button.innerText = group.icon + ' ' + group.title;
      button.addEventListener('click', () => {
        category = group.id;
        renderTabs();
        renderGrid();
      });
      tabs.append(button);
    }
  }

  function renderGrid() {
    const grid = el('emojiGrid');
    if (!grid) return;
    const q = query.trim().toLowerCase();
    const items = [];
    if (q) {
      for (const group of GROUPS) for (const emoji of group.items) if (matches(emoji, q)) items.push(emoji);
    } else {
      const group = GROUPS.find((g) => g.id === category) || GROUPS[0];
      items.push(...group.items);
    }
    grid.textContent = '';
    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'hint';
      empty.textContent = 'Ничего не нашлось. Попробуйте другое слово.';
      grid.append(empty);
      return;
    }
    for (const emoji of items) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'emoji-cell';
      button.textContent = emoji;
      button.title = LABELS[emoji] || 'Эмодзи';
      button.addEventListener('click', () => choose(emoji));
      grid.append(button);
    }
  }

  function choose(emoji) {
    if (!target) return;
    target.value = emoji;
    target.dispatchEvent(new Event('input', { bubbles: true }));
    const dialog = el('emojiDialog');
    if (dialog && dialog.open) dialog.close();
    target.focus();
  }

  function open(targetId) {
    target = document.getElementById(targetId);
    if (!target) return;
    query = '';
    category = 'smile';
    const search = el('emojiSearch');
    if (search) search.value = '';
    renderTabs();
    renderGrid();
    const dialog = el('emojiDialog');
    if (dialog && !dialog.open) dialog.showModal();
    setTimeout(() => search && search.focus(), 60);
  }

  function init() {
    if (el('emojiDialog')) {
      // разметка уже есть
    }
    const search = el('emojiSearch');
    if (search) {
      search.addEventListener('input', () => {
        query = search.value;
        renderGrid();
      });
    }
    document.querySelectorAll('[data-emoji-for]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        open(button.dataset.emojiFor);
      });
    });
    renderTabs();
    renderGrid();
  }

  global.CraftEmojiPicker = { init, open };
})(window);

