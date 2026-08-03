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
  host: string;
};

export type PushSonuc = {
  gonderilen: number;
  gecersizTokenlar: string[];
  hata?: string;
};

function ayarlariOku(): Ayar | null {
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;
  const bundleId = process.env.APNS_BUNDLE_ID;
  // Vercel'in ortam değişkeni alanı çok satırlı değeri koruyor ama panele
  // yapıştırırken satır sonları "\n" metnine dönebiliyor; ikisini de kabul et.
  const anahtar = process.env.APNS_KEY_P8?.replace(/\\n/g, "\n");

  if (!keyId || !teamId || !bundleId || !anahtar) return null;

  // Geliştirme derlemeleri (Xcode'dan telefona atılan) sandbox'a, App Store ve
  // TestFlight sürümleri production'a düşer. Aynı token iki ortamda geçerli
  // değildir; yanlış host "BadDeviceToken" döndürür.
  const host =
    process.env.APNS_ORTAM === "sandbox" ? "api.sandbox.push.apple.com" : "api.push.apple.com";

  return { keyId, teamId, bundleId, anahtar, host };
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

type TekSonuc = { tamam: boolean; gecersiz: boolean; hata?: string };

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
    istek.on("error", (e) => cozumle({ tamam: false, gecersiz: false, hata: e.message }));
    istek.on("end", () => {
      if (durum === 200) return cozumle({ tamam: true, gecersiz: false });

      let sebep = yanit;
      try {
        sebep = (JSON.parse(yanit) as { reason?: string }).reason ?? yanit;
      } catch {
        // Gövde JSON değilse ham metni kullan.
      }
      // 410 = token artık geçersiz (uygulama silindi). 400 + BadDeviceToken da
      // aynı kapıya çıkıyor: o satırı bir daha denemeye değmez.
      const gecersiz = durum === 410 || sebep === "BadDeviceToken" || sebep === "Unregistered";
      cozumle({ tamam: false, gecersiz, hata: `${durum} ${sebep}` });
    });

    istek.end(govde);
    // Kısa süreli takılmalarda gönderim sonsuza kadar beklemesin.
    istek.setTimeout(10_000, () => istek.close(constants.NGHTTP2_CANCEL));
  });
}

/**
 * Verilen cihaz token'larına aynı bildirimi gönderir.
 *
 * Tek HTTP/2 oturumu üzerinden hepsi paralel gidiyor — APNs bunun için
 * tasarlanmış, cihaz başına bağlantı açmak hem yavaş hem gereksiz.
 */
export async function pushGonder(
  tokenlar: string[],
  baslik: string,
  mesaj: string,
  veri?: Record<string, string>,
): Promise<PushSonuc> {
  const ayar = ayarlariOku();
  if (!ayar) return { gonderilen: 0, gecersizTokenlar: [], hata: "APNs ortam değişkenleri eksik." };
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

  const oturum = connect(`https://${ayar.host}`);
  const baglantiHatasi = new Promise<string>((cozumle) => {
    oturum.once("error", (e) => cozumle(e.message));
  });

  try {
    const sonuclar = await Promise.race([
      Promise.all(tokenlar.map((t) => tekGonder(oturum, ayar, jeton, t, govde))),
      baglantiHatasi.then((h) => h),
    ]);

    if (typeof sonuclar === "string") {
      return { gonderilen: 0, gecersizTokenlar: [], hata: `APNs bağlantısı kurulamadı: ${sonuclar}` };
    }

    const gecersizTokenlar = tokenlar.filter((_, i) => sonuclar[i].gecersiz);
    const gonderilen = sonuclar.filter((s) => s.tamam).length;
    const ilkHata = sonuclar.find((s) => !s.tamam && !s.gecersiz)?.hata;

    return { gonderilen, gecersizTokenlar, hata: gonderilen === 0 ? ilkHata : undefined };
  } finally {
    oturum.close();
  }
}
