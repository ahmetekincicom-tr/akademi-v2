# iOS uygulaması — Mac'te yapılacaklar

Xcode projesi depoda hazır (`ios/`). Bu adımlar **senin Mac'inde** yapılıyor;
derleme ve imzalama Apple'ın araç zincirini gerektiriyor ve yalnızca macOS'ta
çalışıyor.

## Nasıl çalışıyor

Uygulama siteyi **uzaktan yüklüyor**, paketin içinden değil. Panelin 47 rotası
sunucuda render ediliyor; oturum, yetki ve ödeme durumu istek anında çözülüyor.
Statik dışa aktarım mümkün değil, olsaydı bile kişiye özel veriyi paketin içine
gömmek yanlış olurdu.

Pratikte: uygulama açılınca `akademi-v2.vercel.app/panel` yükleniyor, adres
çubuğu olmadan, kendi ikonuyla. Siteye deploy ettiğin her değişiklik uygulamaya
anında yansıyor — yeni sürüm yayınlaman gerekmiyor.

## Kurulum

```bash
git pull
npm install
npx cap sync ios      # plugin'leri ve yapılandırmayı iOS projesine işler
npx cap open ios      # Xcode'da açar
```

Capacitor 8 Swift Package Manager kullanıyor, **CocoaPods gerekmiyor**.

## Xcode'da

1. Sol üstte **App** hedefini seç → **Signing & Capabilities**
2. **Team**: Apple Developer hesabını seç (yıllık 99 $, yoksa önce
   [developer.apple.com](https://developer.apple.com) üzerinden al)
3. **Bundle Identifier**: `com.ahmetekinci.akademi` — Apple hesabında bu kimlik
   kayıtlı değilse Xcode otomatik oluşturur
4. Push bildirim için: **+ Capability** → **Push Notifications** ekle
5. Cihazını USB ile bağla, üstteki cihaz listesinden seç, **⌘R** ile çalıştır

İlk çalıştırmada telefonun "Güvenilmeyen geliştirici" diyebilir:
Ayarlar → Genel → VPN ve Cihaz Yönetimi → sertifikana güven.

## Mağazaya gönderme

1. Xcode → **Product** → **Archive**
2. **Distribute App** → **App Store Connect**
3. [appstoreconnect.apple.com](https://appstoreconnect.apple.com) üzerinden
   uygulama kaydını oluştur, ekran görüntülerini ve açıklamayı gir
4. Sadece bağlantıyla dağıtım istiyorsan **Unlisted App Distribution** başvurusu
   yap — uygulama App Store aramasında çıkmaz, yalnızca senin verdiğin linkle
   indirilir. Apple bu başvuruyu ayrıca değerlendiriyor.

## İncelemeden geçmek için bilmen gerekenler

**4.2 Minimum Functionality.** Apple, siteyi olduğu gibi saran uygulamaları
reddediyor. Push bildirim uçtan uca bağlı: öğrenci panelde izin veriyor, cihaz
token'ı `push_cihazlar` tablosuna düşüyor, `/admin/bildirimler` ekranından
bildirim gönderiliyor. İncelemeye göndermeden önce kendi telefonuna bir test
bildirimi at — çalıştığını görmeden başvurma.

**5.1.1(v) hesap silme.** Hesabı olan uygulamalarda silmenin uygulama içinden
başlatılabilmesi şart. `/panel/hesabim` altında, yalnızca native uygulamada
görünen iki adımlı bir akış var; talep `profiles.silme_talebi_tarihi` alanına
düşüyor ve `/admin/ogrenciler` listesinde rozet olarak görünüyor.

**3.1.3 ödeme.** Uygulamada satın alma akışı yok, olmamalı da. Havale bilgileri
native uygulamada bilerek gizleniyor (`BankaKutusu` içinde `useNativeUygulama`
kontrolü) — uygulama içinden dışarıdaki ödemeye yönlendirmek reddedilme sebebi.
Öğrenci ödemeyi web'den yapıyor, uygulama satın alınmış eğitime erişim yeri.

**Test hesabı.** İnceleme ekibi giriş yapamadığı uygulamayı reddediyor. Başvuru
formundaki "App Review Information" bölümüne çalışan bir öğrenci hesabının
e-posta ve şifresini yaz.

## Yapılandırma nerede

`capacitor.config.ts` — uygulama kimliği, yüklenecek adres, splash ve status bar
ayarları. Adres değişirse (özel alan adı alırsan) burayı güncelleyip
`npx cap sync ios` çalıştırman yeterli.


## Push bildirim kurulumu

### 1. Xcode'da capability

Xcode → **App** hedefi → **Signing & Capabilities** → **+ Capability** →
**Push Notifications**. Bu adım şart: entitlements dosyası depoda hazır ama
Apple Developer portalındaki App ID'de push'un açılması ancak buradan oluyor.
Otomatik imzalama açıksa Xcode profili kendisi güncelliyor.

### 2. Vercel ortam değişkenleri

Vercel → proje → **Settings** → **Environment Variables**. Dördü de
Production, Preview ve Development için ekle:

| Ad | Değer |
| --- | --- |
| `APNS_KEY_ID` | Apple'ın verdiği Key ID |
| `APNS_TEAM_ID` | Developer hesabının Team ID'si |
| `APNS_BUNDLE_ID` | `com.ahmetekinci.akademi` |
| `APNS_KEY_P8` | `AuthKey_XXXX.p8` dosyasının TAM içeriği, `-----BEGIN` ve `-----END` satırları dahil |

`.p8` dosyası **depoya girmez** — `.gitignore` içinde engelli. Apple onu bir kez
indirtiyor, kaybedersen yeni anahtar üretmen gerekiyor.

Ortam (sandbox / production) ayarlanmıyor: Xcode'dan doğrudan telefona attığın
derlemenin token'ı yalnızca sandbox'ta, TestFlight ve App Store sürümlerininki
yalnızca production'da geçerli, ve token'a bakıp hangisi olduğunu anlamak mümkün
değil. `src/lib/apns.ts` önce production deniyor, `BadDeviceToken` dönen
token'ları sandbox'ta tekrar deniyor. Yani hem test telefonun hem App Store
kullanıcıları aynı anda bildirim alıyor.

### 3. Akış

1. Öğrenci uygulamayı açıyor, panelin üstünde "Bildirimleri aç" kartı çıkıyor
2. "Aç" denince iOS'un izin penceresi geliyor (kart olmadan doğrudan sormuyoruz:
   iOS izni bir kez soruyor, reddedilirse tek çıkış sistem ayarları)
3. İzin verilince cihaz token'ı `push_cihazlar` tablosuna yazılıyor
4. `/admin/bildirimler` ekranından tek öğrenciye ya da herkese gönderiliyor
5. APNs "410 Unregistered" derse (uygulama silinmiş) token geçersiz
   işaretleniyor, sonraki gönderimlerde atlanıyor

Gönderim `src/lib/apns.ts` içinde: ES256 JWT + HTTP/2, hazır paket yok.
