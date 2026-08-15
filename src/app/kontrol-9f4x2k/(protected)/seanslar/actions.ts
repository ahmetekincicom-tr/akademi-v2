"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { trSaatiniUtcYap } from "@/lib/zaman";

export async function seansEkle(input: {
  userId: string;
  courseId: string;
  baslangic: string;
  sureDk: string;
  konu: string;
  toplantiLink: string;
}) {
  if (!input.userId) return { error: "Öğrenci seçmelisin." };
  if (!input.baslangic) return { error: "Tarih ve saat gir." };

  // Formdaki saat Türkiye saati. Sunucu UTC çalıştığı için new Date() ile
  // çevirmek saati olduğu gibi UTC sanıyor ve kayıt 3 saat ileri kalıyordu.
  const baslangicUtc = trSaatiniUtcYap(input.baslangic);
  if (!baslangicUtc) return { error: "Tarih ve saat okunamadı." };

  const sure = Number(input.sureDk) || 60;

  const supabase = await createClient();
  const { error } = await supabase.from("seanslar").insert({
    user_id: input.userId,
    course_id: input.courseId || null,
    baslangic: baslangicUtc,
    sure_dk: sure,
    konu: input.konu.trim() || null,
    toplanti_link: input.toplantiLink.trim() || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/kontrol-9f4x2k/seanslar");
  revalidatePath("/panel/seanslar");
  return {};
}

export async function seansDurumDegistir(id: string, durum: "planlandi" | "tamamlandi" | "iptal") {
  const supabase = await createClient();
  const { error } = await supabase.from("seanslar").update({ durum }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/kontrol-9f4x2k/seanslar");
  revalidatePath("/panel/seanslar");
  return {};
}

/**
 * Seansın kişiye özel kaydı (Drive vb.). Boş gönderilirse bağlantı kaldırılır.
 * Biçim doğrulaması panelde değil oynatma tarafında yapılıyor; buraya
 * yapıştırılan her şey guvenliUrl ve videoGomme süzgecinden geçiyor.
 */
export async function seansKayitLinki(id: string, link: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("seanslar")
    .update({ kayit_link: link.trim() || null })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/kontrol-9f4x2k/seanslar");
  revalidatePath("/panel/seanslar");
  return {};
}

export async function seansSil(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("seanslar").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/kontrol-9f4x2k/seanslar");
  revalidatePath("/panel/seanslar");
  return {};
}
