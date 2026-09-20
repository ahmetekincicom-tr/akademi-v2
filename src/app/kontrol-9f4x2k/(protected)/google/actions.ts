"use server";

import { revalidatePath } from "next/cache";
import { yoneticiMi } from "@/lib/panel-kapsam";
import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { kayitDonusumuGonder } from "@/lib/google/donusum";

/**
 * Google dönüşümü yeniden gönderimi (panel).
 *
 * kayitDonusumuGonder zaten idempotent (gönderilmişse dokunmuyor, aksi halde
 * upsert ediyor); buradan tek bir ödeme için ya da bekleyen/başarısız olanların
 * hepsi için tetikleniyor.
 */

export async function googleDonusumTekrarla(paymentId: string): Promise<{ error?: string }> {
  if (!(await yoneticiMi())) return { error: "Bu işlem için yetkin yok." };
  const sonuc = await kayitDonusumuGonder(paymentId);
  revalidatePath("/kontrol-9f4x2k/google");
  if (sonuc === "basarisiz") return { error: "Gönderilemedi; ayrıntı günlükte." };
  return {};
}

/** Bekleyen ve başarısız kayıtların hepsini yeniden dener. */
export async function bekleyenGoogleDonusumleri(): Promise<{ sayi?: number; error?: string }> {
  if (!(await yoneticiMi())) return { error: "Bu işlem için yetkin yok." };
  const servis = gorevIstemcisi();
  if (!servis) return { error: "Sunucu yapılandırması eksik." };

  const { data } = await servis
    .from("google_donusumleri")
    .select("payment_id")
    .in("durum", ["bekliyor", "basarisiz"])
    .limit(200);

  let sayi = 0;
  for (const satir of data ?? []) {
    const sonuc = await kayitDonusumuGonder(satir.payment_id);
    if (sonuc === "gonderildi") sayi++;
  }
  revalidatePath("/kontrol-9f4x2k/google");
  return { sayi };
}
