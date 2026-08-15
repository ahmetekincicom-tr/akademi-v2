# E-posta

Projede iki ayrı e-posta yolu var ve karıştırılması kolay:

| Yol | Kim gönderiyor | İçeriği kim belirliyor |
| --- | --- | --- |
| **Auth mailleri** — hesap doğrulama, şifre sıfırlama, davet, adres değişikliği | Supabase | Supabase panelindeki şablonlar |
| **Uygulama mailleri** — yönetici bildirimleri, hoş geldin | Bizim kodumuz (`src/lib/eposta.ts`) | `src/lib/eposta-sablon.ts` |

İkisi de aynı Resend hesabından çıkıyor (SMTP ile bağlandı), ama **auth
maillerinin HTML'ini uygulama kodu üretmiyor** — Supabase kendi şablonuyla
üretip gönderiyor. Bu yüzden onları markalaştırmak kod değişikliğiyle değil,
Supabase paneline HTML yapıştırarak yapılıyor.

## Kurulum

```
RESEND_API_KEY    = re_...
BILDIRIM_GONDEREN = Akademi <bildirim@ahmetekinciakademi.com>
BILDIRIM_EPOSTA   = iletisim@ahmetekinci.com.tr
```

Gönderen adresi Resend'de **doğrulanmış** alan adından olmalı; doğrulanmamış
alan adından gönderim reddediliyor. `BILDIRIM_EPOSTA` virgülle birden çok adres
alabiliyor.

Üçünden biri eksikse bildirimler sessizce kapalı kalıyor — ödemeler, mesajlar ve
talepler normal çalışmaya devam ediyor.

Doğrulama: `/admin/tani` → **E-posta bildirimleri** → **Test e-postası gönder**.

## Auth şablonları

`docs/eposta-sablonlari/` altındaki dört dosya, Supabase panelindeki şablonların
karşılığı:

| Dosya | Supabase → Authentication → Email Templates |
| --- | --- |
| `hesap-dogrulama.html` | Confirm signup |
| `sifre-sifirlama.html` | Reset password |
| `davet.html` | Invite user |
| `eposta-degisikligi.html` | Change email address |

Kurulum: dosyayı bir metin düzenleyicide aç, tamamını kopyala, Supabase'deki
ilgili şablonun **Message body** alanına yapıştır, kaydet. Konu satırlarını da
Türkçeleştirmeyi unutma (şablonun üstündeki **Subject heading** alanı).

Dosyalar elle düzenlenmiyor — `src/lib/eposta-sablon.ts` değişince yeniden
üretiliyor:

```
node scripts/auth-eposta-sablonlari.mjs
```

Aynı `bildirimSablonu()` kullanıldığı için auth mailleri ile panel bildirimleri
arasında tasarım ayrışması olmuyor. Ancak **üretilen HTML Supabase'e otomatik
gitmiyor**; şablon değişikliğinden sonra dört dosyayı tekrar yapıştırmak gerekiyor.

`{{ .ConfirmationURL }}` Supabase'in kendi değişkeni ve şablondan olduğu gibi
geçiyor: `bildirimSablonu` içindeki kaçırma yalnızca `& < > "` karakterlerini
değiştiriyor, bu değişken hiçbirini içermiyor.

## Hoş geldin maili

Kişiye bir kez, **ilk girişinde** gönderiliyor (`src/lib/hosgeldin.ts`).

Kayıt anında değil, çünkü:

- E-posta doğrulaması açıkken kayıt olan kişi hesabını henüz kullanamıyor;
  o anda "hoş geldin" demek erken.
- İçe aktarılan ~400 öğrenci kayıt akışından hiç geçmiyor.

İlk giriş ikisini birden yakalayan tek an. İki yerden tetikleniyor —
`oturumKaydet()` (normal giriş) ve `/auth/callback` (doğrulama bağlantısıyla
gelen kişi giriş formundan geçmiyor).

### Damga neden mailden önce atılıyor

```ts
.update({ hosgeldin_tarihi: now })
.eq("id", user.id)
.is("hosgeldin_tarihi", null)
.select("ad")
```

Koşul update'in kendi içinde. "Önce oku, boşsa gönder, sonra damgala" olsaydı
aynı anda açılan iki sekme ikisi de boş görüp iki mail yollardı. Burada damgayı
yalnızca bir istek yazabiliyor; dönen satır da o.

Bunun bedeli: mail gönderilemezse bir daha denenmiyor. Tersi çok daha kötü —
her girişte tekrar eden bir "hoş geldin" maili.

`profiles`'ta UPDATE yetkisi kolon kolon veriliyor; `hosgeldin_tarihi` için
grant migration'da var. Olmasaydı damga sessizce yazılamaz ve mail her girişte
tekrar giderdi.

## Yönetici bildirimleri

| Olay | Nerede |
| --- | --- |
| Kartla ödeme geçti | `src/lib/odeme-sonuc.ts` |
| İletişim / teklif formu | `src/app/mesaj-actions.ts` |
| Danışmanlık talebi | `src/app/panel/gorusmeler/actions.ts` |
| Destek talebi açıldı | `src/app/destek-actions.ts` → `talepAc` |
| Destek talebine öğrenci yazdı | `src/app/destek-actions.ts` → `mesajGonder` |
| Hesap silme talebi | `src/app/panel/hesabim/silme-actions.ts` |

Hepsi kayıt yazıldıktan **sonra** gönderiliyor ve `yoneticiBildirimi()` hata
fırlatmıyor: postanın gitmemesi mesajı, talebi ya da tahsilatı kaybetmemeli.

Destek yazışmasında yalnızca öğrenci yazdığında bildirim gidiyor. Yönetici kendi
cevabının mailini alsaydı her yazışma iki kat gürültü üretir ve bildirimler
okunmaz hale gelirdi.

## Şablon neden böyle yazıldı

E-posta HTML'i web HTML'i değil (`src/lib/eposta-sablon.ts`):

- **Yerleşim tabloyla** — Outlook, Word render motorunu kullanıyor; flex ve grid
  tanımıyor.
- **Stiller satır içi** — Gmail `<style>` bloğunu kısmen uyguluyor, bazı
  istemciler hiç.
- **Sistem yazı tipi yığını** — e-postada `@font-face` güvenilir değil, sitenin
  özel yazı tipleri kullanılamıyor.
- **Arka planlar açıkça veriliyor** — karanlık moddaki istemciler renk verilmeyen
  alanları kendileri koyulaştırıp metni okunmaz hale getiriyor.

## Sınır

Resend ücretsiz planı **ayda 3.000, günde 100** mail. Yönetici bildirimleri,
hoş geldin ve auth mailleri için fazlasıyla yeter. 400 kişiye toplu duyuru maili
atmak istenirse günlük sınır ilk gönderimde aşılır — o noktada ücretli plana
geçmek ya da gönderimi günlere bölmek gerekiyor.
