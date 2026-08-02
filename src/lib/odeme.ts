import { createClient } from "@/lib/supabase/server";

export type OdemeSatiri = {
  id: string;
  tutar: number;
  durum: "odendi" | "bekliyor" | "iade";
  yontem: string | null;
  tarih: string;
  faturaNo: string | null;
  kurs: string | null;
  not: string | null;
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
    .select("id, tutar, durum, yontem, odeme_tarihi, fatura_no, admin_notu, courses(baslik)")
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
  }));

  const bekleyen = satirlar.filter((s) => s.durum === "bekliyor");

  return {
    satirlar,
    bekleyenTutar: bekleyen.reduce((t, s) => t + s.tutar, 0),
    bekleyenAdet: bekleyen.length,
  };
}
