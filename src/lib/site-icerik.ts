import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { kapakUrl } from "@/lib/kapak";

export type DuyuruStili = "acik" | "koyu";

export type SiteIcerik = {
  kayitDuyurusu: string;
  kayitDuyurusuAktif: boolean;
  duyuruStili: DuyuruStili;
  egitmenAd: string;
  egitmenUnvan: string;
  egitmenBiyografi: string;
  /** Portre görselinin tam adresi; yüklenmemişse null. */
  egitmenGorsel: string | null;
  /** Eğitim hero'sunda başlığın üstündeki güven rozeti. */
  rozetMetni: string;
  rozetAktif: boolean;
};

const VARSAYILAN: SiteIcerik = {
  kayitDuyurusu: "",
  kayitDuyurusuAktif: false,
  duyuruStili: "acik",
  egitmenAd: "Ahmet Ekinci",
  egitmenUnvan: "Dijital pazarlama eğitmeni · Ankara",
  egitmenBiyografi: "",
  egitmenGorsel: null,
  rozetMetni: "",
  rozetAktif: false,
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
    .select("kayit_duyurusu, kayit_duyurusu_aktif, duyuru_stili, egitmen_ad, egitmen_unvan, egitmen_biyografi, egitmen_gorsel, rozet_metni, rozet_aktif")
    .maybeSingle();

  if (error) {
    console.error("[site-icerik] okunamadı:", error.message);
    return VARSAYILAN;
  }
  if (!data) return VARSAYILAN;

  return {
    kayitDuyurusu: data.kayit_duyurusu ?? "",
    kayitDuyurusuAktif: data.kayit_duyurusu_aktif ?? false,
    duyuruStili: data.duyuru_stili === "koyu" ? "koyu" : "acik",
    egitmenAd: data.egitmen_ad || VARSAYILAN.egitmenAd,
    egitmenUnvan: data.egitmen_unvan || VARSAYILAN.egitmenUnvan,
    egitmenBiyografi: data.egitmen_biyografi ?? "",
    egitmenGorsel: kapakUrl(data.egitmen_gorsel),
    rozetMetni: data.rozet_metni ?? "",
    rozetAktif: data.rozet_aktif ?? false,
  };
});
