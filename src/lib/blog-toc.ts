/**
 * Blog İçindekiler (TOC) yardımcıları — sticky başlığı hesaba katan kaydırma.
 *
 * Hem masaüstü sidebar hem mobil accordion aynı ofset ve kaydırma mantığını
 * kullanıyor. window/document'e dokunduğu için yalnızca istemci bileşenlerinden
 * çağrılır (SSR'da güvenli varsayılan döner).
 */

import type { IcindekiSatir } from "@/lib/blog-icerik";

/** Bir H2 ve altındaki H3'ler (sidebar'da yuvalı gösterim için). */
export type TocGrup = { h2: IcindekiSatir; altlar: IcindekiSatir[] };

/**
 * Düz TOC listesini H2 gruplarına ayırır: her H2 kendi altındaki H3'leri
 * toplar. Saf fonksiyon (window'a dokunmuyor), sunucuda da çağrılabilir.
 */
export function grupla(list: IcindekiSatir[]): TocGrup[] {
  const gruplar: TocGrup[] = [];
  for (const s of list) {
    if (s.seviye === 2) gruplar.push({ h2: s, altlar: [] });
    else if (gruplar.length) gruplar[gruplar.length - 1].altlar.push(s);
    // İlk H2'den önce gelen H3 (nadir) atlanıyor: yuvalayacak grup yok.
  }
  return gruplar;
}

/** Sabit başlığın altında kalmasın diye ankraya eklenen üst boşluk (px). */
export function tocOfset(): number {
  if (typeof window === "undefined") return 108;
  const ham = getComputedStyle(document.documentElement).getPropertyValue("--baslik-h");
  const yukseklik = parseFloat(ham) || 84;
  return yukseklik + 24;
}

/** Bölüme yumuşak kaydırma + adres çubuğundaki hash'i güncelleme. */
export function tocKaydir(id: string): void {
  if (typeof document === "undefined") return;
  const hedef = document.getElementById(id);
  if (!hedef) return;
  const y = hedef.getBoundingClientRect().top + window.scrollY - tocOfset();
  window.scrollTo({ top: y, behavior: "smooth" });
  // Hash'i history'ye yeni girdi eklemeden güncelle (geri tuşu kirlenmesin).
  try {
    history.replaceState(null, "", `#${id}`);
  } catch {
    /* bazı ortamlarda replaceState kısıtlı; kaydırma yine de çalıştı */
  }
}

/**
 * Sayfadaki başlıklardan (id listesi) o an "aktif" olanı bulur: üst kenarı
 * ofset çizgisini geçmiş EN SON başlık. Scroll-spy için.
 */
export function aktifBolum(idler: string[]): string | null {
  if (typeof document === "undefined" || idler.length === 0) return idler[0] ?? null;
  const cizgi = tocOfset() + 8;
  let aktif = idler[0];
  for (const id of idler) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (el.getBoundingClientRect().top - cizgi <= 0) aktif = id;
    else break;
  }
  return aktif;
}
