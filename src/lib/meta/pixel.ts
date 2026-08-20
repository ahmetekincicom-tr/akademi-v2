import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Tarayıcıya basılacak Pixel ID.
 *
 * settings tablosu ziyaretçiye kapalı — içinde CAPI token'ı var. Bu yüzden
 * okuma meta_pixel_ayari görünümünden: o görünüm settings.meta satırından
 * YALNIZCA pixel ID'yi yayınlıyor. Token hiçbir koşulda tarayıcıya gitmiyor.
 *
 * cache() ile istek başına tek sorgu; kök düzen her sayfada soruyor.
 */

/**
 * Biçim doğrulaması: bu değer satır içi script'e gömülüyor.
 *
 * Panele yanlışlıkla ya da kötü niyetle yapıştırılan bir şey sayfaya kod
 * olarak sızmasın — olcumleme.ts'teki kuralın aynısı.
 */
const BICIM = /^\d{10,20}$/;

export const getPixelId = cache(async (): Promise<string | null> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("meta_pixel_ayari").select("pixel_id").maybeSingle();

  // Ölçümleme sitenin çalışması için gerekli değil: sorgu düşerse sayfa
  // etiketsiz açılmalı, hata vermemeli.
  if (error || !data?.pixel_id) return null;

  const temiz = data.pixel_id.trim();
  return BICIM.test(temiz) ? temiz : null;
});
