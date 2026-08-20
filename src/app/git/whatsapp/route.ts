import { randomInt } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { WHATSAPP_NUMARALAR, whatsappLink } from "@/lib/iletisim";
import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { IZIN_CEREZI, izniCoz, reklamIzniVar } from "@/lib/izin";
import { FBC_CEREZI, FBP_CEREZI } from "@/lib/meta/fbc";
import { istekIpsi } from "@/lib/meta/toplama";
import { kimlikKur } from "@/lib/meta/kimlik";
import { metaOlayiKuyrukla } from "@/lib/meta/kuyruk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * WhatsApp'a giden yolun ara durağı.
 *
 * Bu funnel'ın en sık kullanılan girişi form değil, WhatsApp butonu — ve
 * `wa.me` bağlantısına doğrudan tıklandığında geriye HİÇBİR iz kalmıyordu.
 * Kişi alanımızdan çıkıyor, günler sonra hesabı elle açılıyor, ödemesi
 * geliyor; o ödemenin reklamdan geldiğini söyleyecek tek bir veri parçası
 * yok.
 *
 * Buradan geçince, kişi HÂLÂ bizim alan adımızdayken üç şey oluyor:
 *
 *  1. Meta çerezleri, IP ve tarayıcı kimliği temas kaydına yazılıyor.
 *  2. Kısa bir referans kodu üretilip WhatsApp mesajına gömülüyor. Konuşmada
 *     geri döndüğünde yönetici hesabı açarken onu yapıştırıyor ve tıklama
 *     kimliği kişiye yapışıyor.
 *  3. Meta'ya Contact olayı gidiyor (yalnızca izin varsa).
 *
 * YÖNLENDİRME HİÇBİR KOŞULDA ENGELLENMİYOR. Veritabanı düşse, Meta yavaşlasa,
 * izin olmasa bile kişi WhatsApp'a gidiyor. Ölçümleme uğruna iletişimi
 * kesmek, ölçülecek şeyi yok etmek olur.
 */

/**
 * Karışabilen harfler yok: 0/O, 1/I/l.
 *
 * Kod insan eliyle okunup yazılıyor — yönetici WhatsApp'ta görüp panele
 * yapıştırıyor. "0" ile "O"yu ayırt etmek zorunda kalmamalı.
 */
const ALFABE = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const KOD_UZUNLUK = 5;

function kodUret(): string {
  let kod = "";
  for (let i = 0; i < KOD_UZUNLUK; i += 1) kod += ALFABE[randomInt(ALFABE.length)];
  return kod;
}

/** Hangi düğmeden gelindiği. Serbest metin değil: adres çubuğundan geliyor. */
function yeriTemizle(ham: string | null): string | null {
  if (!ham) return null;
  const temiz = ham.trim().slice(0, 40);
  return /^[\w-]+$/.test(temiz) ? temiz : null;
}

export async function GET(request: NextRequest) {
  const parametre = request.nextUrl.searchParams;
  const yer = yeriTemizle(parametre.get("yer"));

  /*
    Hangi numara. Listenin dışında bir değer istenirse ilk numaraya
    düşülüyor: adres çubuğundan gelen bir sayının bizi tanımadığımız bir
    numaraya yönlendirmesine izin verilemez.
  */
  const sira = Number(parametre.get("no"));
  const numara = (Number.isInteger(sira) && WHATSAPP_NUMARALAR[sira] ? WHATSAPP_NUMARALAR[sira] : WHATSAPP_NUMARALAR[0])
    .numara;

  const kod = await temasiKaydet(request, yer, numara);

  /*
    Hazır mesaj. Kod parantez içinde ve sonda: kişi mesajın başına kendi
    cümlesini yazsa bile kod kalıyor, çünkü insanlar hazır metnin sonuna
    değil önüne yazıyor.
  */
  const mesaj = kod
    ? `Merhaba, eğitimler hakkında bilgi almak istiyorum. (Ref: ${kod})`
    : "Merhaba, eğitimler hakkında bilgi almak istiyorum.";

  /*
    303 kullanılıyor.

    307/308 kalıcı ya da yöntem koruyan yönlendirmeler; ikisi de burada
    yanlış. Asıl mesele önbellek: 301/308 tarayıcıda saklanıyor ve bir daha
    bu uca hiç uğranmazdı — yani ikinci tıklamadan itibaren ölçüm biterdi.
  */
  const cevap = NextResponse.redirect(whatsappLink(numara, mesaj), 303);
  cevap.headers.set("Cache-Control", "no-store");
  return cevap;
}

/**
 * Temas satırını yazar ve Contact olayını kuyruğa koyar.
 *
 * Kod döndüremezse null: mesaj kodsuz gider, yönlendirme yine çalışır.
 */
async function temasiKaydet(
  request: NextRequest,
  yer: string | null,
  hedef: string,
): Promise<string | null> {
  try {
    const servis = gorevIstemcisi();
    if (!servis) return null;

    const fbp = request.cookies.get(FBP_CEREZI)?.value ?? null;
    const fbc = request.cookies.get(FBC_CEREZI)?.value ?? null;
    const izin = reklamIzniVar(izniCoz(request.cookies.get(IZIN_CEREZI)?.value));
    const ip = istekIpsi(request.headers);
    const ua = request.headers.get("user-agent");

    /*
      Çakışma ihtimali düşük ama sıfır değil (32^5 ≈ 33 milyon). Üç deneme,
      sonra vazgeçiliyor: kod olmadan da yönlendirme çalışıyor ve ziyaretçiyi
      bekletmenin anlamı yok.
    */
    for (let deneme = 0; deneme < 3; deneme += 1) {
      const kod = kodUret();
      const { data, error } = await servis
        .from("temaslar")
        .insert({
          kod,
          yer,
          hedef,
          fbp,
          fbc,
          ip,
          ua,
          referrer: request.headers.get("referer"),
          izin,
        })
        .select("id")
        .single();

      // 23505 = kod çakıştı, yeniden dene.
      if (error?.code === "23505") continue;
      if (error || !data) return null;

      await metaOlayiKuyrukla({
        olay: "Contact",
        eventId: `contact-${data.id}`,
        kimlik: kimlikKur({ fbp, fbc, ip, ua }),
        ozel: { content_name: yer ?? "whatsapp" },
        aksiyon: "website",
        kaynakUrl: request.headers.get("referer") ?? request.nextUrl.origin,
        izin,
      });

      return kod;
    }
    return null;
  } catch {
    // Ölçümleme yan iş; yönlendirmeyi düşürmesin.
    return null;
  }
}
