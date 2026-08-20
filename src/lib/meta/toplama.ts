import "server-only";

import { cookies, headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Guncelle } from "@/lib/supabase/tipler";
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
 * Panel ziyaretinde izni ve tıklama kimliğini profile işler.
 *
 * Bu bir sonradan eklenen düzeltme ve sebebi somut: ilk kurulumda bu iş
 * YALNIZCA hoş geldin akışında yapılıyordu — yani kişi başına bir kez, ilk
 * girişte. Zaten panele girmiş herkesin (bugünkü 307 kişinin tamamının)
 * `reklam_izni` alanı null kalıyordu ve null "izin yok" demek olduğu için
 * onların ödemeleri kuyruğa `izinsiz` diye düşüyordu. İlk canlı ödeme
 * testinde de tam olarak bu oldu.
 *
 * Panel düzeni her ziyarette çalıştığı için burası doğru yer, ama yalnızca
 * DEĞİŞEN alanlar yazılıyor: her sayfa açılışında bir UPDATE atmak hiçbir
 * şeyi değiştirmeyen bir yazma yükü olurdu.
 *
 * Tıklama kimliği yalnızca BOŞKEN yazılıyor — ilk temas, sonrakinden değerli.
 *
 * Hatası yutuluyor: bu bir yan iş, paneli açamamanın sebebi olamaz.
 */
export async function panelOlcumlemeTazele(userId: string): Promise<void> {
  try {
    const { gorevIstemcisi } = await import("@/lib/supabase/gorev");
    const servis = gorevIstemcisi();
    if (!servis) return;

    /*
      Okuma ve yazma servis anahtarıyla, oturumlu istemciyle değil.

      Bu sütunlar katılımcının düzenleyeceği alanlar değil; profil
      güncellemesine açık bırakılmaları, tıklama kimliğinin dışarıdan
      yazılabilmesi demek olurdu.
    */
    const [baglam, { data: profil }] = await Promise.all([
      istekBaglami(),
      servis.from("profiles").select("reklam_izni, fbp, fbc").eq("id", userId).maybeSingle(),
    ]);

    if (!profil) return;

    const yama: Guncelle<"profiles"> = {};

    if (profil.reklam_izni !== baglam.izin) {
      yama.reklam_izni = baglam.izin;
      yama.reklam_izni_tarihi = new Date().toISOString();
    }
    // Tıklama kimliği boşsa doldur; doluysa dokunma.
    if (!profil.fbp && baglam.fbp) yama.fbp = baglam.fbp;
    if (!profil.fbc && baglam.fbc) yama.fbc = baglam.fbc;
    if (!profil.fbp && baglam.ip) yama.ilk_ip = baglam.ip;
    if (!profil.fbp && baglam.ua) yama.ilk_ua = baglam.ua;

    if (Object.keys(yama).length === 0) return;

    await servis.from("profiles").update(yama).eq("id", userId);
  } catch {
    // Yan iş.
  }
}
