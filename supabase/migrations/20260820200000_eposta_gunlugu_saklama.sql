-- E-posta günlüğüne saklama süresi ve iki hijyen düzeltmesi.
--
-- Günlük sınırsız birikiyordu ve içinde katılımcıların e-posta adresleri var.
-- Bir kaydın işe yaradığı pencere dar: "geçen ay şu ödeme maili gitti mi"
-- sorusu soruluyor, "iki yıl önce" sorulmuyor. Süresiz saklamak, faydası
-- bitmiş kişisel veriyi tutmak demek — KVKK'nın saklama süresi ilkesi de tam
-- olarak bunu söylüyor.
--
-- 90 gün, giriş kayıtlarıyla aynı: iki farklı sayı tutmanın bir gerekçesi yok
-- ve tek bir sayı akılda kalıyor.

create or replace function public.eski_eposta_gunlugunu_sil()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.eposta_gunlugu where created_at < now() - interval '90 days';
$$;

comment on function public.eski_eposta_gunlugunu_sil() is
  'Gönderim günlüğünün 90 günden eski satırlarını siler. pg_cron gecelik çağırıyor.';

/*
  Çağırma yetkisi yalnızca zamanlayıcıda.

  Fonksiyon SECURITY DEFINER ve RLS'i atlayarak siliyor. Oturum açmış birine
  açık bırakılsaydı, herhangi bir katılımcı REST üzerinden çağırıp günlüğü
  budayabilirdi — "gitti mi" sorusunun cevabını silen bir uç nokta.
*/
revoke execute on function public.eski_eposta_gunlugunu_sil() from public, anon, authenticated;

/* ------------------------------------------------------ hijyen: damga --- */

/*
  duyuru_guncelleme_damgasi'nın search_path'i sabitlenmemişti; diğer bütün
  fonksiyonlarda sabit. Tetikleyici fonksiyonu now() dışında bir şey
  çağırmıyor, yani bugün sömürülebilir değil — ama arama yolu çağıranın
  ayarına bırakılmış bir fonksiyon, ileride gövdesi büyüdüğünde sessizce
  yanlış şemadaki bir nesneyi çağırabilir. Tek satırlık bir tutarlılık
  düzeltmesi.
*/
create or replace function public.duyuru_guncelleme_damgasi()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

/* ------------------------------------------ hijyen: tetikleyici yetkileri --- */

/*
  İki tetikleyici fonksiyonunun REST üzerinden çağırma yetkisi anon ve
  authenticated rollerinde duruyordu.

  Çağrılsalar hata verirler — tetikleyici bağlamı olmadan `new` tanımsız — ama
  bu bir gerekçe değil, bir tesadüf. Yarın gövdeleri değişirse ya da bir
  Postgres sürümü bu davranışı gevşetirse, dışarıya açık kalmış olurlar.

  Tetikleyicilerin kendisi etkilenmiyor: Postgres tetikleyici çalıştırırken
  EXECUTE yetkisine bakmıyor. Kanıtı bu veritabanında zaten var —
  handle_new_user aynı revoke'u taşıyor ve her yeni kayıtta çalışıyor.
*/
revoke execute on function public.gorusme_odeme_tamamlandi() from public, anon, authenticated;
revoke execute on function public.handle_user_email_degisti() from public, anon, authenticated;
