import { createClient } from "@/lib/supabase/server";
import { MesajYonetimi, type MesajSatir } from "@/components/admin/MesajYonetimi";

export default async function AdminMesajlarPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("iletisim_mesajlari")
    .select("id, tur, ad, email, telefon, sirket, konu, mesaj, okundu, created_at, courses(baslik)")
    .order("created_at", { ascending: false });

  const mesajlar: MesajSatir[] = (data ?? []).map((m) => ({
    id: m.id,
    tur: m.tur,
    ad: m.ad,
    email: m.email,
    telefon: m.telefon ?? "",
    sirket: m.sirket ?? "",
    konu: m.konu ?? "",
    mesaj: m.mesaj,
    program: m.courses?.baslik ?? "—",
    okundu: m.okundu,
    tarih: m.created_at,
  }));

  return <MesajYonetimi mesajlar={mesajlar} />;
}
