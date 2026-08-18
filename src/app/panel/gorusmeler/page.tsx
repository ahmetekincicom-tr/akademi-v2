import { createClient } from "@/lib/supabase/server";
import { getGorusmeler, getGorusmeAyarlari, hakDurumu, egitimKaydiVarMi } from "@/lib/gorusme";
import { GorusmeGorunumu } from "@/components/panel/GorusmeGorunumu";

export default async function PanelGorusmelerPage() {
  const supabase = await createClient();
  // RLS bu listeyi giriş yapan öğrencinin kendi görüşmeleriyle sınırlar.
  const [gorusmeler, ayarlar, egitimKaydiVar] = await Promise.all([
    getGorusmeler(supabase),
    getGorusmeAyarlari(supabase),
    egitimKaydiVarMi(supabase),
  ]);

  return (
    <GorusmeGorunumu
      gorusmeler={gorusmeler}
      ayarlar={ayarlar}
      hak={hakDurumu(gorusmeler, ayarlar, egitimKaydiVar)}
    />
  );
}
