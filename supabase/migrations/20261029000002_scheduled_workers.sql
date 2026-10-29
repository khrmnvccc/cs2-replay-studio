-- Bulutdagi (GitHub Actions) worker har ~10 daqiqada ishga tushib, navbat bo'shaganda to'xtaydi.
-- U "scheduled" versiya bilan yozadi va 45 daqiqa davomida onlayn hisoblanadi.
create or replace function public.worker_capabilities_online(p_window interval default interval '2 minutes')
returns table (capability text, workers integer)
language sql security definer set search_path = public stable as $$
  select c as capability, count(*)::int as workers
    from public.workers w, unnest(w.capabilities) c
   where w.last_seen_at > now() - p_window
      or (w.version = 'scheduled' and w.last_seen_at > now() - interval '45 minutes')
   group by c;
$$;
revoke all on function public.worker_capabilities_online(interval) from public, anon, authenticated;
grant execute on function public.worker_capabilities_online(interval) to authenticated, service_role;
