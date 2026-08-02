import type { MetadataRoute } from "next";

/**
 * Uygulama öğrenciler için: ana ekrandan açılınca doğrudan panele düşüyor,
 * satış sayfalarına değil. Ödeme akışı bilerek dışarıda kalıyor — uygulama
 * satın alma yeri değil, satın alınmış eğitime erişim yeri.
 *
 * scope "/" çünkü panel içinden yasal sayfalara ve çıkışa gidiliyor; daha dar
 * bir kapsam o bağlantıları tarayıcıya atardı.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ahmet Ekinci Akademi",
    short_name: "AE Akademi",
    description: "Eğitim panelin: dersler, birebir eğitim kayıtları, dokümanlar ve seans takvimin.",
    start_url: "/panel",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    // Durum çubuğu şeridiyle aynı marka mavisi; PWA'da da tutarlı görünsün.
    theme_color: "#1c56f3",
    lang: "tr",
    dir: "ltr",
    categories: ["education"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Android ikonu kendi maskesiyle kırpıyor; bu sürümde işaret güvenli
      // alanda kalsın diye daha küçük.
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Derslerim", url: "/panel/dersler" },
      { name: "Birebir eğitim", url: "/panel/birebir-egitim" },
      { name: "Seans takvimim", url: "/panel/seanslar" },
    ],
  };
}
