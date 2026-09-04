import { depoUrl } from "@/lib/depo";

/**
 * Kapak görselinin adresi — kendi alan adımızdan.
 *
 * Eskiden doğrudan Supabase CDN adresini döndürüyordu; gerekçesi ve yeni yolu
 * lib/depo.ts içinde.
 */
export function kapakUrl(yol: string | null): string | null {
  return depoUrl("kapaklar", yol);
}
