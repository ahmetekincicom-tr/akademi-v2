import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/tipler";
import { takvimYapilandirildiMi, takvimEtkinligiYaz, takvimEtkinliginiSil } from "@/lib/takvim";

/**
 * Takvim yazma işini panel eylemlerinden ayıran ince katman.
 *
 * İki eylem dosyası da (görüşmeler, birebir eğitim) aynı üç adımı yapıyor:
 * etkinliği yaz, kimliği satıra kaydet, hata varsa yöneticiye söyle.
 * Adımlar tekrarlandığında biri ötekinden ayrışıyor — bu projede tam olarak
 * bu yüzden iki sayfadaki program kartları farklı görünüyordu.
 *
 * HATA SESSİZ DEĞİL: takvime yazılamazsa planlama geri alınmıyor (kayıt ve
 * katılımcıya giden posta çok daha önemli) ama yöneticinin ekranına uyarı
 * dönüyor. Sessiz kalsaydı takvim aylarca boş kalır ve kimse fark etmezdi.
 */

export type TakvimUyarisi = string | null;

type Tablo = "gorusmeler" | "egitim_oturumlari";

/**
 * Etkinliği kurar/günceller ve kimliği ilgili satır(lar)a yazar.
 *
 * Satırlar KİMLİK LİSTESİYLE veriliyor, "grup_id şuna eşit" gibi bir
 * süzgeçle değil: grup oturumunda takvimde tek etkinlik var ama
 * veritabanında katılımcı sayısı kadar satır ve iki tablonun sütunları
 * farklı — ortak olan tek şey birincil anahtar.
 */
export async function takvimeYaz(
  supabase: SupabaseClient<Database>,
  tablo: Tablo,
  satirIdleri: string[],
  etkinlik: Parameters<typeof takvimEtkinligiYaz>[0],
  mevcutEtkinlikId?: string | null,
): Promise<TakvimUyarisi> {
  // Kurulmamışsa hiçbir şey yapmıyor ve UYARI DA VERMİYOR: takvimi hiç
  // bağlamamış olmak bir hata değil, bir tercih.
  if (!takvimYapilandirildiMi()) return null;

  const sonuc = await takvimEtkinligiYaz(etkinlik, mevcutEtkinlikId);
  if ("hata" in sonuc) return `Takvime eklenemedi: ${sonuc.hata}`;

  const { error } = await supabase
    .from(tablo)
    .update({ takvim_etkinlik_id: sonuc.etkinlikId })
    .in("id", satirIdleri);

  /*
    Etkinlik kuruldu ama kimliği yazılamadıysa uyarı şart: bir sonraki
    düzenleme aynı etkinliği güncelleyemez, takvimde ikinci bir kopya
    oluşur. Sessiz geçmek, sorunu haftalar sonra "takvimde neden iki tane
    var" olarak geri getirirdi.
  */
  if (error) return `Takvime eklendi ama kaydedilemedi (${error.message}); tekrar planlarsan kopya oluşabilir.`;
  return null;
}

/** Etkinliği takvimden kaldırır ve satırdaki kimliği temizler. */
export async function takvimdenSil(
  supabase: SupabaseClient<Database>,
  tablo: Tablo,
  satirIdleri: string[],
  etkinlikId: string | null | undefined,
): Promise<TakvimUyarisi> {
  if (!etkinlikId || !takvimYapilandirildiMi()) return null;

  const sonuc = await takvimEtkinliginiSil(etkinlikId);
  if (sonuc.hata) return `Takvimden silinemedi: ${sonuc.hata}`;

  // Satır silinmiş olabilir (oturum silme akışı); güncelleme boşa düşerse
  // sorun değil, istenen şey etkinliğin takvimden kalkması.
  if (satirIdleri.length > 0) {
    await supabase.from(tablo).update({ takvim_etkinlik_id: null }).in("id", satirIdleri);
  }
  return null;
}

/** İki uyarıyı tek satırda birleştirir; ikisi de boşsa undefined. */
export function uyariBirlestir(...uyarilar: (string | null | undefined)[]): string | undefined {
  const dolu = uyarilar.filter((u): u is string => Boolean(u));
  return dolu.length > 0 ? dolu.join(" ") : undefined;
}
