"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function girisYap(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const sifre = String(formData.get("sifre") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: sifre });

  if (error || !data.user) {
    redirect(`/admin/giris?hata=1&next=${encodeURIComponent(next)}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profile?.role !== "admin") {
    await supabase.auth.signOut();
    redirect(`/admin/giris?hata=yetki&next=${encodeURIComponent(next)}`);
  }

  redirect(next.startsWith("/admin") ? next : "/admin");
}
