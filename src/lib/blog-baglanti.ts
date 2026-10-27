import { YONLENDIRMELER } from "@/lib/tasima";
import { kaynakAnahtari, type YonlendirmeTablosu } from "@/lib/yonlendirme";

/**
 * Yazı gövdesindeki iç bağlantıları SON adreslerine çevirir.
 *
 * WordPress'ten gelen yazılar eski adreslere bağlanıyor
 * (/egitim/birebir-...-2025/, mutlak http://ahmetekinciakademi.com/...).
 * Hepsi çalışıyor ama her tıklama bir ya da iki yönlendirmeden geçiyor ve
 * arama motoru her iç bağlantıda zincir görüyor. Sayfa basılırken bağlantı
 * doğrudan varacağı adrese yazılıyor; veritabanındaki yazıya dokunulmuyor.
 *
 * Kaynak: ahmetekinci.com.tr blogContent.ts → resolveBodyHref (aynı kural:
 * kaldırılmış adrese (410) giden bağlantı kalkar, metni kalır).
 *
 * Çözüm sırası: kendi alan adımızın mutlak adresi göreliye → elle yazılmış
 * taşıma listesi (lib/tasima) → panel yönlendirmeleri (yonlendirmeler
 * tablosu), en çok 5 adım. Dış bağlantılara dokunulmuyor.
 */

const KENDI_ALAN = /^(?:https?:)?\/\/(?:www\.|panel\.)?ahmetekinciakademi\.com(?=[/?#]|$)/i;

/** Elle yazılmış taşıma listesi, kaynak biçiminde ("/eski/"). */
const TASIMA = new Map(YONLENDIRMELER.map((y) => [kaynakAnahtari(y.eski), y.yeni.endsWith("/") ? y.yeni : `${y.yeni}/`]));

export type BaglantiCozucu = (href: string) => string | null;

/**
 * @param tablo  panel yönlendirmeleri (yonlendirme-onbellek ile aynı biçim)
 * @param kaldirildi  410 dönen sabit adresler (lib/kaldirilan-yollar → goneMi)
 * @returns href'in son hâli; null = bağlantı kalksın (hedef kaldırılmış)
 */
export function baglantiCozucu(tablo: YonlendirmeTablosu, kaldirildi: (yolSade: string) => boolean): BaglantiCozucu {
  return (href) => {
    const ham = href.trim();
    let yerel = ham;
    if (KENDI_ALAN.test(ham)) yerel = ham.replace(KENDI_ALAN, "") || "/";
    if (!yerel.startsWith("/") || yerel.startsWith("//")) return href;

    // Yol ile sorgu/çapa ayrılıyor; yönlendirme yola bakıyor, ekler korunuyor.
    const m = /^([^?#]*)([?#].*)?$/.exec(yerel)!;
    let yol = m[1] || "/";
    const ek = m[2] ?? "";

    // Dosya adreslerine (görsel, PDF) dokunulmuyor: yalnız mutlak→göreli.
    if (/\.[a-z0-9]{2,5}$/i.test(yol)) return yol + ek;

    for (let adim = 0; adim < 5; adim++) {
      const anahtar = kaynakAnahtari(yol);
      const sade = anahtar.length > 1 ? anahtar.replace(/\/+$/, "") : anahtar;
      if (kaldirildi(sade)) return null;
      const elle = TASIMA.get(anahtar);
      if (elle) {
        yol = elle;
        continue;
      }
      const panel = tablo.get(anahtar);
      if (panel?.kod === 410) return null;
      if (panel?.hedef) {
        if (!panel.hedef.startsWith("/")) return panel.hedef;
        yol = panel.hedef;
        continue;
      }
      break;
    }
    // trailingSlash açık: çizgisiz iç bağlantı bir sıçrama daha demek.
    if (!yol.endsWith("/")) yol = `${yol}/`;
    return yol + ek;
  };
}
