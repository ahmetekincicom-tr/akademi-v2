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

Doğrulama: `/<yönetim>/tani` → **E-posta bildirimleri** → **Test e-postası gönder**.

## Auth şablonları

`docs/eposta-sablonlari/` altındaki dört dosya, Supabase panelindeki şablonların
karşılığı:

| Dosya | Supabase → Authentication → Email Templates |
| --- | --- |
| `hesap-dogrulama.html` | Confirm signup |
| `sifre-sifirlama.html` | Reset password |
| `davet.html` | Invite user |
| `eposta-degisikligi.html` | Change email address |
| `sihirli-baglanti.html` | Magic Link / OTP (Sihirli bağlantı veya OTP) |
| `yeniden-dogrulama.html` | Reauthentication (Yeniden kimlik doğrulama) |
| `sifre-degisti.html` | Password changed (Güvenlik → Şifre değiştirildi) |

`sihirli-baglanti` ve `yeniden-dogrulama` `{{ .Token }}` kullanıyor —
bağlantı değil, ekrana girilecek kod. Kod metin olarak basılıyor, görsel
olarak değil: e-postada görsel engellenebiliyor ve kodu kopyalayamayan kişi
giriş yapamaz.

`sifre-degisti` şablonunun karşılığı olan bildirim Supabase'de **varsayılan
olarak kapalı**. Şablonu yapıştırmak yetmiyor, "Şifre değiştirildi" anahtarını
da açmak gerekiyor. Açılması önerilir: şifresi izinsiz değiştirilen kişinin
durumu fark etmesinin tek yolu bu mail.

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

### supabase.co adresi neden görünmüyor

Şablonlar `{{ .ConfirmationURL }}` KULLANMIYOR. O değişken şuna açılıyor:

```
https://<proje>.supabase.co/auth/v1/verify?token=...&redirect_to=...
```

Yani kullanıcı önce supabase.co'ya uğrayıp oradan siteye dönüyor ve adres
çubuğunda bir an başka bir alan adı görüyor. Şifre sıfırlarken bu güven kırıyor.

Onun yerine bağlantı doğrudan bizim adresimize gidiyor:

```
{{ .SiteURL }}/auth/onayla?token_hash={{ .TokenHash }}&type=recovery&next=/sifre-belirle
```

Doğrulamayı `src/app/auth/onayla/route.ts` yapıyor (`verifyOtp`). Kullanıcı
yalnızca panelin alan adını görüyor. Supabase'in ücretli özel alan adı
eklentisine gerek kalmıyor.

Çalışması için Supabase → Authentication → **URL Configuration → Site URL**
panelin adresine ayarlı olmalı; `{{ .SiteURL }}` oradan geliyor.

`/auth/callback` (kod akışı) yerinde duruyor: şablonlar güncellenmemiş olsa
bile eski bağlantılar çalışmaya devam ediyor.

## Hoş geldin maili

Kişiye bir kez, **ilk girişinde** gönderiliyor (`src/lib/hosgeldin.ts`).

Kayıt anında değil, çünkü:

- E-posta doğrulaması açıkken kayıt olan kişi hesabını henüz kullanamıyor;
  o anda "hoş geldin" demek erken.
- İçe aktarılan ~400 öğrenci kayıt akışından hiç geçmiyor.

İlk giriş ikisini birden yakalayan tek an. Üç yerden tetikleniyor —
`oturumKaydet()` (normal giriş), `/auth/callback` ve `/auth/onayla` (doğrulama
bağlantısıyla gelen kişi giriş formundan geçmiyor).

**Şifre sıfırlamada gönderilmiyor.** O akış da aynı adreslerden geçiyor ama
şifresini sıfırlayan kişinin hesabı zaten var; sıfırlama mailinin hemen
ardından gelen bir "hoş geldin" alakasız duruyor. `/auth/onayla` türe
(`recovery`), `/auth/callback` hedef yola (`/sifre-belirle`) bakıp atlıyor.

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
