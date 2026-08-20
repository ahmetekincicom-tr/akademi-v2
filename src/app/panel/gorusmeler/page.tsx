import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGorusmeler, getGorusmeAyarlari, hakDurumu, egitimKaydiVarMi } from "@/lib/gorusme";
import { GorusmeGorunumu } from "@/components/panel/GorusmeGorunumu";
import { panelKullanicisi } from "@/lib/panel-kapsam";

export default async function PanelGorusmelerPage() {
  const supabase = await createClient();
  const kullanici = await panelKullanicisi();
  if (!kullanici) redirect("/giris");

  // Kapsam AÇIK veriliyor: RLS yöneticiye herkesin görüşmesini açıyor ve
  // burası "benim görüşmelerim" ekranı.
  const [gorusmeler, ayarlar, egitimKaydiVar] = await Promise.all([
    getGorusmeler(supabase, kullanici),
    getGorusmeAyarlari(supabase),
    egitimKaydiVarMi(supabase, kullanici),
  ]);

  return (
    <GorusmeGorunumu
      gorusmeler={gorusmeler}
      ayarlar={ayarlar}
      hak={hakDurumu(gorusmeler, ayarlar, egitimKaydiVar)}
    />
  );
}
