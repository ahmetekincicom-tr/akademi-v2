"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type HakkimizdaInput = {
  heroEtiket: string;
  heroBaslik: string;
  heroVurgu: string;
  heroMetin: string;
  kisiEtiket: string;
  kisiBaslik: string;
  kisiUnvan: string;
  kisiMetin: string;
  akademiEtiket: string;
  akademiBaslik: string;
  akademiMetin: string;
};

/** Boş string yerine null yazıyoruz; okuma tarafı null'ı varsayılana çeviriyor. */
const bos = (s: string) => s.trim() || null;

type Sonuc = { error?: string };

async function yaz(alanlar: Record<string, unknown>): Promise<Sonuc> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hakkimizda_icerik")
    .update({ ...alanlar, updated_at: new Date().toISOString() })
    .eq("id", true)
    .select("id");

  if (error) return { error: error.message };
  // RLS engellediğinde hata değil sıfır satır döner.
  if (!data || data.length === 0) {
    return { error: "Kaydedilemedi. Yönetici yetkisi doğrulanamadı (RLS)." };
  }

  revalidatePath("/hakkimizda");
  revalidatePath("/kontrol-9f4x2k/hakkimizda");
  return {};
}

export async function hakkimizdaKaydet(input: HakkimizdaInput): Promise<Sonuc> {
  if (!input.heroBaslik.trim()) return { error: "Hero başlığı boş olamaz." };
  if (!input.kisiBaslik.trim()) return { error: "Bölüm başlığı boş olamaz." };

  return yaz({
    hero_etiket: bos(input.heroEtiket),
    hero_baslik: input.heroBaslik.trim(),
    // Vurgu bilerek boş bırakılabiliyor.
    hero_vurgu: input.heroVurgu.trim(),
    hero_metin: bos(input.heroMetin),
    kisi_etiket: bos(input.kisiEtiket),
    kisi_baslik: input.kisiBaslik.trim(),
    kisi_unvan: input.kisiUnvan.trim(),
    kisi_metin: bos(input.kisiMetin),
    akademi_etiket: bos(input.akademiEtiket),
    akademi_baslik: bos(input.akademiBaslik),
    akademi_metin: bos(input.akademiMetin),
  });
}

/**
 * Fotoğrafı değiştirir. Yükleme istemcide yapıldı; burada yalnızca sütun
 * güncelleniyor ve eski dosya kovadan siliniyor — aksi halde her değişimde
 * kullanılmayan bir dosya birikirdi.
 */
export async function hakkimizdaGorselGuncelle(yol: string | null): Promise<Sonuc> {
  const supabase = await createClient();
  const { data: eskiSatir } = await supabase
    .from("hakkimizda_icerik")
    .select("kisi_gorsel")
    .eq("id", true)
    .maybeSingle();

  const sonuc = await yaz({ kisi_gorsel: yol });
  if (sonuc.error) return sonuc;

  const eski = eskiSatir?.kisi_gorsel as string | null | undefined;
  if (eski && eski !== yol) {
    await supabase.storage.from("kapaklar").remove([eski]);
  }
  return {};
}
