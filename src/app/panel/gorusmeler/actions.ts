"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { yoneticiBildirimi } from "@/lib/eposta";
import { veriHatasi } from "@/lib/auth-hatalari";

export type TalepSonuc = {
  error?: string;
  /** Ücretli yolda ödeme ekranının adresi; ücretsizde boş. */
  odemeYolu?: string;
};

export async function gorusmeTalepEt(input: {
  konu: string;
  aciklama: string;
  tercihZaman: string;
}): Promise<TalepSonuc> {
  const supabase = await createClient();

  // Ücretsiz hak, eğitim kaydı koşulu ve fiyat veritabanı fonksiyonunda
  // belirlenir; buradan gönderilen hiçbir değer bunları etkilemez.
  const { data: gorusmeId, error } = await supabase.rpc("gorusme_talep_olustur", {
    p_konu: input.konu,
    p_aciklama: input.aciklama,
    p_tercih_zaman: input.tercihZaman,
  });

  if (error) return { error: veriHatasi(error) };

  // Oluşan kaydın ücretli mi ücretsiz mi olduğuna İSTEMCİYE değil satıra
  // bakılıyor: karar sunucuda verildi.
  const { data: kayit } = await supabase
    .from("gorusmeler")
    .select("ucretsiz, payment_id")
    .eq("id", gorusmeId as string)
    .maybeSingle();

  revalidatePath("/panel/gorusmeler");
  revalidatePath("/kontrol-9f4x2k/gorusmeler");

  /*
    Ücretli yol: talep henüz gerçek bir talep DEĞİL.

    Satır 'odeme_bekliyor' durumunda duruyor, yönetim kuyruğuna girmiyor ve
    yöneticiye bildirim de gitmiyor. Ödeme onaylandığında veritabanındaki
    tetikleyici satırı 'talep'e çeviriyor; yöneticiye haber de o anda, ödeme
    bildirimiyle birlikte gidiyor. Ödenmemiş bir talep için bildirim atmak
    yöneticiyi hiç gerçekleşmeyecek işlere çağırırdı.
  */
  if (kayit && !kayit.ucretsiz) {
    return kayit.payment_id
      ? { odemeYolu: `/panel/odemelerim/ode/${kayit.payment_id}` }
      : { error: "Ödeme kaydı oluşturulamadı. Bize ulaşır mısın?" };
  }

  // Ücretsiz yol: talep anında geçerli, yöneticiye hemen haber veriliyor.
  // Danışmanlık talebi doğrudan satış: geç dönmek müşteri kaybı.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profil } = await supabase
    .from("profiles")
    .select("ad, soyad, email, telefon")
    .eq("id", user?.id ?? "")
    .maybeSingle();
  const isim = [profil?.ad, profil?.soyad].filter(Boolean).join(" ") || profil?.email || "Bir katılımcı";

  await yoneticiBildirimi({
    konu: `Danışmanlık talebi · ${isim}`,
    ustEtiket: "Danışmanlık talebi",
    baslik: `${isim} görüşme istedi`,
    ozet: input.konu,
    satirlar: [
      { etiket: "Hak", deger: "Ücretsiz hakkından düşüldü" },
      { etiket: "Tercih ettiği zaman", deger: input.tercihZaman || "Belirtilmedi" },
      { etiket: "E-posta", deger: profil?.email ?? "—" },
      { etiket: "Telefon", deger: profil?.telefon ?? "—" },
    ],
    alinti: input.aciklama || undefined,
    yol: "/kontrol-9f4x2k/gorusmeler",
    eylemEtiketi: "Talebi panelde aç",
  });

  return {};
}

export async function gorusmeIptalEt(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("gorusme_iptal", { p_id: id });
  if (error) return { error: veriHatasi(error) };

  revalidatePath("/panel/gorusmeler");
  revalidatePath("/panel/odemelerim");
  revalidatePath("/kontrol-9f4x2k/gorusmeler");
  return {};
}
