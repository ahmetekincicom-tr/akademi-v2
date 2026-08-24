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

  const [{ data: oturumlar }, { data: profiles }, { data: courses }, { data: koltuklar }] = await Promise.all([
    supabase
      .from("egitim_oturumlari")
      .select(
        "id, baslangic, sure_dk, konu, toplanti_link, kayit_link, durum, profiles(ad, soyad, email), courses(baslik)",
      )
      .order("baslangic", { ascending: true }),
    supabase.from("profiles").select("id, ad, soyad, email").order("created_at"),
    supabase.from("courses").select("id, baslik").order("created_at"),
    /*
      Kurumsal kayıtlar: hangi ödemede kimler var. Ödeyen de gruba dahil —
      ortak eğitime o da katılıyor, sadece ödemeyi o yaptı.
    */
    supabase
      .from("payments")
      .select("id, user_id, odeme_katilimcilari(user_id)")
      .gt("koltuk_sayisi", 1),
  ]);

  const adiyla = new Map(
    (profiles ?? []).map((p) => [
      p.id,
      [p.ad, p.soyad].filter(Boolean).join(" ") || p.email || "İsimsiz",
    ]),
  );

  /*
    userId -> aynı kurumsal kayıttaki DİĞER kişiler.

    Herkes için ayrı ayrı kuruluyor: yönetici oturumu kimin üzerinden açarsa
    açsın, kalan üç kişiyi görebilmeli.
  */
  const gruplar: Record<string, { id: string; ad: string }[]> = {};
  for (const odeme of koltuklar ?? []) {
    const uyeler = [odeme.user_id, ...(odeme.odeme_katilimcilari ?? []).map((k) => k.user_id)];
    for (const kisi of uyeler) {
      const digerleri = uyeler
        .filter((u) => u !== kisi)
        .map((u) => ({ id: u, ad: adiyla.get(u) ?? "İsimsiz" }));
      if (digerleri.length > 0) gruplar[kisi] = digerleri;
    }
  }

  const satirlar: SeansSatir[] = (oturumlar ?? []).map((o) => {
    const kisi = o.profiles;
    return {
      id: o.id,
      isim: [kisi?.ad, kisi?.soyad].filter(Boolean).join(" ") || kisi?.email || "—",
      program: o.courses?.baslik ?? "Genel",
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
      ogrenciler={(profiles ?? []).map((p) => ({ id: p.id, ad: adiyla.get(p.id) ?? "İsimsiz" }))}
      gruplar={gruplar}
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
