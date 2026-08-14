import { NextResponse } from "next/server";
import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { basariliMi, iyzicoAyari, odemeSorgula } from "@/lib/iyzico";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * iyzico 3D Secure dönüşü.
 *
 * Bu adres KİMLİK DOĞRULAMASIZ çalışmak zorunda: isteği iyzico'nun sayfası
 * form gönderimiyle yapıyor ve tarayıcı çapraz site POST'ta oturum çerezini
 * (SameSite=Lax) taşımıyor. Bu yüzden kullanıcı buradan okunmuyor, servis
 * anahtarı kullanılıyor.
 *
 * Güvenliği sağlayan şey POST gövdesi DEĞİL — gövdedeki tek bilgi token ve
 * ona güvenmiyoruz. Sonucu iyzico'ya sunucudan tekrar soruyoruz; hangi ödemeye
 * ait olduğunu da kendi yazdığımız conversationId söylüyor.
 */

function panele(kok: string, sonuc: string) {
  // 303: iyzico POST ile geldi, tarayıcının yönlendirmeyi GET olarak izlemesi
  // gerekiyor. 302'de bazı tarayıcılar POST'u tekrarlıyor.
  return NextResponse.redirect(new URL(`/panel/odemelerim?sonuc=${sonuc}`, kok), 303);
}

/**
 * Dönüş adresinin kökü.
 *
 * `istek.url` yerine başlıklar okunuyor: Vercel'de istek dahili bir adresle
 * gelebiliyor ve o adrese yönlendirmek öğrenciyi sitenin dışına atardı.
 */
function kokAdres(istek: Request): string {
  const h = istek.headers;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return new URL(istek.url).origin;
  const sema = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${sema}://${host}`;
}

export async function POST(istek: Request) {
  const kok = kokAdres(istek);

  const ayar = iyzicoAyari();
  const servis = gorevIstemcisi();
  if (!ayar || !servis) return panele(kok, "hata");

  let token = "";
  try {
    const form = await istek.formData();
    token = String(form.get("token") ?? "");
  } catch {
    return panele(kok, "hata");
  }
  if (!token) return panele(kok, "hata");

  let cevap;
  try {
    cevap = await odemeSorgula(ayar, token);
  } catch {
    // Ağ hatası: para çekilmiş olabilir ama biz doğrulayamadık. Kaydı
    // "bekliyor" bırakıyoruz; yönetici iyzico panelinden görüp elle işaretler.
    return panele(kok, "belirsiz");
  }

  const konusmaId = cevap.conversationId ?? "";
  if (!konusmaId) return panele(kok, "hata");

  const { data: deneme } = await servis
    .from("odeme_denemeleri")
    .select("id, payment_id, tutar, durum")
    .eq("conversation_id", konusmaId)
    .maybeSingle();

  if (!deneme) return panele(kok, "hata");
  // Aynı token iki kez dönebiliyor (kullanıcı geri tuşu, iyzico tekrarı).
  if (deneme.durum === "basarili") return panele(kok, "basarili");

  const ortak = {
    token,
    saglayici_odeme_id: cevap.paymentId ?? null,
    taksit: cevap.installment ?? null,
    kart_son4: cevap.lastFourDigits ?? null,
    kart_ailesi: cevap.cardFamily ?? null,
    ham_yanit: cevap,
  };

  if (!basariliMi(cevap)) {
    await servis
      .from("odeme_denemeleri")
      .update({
        ...ortak,
        durum: "basarisiz",
        hata_kodu: cevap.errorCode ?? null,
        hata_mesaji: cevap.errorMessage ?? "Ödeme tamamlanmadı.",
      })
      .eq("id", deneme.id);
    return panele(kok, "basarisiz");
  }

  /*
    Tutar doğrulaması `price` üzerinden, `paidPrice` üzerinden DEĞİL.

    Taksitli ödemede paidPrice vade farkıyla birlikte price'tan büyük geliyor;
    onu karşılaştırsaydık her taksitli ödeme "tutar uyuşmuyor" diye düşerdi.
    Sepet tutarı price.
  */
  const gelenTutar = Number(cevap.price);
  const beklenen = Number(deneme.tutar);
  if (!Number.isFinite(gelenTutar) || Math.abs(gelenTutar - beklenen) > 0.01) {
    await servis
      .from("odeme_denemeleri")
      .update({
        ...ortak,
        durum: "basarisiz",
        hata_kodu: "TUTAR_UYUSMAZLIGI",
        hata_mesaji: `Beklenen ${beklenen}, gelen ${cevap.price}.`,
      })
      .eq("id", deneme.id);
    return panele(kok, "hata");
  }

  await servis.from("odeme_denemeleri").update({ ...ortak, durum: "basarili" }).eq("id", deneme.id);

  // durum süzgeci ikinci koruma: bu arada yönetici kaydı "iade"ye çekmişse
  // ödeme onu geri "odendi" yapmasın.
  await servis
    .from("payments")
    .update({
      durum: "odendi",
      yontem: "Kart (iyzico)",
      odeme_tarihi: new Date().toISOString(),
    })
    .eq("id", deneme.payment_id)
    .eq("durum", "bekliyor");

  return panele(kok, "basarili");
}

/** Adres elle açılırsa boş sayfa yerine panele dön. */
export async function GET(istek: Request) {
  return NextResponse.redirect(new URL("/panel/odemelerim", kokAdres(istek)), 303);
}
