-- Eğitim kapak görseli.
--
-- Yönetim panelindeki "Kapak görseli" alanı bugüne kadar boş bir yer
-- tutucuydu: kesikli çerçeve ve "sürükle veya seç" yazısı vardı ama arkasında
-- ne bir girdi ne de bir sütun bulunuyordu.

alter table public.courses add column if not exists kapak_gorsel text;

comment on column public.courses.kapak_gorsel is
  'kapaklar kovasındaki dosyanın yolu. Boşsa yer tutucu desen gösterilir.';

insert into storage.buckets (id, name, public)
values ('kapaklar', 'kapaklar', true)
on conflict (id) do nothing;

drop policy if exists "kapaklar admin yukleme" on storage.objects;
create policy "kapaklar admin yukleme" on storage.objects
  for insert to authenticated with check (bucket_id = 'kapaklar' and is_admin());

drop policy if exists "kapaklar admin silme" on storage.objects;
create policy "kapaklar admin silme" on storage.objects
  for delete to authenticated using (bucket_id = 'kapaklar' and is_admin());

drop policy if exists "kapaklar admin guncelleme" on storage.objects;
create policy "kapaklar admin guncelleme" on storage.objects
  for update to authenticated
  using (bucket_id = 'kapaklar' and is_admin())
  with check (bucket_id = 'kapaklar' and is_admin());
