import { createClient } from "@/lib/supabase/server";
import { OdemeYonetimi, type OdemeSatir, type SecimOgesi } from "@/components/admin/OdemeYonetimi";
import { AyarFormu } from "@/components/admin/AyarFormu";
import { AskidakiDenemeler, type AskidaDeneme } from "@/components/admin/AskidakiDenemeler";
import { getAyarlar, bankaGrubu } from "@/lib/admin/ayarlar";

export default async function OdemelerPage() {
  const supabase = await createClient();

  const [{ data: payments }, { data: profiles }, { data: courses }, ayarlar] = await Promise.all([
    supabase
      .from("payments")
      .select(
        "id, tutar, yontem, durum, odeme_tarihi, fatura_no, online_odeme, havale_bildirimi_tarihi, profiles(ad, soyad, email), courses(baslik)",
      )
      .order("odeme_tarihi", { ascending: false }),
    supabase.from("profiles").select("id, ad, soyad, email").order("created_at"),
    supabase.from("courses").select("id, baslik").order("created_at"),
    getAyarlar(),
  ]);

  const odemeler: OdemeSatir[] = (payments ?? []).map((p) => {
    const kisi = p.profiles;
    const kurs = p.courses;
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
      havaleBildirimi: p.havale_bildirimi_tarihi ?? null,
    };
  });

  const ogrenciler: SecimOgesi[] = (profiles ?? []).map((p) => ({
    id: p.id,
    ad: [p.ad, p.soyad].filter(Boolean).join(" ") || p.email || "İsimsiz",
  }));

  const kurslar: SecimOgesi[] = (courses ?? []).map((c) => ({ id: c.id, ad: c.baslik }));

  // Sonucu belli olmamış denemeler. Tablo yoksa (migration çalıştırılmamışsa)
  // sorgu hata verir; sayfanın tamamını düşürmemesi için sonuç boş sayılıyor.
  const { data: askida } = await supabase
    .from("odeme_denemeleri")
    .select("id, tutar, created_at, callback_at, token, profiles(ad, soyad, email)")
    .eq("durum", "baslatildi")
    .order("created_at", { ascending: false })
    .limit(20);

  const askidakiler: AskidaDeneme[] = (askida ?? []).map((d) => {
    const kisi = d.profiles;
    return {
      id: d.id,
      isim: [kisi?.ad, kisi?.soyad].filter(Boolean).join(" ") || kisi?.email || "—",
      tutar: Number(d.tutar),
      tarih: d.created_at,
      callbackGeldi: Boolean(d.callback_at),
      tokenVar: Boolean(d.token),
    };
  });

  return (
    <>
      <OdemeYonetimi odemeler={odemeler} ogrenciler={ogrenciler} kurslar={kurslar} />
      <div className="px-4 sm:px-7">
        <AskidakiDenemeler denemeler={askidakiler} />
      </div>
      <div className="px-4 pb-14 sm:px-7">
        <AyarFormu gruplar={[bankaGrubu]} degerler={ayarlar} />
      </div>
    </>
  );
}
