import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { getCourses } from "@/lib/courses";
import { getYasalSayfalar } from "@/lib/yasal";
import { ON_YUZ_ACIK } from "@/proxy";

// İçerik yönetim panelinden değişiyor; build anında dondurulmamalı.
export const dynamic = "force-dynamic";

/**
 * Site haritası.
 *
 * Yalnızca GERÇEKTEN sunulan sayfalar var. Ön yüz kapalıyken (bkz.
 * src/proxy.ts → ON_YUZ_ACIK) tanıtım sayfaları panel girişine
 * yönlendiriliyor; yönlendirilen bir adresi site haritasına koymak arama
 * motoruna "burada içerik var" deyip başka bir yere göndermek olurdu ve
 * Search Console'da "Yönlendirmeli sayfa" hatası olarak geri döner.
 *
 * Panel ve yönetim sayfaları hiçbir durumda listede değil: ikisi de oturum
 * istiyor, tarayıcı botu yalnızca giriş yönlendirmesi görür.
 */
/*
  Adresler sondaki eğik çizgiyle yazılıyor: next.config.ts'te trailingSlash
  açık, yani sitenin gerçek adresleri "/egitimler/" biçiminde. Çizgisiz
  yazılsaydı site haritasındaki her satır yönlendirmeye düşer ve Search
  Console "Yönlendirmeli sayfa" uyarısı verirdi.
*/
function adres(yol: string): string {
  if (yol === "/") return `${SITE_URL}/`;
  return `${SITE_URL}${yol.startsWith("/") ? yol : `/${yol}`}/`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const simdi = new Date();
  const yasal = await getYasalSayfalar();

  // Ön yüz kapalıyken arama motoruna açık tek yüz: giriş ekranı ve yasal
  // metinler.
  const giris: MetadataRoute.Sitemap = [
    { url: adres("/giris"), lastModified: simdi, changeFrequency: "monthly", priority: 1 },
  ];

  const yasalGirdileri: MetadataRoute.Sitemap = yasal.map((y) => ({
    url: adres(y.slug),
    lastModified: simdi,
    changeFrequency: "yearly" as const,
    priority: 0.3,
  }));

  if (!ON_YUZ_ACIK) return [...giris, ...yasalGirdileri];

  /*
    "Çok yakında" eğitimler haritaya GİRMİYOR.

    Sayfaları artık 404 değil, 200 dönüyor (bkz. egitimler/[slug]/page.tsx →
    CokYakindaSayfasi) — yani taranabilirler ve eski adreslerden gelen
    yönlendirmeler ölü sayfaya düşmüyor. Ama içerikleri henüz ince: yalnızca
    başlık, kısa açıklama ve "yakında" bildirimi.

    Erişilebilir olmak ile site haritasıyla ÖNERMEK farklı şeyler. İnce bir
    sayfayı haritaya koymak, arama motoruna "bunu dizine al" demek olur; o
    program açıldığında sayfa dolduğunda haritaya kendiliğinden giriyor.
  */
  const egitimler = (await getCourses()).filter((e) => !e.cokYakinda);

  return [
    { url: adres("/"), lastModified: simdi, changeFrequency: "weekly", priority: 1 },
    { url: adres("/egitimler"), lastModified: simdi, changeFrequency: "weekly", priority: 0.9 },
    ...egitimler.map((e) => ({
      url: adres(`/egitimler/${e.slug}`),
      lastModified: simdi,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    { url: adres("/hakkimizda"), lastModified: simdi, changeFrequency: "monthly", priority: 0.7 },
    { url: adres("/kurumsal"), lastModified: simdi, changeFrequency: "monthly", priority: 0.7 },
    { url: adres("/referanslar"), lastModified: simdi, changeFrequency: "monthly", priority: 0.6 },
    { url: adres("/yorumlar"), lastModified: simdi, changeFrequency: "monthly", priority: 0.6 },
    { url: adres("/iletisim"), lastModified: simdi, changeFrequency: "yearly", priority: 0.5 },
    ...giris,
    ...yasalGirdileri,
  ];
}
