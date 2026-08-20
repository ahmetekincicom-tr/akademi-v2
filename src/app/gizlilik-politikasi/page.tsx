import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { YasalSayfaGorunumu } from "@/components/site/YasalSayfaGorunumu";
import { getYasalSayfa, getYasalSayfalar } from "@/lib/yasal";

const SLUG = "gizlilik-politikasi";

/*
  Bu sayfa bilerek önbelleğe alınmıyor.

  YasalSayfaGorunumu, isteğin native uygulamadan gelip gelmediğine bakıyor
  (Apple 3.1.3: uygulama içinde satış ve ödeme yüzeyleri gizleniyor) ve bu
  kontrol headers() okuyor. headers() sayfayı zaten dinamik render'a zorluyor;
  buraya revalidate yazmak, etkisi olmayan bir sayı bırakmak olurdu.
*/
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const sayfa = await getYasalSayfa(SLUG);
  return {
    title: `${sayfa?.baslik ?? "Gizlilik ve Güvenlik Politikası"} — Ahmet Ekinci Akademi`,
    description: sayfa?.ozet || undefined,
  };
}

export default async function Sayfa() {
  const [sayfa, hepsi] = await Promise.all([getYasalSayfa(SLUG), getYasalSayfalar()]);
  if (!sayfa) notFound();

  const digerleri = hepsi.filter((s) => s.slug !== SLUG && s.yayinda);
  return <YasalSayfaGorunumu sayfa={sayfa} digerleri={digerleri} />;
}
