import { createClient } from "@/lib/supabase/server";
import { EpostaYonetimi } from "@/components/admin/EpostaYonetimi";
import { epostaYapilandirildiMi } from "@/lib/eposta";

export const dynamic = "force-dynamic";

/** Günlükte kaç satır gösterilecek. Tanılama için son birkaç yüz kayıt yeter. */
const GUNLUK_LIMIT = 150;

export default async function AdminEpostalarPage() {
  const supabase = await createClient();

  const [{ data: akislar }, { data: gunluk }] = await Promise.all([
    supabase.from("eposta_akislari").select("anahtar, acik, konu, ust_etiket, baslik, ozet, eylem_etiketi"),
    supabase
      .from("eposta_gunlugu")
      .select("id, akis, alici, konu, durum, sebep, created_at")
      .order("created_at", { ascending: false })
      .limit(GUNLUK_LIMIT),
  ]);

  // Tabloda satırı olmayan akış hiç kapatılmamış demek; varsayılan açık.
  const kapali = new Set((akislar ?? []).filter((a) => a.acik === false).map((a) => a.anahtar));

  // Metni özelleştirilmiş akışlar. Boş alanlar taşınmıyor: ekranda boş kutu
  // "varsayılan geçerli" demek ve tabloda da öyle duruyor.
  const metinler = Object.fromEntries(
    (akislar ?? []).map((a) => [
      a.anahtar,
      {
        konu: a.konu ?? "",
        ustEtiket: a.ust_etiket ?? "",
        baslik: a.baslik ?? "",
        ozet: a.ozet ?? "",
        eylemEtiketi: a.eylem_etiketi ?? "",
      },
    ]),
  );

  return (
    <EpostaYonetimi
      kapaliAkislar={[...kapali]}
      metinler={metinler}
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
