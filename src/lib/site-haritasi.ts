import { createPublicClient } from "@/lib/supabase/public";
import { KURUMSAL_AYAR_ANAHTARI } from "@/lib/kurumsal";

/**
 * Site haritasındaki lastmod tarihleri.
 *
 * Kural: her adres, gösterdiği içeriğin GERÇEK son değişikliğini taşır;
 * bilinmiyorsa hiç tarih yazılmaz. Eskiden statik sayfaların hepsine "şu an"
 * yazılıyordu: harita her istendiğinde bütün site değişmiş görünüyordu.
 * Google bu durumda lastmod'u güvenilmez sayıp tamamen yok sayıyor; yeni ya
 * da güncellenen bir yazının fark edilmesi de bu sinyale dayanıyor.
 */

type TarihGirdisi = string | Date | null | undefined;

/** Geçerli tarihlerin en geçi; hiçbiri geçerli değilse undefined (lastmod yazılmaz). */
export function enGec(...tarihler: TarihGirdisi[]): Date | undefined {
  let sonuc: number | undefined;
  for (const t of tarihler) {
    if (!t) continue;
    const ms = (t instanceof Date ? t : new Date(t)).getTime();
    if (Number.isNaN(ms)) continue;
    if (sonuc === undefined || ms > sonuc) sonuc = ms;
  }
  return sonuc === undefined ? undefined : new Date(sonuc);
}

/** Yazının içerik tarihi: gerçek içerik güncellemesi, yoksa yayın, yoksa kayıt. */
export function yaziTarihi(y: { icerikGuncelleme: string | null; yayinTarihi: string | null; guncelleme: string }): string {
  return y.icerikGuncelleme ?? y.yayinTarihi ?? y.guncelleme;
}

export type SayfaTarihleri = {
  /** Yayındaki en yeni referans. */
  referans?: Date;
  /** Yayındaki en yeni yorum. */
  yorum?: Date;
  hakkimizda?: Date;
  /** Kurumsal sayfanın SSS'si (settings → kurumsal). */
  kurumsal?: Date;
};

/*
  Referans ve yorumlarda yalnız created_at var (düzenleme tarihi tutulmuyor):
  yeni bir kayıt eklenince sayfa "değişmiş" sayılıyor, metin düzeltmesi
  sayılmıyor. Yanlış tarih yazmaktansa eksik sinyal tercih edildi.
*/
export async function sayfaTarihleri(): Promise<SayfaTarihleri> {
  const supabase = createPublicClient();
  const [referans, yorum, hakkimizda, kurumsal] = await Promise.all([
    supabase.from("referanslar").select("created_at").eq("yayinda", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("yorumlar").select("created_at").eq("yayinda", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("hakkimizda_icerik").select("updated_at").limit(1).maybeSingle(),
    supabase.from("settings").select("updated_at").eq("anahtar", KURUMSAL_AYAR_ANAHTARI).maybeSingle(),
  ]);
  for (const [ad, c] of [["referanslar", referans], ["yorumlar", yorum], ["hakkimizda", hakkimizda], ["kurumsal", kurumsal]] as const) {
    if (c.error) console.error(`[site-haritasi] ${ad} tarihi okunamadı:`, c.error.message);
  }
  return {
    referans: enGec(referans.data?.created_at),
    yorum: enGec(yorum.data?.created_at),
    hakkimizda: enGec(hakkimizda.data?.updated_at),
    kurumsal: enGec(kurumsal.data?.updated_at),
  };
}
