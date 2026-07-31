import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createPublicClient } from "@/lib/supabase/public";

export type Marka = {
  logoKoyuZemin: string | null;
  logoAcikZemin: string | null;
  favicon: string | null;
};

/** Public bucket, so the stored path maps straight to a CDN URL. */
export function markaUrl(yol: string | null): string | null {
  if (!yol) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/marka/${yol}`;
}

const BOS: Marka = { logoKoyuZemin: null, logoAcikZemin: null, favicon: null };

/**
 * cache() dedupes this within a single render — the header, the footer and the
 * root layout all ask for the brand, and one query per request is enough.
 */
export const getMarka = cache(async (client?: SupabaseClient): Promise<Marka> => {
  const supabase = client ?? createPublicClient();
  const { data, error } = await supabase
    .from("marka")
    .select("logo_koyu_zemin, logo_acik_zemin, favicon")
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
