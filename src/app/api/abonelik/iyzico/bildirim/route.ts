import { NextResponse } from "next/server";
import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { abonelikIyzicoAyari, aboneligiSenkronla } from "@/lib/abonelik";
import { bildirimImzasi, imzaDogruMu } from "@/lib/abonelik-hesap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * iyzico abonelik bildirimi (webhook).
 *
 * iyzico panelinde: Ayarlar → Üye İşyeri Ayarları → Abonelik Bildirimleri
 * adresi buraya verilir. Her ayki çekimin sonucu (başarılı ya da reddedildi)
 * buraya düşüyor.
 *
 * GÖVDEYE GÜVENİLMİYOR. Gövdeden yalnızca abonelik kodu okunuyor; durum,
 * dönem ve tutar iyzico'ya tekrar sorularak yazılıyor (aboneligiSenkronla).
 * Sahte bir bildirim en fazla tek bir sorgu tetikler ve kaydı iyzico'nun
 * zaten söylediğinden başka bir şeye çeviremez.
 *
 * İmza (X-IYZ-SIGNATURE-V3) iyzico'da ayrıca açtırılan bir özellik; açıksa ve
 * IYZICO_MERCHANT_ID tanımlıysa doğrulanıyor. Tutmadığında istek REDDEDİLMİYOR,
 * günlüğe yazılıyor: yukarıdaki kural sayesinde reddetmenin güvenliğe katkısı
 * yok, ama formülde bir yanlışlık olsaydı her gerçek bildirimi düşürür ve
 * yenilemeler ancak saatlik mutabakatta işlenirdi.
 *
 * Cevap her zaman 200 (gövde okunamasa da): iyzico 2xx görmezse aynı
 * bildirimi tekrar tekrar gönderiyor ve bizim taraftaki bir sorun bunu
 * düzeltmiyor.
 */

type Bildirim = {
  orderReferenceCode?: string;
  customerReferenceCode?: string;
  subscriptionReferenceCode?: string;
  iyziReferenceCode?: string;
  iyziEventType?: string;
  iyziEventTime?: number;
};

export async function POST(istek: Request) {
  let govde: Bildirim;
  try {
    govde = (await istek.json()) as Bildirim;
  } catch {
    return NextResponse.json({ alindi: false, sebep: "Gövde okunamadı." });
  }

  const abonelikKodu = govde.subscriptionReferenceCode?.trim();
  if (!abonelikKodu) return NextResponse.json({ alindi: false, sebep: "Abonelik kodu yok." });

  const servis = gorevIstemcisi();
  if (!servis) return NextResponse.json({ alindi: false, sebep: "Sunucu yapılandırması eksik." });

  const { data: satir } = await servis
    .from("abonelikler")
    .select("id, test_modu")
    .eq("iyzico_abonelik_kodu", abonelikKodu)
    .maybeSingle();

  /*
    Eşleşme yoksa: büyük ihtimalle ilk çekimin bildirimi formun dönüşünden
    ÖNCE geldi ve satır henüz abonelik koduna bağlanmadı. Dönüş (ya da
    mutabakat) satırı bağlayıp aynı senkronu yapacak; burada beklemek yok.
  */
  if (!satir) return NextResponse.json({ alindi: true, eslesme: false });

  const imza = istek.headers.get("x-iyz-signature-v3");
  const merchantId = process.env.IYZICO_MERCHANT_ID?.trim();
  const ayar = abonelikIyzicoAyari(satir.test_modu);
  if (imza && merchantId && ayar) {
    const beklenen = bildirimImzasi({
      merchantId,
      secretKey: ayar.secretKey,
      olay: govde.iyziEventType ?? "",
      abonelikKodu,
      siparisKodu: govde.orderReferenceCode ?? "",
      musteriKodu: govde.customerReferenceCode ?? "",
    });
    if (!imzaDogruMu(beklenen, imza)) {
      console.warn("[abonelik-bildirim] imza tutmadı", { abonelikKodu, olay: govde.iyziEventType });
    }
  }

  const sonuc = await aboneligiSenkronla(servis, satir.id);
  return NextResponse.json({ alindi: true, sonuc });
}
