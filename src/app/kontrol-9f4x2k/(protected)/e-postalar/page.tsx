import { createClient } from "@/lib/supabase/server";
import { EpostaYonetimi } from "@/components/admin/EpostaYonetimi";
import { epostaYapilandirildiMi } from "@/lib/eposta";

export const dynamic = "force-dynamic";

/** Günlükte kaç satır gösterilecek. Tanılama için son birkaç yüz kayıt yeter. */
const GUNLUK_LIMIT = 150;

export default async function AdminEpostalarPage() {
  const supabase = await createClient();

  const [{ data: akislar }, { data: gunluk }] = await Promise.all([
    supabase.from("eposta_akislari").select("anahtar, acik, guncelleme"),
    supabase
      .from("eposta_gunlugu")
      .select("id, akis, alici, konu, durum, sebep, created_at")
      .order("created_at", { ascending: false })
      .limit(GUNLUK_LIMIT),
  ]);

  // Tabloda satırı olmayan akış hiç kapatılmamış demek; varsayılan açık.
  const kapali = new Set((akislar ?? []).filter((a) => a.acik === false).map((a) => a.anahtar));

  return (
    <EpostaYonetimi
      kapaliAkislar={[...kapali]}
      gunluk={(gunluk ?? []).map((g) => ({
        id: g.id,
        akis: g.akis,
        alici: g.alici ?? "",
        konu: g.konu ?? "",
        durum: g.durum,
        sebep: g.sebep ?? "",
        tarih: g.created_at,
      }))}
      yapilandirildi={epostaYapilandirildiMi()}
    />
  );
}
