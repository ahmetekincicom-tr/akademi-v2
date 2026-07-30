"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type MesajInput = {
  tur: "iletisim" | "teklif";
  ad: string;
  email: string;
  telefon?: string;
  sirket?: string;
  konu?: string;
  mesaj: string;
  courseSlug?: string;
  // Hidden field a human never fills; a filled one means a bot.
  tuzak?: string;
};

const EPOSTA = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function mesajGonder(input: MesajInput): Promise<{ error?: string }> {
  if (input.tuzak) return {};

  const ad = input.ad.trim();
  const email = input.email.trim();
  const mesaj = input.mesaj.trim();

  if (ad.length < 2) return { error: "Adını yazar mısın?" };
  if (!EPOSTA.test(email)) return { error: "Geçerli bir e-posta adresi gir." };
  if (mesaj.length < 10) return { error: "Mesajını biraz daha açar mısın? (en az 10 karakter)" };

  const supabase = await createClient();

  let courseId: string | null = null;
  if (input.courseSlug) {
    const { data } = await supabase.from("courses").select("id").eq("slug", input.courseSlug).maybeSingle();
    courseId = data?.id ?? null;
  }

  const { error } = await supabase.from("iletisim_mesajlari").insert({
    tur: input.tur,
    ad,
    email,
    telefon: input.telefon?.trim() || null,
    sirket: input.sirket?.trim() || null,
    konu: input.konu?.trim() || null,
    mesaj,
    course_id: courseId,
  });

  if (error) return { error: "Mesaj gönderilemedi. Lütfen tekrar dener misin?" };

  revalidatePath("/admin/mesajlar");
  revalidatePath("/admin");
  return {};
}

export async function mesajOkunduIsaretle(id: string, okundu: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("iletisim_mesajlari").update({ okundu }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/mesajlar");
  revalidatePath("/admin");
  return {};
}

export async function mesajSil(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("iletisim_mesajlari").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/mesajlar");
  revalidatePath("/admin");
  return {};
}
