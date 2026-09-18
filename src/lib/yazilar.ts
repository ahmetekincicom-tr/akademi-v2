import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/tipler";
import { createPublicClient } from "@/lib/supabase/public";
import { kapakUrl } from "@/lib/kapak";
import { getCourses } from "@/lib/courses";

/**
 * Blog yazıları veri katmanı.
 *
 * Herkese açık taraf anon anahtarıyla yalnızca YAYINDAKİ yazıları görebiliyor
 * (RLS: durum='yayin' or is_admin()); yönetim tarafı oturumlu istemciyle
 * taslaklar dahil hepsini görüyor. Kural veritabanında (RLS), kod taslağı
 * yanlışlıkla sızdıramaz.
 */

export type YaziDurum = "taslak" | "yayin";

export type Kategori = { id: string; slug: string; ad: string };

/** Liste kartı için yeterli alanlar (içerik gövdesi olmadan). */
export type YaziOzet = {
  id: string;
  slug: string;
  baslik: string;
  ozet: string;
  kapak: string | null;
  durum: YaziDurum;
  yayinTarihi: string | null;
  yazar: string;
  guncelleme: string;
  kategori: Kategori | null;
  etiketler: string[];
};

/** Tek yazının tamamı (düzenleme ve detay sayfası için). */
export type Yazi = YaziOzet & {
  icerikHtml: string;
  icerikJson: unknown;
  kapakYol: string | null;
  kategoriId: string | null;
  seoBaslik: string;
  seoAciklama: string;
};

type Db = SupabaseClient<Database>;

const OZET_SELECT =
  "id, slug, baslik, ozet, kapak_gorsel, durum, yayin_tarihi, yazar, updated_at, etiketler, kategori:categories(id, slug, ad)";
const TAM_SELECT = `${OZET_SELECT}, icerik_html, icerik_json, seo_baslik, seo_aciklama, kategori_id`;

type KategoriGomulu = { id: string; slug: string; ad: string } | null;

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
  etiketler: string[] | null;
  kategori: KategoriGomulu;
};

type TamSatir = OzetSatir & {
  icerik_html: string;
  icerik_json: unknown;
  seo_baslik: string;
  seo_aciklama: string;
  kategori_id: string | null;
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
    kategori: r.kategori ? { id: r.kategori.id, slug: r.kategori.slug, ad: r.kategori.ad } : null,
    etiketler: r.etiketler ?? [],
  };
}

function tamla(r: TamSatir): Yazi {
  return {
    ...ozetle(r),
    icerikHtml: r.icerik_html,
    icerikJson: r.icerik_json,
    kapakYol: r.kapak_gorsel,
    kategoriId: r.kategori_id,
    seoBaslik: r.seo_baslik,
    seoAciklama: r.seo_aciklama,
  };
}

/* ------------------------------------------------------- herkese açık --- */

/** Yayındaki yazılar, yeni yayınlanan başta. */
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

/** Tek yazı (herkese açık): RLS gereği yalnızca yayındaki döner, taslak null. */
export async function getYaziBySlug(slug: string, client?: Db): Promise<Yazi | null> {
  const supabase = client ?? createPublicClient();
  const { data, error } = await supabase.from("posts").select(TAM_SELECT).eq("slug", slug).maybeSingle();
  if (error) {
    console.error("[yazilar] getYaziBySlug:", slug, error.message);
    return null;
  }
  return data ? tamla(data as unknown as TamSatir) : null;
}

/**
 * İlgili yazılar: aynı kategoriden, bu yazı hariç, en yeni birkaç tanesi.
 * Kategori yoksa ya da yeterli yoksa boş dönebilir (detay sayfası bölümü
 * yalnızca dolu olduğunda basıyor).
 */
export async function ilgiliYazilar(
  yaziId: string,
  kategoriId: string | null,
  adet = 3,
  client?: Db,
): Promise<YaziOzet[]> {
  if (!kategoriId) return [];
  const supabase = client ?? createPublicClient();
  const { data, error } = await supabase
    .from("posts")
    .select(OZET_SELECT)
    .eq("durum", "yayin")
    .eq("kategori_id", kategoriId)
    .neq("id", yaziId)
    .order("yayin_tarihi", { ascending: false, nullsFirst: false })
    .limit(adet);
  if (error) {
    console.error("[yazilar] ilgiliYazilar:", error.message);
    return [];
  }
  return (data as unknown as OzetSatir[]).map(ozetle);
}

/** Bir kategorideki yayındaki yazılar. */
export async function getYazilarByKategori(kategoriSlug: string, client?: Db): Promise<YaziOzet[]> {
  const supabase = client ?? createPublicClient();
  const { data: kat } = await supabase.from("categories").select("id").eq("slug", kategoriSlug).maybeSingle();
  if (!kat) return [];
  const { data, error } = await supabase
    .from("posts")
    .select(OZET_SELECT)
    .eq("durum", "yayin")
    .eq("kategori_id", kat.id)
    .order("yayin_tarihi", { ascending: false, nullsFirst: false });
  if (error) {
    console.error("[yazilar] getYazilarByKategori:", error.message);
    return [];
  }
  return (data as unknown as OzetSatir[]).map(ozetle);
}

/** Tüm kategoriler (sıraya göre). Herkese açık okuma. */
export const getKategoriler = cache(async (client?: Db): Promise<Kategori[]> => {
  const supabase = client ?? createPublicClient();
  const { data, error } = await supabase.from("categories").select("id, slug, ad").order("sira").order("ad");
  if (error) {
    console.error("[yazilar] getKategoriler:", error.message);
    return [];
  }
  return data as Kategori[];
});

/** Tek kategori (arşiv sayfası başlığı için). */
export async function getKategoriBySlug(slug: string, client?: Db): Promise<Kategori | null> {
  const supabase = client ?? createPublicClient();
  const { data } = await supabase.from("categories").select("id, slug, ad").eq("slug", slug).maybeSingle();
  return (data as Kategori) ?? null;
}

/* ----------------------------------------------------- iç link seçici --- */

/** Editördeki "iç bağlantı" seçicisinin listelediği hedef. */
export type IcLinkHedef = { grup: string; baslik: string; url: string };

/**
 * Editörde bağlanılabilecek iç hedefler: sabit sayfalar, eğitimler ve yayındaki
 * yazılar. Adresler sondaki eğik çizgiyle (trailingSlash açık) — çizgisiz
 * yazarsa iç bağlantı bir yönlendirme sıçraması yerdi.
 */
export async function icLinkHedefleri(): Promise<IcLinkHedef[]> {
  const [egitimler, yazilar] = await Promise.all([getCourses(), getYayindakiYazilar()]);

  const sayfalar: IcLinkHedef[] = [
    { grup: "Sayfa", baslik: "Ana sayfa", url: "/" },
    { grup: "Sayfa", baslik: "Tüm eğitimler", url: "/egitimler/" },
    { grup: "Sayfa", baslik: "Kurumsal eğitim", url: "/kurumsal/" },
    { grup: "Sayfa", baslik: "Hakkımızda", url: "/hakkimizda/" },
    { grup: "Sayfa", baslik: "İletişim", url: "/iletisim/" },
    { grup: "Sayfa", baslik: "Blog", url: "/blog/" },
  ];
  const egitimHedef: IcLinkHedef[] = egitimler.map((e) => ({
    grup: "Eğitim",
    baslik: e.baslik,
    url: `/egitimler/${e.slug}/`,
  }));
  // Yazılar /blog/{slug}/ altında sunuluyor (WordPress yapısı korundu).
  const yaziHedef: IcLinkHedef[] = yazilar.map((y) => ({
    grup: "Blog yazısı",
    baslik: y.baslik,
    url: `/blog/${y.slug}/`,
  }));

  return [...sayfalar, ...egitimHedef, ...yaziHedef];
}

/* -------------------------------------------------------------- yönetim --- */

/** Yönetim listesi: taslaklar dahil hepsi, son güncellenen başta. */
export async function tumYazilarAdmin(client: Db): Promise<YaziOzet[]> {
  const { data, error } = await client.from("posts").select(OZET_SELECT).order("updated_at", { ascending: false });
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
