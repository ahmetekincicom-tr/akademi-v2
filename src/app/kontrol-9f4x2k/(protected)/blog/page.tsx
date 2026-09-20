import { createClient } from "@/lib/supabase/server";
import { blogPanelYazilari } from "@/lib/yazilar";
import { blogPanelMetrikleri, type PanelSonuc, type PanelAralik } from "@/lib/google/ga4-rapor";
import { BlogPanel } from "@/components/admin/BlogPanel";

export const dynamic = "force-dynamic";

function aralikCoz(deger: string | undefined): PanelAralik {
  const n = Number(deger);
  return n === 7 || n === 90 ? n : 30;
}

export default async function BlogListePage({
  searchParams,
}: {
  searchParams: Promise<{ gun?: string }>;
}) {
  const { gun: gunParam } = await searchParams;
  const gun = aralikCoz(gunParam);

  const supabase = await createClient();
  const yazilar = await blogPanelYazilari(supabase);

  // Performans (GA4) — tek batch, N+1 yok. Yapılandırma/hata olursa CMS bozulmaz.
  let metrik: PanelSonuc = { yapilandirildi: false };
  try {
    metrik = await blogPanelMetrikleri(
      yazilar.filter((y) => y.durum === "yayin").map((y) => y.slug),
      gun,
    );
  } catch (e) {
    console.error("[blog-panel] GA4 metrikleri alınamadı:", e);
  }

  const guncelSaat = new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(new Date());

  return <BlogPanel yazilar={yazilar} metrik={metrik} gun={gun} guncelSaat={guncelSaat} />;
}
