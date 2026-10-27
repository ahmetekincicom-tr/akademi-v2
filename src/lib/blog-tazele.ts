import "server-only";

import { revalidatePath } from "next/cache";

/**
 * Bir yazı ya da kategori değiştiğinde tazelenmesi gereken ön yüz sayfaları.
 *
 * Yazılar ve kategori arşivleri KÖKTE sunuluyor (/{slug}), /blog yalnız
 * dizin. Sayfalar saatlik yeniden üretiliyor (ISR); kayıt anında görünsün
 * diye burada tazeleniyor. Tek yerde toplandı: panel kaydı, yayından
 * kaldırma, silme ve zamanlı yayın görevi aynı listeyi tazelesin, biri
 * sitemap'i unutmasın.
 *
 * Kaydetmeden yeniden yayınlamaya gerek yok — ahmetekinci.com.tr'de statik
 * site her kayıtta baştan üretiliyordu (dakikada bir sınırıyla). Burada
 * yalnız değişen sayfalar, anında.
 */
export function blogSayfalariniTazele(slugs: (string | null | undefined)[]): void {
  revalidatePath("/blog");
  revalidatePath("/blog/rss.xml");
  revalidatePath("/sitemap.xml");
  for (const slug of new Set(slugs.filter((s): s is string => Boolean(s)))) {
    revalidatePath(`/${slug}`);
  }
}
