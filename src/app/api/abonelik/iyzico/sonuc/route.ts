import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { formDonusunuCoz } from "@/lib/abonelik";
import { kokAdres } from "@/lib/kok-adres";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Abonelik ödeme formunun dönüşü.
 *
 * Tek seferlik ödemenin dönüşüyle aynı gerekçeyle KİMLİK DOĞRULAMASIZ:
 * iyzico'nun sayfası çapraz site form gönderimiyle geliyor ve oturum çerezi
 * taşınmıyor. Güvenliği gövde değil, sonucun iyzico'ya sunucudan tekrar
 * sorulması sağlıyor (formDonusunuCoz).
 */

function panele(kok: string, sonuc: string) {
  // Derslerim ve menü bu dönüşle değişiyor; yalnız abonelik sayfasını
  // tazelemek, kilidin bir süre daha görünmesi demekti.
  revalidatePath("/panel", "layout");
  // 303: POST ile geldik, tarayıcı yönlendirmeyi GET olarak izlesin.
  return NextResponse.redirect(new URL(`/panel/abonelik?sonuc=${sonuc}`, kok), 303);
}

async function tokenAl(istek: Request): Promise<string> {
  const adresten = new URL(istek.url).searchParams.get("token");
  if (adresten) return adresten;
  try {
    const form = await istek.formData();
    return String(form.get("token") ?? "");
  } catch {
    return "";
  }
}

export async function POST(istek: Request) {
  const kok = kokAdres(istek);
  const token = await tokenAl(istek);
  const servis = gorevIstemcisi();
  if (!servis || !token) return panele(kok, "hata");

  // Damga her şeyden önce: "iyzico bize döndü" bilgisi doğrulama başarısız
  // olsa da kalmalı (gerekçesi tek seferlik ödemenin dönüşünde).
  await servis.from("abonelikler").update({ callback_at: new Date().toISOString() }).eq("token", token);

  const sonuc = await formDonusunuCoz(servis, token);
  return panele(kok, sonuc === "eslesmedi" ? "belirsiz" : sonuc);
}

export async function GET(istek: Request) {
  const kok = kokAdres(istek);
  if (!new URL(istek.url).searchParams.get("token")) {
    return NextResponse.redirect(new URL("/panel/abonelik", kok), 303);
  }
  return POST(istek);
}
