import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { iyzicoAyari } from "@/lib/iyzico";
import { denemeyiCoz } from "@/lib/odeme-sonuc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * iyzico 3D Secure dönüşü.
 *
 * Bu adres KİMLİK DOĞRULAMASIZ çalışmak zorunda: isteği iyzico'nun sayfası
 * form gönderimiyle yapıyor ve tarayıcı çapraz site POST'ta oturum çerezini
 * (SameSite=Lax) taşımıyor. Bu yüzden kullanıcı okunmuyor, servis anahtarı
 * kullanılıyor.
 *
 * Güvenliği sağlayan şey POST gövdesi DEĞİL — gövdedeki tek bilgi token ve ona
 * güvenmiyoruz. Sonucu iyzico'ya sunucudan tekrar soruyoruz (denemeyiCoz).
 */

/**
 * Dönüş adresinin kökü.
 *
 * `istek.url` yerine başlıklar okunuyor: Vercel'de istek dahili bir adresle
 * gelebiliyor ve o adrese yönlendirmek öğrenciyi sitenin dışına atardı.
 */
function kokAdres(istek: Request): string {
  const h = istek.headers;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return new URL(istek.url).origin;
  const sema = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${sema}://${host}`;
}

function panele(kok: string, sonuc: string) {
  /*
    Ödeme burada tamamlanıyor ve panelin DÜZENİ bundan etkileniyor: yan
    menüdeki bekleyen ödeme işareti ve genel bakıştaki bildirim kutusu orada
    duruyor. Yalnızca ödemeler sayfasına yönlendirmek, tahsilat bittiği halde
    işaretin bir süre daha durması demekti.
  */
  revalidatePath("/panel/odemelerim");
  revalidatePath("/panel", "layout");

  // 303: iyzico POST ile geldi, tarayıcının yönlendirmeyi GET olarak izlemesi
  // gerekiyor. 302'de bazı tarayıcılar POST'u tekrarlıyor.
  return NextResponse.redirect(new URL(`/panel/odemelerim?sonuc=${sonuc}`, kok), 303);
}

/**
 * iyzico dönüşü token'ı POST gövdesinde gönderiyor; bazı akışlarda adres
 * satırında da taşıyor. İkisine de bakılıyor — hangisinden gelirse.
 */
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

  const ayar = iyzicoAyari();
  const servis = gorevIstemcisi();
  if (!ayar || !servis) return panele(kok, "hata");
  if (!token) return panele(kok, "hata");

  /*
    Damga her şeyden ÖNCE atılıyor.

    Doğrulama başarısız olsa bile "iyzico bize döndü" bilgisi kalmalı: bu damga
    olmadan takılı bir kayıt iki ayrı şeyi birden anlatıyor — öğrenci vazgeçti
    mi, yoksa ödedi de dönüş mü kayboldu? İlki normal, ikincisi para çekilmiş
    ama kaydı olmayan bir durum ve tanılamada ayırt edilebilmesi gerekiyor.
  */
  await servis.from("odeme_denemeleri").update({ callback_at: new Date().toISOString() }).eq("token", token);

  const sonuc = await denemeyiCoz(servis, ayar, token);
  if (sonuc === "basarili") return panele(kok, "basarili");
  if (sonuc === "basarisiz") return panele(kok, "basarisiz");
  // "belirsiz" ve "eslesmedi": para çekilmiş olabilir, emin değiliz. Öğrenciye
  // tekrar denemesini söylemiyoruz.
  return panele(kok, "belirsiz");
}

/** Adres elle açılırsa (ya da iyzico GET ile dönerse) aynı akışı çalıştır. */
export async function GET(istek: Request) {
  const kok = kokAdres(istek);
  const token = new URL(istek.url).searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/panel/odemelerim", kok), 303);
  return POST(istek);
}
