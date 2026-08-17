import type { Metadata } from "next";
import { EPOSTA, INSTAGRAM_URL, LINKEDIN_URL, OFIS_ADRESI, WHATSAPP_NUMARALAR } from "@/lib/iletisim";

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

/**
 * Paylaşım görseli. PNG olmak ZORUNDA: Facebook, LinkedIn, X ve WhatsApp
 * og:image olarak SVG kabul etmiyor, kart görselsiz çıkıyordu.
 * scripts/og-gorsel.mjs üretiyor — 1200×630.
 */
export const OG_GORSEL = `${SITE_URL}/og.png`;

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
    "@id": `${SITE_URL}/#kurum`,
    name: SITE_ADI,
    url: SITE_URL,
    description: VARSAYILAN_ACIKLAMA,
    logo: `${SITE_URL}/icon-512.png`,
    image: OG_GORSEL,
    email: EPOSTA,
    telephone: WHATSAPP_NUMARALAR[0].gosterim,
    address: {
      "@type": "PostalAddress",
      streetAddress: OFIS_ADRESI,
      addressLocality: "Ankara",
      addressCountry: "TR",
    },
    // sameAs, arama motorlarının ve yapay zekâ arama motorlarının markayı tek
    // bir varlık olarak tanımasını sağlıyor: sitedeki "Ahmet Ekinci Akademi"
    // ile Instagram'daki hesabın aynı şey olduğu ancak böyle söyleniyor.
    sameAs: [INSTAGRAM_URL, LINKEDIN_URL],
    founder: { "@id": `${SITE_URL}/hakkimizda#kisi` },
    areaServed: "TR",
    knowsLanguage: "tr",
  };
}

/**
 * Eğitmenin kendisi bir varlık olarak işaretleniyor.
 *
 * "Ahmet Ekinci kimdir" türü sorularda kaynak olarak seçilmenin yolu bu:
 * yapay zekâ arama motorları kişiyi kurumdan ayrı tanıyabilmeli, ikisi
 * arasındaki bağı da görebilmeli.
 */
export function kisiSemasi(kisi: { ad: string; unvan: string; aciklama: string; gorsel: string | null }) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}/hakkimizda#kisi`,
    name: kisi.ad,
    jobTitle: kisi.unvan,
    description: kisi.aciklama,
    ...(kisi.gorsel ? { image: kisi.gorsel } : {}),
    url: `${SITE_URL}/hakkimizda`,
    sameAs: [INSTAGRAM_URL, LINKEDIN_URL],
    worksFor: { "@id": `${SITE_URL}/#kurum` },
    knowsAbout: [
      "Dijital pazarlama",
      "Meta Ads",
      "Facebook ve Instagram reklamları",
      "Sosyal medya yönetimi",
      "İçerik üretimi",
      "Yapay zekâ araçları",
    ],
    address: { "@type": "PostalAddress", addressLocality: "Ankara", addressCountry: "TR" },
  };
}

/**
 * Sıkça sorulan sorular. Eğitim sayfalarındaki açılır liste zaten bu veriyi
 * gösteriyordu ama yalnızca insana; işaretlenmediği için arama motoru ve
 * yapay zekâ arama motorları soruları eşleştiremiyordu.
 */
export function sssSemasi(sorular: { soru: string; cevap: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: sorular.map((s) => ({
      "@type": "Question",
      name: s.soru,
      acceptedAnswer: { "@type": "Answer", text: s.cevap },
    })),
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
