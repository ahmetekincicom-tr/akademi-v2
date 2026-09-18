import { egitimCtaHtml, type CtaVaryant } from "@/lib/blog-cta";

/**
 * Blog eğitim CTA'sı (sunucu bileşeni).
 *
 * Markup tek kaynaktan (lib/blog-cta) geliyor; mobil ara CTA içeriğe HTML
 * olarak enjekte edildiği için aynı fonksiyonu burada da kullanıp iki yerin
 * birebir aynı görünmesini garanti ediyoruz. İçerik statik, etkileşim yok.
 */
export function EgitimCta({ varyant }: { varyant: CtaVaryant }) {
  return <div dangerouslySetInnerHTML={{ __html: egitimCtaHtml(varyant) }} />;
}
