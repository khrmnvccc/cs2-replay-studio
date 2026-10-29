-- Worker kompyuterining soati noto'g'ri bo'lishi mumkin (masalan 2 soat oldinda).
-- Heartbeat vaqtlari har doim bazaning o'z soati bilan yoziladi.
create or replace function public.workers_server_clock() returns trigger
language plpgsql set search_path = public as $$
begin
  new.last_seen_at = now();
  return new;
end $$;
create trigger workers_server_clock before insert or update on public.workers
  for each row execute function public.workers_server_clock();

create or replace function public.jobs_server_clock() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.heartbeat_at is distinct from old.heartbeat_at and new.heartbeat_at is not null then
    new.heartbeat_at = now();
  end if;
  if new.locked_at is distinct from old.locked_at and new.locked_at is not null then
    new.locked_at = now();
  end if;
  return new;
end $$;
create trigger jobs_server_clock before update on public.processing_jobs
  for each row execute function public.jobs_server_clock();

update public.workers set last_seen_at = now() where last_seen_at > now();
