import type { EpostaAkisi } from "@/lib/eposta-akislari";

/**
 * Panelden yazılan e-posta metinleri ve değişken yerleştirme.
 *
 * Metinlerin varsayılanı KODDA kalıyor; tablo yalnızca "değiştirilmiş olanlar"
 * defteri. Böylece yeni bir akış eklendiğinde önce veritabanına satır yazmak
 * gerekmiyor ve boş bir tablo, metinsiz bir mail anlamına gelmiyor.
 */

export type AkisMetni = {
  konu?: string | null;
  ustEtiket?: string | null;
  baslik?: string | null;
  ozet?: string | null;
  eylemEtiketi?: string | null;
};

/**
 * Her akışın metninde kullanılabilecek değişkenler.
 *
 * Panelde ipucu olarak gösteriliyor: yazan kişinin hangi alanın dolduğunu
 * tahmin etmesi gerekmesin. Listede olmayan bir değişken yazılırsa süslü
 * parantezli hâliyle basılıyor — sessizce boş bırakmaktansa görünür olması
 * yeğ, yazan kişi hatayı ekranda görür.
 */
export const AKIS_DEGISKENLERI: Partial<Record<EpostaAkisi, string[]>> = {
  hosgeldin: ["ad"],
  "odeme-acildi": ["ad", "tutar"],
  "odeme-tamamlandi": ["ad", "tutar"],
  "egitim-kaydi": ["ad", "program", "klasor"],
  "oturum-planlandi": ["ad", "program", "tarih", "sure"],
  "koltuk-atandi": ["ad", "program", "odeyen"],
  "gorusme-planlandi": ["ad", "tarih", "sure", "konu"],
  "on-degerlendirme-hatirlatma": ["ad"],
  "destek-yanit": ["ad"],
};

/**
 * `{ad}` gibi yer tutucuları doldurur.
 *
 * Karşılığı olmayan yer tutucu OLDUĞU GİBİ kalıyor. Boşa çevirmek, panele
 * yanlış yazılmış bir değişkeni sessizce yutup cümleyi bozardı; süslü
 * parantez ekranda durursa yazan kişi neyi düzelteceğini görüyor.
 */
export function degiskenleriYerlestir(metin: string, degerler: Record<string, string | null | undefined>): string {
  return metin.replace(/\{(\w+)\}/g, (tam, ad: string) => {
    const deger = degerler[ad];
    return deger == null || deger === "" ? tam : deger;
  });
}

/**
 * Panelden gelen metni varsayılanın üzerine koyar.
 *
 * Yalnızca DOLU alanlar geçiyor: null "dokunulmadı", boş string ise kazara
 * temizlenmiş bir kutu demek ve ikisinde de doğru davranış varsayılana
 * dönmek — konusuz bir mail göndermekten iyi.
 */
export function metniBirlestir<T extends { konu: string; ustEtiket: string; baslik: string; ozet?: string; eylemEtiketi?: string }>(
  varsayilan: T,
  ozel: AkisMetni | null,
  degiskenler: Record<string, string | null | undefined> = {},
): T {
  if (!ozel) return varsayilan;

  const sec = (o: string | null | undefined, v: string | undefined) => {
    const secilen = o?.trim() ? o : v;
    return secilen === undefined ? undefined : degiskenleriYerlestir(secilen, degiskenler);
  };

  return {
    ...varsayilan,
    konu: sec(ozel.konu, varsayilan.konu)!,
    ustEtiket: sec(ozel.ustEtiket, varsayilan.ustEtiket)!,
    baslik: sec(ozel.baslik, varsayilan.baslik)!,
    ozet: sec(ozel.ozet, varsayilan.ozet),
    eylemEtiketi: sec(ozel.eylemEtiketi, varsayilan.eylemEtiketi),
  };
}
