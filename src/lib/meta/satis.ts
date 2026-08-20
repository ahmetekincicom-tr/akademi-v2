import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/tipler";
import { metaOlayiKuyrukla } from "@/lib/meta/kuyruk";
import { profildenKimlik } from "@/lib/meta/toplama";

/**
 * Satın alma olayı.
 *
 * Ödemenin kesinleştiği HER yol buradan geçiyor: 3D Secure dönüşü, yöneticinin
 * "iyzico'ya sor" düğmesi, mutabakat görevi ve havalenin elle işaretlenmesi.
 * Aynı mantığın dört kopyası olsaydı biri mutlaka diğerlerinden farklı
 * davranırdı — ve fark edildiği yer, Meta'da eksik görünen ciro olurdu.
 *
 * event_id ödeme kaydının kimliğinden: aynı ödeme iki kez çözüldüğünde
 * (geri tuşu, iyzico tekrarı, mutabakat) Meta iki ayrı satış saymıyor.
 */
export async function satinAlmaOlayi(
  servis: SupabaseClient<Database>,
  paymentId: string,
  aksiyon: "website" | "other",
): Promise<void> {
  try {
    const { data: odeme } = await servis
      .from("payments")
      .select("tutar, user_id, courses(baslik)")
      .eq("id", paymentId)
      .maybeSingle();

    if (!odeme?.user_id) return;

    /*
      Kimlik PROFİLDEN, istekten değil.

      Havaleyi yönetici işaretliyor ve mutabakatı zamanlayıcı çalıştırıyor;
      o anda istekte katılımcının değil YÖNETİCİNİN (ya da hiç kimsenin)
      kimliği var. İstekten okunsaydı satışlar yöneticinin adına yazılırdı.
    */
    const kimlik = await profildenKimlik(servis, odeme.user_id);
    if (!kimlik) return;

    await metaOlayiKuyrukla({
      olay: "Purchase",
      eventId: `purchase-${paymentId}`,
      kimlik: kimlik.kimlik,
      ozel: {
        /*
          Tutar sepet fiyatı (payments.tutar), karttan çekilen değil.

          Taksitli ödemede vade farkı bankaya gidiyor; onu ciro saymak Meta'ya
          kazanılmamış bir gelir bildirmek olurdu ve ROAS'ı olduğundan iyi
          gösterirdi. odeme-sonuc.ts'teki doğrulama da aynı sebeple `price`
          üzerinden yürüyor.
        */
        value: Number(odeme.tutar),
        currency: "TRY",
        content_name: odeme.courses?.baslik ?? "Eğitim",
      },
      aksiyon,
      userId: odeme.user_id,
      izin: kimlik.izin,
    });
  } catch (hata) {
    // Ölçümleme, tahsilatı geri almaz.
    console.error("[meta] satın alma olayı yazılamadı", hata);
  }
}
