import { egitimCtaHtml, type CtaVaryant } from "@/lib/blog-cta";
import type { IlgiliEgitim } from "@/lib/blog-egitim";

/**
 * Blog eğitim CTA'sı (sunucu bileşeni).
 *
 * Markup tek kaynaktan (lib/blog-cta) geliyor; mobil ara CTA içeriğe HTML
 * olarak enjekte edildiği için aynı fonksiyonu burada da kullanıp iki yerin
 * birebir aynı görünmesini garanti ediyoruz. Hangi eğitime çağırdığı yazının
 * kategorisinden (lib/blog-egitim).
 */
export function EgitimCta({ varyant, egitim }: { varyant: CtaVaryant; egitim: IlgiliEgitim }) {
  return <div dangerouslySetInnerHTML={{ __html: egitimCtaHtml(varyant, egitim) }} />;
}
