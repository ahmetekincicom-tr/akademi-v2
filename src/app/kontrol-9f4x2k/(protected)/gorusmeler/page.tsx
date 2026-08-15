import { createClient } from "@/lib/supabase/server";
import { getGorusmeler, getGorusmeAyarlari } from "@/lib/gorusme";
import { GorusmeYonetimi } from "@/components/admin/GorusmeYonetimi";

export default async function AdminGorusmelerPage() {
  const supabase = await createClient();
  // Yönetici RLS politikası tüm satırları görmesine izin verir.
  const [gorusmeler, ayarlar] = await Promise.all([
    getGorusmeler(supabase),
    getGorusmeAyarlari(supabase),
  ]);

  return <GorusmeYonetimi gorusmeler={gorusmeler} ayarlar={ayarlar} />;
}
