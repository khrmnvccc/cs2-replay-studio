-- RLS testlari: A foydalanuvchi B ning ma'lumotlarini ko'rmasligi kerak.
\set ON_ERROR_STOP 1
grant all on all tables in schema public to service_role;
grant execute on all functions in schema public to service_role;

insert into public.users (id) values
  ('00000000-0000-0000-0000-00000000000a'), ('00000000-0000-0000-0000-00000000000b');
insert into public.steam_accounts (user_id, steam_id64, persona_name, auth_code_encrypted) values
  ('00000000-0000-0000-0000-00000000000a', '76561198000000001', 'Alice', 'secret-a'),
  ('00000000-0000-0000-0000-00000000000b', '76561198000000002', 'Bob', 'secret-b');
insert into public.matches (id, user_id, source, map_name) values
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', 'demo_upload', 'de_mirage'),
  ('10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000b', 'demo_upload', 'de_nuke');
insert into public.demo_files (id, user_id, match_id, storage_path, original_name, size_bytes, status) values
  ('20000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 'a/x.dem', 'x.dem', 100, 'parsed');
insert into public.clips (id, user_id, match_id, demo_file_id, title, start_tick, end_tick, status, storage_path) values
  ('30000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000a', 'ace', 100, 500, 'ready', '00000000-0000-0000-0000-00000000000a/c.mp4');
insert into storage.buckets (id, name) values ('demos','demos'),('clips','clips'),('exports','exports') on conflict do nothing;

-- A sifatida kirish
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', false);

do $$
declare n int;
begin
  select count(*) into n from public.matches; assert n = 1, 'A faqat o''z matchini ko''rishi kerak';
  select count(*) into n from public.matches where user_id = '00000000-0000-0000-0000-00000000000b';
  assert n = 0, 'A B ning matchini ko''rmasligi kerak';
  select count(*) into n from public.steam_accounts; assert n = 1, 'steam_accounts izolyatsiyasi';
  select count(*) into n from public.users; assert n = 1, 'users izolyatsiyasi';
end $$;

-- Maxfiy ustun o'qilmasligi kerak
do $$ begin
  perform auth_code_encrypted from public.steam_accounts;
  raise exception 'auth_code_encrypted o''qildi!';
exception when insufficient_privilege then null;
end $$;

-- Boshqa user nomidan yozib bo'lmaydi
do $$ begin
  insert into public.matches (user_id, source) values ('00000000-0000-0000-0000-00000000000b', 'demo_upload');
  raise exception 'B nomidan match yaratildi!';
exception when insufficient_privilege then null;
end $$;

-- Job: faqat queued holatda va o'z nomidan
insert into public.processing_jobs (user_id, type, payload) values ('00000000-0000-0000-0000-00000000000a', 'parse_demo', '{}');
do $$ begin
  insert into public.processing_jobs (user_id, type, status) values ('00000000-0000-0000-0000-00000000000a', 'parse_demo', 'succeeded');
  raise exception 'succeeded job yaratildi!';
exception when insufficient_privilege then null;
end $$;

-- Clip: nomni o'zgartirish mumkin, statusni emas
update public.clips set title = 'ace on mirage' where id = '30000000-0000-0000-0000-00000000000a';
do $$ begin
  update public.clips set status = 'queued' where id = '30000000-0000-0000-0000-00000000000a';
  raise exception 'clip statusini user o''zgartirdi!';
exception when raise_exception then
  if sqlerrm like '%statusini user%' then raise; end if;
end $$;

-- Storage: faqat o'z papkasiga
insert into storage.objects (bucket_id, name) values ('demos', '00000000-0000-0000-0000-00000000000a/m.dem');
do $$ begin
  insert into storage.objects (bucket_id, name) values ('demos', '00000000-0000-0000-0000-00000000000b/evil.dem');
  raise exception 'boshqa papkaga yuklandi!';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  insert into storage.objects (bucket_id, name) values ('clips', '00000000-0000-0000-0000-00000000000a/fake.mp4');
  raise exception 'user clips bucketiga yozdi!';
exception when insufficient_privilege then null;
end $$;

-- B sifatida: A ning clipini o'chira olmaydi
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', false);
delete from public.clips where id = '30000000-0000-0000-0000-00000000000a';
reset role;
do $$ declare n int; begin
  select count(*) into n from public.clips; assert n = 1, 'B A ning clipini o''chirdi!';
end $$;

-- Queue: claim_job SKIP LOCKED bilan bitta ishni oladi
set role service_role;
do $$ declare j public.processing_jobs; begin
  select * into j from public.claim_job('w1', array['parse_demo']::job_type[]);
  assert j.status = 'running' and j.attempts = 1 and j.locked_by = 'w1', 'claim_job ishlamadi';
  select * into j from public.claim_job('w2', array['parse_demo']::job_type[]);
  assert j.id is null, 'bitta ish ikki marta olindi';
  update public.processing_jobs set heartbeat_at = now() - interval '1 hour' where status = 'running';
  assert public.requeue_stale_jobs(interval '10 minutes') = 1, 'stale job qayta navbatga qo''yilmadi';
end $$;
reset role;
select 'RLS + queue testlari o''tdi' as ok;

-- Default privileges bo'lsa ham queue funksiyalari foydalanuvchiga yopiq
set role authenticated;
do $$ begin
  perform public.claim_job('x', array['parse_demo']::job_type[]);
  raise exception 'authenticated claim_job chaqira oldi!';
exception when insufficient_privilege then null;
end $$;
reset role;
set role anon;
do $$ begin
  perform 1 from public.matches;
  raise exception 'anon matches jadvalini o''qiy oldi!';
exception when insufficient_privilege then null;
end $$;
reset role;
select 'default privileges testlari o''tdi' as ok;
