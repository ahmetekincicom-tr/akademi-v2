import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * İçe aktarılan hesaplar için davet bağlantısı.
 *
 * İçe aktarma hesapları şifresiz açıyor ve kimseye posta göndermiyor. Davet,
 * kişiye "hesabını etkinleştir" e-postası atıp şifresini kendisinin
 * belirlemesini sağlıyor. Yeni üyelik açılmıyor; mevcut hesap, eğitim
 * kayıtları ve ödemeleriyle olduğu gibi kalıyor.
 *
 * Neden Supabase'in kendi davet/sıfırlama bağlantısı değil:
 *
 *   1. Süre. O bağlantılar varsayılan olarak bir saat geçerli. Maili ertesi
 *      gün açan kişi "bağlantı geçersiz" görürdü; davet için bu kabul
 *      edilemez. Bu bağlantı DAVET_GECERLILIK_GUN boyunca geçerli.
 *
 *   2. E-posta tarayıcıları. Kurumsal posta korumaları (Outlook "güvenli
 *      bağlantılar" vb.) maildeki bağlantıyı kişiden önce açıyor. Tek
 *      kullanımlık bir kod doğrudan bağlantıda olsaydı tarayıcı onu harcar,
 *      kişi tıkladığında "geçersiz" görürdü. Bu bağlantı yalnızca bir sayfa
 *      açıyor; oturum, kişi o sayfadaki düğmeye bastığında kuruluyor.
 *
 * Tek kullanımlık olması için veritabanında ayrı bir kayıt tutulmuyor:
 * bağlantı, gönderildiği andaki "son giriş" zamanını imzanın içinde taşıyor.
 * Kişi bir kez giriş yaptığında (daveti kabul ettiğinde ya da başka yoldan)
 * son giriş zamanı değişiyor ve bağlantı kendiliğinden geçersiz oluyor.
 */

export const DAVET_GECERLILIK_GUN = 14;

/** iPhone uygulamasının App Store adresi (bundle: com.ahmetekinci.akademi). */
export const APP_STORE_ADRESI = "https://apps.apple.com/tr/app/ahmet-ekinci-akademi/id6797898705";

type DavetIcerigi = {
  /** Kullanıcı kimliği. */
  u: string;
  /** Son geçerlilik, saniye cinsinden Unix zamanı. */
  s: number;
  /** Gönderim anındaki son giriş zamanı; hiç giriş yoksa boş dizgi. */
  g: string;
};

export type DavetCozumu =
  | { gecerli: true; userId: string; sonGiris: string | null }
  | { gecerli: false; sebep: "bozuk" | "suresi-doldu" };

/**
 * İmza anahtarı servis anahtarından türetiliyor.
 *
 * Ayrı bir ortam değişkeni istemek kurulum adımı demekti ve unutulduğunda
 * özellik sessizce çalışmazdı. Servis anahtarı zaten yalnızca sunucuda ve
 * zaten gizli; doğrudan değil, amacı belirten bir önekle türetilmiş hâli
 * kullanılıyor, böylece aynı anahtar başka bir imzada kullanılsa bile
 * imzalar birbirinin yerine geçemiyor.
 */
function anahtar(gizli: string): Buffer {
  return createHmac("sha256", gizli).update("aea-hesap-daveti-v1").digest();
}

function imza(veri: string, gizli: string): string {
  return createHmac("sha256", anahtar(gizli)).update(veri).digest("base64url");
}

export function davetKoduUret(
  girdi: { userId: string; sonGiris: string | null; simdi?: Date },
  gizli: string,
): string {
  const simdi = girdi.simdi ?? new Date();
  const icerik: DavetIcerigi = {
    u: girdi.userId,
    s: Math.floor(simdi.getTime() / 1000) + DAVET_GECERLILIK_GUN * 24 * 60 * 60,
    g: girdi.sonGiris ?? "",
  };
  const veri = Buffer.from(JSON.stringify(icerik)).toString("base64url");
  return `${veri}.${imza(veri, gizli)}`;
}

export function davetKoduCoz(kod: string | null | undefined, gizli: string, simdi = new Date()): DavetCozumu {
  if (!kod || kod.length > 2000) return { gecerli: false, sebep: "bozuk" };
  const [veri, gelenImza, fazla] = kod.split(".");
  if (!veri || !gelenImza || fazla !== undefined) return { gecerli: false, sebep: "bozuk" };

  // Sabit zamanlı karşılaştırma: imzanın kaç karakterinin tuttuğu yanıt
  // süresinden çıkarılamasın.
  const beklenen = Buffer.from(imza(veri, gizli));
  const gelen = Buffer.from(gelenImza);
  if (beklenen.length !== gelen.length || !timingSafeEqual(beklenen, gelen)) {
    return { gecerli: false, sebep: "bozuk" };
  }

  let icerik: DavetIcerigi;
  try {
    icerik = JSON.parse(Buffer.from(veri, "base64url").toString("utf8")) as DavetIcerigi;
  } catch {
    return { gecerli: false, sebep: "bozuk" };
  }
  if (typeof icerik.u !== "string" || typeof icerik.s !== "number" || typeof icerik.g !== "string") {
    return { gecerli: false, sebep: "bozuk" };
  }

  if (icerik.s * 1000 < simdi.getTime()) return { gecerli: false, sebep: "suresi-doldu" };

  return { gecerli: true, userId: icerik.u, sonGiris: icerik.g || null };
}

/**
 * Bağlantı hâlâ kullanılabilir mi: hesap, bağlantı gönderildiğinden beri
 * hiç giriş yapmamış olmalı. Zaman damgaları dizgi olarak karşılaştırılıyor;
 * ikisi de Supabase'in döndürdüğü aynı değer.
 */
export function davetKullanilmamis(gonderimdekiSonGiris: string | null, simdikiSonGiris: string | null | undefined) {
  return (gonderimdekiSonGiris ?? null) === (simdikiSonGiris ?? null);
}
