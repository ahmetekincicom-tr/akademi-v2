/**
 * Kart başlığını iki satıra böler.
 *
 * Neden elle: CSS'in `text-wrap: balance` özelliği kart genişliğinde uzun
 * başlığı doğru bölüyor ("Birebir Sosyal Medya / Uzmanlığı Eğitimi") ama kısa
 * başlıkları hiç bölmüyor — onlar tek satıra sığıyor ve kartın başlık alanı
 * yarı boş kalıyor. Sığmayacak kadar dar bir kutuya sıkıştırınca da program
 * adını ortadan bölüyor: "Birebir Meta / Ads Eğitimi", "Birebir Yapay / Zekâ
 * Eğitimi". İkisi de tarayıcının suçu değil; balance yalnızca satır
 * uzunluklarına bakıyor, hangi kelimelerin birbirine ait olduğunu bilmiyor.
 *
 * Kural iki maddede:
 *
 * 1. PROGRAM ADI BÖLÜNMEZ. Ad, eğitimin panelde girilen etiketi ("Meta Ads",
 *    "Sosyal medya", "Yapay zekâ"). Başlıkta geçtiği yer tek bir parça sayılır.
 * 2. Kalan parçalar arasından, İKİ SATIRI EN DENGELİ yapan yerden bölünür.
 *    Eşitlik durumunda ilk satır kısa olan tercih edilir — "Birebir" tek
 *    başına üstte durur, program adı aşağıda bütün hâlinde okunur.
 *
 * Sonuç (kart genişliğinde ölçüldü):
 *   Birebir / Meta Ads Eğitimi
 *   Birebir Sosyal Medya / Uzmanlığı Eğitimi
 *   Birebir / Yapay Zekâ Eğitimi
 */

/** Türkçe duyarlı küçültme: "I" → "ı", "İ" → "i". */
function kucult(metin: string) {
  return metin.toLocaleLowerCase("tr");
}

/**
 * Başlığı parçalara ayırır; etiket başlıkta geçiyorsa tek parça olarak.
 * Parçalar kelime dizisi olarak dönüyor, birleştirme çağırana ait.
 */
function parcalara(baslik: string, etiket: string): string[] {
  const kelimeler = baslik.trim().split(/\s+/).filter(Boolean);
  const etiketKelimeleri = etiket.trim().split(/\s+/).filter(Boolean);
  if (etiketKelimeleri.length < 2) return kelimeler;

  // Etiketin başlıktaki yerini bul (büyük/küçük harf ve ek farkı olmadan).
  for (let i = 0; i + etiketKelimeleri.length <= kelimeler.length; i++) {
    const dilim = kelimeler.slice(i, i + etiketKelimeleri.length);
    if (dilim.every((k, j) => kucult(k) === kucult(etiketKelimeleri[j]))) {
      return [...kelimeler.slice(0, i), dilim.join(" "), ...kelimeler.slice(i + etiketKelimeleri.length)];
    }
  }
  return kelimeler;
}

export function kartBasligiSatirlari(baslik: string, etiket: string): { ilk: string; kalan: string } | null {
  const parcalar = parcalara(baslik, etiket);
  // Tek parçalık başlık bölünemez; kart onu tek satır olarak basıyor.
  if (parcalar.length < 2) return null;

  let enIyi: { ilk: string; kalan: string; fark: number } | null = null;

  for (let i = 1; i < parcalar.length; i++) {
    const ilk = parcalar.slice(0, i).join(" ");
    const kalan = parcalar.slice(i).join(" ");
    const fark = Math.abs(ilk.length - kalan.length);
    // Kesin eşitlikte İLK bulunan kazanıyor; döngü soldan sağa gittiği için
    // bu, ilk satırı kısa tutan bölme demek.
    if (!enIyi || fark < enIyi.fark) enIyi = { ilk, kalan, fark };
  }

  return enIyi ? { ilk: enIyi.ilk, kalan: enIyi.kalan } : null;
}
