import { createClient } from "@/lib/supabase/server";
import { SeansYonetimi, type SeansSatir } from "@/components/admin/SeansYonetimi";
import { oturumEkle, oturumDurumDegistir, oturumSil, oturumKayitLinki } from "./actions";

/**
 * Birebir EĞİTİMİN takvimi ve Drive kayıtları. Eğitim bittikten sonra
 * kullanılan görüşme hakları ayrı bir yerde: yönetim panelindeki Seans takvimi.
 *
 * Ekran işi seanslarla aynı olduğu için aynı bileşen kullanılıyor; metinler
 * ve server action'lar buradan veriliyor.
 */
export default async function AdminBirebirEgitimPage() {
  const supabase = await createClient();

  const [{ data: oturumlar }, { data: profiles }, { data: courses }] = await Promise.all([
    supabase
      .from("egitim_oturumlari")
      .select(
        "id, baslangic, sure_dk, konu, toplanti_link, kayit_link, durum, profiles(ad, soyad, email), courses(baslik)",
      )
      .order("baslangic", { ascending: true }),
    supabase.from("profiles").select("id, ad, soyad, email").order("created_at"),
    supabase.from("courses").select("id, baslik").order("created_at"),
  ]);

  const satirlar: SeansSatir[] = (oturumlar ?? []).map((o) => {
    const kisi = o.profiles as unknown as { ad: string | null; soyad: string | null; email: string | null } | null;
    return {
      id: o.id,
      isim: [kisi?.ad, kisi?.soyad].filter(Boolean).join(" ") || kisi?.email || "—",
      program: (o.courses as unknown as { baslik: string } | null)?.baslik ?? "Genel",
      baslangic: o.baslangic,
      sureDk: o.sure_dk,
      konu: o.konu ?? "",
      toplantiLink: o.toplanti_link ?? "",
      kayitLink: o.kayit_link ?? "",
      durum: o.durum,
    };
  });

  return (
    <SeansYonetimi
      seanslar={satirlar}
      ogrenciler={(profiles ?? []).map((p) => ({
        id: p.id,
        ad: [p.ad, p.soyad].filter(Boolean).join(" ") || p.email || "İsimsiz",
      }))}
      kurslar={(courses ?? []).map((c) => ({ id: c.id, ad: c.baslik }))}
      metin={{
        baslik: "Birebir eğitim",
        birim: "oturum",
        yeniDugme: "Oturum planla",
        yeniBaslik: "Yeni eğitim oturumu",
        eklendi: "Eğitim oturumu planlandı.",
      }}
      eylem={{
        ekle: oturumEkle,
        durumDegistir: oturumDurumDegistir,
        sil: oturumSil,
        kayitLinki: oturumKayitLinki,
      }}
    />
  );
}
