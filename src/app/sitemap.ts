import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { getCourses } from "@/lib/courses";
import { getYasalSayfalar } from "@/lib/yasal";

// İçerik yönetim panelinden değişiyor; build anında dondurulmamalı.
export const dynamic = "force-dynamic";

/**
 * Site haritası.
 *
 * Yalnızca halka açık sayfalar var: panel ve yönetim oturum istiyor, oraya
 * bakan bir arama motoru yalnızca giriş yönlendirmesi görür. Oturum
 * sayfaları da yok — arama sonucunda işleri olmadığı için noindex'liler.
 *
 * Alan adı arama motorlarına kapalıyken (bkz. src/proxy.ts) bu dosyanın
 * pratik bir etkisi olmuyor; kapı açıldığında hazır olsun diye duruyor.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [egitimler, yasal] = await Promise.all([getCourses(), getYasalSayfalar()]);
  const simdi = new Date();

  const sabit: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: simdi, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/egitimler`, lastModified: simdi, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/hakkimizda`, lastModified: simdi, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/kurumsal`, lastModified: simdi, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/referanslar`, lastModified: simdi, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/yorumlar`, lastModified: simdi, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/iletisim`, lastModified: simdi, changeFrequency: "yearly", priority: 0.5 },
  ];

  return [
    ...sabit,
    ...egitimler.map((e) => ({
      url: `${SITE_URL}/egitimler/${e.slug}`,
      lastModified: simdi,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...yasal.map((y) => ({
      url: `${SITE_URL}/${y.slug}`,
      lastModified: simdi,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
