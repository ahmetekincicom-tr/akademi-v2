"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { nativeIstekMi } from "@/lib/native-sunucu";
import { rizaKaydet } from "@/lib/riza";
import { ADRES_SOKAK, ADRES_ILCE } from "@/lib/iletisim";
import {
  abonelikAyariOku,
  abonelikDurumum,
  abonelikIyzicoAyari,
  aboneligiSenkronla,
  planKodu,
} from "@/lib/abonelik";
import { abonelikGorunurMu, telefonE164 } from "@/lib/abonelik-hesap";
import { abonelikFormuBaslat, abonelikIptalEt, kartGuncellemeFormu } from "@/lib/iyzico-abonelik";

/** Abone olurken onaylanan metinler: aylık yenilenen bir satış. */
const ABONELIK_BELGELERI = ["satis-sozlesmesi", "iptal-iade-politikasi"];

type FormSonucu = { form?: string; hata?: string };

async function siteKoku(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "";
  const sema = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${sema}://${host}`;
}

/** Oturum, rol ve (yönetici değilse) aboneliğin açık olup olmadığı. */
async function oturum() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profil } = await supabase
    .from("profiles")
    .select("ad, soyad, telefon, role")
    .eq("id", user.id)
    .maybeSingle();
  return { supabase, user, profil, yonetici: profil?.role === "admin" };
}

/**
 * Abone ol: iyzico'nun abonelik formunu başlatır ve sayfaya gömülecek
 * içeriği döndürür.
 *
 * Fiyat İSTEMCİDEN ALINMIYOR; iyzico'daki plandan geliyor. Tarayıcının
 * gönderebildiği tek şey "onayladım" bilgisi.
 */
export async function aboneOl(onay = false): Promise<FormSonucu> {
  // Apple 3.1.3: uygulama içinden dijital içerik satışı yok (gerekçesi
  // odemelerim/actions.ts'te). Sayfa uygulamada zaten basılmıyor.
  if (await nativeIstekMi()) return { hata: "Bu işlem uygulamada yapılamıyor." };
  if (!onay) return { hata: "Devam etmek için sözleşmeleri onaylaman gerekiyor." };

  const o = await oturum();
  if (!o) return { hata: "Oturumun kapanmış görünüyor, tekrar giriş yap." };

  const servis = gorevIstemcisi();
  if (!servis) return { hata: "Sunucu yapılandırması eksik." };

  const ayar = await abonelikAyariOku(servis);
  if (!abonelikGorunurMu(ayar, o.yonetici)) return { hata: "Abonelik henüz açılmadı." };

  const plan = planKodu(ayar);
  const iyzico = abonelikIyzicoAyari(ayar.testModu);
  if (!plan || !iyzico) return { hata: "Abonelik altyapısı henüz yapılandırılmadı." };

  /*
    Abonelik kayıtlı olunan eğitimlerin videolarını açıyor; kaydı olmayan biri
    abone olursa para öder ama hiçbir şey izleyemez.
  */
  const { count } = await o.supabase
    .from("enrollments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", o.user.id)
    .neq("durum", "iptal");
  if (!count) return { hata: "Abonelik, kayıtlı olduğun eğitimlerin videolarını açar; henüz bir eğitim kaydın yok." };

  const mevcut = await abonelikDurumum(o.supabase, o.user.id);
  if (mevcut?.surduruluyor) return { hata: "Zaten süren bir aboneliğin var." };

  // Onay iyzico'ya gitmeden ÖNCE yazılıyor (gerekçesi odemelerim/actions.ts'te).
  await rizaKaydet({ userId: o.user.id, belgeler: ABONELIK_BELGELERI, baglam: "abonelik" });

  const konusmaId = crypto.randomUUID();
  // Satır iyzico'ya gitmeden önce: dönüşte eşleşecek satır yoksa para çekilmiş
  // ama kaydı olmayan bir abonelik kalırdı.
  const { data: satir, error } = await servis
    .from("abonelikler")
    .insert({
      user_id: o.user.id,
      kaynak: "iyzico",
      durum: "bekliyor",
      conversation_id: konusmaId,
      iyzico_plan_kodu: plan,
      test_modu: ayar.testModu,
    })
    .select("id")
    .single();
  if (error || !satir) return { hata: "Abonelik kaydı oluşturulamadı." };

  const { data: odemeAyari } = await servis.from("settings").select("deger").eq("anahtar", "odeme").maybeSingle();
  const fatura = (odemeAyari?.deger ?? {}) as Record<string, string>;

  let cevap;
  try {
    cevap = await abonelikFormuBaslat(iyzico, {
      konusmaId,
      planKodu: plan,
      donusAdresi: `${await siteKoku()}/api/abonelik/iyzico/sonuc`,
      abone: {
        ad: o.profil?.ad?.trim() || "Katılımcı",
        soyad: o.profil?.soyad?.trim() || "-",
        email: o.user.email ?? "",
        telefon: telefonE164(o.profil?.telefon),
        adres: fatura.adres?.trim() || `${ADRES_SOKAK} ${ADRES_ILCE}`,
        sehir: fatura.sehir?.trim() || "Ankara",
      },
    });
  } catch (e) {
    await servis
      .from("abonelikler")
      .update({ durum: "basarisiz", son_hata: e instanceof Error ? e.message : "Bilinmeyen hata" })
      .eq("id", satir.id);
    return { hata: "Ödeme formu açılamadı, birazdan tekrar dene." };
  }

  if (cevap.status !== "success" || !cevap.checkoutFormContent) {
    await servis
      .from("abonelikler")
      .update({ durum: "basarisiz", son_hata: cevap.errorMessage ?? "iyzico form döndürmedi.", ham_yanit: cevap })
      .eq("id", satir.id);
    return { hata: "Abonelik başlatılamadı. Sorun sürerse bize yaz." };
  }

  await servis.from("abonelikler").update({ token: cevap.token ?? null }).eq("id", satir.id);
  return { form: cevap.checkoutFormContent };
}

/** Süren aboneliği iptal eder. Ödenmiş dönemin sonuna kadar izleme açık kalır. */
export async function aboneligiIptalEt(): Promise<{ tamam?: boolean; hata?: string }> {
  const o = await oturum();
  if (!o) return { hata: "Oturumun kapanmış görünüyor, tekrar giriş yap." };

  const servis = gorevIstemcisi();
  if (!servis) return { hata: "Sunucu yapılandırması eksik." };

  const mevcut = await abonelikDurumum(o.supabase, o.user.id);
  if (!mevcut?.surduruluyor) return { hata: "İptal edilecek bir abonelik bulunamadı." };

  // Kod RLS'li istemciden değil servisten okunuyor; kişinin kendi satırı
  // olduğunu yukarıdaki sorgu zaten doğruladı.
  const { data: satir } = await servis
    .from("abonelikler")
    .select("iyzico_abonelik_kodu, test_modu")
    .eq("id", mevcut.id)
    .eq("user_id", o.user.id)
    .maybeSingle();
  const iyzico = satir ? abonelikIyzicoAyari(satir.test_modu) : null;
  if (!satir?.iyzico_abonelik_kodu || !iyzico) return { hata: "Abonelik altyapısına ulaşılamadı." };

  let cevap;
  try {
    cevap = await abonelikIptalEt(iyzico, satir.iyzico_abonelik_kodu);
  } catch {
    return { hata: "iyzico'ya ulaşılamadı, birazdan tekrar dene." };
  }
  if (cevap.status !== "success") return { hata: "İptal tamamlanamadı. Sorun sürerse bize yaz." };

  // Durum ve iptal maili senkrondan: iyzico'nun gerçekten iptal ettiğini
  // gördükten sonra.
  await aboneligiSenkronla(servis, mevcut.id);
  revalidatePath("/panel", "layout");
  return { tamam: true };
}

/** Kart güncelleme formunu başlatır (reddedilen çekimden sonra ya da kart değişince). */
export async function kartiGuncelle(): Promise<FormSonucu> {
  if (await nativeIstekMi()) return { hata: "Bu işlem uygulamada yapılamıyor." };

  const o = await oturum();
  if (!o) return { hata: "Oturumun kapanmış görünüyor, tekrar giriş yap." };

  const servis = gorevIstemcisi();
  if (!servis) return { hata: "Sunucu yapılandırması eksik." };

  const mevcut = await abonelikDurumum(o.supabase, o.user.id);
  if (!mevcut?.surduruluyor) return { hata: "Kartı güncellenecek bir abonelik bulunamadı." };

  const { data: satir } = await servis
    .from("abonelikler")
    .select("id, iyzico_abonelik_kodu, test_modu")
    .eq("id", mevcut.id)
    .eq("user_id", o.user.id)
    .maybeSingle();
  const iyzico = satir ? abonelikIyzicoAyari(satir.test_modu) : null;
  if (!satir?.iyzico_abonelik_kodu || !iyzico) {
    return { hata: "Abonelik altyapısına ulaşılamadı." };
  }

  let cevap;
  try {
    cevap = await kartGuncellemeFormu(iyzico, {
      abonelikKodu: satir.iyzico_abonelik_kodu,
      donusAdresi: `${await siteKoku()}/api/abonelik/iyzico/kart?a=${satir.id}`,
    });
  } catch {
    return { hata: "iyzico'ya ulaşılamadı, birazdan tekrar dene." };
  }
  if (cevap.status !== "success" || !cevap.checkoutFormContent) {
    return { hata: "Kart güncelleme formu açılamadı. Sorun sürerse bize yaz." };
  }
  return { form: cevap.checkoutFormContent };
}
