-- CS2 Match Replay Studio — asosiy sxema
-- Har bir foydalanuvchi faqat o'z ma'lumotlarini ko'radi (RLS, auth.uid()).
-- Next.js server foydalanuvchi uchun SUPABASE_JWT_SECRET bilan imzolangan
-- qisqa muddatli JWT yaratadi (sub = users.id, role = authenticated),
-- shuning uchun auth.uid() bizning users.id ga teng bo'ladi.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type match_source as enum ('sharecode', 'demo_upload');
create type demo_availability as enum ('unknown', 'available', 'expired', 'uploaded', 'missing');
create type match_result as enum ('win', 'loss', 'tie');
create type demo_status as enum ('uploading', 'uploaded', 'parsing', 'parsed', 'failed', 'expired');
create type clip_status as enum ('queued', 'rendering', 'ready', 'failed');
create type job_type as enum (
  'sync_matches', 'fetch_match_info', 'download_demo', 'parse_demo', 'render_clip', 'zip_clips'
);
create type job_status as enum ('queued', 'running', 'succeeded', 'failed', 'cancelled');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
create table public.users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz,
  settings jsonb not null default jsonb_build_object(
    'clip_pre_seconds', 4,
    'clip_post_seconds', 2,
    'video_resolution', '1920x1080',
    'video_fps', 60,
    'retention_days', 30,
    'auto_download_demos', false
  )
);
create trigger users_touch before update on public.users
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- sessions (server-side session management; cookie faqat session id ni saqlaydi)
-- ---------------------------------------------------------------------------
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  user_agent text,
  ip_hash text
);
create index sessions_user_idx on public.sessions(user_id);

-- OpenID response_nonce replay himoyasi
create table public.openid_nonces (
  nonce text primary key,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- steam_accounts
-- ---------------------------------------------------------------------------
create table public.steam_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  steam_id64 text not null unique check (steam_id64 ~ '^7656119[0-9]{10}$'),
  persona_name text not null,
  avatar_url text,
  profile_url text,
  country_code text,
  -- Match history (Steam "Game Authentication Code") — AES-256-GCM bilan shifrlangan
  auth_code_encrypted text,
  last_share_code text,
  history_enabled boolean not null default false,
  history_last_synced_at timestamptz,
  history_last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger steam_accounts_touch before update on public.steam_accounts
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- matches
-- ---------------------------------------------------------------------------
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  source match_source not null,
  share_code text check (share_code is null or share_code ~ '^CSGO(-[A-Za-z0-9]{5}){5}$'),
  valve_match_id text,
  valve_outcome_id text,
  valve_token text,
  map_name text,
  played_at timestamptz,
  duration_seconds integer,
  game_mode text,
  score_ct integer,
  score_t integer,
  score_own integer,
  score_enemy integer,
  user_side text check (user_side in ('CT', 'T')),
  result match_result,
  kills integer,
  deaths integer,
  assists integer,
  headshots integer,
  demo_availability demo_availability not null default 'unknown',
  demo_url text,
  info_source text,           -- 'gc' | 'demo' — statistikaning manbasi
  user_in_demo boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, share_code)
);
create index matches_user_played_idx on public.matches(user_id, played_at desc nulls last);
create trigger matches_touch before update on public.matches
  for each row execute function public.touch_updated_at();

create table public.match_rounds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  round_number integer not null,
  winner text check (winner in ('CT', 'T')),
  reason text,
  start_tick integer,
  freeze_end_tick integer,
  end_tick integer,
  unique (match_id, round_number)
);

-- ---------------------------------------------------------------------------
-- demo_files
-- ---------------------------------------------------------------------------
create table public.demo_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  match_id uuid references public.matches(id) on delete set null,
  storage_path text not null unique,
  original_name text not null,
  size_bytes bigint not null check (size_bytes > 0),
  compression text not null default 'none' check (compression in ('none', 'bz2')),
  sha256 text,
  status demo_status not null default 'uploading',
  error text,
  header jsonb,
  tickrate integer not null default 64,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index demo_files_user_idx on public.demo_files(user_id, created_at desc);
create trigger demo_files_touch before update on public.demo_files
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- kill_events
-- ---------------------------------------------------------------------------
create table public.kill_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  demo_file_id uuid not null references public.demo_files(id) on delete cascade,
  round_number integer not null,
  tick integer not null,
  seconds_into_round real,
  killer_steam_id64 text,
  killer_name text,
  killer_side text,
  victim_steam_id64 text,
  victim_name text,
  victim_side text,
  assister_steam_id64 text,
  assister_name text,
  weapon text not null,
  headshot boolean not null default false,
  wallbang boolean not null default false,
  noscope boolean not null default false,
  through_smoke boolean not null default false,
  attacker_blind boolean not null default false,
  is_user_kill boolean not null default false,
  is_user_death boolean not null default false
);
create index kill_events_match_idx on public.kill_events(match_id, tick);

-- ---------------------------------------------------------------------------
-- clips
-- ---------------------------------------------------------------------------
create table public.clips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  demo_file_id uuid not null references public.demo_files(id) on delete cascade,
  kill_event_id uuid references public.kill_events(id) on delete set null,
  title text not null check (char_length(title) between 1 and 120),
  start_tick integer not null,
  end_tick integer not null check (end_tick > start_tick),
  pov_steam_id64 text,
  resolution text not null default '1920x1080',
  fps integer not null default 60,
  status clip_status not null default 'queued',
  storage_path text,
  thumbnail_path text,
  size_bytes bigint,
  duration_seconds real,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index clips_user_idx on public.clips(user_id, created_at desc);
create trigger clips_touch before update on public.clips
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- processing_jobs (Postgres asosidagi navbat; worker service_role bilan oladi)
-- ---------------------------------------------------------------------------
create table public.processing_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type job_type not null,
  status job_status not null default 'queued',
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  progress integer not null default 0 check (progress between 0 and 100),
  progress_message text,
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  run_after timestamptz not null default now(),
  locked_by text,
  locked_at timestamptz,
  heartbeat_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index processing_jobs_queue_idx on public.processing_jobs(type, status, run_after)
  where status = 'queued';
create index processing_jobs_user_idx on public.processing_jobs(user_id, created_at desc);
create trigger processing_jobs_touch before update on public.processing_jobs
  for each row execute function public.touch_updated_at();

-- Workerlar holati (render worker onlaynmi — UI shuni ko'rsatadi)
create table public.workers (
  id text primary key,
  capabilities text[] not null default '{}',
  hostname text,
  version text,
  last_seen_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Queue funksiyalari (faqat service_role)
-- ---------------------------------------------------------------------------
create or replace function public.claim_job(p_worker_id text, p_types job_type[])
returns setof public.processing_jobs
language plpgsql security definer set search_path = public as $$
begin
  return query
  update public.processing_jobs j
     set status = 'running',
         attempts = j.attempts + 1,
         locked_by = p_worker_id,
         locked_at = now(),
         heartbeat_at = now(),
         error = null
   where j.id = (
     select id from public.processing_jobs
      where status = 'queued' and type = any(p_types) and run_after <= now()
      order by created_at
      for update skip locked
      limit 1
   )
  returning j.*;
end $$;

-- Heartbeat to'xtagan (worker o'lgan) ishlarni qayta navbatga qo'yish
create or replace function public.requeue_stale_jobs(p_stale interval default interval '10 minutes')
returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  with stale as (
    select id, attempts, max_attempts from public.processing_jobs
     where status = 'running' and heartbeat_at < now() - p_stale
     for update skip locked
  )
  update public.processing_jobs j
     set status = case when s.attempts >= s.max_attempts then 'failed'::job_status else 'queued'::job_status end,
         error = 'Worker javob bermay qoldi (heartbeat timeout)',
         locked_by = null,
         run_after = now() + interval '30 seconds'
    from stale s
   where j.id = s.id;
  get diagnostics n = row_count;
  return n;
end $$;

-- Foydalanuvchiga workerlar holatini (maxfiy ma'lumotsiz) ko'rsatish
create or replace function public.worker_capabilities_online(p_window interval default interval '2 minutes')
returns table (capability text, workers integer)
language sql security definer set search_path = public stable as $$
  select c as capability, count(*)::int as workers
    from public.workers w, unnest(w.capabilities) c
   where w.last_seen_at > now() - p_window
   group by c;
$$;

-- Supabase default privileges anon/authenticated'ga funksiyalarni ochib beradi — aniq yopamiz
revoke all on function public.claim_job(text, job_type[]) from public, anon, authenticated;
revoke all on function public.requeue_stale_jobs(interval) from public, anon, authenticated;
revoke all on function public.worker_capabilities_online(interval) from public, anon, authenticated;
grant execute on function public.claim_job(text, job_type[]) to service_role;
grant execute on function public.requeue_stale_jobs(interval) to service_role;
grant execute on function public.worker_capabilities_online(interval) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.sessions enable row level security;
alter table public.openid_nonces enable row level security;
alter table public.steam_accounts enable row level security;
alter table public.matches enable row level security;
alter table public.match_rounds enable row level security;
alter table public.demo_files enable row level security;
alter table public.kill_events enable row level security;
alter table public.clips enable row level security;
alter table public.processing_jobs enable row level security;
alter table public.workers enable row level security;
-- sessions, openid_nonces, workers: siyosat yo'q => faqat service_role.

create policy users_select on public.users for select to authenticated
  using (id = (select auth.uid()));
create policy users_update on public.users for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy steam_select on public.steam_accounts for select to authenticated
  using (user_id = (select auth.uid()));
-- steam_accounts faqat server (service_role) orqali yoziladi: Steam ma'lumotlari
-- foydalanuvchi tomonidan soxtalashtirilmasligi uchun.

create policy matches_select on public.matches for select to authenticated
  using (user_id = (select auth.uid()));
create policy matches_insert on public.matches for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy matches_delete on public.matches for delete to authenticated
  using (user_id = (select auth.uid()));

create policy rounds_select on public.match_rounds for select to authenticated
  using (user_id = (select auth.uid()));

create policy demos_select on public.demo_files for select to authenticated
  using (user_id = (select auth.uid()));
create policy demos_insert on public.demo_files for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'uploading');
create policy demos_delete on public.demo_files for delete to authenticated
  using (user_id = (select auth.uid()));

create policy kills_select on public.kill_events for select to authenticated
  using (user_id = (select auth.uid()));

create policy clips_select on public.clips for select to authenticated
  using (user_id = (select auth.uid()));
create policy clips_insert on public.clips for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'queued' and storage_path is null);
create policy clips_update on public.clips for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy clips_delete on public.clips for delete to authenticated
  using (user_id = (select auth.uid()));

create policy jobs_select on public.processing_jobs for select to authenticated
  using (user_id = (select auth.uid()));
create policy jobs_insert on public.processing_jobs for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'queued' and attempts = 0);

-- Foydalanuvchi clip faylini yoki statusini o'zi o'zgartira olmasin (faqat nom).
create or replace function public.clips_guard_user_update() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user = 'authenticated' then
    if new.status is distinct from old.status
       or new.storage_path is distinct from old.storage_path
       or new.thumbnail_path is distinct from old.thumbnail_path
       or new.start_tick is distinct from old.start_tick
       or new.end_tick is distinct from old.end_tick
       or new.demo_file_id is distinct from old.demo_file_id
       or new.match_id is distinct from old.match_id then
      raise exception 'Faqat clip nomini o''zgartirish mumkin';
    end if;
  end if;
  return new;
end $$;
create trigger clips_guard before update on public.clips
  for each row execute function public.clips_guard_user_update();

-- Foydalanuvchi faqat settings ustunini o'zgartira oladi
create or replace function public.users_guard_user_update() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user = 'authenticated' then
    if new.id is distinct from old.id or new.created_at is distinct from old.created_at
       or new.last_login_at is distinct from old.last_login_at then
      raise exception 'Faqat sozlamalarni o''zgartirish mumkin';
    end if;
  end if;
  return new;
end $$;
create trigger users_guard before update on public.users
  for each row execute function public.users_guard_user_update();

-- Supabase default privileges anon va authenticated'ga barcha jadvallarda to'liq huquq beradi.
-- Avval hammasini olib tashlab, faqat kerakli minimumni beramiz (RLS bilan birga ikki qatlam himoya).
revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to authenticated;
grant select, update on public.users to authenticated;
-- auth_code_encrypted ustuni foydalanuvchiga ham qaytarilmaydi (ustun darajasidagi grant)
grant select (id, user_id, steam_id64, persona_name, avatar_url, profile_url, country_code,
              last_share_code, history_enabled, history_last_synced_at, history_last_error,
              created_at, updated_at)
  on public.steam_accounts to authenticated;
grant select, insert, delete on public.matches to authenticated;
grant select on public.match_rounds to authenticated;
grant select, insert, delete on public.demo_files to authenticated;
grant select on public.kill_events to authenticated;
grant select, insert, update, delete on public.clips to authenticated;
grant select, insert on public.processing_jobs to authenticated;
