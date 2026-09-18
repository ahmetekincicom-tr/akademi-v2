import type { SiteIcerik } from "@/lib/site-icerik";

/**
 * Blog yazarı modeli.
 *
 * Yazar bilgisi yazının içine düz string gömülmüyor: kimlik ayrı bir modelde
 * ve avatar/unvan/bio tek merkezden (site_icerik → egitmen_*) geliyor. Her
 * yazıya ayrı görsel URL'si yazılmıyor; portre panelden yönetilen tek kaynak.
 *
 * Şu an tek yazar var (Ahmet Ekinci). Model ileride başka yazarları da
 * destekleyecek biçimde ayrık tutuldu ama bugün gereksiz karmaşıklık
 * eklenmedi: posts.yazar string'i görünen adı veriyor, gerisi merkezden.
 */
export type Yazar = {
  id: string;
  name: string;
  slug: string;
  title: string;
  /** Kare portre; merkezî kaynaktan. Yoksa null (bileşen baş harfe düşer). */
  avatar: string | null;
  bio: string;
  /** Yazar profili sayfası; henüz yok → null (kırık link üretme). */
  profileUrl: string | null;
};

/** Bio boşsa kullanılacak sade varsayılan (tek paragraf). */
const VARSAYILAN_BIO =
  "Sosyal medya, dijital reklamcılık ve Meta Ads alanlarında birebir ve kurumsal eğitimler veren " +
  "Ahmet Ekinci, uygulamalı eğitim ve kampanya analizi odaklı çalışmalar yürütmektedir.";

const VARSAYILAN_UNVAN = "Sosyal Medya ve Dijital Reklam Eğitmeni";

/**
 * Merkezî bio alanı markdown vurgu işaretleri (**kalın**, *italik*) içerebiliyor
 * ama yazar kutusunda düz metin gösteriyoruz; işaretleri temizleyip içteki
 * metni koruyoruz (yoksa ekranda ham ** görünürdü).
 */
function markdownsuz(metin: string): string {
  return metin
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Yazının yazar adını ve merkezî profili birleştirip Yazar döndürür.
 *
 * Görünen ad posts.yazar'dan (yoksa merkezî egitmenAd); unvan/avatar/bio
 * site_icerik'ten. Böylece yazar bilgisi tek yerden güncelleniyor.
 */
export function yazariCoz(yaziYazar: string | null | undefined, site: SiteIcerik): Yazar {
  const ad = (yaziYazar || site.egitmenAd || "Ahmet Ekinci").trim();
  return {
    id: "ahmet-ekinci",
    name: ad,
    slug: "ahmet-ekinci",
    title: (site.egitmenUnvan || VARSAYILAN_UNVAN).trim(),
    avatar: site.egitmenGorsel,
    bio: markdownsuz(site.egitmenBiyografi || "") || VARSAYILAN_BIO,
    // Author profile sayfası henüz yok; uydurma URL üretmiyoruz.
    profileUrl: null,
  };
}
