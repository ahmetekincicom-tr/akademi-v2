import { createClient } from "@/lib/supabase/server";
import { blogPanelYazilari, getKategoriler } from "@/lib/yazilar";
import { gscSiteMetrikleri, type SeoAralik, type SeoSiteSonuc } from "@/lib/google/gsc-site";
import { ga4OrganikOzet, type Ga4OrganikOzet } from "@/lib/google/ga4-site";
import { sayfaSinifla, type SayfaReferanslari, type SayfaTuru } from "@/lib/seo/sayfa-turu";
import { SeoDashboard, type DashboardSatir } from "@/components/admin/SeoDashboard";

export const dynamic = "force-dynamic";

function aralikCoz(deger: string | undefined): SeoAralik {
  const n = Number(deger);
  return n === 7 || n === 90 ? n : 28;
}
const TURLER: SayfaTuru[] = ["blog", "egitim", "statik", "diger"];
function turCoz(deger: string | undefined): SayfaTuru | "tumu" {
  return deger && (TURLER as string[]).includes(deger) ? (deger as SayfaTuru) : "tumu";
}

export default async function SeoPerformansPage({
  searchParams,
}: {
  searchParams: Promise<{ gun?: string; tur?: string }>;
}) {
  const { gun: gunParam, tur: turParam } = await searchParams;
  const gun = aralikCoz(gunParam);
  const turFiltre = turCoz(turParam);

  const supabase = await createClient();

  // Sınıflandırma referansları (başlık eşlemeleri) — DB'den.
  const [yazilar, kategoriler, { data: kurslar }] = await Promise.all([
    blogPanelYazilari(supabase),
    getKategoriler(supabase),
    supabase.from("courses").select("slug, baslik"),
  ]);
  const ref: SayfaReferanslari = {
    blog: new Map(yazilar.filter((y) => y.durum === "yayin").map((y) => [y.slug, y.baslik])),
    egitim: new Map((kurslar ?? []).map((k) => [k.slug, k.baslik])),
    kategori: new Set(kategoriler.map((k) => k.slug)),
  };

  // GSC (site) + GA4 (organik özet) — bağımsız, batch, cache'li. Biri hata/eksik
  // olsa da dashboard açılır; eksik metrik "—" gösterilir.
  let gsc: SeoSiteSonuc = { yapilandirildi: false };
  let ga4: Ga4OrganikOzet = { yapilandirildi: false };
  const [gscY, ga4Y] = await Promise.allSettled([gscSiteMetrikleri(gun), ga4OrganikOzet(gun)]);
  if (gscY.status === "fulfilled") gsc = gscY.value;
  else console.error("[seo-dashboard] GSC alınamadı:", gscY.reason);
  if (ga4Y.status === "fulfilled") ga4 = ga4Y.value;
  else console.error("[seo-dashboard] GA4 organik alınamadı:", ga4Y.reason);

  // Sayfaları sınıflandır (auth/panel yollarını dışarıda bırak).
  const satirlar: DashboardSatir[] = gsc.yapilandirildi
    ? gsc.sayfalar
        .filter((s) => !/^\/(giris|kayit|panel|kontrol-9f4x2k|sifre|odeme|cevrimdisi)/.test(s.yol))
        .map((s) => {
          const sinif = sayfaSinifla(s.yol, ref);
          return { ...s, tur: sinif.tur, baslik: sinif.baslik };
        })
    : [];

  const guncelSaat = new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(new Date());

  return (
    <SeoDashboard
      gun={gun}
      turFiltre={turFiltre}
      satirlar={satirlar}
      toplam={gsc.yapilandirildi ? gsc.toplam : null}
      gscYapili={gsc.yapilandirildi}
      ga4={ga4}
      guncelSaat={guncelSaat}
    />
  );
}
