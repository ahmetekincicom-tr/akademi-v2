"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function dersVideoKaydet(lessonId: string, videoUrl: string, aciklama: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("lessons")
    .update({ video_url: videoUrl.trim() || null, aciklama: aciklama.trim() || null })
    .eq("id", lessonId);

  if (error) return { error: error.message };
  revalidatePath("/kontrol-9f4x2k/video");
  revalidatePath("/panel/dersler");
  return {};
}
