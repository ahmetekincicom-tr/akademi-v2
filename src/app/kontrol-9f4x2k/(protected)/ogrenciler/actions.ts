"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function kayitEkle(userId: string, courseId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("enrollments").insert({ user_id: userId, course_id: courseId });
  if (error) {
    return { error: error.code === "23505" ? "Bu öğrenci zaten bu eğitime kayıtlı." : error.message };
  }
  revalidatePath("/kontrol-9f4x2k/ogrenciler");
  return {};
}

export async function kayitKaldir(userId: string, courseId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("enrollments").delete().eq("user_id", userId).eq("course_id", courseId);
  if (error) return { error: error.message };
  revalidatePath("/kontrol-9f4x2k/ogrenciler");
  return {};
}
