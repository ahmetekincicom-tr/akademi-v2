import "server-only";

import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { telefonRakam } from "@/lib/meta/kimlik";
import { temasiProfileBagla } from "@/lib/temas-bagla";
import type { WhatsappMesaji } from "@/lib/whatsapp/webhook";

type Servis = NonNullable<ReturnType<typeof gorevIstemcisi>>;

/**
 * Webhook'tan gelen mesajları yazar ve eşleştirir.
 *
 *  1. Mesajlar whatsapp_mesajlar'a (wa_mesaj_id benzersiz: Meta aynı mesajı
 *     birden çok kez gönderebiliyor, tekrar sessizce eleniyor).
 *  2. Kişi whatsapp_kisiler'e (ilk/son mesaj, ad, takip kodu, reklam tıklaması).
 *  3. Takip kodlu ilk mesajda temas kaydına numara yazılıyor (temaslar.wa_id).
 *  4. Bu numarayla açılmış bir hesap varsa tıklama kimliği ona bağlanıyor.
 *     Hesap sonradan açılırsa bağlama panel girişinde yapılıyor
 *     (hesabaWhatsappTemasiBagla).
 *
 * Hata yutuluyor ama günlüğe yazılıyor: webhook'a hata döndürmek Meta'nın
 * aynı bildirimi tekrar tekrar göndermesine ve sonunda ucu kapatmasına yol
 * açar; kaybolan bir eşleşme panelden elle tamamlanabiliyor.
 */
export async function whatsappMesajlariniKaydet(mesajlar: WhatsappMesaji[]): Promise<void> {
  if (!mesajlar.length) return;
  const servis = gorevIstemcisi();
  if (!servis) {
    console.error("[whatsapp] servis anahtarı yok; mesajlar yazılamadı");
    return;
  }

  try {
    const { error } = await servis.from("whatsapp_mesajlar").upsert(
      mesajlar.map((m) => ({
        wa_mesaj_id: m.waMesajId,
        yon: m.yon,
        wa_id: m.waId,
        telefon_numara_id: m.telefonNumaraId,
        tur: m.tur,
        metin: m.metin,
        zaman: m.zaman.toISOString(),
        temas_kodu: m.temasKodu,
        ctwa_clid: m.ctwaClid,
        referral: (m.referral ?? null) as never,
        ham: m.ham as never,
      })),
      { onConflict: "wa_mesaj_id", ignoreDuplicates: true },
    );
    if (error) console.error("[whatsapp] mesajlar yazılamadı:", error.message);

    // Kişi başına bir kez işle.
    const kisiler = new Map<string, WhatsappMesaji[]>();
    for (const m of mesajlar) kisiler.set(m.waId, [...(kisiler.get(m.waId) ?? []), m]);
    for (const [waId, liste] of kisiler) await kisiyiIsle(servis, waId, liste);
  } catch (hata) {
    console.error("[whatsapp] kayıt başarısız:", hata);
  }
}

async function kisiyiIsle(servis: Servis, waId: string, liste: WhatsappMesaji[]): Promise<void> {
  const zamanlar = liste.map((m) => m.zaman.getTime());
  const gelen = liste.filter((m) => m.yon === "gelen");
  const ad = gelen.find((m) => m.ad)?.ad ?? null;
  const kod = gelen.find((m) => m.temasKodu)?.temasKodu ?? null;
  const ctwa = gelen.find((m) => m.ctwaClid)?.ctwaClid ?? null;

  const { data: mevcut } = await servis
    .from("whatsapp_kisiler")
    .select("wa_id, ilk_mesaj, son_mesaj, temas_kodu, ctwa_clid, user_id, ad")
    .eq("wa_id", waId)
    .maybeSingle();

  const enErken = Math.min(...zamanlar, mevcut?.ilk_mesaj ? Date.parse(mevcut.ilk_mesaj) : Infinity);
  const enGec = Math.max(...zamanlar, mevcut?.son_mesaj ? Date.parse(mevcut.son_mesaj) : 0);
  // İlk kod ve ilk reklam tıklaması kalıcı: sonraki mesaj bunları ezmiyor.
  const temasKodu = mevcut?.temas_kodu ?? kod;

  let userId = mevcut?.user_id ?? null;
  if (!userId) userId = await numaradanHesap(servis, waId);

  await servis.from("whatsapp_kisiler").upsert({
    wa_id: waId,
    ad: ad ?? mevcut?.ad ?? null,
    ilk_mesaj: new Date(enErken).toISOString(),
    son_mesaj: new Date(enGec).toISOString(),
    temas_kodu: temasKodu,
    ctwa_clid: mevcut?.ctwa_clid ?? ctwa,
    user_id: userId,
    updated_at: new Date().toISOString(),
  });

  if (!kod) return;

  // Temas kaydına numarayı yaz — yalnızca boşsa: kod başka bir numaradan
  // yazılmışsa (mesaj iletilmiş olabilir) ilk eşleşme korunuyor.
  await servis
    .from("temaslar")
    .update({ wa_id: waId, wa_eslesme_zamani: new Date().toISOString() })
    .eq("kod", kod)
    .is("wa_id", null);

  if (userId) await hesabaBagla(servis, userId, kod);
}

/** Tıklama kimliğini hesaba bağlar — hesapta zaten bir kod yoksa. */
async function hesabaBagla(servis: Servis, userId: string, kod: string): Promise<void> {
  const { data: profil } = await servis.from("profiles").select("temas_kodu").eq("id", userId).maybeSingle();
  if (!profil || profil.temas_kodu) return;
  const sonuc = await temasiProfileBagla(servis, kod, userId);
  if (sonuc.error) console.error("[whatsapp] otomatik bağlama:", sonuc.error);
}

/**
 * Bu WhatsApp numarasıyla açılmış hesap. Telefon profilde farklı yazımlarla
 * durabiliyor (+90 5xx, 05xx, 5xx); son 10 haneyle aday çekilip ülke kodlu
 * biçimde karşılaştırılıyor. Birden fazla hesap aynı numarayı taşıyorsa hiçbiri
 * seçilmiyor: yanlış kişiye atıf, hiç atıf olmamasından kötü.
 */
async function numaradanHesap(servis: Servis, waId: string): Promise<string | null> {
  const son10 = waId.slice(-10);
  const { data } = await servis.from("profiles").select("id, telefon").ilike("telefon", `%${son10}`).limit(5);
  const eslesen = (data ?? []).filter((p) => telefonRakam(p.telefon) === waId);
  return eslesen.length === 1 ? eslesen[0]!.id : null;
}

/**
 * Panel girişinde: hesabın telefonu, takip kodlu mesaj atmış bir WhatsApp
 * numarasıyla aynıysa ve hesapta henüz kod yoksa tıklama kimliğini bağla.
 * (Mesaj önce, hesap sonra açıldığında eşleşme burada tamamlanıyor.)
 */
export async function hesabaWhatsappTemasiBagla(
  servis: Servis,
  profil: { id: string; telefon: string | null; temas_kodu: string | null },
): Promise<void> {
  if (profil.temas_kodu || !profil.telefon) return;
  const waId = telefonRakam(profil.telefon);
  if (!waId) return;

  const { data: temas } = await servis
    .from("temaslar")
    .select("kod")
    .eq("wa_id", waId)
    .is("user_id", null)
    .order("wa_eslesme_zamani", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!temas) return;

  const sonuc = await temasiProfileBagla(servis, temas.kod, profil.id);
  if (sonuc.error) {
    console.error("[whatsapp] panel girişinde bağlama:", sonuc.error);
    return;
  }
  await servis.from("whatsapp_kisiler").update({ user_id: profil.id }).eq("wa_id", waId).is("user_id", null);
}

/**
 * Telefon rehberindeki adlar (bağlantıdan sonraki kişi senkronizasyonu).
 * Kişinin WhatsApp profil adı varsa ezilmiyor; yalnızca boş adlar dolduruluyor.
 */
export async function whatsappRehberiniKaydet(rehber: { waId: string; ad: string }[]): Promise<void> {
  if (!rehber.length) return;
  const servis = gorevIstemcisi();
  if (!servis) return;
  try {
    const idler = rehber.map((r) => r.waId);
    const { data: mevcut } = await servis.from("whatsapp_kisiler").select("wa_id, ad").in("wa_id", idler);
    const adli = new Set((mevcut ?? []).filter((k) => k.ad).map((k) => k.wa_id));
    const yeni = rehber.filter((r) => !adli.has(r.waId));
    if (!yeni.length) return;
    const { error } = await servis.from("whatsapp_kisiler").upsert(
      yeni.map((r) => ({ wa_id: r.waId, ad: r.ad, updated_at: new Date().toISOString() })),
    );
    if (error) console.error("[whatsapp] rehber yazılamadı:", error.message);
  } catch (hata) {
    console.error("[whatsapp] rehber kaydı başarısız:", hata);
  }
}
