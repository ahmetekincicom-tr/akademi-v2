"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { yoneticiMi } from "@/lib/panel-kapsam";
import { EK_KOVA } from "@/lib/destek-ek";
import { ENGEL_MESAJI, kimlikGecerli, onayEslesiyor, silmeEngeli } from "@/lib/hesap-silme";

export async function kayitEkle(userId: string, courseId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("enrollments").insert({ user_id: userId, course_id: courseId });
  if (error) {
    return { error: error.code === "23505" ? "Bu öğrenci zaten bu eğitime kayıtlı." : error.message };
  }
  revalidatePath("/kontrol-9f4x2k/ogrenciler");
  return {};
}

export async function kayitKaldir(userId: string, courseId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("enrollments").delete().eq("user_id", userId).eq("course_id", courseId);
  if (error) return { error: error.message };
  revalidatePath("/kontrol-9f4x2k/ogrenciler");
  return {};
}

/**
 * Seçilen birden çok öğrenciye aynı eğitimi atar.
 *
 * Tek tek `kayitEkle` çağırmak yerine tek istek: yirmi kişilik bir listede
 * yirmi gidiş-dönüş hem yavaş hem de yarısında hata alındığında ekranın neyi
 * gösterdiği belirsiz kalıyor.
 *
 * ZATEN KAYITLI OLANLAR HATA DEĞİL: aynı listede bir kısmı zaten kayıtlı
 * olabiliyor ve toplu atamanın anlamı "hepsi bu eğitime kayıtlı olsun".
 * Çakışanlar sessizce atlanıyor, kaç kişiye yazıldığı geri dönüyor.
 */
export async function kayitEkleToplu(userIds: string[], courseId: string) {
  if (!courseId) return { error: "Önce bir eğitim seç." };
  const kisiler = [...new Set(userIds)].filter(Boolean);
  if (kisiler.length === 0) return { error: "Hiç öğrenci seçilmedi." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enrollments")
    .upsert(
      kisiler.map((id) => ({ user_id: id, course_id: courseId })),
      { onConflict: "user_id,course_id", ignoreDuplicates: true },
    )
    .select("user_id");

  if (error) return { error: error.message };
  revalidatePath("/kontrol-9f4x2k/ogrenciler");
  return { eklenen: data?.length ?? 0, secilen: kisiler.length };
}

/**
 * Yönetici bir hesabı kalıcı olarak siler.
 *
 * Öğrencinin uygulamadan açtığı silme talebini işlemek (App Store 5.1.1(v))
 * ya da yöneticinin kendi kararıyla bir hesabı kapatmak için.
 *
 * Sıra önemli:
 *  1. Ödemeler kişiden AYRILIYOR (user_id boşalıyor). Ödeme ve fatura
 *     kayıtlarının yasal saklama süresi var. Bu adım başarısız olursa
 *     (veritabanı güncellemesi henüz çalıştırılmadıysa) silme DURUYOR:
 *     auth kaydını silmek ödemeleri de silerdi.
 *  2. Kişiye bağlı takip/günlük kayıtları siliniyor (tıklama, e-posta
 *     günlüğü, Meta/Google dönüşüm kayıtları). Bağları "set null" olduğu için
 *     aksi halde kimliksiz ama IP/e-posta taşıyan satırlar kalırdı.
 *  3. Destek eklerinin dosyaları depodan siliniyor.
 *  4. Auth kaydı siliniyor; profil, kayıtlar, destek talepleri, oturumlar,
 *     bildirim cihazları ve diğer bağlı satırlar veritabanı kuralıyla
 *     (on delete cascade) birlikte gidiyor. E-posta adresi serbest kalıyor;
 *     kişi isterse yeniden kayıt olabiliyor.
 */
export async function ogrenciHesabiniSil(userId: string, onay: string): Promise<{ error?: string }> {
  if (!(await yoneticiMi())) return { error: "Bu işlem için yetkin yok." };
  if (!kimlikGecerli(userId)) return { error: "Hesap kimliği geçersiz." };

  const supabase = await createClient();
  const {
    data: { user: ben },
  } = await supabase.auth.getUser();
  const servis = gorevIstemcisi();
  if (!ben || !servis) return { error: "Sunucu yapılandırması eksik." };

  const { data: hedef } = await servis.from("profiles").select("id, role, email").eq("id", userId).maybeSingle();
  const engel = silmeEngeli(hedef ? { id: hedef.id, role: hedef.role } : null, ben.id);
  if (engel) return { error: ENGEL_MESAJI[engel] };
  if (!onayEslesiyor(onay, hedef!.email)) {
    return { error: hedef!.email ? "Onay için hesabın e-postasını aynen yaz." : "Onay için SİL yaz." };
  }

  // 1) Ödemeleri koru.
  const { error: odemeHatasi } = await servis.from("payments").update({ user_id: null }).eq("user_id", userId);
  if (odemeHatasi) {
    console.error("[hesap-silme] ödemeler ayrılamadı:", odemeHatasi.message);
    return {
      error:
        "Ödeme kayıtları korunamadı, hesap silinmedi. Ödeme kayıtlarını koruyan veritabanı güncellemesi çalıştırılmış olmalı.",
    };
  }

  // 2) Kişiye bağlı takip ve günlük kayıtları.
  for (const tablo of ["temaslar", "eposta_gunlugu", "meta_olaylari", "google_donusumleri"] as const) {
    const { error } = await servis.from(tablo).delete().eq("user_id", userId);
    if (error) console.error(`[hesap-silme] ${tablo} silinemedi:`, error.message);
  }

  // 3) Destek ekleri: dosyalar kişinin klasöründe (destek-ekleri/<userId>/…).
  for (let tur = 0; tur < 20; tur++) {
    const { data: dosyalar, error } = await servis.storage.from(EK_KOVA).list(userId, { limit: 100 });
    if (error || !dosyalar?.length) break;
    const { error: silmeHatasi } = await servis.storage.from(EK_KOVA).remove(dosyalar.map((d) => `${userId}/${d.name}`));
    if (silmeHatasi) {
      console.error("[hesap-silme] destek ekleri silinemedi:", silmeHatasi.message);
      break;
    }
  }

  // 4) Hesap.
  const { error: authHatasi } = await servis.auth.admin.deleteUser(userId);
  if (authHatasi) {
    console.error("[hesap-silme] auth kaydı silinemedi:", authHatasi.message);
    return { error: "Hesap silinemedi. Biraz sonra tekrar dene." };
  }

  revalidatePath("/kontrol-9f4x2k/ogrenciler");
  revalidatePath("/kontrol-9f4x2k/odemeler");
  return {};
}
