import { guvenliUrl } from "@/lib/guvenli-url";

/**
 * Turns a pasted YouTube/Vimeo link into its embed form so the lesson player
 * can drop it straight into an iframe. Anything else is returned untouched and
 * played as a direct file.
 */
export function videoGomme(url: string): { tip: "iframe" | "dosya"; src: string } | null {
  const temiz = url.trim();
  if (!temiz) return null;

  const youtube = temiz.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  );
  if (youtube) return { tip: "iframe", src: `https://www.youtube.com/embed/${youtube[1]}` };

  const vimeo = temiz.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { tip: "iframe", src: `https://player.vimeo.com/video/${vimeo[1]}` };

  // Taninmayan bir deger dogrudan iframe'e/videoya gidiyordu; sadece http(s)
  // kabul et ki "javascript:" veya "data:" tarayicida calisamasin.
  const guvenli = guvenliUrl(temiz);
  if (!guvenli) return null;

  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(guvenli)) return { tip: "dosya", src: guvenli };

  return { tip: "iframe", src: guvenli };
}
