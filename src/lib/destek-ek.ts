/**
 * Destek mesajı ekleri (ekran görüntüsü / dosya) — ortak tanımlar.
 *
 * Saf modül: hem istemci (yükleme öncesi kontrol) hem sunucu (mesajGonder /
 * talepAc doğrulaması) kullanıyor. Dosyalar özel "destek-ekleri" kovasında,
 * kişinin kendi klasöründe (<uid>/...) duruyor; mesaj satırında yalnız
 * {yol, ad, tip, boyut} tutuluyor.
 */

export type DestekEk = { yol: string; ad: string; tip: string; boyut: number };

export const EK_KOVA = "destek-ekleri";
export const EK_TIPLERI = ["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"] as const;
export const EK_MAKS_ADET = 4;
export const EK_MAKS_BOYUT = 10 * 1024 * 1024; // 10 MB (kova sınırıyla aynı)

export function ekGorselMi(tip: string): boolean {
  return tip.startsWith("image/");
}

/** Depoda güvenli dosya adı: Türkçe harfler sadeleşir, boşluk/özel karakter "-" olur. */
export function ekDosyaAdi(ad: string): string {
  const harita: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", Ç: "c", Ğ: "g", İ: "i", Ö: "o", Ş: "s", Ü: "u" };
  const sade = ad.replace(/[çğıöşüÇĞİÖŞÜ]/g, (h) => harita[h] ?? h).toLowerCase();
  const nokta = sade.lastIndexOf(".");
  const govde = (nokta > 0 ? sade.slice(0, nokta) : sade).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  const uzanti = nokta > 0 ? sade.slice(nokta + 1).replace(/[^a-z0-9]/g, "").slice(0, 8) : "";
  return `${govde || "dosya"}${uzanti ? `.${uzanti}` : ""}`;
}

/** Yüklenmeden önce istemcide: tür/boyut uygun mu? Uygunsa null, değilse hata metni. */
export function ekOnKontrol(dosya: { type: string; size: number }): string | null {
  if (!(EK_TIPLERI as readonly string[]).includes(dosya.type)) return "Yalnız görsel (PNG, JPG, WebP, GIF) veya PDF eklenebilir.";
  if (dosya.size > EK_MAKS_BOYUT) return "Dosya 10 MB'tan büyük olamaz.";
  return null;
}

/**
 * Sunucuda: istemciden gelen ek listesini doğrular. Yollar gönderenin kendi
 * klasöründe olmak zorunda — başkasının dosyasını mesaja iliştirmek mümkün
 * olmasın (RLS de aynı şartı arıyor, burası ilk kapı).
 */
export function ekleriDogrula(ham: unknown, sahipId: string): { ekler: DestekEk[] } | { hata: string } {
  if (ham == null) return { ekler: [] };
  if (!Array.isArray(ham)) return { hata: "Ekler okunamadı." };
  if (ham.length > EK_MAKS_ADET) return { hata: `En fazla ${EK_MAKS_ADET} dosya eklenebilir.` };
  const ekler: DestekEk[] = [];
  for (const e of ham) {
    const o = e as Partial<DestekEk>;
    if (
      typeof o?.yol !== "string" ||
      !o.yol.startsWith(`${sahipId}/`) ||
      o.yol.includes("..") ||
      typeof o.tip !== "string" ||
      !(EK_TIPLERI as readonly string[]).includes(o.tip) ||
      typeof o.boyut !== "number" ||
      o.boyut <= 0 ||
      o.boyut > EK_MAKS_BOYUT
    ) {
      return { hata: "Geçersiz ek." };
    }
    ekler.push({ yol: o.yol, ad: String(o.ad ?? "dosya").slice(0, 120), tip: o.tip, boyut: Math.round(o.boyut) });
  }
  return { ekler };
}
