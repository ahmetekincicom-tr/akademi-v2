"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { oturumKaydet } from "@/app/oturum-actions";

export async function girisYap(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const sifre = String(formData.get("sifre") ?? "");
  const next = String(formData.get("next") ?? "/kontrol-9f4x2k");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: sifre });

  if (error || !data.user) {
    redirect(`/kontrol-9f4x2k/giris?hata=1&next=${encodeURIComponent(next)}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profile?.role !== "admin") {
    await supabase.auth.signOut();
    redirect(`/kontrol-9f4x2k/giris?hata=yetki&next=${encodeURIComponent(next)}`);
  }

  // Giriş kaydı yan iş; başarısız olsa da yönlendirmeyi engellememeli.
  try {
    await oturumKaydet();
  } catch (e) {
    console.error("[admin giris] oturum kaydı yazılamadı:", e);
  }

  redirect(next.startsWith("/kontrol-9f4x2k") ? next : "/kontrol-9f4x2k");
}
