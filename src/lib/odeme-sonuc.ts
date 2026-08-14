import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { basariliMi, odemeSorgula, type IyzicoAyar } from "@/lib/iyzico";

/**
 * Bir ödeme denemesinin sonucunu iyzico'ya sorup kaydeder.
 *
 * Üç yerden çağrılıyor: 3D Secure dönüşü, yöneticinin "iyzico'ya sor" düğmesi
 * ve zamanlanmış mutabakat görevi. Aynı mantığın üç kopyası olsaydı biri
 * mutlaka diğerlerinden farklı davranırdı — ve fark ettiğimiz yer para
 * tutmayan bir kayıt olurdu.
 */

export type CozumSonucu =
  /** iyzico ödemeyi onayladı, kayıt "odendi" yapıldı. */
  | "basarili"
  /** iyzico ödemenin tamamlanmadığını söyledi. */
  | "basarisiz"
  /** Token'a karşılık gelen deneme kaydı bulunamadı. */
  | "eslesmedi"
  /** iyzico'ya ulaşılamadı; kayıt olduğu gibi bırakıldı. */
  | "belirsiz";

export async function denemeyiCoz(
  servis: SupabaseClient,
  ayar: IyzicoAyar,
  token: string,
): Promise<CozumSonucu> {
  let cevap;
  try {
    cevap = await odemeSorgula(ayar, token);
  } catch {
    // Ağ hatası. Kaydı bozmuyoruz: para çekilmiş olabilir ve "basarisiz"
    // yazmak onu görünmez yapardı. Mutabakat görevi tekrar deneyecek.
    return "belirsiz";
  }

  // Eşleştirmede conversationId birincil yol; iyzico bu alanı her cevapta
  // döndürmediği için token ikinci yol olarak duruyor.
  const konusmaId = cevap.conversationId ?? "";
  let deneme: { id: string; payment_id: string; tutar: number; durum: string } | null = null;

  if (konusmaId) {
    const { data } = await servis
      .from("odeme_denemeleri")
      .select("id, payment_id, tutar, durum")
      .eq("conversation_id", konusmaId)
      .maybeSingle();
    deneme = data;
  }
  if (!deneme) {
    const { data } = await servis
      .from("odeme_denemeleri")
      .select("id, payment_id, tutar, durum")
      .eq("token", token)
      .maybeSingle();
    deneme = data;
  }
  if (!deneme) return "eslesmedi";

  // Aynı token birden çok kez çözülebiliyor (geri tuşu, iyzico tekrarı,
  // mutabakat görevi). İkinci kez ödeme tarihini bozmuyoruz.
  if (deneme.durum === "basarili") return "basarili";

  const ortak = {
    token,
    saglayici_odeme_id: cevap.paymentId ?? null,
    taksit: cevap.installment ?? null,
    kart_son4: cevap.lastFourDigits ?? null,
    kart_ailesi: cevap.cardFamily ?? null,
    ham_yanit: cevap,
  };

  if (!basariliMi(cevap)) {
    await servis
      .from("odeme_denemeleri")
      .update({
        ...ortak,
        durum: "basarisiz",
        hata_kodu: cevap.errorCode ?? null,
        hata_mesaji: cevap.errorMessage ?? `Ödeme tamamlanmadı (${cevap.paymentStatus ?? cevap.status}).`,
      })
      .eq("id", deneme.id);
    return "basarisiz";
  }

  /*
    Tutar doğrulaması `price` üzerinden, `paidPrice` üzerinden DEĞİL.

    Taksitli ödemede paidPrice vade farkıyla price'tan büyük geliyor; onu
    karşılaştırsaydık her taksitli ödeme "tutar uyuşmuyor" diye düşerdi.
  */
  const gelen = Number(cevap.price);
  const beklenen = Number(deneme.tutar);
  if (!Number.isFinite(gelen) || Math.abs(gelen - beklenen) > 0.01) {
    await servis
      .from("odeme_denemeleri")
      .update({
        ...ortak,
        durum: "basarisiz",
        hata_kodu: "TUTAR_UYUSMAZLIGI",
        hata_mesaji: `Beklenen ${beklenen}, iyzico ${cevap.price} dedi.`,
      })
      .eq("id", deneme.id);
    return "basarisiz";
  }

  await servis.from("odeme_denemeleri").update({ ...ortak, durum: "basarili" }).eq("id", deneme.id);

  // durum süzgeci: bu arada yönetici kaydı "iade"ye çekmişse ödeme onu geri
  // "odendi" yapmasın.
  await servis
    .from("payments")
    .update({
      durum: "odendi",
      yontem: "Kart (iyzico)",
      odeme_tarihi: new Date().toISOString(),
    })
    .eq("id", deneme.payment_id)
    .eq("durum", "bekliyor");

  return "basarili";
}
