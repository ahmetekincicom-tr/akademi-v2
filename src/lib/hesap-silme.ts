/**
 * Yöneticinin bir hesabı silmesi için saf kurallar (sunucu eylemi:
 * ogrenciler/actions.ts → ogrenciHesabiniSil). Testle sabitleniyor.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function kimlikGecerli(v: unknown): v is string {
  return typeof v === "string" && UUID.test(v);
}

/**
 * Onay metni: yönetici silinecek hesabın e-postasını yazıyor. Yanlış kişiyi
 * silmenin tek bariyeri bu; büyük/küçük harf ve kenar boşlukları önemsiz.
 */
export function onayEslesiyor(yazilan: string, eposta: string | null): boolean {
  if (!eposta) return yazilan.trim().toLocaleUpperCase("tr") === "SİL";
  return yazilan.trim().toLocaleLowerCase("tr") === eposta.trim().toLocaleLowerCase("tr");
}

export type SilmeEngeli = "kendi" | "yonetici" | "yok" | null;

/** Silinemeyecek hesaplar: yöneticinin kendisi, başka bir yönetici, bulunamayan kayıt. */
export function silmeEngeli(hedef: { id: string; role: string } | null, benimId: string): SilmeEngeli {
  if (!hedef) return "yok";
  if (hedef.id === benimId) return "kendi";
  if (hedef.role === "admin") return "yonetici";
  return null;
}

export const ENGEL_MESAJI: Record<Exclude<SilmeEngeli, null>, string> = {
  kendi: "Kendi hesabını buradan silemezsin.",
  yonetici: "Yönetici hesapları buradan silinemez. Önce rolünü değiştir.",
  yok: "Hesap bulunamadı; daha önce silinmiş olabilir.",
};
