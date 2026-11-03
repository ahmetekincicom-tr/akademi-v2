import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/seo";
import { dogrulamaIfadesi } from "@/lib/whatsapp/webhook";
import { WhatsappYonetimi } from "@/components/admin/WhatsappYonetimi";

export const dynamic = "force-dynamic";

/** WhatsApp kurulumu: Meta uygulaması, webhook değerleri, numara bağlantısı. */
export default async function AdminWhatsappAyarlarPage() {
  const supabase = await createClient();
  const sir = process.env.WHATSAPP_APP_SECRET?.trim() ?? "";
  const { data: ayar } = await supabase.from("whatsapp_baglanti").select("*").eq("id", true).maybeSingle();

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
    />
  );
}
