import "server-only";
import { bunnyVideoId, bunnyEmbedUrl } from "@/lib/bunny";
import { videoGomme } from "@/lib/video";

export type Oynatma = { tip: "iframe" | "dosya"; src: string };

/**
 * Resolves a lesson's stored video reference into something the player can
 * render. Runs on the server so Bunny links arrive at the browser already
 * signed and time-limited, and the raw reference never leaves the server.
 */
export function oynatmaCoz(videoUrl: string | null): Oynatma | null {
  if (!videoUrl?.trim()) return null;

  const bunnyId = bunnyVideoId(videoUrl);
  if (bunnyId) {
    const src = bunnyEmbedUrl(bunnyId);
    return src ? { tip: "iframe", src } : null;
  }

  return videoGomme(videoUrl);
}
