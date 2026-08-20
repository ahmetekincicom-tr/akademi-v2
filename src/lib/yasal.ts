import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/tipler";
import { createPublicClient } from "@/lib/supabase/public";

export type YasalSayfa = {
  slug: string;
  baslik: string;
  ozet: string;
  icerik: string;
  guncelleme: string | null;
  sira: number;
  yayinda: boolean;
};

/** Slugs match the previous site so existing links keep resolving. */
export const YASAL_SLUGLAR = [
  "satis-sozlesmesi",
  "iptal-iade-politikasi",
  "gizlilik-politikasi",
  "kisisel-verilerin-islenmesi",
] as const;

export type YasalSlug = (typeof YASAL_SLUGLAR)[number];

function map(row: {
  slug: string;
  baslik: string;
  ozet: string | null;
  icerik: string;
  guncelleme: string | null;
  sira: number;
  yayinda: boolean;
}): YasalSayfa {
  return {
    slug: row.slug,
    baslik: row.baslik,
    ozet: row.ozet ?? "",
    icerik: row.icerik,
    guncelleme: row.guncelleme,
    sira: row.sira,
    yayinda: row.yayinda,
  };
}

export async function getYasalSayfalar(client?: SupabaseClient<Database>): Promise<YasalSayfa[]> {
  const supabase = client ?? createPublicClient();
  const { data, error } = await supabase
    .from("yasal_sayfalar")
    .select("slug, baslik, ozet, icerik, guncelleme, sira, yayinda")
    .order("sira", { ascending: true });

  if (error) {
    console.error("[yasal] getYasalSayfalar başarısız:", error.message);
    return [];
  }
  return (data ?? []).map(map);
}

export async function getYasalSayfa(slug: string, client?: SupabaseClient<Database>): Promise<YasalSayfa | null> {
  const supabase = client ?? createPublicClient();
  const { data, error } = await supabase
    .from("yasal_sayfalar")
    .select("slug, baslik, ozet, icerik, guncelleme, sira, yayinda")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[yasal] getYasalSayfa başarısız:", slug, error.message);
    return null;
  }
  return data ? map(data) : null;
}
