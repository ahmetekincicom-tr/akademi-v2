import { createPublicClient } from "@/lib/supabase/public";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/tipler";
import { depoUrl } from "@/lib/depo";

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

/** Referans logosu — kendi alan adımızdan (bkz. lib/depo.ts). */
export function logoUrl(yol: string | null): string | null {
  return depoUrl("logolar", yol);
}

export async function getYorumlar(client?: SupabaseClient<Database>): Promise<Yorum[]> {
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

export async function getReferanslar(client?: SupabaseClient<Database>): Promise<Referans[]> {
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
