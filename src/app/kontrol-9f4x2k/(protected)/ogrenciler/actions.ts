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

/**
 * Seçilen birden çok öğrenciye aynı eğitimi atar.
 *
 * Tek tek `kayitEkle` çağırmak yerine tek istek: yirmi kişilik bir listede
 * yirmi gidiş-dönüş hem yavaş hem de yarısında hata alındığında ekranın neyi
 * gösterdiği belirsiz kalıyor.
 *
 * ZATEN KAYITLI OLANLAR HATA DEĞİL: aynı listede bir kısmı zaten kayıtlı
 * olabiliyor ve toplu atamanın anlamı "hepsi bu eğitime kayıtlı olsun".
 * Çakışanlar sessizce atlanıyor, kaç kişiye yazıldığı geri dönüyor.
 */
export async function kayitEkleToplu(userIds: string[], courseId: string) {
  if (!courseId) return { error: "Önce bir eğitim seç." };
  const kisiler = [...new Set(userIds)].filter(Boolean);
  if (kisiler.length === 0) return { error: "Hiç öğrenci seçilmedi." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enrollments")
    .upsert(
      kisiler.map((id) => ({ user_id: id, course_id: courseId })),
      { onConflict: "user_id,course_id", ignoreDuplicates: true },
    )
    .select("user_id");

  if (error) return { error: error.message };
  revalidatePath("/kontrol-9f4x2k/ogrenciler");
  return { eklenen: data?.length ?? 0, secilen: kisiler.length };
}
