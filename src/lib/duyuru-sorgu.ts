import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Duyuru, DuyuruDurum, DuyuruOnem } from "@/lib/duyuru";
import { YENI_GUN } from "@/lib/duyuru";

/**
 * Duyuru sorguları ayrı dosyada: sabitler ve tipler istemci bileşenlerinde
 * de kullanılıyor, sorgular ise sunucu istemcisine bağlı. Tek dosyada
 * durduklarında sunucu kodu tarayıcı paketine sızıyordu.
 */
function satirdan(row: Record<string, unknown>): Duyuru {
  const yayin = (row.yayin_tarihi as string) ?? null;
  const sinir = Date.now() - YENI_GUN * 24 * 60 * 60 * 1000;

  return {
    yeni: Boolean(yayin && new Date(yayin).getTime() > sinir),
    id: row.id as string,
    slug: row.slug as string,
    baslik: row.baslik as string,
    ozet: (row.ozet as string) ?? "",
    icerik: (row.icerik as string) ?? "",
    kategori: (row.kategori as string) ?? "Genel",
    onem: (row.onem as DuyuruOnem) ?? "normal",
    durum: (row.durum as DuyuruDurum) ?? "taslak",
    yayinTarihi: (row.yayin_tarihi as string) ?? null,
    bildirimTarihi: (row.bildirim_gonderildi_tarihi as string) ?? null,
  };
}

const ALANLAR =
  "id, slug, baslik, ozet, icerik, kategori, onem, durum, yayin_tarihi, bildirim_gonderildi_tarihi";

/** Öğrenciye görünen liste. RLS taslakları zaten süzüyor. */
export async function getYayindakiDuyurular(): Promise<Duyuru[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("duyurular")
    .select(ALANLAR)
    .eq("durum", "yayinda")
    .order("yayin_tarihi", { ascending: false, nullsFirst: false })
    .limit(60);

  return (data ?? []).map(satirdan);
}

export async function getDuyuru(slug: string): Promise<Duyuru | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("duyurular").select(ALANLAR).eq("slug", slug).maybeSingle();
  return data ? satirdan(data) : null;
}

/** Yönetim listesi: taslaklar dahil, en yeni önce. */
export async function getTumDuyurular(): Promise<Duyuru[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("duyurular")
    .select(ALANLAR)
    .order("created_at", { ascending: false });

  return (data ?? []).map(satirdan);
}
