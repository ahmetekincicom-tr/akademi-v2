"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { bugunTR } from "@/lib/firsat";

/**
 * Öğrencinin ilanlarla etkileşimi. Yetki RLS'te: yalnız görebildiği
 * (yayındaki) ilanı kaydedebilir / olay yazabilir, yalnız kendi adına.
 */

export async function ilanKaydetDegistir(ilanId: string, kaydet: boolean): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const { error } = kaydet
    ? await supabase.from("is_ilani_kayitlar").insert({ user_id: user.id, ilan_id: ilanId })
    : await supabase.from("is_ilani_kayitlar").delete().eq("user_id", user.id).eq("ilan_id", ilanId);
  // Zaten kayıtlıysa (çift tıklama) hata sayma.
  if (error && error.code !== "23505") return { error: "İşlem yapılamadı. Tekrar dene." };

  revalidatePath("/panel/firsatlar");
  revalidatePath("/kontrol-9f4x2k/firsatlar");
  return {};
}

/**
 * Görüntülenme / başvuru tıklaması. Kişi başına günde bir kez sayılıyor
 * (benzersiz indeks); tekrarı sessizce yutuluyor. Yönetici önizlemesi
 * sayılmıyor. Süresi dolmuş ilanda tıklama RLS'e takılıyor.
 */
export async function ilanOlayi(ilanId: string, tur: "goruntulenme" | "basvuru_tiklama"): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profil } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profil?.role === "admin") return;

  await supabase.from("is_ilani_olaylar").insert({ ilan_id: ilanId, user_id: user.id, tur, gun: bugunTR() });
}
