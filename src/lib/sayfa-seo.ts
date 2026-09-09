import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { kalinsiz } from "@/lib/kalin";

/**
 * Sayfaların panelden yazılan SEO başlığı ve açıklaması.
 *
 * Bu dosyanın tek işi ELLE EZMEYİ getirmek. Bir sayfa için satır yoksa ya da
 * alan boşsa hiçbir şey döndürmüyor ve sayfa kodda yazan otomatik değerini
 * kullanmaya devam ediyor. Yani tablo boşken sitenin çıktısı bugünküyle
 * birebir aynı — panel açıldığı için hiçbir başlık değişmiyor.
 *
 * Eğitim sayfaları BURADA DEĞİL: onların SEO metinleri courses.content
 * JSON'unda duruyor, çünkü eğitimin adresi panelden değiştirilebiliyor ve
 * yola bağlı bir satır adres değişince sahipsiz kalırdı.
 */

/**
 * Panelde listelenen tanıtım sayfaları.
 *
 * Elle yazılmış bir liste, çünkü "hangi sayfalar SEO'ya konu" sorusunun
 * cevabı dosya sisteminden çıkarılamıyor: /giris, /panel, yasal metinler ve
 * yönetim ekranları da birer rota ama hiçbirinin başlığıyla oynanmıyor.
 *
 * Yollar sondaki eğik çizgi OLMADAN yazılıyor; veritabanındaki kısıt da bunu
 * zorluyor. Sayfalar sayfaMeta'ya zaten bu biçimde `yol` veriyor.
 */
export const SEO_SAYFALARI: { yol: string; ad: string; baslik: string; aciklama: string }[] = [
  {
    yol: "/",
    ad: "Ana sayfa",
    baslik: "Birebir Dijital Pazarlama Eğitimleri",
    aciklama:
      "Meta Ads, sosyal medya yönetimi ve yapay zekâ araçlarını birebir öğren. Ankara merkezli, kuruma ve kişiye özel program; eğitim sonrası destek dahil.",
  },
  {
    yol: "/egitimler",
    ad: "Eğitimler",
    baslik: "Eğitim Programları",
    aciklama:
      "Meta Ads reklam yönetimi, sosyal medya yönetimi ve yapay zekâ araçları eğitimleri. Kapsam ön görüşmede sana göre kurulur.",
  },
  {
    yol: "/hakkimizda",
    ad: "Hakkımızda",
    baslik: "Hakkımızda",
    aciklama:
      "Ahmet Ekinci ve Ahmet Ekinci Akademi: yeni medya temelleri üzerine kurulmuş, birebir yürüyen dijital pazarlama eğitimi.",
  },
  {
    yol: "/kurumsal",
    ad: "Kurumsal Eğitim",
    baslik: "Kurumsal Eğitim",
    aciklama:
      "Ekibinize özel dijital pazarlama eğitimi: Ankara'da yerinde ya da tamamen uzaktan. Müfredat ekibin seviyesine göre kurulur, kurumsal faturalandırma ve eğitim sonrası destek dahil.",
  },
  {
    yol: "/referanslar",
    ad: "Referanslar",
    baslik: "Referanslar",
    aciklama:
      "Ahmet Ekinci Akademi eğitimlerini tercih eden kurumlar ve markalar. Birebir dijital pazarlama eğitimi alan ekiplerin listesi.",
  },
  {
    yol: "/yorumlar",
    ad: "Yorumlar",
    baslik: "Katılımcı Yorumları",
    aciklama: "Eğitime katılanların deneyimleri: ne öğrendiler, işlerinde ne değişti.",
  },
  {
    yol: "/iletisim",
    ad: "İletişim",
    baslik: "İletişim",
    aciklama:
      "Hangi dijital pazarlama programının size uyduğunu birlikte belirleyelim. Formu doldurun ya da WhatsApp'tan yazın; Ankara ofisi ve online görüşme seçenekleri açık.",
  },
];

/**
 * Bir sayfanın koddaki (otomatik) başlık ve açıklaması.
 *
 * Metinler sayfaların içinde DEĞİL burada duruyor. Sebebi panel: "boş
 * bırakırsan ne olur" sorusunun cevabını yer tutucu olarak göstermesi
 * gerekiyor ve o metni ikinci bir yere kopyalasaydık ikisi er geç birbirinden
 * kopardı — panelde bir şey, sitede başka bir şey yazardı. Tek kaynak burası;
 * sayfalar da paneli de buradan okuyor.
 */
export function otomatikSeo(yol: string): { baslik: string; aciklama: string } {
  const sadelesmis = yolSadelestir(yol);
  const kayit = SEO_SAYFALARI.find((s) => s.yol === sadelesmis);
  return kayit ? { baslik: kayit.baslik, aciklama: kayit.aciklama } : { baslik: "", aciklama: "" };
}

export type SayfaSeoKaydi = { baslik: string; aciklama: string };

/**
 * Bütün ezmeler tek sorguda.
 *
 * cache() istek başına tek çağrı demek; yedi satırlık bir tabloyu sayfa
 * başına ayrı ayrı sorgulamanın anlamı yok. Okuma başarısız olursa boş harita
 * dönüyor: SEO metni sayfanın açılmasını engellememeli.
 */
export const getSayfaSeoHaritasi = cache(async (): Promise<Map<string, SayfaSeoKaydi>> => {
  const harita = new Map<string, SayfaSeoKaydi>();
  try {
    const { data, error } = await createPublicClient().from("sayfa_seo").select("yol, baslik, aciklama");
    if (error || !data) return harita;
    for (const satir of data) {
      harita.set(satir.yol, {
        baslik: (satir.baslik ?? "").trim(),
        aciklama: (satir.aciklama ?? "").trim(),
      });
    }
  } catch {
    // Sessiz: metadata üretimi hiçbir koşulda sayfayı düşürmemeli.
  }
  return harita;
});

/** Tek bir sayfanın ezmesi; yoksa boş alanlar. */
export async function getSayfaSeo(yol: string): Promise<SayfaSeoKaydi> {
  const harita = await getSayfaSeoHaritasi();
  return harita.get(yolSadelestir(yol)) ?? { baslik: "", aciklama: "" };
}

/** Sondaki eğik çizgiyi atar: "/hakkimizda/" ile "/hakkimizda" aynı sayfa. */
export function yolSadelestir(yol: string): string {
  const temiz = yol.trim();
  if (temiz.length > 1 && temiz.endsWith("/")) return temiz.replace(/\/+$/, "");
  return temiz || "/";
}

/**
 * Arama sonucunda gösterilen açıklama uzunluğu.
 *
 * Google masaüstünde ~155-160 karakter gösterip gerisini kesiyor. Buradaki
 * sınır kesme YERİNİ belirliyor, yazılabilecek en uzun metni değil: panel
 * daha uzun yazmaya izin veriyor, yalnızca uyarıyor.
 */
export const ACIKLAMA_SINIRI = 160;
export const BASLIK_SINIRI = 60;

/**
 * Uzun metni açıklama uzunluğuna indirir.
 *
 * Eskiden eğitim sayfalarında `metin.slice(0, 300)` yazıyordu ve iki sorunu
 * vardı: 300 karakter Google'ın gösterdiğinin iki katı (yani cümle aramada
 * yarıda kalıyordu) ve kesme kelimenin ortasından yapılıyordu — "…profesyonel
 * gelişim" yerine "…profesyone" gibi.
 *
 * Şimdi kesme KELİME SINIRINDA yapılıyor ve sonuna üç nokta konuyor. Sınırın
 * altındaki metne hiç dokunulmuyor: kısa ve tam bir cümleye üç nokta eklemek
 * metni yarım göstermek olurdu.
 */
export function aciklamayiKisalt(metin: string, sinir = ACIKLAMA_SINIRI): string {
  /*
    Kalın işaretleri ayıklanıyor.

    Panelden girilen metinlerde **çift yıldız** kalın demek (bkz. lib/kalin.tsx)
    ve sayfada <strong> olarak basılıyor. Ama meta açıklaması düz metin: eğitim
    sayfalarının açıklaması arama sonucuna "**Kendi reklam hesabınız**
    üzerinde…" diye çıkıyordu — ölçüldü, öyleydi.

    Ayıklama burada, çünkü açıklamaların TEK geçtiği yer burası: yeni bir
    açıklama kaynağı eklendiğinde ayrıca hatırlanması gerekmiyor.
  */
  const temiz = kalinsiz(metin).trim().replace(/\s+/g, " ");
  if (temiz.length <= sinir) return temiz;

  // Üç nokta da yer kaplıyor; sınıra onunla birlikte uyulması gerekiyor.
  const kes = temiz.slice(0, sinir - 1);
  const sonBosluk = kes.lastIndexOf(" ");
  /*
    Boşluk yoksa (tek uzun kelime) ya da çok başta kaldıysa harf sınırından
    kesiliyor: aksi hâlde 160 karakterlik alandan geriye üç kelime kalabilir.
  */
  const govde = sonBosluk > sinir * 0.6 ? kes.slice(0, sonBosluk) : kes;
  // Sondaki noktalama üç noktayla üst üste binmesin: "gelişim,…" yerine "gelişim…"
  return `${govde.replace(/[\s.,;:!?-]+$/, "")}…`;
}
