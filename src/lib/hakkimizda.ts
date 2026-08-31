import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";

export type HakkimizdaIcerik = {
  heroEtiket: string;
  heroBaslik: string;
  heroVurgu: string;
  heroMetin: string;
  kisiEtiket: string;
  kisiBaslik: string;
  kisiUnvan: string;
  kisiMetin: string;
  kisiGorsel: string | null;
  akademiEtiket: string;
  akademiBaslik: string;
  akademiMetin: string;
};

/**
 * Tablo okunamazsa (migration henüz uygulanmadıysa) sayfa boş kalmasın diye
 * varsayılanlar burada. Migration'daki insert ile aynı metinler.
 */
export const VARSAYILAN_HAKKIMIZDA: HakkimizdaIcerik = {
  // Etiket boş: başlık zaten "Hakkımızda" ve ikisi üst üste aynı kelimeyi
  // yazıyordu.
  heroEtiket: "",
  heroBaslik: "Hakkımızda",
  heroVurgu: "",
  heroMetin:
    "Ahmet Ekinci Akademi; yeni medya, dijital pazarlama ve reklamcılık alanlarında uygulamaya dayalı eğitimler sunan bir eğitim platformudur.",
  kisiEtiket: "Eğitmen",
  kisiBaslik: "Ahmet Ekinci kimdir?",
  kisiUnvan: "Dijital pazarlama eğitmeni · Ankara",
  kisiMetin: `Ahmet Ekinci, Yeni Medya ve İletişim lisans mezunu. 2018'den beri dijital medya alanında çalışıyor ve markaların çözüm ortağı oluyor.

2021'de TRT Geleceğin İletişimcileri yarışmasına kendi Instagram projesiyle "Sosyal Medya Yönetimi" kategorisinde katıldı ve üçüncülük ödülünü kazandı.

Yine 2021'den bu yana birebir ve kişiye özel eğitimlerle yüzlerce katılımcıyla bir araya geldi.

Şu anda Ankara'da dijital medya çalışmalarını, içerik üreticiliğini ve Ahmet Ekinci Akademi ile eğitimlerini sürdürüyor.`,
  kisiGorsel: null,
  akademiEtiket: "Akademi",
  akademiBaslik: "Ahmet Ekinci Akademi",
  akademiMetin: `Ahmet Ekinci Akademi; yeni medya, dijital pazarlama ve reklamcılık alanlarında uygulamaya dayalı eğitimler sunan bir eğitim platformudur.

Programlarımızda yalnızca teorik bilgi aktarmayı değil, edinilen bilgilerin gerçek çalışma süreçlerinde kullanılabilmesini önemsiyoruz. Katılımcılar; güncel araçlar, gerçek örnekler ve uygulamalı çalışmalar aracılığıyla kendi projelerini yönetebilecek yetkinliğe ulaşırken, eğitim sonrasında da yararlanabilecekleri sürdürülebilir bir bilgi altyapısı kazanıyor.

Ahmet Ekinci Akademi olarak amacımız; dijital dünyayı yalnızca takip eden değil, onu doğru analiz eden, strateji geliştiren ve alanında fark yaratan profesyoneller yetiştirmek.`,
};

/**
 * Anonim anahtarla okunuyor: sayfa ziyaretçiye ve yöneticiye aynı içeriği
 * göstermeli. cache() aynı istekte tek sorguya indiriyor.
 */
export const getHakkimizda = cache(async (): Promise<HakkimizdaIcerik> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("hakkimizda_icerik")
    .select(
      "hero_etiket, hero_baslik, hero_vurgu, hero_metin, kisi_etiket, kisi_baslik, kisi_unvan, kisi_metin, kisi_gorsel, akademi_etiket, akademi_baslik, akademi_metin",
    )
    .maybeSingle();

  if (error) {
    console.error("[hakkimizda] okunamadı:", error.message);
    return VARSAYILAN_HAKKIMIZDA;
  }
  if (!data) return VARSAYILAN_HAKKIMIZDA;

  const v = VARSAYILAN_HAKKIMIZDA;
  return {
    /*
      Etiket boş bırakılabiliyor (?? değil || ile düşmüyor).

      Başlık "Hakkımızda" olduğunda üstteki küçük etiket de "Hakkımızda"
      yazıyordu — aynı kelime iki kez, üst üste. Boş bırakmak burada geçerli
      bir tercih; hero_vurgu'da da aynı kural geçerli.
    */
    heroEtiket: data.hero_etiket ?? v.heroEtiket,
    heroBaslik: data.hero_baslik || v.heroBaslik,
    // Vurgu bilerek boş bırakılabiliyor: tek satırlık başlık isteyebilir.
    heroVurgu: data.hero_vurgu ?? "",
    heroMetin: data.hero_metin || v.heroMetin,
    kisiEtiket: data.kisi_etiket || v.kisiEtiket,
    kisiBaslik: data.kisi_baslik || v.kisiBaslik,
    kisiUnvan: data.kisi_unvan ?? "",
    kisiMetin: data.kisi_metin || v.kisiMetin,
    kisiGorsel: data.kisi_gorsel || null,
    akademiEtiket: data.akademi_etiket || v.akademiEtiket,
    akademiBaslik: data.akademi_baslik || v.akademiBaslik,
    akademiMetin: data.akademi_metin || v.akademiMetin,
  };
});

/** Uzun metni paragraflara böler. Tek satır aralığı da paragraf sayılıyor. */
export function paragraflar(metin: string): string[] {
  return metin
    .split(/\n{2,}|\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
