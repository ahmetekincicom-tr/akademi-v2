import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/seo";
import { dogrulamaIfadesi } from "@/lib/whatsapp/webhook";
import { WhatsappYonetimi, type MesajSatiri } from "@/components/admin/WhatsappYonetimi";

export const dynamic = "force-dynamic";

const SON_MESAJ = 30;

export default async function AdminWhatsappPage() {
  const supabase = await createClient();
  const sir = process.env.WHATSAPP_APP_SECRET?.trim() ?? "";

  const [{ data: ayar }, kisiler, mesajlar, eslesen, baglanan, { data: son }] = await Promise.all([
    supabase.from("whatsapp_baglanti").select("*").eq("id", true).maybeSingle(),
    supabase.from("whatsapp_kisiler").select("wa_id", { count: "exact", head: true }),
    supabase.from("whatsapp_mesajlar").select("id", { count: "exact", head: true }),
    supabase.from("temaslar").select("id", { count: "exact", head: true }).not("wa_id", "is", null),
    supabase.from("temaslar").select("id", { count: "exact", head: true }).not("wa_id", "is", null).not("user_id", "is", null),
    supabase
      .from("whatsapp_mesajlar")
      .select("id, yon, wa_id, metin, tur, zaman, temas_kodu, ctwa_clid")
      .order("zaman", { ascending: false })
      .limit(SON_MESAJ),
  ]);

  // Son mesajlardaki kişilerin adları.
  const idler = [...new Set((son ?? []).map((m) => m.wa_id))];
  const { data: adlar } = idler.length
    ? await supabase.from("whatsapp_kisiler").select("wa_id, ad").in("wa_id", idler)
    : { data: [] as { wa_id: string; ad: string | null }[] };
  const ad = new Map((adlar ?? []).map((k) => [k.wa_id, k.ad]));

  const satirlar: MesajSatiri[] = (son ?? []).map((m) => ({
    id: m.id,
    yon: m.yon === "giden" ? "giden" : "gelen",
    kisi: ad.get(m.wa_id) ?? null,
    numara: m.wa_id,
    metin: m.metin ?? `[${m.tur}]`,
    zaman: m.zaman,
    kod: m.temas_kodu,
    reklam: Boolean(m.ctwa_clid),
  }));

  const senkron = (ayar?.senkron && typeof ayar.senkron === "object" ? ayar.senkron : {}) as Record<
    string,
    { request_id?: string; hata?: string } | undefined
  >;

  return (
    <WhatsappYonetimi
      ayar={{
        appId: ayar?.app_id ?? "",
        configId: ayar?.es_config_id ?? "",
        bagli: Boolean(ayar?.waba_id && ayar?.baglanma_zamani),
        numara: ayar?.gorunen_numara ?? null,
        ad: ayar?.dogrulanmis_ad ?? null,
        uygulamaylaBirlikte: ayar?.uygulamayla_birlikte ?? false,
        baglanmaZamani: ayar?.baglanma_zamani ?? null,
        senkronKisiler: senkron.kisiler?.request_id ? "istendi" : senkron.kisiler?.hata ? "hata" : null,
        senkronGecmis: senkron.gecmis?.request_id ? "istendi" : senkron.gecmis?.hata ? "hata" : null,
      }}
      sirVar={Boolean(sir)}
      sistemAnahtariVar={Boolean(process.env.WHATSAPP_SISTEM_TOKENI?.trim())}
      // Trailing slash şart: çizgisiz adrese gelen POST yönlendiriliyor (route.ts).
      webhookAdresi={`${SITE_URL}/api/whatsapp/webhook/`}
      dogrulama={sir ? dogrulamaIfadesi(sir) : null}
      sayilar={{
        kisi: kisiler.count ?? 0,
        mesaj: mesajlar.count ?? 0,
        eslesen: eslesen.count ?? 0,
        baglanan: baglanan.count ?? 0,
      }}
      mesajlar={satirlar}
    />
  );
}
