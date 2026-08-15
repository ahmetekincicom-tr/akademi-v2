import { createClient } from "@/lib/supabase/server";
import { getYasalSayfalar } from "@/lib/yasal";
import { YasalYonetimi } from "@/components/admin/YasalYonetimi";

export default async function AdminYasalPage() {
  const supabase = await createClient();
  // Admin session, so unpublished documents come back too.
  const sayfalar = await getYasalSayfalar(supabase);

  return <YasalYonetimi sayfalar={sayfalar} />;
}
