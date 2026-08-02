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
reddediyor. Şu an projede splash screen, status bar ve push bildirim plugin'leri
kurulu ama **push henüz uçtan uca bağlı değil**. İncelemeye göndermeden önce
push'un çalışır olması güçlü tavsiye — en somut native işlev bu ve senin iş
akışına da uyuyor: "yarın 19:00 dersin var", "ödemen onaylandı", "yeni kayıt
yüklendi".

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
