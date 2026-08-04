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
    rules: { userAgent: "*", disallow: ["/admin", "/panel", "/api"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
