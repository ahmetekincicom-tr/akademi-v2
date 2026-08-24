"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { veriHatasi } from "@/lib/auth-hatalari";
import { yoneticiMi } from "@/lib/panel-kapsam";

/**
 * Ön değerlendirmenin doldurulduğunu YÖNETİCİ işaretler.
 *
 * Önceden bunu katılımcının kendisi yapıyordu: panelde bir "formu doldurdum"
 * düğmesi vardı ve formu hiç açmadan basılabiliyordu. Eski yorum bunu
 * "kaybedilecek bir şey yok" diye geçiştiriyordu; yanlıştı. Bu adım eğitim
 * planlamasının kapısı — yanlış işaretlendiğinde eğitmen ön değerlendirmeyi
 * okumadan tarih planlıyor, yani sürecin varlık sebebi ortadan kalkıyor.
 *
 * Düğmeyi gizlemek çözüm değildi: server action'lar herkese açık uç noktalar.
 * Normal yol artık Tally webhook'u (app/api/formlar/tally); burası yalnızca
 * elle düzeltme için — webhook kurulmadan önce doldurulmuş formlar, Tally
 * kesintisi, telefonla alınan cevap.
 */
export async function onDegerlendirmeIsaretle(userId: string, dolduruldu: boolean) {
  if (!(await yoneticiMi())) return { error: "Bu işlem için yetkin yok." };
  if (!userId) return { error: "Katılımcı belirtilmedi." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ on_degerlendirme_tarihi: dolduruldu ? new Date().toISOString() : null })
    .eq("id", userId);

  if (error) return { error: veriHatasi(error) };

  revalidatePath("/kontrol-9f4x2k/ogrenciler");
  // Katılımcının kendi paneli de değişiyor: adım kartı ve yan menü rozeti.
  revalidatePath("/panel", "layout");
  revalidatePath("/panel/testlerim");
  return {};
}
