import { guvenliUrl } from "@/lib/guvenli-url";

/**
 * Blog "Kaynak" bloğu yardımcıları (saf — editör ve public render ortak).
 *
 * URL yalnız http(s) kabul edilir (guvenliUrl): `javascript:` gibi değerler
 * href'e hiç yazılmaz. Harici bağlantı yeni sekmede açılır; `noopener
 * noreferrer` hem güvenlik (window.opener) hem gizlilik (referrer) içindir.
 */

export const KAYNAK_REL = "noopener noreferrer";

/** Kaynak URL'sinden güvenli href + okunur alan adı; geçersizse null. */
export function kaynakBaglanti(url: string | null | undefined): { href: string; alan: string } | null {
  const href = guvenliUrl(url);
  if (!href) return null;
  try {
    return { href, alan: new URL(href).hostname.replace(/^www\./, "") };
  } catch {
    return null;
  }
}
