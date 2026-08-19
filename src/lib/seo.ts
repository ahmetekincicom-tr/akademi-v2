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
 * Paylaşım görseli artık panelden geliyor (marka.og_gorsel).
 *
 * Depoda sabit bir PNG duruyordu; marka değişince dosyayı yeniden üretip
 * dağıtım yapmak gerekiyordu. Yüklenmemişse hiç og:image basılmıyor —
 * yanlış bir görselle paylaşılmaktansa görselsiz paylaşılmak iyi.
 *
 * Not: PNG/JPG olmak zorunda. Facebook, LinkedIn, X ve WhatsApp og:image
 * olarak SVG kabul etmiyor; kart görselsiz çıkıyor.
 */
async function ogGorseli(): Promise<
  { url: string; width?: number; height?: number; type?: string } | null
> {
  const { getMarka } = await import("@/lib/marka");
  const marka = await getMarka();
  if (!marka.ogGorsel) return null;

  /*
    Ölçüler bilerek etikete yazılıyor.

    og:image tek başına yetmiyor: WhatsApp ve bazı istemciler görseli
    indirmeden önce boyutunu bilmek istiyor; width/height yoksa görseli hiç
    çekmeden kartı yazıyla basıyorlar. Ölçüler yükleme anında kaydediliyor.
  */
  const uzanti = marka.ogGorsel.split(".").pop()?.toLowerCase();
  const tip = uzanti === "jpg" || uzanti === "jpeg" ? "image/jpeg" : uzanti === "webp" ? "image/webp" : "image/png";

  return {
    url: marka.ogGorsel,
    ...(marka.ogGenislik ? { width: marka.ogGenislik } : {}),
    ...(marka.ogYukseklik ? { height: marka.ogYukseklik } : {}),
    type: tip,
  };
}

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
 *
 * async çünkü paylaşım görseli veritabanından geliyor. Sayfalar bunu
 * `export const metadata` yerine `generateMetadata` ile çağırıyor: Next
 * metadata'yı SIĞ birleştiriyor ve alt sayfa openGraph tanımlayınca kökteki
 * openGraph'ı bütünüyle değiştiriyor — yani görseli yalnızca kökte tanımlamak
 * alt sayfalarda görseli düşürüyordu. getMarka() cache'li, istek başına tek
 * sorgu.
 */
export async function sayfaMeta({
  baslik,
  aciklama,
  yol,
  indeksleme = true,
  tip = "website",
  yayinTarihi,
}: SayfaSeo): Promise<Metadata> {
  const tamAdres = `${SITE_URL}${yol}`;
  const gorsel = await ogGorseli();
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
      ...(gorsel ? { images: [gorsel] } : {}),
      ...(yayinTarihi ? { publishedTime: yayinTarihi } : {}),
    },
    twitter: {
      // Görsel yoksa büyük kart boş bir çerçeve gösteriyor; özet kartı doğrusu.
      card: gorsel ? "summary_large_image" : "summary",
      title: tamBaslik,
      description: aciklama,
      ...(gorsel ? { images: [gorsel.url] } : {}),
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
