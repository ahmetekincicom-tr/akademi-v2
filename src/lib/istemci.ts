/**
 * Turns a request into the small set of facts we keep about a sign-in.
 *
 * Location comes from the headers the hosting platform adds at the edge, not
 * from a third-party IP lookup service — sending every member's IP to an
 * outside API would be a data transfer we would then have to declare and
 * justify. Off Vercel these headers are simply absent and the fields stay null.
 */

export type IstemciBilgisi = {
  ip: string | null;
  ulke: string | null;
  sehir: string | null;
  bolge: string | null;
  tarayici: string | null;
  isletimSistemi: string | null;
  cihaz: string | null;
};

/** Vercel URL-encodes city and region so names like "İstanbul" survive transit. */
function coz(deger: string | null): string | null {
  if (!deger) return null;
  try {
    const acik = decodeURIComponent(deger).trim();
    return acik || null;
  } catch {
    return deger.trim() || null;
  }
}

/**
 * x-forwarded-for is a client-to-proxy chain and the client controls the left
 * side of it, so we take the first entry only because the platform prepends
 * the real peer address ahead of anything the caller sent.
 */
function ipCoz(basliklar: Headers): string | null {
  const dogrudan = basliklar.get("x-real-ip");
  if (dogrudan) return dogrudan.trim() || null;

  const zincir = basliklar.get("x-forwarded-for");
  if (!zincir) return null;
  return zincir.split(",")[0]?.trim() || null;
}

const TARAYICILAR: [RegExp, string][] = [
  [/Edg\//, "Edge"],
  [/OPR\/|Opera/, "Opera"],
  [/SamsungBrowser/, "Samsung Internet"],
  [/Firefox\//, "Firefox"],
  [/Chrome\//, "Chrome"],
  [/Safari\//, "Safari"],
];

const SISTEMLER: [RegExp, string][] = [
  [/Windows NT/, "Windows"],
  [/iPhone|iPad|iPod/, "iOS"],
  [/Mac OS X|Macintosh/, "macOS"],
  [/Android/, "Android"],
  [/Linux/, "Linux"],
];

function eslestir(ua: string, tablo: [RegExp, string][]): string | null {
  for (const [kalip, ad] of tablo) {
    if (kalip.test(ua)) return ad;
  }
  return null;
}

function cihazTuru(ua: string): string | null {
  if (!ua) return null;
  if (/iPad|Tablet/i.test(ua)) return "Tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "Mobil";
  return "Masaüstü";
}

export function istemciBilgisi(basliklar: Headers): IstemciBilgisi {
  const ua = basliklar.get("user-agent") ?? "";

  return {
    ip: ipCoz(basliklar),
    ulke: coz(basliklar.get("x-vercel-ip-country")),
    sehir: coz(basliklar.get("x-vercel-ip-city")),
    bolge: coz(basliklar.get("x-vercel-ip-country-region")),
    tarayici: eslestir(ua, TARAYICILAR),
    isletimSistemi: eslestir(ua, SISTEMLER),
    cihaz: cihazTuru(ua),
  };
}
