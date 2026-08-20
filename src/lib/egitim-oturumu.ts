import { createClient } from "@/lib/supabase/server";
import { panelKullanicisi } from "@/lib/panel-kapsam";

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
 * user_id süzgeci AÇIK: RLS "kendi satırın veya yöneticiysen hepsi" diyor ve
 * yönetici aynı zamanda bir katılımcı. Süzgeç olmadan yönetici kendi öğrenci
 * panelinde herkesin takvimini görüyordu (bkz. lib/panel-kapsam.ts).
 */
export async function getEgitimOturumlarim(): Promise<EgitimOturumu[]> {
  const kullanici = await panelKullanicisi();
  if (!kullanici) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("egitim_oturumlari")
    .select("id, baslangic, sure_dk, konu, toplanti_link, kayit_link, durum, courses(baslik)")
    .eq("user_id", kullanici)
    .order("baslangic", { ascending: true });

  return (data ?? []).map((o) => ({
    id: o.id,
    baslangic: o.baslangic,
    sureDk: o.sure_dk,
    konu: o.konu ?? "",
    toplantiLink: o.toplanti_link ?? "",
    kayitLink: o.kayit_link ?? "",
    durum: o.durum as EgitimOturumu["durum"],
    program: o.courses?.baslik ?? "Genel",
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
 * user_id süzgeci AÇIK — getEgitimOturumlarim ile aynı sebep.
 */
export async function getKayitArsivim(): Promise<KayitArsivi[]> {
  const kullanici = await panelKullanicisi();
  if (!kullanici) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("egitim_kayit_arsivi")
    .select("id, baslik, link, aciklama, courses(baslik)")
    .eq("user_id", kullanici)
    .order("sira", { ascending: true })
    .order("created_at", { ascending: true });

  return (data ?? []).map((k) => ({
    id: k.id,
    baslik: k.baslik ?? "",
    link: k.link,
    aciklama: k.aciklama ?? "",
    program: k.courses?.baslik ?? "",
  }));
}

/** Karşılama adımı için: eğitim takvimi kurulmuş mu? */
export async function egitimPlanlandiMi(): Promise<boolean> {
  const kullanici = await panelKullanicisi();
  if (!kullanici) return false;

  const supabase = await createClient();
  const { count } = await supabase
    .from("egitim_oturumlari")
    .select("id", { count: "exact", head: true })
    .eq("user_id", kullanici)
    .in("durum", ["planlandi", "tamamlandi"]);
  return (count ?? 0) > 0;
}
