import { createClient } from "@/lib/supabase/server";

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

export type Baslangic = { adimlar: Adim[]; tamamlandi: boolean };

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

  if (!user) return { adimlar: [], tamamlandi: true };

  // RLS hepsini kullanıcının kendi satırlarıyla sınırlıyor.
  const [{ data: profil }, { count: odemeSayisi }, { count: seansSayisi }] = await Promise.all([
    supabase.from("profiles").select("on_degerlendirme_tarihi").eq("id", user.id).maybeSingle(),
    supabase
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("durum", "odendi"),
    supabase
      .from("seanslar")
      .select("id", { count: "exact", head: true })
      .in("durum", ["planlandi", "tamamlandi"]),
  ]);

  const odendi = (odemeSayisi ?? 0) > 0;
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
      yol: odendi ? null : "/iletisim",
      eylem: odendi ? null : "Bize ulaş",
      bekliyor: odendi ? null : "Ödemeni aldıktan sonra biz onaylıyoruz.",
    },
    {
      anahtar: "test",
      baslik: "Ön değerlendirmeyi doldur",
      aciklama: "Eğitimi sana göre kurmamız için kısa bir soru seti.",
      tamam: testTamam,
      // Ödeme onaylanmadan test açılmıyor: sıra bozulursa süreç karışıyor.
      yol: testTamam || !odendi ? null : "/panel/on-degerlendirme",
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

  return { adimlar, tamamlandi: adimlar.every((a) => a.tamam) };
}
