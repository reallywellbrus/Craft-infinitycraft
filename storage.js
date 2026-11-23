/* =========================================================
   Хранилище: localStorage + заготовка под сервер.
   ========================================================= */
(function (global) {
  'use strict';

  const KEYS = {
    modes: 'craft-modes.modes.v1',
    likes: 'craft-modes.likes.v1',
    author: 'craft-modes.author.v1',
    remote: 'craft-modes.remote.v1',
    play: 'craft-modes.play.v1',
    voter: 'craft-modes.voter.v1',
    reports: 'craft-modes.reports.v1',
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function readString(key) {
    try {
      return localStorage.getItem(key) || '';
    } catch {
      return '';
    }
  }

  function writeString(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  const Storage = {
    KEYS,
    read,
    write,
    readString,
    writeString,

    /* ---------- режимы ---------- */

    listModes() {
      const list = read(KEYS.modes, []);
      return Array.isArray(list) ? list : [];
    },

    saveModes(list) {
      return write(KEYS.modes, list);
    },

    upsertMode(mode) {
      const list = this.listModes();
      const index = list.findIndex((m) => m.id === mode.id);
      if (index >= 0) list[index] = mode;
      else list.push(mode);
      this.saveModes(list);
      return list;
    },

    removeMode(id) {
      const list = this.listModes().filter((m) => m.id !== id);
      this.saveModes(list);
      return list;
    },

    /* ---------- лайки (пока локальные) ---------- */

    likedIds() {
      const list = read(KEYS.likes, []);
      return new Set(Array.isArray(list) ? list : []);
    },

    toggleLike(id) {
      const liked = this.likedIds();
      if (liked.has(id)) liked.delete(id);
      else liked.add(id);
      write(KEYS.likes, Array.from(liked));
      return liked.has(id);
    },

    /* ---------- имя автора ---------- */

    author() {
      return readString(KEYS.author);
    },

    setAuthor(name) {
      writeString(KEYS.author, name);
    },

    // Псевдоним браузера для лайков на сервере: без аккаунтов, но один голос
    // с одного браузера. Значение не является секретом.
    voterId() {
      let value = readString(KEYS.voter);
      if (!value) {
        value =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : 'v-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
        writeString(KEYS.voter, value);
      }
      return value;
    },

    /* ---------- прогресс игры по режиму ---------- */

    playState(modeId) {
      const all = read(KEYS.play, {});
      return (all && all[modeId]) || null;
    },

    savePlayState(modeId, value) {
      const all = read(KEYS.play, {}) || {};
      all[modeId] = value;
      write(KEYS.play, all);
    },

    clearPlayState(modeId) {
      const all = read(KEYS.play, {}) || {};
      delete all[modeId];
      write(KEYS.play, all);
    },

    /* ---------- заготовка сервера ----------
       Впишите адрес проекта Supabase — и игра начнёт грузить общий каталог.
       Пока пусто, режимы живут только в браузере.
       Пример: CraftStorage.setRemote('https://xxxx.supabase.co', 'anon-key') */
    remote() {
      const cfg = read(KEYS.remote, null) || {};
      const defaults = global.CRAFT_SUPABASE || {};
      // Пустые строки в localStorage означают «отключить» даже если в config.js
      // прописаны значения по умолчанию.
      if (Object.prototype.hasOwnProperty.call(cfg, 'url') && cfg.url === '' && !cfg.anonKey) {
        return { url: '', anonKey: '' };
      }
      return {
        url: String(cfg.url || defaults.url || ''),
        anonKey: String(cfg.anonKey || defaults.anonKey || ''),
      };
    },

    setRemote(url, anonKey) {
      return write(KEYS.remote, { url, anonKey });
    },

    remoteEnabled() {
      const cfg = this.remote();
      return Boolean(cfg.url && cfg.anonKey && typeof fetch === 'function');
    },

    /* ---------- каталог ---------- */

    // Все режимы, доступные для игры: свои + (если подключён сервер) чужие.
    async catalog() {
      const own = this.listModes();
      let remote = [];
      if (this.remoteEnabled()) {
        try {
          remote = await this.fetchRemoteModes();
        } catch (error) {
          console.warn('Каталог с сервера недоступен:', error);
        }
      }
      // Свои режимы не дублируем, если сервер вернул те же.
      const ownIds = new Set(own.map((m) => m.id));
      const ownRemoteIds = new Set(own.map((m) => m.remoteId).filter(Boolean));
      const merged = own.map((m) => Object.assign({ mine: true }, m))
        .concat(remote
          .filter((m) => !ownIds.has(m.id) && !ownRemoteIds.has(m.id))
          .map((m) => Object.assign({ mine: false }, m)));
      return merged;
    },

    async fetchRemoteModes() {
      const { url, anonKey } = this.remote();
      const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/modes?select=*&order=likes.desc,created_at.desc&limit=100`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const rows = await res.json();
      return rows
        .map((row) => ({
          id: row.id,
          name: row.name,
          description: row.description || '',
          author: row.author || 'Аноним',
          emoji: row.emoji || '🎮',
          hue: row.hue || 260,
          likes: row.likes || 0,
          createdAt: row.created_at,
          base: row.base || null,
          elements: row.elements || [],
          rules: row.rules || [],
        }))
        .filter((mode) => !global.CraftFilter || !global.CraftFilter.checkMode(mode));
    },

    async publishRemote(mode) {
      if (!this.remoteEnabled()) return { ok: false, queued: true };
      const { url, anonKey } = this.remote();
      const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/modes`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          name: mode.name,
          description: mode.description || '',
          author: mode.author || 'Аноним',
          emoji: mode.emoji || '🎮',
          hue: mode.hue || 260,
          base: mode.base || null,
          elements: mode.elements,
          rules: mode.rules,
        }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const rows = await res.json();
      return { ok: true, id: rows && rows[0] ? rows[0].id : null };
    },

    async likeRemote(id) {
      if (!this.remoteEnabled()) return;
      const { url, anonKey } = this.remote();
      try {
        const rpc = await fetch(`${url.replace(/\/$/, '')}/rest/v1/rpc/like_mode`, {
          method: 'POST',
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ p_mode_id: id, p_voter: this.voterId() }),
        });
        if (!rpc.ok) console.warn('Лайк на сервере не сохранился:', rpc.status);
      } catch (error) {
        console.warn('Лайк на сервере не сохранился:', error);
      }
    },

    async reportMode(mode, reason, comment) {
      const remoteId = mode && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(mode.remoteId || mode.id)
        ? mode.remoteId || mode.id
        : null;
      const payload = {
        mode_id: remoteId,
        mode_name: String((mode && mode.name) || '').slice(0, 120),
        reason,
        comment: String(comment || '').slice(0, 500),
        reporter: this.voterId(),
      };

      if (!this.remoteEnabled()) {
        const list = read(KEYS.reports, []) || [];
        list.push(Object.assign({ id: 'local-' + Date.now().toString(36), createdAt: Date.now() }, payload));
        write(KEYS.reports, list);
        return { ok: false, local: true };
      }

      const { url, anonKey } = this.remote();
      const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/reports`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return { ok: true };
    },
  };

  global.CraftStorage = Storage;
})(window);
