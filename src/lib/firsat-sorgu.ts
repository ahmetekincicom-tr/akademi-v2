import "server-only";

import { createClient } from "@/lib/supabase/server";
import { depoUrl } from "@/lib/depo";
import type { Database } from "@/lib/supabase/tipler";
import type { BasvuruTipi, CalismaModeli, CalismaTipi, Ilan, IlanDurum, Seviye } from "@/lib/firsat";

type Satir = Database["public"]["Tables"]["is_ilanlari"]["Row"];

const SUTUNLAR =
  "id, pozisyon, sirket_adi, sirket_logo, sirket_web, kategori, calisma_tipi, calisma_modeli, sehir, seviye, aciklama, sorumluluklar, aranan_ozellikler, tercihen_ozellikler, ucret, basvuru_tipi, basvuru_adresi, son_basvuru, durum, one_cikan, yayin_tarihi, updated_at";

function cevir(s: Satir): Ilan {
  return {
    id: s.id,
    pozisyon: s.pozisyon,
    sirketAdi: s.sirket_adi,
    // Logo "logolar" kovasında; kendi alan adımızdan (/dosya/logolar/…).
    sirketLogo: depoUrl("logolar", s.sirket_logo),
    sirketWeb: s.sirket_web,
    kategori: s.kategori,
    calismaTipi: s.calisma_tipi as CalismaTipi,
    calismaModeli: s.calisma_modeli as CalismaModeli,
    sehir: s.sehir,
    seviye: s.seviye as Seviye,
    aciklama: s.aciklama,
    sorumluluklar: s.sorumluluklar ?? [],
    arananOzellikler: s.aranan_ozellikler ?? [],
    tercihenOzellikler: s.tercihen_ozellikler ?? [],
    ucret: s.ucret,
    basvuruTipi: s.basvuru_tipi as BasvuruTipi,
    basvuruAdresi: s.basvuru_adresi,
    sonBasvuru: s.son_basvuru,
    durum: s.durum as IlanDurum,
    oneCikan: s.one_cikan,
    yayinTarihi: s.yayin_tarihi,
    guncelleme: s.updated_at,
  };
}

/**
 * Öğrencinin gördüğü ilanlar: yalnız yayında + süresi dolmuş işaretliler
 * (taslak/arşiv hiç gelmiyor). Süzgeç RLS'e ek olarak burada da açıkça
 * yazılı — yönetici kendi panelinden baktığında RLS ona taslakları da
 * verirdi (bkz. lib/panel-kapsam.ts).
 */
export async function getPanelIlanlari(): Promise<{ ilanlar: Ilan[]; kaydedilenler: string[] }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ilanlar: [], kaydedilenler: [] };

  const [{ data: satirlar }, { data: kayitlar }] = await Promise.all([
    supabase
      .from("is_ilanlari")
      .select(SUTUNLAR)
      .in("durum", ["yayinda", "sona_erdi"])
      .order("one_cikan", { ascending: false })
      .order("yayin_tarihi", { ascending: false }),
    supabase.from("is_ilani_kayitlar").select("ilan_id").eq("user_id", user.id),
  ]);

  return {
    ilanlar: ((satirlar ?? []) as Satir[]).map(cevir),
    kaydedilenler: (kayitlar ?? []).map((k) => k.ilan_id),
  };
}

/** Tek ilan (öğrenci). Taslak/arşiv için null → sayfa 404. */
export async function getPanelIlani(id: string): Promise<{ ilan: Ilan; kayitli: boolean } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: satir }, { data: kayit }] = await Promise.all([
    supabase.from("is_ilanlari").select(SUTUNLAR).eq("id", id).in("durum", ["yayinda", "sona_erdi"]).maybeSingle(),
    supabase.from("is_ilani_kayitlar").select("ilan_id").eq("user_id", user.id).eq("ilan_id", id).maybeSingle(),
  ]);
  if (!satir) return null;
  return { ilan: cevir(satir as Satir), kayitli: Boolean(kayit) };
}

export type IlanMetrik = { goruntulenme: number; basvuruTiklama: number; kayit: number };
export type YonetimIlani = Ilan & { hamLogo: string | null; metrik: IlanMetrik };

/** Yönetim: bütün durumlar + ilan başına sayılar. */
export async function getTumIlanlar(): Promise<YonetimIlani[]> {
  const supabase = await createClient();
  const [{ data: satirlar }, { data: metrikler }] = await Promise.all([
    supabase.from("is_ilanlari").select(SUTUNLAR).order("updated_at", { ascending: false }),
    supabase.from("is_ilani_metrikleri").select("ilan_id, goruntulenme, basvuru_tiklama, kayit"),
  ]);
  const harita = new Map((metrikler ?? []).map((m) => [m.ilan_id, m]));
  return ((satirlar ?? []) as Satir[]).map((s) => {
    const m = harita.get(s.id);
    return {
      ...cevir(s),
      hamLogo: s.sirket_logo,
      metrik: { goruntulenme: m?.goruntulenme ?? 0, basvuruTiklama: m?.basvuru_tiklama ?? 0, kayit: m?.kayit ?? 0 },
    };
  });
}

/** Yönetim: düzenlenecek ilan (her durumda). */
export async function getYonetimIlani(id: string): Promise<YonetimIlani | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data: s } = await supabase.from("is_ilanlari").select(SUTUNLAR).eq("id", id).maybeSingle();
  if (!s) return null;
  const { data: m } = await supabase
    .from("is_ilani_metrikleri")
    .select("goruntulenme, basvuru_tiklama, kayit")
    .eq("ilan_id", id)
    .maybeSingle();
  return {
    ...cevir(s as Satir),
    hamLogo: (s as Satir).sirket_logo,
    metrik: { goruntulenme: m?.goruntulenme ?? 0, basvuruTiklama: m?.basvuru_tiklama ?? 0, kayit: m?.kayit ?? 0 },
  };
}
