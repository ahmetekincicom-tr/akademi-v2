import { slugYap } from "@/lib/duyuru";

/**
 * Blog gövdesinden içindekiler (TOC) üretimi.
 *
 * Editör başlıklara kimlik (id) yazmıyor; hem TOC bağlantılarının atlayacağı
 * hedefi hem de listenin kendisini burada üretiyoruz. Saf fonksiyon: girdi
 * HTML, çıktı hem id eklenmiş HTML hem başlık listesi — bu yüzden testlenebilir.
 *
 * Yalnızca H2 ve H3: H4 ve altı içindekiler için fazla ince, listeyi kalabalık
 * eder.
 */

export type IcindekiSatir = { id: string; metin: string; seviye: 2 | 3 };

/** Basit HTML varlık çözme (başlık metnindeki &amp; gibi). */
function varlikCoz(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function iceriktenIcindekiler(html: string): { html: string; icindekiler: IcindekiSatir[] } {
  const icindekiler: IcindekiSatir[] = [];
  const kullanilan = new Set<string>();

  const yeni = html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (tam, seviyeStr, oznitelik, ic) => {
    const seviye = (seviyeStr === "3" ? 3 : 2) as 2 | 3;
    const metin = varlikCoz(String(ic).replace(/<[^>]+>/g, "")).trim();
    if (!metin) return tam;

    // Zaten id varsa dokunma; yoksa metinden üret ve benzersizleştir.
    const nitelikler = String(oznitelik ?? "");
    if (/\sid=["']/.test(nitelikler)) {
      const mevcut = /\sid=["']([^"']+)["']/.exec(nitelikler)?.[1];
      if (mevcut) {
        icindekiler.push({ id: mevcut, metin, seviye });
        kullanilan.add(mevcut);
      }
      return tam;
    }

    const taban = slugYap(metin) || `bolum-${icindekiler.length + 1}`;
    let id = taban;
    let n = 2;
    while (kullanilan.has(id)) id = `${taban}-${n++}`;
    kullanilan.add(id);
    icindekiler.push({ id, metin, seviye });

    return `<h${seviye}${nitelikler} id="${id}">${ic}</h${seviye}>`;
  });

  return { html: yeni, icindekiler };
}
