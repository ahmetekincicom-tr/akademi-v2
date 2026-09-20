"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { veriHatasi } from "@/lib/auth-hatalari";
import { yoneticiMi } from "@/lib/panel-kapsam";
import { OLAYLAR } from "@/lib/meta/olaylar";
import { basarisizlariSiraya } from "@/lib/meta/gonderim";

/*
  Kapatılabilir olayların listesi burada da kuruluyor.

  Server action'lar herkese açık uç noktalar ve TypeScript'in "MetaOlay" tipi
  çalışma zamanında yok. Tarayıcıdan gönderilen olayların anahtarı elle
  yollansa, sunucu tabloya hiçbir işe yaramayan bir satır yazardı — ve o
  satır ekranda "kapalı" görünüp yanlış bir güven verirdi.
*/
const KAPATILABILIR = new Set<string>(OLAYLAR.filter((o) => o.kaynak === "sunucu").map((o) => o.anahtar));

export async function metaOlayiDegistir(anahtar: string, acik: boolean) {
  if (!(await yoneticiMi())) return { error: "Bu işlem için yetkin yok." };
  if (!KAPATILABILIR.has(anahtar)) {
    return { error: "Bu olay tarayıcıdan gönderiliyor; kapatmak için Pixel ID'yi boşalt." };
  }

  const supabase = await createClient();
  /*
    upsert: olay hiç kapatılmamışsa tabloda satırı yok. Tablo "kapalı olanlar
    defteri" olduğu için tekrar açıldığında satırın kaybolması değil, açık
    olduğunun yazması doğru.
  */
  const { error } = await supabase
    .from("meta_akislari")
    .upsert({ anahtar, acik, guncelleme: new Date().toISOString() }, { onConflict: "anahtar" });

  if (error) return { error: veriHatasi(error) };
  revalidatePath("/kontrol-9f4x2k/meta");
  return {};
}

/**
 * Başarısız olayları yeniden sıraya alır.
 *
 * Otomatik yeniden deneme bilerek yok: kesin bir hata (yanlış token gibi)
 * her beş dakikada bir aynı yanıtı üretir ve günlüğü doldururdu. Sorunu
 * düzeltip düğmeye basmak, düzeltmenin işe yarayıp yaramadığını da gösteriyor.
 */
export async function metaKuyrugunuTazele() {
  if (!(await yoneticiMi())) return { error: "Bu işlem için yetkin yok." };

  const supabase = await createClient();
  const { sayi } = await basarisizlariSiraya(supabase);
  revalidatePath("/kontrol-9f4x2k/meta");
  return { sayi };
}

/**
 * Bir temas kodunu kişiye bağlar.
 *
 * WhatsApp'tan gelen kişinin hesabı elle açılıyor ve tıklama kimliği ancak
 * bu adımla profile geçiyor. Bu yapılmazsa günler sonra gelen ödeme reklama
 * hiçbir zaman bağlanamaz — WhatsApp yolunun tamamı buna dayanıyor.
 */
export async function temasiKisiyeBagla(kod: string, userId: string) {
  if (!(await yoneticiMi())) return { error: "Bu işlem için yetkin yok." };

  const temiz = kod.trim().toUpperCase();
  if (!/^[A-Z0-9]{4,8}$/.test(temiz)) return { error: "Referans kodu okunamadı." };

  /*
    Yazımlar service anahtarıyla yapılıyor, cookie istemcisiyle DEĞİL.

    profiles'ta authenticated rolüne yalnızca birkaç kolonda UPDATE yetkisi var
    (ad, soyad, telefon, sirket, on_degerlendirme_tarihi …). Burada yazdığımız
    reklam atıfı kolonları — fbp, fbc, ilk_ip, ilk_ua, temas_kodu, kaynak,
    reklam_izni — o listede değil ve yalnızca service_role'a açık; bilerek
    öyle, çünkü bunları normal kullanıcı kendi satırına yazabilseydi atıfı
    elle uydurabilirdi. Yönetici cookie istemcisiyle yazmaya çalışınca UPDATE
    RLS'e ulaşmadan kolon yetkisi katmanında 42501 ile düşüyordu ("yetkin yok").
    Eylem zaten yukarıda yoneticiMi() ile korunuyor; ayrıcalıklı yazım için
    service istemcisi doğru araç.
  */
  const servis = gorevIstemcisi();
  if (!servis) return { error: "Sunucu yapılandırması eksik." };

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

  revalidatePath("/kontrol-9f4x2k/ogrenciler");
  revalidatePath("/kontrol-9f4x2k/meta");
  return {};
}
