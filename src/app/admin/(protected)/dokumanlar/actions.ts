"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function dokumanKaydet(input: {
  baslik: string;
  courseId: string;
  dosyaYolu: string;
  dosyaTipi: string;
  boyut: number;
}) {
  if (!input.baslik.trim()) return { error: "Başlık zorunludur." };

  const supabase = await createClient();
  const { error } = await supabase.from("documents").insert({
    baslik: input.baslik.trim(),
    course_id: input.courseId || null,
    dosya_yolu: input.dosyaYolu,
    dosya_tipi: input.dosyaTipi,
    boyut: input.boyut,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/dokumanlar");
  revalidatePath("/panel/dokumanlar");
  return {};
}

export async function dokumanSil(id: string, dosyaYolu: string) {
  const supabase = await createClient();
  // Remove the row first: an orphaned storage object is recoverable, a row
  // pointing at a missing file is a broken download for every student.
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) return { error: error.message };

  await supabase.storage.from("dokumanlar").remove([dosyaYolu]);

  revalidatePath("/admin/dokumanlar");
  revalidatePath("/panel/dokumanlar");
  return {};
}

/** Private bucket, so downloads go through a short-lived signed URL. */
export async function dokumanIndirmeLinki(dosyaYolu: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("dokumanlar").createSignedUrl(dosyaYolu, 60);
  if (error || !data) return { error: error?.message ?? "Bağlantı oluşturulamadı." };
  return { url: data.signedUrl };
}
