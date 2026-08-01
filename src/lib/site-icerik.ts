import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";

export type SiteIcerik = {
  kayitDuyurusu: string;
  kayitDuyurusuAktif: boolean;
  egitmenAd: string;
  egitmenUnvan: string;
  egitmenBiyografi: string;
};

const VARSAYILAN: SiteIcerik = {
  kayitDuyurusu: "",
  kayitDuyurusuAktif: false,
  egitmenAd: "Ahmet Ekinci",
  egitmenUnvan: "Dijital pazarlama eğitmeni · Ankara",
  egitmenBiyografi: "",
};

/**
 * Read with the anonymous key so the course page renders the same content for a
 * visitor and for a signed-in admin. cache() keeps it to one query per request
 * even when several sections ask for it.
 */
export const getSiteIcerik = cache(async (): Promise<SiteIcerik> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("site_icerik")
    .select("kayit_duyurusu, kayit_duyurusu_aktif, egitmen_ad, egitmen_unvan, egitmen_biyografi")
    .maybeSingle();

  if (error) {
    console.error("[site-icerik] okunamadı:", error.message);
    return VARSAYILAN;
  }
  if (!data) return VARSAYILAN;

  return {
    kayitDuyurusu: data.kayit_duyurusu ?? "",
    kayitDuyurusuAktif: data.kayit_duyurusu_aktif ?? false,
    egitmenAd: data.egitmen_ad || VARSAYILAN.egitmenAd,
    egitmenUnvan: data.egitmen_unvan || VARSAYILAN.egitmenUnvan,
    egitmenBiyografi: data.egitmen_biyografi ?? "",
  };
});
