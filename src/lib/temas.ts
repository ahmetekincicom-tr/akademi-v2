import "server-only";

import type { NextRequest } from "next/server";
import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { IZIN_CEREZI, izniCoz, reklamIzniVar } from "@/lib/izin";
import { FBC_CEREZI, FBP_CEREZI } from "@/lib/meta/fbc";
import { istekIpsi } from "@/lib/meta/toplama";
import { kimlikKur } from "@/lib/meta/kimlik";
import { metaOlayiKuyrukla } from "@/lib/meta/kuyruk";

/**
 * WhatsApp temasının kaydı.
 *
 * İki yerden çağrılıyor ve bu yüzden burada duruyor:
 *
 *  - /api/temas — asıl yol. Düğmeye tıklandığında tarayıcı bir işaret
 *    (sendBeacon) gönderiyor; bağlantının kendisi doğrudan wa.me'ye gidiyor.
 *  - /git/whatsapp — eski yol. WordPress'teki sayfalar hâlâ bu adresi
 *    kullanıyor, o yüzden çalışmaya devam ediyor.
 *
 * Kod DIŞARIDAN geliyor: mesaja gömülmüş olan kod bu. Çakışma hâlinde yeni
 * bir kodla tekrar denenmiyor — kullanıcının elindeki mesajda yazan kod o
 * olmaz ve farklı bir kodla yazılan satır yöneticinin aramasında bulunmaz,
 * yani sessizce yanlış bir kayıt üretirdi. Çakışan kayıt düşüyor ve günlüğe
 * yazılıyor.
 */

export type TemasIzi = {
  kod: string;
  yer: string | null;
  hedef: string;
  fbp: string | null;
  fbc: string | null;
  izin: boolean;
  ip: string | null;
  ua: string | null;
  referrer: string | null;
  kaynakUrl: string;
};

/** İstekten ölçümleme alanlarını toplar. */
export function iziTopla(
  request: NextRequest,
  ortak: { kod: string; yer: string | null; hedef: string },
): TemasIzi {
  return {
    ...ortak,
    fbp: request.cookies.get(FBP_CEREZI)?.value ?? null,
    fbc: request.cookies.get(FBC_CEREZI)?.value ?? null,
    izin: reklamIzniVar(izniCoz(request.cookies.get(IZIN_CEREZI)?.value)),
    ip: istekIpsi(request.headers),
    ua: request.headers.get("user-agent"),
    referrer: request.headers.get("referer"),
    kaynakUrl: request.headers.get("referer") ?? request.nextUrl.origin,
  };
}

/**
 * Temas satırını yazar ve Contact olayını kuyruğa koyar.
 *
 * Hiçbir şey döndürmüyor ve hiçbir şeyi engellemiyor: çağıran taraf bunu
 * yanıttan sonraya bırakıyor, kişi bu iş yürürken çoktan WhatsApp'a gitmiş
 * oluyor.
 */
export async function temasiKaydet(iz: TemasIzi): Promise<void> {
  try {
    const servis = gorevIstemcisi();
    if (!servis) return;

    const { data, error } = await servis
      .from("temaslar")
      .insert({
        kod: iz.kod,
        yer: iz.yer,
        hedef: iz.hedef,
        fbp: iz.fbp,
        fbc: iz.fbc,
        ip: iz.ip,
        ua: iz.ua,
        referrer: iz.referrer,
        izin: iz.izin,
      })
      .select("id")
      .single();

    if (error) {
      // 23505 = kod çakıştı. Sessiz geçilmiyor: bir daha olursa kod uzunluğu
      // yeniden konuşulmalı.
      console.error("[temas] yazılamadı:", error.code, error.message);
      return;
    }
    if (!data) return;

    await metaOlayiKuyrukla({
      olay: "Contact",
      eventId: `contact-${data.id}`,
      kimlik: kimlikKur({ fbp: iz.fbp, fbc: iz.fbc, ip: iz.ip, ua: iz.ua }),
      ozel: { content_name: iz.yer ?? "whatsapp" },
      aksiyon: "website",
      kaynakUrl: iz.kaynakUrl,
      izin: iz.izin,
    });
  } catch (hata) {
    // Ölçümleme yan iş; arka planda da olsa gürültü çıkarmasın.
    console.error("[temas] kayıt başarısız:", hata);
  }
}

/** Hangi düğmeden gelindiği. Serbest metin değil: dışarıdan geliyor. */
export function yeriTemizle(ham: string | null | undefined): string | null {
  if (!ham) return null;
  const temiz = String(ham).trim().slice(0, 40);
  return /^[\w-]+$/.test(temiz) ? temiz : null;
}
