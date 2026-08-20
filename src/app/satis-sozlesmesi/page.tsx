import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { YasalSayfaGorunumu } from "@/components/site/YasalSayfaGorunumu";
import { getYasalSayfa, getYasalSayfalar } from "@/lib/yasal";

const SLUG = "satis-sozlesmesi";

// Gerekçe: src/app/gizlilik-politikasi/page.tsx
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const sayfa = await getYasalSayfa(SLUG);
  return {
    title: `${sayfa?.baslik ?? "Mesafeli Satış Sözleşmesi"} — Ahmet Ekinci Akademi`,
    description: sayfa?.ozet || undefined,
  };
}

export default async function Sayfa() {
  const [sayfa, hepsi] = await Promise.all([getYasalSayfa(SLUG), getYasalSayfalar()]);
  if (!sayfa) notFound();

  const digerleri = hepsi.filter((s) => s.slug !== SLUG && s.yayinda);
  return <YasalSayfaGorunumu sayfa={sayfa} digerleri={digerleri} />;
}
