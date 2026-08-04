import "server-only";

import { connect, constants, type ClientHttp2Session } from "node:http2";
import { createSign } from "node:crypto";

/**
 * Apple Push Notification service istemcisi.
 *
 * Hazır bir paket kullanılmıyor: APNs'in istediği şey bir ES256 JWT ve HTTP/2
 * üzerinden tek bir POST. Node ikisini de kutudan çıkarıyor, araya bağımlılık
 * koymak sadece güncellenmesi gereken bir yüzey ekler.
 *
 * Anahtar (.p8) ortam değişkeninde durur, repoda DEĞİL. Sızarsa bu bundle
 * kimliğine kimin isterse bildirim göndermesi mümkün olur.
 */

const ALERT = "alert";

type Ayar = {
  keyId: string;
  teamId: string;
  bundleId: string;
  anahtar: string;
};

const PRODUCTION = "api.push.apple.com";
const SANDBOX = "api.sandbox.push.apple.com";

export type PushSonuc = {
  gonderilen: number;
  gecersizTokenlar: string[];
  hata?: string;
};

/**
 * Ortam değişkenleri KIRPILARAK okunuyor.
 *
 * Panele yapıştırırken sona kaçan bir boşluk ya da satır sonu gözle
 * görülmüyor ama bundle kimliği HTTP/2 başlığına gittiği için bağlantıyı
 * bozuyor: APNs tüm oturumu PROTOCOL_ERROR ile kapatıyor ve ortaya çıkan
 * "Session closed with error code 1" mesajı sebebi hiç anlatmıyor.
 */
function ayarlariOku(): Ayar | null {
  const keyId = process.env.APNS_KEY_ID?.trim();
  const teamId = process.env.APNS_TEAM_ID?.trim();
  const bundleId = process.env.APNS_BUNDLE_ID?.trim();
  // Vercel'in ortam değişkeni alanı çok satırlı değeri koruyor ama panele
  // yapıştırırken satır sonları "\n" metnine dönebiliyor; ikisini de kabul et.
  const anahtar = process.env.APNS_KEY_P8?.replace(/\\n/g, "\n").trim();

  if (!keyId || !teamId || !bundleId || !anahtar) return null;

  return { keyId, teamId, bundleId, anahtar };
}

/**
 * Başlığa gidecek değerlerde boşluk ya da kontrol karakteri kaldıysa isteği
 * hiç göndermiyoruz: sebebi anlaşılır bir mesaj, sunucudan dönen ham protokol
 * hatasından çok daha faydalı.
 */
function ayarSorunu(ayar: Ayar): string | null {
  if (/\s/.test(ayar.bundleId)) return "APNS_BUNDLE_ID boşluk içeriyor.";
  if (/\s/.test(ayar.keyId)) return "APNS_KEY_ID boşluk içeriyor.";
  if (/\s/.test(ayar.teamId)) return "APNS_TEAM_ID boşluk içeriyor.";
  if (!ayar.anahtar.includes("BEGIN PRIVATE KEY")) {
    return "APNS_KEY_P8 geçerli bir .p8 anahtarı gibi görünmüyor.";
  }
  return null;
}

/** Ayar eksikse arayüz "yapılandırılmadı" diyebilsin. */
export function pushYapilandirildiMi(): boolean {
  return ayarlariOku() !== null;
}

function base64url(veri: string | Buffer): string {
  return Buffer.from(veri).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// APNs aynı jetonu en fazla 1 saat kabul ediyor, ama 20 dakikadan sık
// yenileyeni de "TooManyProviderTokenUpdates" ile reddediyor. 40 dakika
// ikisinin ortası.
let jetonOnbellek: { deger: string; uretim: number } | null = null;

function jetonUret(ayar: Ayar): string {
  const simdi = Math.floor(Date.now() / 1000);
  if (jetonOnbellek && simdi - jetonOnbellek.uretim < 40 * 60) return jetonOnbellek.deger;

  const baslik = base64url(JSON.stringify({ alg: "ES256", kid: ayar.keyId }));
  const govde = base64url(JSON.stringify({ iss: ayar.teamId, iat: simdi }));

  const imzalayici = createSign("SHA256");
  imzalayici.update(`${baslik}.${govde}`);
  // APNs ham R||S imza istiyor; Node'un varsayılanı DER, dsaEncoding şart.
  const imza = imzalayici.sign({ key: ayar.anahtar, dsaEncoding: "ieee-p1363" });

  const jeton = `${baslik}.${govde}.${base64url(imza)}`;
  jetonOnbellek = { deger: jeton, uretim: simdi };
  return jeton;
}

type TekSonuc = { tamam: boolean; gecersiz: boolean; yanlisOrtam: boolean; hata?: string };

function tekGonder(
  oturum: ClientHttp2Session,
  ayar: Ayar,
  jeton: string,
  token: string,
  govde: string,
): Promise<TekSonuc> {
  return new Promise((cozumle) => {
    const istek = oturum.request({
      [constants.HTTP2_HEADER_METHOD]: "POST",
      [constants.HTTP2_HEADER_PATH]: `/3/device/${token}`,
      [constants.HTTP2_HEADER_SCHEME]: "https",
      authorization: `bearer ${jeton}`,
      "apns-topic": ayar.bundleId,
      "apns-push-type": ALERT,
      // 10 = hemen ilet. Kullanıcıya görünen bildirim için doğru değer.
      "apns-priority": "10",
      "content-type": "application/json",
    });

    let durum = 0;
    let yanit = "";

    istek.setEncoding("utf8");
    istek.on("response", (h) => {
      durum = Number(h[constants.HTTP2_HEADER_STATUS] ?? 0);
    });
    istek.on("data", (parca) => {
      yanit += parca;
    });
    istek.on("error", (e) =>
      cozumle({ tamam: false, gecersiz: false, yanlisOrtam: false, hata: e.message }),
    );
    istek.on("end", () => {
      if (durum === 200) return cozumle({ tamam: true, gecersiz: false, yanlisOrtam: false });

      let sebep = yanit;
      try {
        sebep = (JSON.parse(yanit) as { reason?: string }).reason ?? yanit;
      } catch {
        // Gövde JSON değilse ham metni kullan.
      }
      // 410 Unregistered = uygulama cihazdan silinmiş, token ölü.
      const gecersiz = durum === 410 || sebep === "Unregistered";
      // BadDeviceToken çoğu zaman token'ın ölü olduğu değil, YANLIŞ ORTAMDA
      // denendiği anlamına geliyor; diğer host'ta tekrar denenecek.
      const yanlisOrtam = sebep === "BadDeviceToken";
      cozumle({ tamam: false, gecersiz, yanlisOrtam, hata: `${durum} ${sebep}` });
    });

    istek.end(govde);
    // Kısa süreli takılmalarda gönderim sonsuza kadar beklemesin.
    istek.setTimeout(10_000, () => istek.close(constants.NGHTTP2_CANCEL));
  });
}

/**
 * Bir host'a, tek HTTP/2 oturumu üzerinden toplu gönderim.
 *
 * Hepsi paralel gidiyor — APNs bunun için tasarlanmış, cihaz başına bağlantı
 * açmak hem yavaş hem gereksiz.
 */
async function hostaGonder(
  host: string,
  ayar: Ayar,
  jeton: string,
  tokenlar: string[],
  govde: string,
): Promise<TekSonuc[] | string> {
  const oturum = connect(`https://${host}`);

  // Oturum düzeyindeki hatalar isteklere "Session closed with error code 1"
  // diye yansıyor ve sebebi hiç anlatmıyor. GOAWAY çerçevesi kodu ve çoğu
  // zaman açıklama metnini taşıyor; asıl bilgi orada.
  let goaway = "";
  oturum.once("goAway", (kod, _sonAkis, veri) => {
    const aciklama = veri?.length ? ` — ${veri.toString("utf8").slice(0, 200)}` : "";
    goaway = `sunucu bağlantıyı kapattı (kod ${kod}${aciklama})`;
  });

  const baglantiHatasi = new Promise<string>((cozumle) => {
    oturum.once("error", (e) => cozumle(goaway || e.message));
  });

  try {
    const sonuc = await Promise.race([
      Promise.all(tokenlar.map((t) => tekGonder(oturum, ayar, jeton, t, govde))),
      baglantiHatasi,
    ]);
    // İstekler "bitti" görünse bile oturum GOAWAY yediyse gerçek sebep o.
    if (typeof sonuc !== "string" && goaway && sonuc.every((r) => !r.tamam)) return goaway;
    return sonuc;
  } finally {
    oturum.close();
  }
}

/**
 * Verilen cihaz token'larına aynı bildirimi gönderir.
 *
 * İki ortam var: Xcode'dan telefona atılan geliştirme derlemelerinin token'ı
 * yalnızca sandbox'ta, TestFlight ve App Store sürümlerininki yalnızca
 * production'da geçerli. Hangisinin hangisi olduğunu sunucu bilemez — token
 * ikisinde de aynı görünüyor.
 *
 * Bunu bir ortam değişkenine bağlamak sessiz bir tuzak olurdu: yanlış ayarda
 * bildirim hata vermeden düşer. Onun yerine önce production deneniyor,
 * "BadDeviceToken" dönen token'lar sandbox'ta tekrar deneniyor.
 */
export async function pushGonder(
  tokenlar: string[],
  baslik: string,
  mesaj: string,
  veri?: Record<string, string>,
): Promise<PushSonuc> {
  const ayar = ayarlariOku();
  if (!ayar) return { gonderilen: 0, gecersizTokenlar: [], hata: "APNs ortam değişkenleri eksik." };

  const sorun = ayarSorunu(ayar);
  if (sorun) return { gonderilen: 0, gecersizTokenlar: [], hata: sorun };

  // Bozuk bir token adres satırına giriyor ve tüm oturumu düşürüyor; tek
  // satır yüzünden gönderimin tamamı kaybolmasın diye önden ayıklanıyor.
  const bozuk = tokenlar.filter((t) => !/^[0-9a-fA-F]{64}$/.test(t));
  const temizTokenlar = tokenlar.filter((t) => /^[0-9a-fA-F]{64}$/.test(t));

  if (temizTokenlar.length === 0) {
    return {
      gonderilen: 0,
      gecersizTokenlar: bozuk,
      hata: tokenlar.length ? "Kayıtlı cihaz kimlikleri geçersiz biçimde." : undefined,
    };
  }
  tokenlar = temizTokenlar;

  if (tokenlar.length === 0) return { gonderilen: 0, gecersizTokenlar: [] };

  let jeton: string;
  try {
    jeton = jetonUret(ayar);
  } catch (e) {
    return {
      gonderilen: 0,
      gecersizTokenlar: [],
      hata: `Anahtar okunamadı: ${e instanceof Error ? e.message : "bilinmeyen hata"}`,
    };
  }

  const govde = JSON.stringify({
    aps: { alert: { title: baslik, body: mesaj }, sound: "default", badge: 1 },
    ...veri,
  });

  const sonuclar = await hostaGonder(PRODUCTION, ayar, jeton, tokenlar, govde);
  if (typeof sonuclar === "string") {
    return { gonderilen: 0, gecersizTokenlar: bozuk, hata: `APNs (${PRODUCTION}): ${sonuclar}` };
  }

  // Yanlış ortamda denendiği anlaşılanları sandbox'ta tekrar dene.
  const tekrarIndeksleri = sonuclar.flatMap((s, i) => (s.yanlisOrtam ? [i] : []));
  if (tekrarIndeksleri.length > 0) {
    const tekrarTokenlar = tekrarIndeksleri.map((i) => tokenlar[i]);
    const ikinci = await hostaGonder(SANDBOX, ayar, jeton, tekrarTokenlar, govde);
    if (typeof ikinci !== "string") {
      tekrarIndeksleri.forEach((hedef, sira) => {
        sonuclar[hedef] = ikinci[sira];
      });
    }
  }

  // İki ortamda da BadDeviceToken alan token gerçekten ölüdür.
  const gecersizTokenlar = [
    ...bozuk,
    ...tokenlar.filter((_, i) => sonuclar[i].gecersiz || sonuclar[i].yanlisOrtam),
  ];
  const gonderilen = sonuclar.filter((s) => s.tamam).length;
  const ilkHata = sonuclar.find((s) => !s.tamam)?.hata;

  return { gonderilen, gecersizTokenlar, hata: gonderilen === 0 ? ilkHata : undefined };
}
