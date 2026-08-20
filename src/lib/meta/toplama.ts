import "server-only";

import { cookies, headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/tipler";
import { IZIN_CEREZI, izniCoz, reklamIzniVar } from "@/lib/izin";
import { kimlikKur, type MetaKimlik } from "@/lib/meta/kimlik";

/**
 * Kimliğin nereden toplandığı.
 *
 * İki ayrı dünya var ve karıştırılmaları en sık yapılan hata:
 *
 *  - ANLIK olaylar (form gönderimi, WhatsApp tıklaması): kişi o an sayfada,
 *    çerezleri ve IP'si istekte duruyor. Kaynak istek.
 *
 *  - GECİKMELİ olaylar (ödeme, hesap açılışı): kişi ortada olmayabilir —
 *    havaleyi yönetici işaretliyor, mutabakat görevini zamanlayıcı
 *    çalıştırıyor. İstekten okunacak hiçbir şey yok, hepsi profilden geliyor.
 *
 * İkinci durumda istekten okumaya kalkışmak, YÖNETİCİNİN kimliğini
 * katılımcının satın alması gibi göndermek demek. Bu dosya o iki yolu
 * birbirinden ayrı tutuyor.
 */

/** İsteğin sahibinin çerez izni. Sunucu bileşeni ve server action içinde. */
export async function istekIzni(): Promise<boolean> {
  try {
    const kutu = await cookies();
    return reklamIzniVar(izniCoz(kutu.get(IZIN_CEREZI)?.value));
  } catch {
    return false;
  }
}

/** İstekten okunabilen ölçümleme parçaları. */
export type IstekBaglami = {
  fbp: string | null;
  fbc: string | null;
  ip: string | null;
  ua: string | null;
  izin: boolean;
};

export async function istekBaglami(): Promise<IstekBaglami> {
  try {
    const [kutu, basliklar] = await Promise.all([cookies(), headers()]);
    return {
      fbp: kutu.get("_fbp")?.value ?? null,
      fbc: kutu.get("_fbc")?.value ?? null,
      ip: istekIpsi(basliklar),
      ua: basliklar.get("user-agent"),
      izin: reklamIzniVar(izniCoz(kutu.get(IZIN_CEREZI)?.value)),
    };
  } catch {
    return { fbp: null, fbc: null, ip: null, ua: null, izin: false };
  }
}

/**
 * İstemcinin IP adresi.
 *
 * Vercel'in arkasındayız; soketin uzak adresi her zaman bir yük dengeleyici.
 * x-forwarded-for'un İLK değeri gerçek istemci — sonrakiler aradaki
 * vekiller. Son değeri almak yaygın bir hata ve hep aynı birkaç IP'yi
 * gönderdiği için Meta'da eşleşme yerine gürültü üretir.
 */
export function istekIpsi(basliklar: Headers): string | null {
  const zincir = basliklar.get("x-forwarded-for");
  if (zincir) {
    const ilk = zincir.split(",")[0]?.trim();
    if (ilk) return ilk;
  }
  return basliklar.get("x-real-ip");
}

export type ProfilKimligi = {
  kimlik: MetaKimlik;
  izin: boolean;
  userId: string;
};

/**
 * Gecikmeli olaylar için kimlik: her şey profilden.
 *
 * Tıklama kimliği (fbp/fbc) buraya kişi ilk temas ettiğinde kopyalanmıştı;
 * Safari çerezi çoktan silmiş olabilir ama satır duruyor. Ödemeyi reklama
 * bağlayan tek bağ bu.
 */
export async function profildenKimlik(
  servis: SupabaseClient<Database>,
  userId: string,
): Promise<ProfilKimligi | null> {
  const { data } = await servis
    .from("profiles")
    .select("id, ad, soyad, email, telefon, fbp, fbc, ilk_ip, ilk_ua, reklam_izni")
    .eq("id", userId)
    .maybeSingle();

  if (!data) return null;

  return {
    userId,
    izin: data.reklam_izni === true,
    kimlik: kimlikKur({
      eposta: data.email,
      telefon: data.telefon,
      ad: data.ad,
      soyad: data.soyad,
      userId,
      fbp: data.fbp,
      fbc: data.fbc,
      ip: data.ilk_ip,
      ua: data.ilk_ua,
    }),
  };
}

/**
 * Panelde görülen izni profile yazar.
 *
 * Panel düzeni her ziyarette çalışıyor, o yüzden yalnızca DEĞİŞTİĞİNDE
 * yazıyor: her sayfa açılışında bir UPDATE atmak, hiçbir şeyi değiştirmeyen
 * bir yazma yükü olurdu.
 *
 * Hatası yutuluyor — bu bir yan iş; paneli açamamanın sebebi olamaz.
 */
export async function izniProfileIsle(
  servis: SupabaseClient<Database>,
  userId: string,
  mevcut: boolean | null,
  istektekiIzin: boolean,
): Promise<void> {
  if (mevcut === istektekiIzin) return;
  try {
    await servis
      .from("profiles")
      .update({ reklam_izni: istektekiIzin, reklam_izni_tarihi: new Date().toISOString() })
      .eq("id", userId);
  } catch {
    // Yan iş.
  }
}
