import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";

export type Olcumleme = {
  ga4: string | null;
  gtm: string | null;
  adsId: string | null;
  adsEtiket: string | null;
};

const BOS: Olcumleme = { ga4: null, gtm: null, adsId: null, adsEtiket: null };

/**
 * Bu değerler satır içi script'e gömülüyor. Panele yanlışlıkla ya da kötü
 * niyetle yapıştırılan bir şey sayfaya kod olarak sızmasın diye her biri
 * beklenen biçime uyuyorsa geçiyor; uymuyorsa yok sayılıyor.
 */
const BICIMLER = {
  ga4: /^G-[A-Z0-9]{4,15}$/i,
  gtm: /^GTM-[A-Z0-9]{4,10}$/i,
  adsId: /^AW-\d{6,15}$/i,
  adsEtiket: /^[\w-]{1,40}$/,
} as const;

function gecerli(deger: string | null, alan: keyof typeof BICIMLER): string | null {
  if (!deger) return null;
  const temiz = deger.trim();
  return BICIMLER[alan].test(temiz) ? temiz : null;
}

/**
 * Tanımlayıcılar admin panelinden (Entegrasyonlar → Google) giriliyor ve
 * olcumleme_ayarlari view'ı üzerinden okunuyor. settings tablosu ziyaretçiye
 * kapalı; o view bilerek yalnızca bu dört alanı yayınlıyor.
 *
 * cache() ile istek başına tek sorgu: kök layout her sayfada soruyor.
 */
export const getOlcumleme = cache(async (): Promise<Olcumleme> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("olcumleme_ayarlari")
    .select("ga4, gtm, ads_id, ads_etiket")
    .maybeSingle();

  // Ölçümleme sitenin çalışması için gerekli değil — sorgu düşerse sayfa
  // etiketsiz açılmalı, hata vermemeli.
  if (error || !data) return BOS;

  return {
    ga4: gecerli(data.ga4, "ga4"),
    gtm: gecerli(data.gtm, "gtm"),
    adsId: gecerli(data.ads_id, "adsId"),
    adsEtiket: gecerli(data.ads_etiket, "adsEtiket"),
  };
});

/** Etiket yüklenip yüklenmeyeceğini tek yerden karara bağlar. */
export function olcumlemeAcik(o: Olcumleme): boolean {
  return Boolean(o.gtm || o.ga4);
}
