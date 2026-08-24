-- Kurumsal alım: bir kişi ödüyor, birkaç kişi katılıyor.
--
-- Bugüne kadar ödeme ile katılım aynı kişiydi ve bütün süreç bu varsayıma
-- oturuyordu. Somut sonucu: ön değerlendirme testinin açılma koşulu "bu
-- kişinin KENDİ ödemesi var mı" olduğu için, ajans adına ödeme yapılan üç
-- çalışan panelde sonsuza kadar "Ödeme onaylandıktan sonra açılır" yazısına
-- bakıyordu.
--
-- Kurum/şirket varlığı BİLEREK kurulmadı. Eksik olan şey bir şirket kaydı
-- değil, ödeme ile katılımcı arasındaki bağ. Şirketler kendi koltuklarını
-- kendi panelinden yönetmeye başladığı gün kurum tablosu bunun üstüne biner;
-- bugün kurulsaydı yalnızca doldurulması gereken boş bir alan olurdu.

/* --------------------------------------------------------- koltuklar --- */

/*
  Kaç kişilik satıldığı.

  Ödeme satırının kendisinde duruyor çünkü fatura da orada kesiliyor: dört
  koltuk tek bir tahsilat ve tek bir fatura demek. Ayrı bir tabloya konsaydı
  "kaç kişilik ödedim" sorusu iki yere bakmayı gerektirirdi.

  Varsayılan 1: bugünkü bütün kayıtlar bireysel ve öyle kalmalı.
*/
alter table public.payments
  add column if not exists koltuk_sayisi integer not null default 1
    check (koltuk_sayisi between 1 and 100);

comment on column public.payments.koltuk_sayisi is
  'Bu ödemenin kaç kişiyi kapsadığı. 1 ise bireysel. Ödeyene "4 kişilik kurumsal kayıt" olarak gösteriliyor.';

/* ------------------------------------------------------ katılımcılar --- */

/*
  Ödemenin kapsadığı kişiler.

  Ödeyen bu tabloda YOK: onun erişimi zaten kendi payments satırından
  geliyor. Buraya yalnızca "ödemeyi başkası yaptı" durumundaki kişiler
  giriyor — böylece "bu kişi neden erişebiliyor" sorusunun tek bir cevabı
  oluyor.
*/
create table public.odeme_katilimcilari (
  payment_id uuid not null references public.payments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (payment_id, user_id)
);

comment on table public.odeme_katilimcilari is
  'Kurumsal ödemenin kapsadığı katılımcılar. Ödeyen burada yer almaz; onun erişimi kendi payments satırından gelir.';

create index odeme_katilimcilari_user_idx on public.odeme_katilimcilari (user_id);

alter table public.odeme_katilimcilari enable row level security;

/*
  Katılımcı KENDİ satırını görebiliyor: panel "koltuğun karşılandı" diyebilmek
  için bunu okuyor.

  Ödeyen, katılımcıların listesini GÖREMİYOR ve bu bilinçli. Kurumsal alıcının
  ilk isteyeceği şey ekip takibi olur ama o, başkalarının ilerlemesini
  göstermek demek; katılımcıya baştan söylenmeden yapılacak bir şey değil.
  Bugünkü karar: açılmıyor.
*/
create policy odeme_katilimcilari_kendi on public.odeme_katilimcilari
  for select using (user_id = auth.uid() or is_admin());

create policy odeme_katilimcilari_admin_yaz on public.odeme_katilimcilari
  for all using (is_admin()) with check (is_admin());

/* ---------------------------------------------------- ortak oturumlar --- */

/*
  Kurumsal eğitim ortak yapılıyor: tek toplantı, tek bağlantı, dört katılımcı.

  Buna rağmen her katılımcı için AYRI satır yazılıyor ve görünürlük kuralı
  hiç değişmiyor — herkes yine yalnızca kendi user_id'sini görüyor.

  Alternatif, tek satır yazıp "bu ödemenin katılımcısıysan görürsün" demekti.
  Reddedildi: bu projede tam olarak o tür bir kural yüzünden yönetici bütün
  katılımcıların kayıtlarını görebiliyordu. Kapsam kuralını gevşetmek yerine
  satır çoğaltmak, dört kişilik bir grupta bedava sayılır.

  grup_id o satırları birbirine bağlıyor: yönetici oturumu bir kez
  düzenliyor, saat ya da bağlantı değiştiğinde hepsi birlikte değişiyor.
*/
alter table public.egitim_oturumlari
  add column if not exists grup_id uuid;

comment on column public.egitim_oturumlari.grup_id is
  'Ortak kurumsal oturumun parçası olan satırları birbirine bağlar. Her katılımcının kendi satırı var; düzenleme ve silme grup üzerinden yürüyor.';

create index if not exists egitim_oturumlari_grup_idx on public.egitim_oturumlari (grup_id)
  where grup_id is not null;
