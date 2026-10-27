import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/tipler";
import { createPublicClient } from "@/lib/supabase/public";
import { kapakUrl } from "@/lib/kapak";
import { getCourses } from "@/lib/courses";
import { etiketleriTopla, etiketliMi, type EtiketOzeti } from "@/lib/blog-etiket";

/**
 * Blog yazıları veri katmanı.
 *
 * Herkese açık taraf anon anahtarıyla yalnızca YAYINDAKİ yazıları görebiliyor
 * (RLS: durum='yayin' or is_admin()); yönetim tarafı oturumlu istemciyle
 * taslaklar dahil hepsini görüyor. Kural veritabanında (RLS), kod taslağı
 * yanlışlıkla sızdıramaz.
 */

/** zamanli: yayın saati gelince zamanlayıcının kendiliğinden yayına aldığı yazı. */
export type YaziDurum = "taslak" | "yayin" | "zamanli";

function durumCoz(d: string): YaziDurum {
  return d === "yayin" || d === "zamanli" ? d : "taslak";
}

export type Kategori = {
  id: string;
  slug: string;
  ad: string;
  /** Arşiv sayfasının giriş metni ve meta açıklaması. Yazıya gömülü kategoride yok. */
  aciklama?: string;
};

/** Liste kartı için yeterli alanlar (içerik gövdesi olmadan). */
export type YaziOzet = {
  id: string;
  slug: string;
  baslik: string;
  ozet: string;
  kapak: string | null;
  durum: YaziDurum;
  yayinTarihi: string | null;
  /** Zamanlı yazının yayına gireceği an (yalnız durum "zamanli" iken). */
  zamanlananTarih: string | null;
  yazar: string;
  /** Teknik son kayıt (updated_at) — sıralama/yönetim için. */
  guncelleme: string;
  /**
   * İçeriğin gerçekten güncellendiği an; teknik updated_at'ten AYRI. null =
   * yayından beri içerik güncellenmedi. dateModified ve UI bunu kullanır.
   */
  icerikGuncelleme: string | null;
  kategori: Kategori | null;
  etiketler: string[];
  /** Görselsiz kapağın yazıya özel rengi/simgesi; boşsa kategorininki (lib/blog-kapak). */
  kapakTon: string | null;
  kapakSimge: string | null;
};

/** Tek yazının tamamı (düzenleme ve detay sayfası için). */
export type Yazi = YaziOzet & {
  icerikHtml: string;
  icerikJson: unknown;
  kapakYol: string | null;
  kategoriId: string | null;
  seoBaslik: string;
  seoAciklama: string;
  /** Bir kez bile yayınlandı mı? Adresi Google'da olabilir (yönlendirme kararı). */
  hicYayinlandi: boolean;
  /** Editördeki SEO analizinin odak kelimesi (yalnız panelde kullanılıyor). */
  odakKelime: string;
  /** Kapak görselinin alt metni; boşsa yazı başlığı. */
  kapakAlt: string;
};

type Db = SupabaseClient<Database>;

const OZET_SELECT =
  "id, slug, baslik, ozet, kapak_gorsel, durum, yayin_tarihi, zamanlanan_tarih, yazar, updated_at, icerik_guncelleme, etiketler, kapak_ton, kapak_simge, kategori:categories(id, slug, ad)";
const TAM_SELECT = `${OZET_SELECT}, icerik_html, icerik_json, seo_baslik, seo_aciklama, kategori_id, hic_yayinlandi, odak_kelime, kapak_alt`;

type KategoriGomulu = { id: string; slug: string; ad: string } | null;

type OzetSatir = {
  id: string;
  slug: string;
  baslik: string;
  ozet: string;
  kapak_gorsel: string | null;
  durum: string;
  yayin_tarihi: string | null;
  zamanlanan_tarih: string | null;
  yazar: string;
  updated_at: string;
  icerik_guncelleme: string | null;
  etiketler: string[] | null;
  kapak_ton: string | null;
  kapak_simge: string | null;
  kategori: KategoriGomulu;
};

type TamSatir = OzetSatir & {
  icerik_html: string;
  icerik_json: unknown;
  seo_baslik: string;
  seo_aciklama: string;
  kategori_id: string | null;
  hic_yayinlandi: boolean;
  odak_kelime: string | null;
  kapak_alt: string | null;
};

function ozetle(r: OzetSatir): YaziOzet {
  return {
    id: r.id,
    slug: r.slug,
    baslik: r.baslik,
    ozet: r.ozet,
    kapak: kapakUrl(r.kapak_gorsel),
    durum: durumCoz(r.durum),
    yayinTarihi: r.yayin_tarihi,
    zamanlananTarih: r.zamanlanan_tarih,
    yazar: r.yazar,
    guncelleme: r.updated_at,
    icerikGuncelleme: r.icerik_guncelleme,
    kategori: r.kategori ? { id: r.kategori.id, slug: r.kategori.slug, ad: r.kategori.ad } : null,
    etiketler: r.etiketler ?? [],
    kapakTon: r.kapak_ton,
    kapakSimge: r.kapak_simge,
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
    hicYayinlandi: r.hic_yayinlandi,
    odakKelime: r.odak_kelime ?? "",
    kapakAlt: r.kapak_alt ?? "",
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
 * İlgili yazılar: önce aynı kategoriden, eksik kalırsa en yeni diğer
 * yazılardan tamamlanıyor (kaynak sistemle aynı kural). Kategorisi tek
 * yazılık bir yazının sonu boş kalmasın; okuyan bir sonraki yazıyı bulsun.
 */
export async function ilgiliYazilar(
  yaziId: string,
  kategoriId: string | null,
  adet = 3,
  client?: Db,
): Promise<YaziOzet[]> {
  const digerleri = (await getYayindakiYazilar(client)).filter((y) => y.id !== yaziId);
  const ayni = kategoriId ? digerleri.filter((y) => y.kategori?.id === kategoriId) : [];
  const kalan = digerleri.filter((y) => !ayni.includes(y));
  return [...ayni, ...kalan].slice(0, adet);
}

/** Bir etiketin yazıları (etiket adresi metinden türetiliyor: lib/blog-etiket). */
export async function getYazilarByEtiket(etiketSlugu: string, client?: Db): Promise<YaziOzet[]> {
  return (await getYayindakiYazilar(client)).filter((y) => etiketliMi(y, etiketSlugu));
}

/** Yayındaki yazılarda geçen etiketler, çok yazılı olan önde. */
export async function getEtiketler(client?: Db): Promise<EtiketOzeti[]> {
  return etiketleriTopla(await getYayindakiYazilar(client));
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
  const { data, error } = await supabase.from("categories").select("id, slug, ad, aciklama").order("sira").order("ad");
  if (error) {
    console.error("[yazilar] getKategoriler:", error.message);
    return [];
  }
  return data as Kategori[];
});

/** Kategoriler ve her birindeki yayındaki yazı sayısı (kategori çipleri). */
export async function kategorilerSayili(client?: Db): Promise<(Kategori & { adet: number })[]> {
  const [kategoriler, yazilar] = await Promise.all([getKategoriler(client), getYayindakiYazilar(client)]);
  return kategoriler.map((k) => ({ ...k, adet: yazilar.filter((y) => y.kategori?.id === k.id).length }));
}

/** Tek kategori (arşiv sayfası başlığı için). */
export async function getKategoriBySlug(slug: string, client?: Db): Promise<Kategori | null> {
  const supabase = client ?? createPublicClient();
  const { data } = await supabase.from("categories").select("id, slug, ad, aciklama").eq("slug", slug).maybeSingle();
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
  // Yazılar kökte sunuluyor: /{slug}/ (WordPress yapısı korundu).
  const yaziHedef: IcLinkHedef[] = yazilar.map((y) => ({
    grup: "Blog yazısı",
    baslik: y.baslik,
    url: `/${y.slug}/`,
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

/** Performans paneli için: özet alanlar + on-page SEO tamlığı (Supabase). */
export type PanelYazi = YaziOzet & { seoTam: boolean; hicYayinlandi: boolean };
export async function blogPanelYazilari(client: Db): Promise<PanelYazi[]> {
  const { data, error } = await client
    .from("posts")
    .select(`${OZET_SELECT}, seo_baslik, seo_aciklama, hic_yayinlandi`)
    .order("updated_at", { ascending: false });
  if (error) {
    console.error("[yazilar] blogPanelYazilari:", error.message);
    return [];
  }
  type Satir = OzetSatir & { seo_baslik: string | null; seo_aciklama: string | null; hic_yayinlandi: boolean | null };
  return (data as unknown as Satir[]).map((r) => ({
    ...ozetle(r),
    hicYayinlandi: Boolean(r.hic_yayinlandi),
    // On-page SEO: başlık ve açıklama dolu mu (arama sıralamaları Faz 2 / Search Console).
    seoTam: Boolean((r.seo_baslik ?? "").trim() && (r.seo_aciklama ?? "").trim()),
  }));
}

/**
 * Editörün SEO kartı ve etiket önerisi için diğer yazıların kısa hâli:
 * aynı odak kelimeyi kullanan yazı uyarısı ve var olan etiketler. Yazı sayısı
 * küçük (onlarca); hepsi tek seferde geliyor, karşılaştırma tarayıcıda.
 */
export type YaziSeoOzeti = { id: string; slug: string; baslik: string; odakKelime: string; etiketler: string[] };
export async function yaziSeoOzetleri(client: Db): Promise<YaziSeoOzeti[]> {
  const { data, error } = await client.from("posts").select("id, slug, baslik, odak_kelime, etiketler");
  if (error) {
    console.error("[yazilar] yaziSeoOzetleri:", error.message);
    return [];
  }
  return (data ?? []).map((r) => ({
    id: r.id,
    slug: r.slug,
    baslik: r.baslik,
    odakKelime: r.odak_kelime ?? "",
    etiketler: r.etiketler ?? [],
  }));
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
