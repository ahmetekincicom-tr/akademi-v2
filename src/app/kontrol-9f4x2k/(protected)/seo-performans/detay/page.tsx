import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { blogPanelYazilari, getKategoriler } from "@/lib/yazilar";
import { gscSayfaDetay, type SeoAralik, type SeoSayfaDetaySonuc } from "@/lib/google/gsc-site";
import { ga4SayfaOzet, type Ga4SayfaOzet } from "@/lib/google/ga4-site";
import { sayfaSinifla, type SayfaReferanslari } from "@/lib/seo/sayfa-turu";
import { SeoSayfaDetay } from "@/components/admin/SeoSayfaDetay";

export const dynamic = "force-dynamic";

function aralikCoz(deger: string | undefined): SeoAralik {
  const n = Number(deger);
  return n === 7 || n === 90 ? n : 28;
}

/** Yol normalizasyonu (dashboard ile aynı biçim). */
function yolCoz(ham: string | undefined): string {
  if (!ham) return "/";
  let y = ham.split("?")[0].split("#")[0];
  if (!y.startsWith("/")) y = `/${y}`;
  y = y.replace(/\/+$/, "");
  return y === "" ? "/" : y;
}

export default async function SeoDetayPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string; gun?: string }>;
}) {
  const { url, gun: gunParam } = await searchParams;
  const yol = yolCoz(url);
  const gun = aralikCoz(gunParam);

  const supabase = await createClient();
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
  const sinif = sayfaSinifla(yol, ref);

  let gsc: SeoSayfaDetaySonuc = { yapilandirildi: false };
  let gscHata = false;
  let ga4: Ga4SayfaOzet = { yapilandirildi: false };
  let ga4Hata = false;
  const [gscY, ga4Y] = await Promise.allSettled([gscSayfaDetay(yol), ga4SayfaOzet(yol, gun)]);
  if (gscY.status === "fulfilled") gsc = gscY.value;
  else {
    console.error("[seo-detay] GSC alınamadı:", gscY.reason);
    gscHata = true;
  }
  if (ga4Y.status === "fulfilled") ga4 = ga4Y.value;
  else {
    console.error("[seo-detay] GA4 alınamadı:", ga4Y.reason);
    ga4Hata = true;
  }

  return (
    <main className="p-4 pb-14 sm:p-7">
      <Link
        href={`/kontrol-9f4x2k/seo-performans?gun=${gun}`}
        className="text-[13px] font-semibold text-brand hover:text-ink"
      >
        ← SEO performansı
      </Link>
      <SeoSayfaDetay
        yol={yol}
        baslik={sinif.baslik}
        tur={sinif.tur}
        gsc={gsc}
        gscHata={gscHata}
        ga4={ga4}
        ga4Hata={ga4Hata}
      />
    </main>
  );
}
