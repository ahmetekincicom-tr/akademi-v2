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
    contentInset: "always",
    backgroundColor: "#ffffff",
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#0a0d18",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0a0d18",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
