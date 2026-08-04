/** Kapak kovası herkese açık, bu yüzden saklanan yol doğrudan CDN adresine karşılık geliyor. */
export function kapakUrl(yol: string | null): string | null {
  if (!yol) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/kapaklar/${yol}`;
}
