"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { yoneticiBildirimi } from "@/lib/eposta";

/**
 * Hesap silme talebi. Apple App Store 5.1.1(v) hesabın uygulama içinden
 * silinmeye başlatılabilmesini şart koşuyor.
 *
 * Tek adımda tamamlanmıyor, bilerek: hesap ödeme ve fatura kayıtlarına bağlı
 * ve bunların yasal saklama süresi var. Talep damgalanıyor, eğitmen kalan
 * veriyi temizleyip hesabı kapatıyor.
 */
export async function silmeTalebiOlustur() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Oturum bulunamadı." };

  const { error } = await supabase
    .from("profiles")
    .update({ silme_talebi_tarihi: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: error.message };

  // Bu talebin bir kuyrukta beklemesi Apple açısından yeterli değil; işlenmesi
  // gerekiyor. Panele bakmadan haberdar olmanın tek yolu bu bildirim.
  const { data: profil } = await supabase
    .from("profiles")
    .select("ad, soyad, email, telefon")
    .eq("id", user.id)
    .maybeSingle();
  const isim = [profil?.ad, profil?.soyad].filter(Boolean).join(" ") || profil?.email || "Bir katılımcı";

  await yoneticiBildirimi({
    konu: `Hesap silme talebi · ${isim}`,
    ustEtiket: "Hesap silme talebi",
    baslik: `${isim} hesabının silinmesini istedi`,
    ozet: "Talebi işlemeden önce ödeme ve fatura kayıtlarının yasal saklama süresini kontrol et.",
    satirlar: [
      { etiket: "E-posta", deger: profil?.email ?? "—" },
      { etiket: "Telefon", deger: profil?.telefon ?? "—" },
    ],
    yol: "/kontrol-9f4x2k/ogrenciler",
    eylemEtiketi: "Öğrenciyi panelde aç",
  });

  revalidatePath("/panel/hesabim");
  return {};
}

/** Öğrenci fikrini değiştirirse talebi geri alabilmeli. */
export async function silmeTalebiGeriAl() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Oturum bulunamadı." };

  const { error } = await supabase
    .from("profiles")
    .update({ silme_talebi_tarihi: null })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/panel/hesabim");
  return {};
}
