import { createClient } from "@/lib/supabase/server";
import { getOdemelerim, paraBicimi } from "@/lib/odeme";
import type { Uyari } from "@/components/panel/PanelUyari";

export type Adim = {
  anahtar: "hesap" | "odeme" | "test" | "planlama";
  baslik: string;
  aciklama: string;
  tamam: boolean;
  /** Öğrencinin yapabileceği bir şey varsa bağlantı; bekleyen adımlarda null. */
  yol: string | null;
  eylem: string | null;
  /** Adım bize bağlıysa öğrenciye neyi beklediğini söylüyoruz. */
  bekliyor: string | null;
};

export type Baslangic = { adimlar: Adim[]; tamamlandi: boolean; uyari: Uyari | null };

/**
 * Karşılama adımları ayrı bir "onboarding" tablosundan değil, sürecin zaten
 * yazıldığı tablolardan okunuyor: ödeme payments'ta, planlama seanslar'da.
 * Böylece ikinci bir doğruluk kaynağı ve onu güncel tutma derdi çıkmıyor.
 *
 * Tek istisna ön değerlendirme: cevaplar Tally'de kaldığı için panelin
 * elinde yalnızca profiles.on_degerlendirme_tarihi damgası var.
 */
export async function getBaslangic(): Promise<Baslangic> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { adimlar: [], tamamlandi: true, uyari: null };

  // RLS hepsini kullanıcının kendi satırlarıyla sınırlıyor.
  const [{ data: profil }, odemeler, { count: seansSayisi }] = await Promise.all([
    supabase.from("profiles").select("on_degerlendirme_tarihi").eq("id", user.id).maybeSingle(),
    getOdemelerim(),
    supabase
      .from("seanslar")
      .select("id", { count: "exact", head: true })
      .in("durum", ["planlandi", "tamamlandi"]),
  ]);

  const odendi = odemeler.satirlar.some((s) => s.durum === "odendi");
  const testTamam = Boolean(profil?.on_degerlendirme_tarihi);
  const planlandi = (seansSayisi ?? 0) > 0;

  const adimlar: Adim[] = [
    {
      anahtar: "hesap",
      baslik: "Hesabını oluştur",
      aciklama: "Panele giriş yaptın, bu adım tamam.",
      tamam: true,
      yol: null,
      eylem: null,
      bekliyor: null,
    },
    {
      anahtar: "odeme",
      baslik: "Ödemeni tamamla",
      aciklama: "Eğitim ücreti bize ulaştığında burayı işaretliyoruz.",
      tamam: odendi,
      yol: odendi ? null : "/panel/odemelerim",
      eylem: odendi ? null : "Ödemelerim",
      bekliyor: odendi
        ? null
        : odemeler.bekleyenAdet > 0
          ? `${paraBicimi.format(odemeler.bekleyenTutar)} tutarında ${odemeler.bekleyenAdet} ödeme bekliyor.`
          : "Ödemeni aldıktan sonra biz onaylıyoruz.",
    },
    {
      anahtar: "test",
      baslik: "Ön değerlendirmeyi doldur",
      aciklama: "Eğitimi sana göre kurmamız için kısa bir soru seti.",
      tamam: testTamam,
      // Ödeme onaylanmadan test açılmıyor: sıra bozulursa süreç karışıyor.
      yol: testTamam || !odendi ? null : "/panel/testlerim",
      eylem: testTamam || !odendi ? null : "Testi doldur",
      bekliyor: !odendi && !testTamam ? "Ödeme onaylandıktan sonra açılır." : null,
    },
    {
      anahtar: "planlama",
      baslik: "Tarih ve saati planla",
      aciklama: "Birebir seanslarının takvimini birlikte belirliyoruz.",
      tamam: planlandi,
      yol: planlandi || !testTamam ? null : "/iletisim",
      eylem: planlandi || !testTamam ? null : "Planlamaya geç",
      bekliyor: !testTamam && !planlandi ? "Ön değerlendirmeden sonra açılır." : null,
    },
  ];

  // Panele girer girmez görülecek tek iş. Sıra önemli: ödeme beklerken test
  // uyarısı göstermek yanlış olur, test o aşamada zaten kilitli.
  let uyari: Uyari | null = null;
  if (odemeler.bekleyenAdet > 0) {
    uyari = {
      tip: "bekleyen",
      baslik: "Bekleyen ödemen var",
      metin: `${paraBicimi.format(odemeler.bekleyenTutar)} tutarında ${odemeler.bekleyenAdet} ödeme onay bekliyor. Ödemen bize ulaştığında işaretliyoruz.`,
      yol: "/panel/odemelerim",
      eylem: "Ödemelerim",
      ikon: "card",
    };
  } else if (odendi && !testTamam) {
    uyari = {
      tip: "eylem",
      baslik: "Ön değerlendirme testini tamamla",
      metin: "Eğitimi sana göre kurabilmemiz için kısa bir soru setini doldurman gerekiyor.",
      yol: "/panel/testlerim",
      eylem: "Testi doldur",
      ikon: "file",
    };
  }

  return { adimlar, tamamlandi: adimlar.every((a) => a.tamam), uyari };
}
