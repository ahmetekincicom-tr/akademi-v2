import { NextResponse, after, type NextRequest } from "next/server";
import { WHATSAPP_NUMARALAR } from "@/lib/iletisim";
import { kodGecerliMi } from "@/lib/temas-kod";
import { iziTopla, temasiKaydet, yeriTemizle } from "@/lib/temas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * WhatsApp tıklamasının kaydı.
 *
 * NEDEN AYRI BİR UÇ: eskiden düğmeler önce kendi sunucumuzdaki bir adrese
 * gidiyor, orada kayıt yazılıyor ve oradan wa.me'ye yönlendiriliyordu. O
 * yönlendirme iki şeyi birden bozuyordu:
 *
 *  1. iOS, BAŞKA BİR ALAN ADINDAN gelen bir yönlendirmeyle wa.me'ye
 *     düşüldüğünde WhatsApp uygulamasını açmıyor — tarayıcıda "sohbete
 *     devam et" sayfasını gösteriyor. Universal Links yalnızca kullanıcının
 *     doğrudan dokunduğu bağlantıda çalışıyor.
 *  2. Kişi, yönlendirme dönene kadar bekliyordu.
 *
 * Artık bağlantı DOĞRUDAN wa.me'ye gidiyor (bkz. WhatsAppBaglantisi) ve
 * kayıt bu uca bir işaret (navigator.sendBeacon) olarak düşüyor. Beacon,
 * sayfa terk edilirken bile gönderilmeyi garanti eden tarayıcı mekanizması —
 * tam olarak bu iş için var.
 *
 * Yanıt 204: gönderen tarafın yanıtla işi yok, beklemiyor.
 */
export async function POST(request: NextRequest) {
  /*
    Gövde okunamazsa sessizce 204. Bu uç bir ölçüm işareti alıyor; hata
    döndürmenin kimseye faydası yok, gönderen zaten dinlemiyor.
  */
  let govde: unknown;
  try {
    govde = await request.json();
  } catch {
    return yanit();
  }

  const veri = (govde ?? {}) as { kod?: unknown; yer?: unknown; no?: unknown };

  /*
    Kod DOĞRULANIYOR. Bu uç herkese açık; biçimi tutmayan bir değer
    veritabanına yazılmamalı, yoksa panelde aranamayan çöp satırlar birikir.
  */
  if (!kodGecerliMi(veri.kod)) return yanit();

  /*
    Hangi numara. Listenin dışında bir değer gelirse ilk numaraya düşülüyor:
    dışarıdan gelen bir sayının kaydı tanımadığımız bir numaraya
    yazmasına izin verilemez.
  */
  const sira = Number(veri.no);
  const hedef = (Number.isInteger(sira) && WHATSAPP_NUMARALAR[sira]
    ? WHATSAPP_NUMARALAR[sira]
    : WHATSAPP_NUMARALAR[0]
  ).numara;

  // Kayıt yanıttan sonraya: 204 hemen dönüyor.
  after(temasiKaydet(iziTopla(request, { kod: veri.kod, yer: yeriTemizle(veri.yer as string), hedef })));

  return yanit();
}

function yanit() {
  const cevap = new NextResponse(null, { status: 204 });
  cevap.headers.set("Cache-Control", "no-store");
  return cevap;
}
