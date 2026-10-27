-- Onaylanan kategori düzeni (27.10.2026).
--
-- Adresler DEĞİŞMİYOR: yalnız görünen adlar. /meta-business-manager/ ve
-- /dijital-pazarlama/ Google'da dizinli; slug'a dokunmak yönlendirme ve
-- sıralama kaybı demek.
--
-- Google Ads kategorisi bilerek yok (karşılığı olan bir eğitim yok; sonra).

update public.categories set ad = 'Meta Reklamları' where slug = 'meta-business-manager';
update public.categories set ad = 'Dijital Pazarlama ve Kariyer' where slug = 'dijital-pazarlama';

insert into public.categories (slug, ad, sira)
values ('yapay-zeka', 'Yapay Zekâ', 50)
on conflict (slug) do nothing;

-- Sıra: blog dizinindeki kategori çiplerinin dizilişi.
update public.categories set sira = 10 where slug = 'sosyal-medya';
update public.categories set sira = 20 where slug = 'meta-business-manager';
update public.categories set sira = 30 where slug = 'tiktok';
update public.categories set sira = 40 where slug = 'dijital-pazarlama';
update public.categories set sira = 50 where slug = 'yapay-zeka';
