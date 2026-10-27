import "server-only";

import { baglantiCozucu, type BaglantiCozucu } from "@/lib/blog-baglanti";
import { goneMi } from "@/lib/kaldirilan-yollar";
import { yonlendirmeTablosu } from "@/lib/yonlendirme-onbellek";

/**
 * Sayfa basılırken kullanılacak bağlantı çözücü: panel yönlendirmeleri ara
 * katmanla aynı önbellekten (bir dakikalık). Tablo okunamazsa yalnız elle
 * yazılmış taşıma listesi uygulanır; sayfa yine basılır.
 */
export async function blogBaglantiCozucu(): Promise<BaglantiCozucu> {
  return baglantiCozucu(await yonlendirmeTablosu(), goneMi);
}
