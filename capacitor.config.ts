import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Uygulama siteyi uzaktan yüklüyor, paketin içinden değil.
 *
 * Sebep: panelin 47 rotası sunucuda render ediliyor ve oturum, RLS, ödeme
 * durumu istek anında çözülüyor. Statik dışa aktarım mümkün değil, olsaydı
 * bile kişiye özel veriyi paketin içine gömmek yanlış olurdu.
 *
 * BUNUN BEDELİ VAR: Apple'ın 4.2 "Minimum Functionality" kuralı, siteyi
 * olduğu gibi saran uygulamaları reddediyor. Geçmek için push bildirim gibi
 * gerçek native işlevler şart — plugin'ler o yüzden burada.
 */
const config: CapacitorConfig = {
  appId: "com.ahmetekinci.akademi",
  appName: "AE Akademi",
  // Uzaktan yükleme kullanıldığı için bu klasör pratikte boş; Capacitor yine
  // de var olmasını istiyor.
  webDir: "public",

  server: {
    url: "https://akademi-v2.vercel.app/panel",
    // Sadece https; karışık içerik uygulamada sessizce bloklanır.
    androidScheme: "https",
    iosScheme: "https",
    // Panel dışına çıkan bağlantılar (yasal metinler, çıkış) uygulama içinde
    // açılsın; sistem tarayıcısına atmak oturumu koparıyor.
    allowNavigation: ["akademi-v2.vercel.app"],
  },

  ios: {
    // Oturum çerezi WKWebView'da kalıcı olsun; aksi halde öğrenci uygulamayı
    // her açtığında yeniden giriş yapar.
    limitsNavigationsToAppBoundDomains: false,

    // "never" olmalı. "always" iken WKWebView içeriği güvenli alanın altına
    // KENDİSİ itiyordu; CSS'teki env(safe-area-inset-top) boşluğu da üstüne
    // binince aynı boşluk iki kez sayılıyor, üstte beyaz + altında mavi olmak
    // üzere iki bant çıkıyordu. Artık içerik en tepeden başlıyor ve boşluğu
    // tek yerden, CSS veriyor.
    contentInset: "never",

    // Kaydırma sınırın dışına taşarsa arkada bu renk görünür. Üstteki şeritle
    // aynı marka mavisi olduğu için beyaz boşluk yerine sürekli bir renk çıkıyor.
    backgroundColor: "#1c56f3",
    scrollEnabled: true,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#0a0d18",
      showSpinner: false,
    },
    StatusBar: {
      // Capacitor'da DARK = koyu zemin, BEYAZ yazı. Şerit marka mavisi olduğu
      // için yazının beyaz kalması gerekiyor.
      style: "DARK",
      // Yalnızca Android'de etkili; iOS'ta şeridin rengini PanelShell'deki
      // güvenli alan bloğu veriyor.
      backgroundColor: "#1c56f3",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
