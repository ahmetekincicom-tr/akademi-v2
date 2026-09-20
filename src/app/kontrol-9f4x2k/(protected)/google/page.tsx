import { createClient } from "@/lib/supabase/server";
import { getOlcumleme } from "@/lib/olcumleme";
import { GoogleDonusumleri, type DonusumSatiri } from "@/components/admin/GoogleDonusumleri";

export const dynamic = "force-dynamic";

const LIMIT = 200;

type HamSatir = {
  id: string;
  payment_id: string;
  durum: string;
  tutar: number | null;
  para_birimi: string;
  gclid: string | null;
  ga_client_id: string | null;
  kaynak: string | null;
  http_kod: number | null;
  hata: string | null;
  olay_zamani: string;
  gonderim_zamani: string | null;
  created_at: string;
  profiles: { ad: string | null; soyad: string | null; email: string | null } | null;
  payments: { courses: { baslik: string | null } | null } | null;
};

export default async function AdminGooglePage() {
  const supabase = await createClient();

  const [{ data }, olcum] = await Promise.all([
    supabase
      .from("google_donusumleri")
      .select(
        "id, payment_id, durum, tutar, para_birimi, gclid, ga_client_id, kaynak, http_kod, hata, olay_zamani, gonderim_zamani, created_at, profiles(ad, soyad, email), payments(courses(baslik))",
      )
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    getOlcumleme(),
  ]);

  const satirlar: DonusumSatiri[] = ((data ?? []) as unknown as HamSatir[]).map((r) => {
    const isim = [r.profiles?.ad, r.profiles?.soyad].filter(Boolean).join(" ").trim();
    return {
      id: r.id,
      paymentId: r.payment_id,
      durum: r.durum,
      tutar: r.tutar,
      paraBirimi: r.para_birimi,
      gclid: r.gclid,
      gaClientId: r.ga_client_id,
      kaynak: r.kaynak,
      httpKod: r.http_kod,
      hata: r.hata,
      olayZamani: r.olay_zamani,
      gonderimZamani: r.gonderim_zamani,
      kisi: isim || r.profiles?.email || "—",
      kurs: r.payments?.courses?.baslik ?? "Eğitim",
    };
  });

  return (
    <GoogleDonusumleri
      satirlar={satirlar}
      ga4={olcum.ga4}
      adsBagli={Boolean(olcum.adsId)}
    />
  );
}
