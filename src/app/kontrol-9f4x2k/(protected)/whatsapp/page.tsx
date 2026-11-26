import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { kimlikGecerliMi } from "@/lib/whatsapp/ortak";
import { kaynakBul, mesajOnizleme, numaraBicimle } from "@/lib/whatsapp/gorunum";
import {
  WhatsappGelenKutusu,
  type Konusma,
  type KonusmaMesaji,
  type KisiDetayi,
} from "@/components/admin/WhatsappGelenKutusu";

export const dynamic = "force-dynamic";

/** Listede gösterilen en çok sohbet ve önizleme için okunan son mesaj sayısı. */
const SOHBET_SINIRI = 300;
const ONIZLEME_MESAJI = 1500;
const KONUSMA_SINIRI = 400;

/**
 * WhatsApp gelen kutusu: solda sohbetler, ortada seçili konuşma, sağda kişinin
 * kaynağı (takip kodu, reklam) ve bağlı hesabı. Kurulum ayrı sayfada
 * (whatsapp/ayarlar); bağlantı yoksa oraya yönlendiriliyor.
 *
 * Yanıtlar telefondaki WhatsApp Business uygulamasından veriliyor; gönderilen
 * yanıt webhook'la (smb_message_echoes) buraya kendiliğinden düşüyor.
 */
export default async function AdminWhatsappPage({ searchParams }: { searchParams: Promise<{ k?: string }> }) {
  const { k } = await searchParams;
  const supabase = await createClient();

  const { data: ayar } = await supabase
    .from("whatsapp_baglanti")
    .select("waba_id, baglanma_zamani, gorunen_numara, dogrulanmis_ad")
    .eq("id", true)
    .maybeSingle();
  if (!ayar?.waba_id || !ayar.baglanma_zamani) redirect("/kontrol-9f4x2k/whatsapp/ayarlar/");

  const [{ data: kisiler }, { data: sonMesajlar }, mesajSayisi, eslesen, baglanan] = await Promise.all([
    supabase
      .from("whatsapp_kisiler")
      .select("wa_id, ad, ilk_mesaj, son_mesaj, temas_kodu, ctwa_clid, user_id")
      .not("son_mesaj", "is", null)
      .order("son_mesaj", { ascending: false })
      .limit(SOHBET_SINIRI),
    supabase
      .from("whatsapp_mesajlar")
      .select("wa_id, yon, metin, tur, zaman")
      .order("zaman", { ascending: false })
      .limit(ONIZLEME_MESAJI),
    supabase.from("whatsapp_mesajlar").select("id", { count: "exact", head: true }),
    supabase.from("temaslar").select("id", { count: "exact", head: true }).not("wa_id", "is", null),
    supabase.from("temaslar").select("id", { count: "exact", head: true }).not("wa_id", "is", null).not("user_id", "is", null),
  ]);

  // Her kişinin en son mesajı (liste önizlemesi ve "yanıt bekliyor").
  const son = new Map<string, { yon: string; metin: string | null; tur: string }>();
  for (const m of sonMesajlar ?? []) if (!son.has(m.wa_id)) son.set(m.wa_id, m);

  const konusmalar: Konusma[] = (kisiler ?? []).map((kisi) => {
    const s = son.get(kisi.wa_id);
    return {
      waId: kisi.wa_id,
      ad: kisi.ad,
      numara: numaraBicimle(kisi.wa_id),
      sonZaman: kisi.son_mesaj!,
      onizleme: s ? mesajOnizleme(s) : "",
      sonGiden: s?.yon === "giden",
      yanitBekliyor: s?.yon === "gelen",
      kod: kisi.temas_kodu,
      reklam: Boolean(kisi.ctwa_clid),
      hesap: Boolean(kisi.user_id),
    };
  });

  const seciliId = k && kimlikGecerliMi(k) ? k : (konusmalar[0]?.waId ?? null);
  const seciliKisi = (kisiler ?? []).find((x) => x.wa_id === seciliId) ?? null;

  let mesajlar: KonusmaMesaji[] = [];
  let detay: KisiDetayi | null = null;
  if (seciliKisi) {
    const [{ data: satirlar }, { data: temas }, { data: profil }] = await Promise.all([
      supabase
        .from("whatsapp_mesajlar")
        .select("id, yon, metin, tur, zaman, temas_kodu, ctwa_clid, referral")
        .eq("wa_id", seciliKisi.wa_id)
        .order("zaman", { ascending: false })
        .limit(KONUSMA_SINIRI),
      seciliKisi.temas_kodu
        ? supabase
            .from("temaslar")
            .select("kod, created_at, yer, referrer, fbc, gclid")
            .eq("kod", seciliKisi.temas_kodu)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      seciliKisi.user_id
        ? supabase.from("profiles").select("ad, soyad, email, created_at").eq("id", seciliKisi.user_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    mesajlar = (satirlar ?? []).reverse().map((m) => ({
      id: m.id,
      yon: m.yon === "giden" ? "giden" : "gelen",
      metin: m.metin,
      tur: m.tur,
      zaman: m.zaman,
      kod: m.temas_kodu,
      reklam: Boolean(m.ctwa_clid),
    }));

    // Reklam başlığı: WhatsApp'a tıklama reklamının ilk mesajındaki referral.
    const reklamli = (satirlar ?? []).find((m) => m.ctwa_clid && m.referral && typeof m.referral === "object");
    const referral = (reklamli?.referral ?? null) as { headline?: unknown; source_url?: unknown } | null;

    detay = {
      waId: seciliKisi.wa_id,
      ad: seciliKisi.ad,
      numara: numaraBicimle(seciliKisi.wa_id),
      ilkMesaj: seciliKisi.ilk_mesaj,
      kaynak: kaynakBul({
        ctwa: Boolean(seciliKisi.ctwa_clid),
        kod: Boolean(seciliKisi.temas_kodu),
        fbc: temas?.fbc,
        gclid: temas?.gclid,
      }),
      kod: seciliKisi.temas_kodu,
      tiklamaZamani: temas?.created_at ?? null,
      tiklananSayfa: temas?.yer ?? null,
      reklamBasligi: typeof referral?.headline === "string" ? referral.headline : null,
      reklamAdresi: typeof referral?.source_url === "string" ? referral.source_url : null,
      hesap: profil
        ? {
            ad: [profil.ad, profil.soyad].filter(Boolean).join(" ") || "Adsız hesap",
            eposta: profil.email,
            kayit: profil.created_at,
          }
        : null,
    };
  }

  return (
    <WhatsappGelenKutusu
      numara={ayar.gorunen_numara}
      konusmalar={konusmalar}
      seciliId={seciliKisi?.wa_id ?? null}
      secimVar={Boolean(k)}
      mesajlar={mesajlar}
      detay={detay}
      sayilar={{
        sohbet: konusmalar.length,
        mesaj: mesajSayisi.count ?? 0,
        eslesen: eslesen.count ?? 0,
        baglanan: baglanan.count ?? 0,
      }}
    />
  );
}
