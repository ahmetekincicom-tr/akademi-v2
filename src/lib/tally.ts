import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Tally webhook'unun doğrulanması ve okunması.
 *
 * Saf fonksiyonlar: ne ağa ne veritabanına bağlılar, test edilebiliyorlar.
 * Bu önemli çünkü buradaki bir hata sessiz olur — imza kontrolü yanlış
 * yazılmış bir uç nokta çalışmaya devam eder, sadece artık kimliği
 * doğrulamaz.
 */

/** Tally'nin gövdedeki imzayı taşıdığı başlık. */
export const IMZA_BASLIGI = "tally-signature";

/**
 * İmza doğru mu?
 *
 * Tally, ham gövdenin HMAC-SHA256'sını imzalama sırrıyla hesaplayıp base64
 * olarak gönderiyor. Doğrulama HAM METİN üzerinden yapılmak zorunda:
 * JSON.parse edilip tekrar stringify edilen gövde bayt bayt aynı olmuyor
 * (boşluk, anahtar sırası, sayı biçimi) ve imza tutmuyor.
 *
 * Karşılaştırma timingSafeEqual ile: düz `===` karakter karakter kısa devre
 * yapıyor ve doğru imzanın ne kadarının tutturulduğu cevap süresinden
 * ölçülebiliyor.
 */
export function imzaDogru(hamGovde: string, gelenImza: string | null, sir: string): boolean {
  if (!gelenImza || !sir) return false;

  const beklenen = createHmac("sha256", sir).update(hamGovde).digest("base64");

  const a = Buffer.from(gelenImza);
  const b = Buffer.from(beklenen);
  // Uzunluk farkı timingSafeEqual'ı hata fırlattığı için önce ayıklanıyor.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Tally'nin gönderdiği alanların ilgilendiğimiz kısmı. */
type TallyAlan = { label?: unknown; key?: unknown; value?: unknown };

/**
 * Gizli alandaki katılımcı kimliğini bulur.
 *
 * Form adresine `?kullanici=<uuid>` eklenerek dolduruluyor (form-ayarlari.ts).
 * Tally onu yanıtla birlikte geri gönderiyor; cevabın kime ait olduğunu
 * bilmemizin tek yolu bu — e-postayla eşleştirmek, kişinin forma başka bir
 * adres yazması durumunda yanlış kişiyi işaretlerdi.
 *
 * Değer UUID biçimine uymuyorsa null: dışarıdan gelen bir dizgeyi doğrudan
 * sorguya koymuyoruz.
 */
export function kullaniciyiBul(govde: unknown): string | null {
  const veri = (govde as { data?: { fields?: unknown } } | null)?.data;
  if (!veri || !Array.isArray(veri.fields)) return null;

  for (const ham of veri.fields as TallyAlan[]) {
    const ad = typeof ham.label === "string" ? ham.label : typeof ham.key === "string" ? ham.key : "";
    if (ad.toLowerCase() !== "kullanici") continue;

    const deger = typeof ham.value === "string" ? ham.value.trim() : "";
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(deger) ? deger : null;
  }
  return null;
}

/** Yalnızca form yanıtlarıyla ilgileniyoruz; Tally başka olay türleri de yolluyor. */
export function yanitOlayiMi(govde: unknown): boolean {
  const tur = (govde as { eventType?: unknown } | null)?.eventType;
  return typeof tur === "string" && tur.toUpperCase() === "FORM_RESPONSE";
}
