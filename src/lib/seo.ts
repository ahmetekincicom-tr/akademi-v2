import type { Metadata } from "next";

/**
 * SEO'nun tek kaynağı.
 *
 * Site şu an arama motorlarına kapalı (src/proxy.ts, X-Robots-Tag). Buradaki
 * her şey o kapı açıldığı anda çalışmaya hazır olsun diye hazırlanıyor;
 * kapalıyken de zararı yok, sosyal medya paylaşımlarında zaten kullanılıyor.
 */

/**
 * Kanonik adres. Site birden çok adresten yayına girebiliyor
 * (panel alt alan adı, *.vercel.app); hangisinin "gerçek" olduğunu arama
 * motoruna söylemezsek aynı içeriği farklı adreslerde görüp bölüyor.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://akademi-v2.vercel.app").replace(
  /\/$/,
  "",
);

export const SITE_ADI = "Ahmet Ekinci Akademi";

export const VARSAYILAN_ACIKLAMA =
  "Ankara merkezli birebir dijital pazarlama eğitimi. Meta Ads (Facebook & Instagram reklamları), " +
  "sosyal medya yönetimi ve yapay zekâ araçları; kurumlara ve girişimcilere özel program.";

/** Paylaşım görseli; marka logosu yüklendiğinde ondan da beslenebilir. */
export const OG_GORSEL = `${SITE_URL}/acilis-logo.svg`;

type SayfaSeo = {
  baslik: string;
  aciklama: string;
  /** Sitedeki yol: "/egitimler" gibi. Kanonik adres bundan kuruluyor. */
  yol: string;
  /** Giriş, kayıt gibi arama sonucunda işi olmayan sayfalar. */
  indeksleme?: boolean;
  tip?: "website" | "article";
  yayinTarihi?: string;
};

/**
 * Sayfa metadata'sını tek yerden kurar: başlık, açıklama, kanonik adres ve
 * paylaşım kartları. Elle yazıldığında biri hep unutuluyor.
 */
export function sayfaMeta({
  baslik,
  aciklama,
  yol,
  indeksleme = true,
  tip = "website",
  yayinTarihi,
}: SayfaSeo): Metadata {
  const tamAdres = `${SITE_URL}${yol}`;
  // Ana sayfada marka adını iki kez yazmıyoruz.
  const tamBaslik = yol === "/" ? baslik : `${baslik} — ${SITE_ADI}`;

  return {
    title: baslik,
    description: aciklama,
    alternates: { canonical: tamAdres },
    robots: indeksleme ? undefined : { index: false, follow: true },
    openGraph: {
      type: tip,
      url: tamAdres,
      siteName: SITE_ADI,
      title: tamBaslik,
      description: aciklama,
      locale: "tr_TR",
      images: [{ url: OG_GORSEL }],
      ...(yayinTarihi ? { publishedTime: yayinTarihi } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: tamBaslik,
      description: aciklama,
      images: [OG_GORSEL],
    },
  };
}

/* ------------------------------------------------------ yapısal veri --- */

/**
 * JSON-LD, arama motoruna sayfanın NE olduğunu söylüyor: bir kurum mu, bir
 * eğitim mi, bir soru-cevap mı. Zengin sonuçların (yıldız, fiyat, SSS
 * açılır listesi) tek yolu bu.
 */
export function kurumSemasi() {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: SITE_ADI,
    url: SITE_URL,
    description: VARSAYILAN_ACIKLAMA,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Ankara",
      addressCountry: "TR",
    },
    areaServed: "TR",
    knowsLanguage: "tr",
  };
}

export function siteSemasi() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_ADI,
    url: SITE_URL,
    inLanguage: "tr-TR",
  };
}

export function egitimSemasi(kurs: {
  slug: string;
  baslik: string;
  aciklama: string;
  sure: string;
  kapak: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: kurs.baslik,
    description: kurs.aciklama,
    url: `${SITE_URL}/egitimler/${kurs.slug}`,
    ...(kurs.kapak ? { image: kurs.kapak } : {}),
    inLanguage: "tr-TR",
    provider: {
      "@type": "EducationalOrganization",
      name: SITE_ADI,
      url: SITE_URL,
    },
    // Birebir ve eğitmen eşliğinde; Google bu alanı olmadan Course
    // işaretlemesini eksik sayıyor.
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: kurs.sure || undefined,
    },
  };
}

/** Arama sonucunda "Ana sayfa › Eğitimler › …" kırıntısı olarak çıkıyor. */
export function kirintiSemasi(adimlar: { ad: string; yol: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: adimlar.map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: a.ad,
      item: `${SITE_URL}${a.yol}`,
    })),
  };
}
