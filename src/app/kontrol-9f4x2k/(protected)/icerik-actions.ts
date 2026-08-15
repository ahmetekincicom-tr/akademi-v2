"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Public pages that surface testimonials or logos.
const HERKESE_ACIK = ["/", "/yorumlar", "/referanslar", "/kurumsal", "/egitimler"];

function tazele() {
  for (const yol of HERKESE_ACIK) revalidatePath(yol);
  revalidatePath("/kontrol-9f4x2k/yorumlar");
  revalidatePath("/kontrol-9f4x2k/referanslar");
}

export type YorumInput = {
  id?: string;
  metin: string;
  isim: string;
  rol: string;
  courseId: string;
  sira: string;
  yayinda: boolean;
};

export async function yorumKaydet(input: YorumInput) {
  if (!input.metin.trim()) return { error: "Yorum metni zorunlu." };
  if (!input.isim.trim()) return { error: "İsim zorunlu." };

  const supabase = await createClient();
  const satir = {
    metin: input.metin.trim(),
    isim: input.isim.trim(),
    rol: input.rol.trim() || null,
    course_id: input.courseId || null,
    sira: Number(input.sira) || 0,
    yayinda: input.yayinda,
  };

  const { error } = input.id
    ? await supabase.from("yorumlar").update(satir).eq("id", input.id)
    : await supabase.from("yorumlar").insert(satir);

  if (error) return { error: error.message };
  tazele();
  return {};
}

export async function yorumSil(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("yorumlar").delete().eq("id", id);
  if (error) return { error: error.message };
  tazele();
  return {};
}

export type ReferansInput = {
  id?: string;
  ad: string;
  sektor: string;
  siteUrl: string;
  sira: string;
  yayinda: boolean;
  logoYolu?: string;
};

export async function referansKaydet(input: ReferansInput) {
  if (!input.ad.trim()) return { error: "Kurum adı zorunlu." };

  const supabase = await createClient();
  const satir: Record<string, unknown> = {
    ad: input.ad.trim(),
    sektor: input.sektor.trim() || null,
    site_url: input.siteUrl.trim() || null,
    sira: Number(input.sira) || 0,
    yayinda: input.yayinda,
  };
  // Only overwrite the logo when a new one was uploaded in this save.
  if (input.logoYolu !== undefined) satir.logo_yolu = input.logoYolu || null;

  const { error } = input.id
    ? await supabase.from("referanslar").update(satir).eq("id", input.id)
    : await supabase.from("referanslar").insert(satir);

  if (error) return { error: error.message };
  tazele();
  return {};
}

export async function referansSil(id: string, logoYolu: string | null) {
  const supabase = await createClient();
  const { error } = await supabase.from("referanslar").delete().eq("id", id);
  if (error) return { error: error.message };

  if (logoYolu) await supabase.storage.from("logolar").remove([logoYolu]);

  tazele();
  return {};
}
