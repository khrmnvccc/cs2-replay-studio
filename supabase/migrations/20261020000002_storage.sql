-- Storage bucketlari: hammasi PRIVATE. Yuklab olish faqat server yaratgan
-- qisqa muddatli signed URL orqali. Fayl yo'li: <user_id>/<...>

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  -- CS2 demolar 50–600 MB bo'ladi. Supabase Free plan global limiti 50 MB —
  -- katta demolar uchun Pro plan va Storage > Settings da global limitni oshiring.
  ('demos',   'demos',   false, 1073741824, array['application/octet-stream', 'application/x-bzip2']),
  ('clips',   'clips',   false, 524288000,  array['video/mp4', 'image/jpeg']),
  ('exports', 'exports', false, 2147483648, array['application/zip'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Demo: foydalanuvchi faqat o'z papkasiga yuklaydi (TUS resumable upload)
create policy "demos: owner can upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'demos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "demos: owner can read"
  on storage.objects for select to authenticated
  using (bucket_id = 'demos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "demos: owner can delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'demos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Clip va eksportlarni faqat worker (service_role) yozadi; egasi o'qiy oladi
create policy "clips: owner can read"
  on storage.objects for select to authenticated
  using (bucket_id = 'clips' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "exports: owner can read"
  on storage.objects for select to authenticated
  using (bucket_id = 'exports' and (storage.foldername(name))[1] = auth.uid()::text);
