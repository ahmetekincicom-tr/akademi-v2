"use server";

import { createClient } from "@/lib/supabase/server";
import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { rizaKaydet } from "@/lib/riza";
import { e164, telefonGecerliMi } from "@/lib/telefon";

/**
 * Google ile açılan hesabın kaydını tamamlar: ad, soyad, telefon ve onaylar.
 *
 * E-postayla kayıtta bu bilgiler signUp meta verisiyle handle_new_user
 * tetikleyicisinden profile yazılıyor; Google'da form olmadığı için aynı
 * sonuç burada üretiliyor:
 *   - ad, soyad, telefon, ileti izni → kişinin kendi oturumuyla (kolon
 *     yetkileri zaten var),
 *   - sozlesme_onayi_tarihi → servis anahtarıyla (kişi bu kolonu kendisi
 *     yazamıyor; onay tarihini tarayıcı değil sunucu damgalıyor),
 *   - riza_kayitlari → rizaKaydet (IP, tarayıcı ve metnin parmak iziyle).
 */
export async function kayitTamamla(girdi: {
  ad: string;
  soyad: string;
  ulkeKodu: string;
  telefon: string;
  sozlesme: boolean;
  iletiIzni: boolean;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı. Tekrar giriş yap." };

  const ad = girdi.ad.trim();
  const soyad = girdi.soyad.trim();
  if (!ad || !soyad) return { error: "Ad ve soyad zorunlu." };
  if (!telefonGecerliMi(girdi.ulkeKodu, girdi.telefon)) return { error: "Telefon numaranı kontrol eder misin?" };
  if (!girdi.sozlesme) return { error: "Devam etmek için sözleşmeyi ve KVKK metnini onaylaman gerekiyor." };

  const servis = gorevIstemcisi();
  if (!servis) return { error: "Şu an kaydedilemedi. Birazdan tekrar dene." };

  const simdi = new Date().toISOString();
  const { error: profilHatasi } = await supabase
    .from("profiles")
    .update({
      ad,
      soyad,
      telefon: e164(girdi.ulkeKodu, girdi.telefon),
      ileti_izni: girdi.iletiIzni,
      ileti_izni_tarihi: girdi.iletiIzni ? simdi : null,
    })
    .eq("id", user.id);
  if (profilHatasi) return { error: "Bilgiler kaydedilemedi. Tekrar dene." };

  // Onay damgası yalnız ilk kez atılıyor (sonraki tekrarlar tarihi ilerletmesin).
  const { error: onayHatasi } = await servis
    .from("profiles")
    .update({ sozlesme_onayi_tarihi: simdi })
    .eq("id", user.id)
    .is("sozlesme_onayi_tarihi", null);
  if (onayHatasi) return { error: "Onay kaydedilemedi. Tekrar dene." };

  await rizaKaydet({
    userId: user.id,
    belgeler: ["uyelik-sozlesmesi", "kisisel-verilerin-islenmesi", ...(girdi.iletiIzni ? ["ticari-ileti-izni"] : [])],
    baglam: "kayit",
  });

  return {};
}
