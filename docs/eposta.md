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

## Auth mailleri: Resend Custom SMTP

Auth mailleri (doğrulama, şifre sıfırlama…) **Supabase tarafından** gönderilir;
Supabase'e Resend SMTP olarak bağlanır. Next.js kodu doğrulama maili göndermez,
Edge Function / Send Email Hook yoktur. Resend SMTP parolası **Next.js `.env`
dosyasına eklenmez** — yalnızca Supabase Dashboard → Authentication → Emails →
SMTP Settings alanına girilir.

### Neden ayrı alt alan adı ve ayrı anahtar

Uygulama mailleri `RESEND_API_KEY` ile kök alan adından (`bildirim@ahmetekinciakademi.com`)
çıkıyor. Auth mailleri için ayrı bir alt alan adı (`auth.ahmetekinciakademi.com`)
ve yalnız bu iş için ayrı bir API anahtarı:

- Toplu/pazarlama gönderimlerindeki olası itibar sorunu doğrulama maillerini
  spam'e düşürmesin.
- Anahtar sızarsa yalnız auth gönderimi etkilenir; ayrı iptal edilir.
- Takip (click/open tracking) alan adı bazında: auth alan adında kapalı tutmak
  kolay, uygulama maillerini etkilemez.

### SMTP ayarları (Supabase → Authentication → Emails → SMTP Settings)

| Alan | Değer |
| --- | --- |
| Enable Custom SMTP | Açık |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | Resend'de **yalnız auth için** oluşturulan API key (Sending access, yalnız `auth.ahmetekinciakademi.com`) |
| Sender name | `Ahmet Ekinci Akademi` |
| Sender email | `hesap@auth.ahmetekinciakademi.com` |
| Minimum interval per user | 60 sn (panel/kayıt ekranındaki geri sayımla aynı) |

Custom SMTP açıldıktan sonra Supabase → Authentication → **Rate Limits** →
"Rate limit for sending emails" değerini kontrol et (varsayılan saatte 30);
toplu kayıt beklenen günlerde yükselt.

### Resend tarafı

1. Domains → Add Domain → `auth.ahmetekinciakademi.com`.
2. Resend'in verdiği kayıtları DNS'e ekle (hepsi `auth.` alt alan adının altında;
   kök alan adındaki mevcut kayıtlar SİLİNMEZ, ikinci bir kök SPF kaydı
   OLUŞTURULMAZ):
   - DKIM: `resend._domainkey.auth` (TXT)
   - SPF/Return-Path: `send.auth` → MX ve TXT (`v=spf1 include:amazonses.com ~all`)
3. DMARC: kökte `_dmarc.ahmetekinciakademi.com` zaten varsa DOKUNMA (alt alan
   adları kökteki politikayı devralır). Yoksa yalnız alt alan adı için
   `_dmarc.auth` TXT → `v=DMARC1; p=none; rua=mailto:<rapor-adresi>` ile başla;
   sonuçlar temizse `p=quarantine`'e geçilir.
4. Domain durumu **Verified** olana kadar SMTP'yi açma.
5. Domain → Configuration: **Click tracking KAPALI, Open tracking KAPALI.**
   Açık olursa Resend doğrulama bağlantısını kendi takip adresiyle yeniden
   yazar; bağlantı tek kullanımlık olduğu için ön-tarama/yeniden yazma onu
   bozabilir, ayrıca kullanıcı başka bir alan adı görür.
6. API Keys → Create → Permission: **Sending access**, Domain:
   `auth.ahmetekinciakademi.com`. Anahtarı yalnız Supabase SMTP Password
   alanına yapıştır; repoya, `.env`'e, sohbete yazma.

### Şablon

"Confirm signup" → `docs/eposta-sablonlari/hesap-dogrulama.html`
(konu: **E-posta adresini doğrula**). Tek düğme + düğme çalışmazsa düz bağlantı;
görsel, sosyal medya ya da pazarlama metni yok; kullanıcı verisi basılmıyor.
Bağlantı `{{ .ConfirmationURL }}` değil, projenin token-hash akışı:
`{{ .SiteURL }}/auth/onayla?token_hash={{ .TokenHash }}&type=signup&next=/panel`.

### Uygulama tarafı

- Kayıt sonrası ekran ve süresi dolmuş bağlantı ekranı (`/giris?hata=1`)
  "Doğrulama bağlantısını tekrar gönder" sunuyor:
  `supabase.auth.resend({ type: "signup", email })` —
  `src/components/auth/DogrulamaYenidenGonder.tsx`. 60 sn geri sayım, 429'da
  Supabase'in bildirdiği süre.

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
