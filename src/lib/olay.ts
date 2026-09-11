/**
 * Tarayıcı tarafı pazarlama olayları (Google).
 *
 * Meta tarafı SUNUCUDAN gidiyor (CAPI): WhatsApp teması /api/temas ile, satın
 * alma odeme-sonuc.ts içindeki satinAlmaOlayi ile. Google tarafında ise
 * karşılığı yoktu — eski sitede "Eğitim Planı Oluştur" butonuna konan Google
 * Ads dönüşümü site yenilenince düşmüştü. Bu dosya o sinyali geri getiriyor.
 *
 * TEK GİRİŞ NOKTASI burası: olay adı, parametreler ve doğrudan Ads dönüşümü
 * tek yerde. Her butona ayrı ayrı gtag çağrısı serpiştirmek, yarın eklenecek
 * butonun unutulması demekti — nitekim bir kez öyle oldu.
 *
 * Consent Mode zaten kurulu (bkz. Olcumleme.tsx): olay HER KOŞULDA
 * ateşleniyor, izin durumunu Google'ın kendisi yönetiyor (izin yoksa
 * modelleme). Bu yüzden burada ayrı bir izin kontrolü yok — Consent Mode'un
 * çalışma biçimi tam olarak budur.
 */

type Ads = { id: string; etiket: string };

/**
 * WhatsApp temas olayı.
 *
 * İki şey birden ateşliyor:
 *  1. GA4/GTM olayı (whatsapp_iletisim) — hangi kurulum olursa olsun
 *     dataLayer'a düşer. GA4'te "anahtar olay" işaretlenip Ads'e aktarılabilir
 *     ya da GTM'de tetikleyici olarak kullanılabilir.
 *  2. Doğrudan Google Ads dönüşümü — panelde AW kimliği ve dönüşüm etiketi
 *     girilmişse (window.__aeaAds). Eski butonun yaptığı buydu; anında sinyal,
 *     içe aktarma gecikmesi yok.
 *
 * `ref` WhatsApp mesajına gömülen takip kodu: aynı kod hem Meta temasında hem
 * burada, böylece offline satış geri yüklenirken tıklama eşleştirilebiliyor.
 */
export function whatsappOlayi(yer: string, ref: string | null): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: (...a: unknown[]) => void; __aeaAds?: Ads };
  if (typeof w.gtag !== "function") return;

  try {
    w.gtag("event", "whatsapp_iletisim", { yer, ...(ref ? { ref } : {}) });

    const ads = w.__aeaAds;
    if (ads?.id && ads.etiket) {
      w.gtag("event", "conversion", { send_to: `${ads.id}/${ads.etiket}` });
    }
  } catch {
    // Ölçümleme yan iş; WhatsApp'a gidişi hiçbir koşulda engellemesin.
  }
}
