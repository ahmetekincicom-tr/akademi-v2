import { createClient } from "@/lib/supabase/server";
import { MetaYonetimi } from "@/components/admin/MetaYonetimi";
import { metaAyari, metaYapilandirildiMi } from "@/lib/meta/ayar";

export const dynamic = "force-dynamic";

/** Günlükte kaç satır gösterilecek. Tanılama için son birkaç yüz kayıt yeter. */
const GUNLUK_LIMIT = 150;
/** Eşleşmeyi bekleyen temas kayıtları. Daha eskisi zaten kullanılmıyor. */
const TEMAS_LIMIT = 30;

export default async function AdminMetaPage() {
  const supabase = await createClient();

  const [{ data: akislar }, { data: gunluk }, { data: temaslar }, ayar] = await Promise.all([
    supabase.from("meta_akislari").select("anahtar, acik"),
    supabase
      .from("meta_olaylari")
      .select("id, olay, event_id, durum, sebep, deneme, ozel, created_at")
      .order("created_at", { ascending: false })
      .limit(GUNLUK_LIMIT),
    supabase
      .from("temaslar")
      .select("kod, yer, izin, user_id, created_at")
      .is("user_id", null)
      .order("created_at", { ascending: false })
      .limit(TEMAS_LIMIT),
    metaAyari(),
  ]);

  // Tabloda satırı olmayan olay hiç kapatılmamış demek; varsayılan açık.
  const kapali = new Set((akislar ?? []).filter((a) => a.acik === false).map((a) => a.anahtar));

  return (
    <MetaYonetimi
      kapaliOlaylar={[...kapali]}
      gunluk={(gunluk ?? []).map((g) => {
        const ozel = (g.ozel ?? {}) as { value?: number };
        return {
          id: g.id,
          olay: g.olay,
          eventId: g.event_id,
          durum: g.durum,
          sebep: g.sebep ?? "",
          deneme: g.deneme,
          tutar: typeof ozel.value === "number" ? ozel.value : null,
          tarih: g.created_at,
        };
      })}
      temaslar={(temaslar ?? []).map((t) => ({
        kod: t.kod,
        yer: t.yer ?? "",
        izin: t.izin,
        tarih: t.created_at,
      }))}
      yapilandirildi={metaYapilandirildiMi(ayar)}
      pixelVar={Boolean(ayar.pixelId)}
      testModu={Boolean(ayar.testKodu)}
    />
  );
}
