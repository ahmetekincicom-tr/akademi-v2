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
  /*
    HTTPS zorunlu — yönlendirmeyle değil, tarayıcının hafızasıyla.

    Vercel zaten HTTP'yi HTTPS'e çeviriyor ama o çevirme İLK isteğin şifresiz
    gitmesi demek: açık bir kablosuz ağda o tek istek yakalanıp sahte bir
    sayfaya çevrilebiliyor. Bu başlıktan sonra tarayıcı bu alan adına bir daha
    hiç HTTP denemiyor.

    Bir yıl (31536000) ve alt alan adları dahil. `preload` BİLEREK yok:
    listeye girmek kolay, çıkmak aylar sürüyor ve bir alt alan adının
    HTTPS'siz kaldığı gün geri dönüşü olmuyor.
  */
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // Dış sitelere adresin tamamı gitmesin; şifre sıfırlama gibi belirteç
  // taşıyan adreslerde önemli.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Sayfanın hiç kullanmadığı donanım izinleri baştan kapalı.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  /*
    Yüklenen görseller Supabase Storage'ta duruyor ve next/image yabancı bir
    konaktan görsel işlemeyi izin verilmedikçe reddediyor. Bu izin olmadığı
    için bütün yüklü görseller düz <img> ile basılıyordu: boyutlandırma ve
    modern format dönüşümü devre dışıydı — telefonda 1200 piksellik bir kapak,
    300 piksellik kutuya olduğu gibi iniyordu.

    Konak adı NEXT_PUBLIC_SUPABASE_URL'den türetiliyor: elle yazılsaydı proje
    taşındığında sessizce bozulur, bütün görseller kaybolurdu.

    SVG bilerek açılmıyor (dangerouslyAllowSVG yok). SVG script taşıyabiliyor
    ve logolarımız SVG; onlar <img> ile basılmaya devam ediyor — vektör
    oldukları için zaten boyutlandırmadan bir şey kazanmıyorlar.
  */
  images: {
    remotePatterns: (() => {
      const kok = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!kok) return [];
      try {
        return [
          {
            protocol: "https" as const,
            hostname: new URL(kok).hostname,
            pathname: "/storage/v1/object/public/**",
          },
        ];
      } catch {
        return [];
      }
    })(),
  },

  async headers() {
    return [
      { source: "/:yol*", headers: GUVENLIK_BASLIKLARI },
      /*
        Yüklenen dosyalar artık BİZİM alan adımızdan çıkıyor (/dosya ucu).
        Supabase'ten servis edilirken ayrı bir kaynaktı; bugün adrese doğrudan
        gidilen bir SVG, içindeki script'i panelin kaynağında çalıştırabilirdi.

        default-src 'none' script-src'e de düşüyor, yani o script çalışmıyor.
        style-src açık: SVG'lerin kendi <style> bloğu var, kapatmak logoyu
        bozardı. Bu kural yalnızca dosyanın kendi adresine gidildiğinde
        geçerli; sayfadaki <img> zaten script çalıştırmıyor, görüntülemeye
        etkisi yok.

        Aynı anahtar iki kez veriliyor: sonraki kural öncekini eziyor, o
        yüzden frame-ancestors da burada tekrar yazılı.
      */
      {
        source: "/dosya/:yol*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
