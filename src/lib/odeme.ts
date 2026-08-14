import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";

export type Banka = {
  unvan: string | null;
  banka: string | null;
  iban: string | null;
  aciklama: string | null;
};

/**
 * Havale bilgileri admin panelinden giriliyor (Entegrasyonlar → Banka
 * bilgileri) ve banka_ayarlari view'ı üzerinden okunuyor. settings tablosu
 * öğrenciye kapalı; view bilerek yalnızca bu dört alanı yayınlıyor.
 */
export const getBanka = cache(async (): Promise<Banka | null> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("banka_ayarlari")
    .select("unvan, banka, iban, aciklama")
    .maybeSingle();

  if (error || !data) return null;
  // Hiçbir alan doldurulmadıysa boş bir kutu göstermenin anlamı yok.
  if (!data.unvan && !data.banka && !data.iban) return null;
  return data;
});

export type OdemeSatiri = {
  id: string;
  tutar: number;
  durum: "odendi" | "bekliyor" | "iade";
  yontem: string | null;
  tarih: string;
  faturaNo: string | null;
  kurs: string | null;
  not: string | null;
  /** Panelden kartla ödenebilir mi? Yönetici kayıt bazında kapatabiliyor. */
  onlineOdeme: boolean;
};

export type Odemelerim = {
  satirlar: OdemeSatiri[];
  bekleyenTutar: number;
  bekleyenAdet: number;
};

export const paraBicimi = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
});

/**
 * RLS (payments_select_own_or_admin) satırları öğrencinin kendisiyle
 * sınırlıyor, burada ayrıca user_id süzmeye gerek yok.
 */
export async function getOdemelerim(): Promise<Odemelerim> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("id, tutar, durum, yontem, odeme_tarihi, fatura_no, admin_notu, online_odeme, courses(baslik)")
    .order("odeme_tarihi", { ascending: false });

  const satirlar: OdemeSatiri[] = (data ?? []).map((p) => ({
    id: p.id,
    tutar: Number(p.tutar),
    durum: p.durum as OdemeSatiri["durum"],
    yontem: p.yontem ?? null,
    tarih: p.odeme_tarihi,
    faturaNo: p.fatura_no ?? null,
    kurs: (p.courses as unknown as { baslik: string } | null)?.baslik ?? null,
    not: p.admin_notu ?? null,
    onlineOdeme: p.online_odeme !== false,
  }));

  const bekleyen = satirlar.filter((s) => s.durum === "bekliyor");

  return {
    satirlar,
    bekleyenTutar: bekleyen.reduce((t, s) => t + s.tutar, 0),
    bekleyenAdet: bekleyen.length,
  };
}

export type OdenecekKayit = {
  id: string;
  tutar: number;
  kurs: string | null;
  not: string | null;
  tarih: string;
};

/**
 * Ödeme onay sayfasının okuduğu tek kayıt.
 *
 * Süzgeç bilerek "bekliyor" ile sınırlı: ödenmiş ya da iade edilmiş bir kaydın
 * ödeme adresi elle yazılarak açılamasın. RLS zaten satırı sahibiyle
 * sınırlıyor, buradaki kontrol kaydın DURUMUNU koruyor.
 */
export async function getOdenecekKayit(id: string): Promise<OdenecekKayit | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("id, tutar, odeme_tarihi, admin_notu, online_odeme, courses(baslik)")
    .eq("id", id)
    .eq("durum", "bekliyor")
    .maybeSingle();

  if (!data || data.online_odeme === false) return null;

  return {
    id: data.id,
    tutar: Number(data.tutar),
    kurs: (data.courses as unknown as { baslik: string } | null)?.baslik ?? null,
    not: data.admin_notu ?? null,
    tarih: data.odeme_tarihi,
  };
}
