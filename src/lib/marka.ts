import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createPublicClient } from "@/lib/supabase/public";

export type Marka = {
  logoKoyuZemin: string | null;
  logoAcikZemin: string | null;
  favicon: string | null;
  /** Başlıktaki logo yüksekliği (piksel); diğer yerler bundan oranlanıyor. */
  logoYuksekligi: number;
};

/**
 * Varsayılan logo yüksekliği.
 *
 * 40 piksel: yaygın kurumsal sitelerin başlık logoları 32-48 arasında duruyor
 * ve 74 piksellik başlık şeridinde altta üstte yeterli boşluk bırakıyor.
 * Önceki 36 bunun alt sınırındaydı, kenar payı olan bir dosyada küçük
 * görünmesinin sebebi buydu.
 */
export const VARSAYILAN_LOGO_YUKSEKLIGI = 40;
export const LOGO_YUKSEKLIK_ALT = 24;
export const LOGO_YUKSEKLIK_UST = 72;

/** Panelden gelen değer bozuk ya da aralık dışıysa tasarımı bozmasın. */
export function logoYuksekligiDuzelt(deger: unknown): number {
  const sayi = Number(deger);
  if (!Number.isFinite(sayi)) return VARSAYILAN_LOGO_YUKSEKLIGI;
  return Math.min(LOGO_YUKSEKLIK_UST, Math.max(LOGO_YUKSEKLIK_ALT, Math.round(sayi)));
}

/** Public bucket, so the stored path maps straight to a CDN URL. */
export function markaUrl(yol: string | null): string | null {
  if (!yol) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/marka/${yol}`;
}

const BOS: Marka = {
  logoKoyuZemin: null,
  logoAcikZemin: null,
  favicon: null,
  logoYuksekligi: VARSAYILAN_LOGO_YUKSEKLIGI,
};

/**
 * cache() dedupes this within a single render — the header, the footer and the
 * root layout all ask for the brand, and one query per request is enough.
 */
export const getMarka = cache(async (client?: SupabaseClient): Promise<Marka> => {
  const supabase = client ?? createPublicClient();
  const { data, error } = await supabase
    .from("marka")
    /*
      Kolonlar tek tek sayılmıyor, bilerek.

      PostgREST var olmayan bir kolon istendiğinde tüm sorguyu reddediyor.
      logo_yuksekligi yeni bir kolon; migration uygulanmadan bir dağıtım
      yapılırsa liste hâlinde istemek yalnızca o alanı değil LOGOYU DA
      düşürürdü ve site bütün sayfalarda yedek işarete dönerdi. Tek satırlık
      bir ayar tablosunda "*" maliyetsiz.
    */
    .select("*")
    .maybeSingle();

  if (error) {
    // Branding must never take the site down; fall back to the built-in mark.
    console.error("[marka] okunamadı:", error.message);
    return BOS;
  }
  if (!data) return BOS;

  return {
    logoKoyuZemin: markaUrl(data.logo_koyu_zemin),
    logoAcikZemin: markaUrl(data.logo_acik_zemin),
    favicon: markaUrl(data.favicon),
    logoYuksekligi: logoYuksekligiDuzelt(data.logo_yuksekligi),
  };
});

/** Raw storage paths — the admin screen needs these to delete old files. */
export async function getMarkaYollari(client: SupabaseClient) {
  const { data } = await client
    .from("marka")
    .select("logo_koyu_zemin, logo_acik_zemin, favicon")
    .maybeSingle();

  return {
    logoKoyuZemin: data?.logo_koyu_zemin ?? null,
    logoAcikZemin: data?.logo_acik_zemin ?? null,
    favicon: data?.favicon ?? null,
  };
}
