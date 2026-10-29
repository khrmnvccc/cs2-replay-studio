-- Bildirishnomalar (ilova ichida + Telegram), shablonlar va Telegram bot ulanishi.

-- Ilova sozlamalari (Telegram bot tokeni va h.k.). Siyosat yo'q: faqat service_role o'qiydi.
create table public.app_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.app_config enable row level security;

-- Shablonlar: sayt egasi boshqaruv oynasidan tahrirlaydi
create table public.notification_templates (
  key text primary key,
  category text not null,
  sort integer not null default 0,
  icon text not null default 'bell',
  enabled boolean not null default true,
  required boolean not null default false,
  trigger_uz text not null default '',
  trigger_ru text not null default '',
  title_uz text not null,
  title_ru text not null,
  body_uz text not null default '',
  body_ru text not null default '',
  -- [{ "label_uz": "...", "label_ru": "...", "kind": "app" | "none", "path": "/matches/{matchId}" }]
  buttons jsonb not null default '[]'::jsonb,
  with_media boolean not null default false,
  telegram boolean not null default true,
  sound boolean not null default true,
  vars text[] not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.notification_templates enable row level security;
create trigger notification_templates_touch before update on public.notification_templates
  for each row execute function public.touch_updated_at();

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  template_key text,
  icon text not null default 'bell',
  title jsonb not null,            -- { "uz": "...", "ru": "..." }
  body jsonb not null default '{}'::jsonb,
  link text,
  map_name text,
  read_at timestamptz,
  telegram_status text check (telegram_status in ('sent', 'failed', 'skipped')),
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id, created_at desc);
alter table public.notifications enable row level security;
create policy notifications_select on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));
create policy notifications_update on public.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create table public.telegram_accounts (
  user_id uuid primary key references public.users(id) on delete cascade,
  chat_id bigint not null unique,
  username text,
  first_name text,
  lang text not null default 'uz' check (lang in ('uz', 'ru')),
  linked_at timestamptz not null default now()
);
alter table public.telegram_accounts enable row level security;
create policy telegram_select on public.telegram_accounts for select to authenticated
  using (user_id = (select auth.uid()));

-- Bir martalik ulash kodlari (t.me/<bot>?start=<token>)
create table public.telegram_link_tokens (
  token text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  expires_at timestamptz not null
);
alter table public.telegram_link_tokens enable row level security;

insert into public.notification_templates (key, category, sort, icon, required, trigger_uz, trigger_ru, title_uz, title_ru, body_uz, body_ru, buttons, with_media, vars) values
  ('match_imported', 'matches', 10, 'download', false,
   'Match tarixidan yangi o''yin topilganda', 'Когда в истории найден новый матч',
   'Yangi o''yin import qilindi', 'Импортирован новый матч',
   '{map} · {score}', '{map} · {score}',
   '[{"label_uz":"O''yinni ko''rish","label_ru":"Открыть матч","kind":"app","path":"/matches/{matchId}"}]', false, '{map,score,matchId}'),
  ('demo_parsed', 'matches', 20, 'check', false,
   'Demo tahlili tugaganda', 'Когда анализ демо завершён',
   'O''yin tahlil qilindi', 'Матч проанализирован',
   '{map} · {score} · {kills} kill', '{map} · {score} · {kills} убийств',
   '[{"label_uz":"Hisob jadvali","label_ru":"Таблица счёта","kind":"app","path":"/matches/{matchId}"}]', false, '{map,score,kills,matchId}'),
  ('demo_failed', 'matches', 30, 'alert', false,
   'Demoni tahlil qilib bo''lmaganda', 'Когда демо не удалось проанализировать',
   'Demoni tahlil qilib bo''lmadi', 'Не удалось проанализировать демо',
   '{error}', '{error}',
   '[]', false, '{error}'),
  ('clip_ready', 'clips', 10, 'play', false,
   'Klip videosi tayyor bo''lganda', 'Когда видео клипа готово',
   'Klipingiz tayyor', 'Ваш клип готов',
   '{title}', '{title}',
   '[{"label_uz":"Klipni ko''rish","label_ru":"Открыть клип","kind":"app","path":"/clips"}]', true, '{title}'),
  ('zip_ready', 'clips', 20, 'archive', false,
   'ZIP arxiv tayyor bo''lganda', 'Когда ZIP-архив готов',
   'ZIP arxiv tayyor', 'ZIP-архив готов',
   '{n} ta klip', 'Клипов: {n}',
   '[{"label_uz":"Kliplarim","label_ru":"Мои клипы","kind":"app","path":"/clips"}]', false, '{n}'),
  ('demo_expiring', 'clips', 30, 'clock', false,
   'Demo fayl o''chirilishidan bir kun oldin', 'За день до удаления демо',
   'Demo fayl ertaga o''chiriladi', 'Демо удалится завтра',
   '{map}: kerakli kliplarni hozir yarating.', '{map}: создайте нужные клипы сейчас.',
   '[{"label_uz":"O''yinni ochish","label_ru":"Открыть матч","kind":"app","path":"/matches/{matchId}"}]', false, '{map,matchId}'),
  ('history_error', 'account', 10, 'alert', false,
   'Match tarixini yangilab bo''lmaganda', 'Когда историю матчей не удалось обновить',
   'Match tarixini yangilab bo''lmadi', 'Не удалось обновить историю матчей',
   '{error}', '{error}',
   '[{"label_uz":"Sozlamalar","label_ru":"Настройки","kind":"app","path":"/settings"}]', false, '{error}'),
  ('telegram_linked', 'account', 20, 'send', true,
   'Telegram ulanganda', 'Когда Telegram подключён',
   'Telegram ulandi', 'Telegram подключён',
   'Endi yangi o''yinlar va tayyor kliplar shu yerga keladi.', 'Теперь новые матчи и готовые клипы будут приходить сюда.',
   '[{"label_uz":"ACE ni ochish","label_ru":"Открыть ACE","kind":"app","path":"/matches"}]', false, '{}');
