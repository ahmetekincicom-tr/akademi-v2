import { createClient } from "@/lib/supabase/server";
import { OdemeYonetimi, type OdemeSatir, type SecimOgesi } from "@/components/admin/OdemeYonetimi";
import { AyarFormu } from "@/components/admin/AyarFormu";
import { getAyarlar, bankaGrubu } from "@/lib/admin/ayarlar";

export default async function OdemelerPage() {
  const supabase = await createClient();

  const [{ data: payments }, { data: profiles }, { data: courses }, ayarlar] = await Promise.all([
    supabase
      .from("payments")
      .select(
        "id, tutar, yontem, durum, odeme_tarihi, fatura_no, online_odeme, profiles(ad, soyad, email), courses(baslik)",
      )
      .order("odeme_tarihi", { ascending: false }),
    supabase.from("profiles").select("id, ad, soyad, email").order("created_at"),
    supabase.from("courses").select("id, baslik").order("created_at"),
    getAyarlar(),
  ]);

  const odemeler: OdemeSatir[] = (payments ?? []).map((p) => {
    const kisi = p.profiles as unknown as { ad: string | null; soyad: string | null; email: string | null } | null;
    const kurs = p.courses as unknown as { baslik: string } | null;
    return {
      id: p.id,
      isim: [kisi?.ad, kisi?.soyad].filter(Boolean).join(" ") || kisi?.email || "—",
      program: kurs?.baslik ?? "Belirtilmedi",
      tutar: Number(p.tutar),
      yontem: p.yontem ?? "",
      durum: p.durum,
      odemeTarihi: p.odeme_tarihi,
      faturaNo: p.fatura_no ?? "",
      onlineOdeme: p.online_odeme !== false,
    };
  });

  const ogrenciler: SecimOgesi[] = (profiles ?? []).map((p) => ({
    id: p.id,
    ad: [p.ad, p.soyad].filter(Boolean).join(" ") || p.email || "İsimsiz",
  }));

  const kurslar: SecimOgesi[] = (courses ?? []).map((c) => ({ id: c.id, ad: c.baslik }));

  return (
    <>
      <OdemeYonetimi odemeler={odemeler} ogrenciler={ogrenciler} kurslar={kurslar} />
      <div className="px-4 pb-14 sm:px-7">
        <AyarFormu gruplar={[bankaGrubu]} degerler={ayarlar} />
      </div>
    </>
  );
}
