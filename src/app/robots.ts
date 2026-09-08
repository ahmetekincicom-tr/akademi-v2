import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Site haritası adresi alan adına bağlı; build anında dondurulursa alan adı
// değiştiğinde eski adresi göstermeye devam ediyor.
export const dynamic = "force-dynamic";

/**
 * Yönetim ve panel adresleri taranmasın: ikisi de oturum istiyor, tarayıcı
 * botu yalnızca giriş yönlendirmesi görüyor ve boşuna istek üretiyor.
 *
 * Geri kalan sayfalar taranabilir bırakılıyor, bilerek: alan adı arama
 * motorlarına kapalıysa engeli X-Robots-Tag başlığı koyuyor (src/proxy.ts) ve
 * o başlığın görülebilmesi için botun sayfayı çekebilmesi gerekiyor.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    // Yönetim yolu BURAYA YAZILMAZ: robots.txt herkese açık bir dosya, gizli
    // tutulan adresi oraya koymak adresi ilan etmek olur. Zaten hiçbir yerden
    // bağlantı verilmiyor ve oturum istiyor.
    //
    // Yapay zekâ tarayıcıları (GPTBot, PerplexityBot, ClaudeBot,
    // Google-Extended) da bilerek engellenmiyor: engellenen platform siteyi
    // cevaplarında kaynak gösteremiyor.
    rules: { userAgent: "*", disallow: ["/panel", "/api"] },
    /*
      İKİ site haritası.

      Blog yazıları ve kategori arşivleri WordPress'te kalmaya devam ediyor
      (next.config.ts'teki fallback rewrite onları aynı alan adı altında
      sunuyor). O sayfaların haritası WordPress tarafında üretiliyor ve burada
      da bildirilmezse Google blogun haritasını tamamen kaybeder — yalnızca
      bu uygulamanın sayfalarını görür.

      Adres RankMath'in ürettiği dizin; WORDPRESS_SITEMAP tanımlı değilse
      yalnızca kendi haritamız bildiriliyor.
    */
    sitemap: [`${SITE_URL}/sitemap.xml`, process.env.WORDPRESS_SITEMAP].filter(
      (a): a is string => Boolean(a),
    ),
  };
}
