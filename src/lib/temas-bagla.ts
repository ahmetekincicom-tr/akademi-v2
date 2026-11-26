import "server-only";

import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { veriHatasi } from "@/lib/auth-hatalari";

type Servis = NonNullable<ReturnType<typeof gorevIstemcisi>>;

/**
 * Bir temas kodunu (sitedeki WhatsApp tıklaması) kişiye bağlar.
 *
 * WhatsApp'tan gelen kişinin hesabı elle açılıyor ve tıklama kimliği ancak
 * bu adımla profile geçiyor. Bu yapılmazsa günler sonra gelen ödeme reklama
 * hiçbir zaman bağlanamaz — WhatsApp yolunun tamamı buna dayanıyor.
 *
 * Üç yerden çağrılıyor ve kural tek: panelde elle yapıştırma (meta/actions →
 * temasiKisiyeBagla), takip kodlu WhatsApp mesajı geldiğinde numarası
 * eşleşen hesap (lib/whatsapp/kaydet) ve kişinin panele girişi
 * (meta/toplama → panelOlcumlemeTazele).
 *
 * Yazımlar service anahtarıyla, cookie istemcisiyle DEĞİL: profiles'ta
 * authenticated rolüne yalnızca birkaç kolonda UPDATE yetkisi var. Reklam
 * atıfı kolonları (fbp, fbc, ilk_ip, ilk_ua, temas_kodu, kaynak, reklam_izni)
 * yalnızca service_role'a açık; bunları normal kullanıcı kendi satırına
 * yazabilseydi atıfı elle uydurabilirdi.
 */
export async function temasiProfileBagla(servis: Servis, kod: string, userId: string): Promise<{ error?: string }> {
  const temiz = kod.trim().toUpperCase();
  if (!/^[A-Z0-9]{4,8}$/.test(temiz)) return { error: "Referans kodu okunamadı." };

  const { data: temas } = await servis
    .from("temaslar")
    .select("id, fbp, fbc, gclid, ga_client_id, ip, ua, izin, user_id")
    .eq("kod", temiz)
    .maybeSingle();

  if (!temas) return { error: "Bu koda ait bir tıklama kaydı yok." };
  if (temas.user_id && temas.user_id !== userId) {
    // Aynı kodun iki kişiye bağlanması, ikinci kişinin satışını birincinin
    // reklamına yazmak demek. Sessizce üzerine yazmak yerine söylüyoruz.
    return { error: "Bu kod başka bir kişiye bağlanmış." };
  }

  const { error } = await servis
    .from("profiles")
    .update({
      fbp: temas.fbp,
      fbc: temas.fbc,
      // Google Ads atıf kimlikleri de fbp/fbc ile aynı anda taşınıyor.
      gclid: temas.gclid,
      ga_client_id: temas.ga_client_id,
      ilk_ip: temas.ip,
      ilk_ua: temas.ua,
      temas_kodu: temiz,
      kaynak: "whatsapp",
      reklam_izni: temas.izin,
      reklam_izni_tarihi: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) return { error: veriHatasi(error) };

  await servis
    .from("temaslar")
    .update({ user_id: userId, eslesme_zamani: new Date().toISOString() })
    .eq("id", temas.id);

  return {};
}
