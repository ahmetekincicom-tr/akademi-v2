import "server-only";

import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { getOlcumleme } from "@/lib/olcumleme";
import { mpGovdesi } from "@/lib/google/mp";

/**
 * Eğitim kaydını Google'a bildirir (GA4 Measurement Protocol → GA4 anahtar olay
 * → Google Ads içe aktarma). "A" hattı: Google Ads API'siz.
 *
 * Meta'daki satinAlmaOlayi'nın Google karşılığı. Ödemenin kesinleştiği HER yol
 * buradan geçiyor (3D Secure dönüşü, "iyzico'ya sor", mutabakat görevi, havale
 * elle işaretleme). Aynı payment_id iki kez çözülse de tek satır kalıyor
 * (google_donusumleri.payment_id UNIQUE + transaction_id GA4'te dedup).
 *
 * Atıf, temas anında yakalanan GA4 client_id ile kuruluyor: reklamdan gelen
 * ziyaretçinin _ga çerezi temasla profile taşınıyor (yazar akışı: temasiKaydet
 * → temasiKisiyeBagla). client_id yoksa dönüşüm Google oturumuna bağlanamaz;
 * o satır "atlandi" olarak loglanıp panelde sebebiyle görünüyor.
 */

const MP_UCU = "https://www.google-analytics.com/mp/collect";

export type DonusumSonucu = "gonderildi" | "basarisiz" | "atlandi";

export async function kayitDonusumuGonder(paymentId: string): Promise<DonusumSonucu | null> {
  try {
    // Yazma service_role ile (google_donusumleri RLS'i aşar); okuma da bu
    // istemciyle — çağıranın oturumundan bağımsız, meta kuyruğuyla aynı desen.
    const servis = gorevIstemcisi();
    if (!servis) return null;

    // Zaten gönderildiyse tekrar deneme (geri tuşu, iyzico tekrarı, mutabakat).
    const { data: mevcut } = await servis
      .from("google_donusumleri")
      .select("durum")
      .eq("payment_id", paymentId)
      .maybeSingle();
    if (mevcut?.durum === "gonderildi") return "gonderildi";

    const { data: odeme } = await servis
      .from("payments")
      .select("tutar, user_id, courses(baslik)")
      .eq("id", paymentId)
      .maybeSingle();
    if (!odeme?.user_id) return null;

    const { data: profil } = await servis
      .from("profiles")
      .select("ga_client_id, gclid, kaynak, reklam_izni")
      .eq("id", odeme.user_id)
      .maybeSingle();

    const tutar = Number(odeme.tutar) || 0;
    const gaId = profil?.ga_client_id ?? null;
    const kursAdi = (odeme.courses as { baslik?: string } | null)?.baslik ?? "Eğitim";

    const olcum = await getOlcumleme();
    const secret = process.env.GA4_MP_API_SECRET ?? null;

    const temel = {
      payment_id: paymentId,
      user_id: odeme.user_id,
      tutar,
      para_birimi: "TRY",
      gclid: profil?.gclid ?? null,
      ga_client_id: gaId,
      kaynak: profil?.kaynak ?? null,
      olay_zamani: new Date().toISOString(),
    };

    const yaz = async (
      durum: DonusumSonucu,
      httpKod: number | null,
      hata: string | null,
    ): Promise<DonusumSonucu> => {
      await servis.from("google_donusumleri").upsert(
        {
          ...temel,
          durum,
          http_kod: httpKod,
          hata,
          gonderim_zamani: durum === "gonderildi" ? new Date().toISOString() : null,
        },
        { onConflict: "payment_id" },
      );
      return durum;
    };

    // Atıf ya da yapılandırma eksikse gönderme; panelde sebebiyle görünsün.
    if (!gaId) return yaz("atlandi", null, "GA client_id yok — reklam oturumuna bağlanamıyor.");
    if (!olcum.ga4) return yaz("atlandi", null, "GA4 Measurement ID girilmemiş (Entegrasyonlar → Google).");
    if (!secret) return yaz("atlandi", null, "GA4_MP_API_SECRET ortam değişkeni tanımsız.");

    const govde = mpGovdesi({
      clientId: gaId,
      tutar,
      paymentId,
      kursAdi,
      gclid: profil?.gclid ?? null,
      izin: Boolean(profil?.reklam_izni),
    });

    try {
      const url = `${MP_UCU}?measurement_id=${encodeURIComponent(olcum.ga4)}&api_secret=${encodeURIComponent(secret)}`;
      const cevap = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(govde),
      });
      // MP collect başarıda 204 döndürüyor (olay doğrulaması yapmıyor).
      return cevap.ok
        ? await yaz("gonderildi", cevap.status, null)
        : await yaz("basarisiz", cevap.status, `GA4 yanıtı ${cevap.status}`);
    } catch (e) {
      return yaz("basarisiz", null, e instanceof Error ? e.message : "Ağ hatası");
    }
  } catch (hata) {
    // Ölçümleme tahsilatı geri almaz.
    console.error("[google] dönüşüm gönderilemedi", hata);
    return null;
  }
}
