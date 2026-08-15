import { createClient } from "@/lib/supabase/server";
import { getYorumlar } from "@/lib/icerik";
import { YorumYonetimi } from "@/components/admin/YorumYonetimi";

export default async function AdminYorumlarPage() {
  const supabase = await createClient();
  const [yorumlar, { data: courses }] = await Promise.all([
    // Admin session, so RLS returns unpublished rows too.
    getYorumlar(supabase),
    supabase.from("courses").select("id, baslik").order("created_at"),
  ]);

  return (
    <YorumYonetimi yorumlar={yorumlar} kurslar={(courses ?? []).map((c) => ({ id: c.id, ad: c.baslik }))} />
  );
}
