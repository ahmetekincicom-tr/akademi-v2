import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTalepler, destekKullanicilari } from "@/lib/destek";
import { DestekMasasi } from "@/components/admin/DestekMasasi";

export default async function AdminDestekPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/kontrol-9f4x2k/giris");

  const talepler = await getTalepler();
  const userIds = talepler.map((t) => t.userId);
  const [kullanicilar, { data: kursSatirlari }] = await Promise.all([
    destekKullanicilari(userIds),
    supabase.from("courses").select("id, baslik").order("created_at"),
  ]);
  const kurslar = (kursSatirlari ?? []).map((k) => ({ id: k.id, ad: k.baslik }));

  return <DestekMasasi benimId={user.id} talepler={talepler} kullanicilar={kullanicilar} kurslar={kurslar} />;
}
