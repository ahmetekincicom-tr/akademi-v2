import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { ogrenciBildirimi } from "@/lib/eposta";

/**
 * Ödemeyle ilgili öğrenci e-postaları.
 *
 * Dönüş değeri var ve çağıran ona bakıyor. Önceden her şey sessizce yutuluyordu;
 * öğrencinin profilinde e-posta adresi olmadığı için hiç gönderilmeyen bir
 * bildirim, yönetici tarafında "gönderildi" gibi görünüyordu.
 *
 * Tek dosyada toplanıyor çünkü aynı olay birden fazla yerden tetikleniyor:
 * ödeme yöneticinin panelinden de tamamlanabiliyor, iyzico dönüşünden de,
 * mutabakat görevinden de. Metni her çağrı yerinde ayrı yazmak er geç
 * birbirinden ayrışan üç farklı mail demek.
 *
 * Hiçbiri hata fırlatmıyor: postanın gitmemesi tahsilatı ya da kaydı
 * geçersiz kılmaz.
 */

export type BildirimSonuc = { gonderildi: boolean; sebep?: string };

const EPOSTA_YOK =
  "Katılımcının profilinde e-posta adresi yok, bildirim gönderilemedi.";

const paraBicimi = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 2,
});

const tarihBicimi = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "long",
  year: "numeric",
});

type OdemeSatiri = {
  tutar: number;
  email: string | null;
  ad: string | null;
  kurs: string | null;
  /** Danışmanlık ödemesiyse görüşmenin konusu. */
  gorusmeKonusu: string | null;
};

async function odemeyiOku(servis: SupabaseClient, paymentId: string): Promise<OdemeSatiri | null> {
  const { data } = await servis
    .from("payments")
    .select("tutar, profiles(ad, email), courses(baslik)")
    .eq("id", paymentId)
    .maybeSingle();

  if (!data) return null;

  const kisi = data.profiles as unknown as { ad: string | null; email: string | null } | null;
  const kurs = (data.courses as unknown as { baslik: string } | null)?.baslik ?? null;

  const { data: gorusme } = await servis
    .from("gorusmeler")
    .select("konu")
    .eq("payment_id", paymentId)
    .maybeSingle();

  return {
    tutar: Number(data.tutar ?? 0),
    email: kisi?.email ?? null,
    ad: kisi?.ad ?? null,
    kurs,
    gorusmeKonusu: (gorusme?.konu as string) ?? null,
  };
}

/**
 * Yönetici bir ödeme tanımladığında öğrenciye haber.
 *
 * Ödemesi olduğunu panele girip fark etmesini beklemek, ödemenin günlerce
 * bekleyeceği anlamına geliyor. Bu mail o beklemeyi kaldırıyor.
 */
export async function odemeAcildiBildir(
  servis: SupabaseClient,
  paymentId: string,
): Promise<BildirimSonuc> {
  try {
    const o = await odemeyiOku(servis, paymentId);
    if (!o) return { gonderildi: false, sebep: "Ödeme kaydı okunamadı." };
    if (!o.email) return { gonderildi: false, sebep: EPOSTA_YOK };

    await ogrenciBildirimi({
      akis: "odeme-acildi",
      alici: o.email,
      konu: `Ödeme tanımlandı · ${paraBicimi.format(o.tutar)}`,
      ustEtiket: "Ödeme bilgisi",
      baslik: o.ad ? `${o.ad}, ödemen tanımlandı` : "Ödemen tanımlandı",
      ozet:
        "Panelindeki ödemeler bölümünde görebilir, kartla ya da havale ile tamamlayabilirsin. " +
        "Ödemen bize ulaştığında kaydını “Ödendi” olarak işaretliyoruz.",
      satirlar: [
        { etiket: "Tutar", deger: paraBicimi.format(o.tutar) },
        ...(o.kurs ? [{ etiket: "Eğitim", deger: o.kurs }] : []),
        { etiket: "Tanımlanma", deger: tarihBicimi.format(new Date()) },
      ],
      yol: "/panel/odemelerim",
      eylemEtiketi: "Ödemeyi görüntüle",
    });
    return { gonderildi: true };
  } catch (e) {
    // Bildirim, ödemenin tanımlanmasını engellememeli; ama sessiz de kalmamalı.
    return { gonderildi: false, sebep: e instanceof Error ? e.message : "Bilinmeyen hata" };
  }
}

/**
 * Ödeme tamamlandığında öğrenciye haber.
 *
 * Eğitim ödemesinde bir sonraki adım ön değerlendirme formu: kapsamı ve
 * takvimi ona göre kuruyoruz, dolayısıyla asıl istenen eylem bu. Danışmanlık
 * ödemesinde böyle bir adım yok, o yüzden metin ayrılıyor.
 */
export async function odemeTamamlandiBildir(
  servis: SupabaseClient,
  paymentId: string,
): Promise<BildirimSonuc> {
  try {
    const o = await odemeyiOku(servis, paymentId);
    if (!o) return { gonderildi: false, sebep: "Ödeme kaydı okunamadı." };
    if (!o.email) return { gonderildi: false, sebep: EPOSTA_YOK };

    if (o.gorusmeKonusu) {
      await ogrenciBildirimi({
        akis: "odeme-tamamlandi",
        alici: o.email,
        konu: "Danışmanlık talebin alındı",
        ustEtiket: "Ödeme alındı",
        baslik: o.ad ? `${o.ad}, talebin alındı` : "Talebin alındı",
        ozet:
          "Ödemen bize ulaştı ve danışmanlık talebin planlamaya girdi. " +
          "Görüşme saatini belirleyip panelinden ve e-posta ile ileteceğiz.",
        satirlar: [
          { etiket: "Konu", deger: o.gorusmeKonusu },
          { etiket: "Tutar", deger: paraBicimi.format(o.tutar) },
        ],
        yol: "/panel/gorusmeler",
        eylemEtiketi: "Görüşmelerim",
      });
      return { gonderildi: true };
    }

    await ogrenciBildirimi({
      akis: "odeme-tamamlandi",
      alici: o.email,
      konu: "Ödemen alındı — sıradaki adım: ön değerlendirme",
      ustEtiket: "Ödeme alındı",
      baslik: o.ad ? `Teşekkürler ${o.ad}` : "Ödemen alındı",
      ozet:
        "Ödemen bize ulaştı. Sıradaki adım ön değerlendirme formu: eğitimin kapsamını ve takvimini " +
        "senin seviyene ve hedefine göre kurduğumuz için bu formu doldurman gerekiyor. Birkaç dakika sürüyor.",
      satirlar: [
        { etiket: "Tutar", deger: paraBicimi.format(o.tutar) },
        ...(o.kurs ? [{ etiket: "Eğitim", deger: o.kurs }] : []),
        { etiket: "Sıradaki adım", deger: "Ön değerlendirme formu" },
      ],
      yol: "/panel/on-degerlendirme",
      eylemEtiketi: "Ön değerlendirmeyi doldur",
    });
    return { gonderildi: true };
  } catch (e) {
    // Bildirim, tahsilatı geçersiz kılmaz.
    return { gonderildi: false, sebep: e instanceof Error ? e.message : "Bilinmeyen hata" };
  }
}
