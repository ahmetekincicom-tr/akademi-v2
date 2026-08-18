"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { iyzicoAyari } from "@/lib/iyzico";
import { denemeyiCoz } from "@/lib/odeme-sonuc";
import { odemeAcildiBildir, odemeTamamlandiBildir } from "@/lib/odeme-eposta";

export type OdemeInput = {
  userId: string;
  courseId: string;
  tutar: string;
  yontem: string;
  durum: "odendi" | "bekliyor" | "iade";
  odemeTarihi: string;
  faturaNo: string;
  /** Öğrenci bu kaydı panelden kartla ödeyebilsin mi? */
  onlineOdeme: boolean;
};

export async function odemeEkle(input: OdemeInput) {
  const tutar = Number(input.tutar.replace(",", "."));
  if (!input.userId) return { error: "Öğrenci seçmelisin." };
  if (!Number.isFinite(tutar) || tutar <= 0) return { error: "Geçerli bir tutar gir." };

  const supabase = await createClient();
  const { data: eklenen, error } = await supabase.from("payments").insert({
    user_id: input.userId,
    course_id: input.courseId || null,
    tutar,
    yontem: input.yontem.trim() || null,
    durum: input.durum,
    odeme_tarihi: input.odemeTarihi ? new Date(input.odemeTarihi).toISOString() : new Date().toISOString(),
    fatura_no: input.faturaNo.trim() || null,
    online_odeme: input.onlineOdeme,
  }).select("id").maybeSingle();

  if (error) return { error: error.message };

  // Öğrenciye haber: bekleyen ödemede "ödemen tanımlandı", peşin
  // işaretlenmişse doğrudan "ödemen alındı" (ve ön değerlendirme daveti).
  // Kaydı görsün diye panele girmesini beklemenin anlamı yok.
  if (eklenen?.id) {
    if (input.durum === "bekliyor") await odemeAcildiBildir(supabase, eklenen.id);
    else if (input.durum === "odendi") await odemeTamamlandiBildir(supabase, eklenen.id);
  }

  revalidatePath("/kontrol-9f4x2k/odemeler");
  revalidatePath("/kontrol-9f4x2k");
  return {};
}

/**
 * Kartla ödemeyi kayıt bazında açıp kapatır.
 *
 * Havaleyle anlaşılmış bir kayıt için gereklidir: öğrenci aynı borcu bir de
 * karttan ödeyip iki kez tahsilat oluşturmasın.
 */
export async function odemeOnlineDegistir(id: string, acik: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("payments").update({ online_odeme: acik }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/kontrol-9f4x2k/odemeler");
  return {};
}

export async function odemeDurumDegistir(id: string, durum: "odendi" | "bekliyor" | "iade") {
  const supabase = await createClient();

  // Önceki durum okunuyor: "odendi" zaten yazılıysa tekrar mail gitmesin.
  const { data: onceki } = await supabase.from("payments").select("durum").eq("id", id).maybeSingle();

  const { error } = await supabase.from("payments").update({ durum }).eq("id", id);
  if (error) return { error: error.message };

  if (durum === "odendi" && onceki?.durum !== "odendi") {
    await odemeTamamlandiBildir(supabase, id);
  }
  revalidatePath("/kontrol-9f4x2k/odemeler");
  revalidatePath("/kontrol-9f4x2k");
  return {};
}

export async function odemeSil(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("payments").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/kontrol-9f4x2k/odemeler");
  revalidatePath("/kontrol-9f4x2k");
  return {};
}

/**
 * Askıda kalmış bir denemenin sonucunu iyzico'ya sorar.
 *
 * Dönüş isteği kaybolduğunda (ağ, kapatılan sekme, engellenen yönlendirme)
 * para çekilmiş ama kayıt "bekliyor" kalmış olabiliyor. Tek doğru kaynak
 * iyzico; burada ona soruluyor.
 */
export async function denemeSorgula(denemeId: string) {
  const supabase = await createClient();
  // Servis anahtarı RLS'i atlıyor: yöneticiliği burada elle doğrulamazsak
  // eylem, oturumu olan herkes için çalışır.
  const { data: yonetici } = await supabase.rpc("is_admin");
  if (yonetici !== true) return { error: "Yetkin yok." };

  const ayar = iyzicoAyari();
  if (!ayar) return { error: "iyzico anahtarları tanımlı değil." };

  const servis = gorevIstemcisi();
  if (!servis) return { error: "Servis anahtarı tanımlı değil." };

  const { data: deneme } = await servis
    .from("odeme_denemeleri")
    .select("token")
    .eq("id", denemeId)
    .maybeSingle();

  if (!deneme?.token) {
    return { error: "Bu denemenin token'ı yok — iyzico sayfası hiç açılmamış." };
  }

  const sonuc = await denemeyiCoz(servis, ayar, deneme.token);
  revalidatePath("/kontrol-9f4x2k/odemeler");
  revalidatePath("/kontrol-9f4x2k/tani");

  const mesaj: Record<string, string> = {
    basarili: "iyzico ödemeyi onayladı; kayıt “Ödendi” yapıldı.",
    basarisiz: "iyzico ödemenin tamamlanmadığını söyledi.",
    eslesmedi: "iyzico bu token'a karşılık bir ödeme bulamadı.",
    belirsiz: "iyzico'ya ulaşılamadı, kayıt değiştirilmedi.",
  };
  return { sonuc, mesaj: mesaj[sonuc] };
}
