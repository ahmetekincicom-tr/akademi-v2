import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { ogrenciBildirimi } from "@/lib/eposta";
import { TR_ZAMAN } from "@/lib/zaman";
import type { BildirimSonuc } from "@/lib/odeme-eposta";

/**
 * Birebir eğitimle ilgili katılımcı e-postaları.
 *
 * Panele bir şey eklendiğini kişinin kendiliğinden fark etmesini beklemek,
 * çoğu zaman hiç fark edilmemesi demek: kimse panele her gün girmiyor.
 * Rozetler paneldeki kişiye, bu mailler panele girmeyen kişiye çalışıyor.
 *
 * Ödeme bildirimlerindeki sözleşmenin aynısı: hata fırlatmıyorlar, sonucu
 * döndürüyorlar. Postanın gitmemesi kaydın oluşmasını geri almamalı, ama
 * yönetici tarafında sessizce kaybolmamalı da.
 */

const EPOSTA_YOK = "Katılımcının profilinde e-posta adresi yok, bildirim gönderilemedi.";

const tarihSaatBicimi = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TR_ZAMAN,
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

async function kisiyiOku(servis: SupabaseClient, userId: string) {
  const { data } = await servis.from("profiles").select("ad, email").eq("id", userId).maybeSingle();
  return { ad: (data?.ad as string) ?? null, email: (data?.email as string) ?? null };
}

/** Kayıt klasörü paylaşıldığında. */
export async function kayitArsiviBildir(
  servis: SupabaseClient,
  userId: string,
  bilgi: { baslik: string; program: string | null },
): Promise<BildirimSonuc> {
  try {
    const kisi = await kisiyiOku(servis, userId);
    if (!kisi.email) return { gonderildi: false, sebep: EPOSTA_YOK };

    await ogrenciBildirimi({
      akis: "egitim-kaydi",
      alici: kisi.email,
      konu: "Ders kayıtların panelinde",
      ustEtiket: "Eğitim kayıtları",
      baslik: kisi.ad ? `${kisi.ad}, ders kayıtların hazır` : "Ders kayıtların hazır",
      ozet:
        "Derslerin ekran kayıtlarının bulunduğu klasörü panelinle paylaştık. " +
        "Klasör canlı: yeni ders işlendikçe kayıtlar aynı yere ekleniyor, tekrar bir bağlantı beklemene gerek yok.",
      satirlar: [
        { etiket: "Klasör", deger: bilgi.baslik || "Ders kayıtları" },
        ...(bilgi.program ? [{ etiket: "Program", deger: bilgi.program }] : []),
      ],
      yol: "/panel/birebir-egitim",
      eylemEtiketi: "Kayıtları aç",
    });
    return { gonderildi: true };
  } catch (e) {
    return { gonderildi: false, sebep: e instanceof Error ? e.message : "Bilinmeyen hata" };
  }
}

/** Birebir ders planlandığında. */
export async function oturumPlanlandiBildir(
  servis: SupabaseClient,
  userId: string,
  bilgi: { baslangic: string; sureDk: number; konu: string; program: string | null; toplantiLink: string | null },
): Promise<BildirimSonuc> {
  try {
    const kisi = await kisiyiOku(servis, userId);
    if (!kisi.email) return { gonderildi: false, sebep: EPOSTA_YOK };

    await ogrenciBildirimi({
      akis: "oturum-planlandi",
      alici: kisi.email,
      konu: `Dersin planlandı · ${tarihSaatBicimi.format(new Date(bilgi.baslangic))}`,
      ustEtiket: "Birebir eğitim",
      baslik: kisi.ad ? `${kisi.ad}, dersin planlandı` : "Dersin planlandı",
      ozet:
        "Birebir ders takvimine yeni bir oturum eklendi. Katılım bağlantısı panelindeki birebir eğitim " +
        "sayfasında; ders saatinde oradan katılabilirsin.",
      satirlar: [
        // Saat en üstte: mailden akılda kalması gereken tek şey bu.
        { etiket: "Tarih ve saat", deger: tarihSaatBicimi.format(new Date(bilgi.baslangic)) },
        { etiket: "Süre", deger: `${bilgi.sureDk} dakika` },
        ...(bilgi.konu ? [{ etiket: "Konu", deger: bilgi.konu }] : []),
        ...(bilgi.program ? [{ etiket: "Program", deger: bilgi.program }] : []),
      ],
      yol: "/panel/birebir-egitim",
      eylemEtiketi: "Takvimi görüntüle",
    });
    return { gonderildi: true };
  } catch (e) {
    return { gonderildi: false, sebep: e instanceof Error ? e.message : "Bilinmeyen hata" };
  }
}
