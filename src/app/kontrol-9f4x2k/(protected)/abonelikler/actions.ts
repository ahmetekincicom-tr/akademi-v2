"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { yoneticiMi } from "@/lib/panel-kapsam";
import { abonelikIyzicoAyari, aboneligiSenkronla, formDonusunuCoz } from "@/lib/abonelik";
import { abonelikAyariniCoz, type AbonelikAyari } from "@/lib/abonelik-hesap";
import { abonelikIptalEt, planDetayi } from "@/lib/iyzico-abonelik";
import type { Json } from "@/lib/supabase/tipler";

type Sonuc = { tamam?: boolean; hata?: string; bilgi?: string };

function tazele() {
  revalidatePath("/kontrol-9f4x2k/abonelikler");
  revalidatePath("/panel", "layout");
}

export async function abonelikAyariniKaydet(girdi: AbonelikAyari): Promise<Sonuc> {
  if (!(await yoneticiMi())) return { hata: "Yetkin yok." };

  // Tarayıcıdan geleni doğrudan yazmıyoruz; çözücüden geçen hâli yazılıyor.
  const ayar = abonelikAyariniCoz(girdi);
  if (ayar.acik && !ayar.testModu && !ayar.planKodu) {
    return { hata: "Canlıya açmadan önce canlı plan kodunu gir." };
  }
  if (ayar.acik && !ayar.testModu && ayar.fiyat <= 0) {
    return { hata: "Canlıya açmadan önce sayfada gösterilecek aylık ücreti gir." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .upsert({ anahtar: "abonelik", deger: ayar as unknown as Json, updated_at: new Date().toISOString() });
  if (error) return { hata: error.message };

  tazele();
  return { tamam: true };
}

/** Girilen plan kodunu iyzico'ya sorar: var mı, fiyatı ve dönemi ne? */
export async function planiDogrula(testModu: boolean, kodu: string): Promise<Sonuc> {
  if (!(await yoneticiMi())) return { hata: "Yetkin yok." };
  const ayar = abonelikIyzicoAyari(testModu);
  if (!ayar) {
    return {
      hata: testModu
        ? "Test anahtarları tanımlı değil (IYZICO_SANDBOX_API_KEY / IYZICO_SANDBOX_SECRET_KEY)."
        : "Canlı iyzico anahtarları tanımlı değil.",
    };
  }
  if (!kodu.trim()) return { hata: "Plan kodu boş." };

  try {
    const cevap = await planDetayi(ayar, kodu.trim());
    if (cevap.status !== "success" || !cevap.data) return { hata: cevap.errorMessage ?? "Plan bulunamadı." };
    const d = cevap.data;
    const aralik = d.paymentInterval === "MONTHLY" && (d.paymentIntervalCount ?? 1) === 1 ? "aylık" : `${d.paymentIntervalCount ?? 1} × ${d.paymentInterval}`;
    return {
      tamam: true,
      bilgi: `${d.name ?? "Plan"} · ${d.price} ${d.currencyCode ?? ""} · ${aralik}${d.trialPeriodDays ? ` · ${d.trialPeriodDays} gün deneme` : ""}`,
    };
  } catch {
    return { hata: "iyzico'ya ulaşılamadı." };
  }
}

/** "iyzico'ya sor": kaydı iyzico'nun söylediğiyle tazeler. */
export async function aboneligiSor(abonelikId: string): Promise<Sonuc> {
  if (!(await yoneticiMi())) return { hata: "Yetkin yok." };
  const servis = gorevIstemcisi();
  if (!servis) return { hata: "Sunucu yapılandırması eksik." };

  const { data: satir } = await servis
    .from("abonelikler")
    .select("iyzico_abonelik_kodu, token")
    .eq("id", abonelikId)
    .maybeSingle();
  if (!satir) return { hata: "Kayıt bulunamadı." };

  // Dönüşü hiç gelmemiş formda abonelik kodu yok; token'dan çözülüyor.
  if (!satir.iyzico_abonelik_kodu) {
    if (!satir.token) return { hata: "Bu kayıt iyzico'ya hiç ulaşmamış." };
    const sonuc = await formDonusunuCoz(servis, satir.token);
    tazele();
    return sonuc === "belirsiz" ? { hata: "iyzico sonucu doğrulanamadı." } : { tamam: true };
  }

  const sonuc = await aboneligiSenkronla(servis, abonelikId);
  tazele();
  return sonuc === "guncellendi" ? { tamam: true } : { hata: "iyzico'dan güncel bilgi alınamadı." };
}

export async function yoneticiIptalEt(abonelikId: string): Promise<Sonuc> {
  if (!(await yoneticiMi())) return { hata: "Yetkin yok." };
  const servis = gorevIstemcisi();
  if (!servis) return { hata: "Sunucu yapılandırması eksik." };

  const { data: satir } = await servis
    .from("abonelikler")
    .select("iyzico_abonelik_kodu, test_modu")
    .eq("id", abonelikId)
    .maybeSingle();
  const ayar = satir ? abonelikIyzicoAyari(satir.test_modu) : null;
  if (!satir?.iyzico_abonelik_kodu || !ayar) return { hata: "iyzico aboneliği bulunamadı." };

  try {
    const cevap = await abonelikIptalEt(ayar, satir.iyzico_abonelik_kodu);
    if (cevap.status !== "success") return { hata: cevap.errorMessage ?? "İptal tamamlanamadı." };
  } catch {
    return { hata: "iyzico'ya ulaşılamadı." };
  }
  await aboneligiSenkronla(servis, abonelikId);
  tazele();
  return { tamam: true };
}

/**
 * Elle süre tanıma: iyzico'suz, belirli bir güne kadar izleme hakkı.
 *
 * Hediye, telafi ya da kurumsal anlaşma için. Kayıt ayrı bir satır olarak
 * duruyor, iyzico aboneliğine dokunmuyor; ikisi birlikte varsa erişim,
 * geç biteninkine göre açık kalıyor.
 */
export async function sureTani(girdi: { email: string; gun: number; not: string }): Promise<Sonuc> {
  if (!(await yoneticiMi())) return { hata: "Yetkin yok." };

  const gun = Math.trunc(Number(girdi.gun));
  if (!Number.isFinite(gun) || gun < 1 || gun > 400) return { hata: "Gün sayısı 1 ile 400 arasında olmalı." };

  const supabase = await createClient();
  const { data: kisi } = await supabase
    .from("profiles")
    .select("id")
    // Büyük/küçük harf duyarsız ama birebir: "_" ve "%" ilike'ta joker,
    // kaçırılmazsa "ali_veli@" başka adreslerle de eşleşebilirdi.
    .ilike("email", girdi.email.trim().replace(/[\\%_]/g, "\\$&"))
    .maybeSingle();
  if (!kisi) return { hata: "Bu e-postayla bir üye bulunamadı." };

  const simdi = new Date();
  const bitis = new Date(simdi.getTime() + gun * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from("abonelikler").insert({
    user_id: kisi.id,
    kaynak: "yonetici",
    durum: "aktif",
    erisim_bitis: bitis,
    donem_baslangic: simdi.toISOString(),
    donem_bitis: bitis,
    admin_notu: girdi.not.trim() || null,
  });
  if (error) return { hata: error.message };

  tazele();
  return { tamam: true };
}

/** Elle tanınan süreyi hemen bitirir. iyzico aboneliklerinde iptal kullanılır. */
export async function sureyiBitir(abonelikId: string): Promise<Sonuc> {
  if (!(await yoneticiMi())) return { hata: "Yetkin yok." };
  const supabase = await createClient();
  const simdi = new Date().toISOString();
  const { error } = await supabase
    .from("abonelikler")
    .update({ erisim_bitis: simdi, durum: "sona_erdi", updated_at: simdi })
    .eq("id", abonelikId)
    .eq("kaynak", "yonetici");
  if (error) return { hata: error.message };
  tazele();
  return { tamam: true };
}
