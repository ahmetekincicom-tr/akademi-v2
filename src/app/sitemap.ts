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
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const simdi = new Date();
  const yasal = await getYasalSayfalar();

  // Ön yüz kapalıyken arama motoruna açık tek yüz: giriş ekranı ve yasal
  // metinler.
  const giris: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/giris`, lastModified: simdi, changeFrequency: "monthly", priority: 1 },
  ];

  const yasalGirdileri: MetadataRoute.Sitemap = yasal.map((y) => ({
    url: `${SITE_URL}/${y.slug}`,
    lastModified: simdi,
    changeFrequency: "yearly" as const,
    priority: 0.3,
  }));

  if (!ON_YUZ_ACIK) return [...giris, ...yasalGirdileri];

  const egitimler = await getCourses();

  return [
    { url: `${SITE_URL}/`, lastModified: simdi, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/egitimler`, lastModified: simdi, changeFrequency: "weekly", priority: 0.9 },
    ...egitimler.map((e) => ({
      url: `${SITE_URL}/egitimler/${e.slug}`,
      lastModified: simdi,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    { url: `${SITE_URL}/hakkimizda`, lastModified: simdi, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/kurumsal`, lastModified: simdi, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/referanslar`, lastModified: simdi, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/yorumlar`, lastModified: simdi, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/iletisim`, lastModified: simdi, changeFrequency: "yearly", priority: 0.5 },
    ...giris,
    ...yasalGirdileri,
  ];
}
