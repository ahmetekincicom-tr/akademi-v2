import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { getCourses } from "@/lib/courses";
import { getYayindakiYazilar, getKategoriler } from "@/lib/yazilar";
import { getYasalSayfalar } from "@/lib/yasal";
import { ETIKET_ESIGI, etiketleriTopla, etiketliMi } from "@/lib/blog-etiket";
import { enGec, sayfaTarihleri, yaziTarihi } from "@/lib/site-haritasi";
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
 *
 * lastmod: her adreste o sayfanın gösterdiği içeriğin gerçek son değişikliği
 * (lib/site-haritasi). İçeriği koddan gelen ve tarihi bilinmeyen sayfalarda
 * (giriş, iletişim) hiç yazılmıyor — "şu an" yazmak bütün siteyi her istekte
 * değişmiş gösterir, Google da lastmod'u yok saymaya başlar.
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
  const yasal = await getYasalSayfalar();

  // Ön yüz kapalıyken arama motoruna açık tek yüz: giriş ekranı ve yasal
  // metinler.
  const giris: MetadataRoute.Sitemap = [
    { url: adres("/giris"), changeFrequency: "monthly", priority: 1 },
  ];

  const yasalGirdileri: MetadataRoute.Sitemap = yasal.map((y) => ({
    url: adres(y.slug),
    // Metnin üstünde yazan "son güncelleme" tarihi (panelden giriliyor).
    lastModified: enGec(y.guncelleme),
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
  const [yazilar, kategoriler, t] = await Promise.all([getYayindakiYazilar(), getKategoriler(), sayfaTarihleri()]);
  const yazilarinEnGeci = (liste: typeof yazilar) => enGec(...liste.map(yaziTarihi));
  const egitimlerinEnGeci = enGec(...egitimler.map((e) => e.guncelleme));

  /*
    Yazılar ve kategoriler KÖKTE (/{slug}/) — WordPress yapısı birebir korundu.
    /blog yalnızca dizin sayfası. Blog dizini ve yazılar yalnızca yayında yazı
    varsa haritaya giriyor: boş bir dizini önermenin anlamı yok.

    Kategori arşivi yalnızca içinde yayında yazı varsa haritaya giriyor: boş bir
    kategori (ör. henüz yazısı olmayan) ince/yönlendirmesiz sayfa olur, dizine
    önerilmez.
  */
  const dolukategoriSlug = new Set(yazilar.map((y) => y.kategori?.slug).filter(Boolean) as string[]);

  const blogGirdileri: MetadataRoute.Sitemap =
    yazilar.length > 0
      ? [
          { url: adres("/blog"), lastModified: yazilarinEnGeci(yazilar), changeFrequency: "weekly", priority: 0.7 },
          ...yazilar.map((y) => ({
            url: adres(`/${y.slug}`),
            // Gerçek içerik güncellemesi (yazıdaki dateModified ile aynı kaynak);
            // yoksa yayın tarihi.
            lastModified: enGec(yaziTarihi(y)),
            changeFrequency: "monthly" as const,
            priority: 0.6,
          })),
          ...kategoriler
            .filter((k) => dolukategoriSlug.has(k.slug))
            .map((k) => ({
              url: adres(`/${k.slug}`),
              lastModified: yazilarinEnGeci(yazilar.filter((y) => y.kategori?.slug === k.slug)),
              changeFrequency: "weekly" as const,
              priority: 0.5,
            })),
          // Etiket sayfaları yalnız yeterince doluysa (lib/blog-etiket →
          // ETIKET_ESIGI); azı noindex, haritaya da girmiyor.
          ...etiketleriTopla(yazilar)
            .filter((e) => e.adet >= ETIKET_ESIGI)
            .map((e) => ({
              url: adres(`/blog/etiket/${e.slug}`),
              lastModified: yazilarinEnGeci(yazilar.filter((y) => etiketliMi(y, e.slug))),
              changeFrequency: "weekly" as const,
              priority: 0.4,
            })),
        ]
      : [];

  return [
    // Ana sayfa: eğitim kartları, referans şeridi ve yorumlar.
    { url: adres("/"), lastModified: enGec(egitimlerinEnGeci, t.referans, t.yorum), changeFrequency: "weekly", priority: 1 },
    { url: adres("/egitimler"), lastModified: egitimlerinEnGeci, changeFrequency: "weekly", priority: 0.9 },
    ...egitimler.map((e) => ({
      url: adres(`/egitimler/${e.slug}`),
      // Eğitim kaydı + sayfadaki referans şeridi.
      lastModified: enGec(e.guncelleme, t.referans),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...blogGirdileri,
    { url: adres("/hakkimizda"), lastModified: enGec(t.hakkimizda, t.referans), changeFrequency: "monthly", priority: 0.7 },
    { url: adres("/kurumsal"), lastModified: enGec(t.kurumsal, t.referans), changeFrequency: "monthly", priority: 0.7 },
    { url: adres("/referanslar"), lastModified: t.referans, changeFrequency: "monthly", priority: 0.6 },
    { url: adres("/yorumlar"), lastModified: t.yorum, changeFrequency: "monthly", priority: 0.6 },
    // İletişim içeriği kodda; güvenilir bir değişiklik tarihi yok.
    { url: adres("/iletisim"), changeFrequency: "yearly", priority: 0.5 },
    // Giriş ekranı ön yüz açıkken haritada yok (noindex; bkz. giris/page.tsx).
    ...yasalGirdileri,
  ];
}
