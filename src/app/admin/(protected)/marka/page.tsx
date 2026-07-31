import { createClient } from "@/lib/supabase/server";
import { getMarka } from "@/lib/marka";
import { MarkaYonetimi } from "@/components/admin/MarkaYonetimi";

export const dynamic = "force-dynamic";

export default async function AdminMarkaPage() {
  const supabase = await createClient();
  const marka = await getMarka(supabase);

  return <MarkaYonetimi marka={marka} />;
}
