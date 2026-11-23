/* =========================================================
   Админ-страница жалоб: Supabase Auth + reports.
   ========================================================= */
(function () {
  'use strict';

  const cfg = window.CRAFT_SUPABASE || {};
  const base = String(cfg.url || '').replace(/\/$/, '');
  const anonKey = String(cfg.anonKey || '');
  const TOKEN_KEY = 'craft-modes.admin.token';
  const REASONS = {
    bad_words: 'Ненормативная лексика',
    spam: 'Спам',
    broken: 'Сломанный режим',
    other: 'Другое',
  };

  const $ = (id) => document.getElementById(id);
  const dom = {
    loginPanel: $('loginPanel'),
    reportsPanel: $('reportsPanel'),
    loginForm: $('loginForm'),
    loginBtn: $('loginBtn'),
    loginHint: $('loginHint'),
    email: $('adminEmail'),
    password: $('adminPassword'),
    logoutBtn: $('logoutBtn'),
    refreshBtn: $('refreshBtn'),
    reportsList: $('reportsList'),
    reportsCount: $('reportsCount'),
    reportsEmpty: $('reportsEmpty'),
    reportsHint: $('reportsHint'),
    toasts: $('toasts'),
  };

  let token = sessionStorage.getItem(TOKEN_KEY) || '';
  let reports = [];
  let currentEmail = token ? tokenEmail(token) : '';

  function tokenEmail(value) {
    try {
      const payload = JSON.parse(atob(String(value).split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload.email || '';
    } catch {
      return '';
    }
  }

  function toast(icon, text) {
    if (!dom.toasts) return;
    const el = document.createElement('div');
    el.className = 'toast';
    const first = document.createElement('span');
    first.textContent = icon;
    const second = document.createElement('span');
    second.textContent = text;
    el.append(first, second);
    dom.toasts.append(el);
    setTimeout(() => el.remove(), 3200);
  }

  function showLogin(message) {
    token = '';
    sessionStorage.removeItem(TOKEN_KEY);
    dom.loginPanel.hidden = false;
    dom.reportsPanel.hidden = true;
    dom.logoutBtn.hidden = true;
    if (message) {
      dom.loginHint.textContent = message;
      dom.loginHint.classList.add('is-error');
    }
  }

  function showReports() {
    dom.loginPanel.hidden = true;
    dom.reportsPanel.hidden = false;
    dom.logoutBtn.hidden = false;
    dom.loginHint.textContent = '';
  }

  async function login(email, password) {
    if (!base || !anonKey) throw new Error('В js/config.js не задан Supabase URL/key');
    const res = await fetch(`${base}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) {
      throw new Error(data.error_description || data.msg || 'Неверный email или пароль');
    }
    token = data.access_token;
    currentEmail = (data.user && data.user.email) || email;
    sessionStorage.setItem(TOKEN_KEY, token);
  }

  async function api(path, options) {
    if (!base || !anonKey) throw new Error('Supabase не настроен');
    const res = await fetch(`${base}/rest/v1/${path}`, Object.assign({}, options, {
      headers: Object.assign({
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }, (options && options.headers) || {}),
    }));
    if (res.status === 401 || res.status === 403) {
      showLogin('Сессия истекла — войдите заново.');
      throw new Error('Нужен вход');
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'HTTP ' + res.status);
    }
    return res;
  }

  async function ensureAdmin() {
    dom.reportsHint.textContent = 'Проверяем доступ…';
    dom.reportsHint.classList.remove('is-error');
    try {
      const res = await api('rpc/is_admin', { method: 'POST', body: '{}' });
      const isAdmin = await res.json();
      if (isAdmin !== true) {
        const email = currentEmail || 'ТВОЙ_EMAIL';
        reportsError(
          `Аккаунт «${email}» не добавлен в админы. Выполни в SQL Editor: ` +
          `insert into public.admins (user_id) select id from auth.users where email = '${email}';`
        );
        return false;
      }
      dom.reportsHint.textContent = '';
      return true;
    } catch (error) {
      // Старая схема без is_admin: работаем по политикам authenticated.
      if (/could not find|not found|404/i.test(error.message)) {
        dom.reportsHint.textContent = '';
        return true;
      }
      if (error.message !== 'Нужен вход') {
        reportsError('Не удалось проверить доступ администратора: ' + error.message);
      }
      return false;
    }
  }

  async function loadReports() {
    if (!token) return;
    dom.reportsHint.textContent = 'Загружаем…';
    dom.reportsHint.classList.remove('is-error');
    try {
      const res = await api('reports?select=*&order=created_at.desc&limit=200');
      reports = await res.json();
      renderReports();
      dom.reportsHint.textContent = '';
      showReports();
    } catch (error) {
      if (error.message !== 'Нужен вход') {
        dom.reportsHint.textContent = 'Не удалось загрузить жалобы: ' + error.message;
        dom.reportsHint.classList.add('is-error');
      }
    }
  }

  function renderReports() {
    dom.reportsList.textContent = '';
    dom.reportsCount.textContent = String(reports.length);
    dom.reportsEmpty.hidden = reports.length > 0;
    for (const report of reports) {
      const card = document.createElement('article');
      card.className = 'report-card' + (report.status === 'resolved' ? ' is-resolved' : '');

      const top = document.createElement('div');
      top.className = 'report-top';
      const mode = document.createElement('span');
      mode.className = 'report-mode';
      mode.textContent = report.mode_name || 'Без названия';
      const status = document.createElement('span');
      status.className = 'report-status' + (report.status === 'resolved' ? ' is-resolved' : '');
      status.textContent = report.status === 'resolved' ? 'закрыта' : 'новая';
      const reason = document.createElement('span');
      reason.className = 'report-reason';
      reason.textContent = REASONS[report.reason] || report.reason || 'Другое';
      const date = document.createElement('span');
      date.className = 'report-date';
      date.textContent = report.created_at ? new Date(report.created_at).toLocaleString('ru') : '';
      top.append(mode, status, reason, date);

      const comment = document.createElement('p');
      comment.className = 'report-comment';
      comment.textContent = report.comment || 'Без комментария';

      const meta = document.createElement('div');
      meta.className = 'report-meta';
      const reporter = document.createElement('span');
      reporter.textContent = 'Отправитель: ' + (report.reporter || 'anon');

      const actions = document.createElement('div');
      actions.className = 'report-actions';
      if (report.mode_id) {
        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'btn btn--small btn--danger';
        del.textContent = '🗑 Удалить режим';
        del.addEventListener('click', () => deleteMode(report));
        actions.append(del);
      }
      const action = document.createElement('button');
      action.type = 'button';
      action.className = 'btn btn--small' + (report.status === 'resolved' ? '' : ' btn--primary');
      action.textContent = report.status === 'resolved' ? '↩ Вернуть' : '✅ Закрыть';
      action.addEventListener('click', () => setStatus(report, report.status === 'resolved' ? 'new' : 'resolved'));
      actions.append(action);
      meta.append(reporter, actions);

      card.append(top, comment, meta);
      dom.reportsList.append(card);
    }
  }

  function reportsError(message) {
    dom.reportsHint.textContent = message;
    dom.reportsHint.classList.add('is-error');
  }

  async function setStatus(report, status) {
    dom.reportsHint.textContent = '';
    dom.reportsHint.classList.remove('is-error');
    try {
      const res = await api(`reports?id=eq.${encodeURIComponent(report.id)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ status }),
      });
      const changed = res.status === 204 ? [{ status }] : await res.json();
      if (!Array.isArray(changed) || !changed.length) {
        throw new Error('нет прав на изменение жалобы');
      }
      report.status = status;
      renderReports();
      toast('✅', status === 'resolved' ? 'Жалоба закрыта' : 'Жалоба возвращена');
    } catch (error) {
      if (error.message !== 'Нужен вход') reportsError('Не удалось изменить жалобу: ' + error.message);
    }
  }

  async function deleteMode(report) {
    if (!report.mode_id) {
      reportsError('У жалобы не сохранён id режима — удалить его отсюда нельзя.');
      return;
    }
    const name = report.mode_name || 'этот режим';
    if (!window.confirm(`Удалить «${name}» с сервера? Жалоба останется в архиве.`)) return;
    dom.reportsHint.textContent = 'Удаляем режим…';
    dom.reportsHint.classList.remove('is-error');
    try {
      const res = await api(`modes?id=eq.${encodeURIComponent(report.mode_id)}`, {
        method: 'DELETE',
        headers: { Prefer: 'return=representation' },
      });
      const deleted = res.status === 204 ? [{ id: report.mode_id }] : await res.json();
      if (!Array.isArray(deleted) || !deleted.length) {
        throw new Error('режим не найден или нет прав на удаление');
      }

      // Связь с режимом стала null, жалобу закрываем и оставляем в архиве.
      report.mode_id = null;
      report.status = 'resolved';
      const patch = await api(`reports?id=eq.${encodeURIComponent(report.id)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ status: 'resolved' }),
      });
      const changed = patch.status === 204 ? [{ status: 'resolved' }] : await patch.json();
      if (!Array.isArray(changed) || !changed.length) {
        throw new Error('режим удалён, но жалобу не удалось закрыть');
      }
      renderReports();
      dom.reportsHint.textContent = 'Режим удалён с сервера, жалоба закрыта.';
      toast('🗑', 'Режим удалён с сервера');
    } catch (error) {
      if (error.message !== 'Нужен вход') reportsError('Не удалось удалить: ' + error.message);
    }
  }

  async function start() {
    if (!dom.loginForm) return;
    if (!base || !anonKey) {
      dom.loginHint.textContent = 'В js/config.js не задан Supabase URL или key.';
      dom.loginHint.classList.add('is-error');
      return;
    }
    dom.loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      dom.loginBtn.disabled = true;
      dom.loginHint.classList.remove('is-error');
      dom.loginHint.textContent = 'Входим…';
      try {
        await login(dom.email.value.trim(), dom.password.value);
        dom.password.value = '';
        showReports();
        if (await ensureAdmin()) await loadReports();
      } catch (error) {
        dom.loginHint.textContent = error.message;
        dom.loginHint.classList.add('is-error');
      } finally {
        dom.loginBtn.disabled = false;
      }
    });
    dom.logoutBtn.addEventListener('click', () => {
      showLogin('Вы вышли.');
      dom.loginHint.classList.remove('is-error');
      dom.loginHint.textContent = 'Вы вышли.';
    });
    dom.refreshBtn.addEventListener('click', async () => {
      if (await ensureAdmin()) await loadReports();
    });

    if (token) {
      showReports();
      if (await ensureAdmin()) await loadReports();
    }
  }

  start();
})();
