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
  revalidatePath("/kontrol-9f4x2k/dokumanlar");
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

  revalidatePath("/kontrol-9f4x2k/dokumanlar");
  revalidatePath("/panel/dokumanlar");
  return {};
}

/*
  İndirme bağlantısı üreten eylem KALDIRILDI.

  İmzalı Supabase adresini istemciye verip tarayıcıyı oraya göndermek iki şeyi
  bozuyordu: kullanıcı supabase.co adresini görüyordu ve kopyaladığı bağlantı
  60 saniye sonra ölüyordu. İndirme artık /indir/<doküman kimliği> ucundan
  geçiyor; yetki kontrolü ve imzalı adres orada, sunucuda kalıyor.
*/
