import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { kuyrugaGonder } from "@/lib/meta/gonderim";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Meta olay kuyruğunu boşaltır.
 *
 * Olayları üreten akışlar (ödeme onayı, form kaydı, WhatsApp tıklaması)
 * yalnızca satır yazıyor; ağ işini bu görev yapıyor. Meta yavaşladığında ya
 * da 500 döndüğünde bekleyen taraf burası oluyor, ödeme akışı değil.
 *
 * Zamanlayıcı Supabase'de (pg_cron), diğer görevlerle aynı desen ve aynı
 * anahtar.
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

  const servis = gorevIstemcisi();
  if (!servis) {
    return NextResponse.json({ hata: "SUPABASE_SERVICE_ROLE_KEY tanımlı değil." }, { status: 500 });
  }

  const ozet = await kuyrugaGonder(servis);
  return NextResponse.json(ozet);
}
