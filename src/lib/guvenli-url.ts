/**
 * Only http(s) URLs are safe to put in an href or an iframe src. A stored
 * `javascript:` or `data:text/html` value would otherwise run in the browser of
 * everyone who loads the page — these fields are admin-entered, so this is
 * mainly a guard against a compromised admin account or a future editor role,
 * but the check costs nothing.
 */
export function guvenliUrl(deger: string | null | undefined): string | null {
  if (!deger) return null;
  const temiz = deger.trim();
  if (!temiz) return null;

  try {
    // Şema yazılmamışsa https varsay: "ornek.com" gibi girdiler çalışsın.
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(temiz) ? temiz : `https://${temiz}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Redirect targets must stay on this site. A leading "//" or a backslash can be
 * read as a host by some browsers, so only a single-slash path is accepted.
 */
export function guvenliYol(deger: string | null | undefined, varsayilan: string): string {
  if (!deger) return varsayilan;
  const temiz = deger.trim();
  if (!temiz.startsWith("/") || temiz.startsWith("//") || temiz.includes("\\")) return varsayilan;
  return temiz;
}
