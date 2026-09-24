"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { yoneticiMi } from "@/lib/panel-kapsam";
import { veriHatasi } from "@/lib/auth-hatalari";
import { DURUM, ilanGirdisiniDogrula, type IlanDurum, type IlanGirdi } from "@/lib/firsat";

/**
 * İş ilanları — yönetim. Faz 1'de ilanı yalnız yönetici giriyor; her eylem
 * yetkiyi sunucuda da soruyor (server action'lar herkese açık uç nokta),
 * RLS de aynı kuralı uyguluyor.
 */

function tazele(id?: string) {
  revalidatePath("/kontrol-9f4x2k/firsatlar");
  revalidatePath("/panel/firsatlar");
  if (id) revalidatePath(`/panel/firsatlar/${id}`);
}

export async function ilanKaydet(id: string | null, girdi: IlanGirdi): Promise<{ error?: string; id?: string }> {
  if (!(await yoneticiMi())) return { error: "Bu işlem için yetkin yok." };
  const sonuc = ilanGirdisiniDogrula(girdi);
  if ("hata" in sonuc) return { error: sonuc.hata };

  const supabase = await createClient();
  if (id) {
    const { error } = await supabase.from("is_ilanlari").update(sonuc.satir).eq("id", id);
    if (error) return { error: veriHatasi(error) };
    tazele(id);
    return { id };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("is_ilanlari")
    .insert({ ...sonuc.satir, olusturan: user?.id ?? null })
    .select("id")
    .single();
  if (error || !data) return { error: error ? veriHatasi(error) : "İlan kaydedilemedi." };
  tazele(data.id);
  return { id: data.id };
}

export async function ilanDurumDegistir(id: string, durum: IlanDurum): Promise<{ error?: string }> {
  if (!(await yoneticiMi())) return { error: "Bu işlem için yetkin yok." };
  if (!Object.prototype.hasOwnProperty.call(DURUM, durum)) return { error: "Durum geçersiz." };

  const supabase = await createClient();
  if (durum === "yayinda") {
    // Yayına alırken açıklama boş olmasın (formdaki kuralla aynı).
    const { data } = await supabase.from("is_ilanlari").select("aciklama").eq("id", id).maybeSingle();
    if (!data?.aciklama?.trim()) return { error: "Yayınlamadan önce açıklama gir." };
  }
  const { error } = await supabase.from("is_ilanlari").update({ durum }).eq("id", id);
  if (error) return { error: veriHatasi(error) };
  tazele(id);
  return {};
}

export async function ilanOneCikar(id: string, oneCikan: boolean): Promise<{ error?: string }> {
  if (!(await yoneticiMi())) return { error: "Bu işlem için yetkin yok." };
  const supabase = await createClient();
  const { error } = await supabase.from("is_ilanlari").update({ one_cikan: oneCikan }).eq("id", id);
  if (error) return { error: veriHatasi(error) };
  tazele(id);
  return {};
}

/**
 * Kalıcı silme: kayıtlar ve olaylar da gider (cascade). Geçmiş metrikleri
 * korumak isteyen için "Arşivle" var; arayüz silmeden önce onay istiyor.
 */
export async function ilanSil(id: string): Promise<{ error?: string }> {
  if (!(await yoneticiMi())) return { error: "Bu işlem için yetkin yok." };
  const supabase = await createClient();
  const { data: ilan } = await supabase.from("is_ilanlari").select("sirket_logo").eq("id", id).maybeSingle();
  const { error } = await supabase.from("is_ilanlari").delete().eq("id", id);
  if (error) return { error: veriHatasi(error) };

  // Logo başka bir ilanda kullanılmıyorsa depodan da kaldır.
  if (ilan?.sirket_logo) {
    const { count } = await supabase
      .from("is_ilanlari")
      .select("id", { count: "exact", head: true })
      .eq("sirket_logo", ilan.sirket_logo);
    if (!count) await supabase.storage.from("logolar").remove([ilan.sirket_logo]);
  }
  tazele(id);
  return {};
}
