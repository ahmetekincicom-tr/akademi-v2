import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { aboneligiSenkronla, formDonusunuCoz } from "@/lib/abonelik";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Abonelik mutabakatı — saatte bir (pg_cron, 20261021120000_video_aboneligi.sql).
 *
 * Asıl yollar formun dönüşü ve iyzico'nun bildirimi. İkisi de kaybolabiliyor:
 * tarayıcı dönüşten önce kapanır, bildirim üç denemede ulaşamaz. Bu görev
 * iki şeye bakıyor:
 *
 *   1. Dönüşü gelmemiş ödeme formları: para çekilmiş olabilir.
 *   2. Dönem sonu gelmiş abonelikler: yenilemenin sonucu işlenmeli; kaçarsa
 *      ödeyen kişinin erişimi ek süre bitince kapanırdı.
 */

function anahtarDogru(istek: Request): boolean {
  const beklenen = process.env.GOREV_ANAHTARI;
  if (!beklenen) return false;
  const a = Buffer.from(istek.headers.get("x-gorev-anahtari") ?? "");
  const b = Buffer.from(beklenen);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(istek: Request) {
  if (!anahtarDogru(istek)) return NextResponse.json({ hata: "Yetkisiz." }, { status: 401 });

  const servis = gorevIstemcisi();
  if (!servis) return NextResponse.json({ hata: "SUPABASE_SERVICE_ROLE_KEY tanımlı değil." }, { status: 500 });

  const simdi = Date.now();
  const dk = 60_000;

  /*
    1) Askıdaki formlar: 5 dakikadan eski (kişi hâlâ formdaysa rahatsız
    etmeyelim), 2 günden yeni (iyzico'nun form ömrü çoktan dolmuş olanı
    sonsuza dek sormayalım).
  */
  const { data: askida } = await servis
    .from("abonelikler")
    .select("id, token")
    .eq("durum", "bekliyor")
    .is("iyzico_abonelik_kodu", null)
    .not("token", "is", null)
    .lt("created_at", new Date(simdi - 5 * dk).toISOString())
    .gt("created_at", new Date(simdi - 2 * 24 * 60 * dk).toISOString())
    .limit(50);

  const formlar = { basarili: 0, basarisiz: 0, belirsiz: 0, eslesmedi: 0 };
  for (const s of askida ?? []) formlar[await formDonusunuCoz(servis, s.token!)] += 1;

  // 2 günden eski, hiç tamamlanmamış formlar kapanıyor: yönetim listesinde
  // "ödeme bekleniyor" diye sonsuza dek durmasınlar.
  await servis
    .from("abonelikler")
    .update({ durum: "basarisiz", son_hata: "Ödeme formu tamamlanmadı." })
    .eq("durum", "bekliyor")
    .is("iyzico_abonelik_kodu", null)
    .lt("created_at", new Date(simdi - 2 * 24 * 60 * dk).toISOString());

  /*
    2) Dönem sonu yaklaşmış ya da geçmiş, hâlâ süren abonelikler. Pencere
    geniş tutuluyor (2 saat ileri): yenileme çekimi dönem sınırında yapılıyor
    ve sonucu ne kadar erken işlenirse kişiye o kadar erken haber gidiyor.
  */
  const { data: donemSonu } = await servis
    .from("abonelikler")
    .select("id")
    .in("durum", ["aktif", "odeme_alinamadi"])
    .not("iyzico_abonelik_kodu", "is", null)
    .lt("donem_bitis", new Date(simdi + 120 * dk).toISOString())
    .order("donem_bitis")
    .limit(50);

  const senkron = { guncellendi: 0, belirsiz: 0, bulunamadi: 0 };
  for (const s of donemSonu ?? []) senkron[await aboneligiSenkronla(servis, s.id)] += 1;

  return NextResponse.json({ formlar, senkron });
}
