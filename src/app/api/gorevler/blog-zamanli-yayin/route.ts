import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { blogSayfalariniTazele } from "@/lib/blog-tazele";

// node:crypto gerekiyor; edge çalışma zamanında yok.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Zamanlı blog yazılarını yayına alır.
 *
 * Zamanlayıcı (pg_cron, `blog-zamanli-yayin`) her dakika bakıyor ama bu ucu
 * YALNIZCA vakti gelmiş bir yazı varken çağırıyor. Yayına alma veritabanında
 * tek bir güncellemeyle yapılıyor (zamani_gelen_yazilari_yayinla); burada
 * yapılan, yayına girenlerin sayfalarını tazelemek.
 *
 * Görev ortada düşerse: yazılar ya hiç yayına alınmamıştır (bir sonraki
 * dakika tekrar denenir) ya da alınmıştır ve sayfalar en geç saatlik yeniden
 * üretimde görünür. Yarım kalan bir durum yok.
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

  const supabase = gorevIstemcisi();
  if (!supabase) {
    return NextResponse.json({ hata: "SUPABASE_SERVICE_ROLE_KEY tanımlı değil." }, { status: 500 });
  }

  const { data, error } = await supabase.rpc("zamani_gelen_yazilari_yayinla");
  if (error) {
    console.error("[blog-zamanli-yayin]", error.message);
    return NextResponse.json({ hata: error.message }, { status: 500 });
  }

  const yayinlanan = data ?? [];
  if (yayinlanan.length > 0) {
    blogSayfalariniTazele(yayinlanan.flatMap((y) => [y.slug, y.kategori_slug]));
  }

  return NextResponse.json({ yayinlanan: yayinlanan.map((y) => y.slug) });
}
