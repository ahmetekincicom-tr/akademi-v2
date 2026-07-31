import { createPublicClient } from "@/lib/supabase/public";
import type { SupabaseClient } from "@supabase/supabase-js";

export type Yorum = {
  id: string;
  metin: string;
  isim: string;
  rol: string;
  courseId: string | null;
  sira: number;
  yayinda: boolean;
};

export type Referans = {
  id: string;
  ad: string;
  sektor: string;
  logoUrl: string | null;
  siteUrl: string;
  sira: number;
  yayinda: boolean;
};

/** Public bucket, so the path maps straight to a stable CDN URL. */
export function logoUrl(yol: string | null): string | null {
  if (!yol) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logolar/${yol}`;
}

export async function getYorumlar(client?: SupabaseClient): Promise<Yorum[]> {
  const supabase = client ?? createPublicClient();
  const { data } = await supabase
    .from("yorumlar")
    .select("id, metin, isim, rol, course_id, sira, yayinda")
    .order("sira", { ascending: true })
    .order("created_at", { ascending: true });

  return (data ?? []).map((y) => ({
    id: y.id,
    metin: y.metin,
    isim: y.isim,
    rol: y.rol ?? "",
    courseId: y.course_id,
    sira: y.sira,
    yayinda: y.yayinda,
  }));
}

export async function getReferanslar(client?: SupabaseClient): Promise<Referans[]> {
  const supabase = client ?? createPublicClient();
  const { data } = await supabase
    .from("referanslar")
    .select("id, ad, sektor, logo_yolu, site_url, sira, yayinda")
    .order("sira", { ascending: true })
    .order("created_at", { ascending: true });

  return (data ?? []).map((r) => ({
    id: r.id,
    ad: r.ad,
    sektor: r.sektor ?? "",
    logoUrl: logoUrl(r.logo_yolu),
    siteUrl: r.site_url ?? "",
    sira: r.sira,
    yayinda: r.yayinda,
  }));
}
