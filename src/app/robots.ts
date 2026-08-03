import type { MetadataRoute } from "next";

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
  };
}
