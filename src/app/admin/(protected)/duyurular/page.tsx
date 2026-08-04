import { createClient } from "@/lib/supabase/server";
import { getTumDuyurular } from "@/lib/duyuru-sorgu";
import { DuyuruYonetimi } from "@/components/admin/DuyuruYonetimi";

export default async function AdminDuyurularPage() {
  const supabase = await createClient();
  const [duyurular, { count }] = await Promise.all([
    getTumDuyurular(),
    supabase
      .from("push_cihazlar")
      .select("id", { count: "exact", head: true })
      .is("gecersiz_tarihi", null),
  ]);

  return <DuyuruYonetimi duyurular={duyurular} cihazSayisi={count ?? 0} />;
}
