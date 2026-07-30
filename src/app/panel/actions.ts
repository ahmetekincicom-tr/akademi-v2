"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function dersDurumDegistir(lessonId: string, tamamlandi: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  // RLS still checks enrollment on insert, so an unowned lesson id fails here.
  const { error } = await supabase
    .from("lesson_progress")
    .upsert(
      { user_id: user.id, lesson_id: lessonId, tamamlandi, updated_at: new Date().toISOString() },
      { onConflict: "user_id,lesson_id" },
    );

  if (error) return { error: error.message };

  revalidatePath("/panel");
  revalidatePath("/panel/dersler");
  return {};
}

export async function profilGuncelle(input: {
  ad: string;
  soyad: string;
  telefon: string;
  sirket: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const { error } = await supabase
    .from("profiles")
    .update({
      ad: input.ad.trim(),
      soyad: input.soyad.trim(),
      telefon: input.telefon.trim(),
      sirket: input.sirket.trim(),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/panel", "layout");
  return {};
}

export async function cikisYap() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/giris");
}
