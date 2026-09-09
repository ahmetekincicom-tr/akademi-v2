import { randomInt } from "node:crypto";
import { NextResponse, after, type NextRequest } from "next/server";
import {
  WHATSAPP_NUMARALAR,
  WHATSAPP_VARSAYILAN_MESAJ,
  whatsappLink,
  egitimWhatsappMesaji,
} from "@/lib/iletisim";
import { createPublicClient } from "@/lib/supabase/public";
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
/*
  6 karakter. Eskiden 5'ti ve çakışma hâlinde yeni bir kodla tekrar
  deneniyordu; artık kod mesaja gömüldükten sonra yazıldığı için tekrar
  denemek mümkün değil (bkz. temasiKaydet). Bir hane eklemek çakışma
  ihtimalini 32 kat düşürüyor: 32^6 ≈ 1,07 milyar, on bin temasta beklenen
  çakışma 0,05'in altında. Eski 5 haneli kodlar geçerliliğini koruyor —
  sütunda uzunluk kısıtı yok, yalnızca benzersizlik var.
*/
const KOD_UZUNLUK = 6;

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

  /*
    KOD ÖNCE, VERİTABANINA SORMADAN ÜRETİLİYOR.

    Eskiden kod veritabanı satırı yazıldıktan sonra elde ediliyordu ve
    yönlendirme o yazma bitene kadar bekliyordu. Oysa kodu üreten şey
    veritabanı değil, aşağıdaki kodUret(): satırın işi onu SAKLAMAK. Üretimi
    öne alınca kayıt yanıttan sonraya taşınabiliyor.
  */
  const kod = kodUret();

  /*
    Hazır mesaj. Eğitim detay sayfasındaki düğmeler `e` parametresiyle
    eğitimin slug'ını taşıyor; mesaj o eğitimin panelde yazılmış metni, yoksa
    başlığından kurulan metin oluyor. Slug yoksa ya da öyle bir eğitim
    bulunamazsa varsayılan metin — footer ve detay dışı her yer.

    Metin VERİTABANINDAN okunuyor; adres çubuğundan gelen slug yalnızca arama
    anahtarı, mesajın kendisi hiçbir zaman URL'den gelmiyor. Yönlendirmeden
    önce beklenen TEK iş bu: mesajın kendisi olmadan yönlendirilemez.

    Kod parantez içinde ve SONDA: kişi mesajın başına kendi cümlesini yazsa
    bile kod kalıyor, çünkü insanlar hazır metnin sonuna değil önüne yazıyor.
  */
  const taban =
    (await egitiminMesaji(yeriTemizle(parametre.get("e")))) ?? WHATSAPP_VARSAYILAN_MESAJ;
  const mesaj = `${taban} (Ref: ${kod})`;

  /*
    ÖLÇÜMLEME YANITTAN SONRAYA ALINIYOR.

    Bu uç, tıklayan kişiyi WhatsApp'a göndermeden önce beş ayrı veritabanı
    turu yapıyordu: eğitim araması, temas satırı, olay açık mı kontrolü,
    tekilleştirme kontrolü ve olay satırı. Her biri ayrı bir gidiş-dönüş;
    telefonda mobil bağlantıyla toplamı birkaç saniyeye çıkıyor ve düğmeye
    basan kişi boş ekrana bakıyordu.

    Bunların HİÇBİRİ yönlendirmenin içeriğini etkilemiyor — kod artık elimizde
    olduğuna göre. after() geri çağrısı yanıt gönderildikten sonra çalışıyor,
    yani kişi WhatsApp'a giderken kayıt arka planda yazılıyor. Yönlendirme
    başarısız olsa bile after() çalışıyor (Next belgeleri bunu açıkça
    söylüyor), dolayısıyla ölçümlemeden bir şey kaybedilmiyor.

    İstek verisi (çerezler, IP, tarayıcı) BURADA okunup aşağı taşınıyor:
    geri çağrı çalıştığında istek nesnesine güvenmek yerine değerleri elde
    tutmak, ölçümlemenin yanıt yaşam döngüsüne bağlı kalmamasını sağlıyor.
  */
  after(
    temasiKaydet(
      {
        kod,
        yer,
        hedef: numara,
        fbp: request.cookies.get(FBP_CEREZI)?.value ?? null,
        fbc: request.cookies.get(FBC_CEREZI)?.value ?? null,
        izin: reklamIzniVar(izniCoz(request.cookies.get(IZIN_CEREZI)?.value)),
        ip: istekIpsi(request.headers),
        ua: request.headers.get("user-agent"),
        referrer: request.headers.get("referer"),
        kaynakUrl: request.headers.get("referer") ?? request.nextUrl.origin,
      },
    ),
  );

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

/* ------------------------------------------------ hazır mesaj önbelleği --- */

/**
 * Eğitim mesajları bellekte tutuluyor.
 *
 * Yönlendirmenin önünde kalan TEK bekleme bu sorguydu: eğitim düğmeleri
 * ölçümde ~185 ms, hiç sorgu yapmayan yüzen düğme ~7 ms sürüyordu. Aradaki
 * fark tamamen bu gidiş-dönüş.
 *
 * Veri buna fazlasıyla uygun: altı satır, toplamı bir kaç yüz bayt ve ayda
 * bir değişiyor. Tek tek slug sorgulamak yerine HEPSİ tek sorguda alınıyor —
 * altı satır için maliyet bir satırla aynı, ama sonuç her eğitime yarıyor.
 *
 * Bayat veri sunulmuyor gibi davranılmıyor; kural açıkça şu:
 *  - Önbellek boşsa (yeni başlamış bir sunucu örneği) bir kez bekleniyor.
 *  - Doluysa, süresi geçmiş olsa bile ELDEKİ kullanılıyor ve tazeleme
 *    yanıttan sonraya bırakılıyor. Yani panelden değiştirilen bir metin en
 *    geç bir sonraki tıklamada yerine oturuyor.
 *
 * unstable_cache bilerek kullanılmadı: Next 16'da kullanımdan kaldırıldı,
 * yerine geçen "use cache" ise projenin tamamını ilgilendiren bir yapılandırma
 * (cacheComponents) istiyor. Altı satırlık bir sözlük için o kadarı gerekmiyor.
 */
const ONBELLEK_SURESI_MS = 5 * 60 * 1000;

let mesajOnbellegi: { mesajlar: Map<string, string>; zaman: number } | null = null;

async function mesajlariCek(): Promise<Map<string, string>> {
  const harita = new Map<string, string>();
  /*
    Eğitimlerin TAMAMI çekilmiyor, üç alan çekiliyor. Önce getCourseBySlug()
    kullanılıyordu; o sorgu modules ve lessons tablolarını da birleştiriyor —
    bir eğitim sayfasını çizmek için doğru, iki satırlık bir mesaj için değil.

    whatsappMesaji, content JSON'unun içinden doğrudan isteniyor; koca JSON
    ağdan geçmiyor.
  */
  const { data, error } = await createPublicClient()
    .from("courses")
    .select("slug, baslik, whatsappMesaji:content->>whatsappMesaji")
    .overrideTypes<{ slug: string; baslik: string; whatsappMesaji: string | null }[]>();

  if (error || !data) return harita;
  for (const satir of data) {
    harita.set(satir.slug, satir.whatsappMesaji?.trim() || egitimWhatsappMesaji(satir.baslik));
  }
  return harita;
}

/** Arka planda tazeleme; başarısız olursa eldeki önbellek olduğu gibi kalıyor. */
async function onbellegiTazele(): Promise<void> {
  try {
    const mesajlar = await mesajlariCek();
    // Boş sonuç yazılmıyor: sorgu tökezlediğinde çalışan bir önbelleği
    // boşaltmak, her tıklamayı yeniden bekletmek olurdu.
    if (mesajlar.size > 0) mesajOnbellegi = { mesajlar, zaman: Date.now() };
  } catch {
    // Sessiz: bu iş yanıttan sonra çalışıyor, kimseyi bekletmiyor.
  }
}

/**
 * Bu eğitim için hazır mesaj.
 *
 * Önce panelden yazılan metin (content.whatsappMesaji); yoksa eğitimin
 * başlığından kurulan metin. Eğitim bulunamazsa ya da okuma başarısız olursa
 * null döner ve çağıran taraf genel metne düşer — bu uç hiçbir koşulda
 * yönlendirmeyi düşürmemeli.
 */
async function egitiminMesaji(slug: string | null): Promise<string | null> {
  if (!slug) return null;
  try {
    if (!mesajOnbellegi) {
      // Soğuk başlangıç: bir kez beklemek zorundayız.
      const mesajlar = await mesajlariCek();
      if (mesajlar.size === 0) return null;
      mesajOnbellegi = { mesajlar, zaman: Date.now() };
    } else if (Date.now() - mesajOnbellegi.zaman > ONBELLEK_SURESI_MS) {
      /*
        Zaman damgası tazeleme BİTMEDEN ileri alınıyor. Amaç, aynı anda gelen
        birden fazla isteğin arka arkaya tazeleme başlatmasını önlemek. Bedeli:
        tazeleme başarısız olursa bayatlık bir süre daha uzuyor — kabul
        edilebilir, çünkü sunulan metin yine de doğru bir metin.
      */
      mesajOnbellegi = { ...mesajOnbellegi, zaman: Date.now() };
      after(onbellegiTazele());
    }
    return mesajOnbellegi.mesajlar.get(slug) ?? null;
  } catch {
    return null;
  }
}

/** Yanıt gönderildikten sonra kaydedilecek olan her şey. */
type TemasIzi = {
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

/**
 * Temas satırını yazar ve Contact olayını kuyruğa koyar.
 *
 * YANITTAN SONRA çalışıyor (bkz. GET içindeki after çağrısı). Hiçbir şey
 * döndürmüyor ve hiçbir şeyi engellemiyor: kişi bu iş yürürken çoktan
 * WhatsApp'a gitmiş oluyor.
 *
 * Kod artık dışarıdan geliyor — mesaja gömülmüş olan kod bu. Bu yüzden
 * çakışma hâlinde YENİ bir kodla tekrar denenmiyor: kullanıcının elindeki
 * mesajda yazan kod o değil, farklı bir kodla yazılan satır yöneticinin
 * aramasında bulunmaz, yani sessizce yanlış bir kayıt üretirdi. Çakışan
 * kayıt düşüyor ve günlüğe yazılıyor.
 *
 * Çakışma ihtimali: kod 6 karakter ve 32 harfli bir alfabeden (32^6 ≈ 1,07
 * milyar). On bin temasta beklenen çakışma sayısı 0,05'in altında — pratikte
 * hiç. Kod eskiden 5 karakterdi; yeniden deneme kaldırıldığı için bir hane
 * eklendi, yoksa on binde bir buçuk kayıt kodsuz kalırdı.
 */
async function temasiKaydet(iz: TemasIzi): Promise<void> {
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
      console.error("[whatsapp] temas yazılamadı:", error.code, error.message);
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
    console.error("[whatsapp] temas kaydı başarısız:", hata);
  }
}
