"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { satirDogrula, type HamSatir, type IceAktarmaSonucu } from "@/lib/ogrenci-ice-aktarma";

// Tarayıcı listeyi parça parça gönderiyor. Sınır burada da var: tek istekte
// yüzlerce hesap açmak sunucu zaman aşımına takılıyor ve yarısı yazılmış bir
// içe aktarma bırakıyor.
const PARCA_SINIRI = 30;

async function yoneticiMi() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return data?.role === "admin";
}

/**
 * Bir grup öğrenciyi içe aktarır.
 *
 * Profil satırları auth.users üzerindeki tetikleyiciden doğuyor, o yüzden
 * doğrudan profiles'a yazmıyoruz: kimliği olmayan bir profil, kişi ileride
 * kendisi kayıt olduğunda ikinci bir satır oluşturur ve kayıtlar ikiye
 * bölünür.
 *
 * Hesaplar şifresiz açılıyor ve e-posta doğrulanmış işaretleniyor: bu adım
 * kimseye posta göndermiyor. Öğrenci hazır olduğunda "şifremi unuttum" ile
 * kendi şifresini belirliyor. 400 kişiye habersiz davet e-postası gitmesi
 * istenmez.
 */
export async function ogrencileriIceAktar(
  satirlar: HamSatir[],
  secenekler: { mevcutlariGuncelle: boolean },
): Promise<{ error?: string; sonuclar?: IceAktarmaSonucu[] }> {
  if (!(await yoneticiMi())) return { error: "Yetkisiz işlem." };

  if (satirlar.length > PARCA_SINIRI) {
    return { error: `Tek seferde en fazla ${PARCA_SINIRI} kayıt gönderilebilir.` };
  }

  const yonetim = gorevIstemcisi();
  if (!yonetim) return { error: "SUPABASE_SERVICE_ROLE_KEY tanımlı değil." };

  const sonuclar: IceAktarmaSonucu[] = [];

  for (const ham of satirlar) {
    const dogrulama = satirDogrula(ham);
    if (!dogrulama.gecerli) {
      sonuclar.push({ eposta: ham.eposta, durum: "hata", aciklama: dogrulama.sebep });
      continue;
    }

    const { ad, soyad, eposta, telefon } = dogrulama.satir;

    // Aynı e-posta zaten varsa hesabı tekrar açmaya çalışmıyoruz.
    const { data: mevcut } = await yonetim
      .from("profiles")
      .select("id, ad, soyad, telefon")
      .eq("email", eposta)
      .maybeSingle();

    if (mevcut) {
      if (!secenekler.mevcutlariGuncelle) {
        sonuclar.push({ eposta, durum: "atlandi", aciklama: "Bu e-posta zaten kayıtlı" });
        continue;
      }

      // Güncellemede boş hücre "sil" demek değil: dosyada olmayan bilgi
      // sistemdekini silmemeli.
      const guncel = {
        ad: ad || mevcut.ad,
        soyad: soyad || mevcut.soyad,
        telefon: telefon || mevcut.telefon,
      };
      const { error } = await yonetim.from("profiles").update(guncel).eq("id", mevcut.id);

      sonuclar.push(
        error
          ? { eposta, durum: "hata", aciklama: error.message }
          : { eposta, durum: "guncellendi" },
      );
      continue;
    }

    const { data: yeni, error: olusturmaHatasi } = await yonetim.auth.admin.createUser({
      email: eposta,
      email_confirm: true,
      user_metadata: { ad, soyad },
    });

    if (olusturmaHatasi || !yeni?.user) {
      sonuclar.push({
        eposta,
        durum: "hata",
        aciklama: olusturmaHatasi?.message ?? "Hesap oluşturulamadı",
      });
      continue;
    }

    // Telefon tetikleyicinin yazdığı alanlar arasında değil; ayrıca geçiliyor.
    if (telefon) {
      await yonetim.from("profiles").update({ telefon }).eq("id", yeni.user.id);
    }

    sonuclar.push({ eposta, durum: "eklendi" });
  }

  revalidatePath("/kontrol-9f4x2k/ogrenciler");
  return { sonuclar };
}
