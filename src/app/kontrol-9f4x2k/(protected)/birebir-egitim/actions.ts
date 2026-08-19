"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { trSaatiniUtcYap } from "@/lib/zaman";
import { guvenliUrl } from "@/lib/guvenli-url";
import { veriHatasi } from "@/lib/auth-hatalari";

export async function oturumEkle(input: {
  userId: string;
  courseId: string;
  baslangic: string;
  sureDk: string;
  konu: string;
  toplantiLink: string;
  /** Eğitim sonrası Drive klasörü ya da video. Baştan verilebiliyor: kayıt
   *  elde hazırken önce oturumu kaydedip sonra geri dönmek gereksiz adım. */
  kayitLink?: string;
}) {
  if (!input.userId) return { error: "Öğrenci seçmelisin." };
  if (!input.baslangic) return { error: "Tarih ve saat gir." };

  // Formdaki saat Türkiye saati. Sunucu UTC çalıştığı için new Date() ile
  // çevirmek saati olduğu gibi UTC sanıyor ve kayıt 3 saat ileri kalıyordu.
  const baslangicUtc = trSaatiniUtcYap(input.baslangic);
  if (!baslangicUtc) return { error: "Tarih ve saat okunamadı." };

  const sure = Number(input.sureDk) || 60;

  const supabase = await createClient();
  const { error } = await supabase.from("egitim_oturumlari").insert({
    user_id: input.userId,
    course_id: input.courseId || null,
    baslangic: baslangicUtc,
    sure_dk: sure,
    konu: input.konu.trim() || null,
    toplanti_link: input.toplantiLink.trim() || null,
    kayit_link: input.kayitLink?.trim() || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/kontrol-9f4x2k/birebir-egitim");
  revalidatePath("/kontrol-9f4x2k/ogrenciler");
  revalidatePath("/panel/birebir-egitim");
  return {};
}

export async function oturumDurumDegistir(id: string, durum: "planlandi" | "tamamlandi" | "iptal") {
  const supabase = await createClient();
  const { error } = await supabase.from("egitim_oturumlari").update({ durum }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/kontrol-9f4x2k/birebir-egitim");
  revalidatePath("/kontrol-9f4x2k/ogrenciler");
  revalidatePath("/panel/birebir-egitim");
  return {};
}

/**
 * Seansın kişiye özel kaydı (Drive vb.). Boş gönderilirse bağlantı kaldırılır.
 * Biçim doğrulaması panelde değil oynatma tarafında yapılıyor; buraya
 * yapıştırılan her şey guvenliUrl ve videoGomme süzgecinden geçiyor.
 */
export async function oturumKayitLinki(id: string, link: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("egitim_oturumlari")
    .update({ kayit_link: link.trim() || null })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/kontrol-9f4x2k/birebir-egitim");
  revalidatePath("/kontrol-9f4x2k/ogrenciler");
  revalidatePath("/panel/birebir-egitim");
  return {};
}

/* ------------------------------------------------------- kayıt arşivi --- */

/**
 * Katılımcının kayıt klasörü. Oturuma değil kişiye bağlı: aynı Drive
 * klasörünü her derse tek tek yapıştırmak gerekmesin, klasöre yeni kayıt
 * eklendiğinde panelde bir şey değiştirmek gerekmesin.
 */
export async function arsivEkle(input: {
  userId: string;
  link: string;
  baslik?: string;
  aciklama?: string;
  courseId?: string;
}) {
  if (!input.userId) return { error: "Öğrenci seçmelisin." };

  // Bağlantı burada da süzülüyor. Panelde ayrıca guvenliUrl'den geçiyor ama
  // geçersiz bir değeri hiç kaydetmemek, sonra "neden görünmüyor" diye
  // aramaktan iyi.
  const link = guvenliUrl(input.link);
  if (!link) return { error: "Geçerli bir bağlantı gir (https://…)." };

  const supabase = await createClient();
  const { error } = await supabase.from("egitim_kayit_arsivi").insert({
    user_id: input.userId,
    course_id: input.courseId || null,
    baslik: input.baslik?.trim() || null,
    aciklama: input.aciklama?.trim() || null,
    link,
  });

  if (error) return { error: veriHatasi(error) };
  arsivTazele();
  return {};
}

export async function arsivGuncelle(id: string, input: { link: string; baslik?: string; aciklama?: string }) {
  const link = guvenliUrl(input.link);
  if (!link) return { error: "Geçerli bir bağlantı gir (https://…)." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("egitim_kayit_arsivi")
    .update({
      link,
      baslik: input.baslik?.trim() || null,
      aciklama: input.aciklama?.trim() || null,
    })
    .eq("id", id);

  if (error) return { error: veriHatasi(error) };
  arsivTazele();
  return {};
}

export async function arsivSil(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("egitim_kayit_arsivi").delete().eq("id", id);
  if (error) return { error: veriHatasi(error) };
  arsivTazele();
  return {};
}

function arsivTazele() {
  revalidatePath("/kontrol-9f4x2k/ogrenciler");
  revalidatePath("/panel/birebir-egitim");
}

export async function oturumSil(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("egitim_oturumlari").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/kontrol-9f4x2k/birebir-egitim");
  revalidatePath("/kontrol-9f4x2k/ogrenciler");
  revalidatePath("/panel/birebir-egitim");
  return {};
}
