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

export type KayitArsivi = {
  id: string;
  baslik: string;
  link: string;
  aciklama: string;
  program: string;
};

/**
 * Katılımcıya paylaşılan ders kaydı klasörleri.
 *
 * Takvimden ayrı duruyor: kayıtlar tek bir Drive klasöründe toplanıyor ve o
 * klasörün adresini her oturuma tek tek yapıştırmak gerekiyordu. Klasöre yeni
 * kayıt eklendiğinde panelde değişen bir şey de olmuyordu. Arşiv artık kişiye
 * bağlı, oturuma değil.
 *
 * RLS satırları kişinin kendisiyle sınırlıyor.
 */
export async function getKayitArsivim(): Promise<KayitArsivi[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("egitim_kayit_arsivi")
    .select("id, baslik, link, aciklama, courses(baslik)")
    .order("sira", { ascending: true })
    .order("created_at", { ascending: true });

  return (data ?? []).map((k) => ({
    id: k.id,
    baslik: k.baslik ?? "",
    link: k.link,
    aciklama: k.aciklama ?? "",
    program: (k.courses as unknown as { baslik: string } | null)?.baslik ?? "",
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
