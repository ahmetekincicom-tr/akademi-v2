import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/tipler";
import { createPublicClient } from "@/lib/supabase/public";
import { kapakUrl } from "@/lib/kapak";

/**
 * Blog yazıları veri katmanı.
 *
 * İki e-posta yolu gibi burada da iki okuma yolu var: herkese açık taraf anon
 * anahtarıyla yalnızca YAYINDAKİ yazıları görebiliyor (RLS: durum='yayin' or
 * is_admin()); yönetim tarafı ise oturumlu istemciyle taslaklar dahil hepsini
 * görüyor. Kural veritabanında (RLS), burada değil — kod yanlışlıkla taslağı
 * sızdıramaz.
 */

export type YaziDurum = "taslak" | "yayin";

/** Liste kartı için yeterli alanlar (içerik gövdesi olmadan). */
export type YaziOzet = {
  id: string;
  slug: string;
  baslik: string;
  ozet: string;
  /** Kapak görselinin tam adresi; yüklenmemişse null. */
  kapak: string | null;
  durum: YaziDurum;
  yayinTarihi: string | null;
  yazar: string;
  guncelleme: string;
};

/** Tek yazının tamamı (düzenleme ve detay sayfası için). */
export type Yazi = YaziOzet & {
  /** Herkese açık render için türetilmiş HTML. */
  icerikHtml: string;
  /** TipTap kaynak belgesi (kayıpsız düzenleme için). */
  icerikJson: unknown;
  /** Kapak görselinin ham depo yolu (düzenleme formunda gerekiyor). */
  kapakYol: string | null;
  seoBaslik: string;
  seoAciklama: string;
};

type Db = SupabaseClient<Database>;

const OZET_SELECT = "id, slug, baslik, ozet, kapak_gorsel, durum, yayin_tarihi, yazar, updated_at";
const TAM_SELECT = `${OZET_SELECT}, icerik_html, icerik_json, seo_baslik, seo_aciklama`;

type OzetSatir = {
  id: string;
  slug: string;
  baslik: string;
  ozet: string;
  kapak_gorsel: string | null;
  durum: string;
  yayin_tarihi: string | null;
  yazar: string;
  updated_at: string;
};

type TamSatir = OzetSatir & {
  icerik_html: string;
  icerik_json: unknown;
  seo_baslik: string;
  seo_aciklama: string;
};

function ozetle(r: OzetSatir): YaziOzet {
  return {
    id: r.id,
    slug: r.slug,
    baslik: r.baslik,
    ozet: r.ozet,
    kapak: kapakUrl(r.kapak_gorsel),
    durum: r.durum === "yayin" ? "yayin" : "taslak",
    yayinTarihi: r.yayin_tarihi,
    yazar: r.yazar,
    guncelleme: r.updated_at,
  };
}

function tamla(r: TamSatir): Yazi {
  return {
    ...ozetle(r),
    icerikHtml: r.icerik_html,
    icerikJson: r.icerik_json,
    kapakYol: r.kapak_gorsel,
    seoBaslik: r.seo_baslik,
    seoAciklama: r.seo_aciklama,
  };
}

/* ------------------------------------------------------- herkese açık --- */

/**
 * Yayındaki yazılar, yeni yayınlanan başta.
 *
 * cache(): liste hem /blog sayfasında hem site haritasında okunuyor; istek
 * başına tek sorgu.
 */
export const getYayindakiYazilar = cache(async (client?: Db): Promise<YaziOzet[]> => {
  const supabase = client ?? createPublicClient();
  const { data, error } = await supabase
    .from("posts")
    .select(OZET_SELECT)
    .eq("durum", "yayin")
    .order("yayin_tarihi", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("[yazilar] getYayindakiYazilar:", error.message);
    return [];
  }
  return (data as unknown as OzetSatir[]).map(ozetle);
});

/**
 * Tek yazı (herkese açık): anon anahtarıyla yalnızca yayındaki döner, taslak
 * için null — RLS bunu garanti ediyor, yani taslak adresi 404 veriyor.
 */
export async function getYaziBySlug(slug: string, client?: Db): Promise<Yazi | null> {
  const supabase = client ?? createPublicClient();
  const { data, error } = await supabase.from("posts").select(TAM_SELECT).eq("slug", slug).maybeSingle();
  if (error) {
    console.error("[yazilar] getYaziBySlug:", slug, error.message);
    return null;
  }
  return data ? tamla(data as unknown as TamSatir) : null;
}

/* -------------------------------------------------------------- yönetim --- */

/** Yönetim listesi: taslaklar dahil hepsi, son güncellenen başta. */
export async function tumYazilarAdmin(client: Db): Promise<YaziOzet[]> {
  const { data, error } = await client
    .from("posts")
    .select(OZET_SELECT)
    .order("updated_at", { ascending: false });
  if (error) {
    console.error("[yazilar] tumYazilarAdmin:", error.message);
    return [];
  }
  return (data as unknown as OzetSatir[]).map(ozetle);
}

/** Yönetim: tek yazının tamamı (taslak da olabilir). */
export async function yaziGetirAdmin(slug: string, client: Db): Promise<Yazi | null> {
  const { data, error } = await client.from("posts").select(TAM_SELECT).eq("slug", slug).maybeSingle();
  if (error) {
    console.error("[yazilar] yaziGetirAdmin:", slug, error.message);
    return null;
  }
  return data ? tamla(data as unknown as TamSatir) : null;
}
