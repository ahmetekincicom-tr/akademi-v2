"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { ogrenciBildirimi } from "@/lib/eposta";
import { DAVET_GECERLILIK_GUN, davetKoduUret } from "@/lib/davet";

/** Tek istekte gönderilen en çok davet; tarayıcı listeyi bu boyda parçalıyor. */
const PARCA_SINIRI = 10;

/*
  Gönderimler arası bekleme. Resend varsayılan olarak saniyede iki istek
  kabul ediyor; sınırı aşan istek 429 alıyor ve o kişiye mail gitmiyor.
*/
const BEKLEME_MS = 600;

export type DavetSonucu = {
  userId: string;
  durum: "gonderildi" | "atlandi" | "hata";
  aciklama?: string;
};

async function yoneticiMi() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return data?.role === "admin";
}

const bekle = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Seçilen hesaplara "hesabını etkinleştir" daveti gönderir.
 *
 * Yalnızca hiç giriş yapmamış hesaplara: giriş yapmış birine davet gitmesi
 * hem anlamsız hem kafa karıştırıcı. Liste ekranı da yalnızca onları
 * gösteriyor ama sayfa açıkken biri giriş yapmış olabilir, kontrol burada da
 * yapılıyor.
 *
 * Kime ne zaman davet gittiği hesabın app_metadata'sında tutuluyor (son
 * gönderim zamanı ve kaç kez gönderildiği). Ayrı tablo gerekmiyor; bu alanı
 * kullanıcı değiştiremiyor.
 */
export async function davetGonder(userIdler: string[]): Promise<{ error?: string; sonuclar?: DavetSonucu[] }> {
  if (!(await yoneticiMi())) return { error: "Yetkisiz işlem." };
  if (!Array.isArray(userIdler) || userIdler.length === 0) return { error: "Kimse seçilmedi." };
  if (userIdler.length > PARCA_SINIRI) {
    return { error: `Tek seferde en fazla ${PARCA_SINIRI} davet gönderilebilir.` };
  }

  const yonetim = gorevIstemcisi();
  const gizli = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!yonetim || !gizli) return { error: "SUPABASE_SERVICE_ROLE_KEY tanımlı değil." };

  const sonuclar: DavetSonucu[] = [];

  for (const [sira, userId] of userIdler.entries()) {
    if (sira > 0) await bekle(BEKLEME_MS);

    const { data, error } = await yonetim.auth.admin.getUserById(userId);
    const kisi = data?.user;
    if (error || !kisi?.email) {
      sonuclar.push({ userId, durum: "hata", aciklama: error?.message ?? "Hesap bulunamadı" });
      continue;
    }
    if (kisi.last_sign_in_at) {
      sonuclar.push({ userId, durum: "atlandi", aciklama: "Hesap zaten etkin (giriş yapmış)" });
      continue;
    }

    const { data: profil } = await yonetim.from("profiles").select("ad").eq("id", userId).maybeSingle();
    const ad = profil?.ad?.trim() || null;

    const kod = davetKoduUret({ userId, sonGiris: kisi.last_sign_in_at ?? null }, gizli);

    const gonderim = await ogrenciBildirimi({
      akis: "hesap-daveti",
      alici: kisi.email,
      konu: "Ahmet Ekinci Akademi hesabın hazır",
      ustEtiket: "Hesap daveti",
      baslik: ad ? `${ad}, hesabın seni bekliyor` : "Hesabın seni bekliyor",
      ozet:
        "Ahmet Ekinci Akademi üye alanında senin için bir hesap açıldı. Yeni bir üyelik oluşturmana gerek yok: " +
        "aşağıdaki düğmeye tıklayıp şifreni belirlemen yeterli. Ardından bu e-posta adresin ve belirlediğin " +
        "şifreyle hem siteden hem de iPhone uygulamamızdan giriş yapabilirsin.",
      satirlar: [
        { etiket: "Giriş e-postan", deger: kisi.email },
        { etiket: "Bağlantı", deger: `${DAVET_GECERLILIK_GUN} gün geçerli` },
        { etiket: "iPhone uygulaması", deger: "App Store'da “Ahmet Ekinci Akademi”" },
      ],
      yol: `/davet/?t=${encodeURIComponent(kod)}`,
      eylemEtiketi: "Hesabımı etkinleştir",
      degiskenler: { ad },
      yedekBaglanti: true,
    });

    if (!gonderim.gonderildi) {
      sonuclar.push({ userId, durum: "hata", aciklama: gonderim.hata ?? "E-posta gönderilemedi" });
      continue;
    }

    // Gönderim kaydı. Başarısız olursa davet yine gitmiş durumda; yalnızca
    // listedeki "son davet" bilgisi eksik kalır, o yüzden hata sayılmıyor.
    const onceki = (kisi.app_metadata?.davet ?? {}) as { sayi?: number };
    await yonetim.auth.admin.updateUserById(userId, {
      app_metadata: {
        ...kisi.app_metadata,
        davet: { son: new Date().toISOString(), sayi: (onceki.sayi ?? 0) + 1 },
      },
    });

    sonuclar.push({ userId, durum: "gonderildi" });
  }

  revalidatePath("/kontrol-9f4x2k/ogrenciler/davet");
  return { sonuclar };
}
