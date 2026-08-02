import { createClient } from "@/lib/supabase/server";

export type EgitimOturumu = {
  id: string;
  baslangic: string;
  sureDk: number;
  konu: string;
  toplantiLink: string;
  kayitLink: string;
  durum: "planlandi" | "tamamlandi" | "iptal";
  program: string;
};

/**
 * Birebir eğitimin takvimi. Eğitim bittikten sonra kullanılan görüşme
 * hakları için seanslar tablosuna bak — ikisi bilerek ayrı.
 *
 * RLS satırları öğrencinin kendisiyle sınırlıyor, ayrıca süzmeye gerek yok.
 */
export async function getEgitimOturumlarim(): Promise<EgitimOturumu[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("egitim_oturumlari")
    .select("id, baslangic, sure_dk, konu, toplanti_link, kayit_link, durum, courses(baslik)")
    .order("baslangic", { ascending: true });

  return (data ?? []).map((o) => ({
    id: o.id,
    baslangic: o.baslangic,
    sureDk: o.sure_dk,
    konu: o.konu ?? "",
    toplantiLink: o.toplanti_link ?? "",
    kayitLink: o.kayit_link ?? "",
    durum: o.durum as EgitimOturumu["durum"],
    program: (o.courses as unknown as { baslik: string } | null)?.baslik ?? "Genel",
  }));
}

/** Karşılama adımı için: eğitim takvimi kurulmuş mu? */
export async function egitimPlanlandiMi(): Promise<boolean> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("egitim_oturumlari")
    .select("id", { count: "exact", head: true })
    .in("durum", ["planlandi", "tamamlandi"]);
  return (count ?? 0) > 0;
}
