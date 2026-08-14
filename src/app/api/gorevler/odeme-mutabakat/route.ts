import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { iyzicoAyari } from "@/lib/iyzico";
import { denemeyiCoz } from "@/lib/odeme-sonuc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Askıda kalmış ödeme denemelerinin mutabakatı.
 *
 * 3D Secure dönüşü tek nokta arıza: tarayıcı kapanır, ağ kopar, yönlendirme
 * engellenir. O anda para çekilmiş ama kaydımız "bekliyor" kalır ve öğrenci
 * ödediği eğitimin borçlusu görünür.
 *
 * Bu görev sonucu belli olmamış denemeleri iyzico'ya sorup kesinleştiriyor.
 * Zamanlayıcı Supabase'de (pg_cron) — eğitim hatırlatmasıyla aynı desen.
 */

function anahtarDogru(istek: Request): boolean {
  const beklenen = process.env.GOREV_ANAHTARI;
  if (!beklenen) return false;

  const gelen = istek.headers.get("x-gorev-anahtari") ?? "";
  const a = Buffer.from(gelen);
  const b = Buffer.from(beklenen);
  // Uzunluk farkı timingSafeEqual'ı hata fırlattığı için önce ayıklanıyor.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(istek: Request) {
  if (!anahtarDogru(istek)) {
    return NextResponse.json({ hata: "Yetkisiz." }, { status: 401 });
  }

  const ayar = iyzicoAyari();
  if (!ayar) return NextResponse.json({ hata: "iyzico anahtarları tanımlı değil." }, { status: 500 });

  const servis = gorevIstemcisi();
  if (!servis) {
    return NextResponse.json({ hata: "SUPABASE_SERVICE_ROLE_KEY tanımlı değil." }, { status: 500 });
  }

  const simdi = Date.now();
  /*
    Pencere: 5 dakikadan eski, 3 günden yeni denemeler.

    Alt sınır, ödemesi hâlâ devam eden kişiyi rahatsız etmiyor — öğrenci 3D
    Secure ekranındayken sorarsak iyzico "tamamlanmadı" der ve denemeyi
    başarısız olarak kapatırdık.

    Üst sınır, iyzico token'ının ömrü dolduktan sonra sonsuza dek aynı kayıtları
    sormamak için. O tarihten eskisi zaten kesin başarısızdır.
  */
  const ust = new Date(simdi - 5 * 60_000).toISOString();
  const alt = new Date(simdi - 3 * 24 * 60 * 60_000).toISOString();

  const { data: askidakiler, error } = await servis
    .from("odeme_denemeleri")
    .select("id, token")
    .eq("durum", "baslatildi")
    .not("token", "is", null)
    .lt("created_at", ust)
    .gt("created_at", alt)
    .order("created_at")
    .limit(50);

  if (error) return NextResponse.json({ hata: error.message }, { status: 500 });

  const sayac = { basarili: 0, basarisiz: 0, eslesmedi: 0, belirsiz: 0 };
  for (const d of askidakiler ?? []) {
    const sonuc = await denemeyiCoz(servis, ayar, d.token!);
    sayac[sonuc] += 1;
  }

  return NextResponse.json({ bakilan: askidakiler?.length ?? 0, ...sayac });
}
