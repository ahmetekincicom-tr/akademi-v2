"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { yoneticiBildirimi } from "@/lib/eposta";

export async function gorusmeTalepEt(input: { konu: string; aciklama: string; tercihZaman: string }) {
  const supabase = await createClient();

  // Ücretsiz hak sayımı ve fiyat veritabanı fonksiyonunda belirlenir; buradan
  // gönderilen hiçbir değer ücreti etkilemez.
  const { error } = await supabase.rpc("gorusme_talep_olustur", {
    p_konu: input.konu,
    p_aciklama: input.aciklama,
    p_tercih_zaman: input.tercihZaman,
  });

  if (error) return { error: error.message };

  // Danışmanlık talebi doğrudan satış: geç dönmek müşteri kaybı. Talebi açan
  // kişiyi ayrıca okumak gerekiyor, RPC yalnızca hata döndürüyor.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profil } = await supabase
    .from("profiles")
    .select("ad, soyad, email, telefon")
    .eq("id", user?.id ?? "")
    .maybeSingle();
  const isim = [profil?.ad, profil?.soyad].filter(Boolean).join(" ") || profil?.email || "Bir katılımcı";

  await yoneticiBildirimi({
    konu: `Danışmanlık talebi · ${isim}`,
    ustEtiket: "Danışmanlık talebi",
    baslik: `${isim} görüşme istedi`,
    ozet: input.konu,
    satirlar: [
      { etiket: "Tercih ettiği zaman", deger: input.tercihZaman || "Belirtilmedi" },
      { etiket: "E-posta", deger: profil?.email ?? "—" },
      { etiket: "Telefon", deger: profil?.telefon ?? "—" },
    ],
    alinti: input.aciklama || undefined,
    yol: "/admin/gorusmeler",
    eylemEtiketi: "Talebi panelde aç",
  });

  revalidatePath("/panel/gorusmeler");
  revalidatePath("/admin/gorusmeler");
  return {};
}

export async function gorusmeIptalEt(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("gorusme_iptal", { p_id: id });
  if (error) return { error: error.message };

  revalidatePath("/panel/gorusmeler");
  revalidatePath("/admin/gorusmeler");
  return {};
}
