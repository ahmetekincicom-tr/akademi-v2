import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Katılımcının eğitime erişip erişemediği.
 *
 * Tek soru, tek cevap yeri. Bu kural daha önce üç dosyada ayrı ayrı
 * yazılıydı (`baslangic.ts`, `testlerim`, `on-degerlendirme`) ve üçü de aynı
 * şeyi söylüyordu: "kendi ödemesi var mı". Kurumsal alım o cümleyi yanlış
 * hale getirdi — ajans adına ödeme yapılan çalışanın kendi ödemesi yok, ama
 * eğitimi satın alınmış durumda.
 *
 * Cevabı VERİTABANI fonksiyonu üretiyor, buradaki sorgular değil. Sebebi
 * somut: katılımcı kendi koltuk satırını görebiliyor ama bağlı olduğu ödemeyi
 * GÖREMİYOR — o satır ödeyene ait ve payments politikası "kendi satırın veya
 * yöneticiysen hepsi" diyor. Panel gömülü okumayla sormaya çalışıyordu, RLS
 * sessizce null döndürüyordu ve koltuğu atanmış kişi "Ödemeni tamamla"
 * ekranında kalıyordu.
 *
 * Ödemeyi katılımcıya açmak çözüm değildi: kurumsal tutarı ve fatura
 * bilgisini görmesi gerekmiyor. Fonksiyon yalnızca cevabı döndürüyor.
 */

export type Erisim = {
  /** Eğitim satın alınmış: test ve birebir eğitim açık. */
  var: boolean;
  /** Erişim başkasının ödemesinden geliyor — kurumsal koltuk. */
  kurumsal: boolean;
  /** Kurumsal ise ödemeyi yapanın adı ya da şirketi; panelde gösteriliyor. */
  odeyen: string | null;
};

const YOK: Erisim = { var: false, kurumsal: false, odeyen: null };

/**
 * cache(): tek istekte hem başlangıç adımları hem sayfa gövdesi soruyor.
 * Önbelleksiz iki ayrı çağrı olurdu ve ikisi de aynı cevabı döndürürdü.
 */
export const getErisim = cache(async (): Promise<Erisim> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("egitim_erisimim");

  /*
    Hata durumunda erişim KAPALI sayılıyor.

    Diğer yöne düşmek — hata varsa açık say — ödemesi olmayan birine eğitimi
    açardı. Yanlış tarafa düşmek gerekiyorsa, kapalı kalıp "neden açılmadı"
    diye sorulması, açık kalıp kimsenin fark etmemesinden iyi.
  */
  if (error) {
    console.error("[erisim] egitim_erisimim çağrılamadı", error.message);
    return YOK;
  }

  const satir = data?.[0];
  if (!satir?.erisim) return YOK;

  return { var: true, kurumsal: satir.kurumsal === true, odeyen: satir.odeyen ?? null };
});
