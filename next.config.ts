import type { NextConfig } from "next";
import { YONLENDIRMELER } from "./src/lib/tasima";

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

/**
 * WordPress'in hâlâ sunduğu içerik için kaynak adres.
 *
 * Blog yazıları, kategori arşivleri ve yeni projede karşılığı olmayan eski
 * sayfalar WordPress'te kalmaya devam ediyor. Bu değişken tanımlı değilse
 * fallback rewrite hiç kurulmuyor — yani ortam yanlış yapılandırıldığında
 * sessizce bozuk bir proxy kurmak yerine uygulama eskisi gibi davranıyor.
 *
 * Örnek: https://wp.ahmetekinciakademi.com
 */
const WORDPRESS_KAYNAK = process.env.WORDPRESS_KAYNAK?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  /*
    Adreslerin sonunda eğik çizgi.

    WordPress bütün adresleri "/hakkimizda/" biçiminde üretiyordu ve
    indekslenmiş 56 adresin tamamı böyle. Next'in varsayılanı ise sondaki
    çizgiyi atıp yönlendirme yapmak; o durumda Google'ın bildiği HER adres
    fazladan bir sıçrama yerdi. Açık bırakınca eski yapıyla birebir eşleşiyor.
  */
  trailingSlash: true,

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

  /*
    Eski WordPress adreslerinden yenilerine kalıcı yönlendirme.

    Liste ve gerekçesi src/lib/tasima.ts'te; orada testlerle korunuyor
    (zincir yok, çift kaynak yok, hedefler gerçek sayfalar).

    permanent: true → 308. Next 301 yerine 308 üretiyor; ikisi de "kalıcı" ve
    Google ikisini de aynı şekilde değerlendiriyor, farkı 308'in istek yöntemini
    koruması.

    HEDEFE EĞİK ÇİZGİ EKLENİYOR — zincir olmasın diye. trailingSlash açık
    olduğu için sitenin gerçek adresi "/egitimler/meta-ads-egitimi/". Hedefi
    çizgisiz yazınca Next önce buraya, sonra çizgili biçime yönlendiriyordu:
    eski adres → çizgisiz → çizgili, yani iki sıçrama. Ölçüldü ve düzeltildi;
    şimdi tek sıçrama.
  */
  async redirects() {
    return YONLENDIRMELER.map(({ eski, yeni }) => ({
      source: eski,
      destination: yeni.endsWith("/") ? yeni : `${yeni}/`,
      permanent: true,
    }));
  },

  /*
    WordPress'te kalan içerik.

    "fallback" grubu, Next kendi rotalarını VE dinamik rotalarını denedikten
    sonra, tam 404 verecekken çalışıyor. Yani:

      /egitimler/meta-ads-egitimi  → bu uygulama (kendi rotası)
      /hakkimizda                  → bu uygulama
      /meta-capi-nedir             → burada yok  → WordPress
      /blog, /sosyal-medya         → WordPress (kategori arşivi)
      /wp-content/...              → WordPress (görsel, stil)

    Blog yazılarının kökte durması bunu zorunlu kılıyor: yazılar /blog/ altında
    değil, doğrudan kökte (/meta-capi-nedir gibi). Tek tek liste yazmak yerine
    "bilmediğim her şey WordPress'in" demek, yeni yazılan yazıların da kod
    değişikliği olmadan çalışması demek.
  */
  async rewrites() {
    if (!WORDPRESS_KAYNAK) return { beforeFiles: [], afterFiles: [], fallback: [] };
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [
        /*
          İki kural, çünkü sondaki eğik çizgi kritik.

          trailingSlash açıkken Next eşleştirmeden önce sondaki çizgiyi
          kaldırıyor; hedefe olduğu gibi geçirseydik WordPress "/meta-capi-nedir"
          isteği alırdı. WordPress ise kanonik adresi çizgili tutuyor ve
          çizgisiz gelen isteği home_url'e — yani PUBLIC alan adına — 301'liyor.
          O da bizim başladığımız adres: sonsuz yönlendirme döngüsü.

          Bu yüzden sayfalara çizgi geri ekleniyor. Ama dosyalara EKLENMEMELİ:
          "/wp-content/.../gorsel.jpg/" diye bir dosya yok, görseller kırılırdı.
          İlk kural noktalı (uzantılı) yolları yakalayıp olduğu gibi geçiriyor,
          ikincisi geri kalan her şeye çizgiyi ekliyor.
        */
        { source: "/:dosya*\\.:uzanti", destination: `${WORDPRESS_KAYNAK}/:dosya*.:uzanti` },
        { source: "/:yol*", destination: `${WORDPRESS_KAYNAK}/:yol*/` },
      ],
    };
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
