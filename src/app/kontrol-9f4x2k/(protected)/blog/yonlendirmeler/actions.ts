"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hedefDuzenle, kaynakDuzenle } from "@/lib/yonlendirme";

/**
 * Yönlendirme tablosunun elle yönetimi.
 *
 * Yazma yetkisi RLS'te (yalnız yönetici); burada biçim doğrulanıyor ve
 * kullanıcıya anlaşılır hata dönülüyor. Ara katman tabloyu bir dakikalık
 * önbellekten okuyor: değişiklik en geç bir dakika içinde devreye girer.
 */

const YOL = "/kontrol-9f4x2k/blog/yonlendirmeler";

export type YonlendirmeGirdi = { kaynak: string; kod: 301 | 410; hedef: string; notu: string };

function hazirla(g: YonlendirmeGirdi): { kaynak: string; kod: 301 | 410; hedef: string | null; notu: string } | { error: string } {
  const kaynak = kaynakDuzenle(g.kaynak);
  if (!kaynak) return { error: "Eski adres sitedeki bir yol olmalı. Örnek: /eski-yazi/" };
  if (g.kod === 410) return { kaynak, kod: 410, hedef: null, notu: g.notu.trim().slice(0, 300) };
  const hedef = hedefDuzenle(g.hedef);
  if (!hedef) return { error: "Yeni adres geçersiz. Örnek: /blog/ ya da https://… (yalnız https)" };
  if (hedef === kaynak) return { error: "Bir adres kendine yönlendirilemez." };
  return { kaynak, kod: 301, hedef, notu: g.notu.trim().slice(0, 300) };
}

/**
 * Elle eklenen satırın kaynağı yayındaki bir yazının ya da bir kategorinin
 * adresiyse, o sayfa artık açılmaz. Sessizce izin vermek yerine durduruluyor.
 */
async function canliAdresMi(supabase: Awaited<ReturnType<typeof createClient>>, kaynak: string): Promise<boolean> {
  const slug = kaynak.replace(/^\/|\/$/g, "");
  if (!slug || slug.includes("/")) return false;
  const [{ data: yazi }, { data: kat }] = await Promise.all([
    supabase.from("posts").select("id").eq("slug", slug).eq("durum", "yayin").maybeSingle(),
    supabase.from("categories").select("id").eq("slug", slug).maybeSingle(),
  ]);
  return Boolean(yazi || kat);
}

export async function yonlendirmeEkle(g: YonlendirmeGirdi): Promise<{ error?: string }> {
  const satir = hazirla(g);
  if ("error" in satir) return { error: satir.error };
  const supabase = await createClient();
  if (await canliAdresMi(supabase, satir.kaynak)) {
    return { error: "Bu adres yayındaki bir yazının ya da kategorinin. Önce onu yayından kaldır." };
  }
  const { error } = await supabase.from("yonlendirmeler").insert({ ...satir, otomatik: false }).select("id").single();
  if (error) return { error: error.code === "23505" ? "Bu eski adres için zaten bir yönlendirme var." : error.message };
  revalidatePath(YOL);
  return {};
}

export async function yonlendirmeGuncelle(id: string, g: YonlendirmeGirdi): Promise<{ error?: string }> {
  const satir = hazirla(g);
  if ("error" in satir) return { error: satir.error };
  const supabase = await createClient();
  // Elle düzenlenen satır artık "otomatik" değil: tetikleyici bir daha üzerine
  // yazmasın (ör. yazının adresi yeniden değişse de buradaki karar kalsın).
  const { data, error } = await supabase
    .from("yonlendirmeler")
    .update({ ...satir, otomatik: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id");
  if (error) return { error: error.code === "23505" ? "Bu eski adres için zaten bir yönlendirme var." : error.message };
  if (!data || data.length === 0) return { error: "Güncellenemedi (RLS)." };
  revalidatePath(YOL);
  return {};
}

export async function yonlendirmeAktifYap(id: string, aktif: boolean): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("yonlendirmeler")
    .update({ aktif, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "Güncellenemedi (RLS)." };
  revalidatePath(YOL);
  return {};
}

export async function yonlendirmeSil(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("yonlendirmeler").delete().eq("id", id).select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "Silinemedi (RLS)." };
  revalidatePath(YOL);
  return {};
}
