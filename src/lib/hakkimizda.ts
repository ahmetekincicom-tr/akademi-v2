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
  heroEtiket: "Hakkımızda",
  heroBaslik: "Kurs satmıyoruz.",
  heroVurgu: "Birlikte çalışıyoruz.",
  heroMetin:
    "Ahmet Ekinci Akademi, yeni medya temelleri üzerine kurulmuş bir eğitim programı. Kayıtlı kurs değil: gerçek zamanlı, tek katılımcıya göre kurulan müfredat.",
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
  akademiMetin:
    'Akademi "işi uzmanından öğren" mottosuyla hareket ediyor. Her katılımcının başlangıç noktası, işi ve öğrenme hızı farklı; bu yüzden programlar esnek ve kişiselleştirilebilir kuruluyor.',
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
    heroEtiket: data.hero_etiket || v.heroEtiket,
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
