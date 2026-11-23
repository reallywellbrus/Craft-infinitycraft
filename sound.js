/* =========================================================
   Короткие звуки интерфейса на Web Audio API.
   Без внешних файлов: работает офлайн и на телефоне.
   ========================================================= */
(function (global) {
  'use strict';

  const KEY = 'craft-modes.sound.v1';
  let ctx = null;
  let enabled = readEnabled();

  function readEnabled() {
    try {
      const saved = localStorage.getItem(KEY);
      return saved === null ? true : saved === '1';
    } catch {
      return true;
    }
  }

  function saveEnabled() {
    try {
      localStorage.setItem(KEY, enabled ? '1' : '0');
    } catch {
      // приватный режим — просто не запоминаем
    }
  }

  function audio() {
    if (!enabled) return null;
    if (!ctx) {
      const AudioCtor = global.AudioContext || global.webkitAudioContext;
      if (!AudioCtor) return null;
      try {
        ctx = new AudioCtor();
      } catch {
        return null;
      }
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function tone(freq, offset, duration, type, volume) {
    const c = audio();
    if (!c) return;
    const t = c.currentTime + offset;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume || 0.035, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t);
    osc.stop(t + duration + 0.03);
  }

  const SOUNDS = {
    click() {
      tone(520, 0, 0.055, 'triangle', 0.025);
    },
    add() {
      tone(440, 0, 0.06, 'sine', 0.03);
      tone(660, 0.045, 0.08, 'sine', 0.025);
    },
    success() {
      tone(523.25, 0, 0.16, 'sine', 0.035);
      tone(659.25, 0.06, 0.18, 'sine', 0.03);
      tone(783.99, 0.12, 0.24, 'sine', 0.025);
    },
    new() {
      tone(523.25, 0, 0.13, 'triangle', 0.035);
      tone(659.25, 0.07, 0.14, 'triangle', 0.03);
      tone(783.99, 0.14, 0.16, 'triangle', 0.03);
      tone(1046.5, 0.22, 0.25, 'sine', 0.025);
    },
    error() {
      tone(220, 0, 0.16, 'sawtooth', 0.028);
      tone(165, 0.08, 0.2, 'sawtooth', 0.022);
    },
    delete() {
      tone(420, 0, 0.08, 'triangle', 0.028);
      tone(280, 0.06, 0.12, 'triangle', 0.025);
    },
    publish() {
      tone(587.33, 0, 0.12, 'sine', 0.032);
      tone(880, 0.09, 0.18, 'sine', 0.03);
      tone(1174.66, 0.18, 0.22, 'sine', 0.022);
    },
    report() {
      tone(659.25, 0, 0.1, 'sine', 0.03);
      tone(523.25, 0.09, 0.14, 'sine', 0.025);
    },
  };

  function play(name) {
    if (!enabled) return;
    const sound = SOUNDS[name] || SOUNDS.click;
    try {
      sound();
    } catch {
      // звук не критичен для игры
    }
  }

  function toggle() {
    enabled = !enabled;
    saveEnabled();
    if (enabled) play('click');
    return enabled;
  }

  function unlock() {
    if (!enabled) return;
    audio();
  }

  global.CraftSound = {
    play,
    toggle,
    unlock,
    isEnabled: () => enabled,
  };
})(window);
