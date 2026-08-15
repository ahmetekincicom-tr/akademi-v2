import { createClient } from "@/lib/supabase/server";
import { logoUrl } from "@/lib/icerik";
import { ReferansYonetimi, type AdminReferans } from "@/components/admin/ReferansYonetimi";

export default async function AdminReferanslarPage() {
  const supabase = await createClient();
  // Admin session, so unpublished rows come back too.
  const { data } = await supabase
    .from("referanslar")
    .select("id, ad, sektor, logo_yolu, site_url, sira, yayinda")
    .order("sira", { ascending: true })
    .order("created_at", { ascending: true });

  const referanslar: AdminReferans[] = (data ?? []).map((r) => ({
    id: r.id,
    ad: r.ad,
    sektor: r.sektor ?? "",
    logoYolu: r.logo_yolu,
    logoUrl: logoUrl(r.logo_yolu),
    siteUrl: r.site_url ?? "",
    sira: r.sira,
    yayinda: r.yayinda,
  }));

  return <ReferansYonetimi referanslar={referanslar} />;
}
