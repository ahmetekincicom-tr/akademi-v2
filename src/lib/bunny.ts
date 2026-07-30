import "server-only";
import { createHash } from "crypto";

/**
 * Bunny Stream embeds are signed on the server so a student never receives a
 * reusable video URL. The signing key lives only in the environment — putting
 * it in the database or the client bundle would defeat the whole point.
 */

const LIBRARY_ID = process.env.BUNNY_LIBRARY_ID;
const TOKEN_KEY = process.env.BUNNY_TOKEN_KEY;

// Long enough to watch a lesson without re-signing, short enough that a copied
// link is useless by the time it's shared.
const GECERLILIK_SANIYE = 60 * 60 * 3;

const GUID_DESENI = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Accepts either a bare Bunny video GUID or a pasted iframe/play URL. */
export function bunnyVideoId(deger: string): string | null {
  const temiz = deger.trim();
  if (GUID_DESENI.test(temiz)) return temiz;

  const eslesme = temiz.match(
    /(?:iframe\.mediadelivery\.net\/(?:embed|play)|b-cdn\.net)\/(?:\d+\/)?([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
  );
  return eslesme ? eslesme[1] : null;
}

export function bunnyDurumu() {
  return {
    kutuphane: Boolean(LIBRARY_ID),
    imzalama: Boolean(TOKEN_KEY),
  };
}

export function bunnyEmbedUrl(videoId: string): string | null {
  if (!LIBRARY_ID) return null;

  const temel = `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${videoId}`;
  if (!TOKEN_KEY) return temel;

  const expires = Math.floor(Date.now() / 1000) + GECERLILIK_SANIYE;
  const token = createHash("sha256").update(`${TOKEN_KEY}${videoId}${expires}`).digest("hex");
  return `${temel}?token=${token}&expires=${expires}`;
}
