import { createClient } from "@/lib/supabase/server";
import { getCourses } from "@/lib/courses";
import { SEO_SAYFALARI, aciklamayiKisalt } from "@/lib/sayfa-seo";
import { SITE_URL } from "@/lib/seo";
import { SeoYonetimi, type SeoSatiri } from "@/components/admin/SeoYonetimi";

// Panelden yazılan bir metin kaydedilir kaydedilmez listede görünmeli.
export const dynamic = "force-dynamic";

/**
 * SEO yönetimi.
 *
 * Tanıtım sayfaları ve eğitimler tek listede; ikisinin verisi ayrı yerlerde
 * duruyor ama düzenleyen kişi için o bir ayrım değil. Gerekçesi actions.ts'te.
 *
 * Eğitim listesi getCourses() ile alınıyor: yayında olmayanlar da dahil
 * değil — arama motorunda görünmeyen bir sayfanın SEO metnini yazmak boşa
 * emek olurdu.
 */
export default async function AdminSeoPage() {
  const supabase = await createClient();

  const [{ data: ezmeler }, egitimler] = await Promise.all([
    supabase.from("sayfa_seo").select("yol, baslik, aciklama"),
    getCourses(),
  ]);

  const ezmeHaritasi = new Map((ezmeler ?? []).map((e) => [e.yol, e]));

  const sayfaSatirlari: SeoSatiri[] = SEO_SAYFALARI.map((s) => {
    const ezme = ezmeHaritasi.get(s.yol);
    return {
      tip: "sayfa" as const,
      anahtar: s.yol,
      ad: s.ad,
      adres: s.yol === "/" ? "/" : `${s.yol}/`,
      baslik: ezme?.baslik ?? "",
      aciklama: ezme?.aciklama ?? "",
      otomatikBaslik: s.baslik,
      // Yer tutucuda da kısaltılmış hâli gösteriliyor: sitede basılacak olan o.
      otomatikAciklama: aciklamayiKisalt(s.aciklama),
    };
  });

  const egitimSatirlari: SeoSatiri[] = egitimler.map((e) => ({
    tip: "egitim" as const,
    anahtar: e.slug,
    ad: e.baslik,
    adres: `/egitimler/${e.slug}/`,
    baslik: e.seoBaslik,
    aciklama: e.seoAciklama,
    otomatikBaslik: e.baslik,
    otomatikAciklama: aciklamayiKisalt(e.heroAciklama || e.aciklama),
  }));

  return <SeoYonetimi satirlar={[...sayfaSatirlari, ...egitimSatirlari]} siteUrl={SITE_URL} />;
}
