-- =========================================================
-- Craft Modes — схема базы для Supabase (бесплатного плана хватает)
--
-- Как подключить:
-- 1. Создайте проект на supabase.com (бесплатный).
-- 2. SQL Editor → New query → вставьте весь этот файл → Run.
-- 3. Settings → API: скопируйте Project URL и anon public key.
-- 4. В файле js/storage.js впишите их в DEFAULTS (или в консоли браузера:
--    CraftStorage.setRemote('https://xxxx.supabase.co', 'anon-key')
--    и перезагрузите страницу).
--
-- Напоминание: anon key публичный по задумке. Всё, что даёт доступ к записи,
-- ограничено политиками RLS ниже.
-- =========================================================

create extension if not exists pgcrypto;

-- ---------- режимы ----------
create table if not exists public.modes (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 60),
  description text not null default '' check (char_length(description) <= 200),
  author      text not null default 'Аноним' check (char_length(author) <= 40),
  emoji       text not null default '🎮',
  hue         int  not null default 260,
  base        jsonb,
  elements    jsonb not null default '[]'::jsonb,
  rules       jsonb not null default '[]'::jsonb,
  likes       int  not null default 0,
  -- Ограничения на размер, чтобы один игрок не залил мегабайтный режим.
  constraint modes_size check (
    jsonb_array_length(elements) <= 500 and jsonb_array_length(rules) <= 2000
  ),
  created_at  timestamptz not null default now()
);

create index if not exists modes_likes_idx on public.modes (likes desc, created_at desc);
create index if not exists modes_created_idx on public.modes (created_at desc);

alter table public.modes enable row level security;

-- Публичные права только на чтение и добавление.
grant usage on schema public to anon, authenticated;
grant select, insert on public.modes to anon, authenticated;

-- Удалять режимы может только вошедший админ (страница /admin.html).
grant delete on public.modes to authenticated;

drop policy if exists "modes admin delete" on public.modes;
create policy "modes admin delete" on public.modes
  for delete to authenticated
  using (true);

-- Клиент не должен присылать свой счётчик лайков.
create or replace function public.modes_reset_likes()
returns trigger
language plpgsql
as $$
begin
  new.likes := 0;
  return new;
end;
$$;

drop trigger if exists modes_reset_likes_trigger on public.modes;
create trigger modes_reset_likes_trigger
  before insert on public.modes
  for each row execute function public.modes_reset_likes();

-- Читать могут все, писать — все (у нас нет аккаунтов), но только добавлять.
drop policy if exists "modes read" on public.modes;
create policy "modes read" on public.modes for select using (true);

drop policy if exists "modes insert" on public.modes;
create policy "modes insert" on public.modes for insert with check (true);

-- Удалять и менять может только автор через админку (service_role), не публика.

-- ---------- лайки ----------
-- Один и тот же отпечаток браузера ставит лайк один раз.
create table if not exists public.mode_likes (
  mode_id     uuid not null references public.modes (id) on delete cascade,
  voter       text not null,
  created_at  timestamptz not null default now(),
  primary key (mode_id, voter)
);

alter table public.mode_likes enable row level security;

drop policy if exists "likes read" on public.mode_likes;
create policy "likes read" on public.mode_likes for select using (false);

-- Лайк через RPC.
-- Клиент вызывает: POST /rest/v1/rpc/like_mode { p_mode_id, p_voter }
-- Отпечаток браузера передаётся в теле, а не заголовком: так не упираемся
-- в ограничения CORS на нестандартные заголовки.
drop function if exists public.like_mode(uuid);

create or replace function public.like_mode(p_mode_id uuid, p_voter text default 'anon')
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  voter_id text;
  total int;
begin
  voter_id := coalesce(nullif(trim(p_voter), ''), 'anon');

  insert into public.mode_likes (mode_id, voter)
  values (p_mode_id, voter_id)
  on conflict do nothing;

  select count(*) into total from public.mode_likes l where l.mode_id = p_mode_id;

  update public.modes set likes = total where id = p_mode_id;

  return total;
end;
$$;

grant execute on function public.like_mode(uuid, text) to anon, authenticated;

-- ---------- модерация ----------
-- Если появится спам, удалите записи вручную:
--   delete from public.modes where created_at < now() - interval '7 days' and likes = 0;

-- =========================================================
-- Жалобы на режимы
-- =========================================================

create table if not exists public.reports (
  id         uuid primary key default gen_random_uuid(),
  mode_id    uuid references public.modes (id) on delete set null,
  mode_name  text not null default '' check (char_length(mode_name) <= 120),
  reason     text not null default 'other' check (reason in ('bad_words', 'spam', 'broken', 'other')),
  comment    text not null default '' check (char_length(comment) <= 500),
  reporter   text not null default 'anon' check (char_length(reporter) <= 80),
  status     text not null default 'new' check (status in ('new', 'resolved')),
  created_at timestamptz not null default now()
);

create index if not exists reports_created_idx on public.reports (created_at desc);
create index if not exists reports_status_idx on public.reports (status);

alter table public.reports enable row level security;

grant insert on public.reports to anon, authenticated;
grant select, update on public.reports to authenticated;

-- Отправить жалобу может любой посетитель.
drop policy if exists "reports insert" on public.reports;
create policy "reports insert" on public.reports
  for insert to anon, authenticated
  with check (true);

-- Читать и закрывать жалобы может только вошедший админ.
-- В Supabase отключите регистрацию новых пользователей и создайте
-- одного администратора в Authentication → Users.
drop policy if exists "reports admin read" on public.reports;
create policy "reports admin read" on public.reports
  for select to authenticated
  using (true);

drop policy if exists "reports admin update" on public.reports;
create policy "reports admin update" on public.reports
  for update to authenticated
  using (true)
  with check (true);

-- Админ-страница: /admin.html — вход по email и паролю Supabase Auth.
