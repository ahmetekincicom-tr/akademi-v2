import type { NextConfig } from "next";

/**
 * Güvenlik başlıkları.
 *
 * Tam bir CSP bilerek yok: ölçümleme (GTM/GA) satır içi script yüklüyor ve
 * nonce altyapısı kurmadan yazılacak bir CSP ya ölçümlemeyi kırar ya da
 * 'unsafe-inline' ile kendini geçersiz kılar. Buradakiler o tartışmaya
 * girmeden gerçek saldırıları kapatan, yan etkisi olmayan başlıklar.
 */
const GUVENLIK_BASLIKLARI = [
  // Tıklama hırsızlığı: panel görünmez bir iframe'e alınıp kullanıcıya
  // farkında olmadan tıklatılamasın. Uygulama siteyi iframe'e değil doğrudan
  // WKWebView'a yüklüyor, dolayısıyla bundan etkilenmiyor.
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  // Tarayıcı içerik türünü tahmin etmesin: yüklenen bir dosyanın script
  // olarak çalıştırılmasının önündeki en ucuz engel.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Dış sitelere adresin tamamı gitmesin; şifre sıfırlama gibi belirteç
  // taşıyan adreslerde önemli.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Sayfanın hiç kullanmadığı donanım izinleri baştan kapalı.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:yol*", headers: GUVENLIK_BASLIKLARI }];
  },
};

export default nextConfig;
