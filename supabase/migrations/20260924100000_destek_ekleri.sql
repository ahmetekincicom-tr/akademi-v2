-- Destek: mesaj ekleri (ekran görüntüsü / dosya) + iç notların RLS ile korunması.
--
-- 1) support_messages.ekler — mesaja iliştirilen dosyalar:
--    [{ "yol": "<uid>/<zaman>-<ad>", "ad": "...", "tip": "image/webp", "boyut": 12345 }]
--    Geriye dönük güvenli: varsayılan '[]' → mevcut mesajlar değişmez.
--
-- 2) İç notlar (ic_not) artık RLS düzeyinde yalnız yöneticiye açık. Önceden
--    yalnız uygulama kodu eliyordu; öğrenci Supabase'i doğrudan sorgularsa
--    kendi talebindeki iç notları okuyabilirdi. Öğrenci iç not da ekleyemez.
--
-- 3) Özel kova "destek-ekleri": dosyalar /destek-ek/<mesaj>/<sıra> ucundan
--    kendi alan adımızdan, yetki kontrolüyle akıtılıyor (bkz. /indir deseni).
--    Yükleme yalnız kendi klasörüne. Okuma: yönetici, dosyanın sahibi ya da
--    dosya, kişinin kendi talebindeki (iç not olmayan) bir mesaja ekliyse —
--    ve o dosya o mesajı GÖNDERENE aitse (başkasının yolunu mesajına yazıp
--    okuma izni kazanmak mümkün olmasın).

alter table public.support_messages
  add column if not exists ekler jsonb not null default '[]'::jsonb;

alter table public.support_messages
  drop constraint if exists support_messages_ekler_dizi;
alter table public.support_messages
  add constraint support_messages_ekler_dizi
  check (jsonb_typeof(ekler) = 'array' and jsonb_array_length(ekler) <= 4);

comment on column public.support_messages.ekler is
  'Mesaj ekleri: [{yol, ad, tip, boyut}] — dosyalar destek-ekleri kovasında, en fazla 4.';

-- İç notlar: öğrenci okuyamaz / ekleyemez.
drop policy if exists messages_select_own_or_admin on public.support_messages;
create policy messages_select_own_or_admin on public.support_messages
  for select using (
    (select public.is_admin())
    or (
      ic_not = false
      and exists (
        select 1 from public.support_tickets t
        where t.id = support_messages.ticket_id and t.user_id = (select auth.uid())
      )
    )
  );

drop policy if exists messages_insert_participant on public.support_messages;
create policy messages_insert_participant on public.support_messages
  for insert with check (
    gonderen_id = (select auth.uid())
    and (
      (select public.is_admin())
      or (
        ic_not = false
        and exists (
          select 1 from public.support_tickets t
          where t.id = support_messages.ticket_id and t.user_id = (select auth.uid())
        )
      )
    )
  );

-- Kova: 10 MB, yalnız görsel + PDF (SVG yok: kendi alan adımızdan açılan
-- SVG içindeki script panelin kaynağında çalışırdı).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'destek-ekleri', 'destek-ekleri', false, 10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf']
)
on conflict (id) do nothing;

drop policy if exists "destek ekleri yukleme" on storage.objects;
create policy "destek ekleri yukleme" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'destek-ekleri'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "destek ekleri silme" on storage.objects;
create policy "destek ekleri silme" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'destek-ekleri'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "destek ekleri okuma" on storage.objects;
create policy "destek ekleri okuma" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'destek-ekleri'
    and (
      (select public.is_admin())
      or (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (
        select 1
        from public.support_messages m
        join public.support_tickets t on t.id = m.ticket_id
        where t.user_id = (select auth.uid())
          and m.ic_not = false
          and m.ekler @> jsonb_build_array(jsonb_build_object('yol', storage.objects.name))
          and (storage.foldername(storage.objects.name))[1] = m.gonderen_id::text
      )
    )
  );
