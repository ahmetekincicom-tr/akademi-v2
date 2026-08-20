/**
 * Çerez izninin okunması ve yazılması.
 *
 * İzin ÖNCEDEN localStorage'da tutuluyordu. İki sebeple çereze taşındı:
 *
 *  1. Ana site WordPress'te (ahmetekinciakademi.com), panel ayrı bir alt alan
 *     adında. localStorage alt alan adları arasında paylaşılmıyor: kişi ana
 *     sitede izni verip panele geçtiğinde bant YENİDEN soruyordu ve o ana
 *     kadar izin verilmemiş sayılıyordu. Aynı ziyaretçi için iki ayrı izin
 *     kaydı tutmak KVKK açısından da savunulur bir şey değil.
 *
 *  2. Sunucu localStorage'ı göremiyor. Meta'ya olay gönderip göndermeyeceğine
 *     sunucu karar veriyor ve o kararın dayanağı kişinin izni — okunamayan bir
 *     izin, yok sayılmak zorunda kalırdı.
 *
 * Çerez HttpOnly DEĞİL: bandı çizen ve yazan taraf tarayıcı.
 */

export type Izin = { analitik: boolean; reklam: boolean; tarih: string };

export const IZIN_CEREZI = "aea-izin";

/**
 * Seçim yazıldığında tetiklenen tarayıcı olayı.
 *
 * Çerez, localStorage'ın aksine "storage" olayı üretmiyor: izne bağlı çalışan
 * her bileşen (bant, Meta pixel) değişikliği ancak bu olayla duyuyor. Adı
 * burada, iki tarafın da import ettiği yerde duruyor — iki dosyada ayrı ayrı
 * yazılsaydı biri değiştiğinde diğeri sessizce sağır kalırdı.
 */
export const IZIN_DEGISTI = "aea:cerez-izni-degisti";

/**
 * İznin geçerlilik süresi: 180 gün.
 *
 * Süresiz bir izin, izin olmaktan çıkıp varsayılana dönüşüyor. Altı ay sonra
 * yeniden sormak, aradan geçen sürede fikri değişmiş olabilecek kişiye
 * söz hakkı vermek demek.
 */
export const IZIN_OMRU_SN = 180 * 24 * 60 * 60;

/**
 * Çerezin yazılacağı alan adı.
 *
 * `.ahmetekinciakademi.com` yazıldığında hem WordPress'teki ana site hem
 * paneldeki alt alan adı aynı çerezi görüyor — asıl mesele bu.
 *
 * null dönerse çerez yalnızca o ana bilgisayara yazılıyor. localhost, IP ve
 * *.vercel.app böyle: vercel.app genel bir son ek (public suffix), tarayıcı
 * ona kapsamlı çerezi zaten reddeder.
 */
export function cerezAlanAdi(host: string): string | null {
  const ad = host.toLowerCase().split(":")[0].trim();
  if (!ad || ad === "localhost" || ad.endsWith(".localhost")) return null;
  // IPv4 ve IPv6: nokta sayısına bakan bir kural bunları yanlış böler.
  if (/^[\d.]+$/.test(ad) || ad.includes("[") || ad.includes("::")) return null;
  if (ad.endsWith(".vercel.app") || ad === "vercel.app") return null;

  const parcalar = ad.split(".");
  if (parcalar.length < 2) return null;

  /*
    İki seviyeli son ekler. "com.tr" tek başına genel bir son ek: son iki
    parçayı körü körüne almak `.com.tr` üretirdi ve tarayıcı o çerezi
    reddederdi — sessizce, hata vermeden. Bu liste kısa ve bilerek kısa;
    projenin dokunduğu alan adlarını kapsıyor.
  */
  const IKI_SEVIYELI = ["com.tr", "org.tr", "net.tr", "gov.tr", "edu.tr", "co.uk", "org.uk", "com.au"];
  const sonIki = parcalar.slice(-2).join(".");
  const alinacak = IKI_SEVIYELI.includes(sonIki) ? 3 : 2;
  if (parcalar.length < alinacak) return null;

  return "." + parcalar.slice(-alinacak).join(".");
}

/**
 * Çerez değerini nesneye çevirir.
 *
 * Bozuk ya da eksik değer null dönüyor, kısmi bir izin üretmiyor: yarım
 * okunmuş bir izin, verilmemiş izinden daha tehlikeli olurdu.
 */
export function izniCoz(ham: string | null | undefined): Izin | null {
  if (!ham) return null;
  try {
    const nesne: unknown = JSON.parse(decodeURIComponent(ham));
    if (!nesne || typeof nesne !== "object") return null;
    const k = nesne as Record<string, unknown>;
    if (typeof k.analitik !== "boolean" || typeof k.reklam !== "boolean") return null;
    return {
      analitik: k.analitik,
      reklam: k.reklam,
      tarih: typeof k.tarih === "string" ? k.tarih : "",
    };
  } catch {
    return null;
  }
}

export function izinDegeri(izin: Izin): string {
  return encodeURIComponent(JSON.stringify(izin));
}

/* --------------------------------------------------------- tarayıcı --- */

/**
 * Çerez dizgesinden tek bir çerezi ayıklar.
 *
 * Saf fonksiyon: document.cookie'yi kendi okumuyor ki test edilebilsin.
 * Ad araması sınır kontrollü — "aea-izin" ararken "eski-aea-izin"i
 * yakalamamalı.
 */
export function cerezdenOku(dizge: string, ad: string): string | null {
  for (const parca of dizge.split(";")) {
    const esittir = parca.indexOf("=");
    if (esittir < 0) continue;
    if (parca.slice(0, esittir).trim() === ad) return parca.slice(esittir + 1).trim();
  }
  return null;
}

/** Tarayıcıdaki izin kaydı. */
export function tarayicidanIzin(): Izin | null {
  if (typeof document === "undefined") return null;
  return izniCoz(cerezdenOku(document.cookie, IZIN_CEREZI));
}

/** İzni çereze yazar. Alan adı hesabı cerezAlanAdi'nda. */
export function izniYaz(izin: Izin): void {
  if (typeof document === "undefined") return;
  const alan = cerezAlanAdi(window.location.hostname);
  const parcalar = [
    `${IZIN_CEREZI}=${izinDegeri(izin)}`,
    "path=/",
    `max-age=${IZIN_OMRU_SN}`,
    // Lax: izin çerezi hiçbir zaman çapraz site bir POST'ta okunmuyor,
    // ama ana siteden panele geçen normal bağlantıda okunmak ZORUNDA —
    // Strict olsaydı ilk istekte görünmezdi ve bant bir an için açılırdı.
    "SameSite=Lax",
    ...(alan ? [`domain=${alan}`] : []),
    ...(window.location.protocol === "https:" ? ["Secure"] : []),
  ];
  document.cookie = parcalar.join("; ");
}

/**
 * Meta'ya olay gönderilebilir mi?
 *
 * Tek karar noktası burası. "İzin yoksa gönderme" kuralı her çağrı yerine
 * ayrı ayrı yazılsaydı, biri er geç unutulurdu — ve unutulan yerde
 * hash'lenmiş de olsa kişisel veri izinsiz dışarı çıkardı.
 */
export function reklamIzniVar(izin: Izin | null): boolean {
  return izin?.reklam === true;
}
