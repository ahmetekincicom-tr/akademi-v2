import { KurumsalFormu } from "@/components/admin/KurumsalFormu";
import { getKurumsalSss } from "@/lib/kurumsal";

export const dynamic = "force-dynamic";

export default async function AdminKurumsalPage() {
  const sss = await getKurumsalSss();
  return <KurumsalFormu sss={sss} />;
}
