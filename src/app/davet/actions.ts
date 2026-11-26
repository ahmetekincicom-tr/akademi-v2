"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { davetKoduCoz, davetKullanilmamis } from "@/lib/davet";
import { oturumKaydiniYaz } from "@/lib/oturum-kayit";
import { hosgeldinGonder } from "@/lib/hosgeldin";

/**
 * Daveti kabul et: oturum aç ve şifre belirlemeye gönder.
 *
 * Bağlantının kendisi (GET) yalnızca sayfayı açıyor; oturum ancak burada,
 * kişi düğmeye bastığında kuruluyor. E-posta tarayıcıları bağlantıyı önceden
 * açsa bile hiçbir şey harcanmıyor (bkz. lib/davet.ts).
 *
 * Oturum, Supabase'in kendi şifre sıfırlama mekanizmasıyla kuruluyor: tek
 * kullanımlık kod sunucuda üretilip aynı anda doğrulanıyor, kişiye hiç
 * gösterilmiyor. Sonrası olağan "şifre belirle" ekranı.
 */
export async function davetiKabulEt(formData: FormData): Promise<void> {
  const kod = String(formData.get("t") ?? "");
  const gizli = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const yonetim = gorevIstemcisi();
  if (!gizli || !yonetim) redirect("/davet/?durum=hata");

  const cozum = davetKoduCoz(kod, gizli);
  if (!cozum.gecerli) redirect(`/davet/?durum=${cozum.sebep === "suresi-doldu" ? "suresi-doldu" : "gecersiz"}`);

  const { data } = await yonetim.auth.admin.getUserById(cozum.userId);
  const kisi = data?.user;
  if (!kisi?.email) redirect("/davet/?durum=gecersiz");
  if (!davetKullanilmamis(cozum.sonGiris, kisi.last_sign_in_at)) redirect("/davet/?durum=kullanildi");

  const { data: baglanti, error: baglantiHatasi } = await yonetim.auth.admin.generateLink({
    type: "recovery",
    email: kisi.email,
  });
  const tokenHash = baglanti?.properties?.hashed_token;
  if (baglantiHatasi || !tokenHash) redirect(`/davet/?t=${encodeURIComponent(kod)}&hata=1`);

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
  if (error) redirect(`/davet/?t=${encodeURIComponent(kod)}&hata=1`);

  // Doğrulama bağlantısıyla gelen girişlerde olduğu gibi (auth/onayla):
  // hareket kaydı ve ilk girişin hoş geldin maili.
  await oturumKaydiniYaz(supabase);
  await hosgeldinGonder();

  redirect("/sifre-belirle/?davet=1");
}
