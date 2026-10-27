import "server-only";

import { baglantiCozucu, type BaglantiCozucu } from "@/lib/blog-baglanti";
import { goneMi } from "@/lib/kaldirilan-yollar";
import { tabloKur } from "@/lib/yonlendirme";
import { yonlendirmeSatirlariniCek } from "@/lib/yonlendirme-onbellek";

/** Sayfa basarken okunan tablonun Next veri önbelleğindeki ömrü (sn). */
const SAYFA_TAZE_SN = 300;

/**
 * Sayfa basılırken kullanılacak bağlantı çözücü.
 *
 * Panel yönlendirmeleri Next'in veri önbelleğinden okunuyor (beş dakika).
 * Ara katmanın "no-store" önbelleği burada kullanılamaz: yazı sayfası ISR
 * (revalidate = 3600) ve arka planda yeniden üretilirken önbelleksiz bir
 * okuma sayfayı çalışma anında dinamiğe çeviriyor; Next bunu hata sayıp
 * üretimi yarıda bırakıyordu ("Page changed from static to dynamic").
 *
 * Tablo okunamazsa yalnız elle yazılmış taşıma listesi uygulanır; sayfa
 * yine basılır.
 */
export async function blogBaglantiCozucu(): Promise<BaglantiCozucu> {
  let satirlar: Awaited<ReturnType<typeof yonlendirmeSatirlariniCek>> = [];
  try {
    satirlar = await yonlendirmeSatirlariniCek({
      cache: "force-cache",
      next: { revalidate: SAYFA_TAZE_SN, tags: ["yonlendirmeler"] },
    });
  } catch (e) {
    console.error("[yonlendirme] sayfa için tablo okunamadı:", e instanceof Error ? e.message : e);
  }
  return baglantiCozucu(tabloKur(satirlar), goneMi);
}
