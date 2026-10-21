/**
 * Gelen isteğin sitenin dışarıdan görünen kökü.
 *
 * `istek.url` yerine başlıklar okunuyor: Vercel'de istek dahili bir adresle
 * gelebiliyor ve o adrese yönlendirmek kişiyi sitenin dışına atardı
 * (gerekçesi api/odeme/iyzico/sonuc'ta).
 */
export function kokAdres(istek: Request): string {
  const h = istek.headers;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return new URL(istek.url).origin;
  const sema = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${sema}://${host}`;
}
