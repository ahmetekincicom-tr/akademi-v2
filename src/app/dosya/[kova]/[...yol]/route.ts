import { NextResponse } from "next/server";
import { acikKovaMi, supabaseNesneUrl } from "@/lib/depo";

/**
 * Yüklenen açık dosyaların servis edildiği uç.
 *
 * Tarayıcı /dosya/kapaklar/... istiyor, burası dosyayı Supabase'ten çekip
 * akıtıyor. Supabase adresi hiçbir zaman istemciye ulaşmıyor — gerekçesi
 * lib/depo.ts içinde.
 *
 * Yalnızca AÇIK kovalar: doküman kovası özel ve kendi ucundan (bkz.
 * app/indir/[id]) yetki kontrolüyle veriliyor. Kova adı adresten geldiği için
 * beyaz liste şart; olmasaydı adrese başka bir kova adı yazan herkes özel
 * kovaları da bu uçtan okuyabilirdi.
 */

export const runtime = "nodejs";

// Uzun önbellek: yüklemede dosya adının başına zaman damgası konuyor, aynı
// yol farklı bir içerikle bir daha kullanılmıyor. Görsel değiştiğinde adres
// de değişiyor, dolayısıyla bayat sürüm gösterme riski yok.
const ONBELLEK = "public, max-age=3600, s-maxage=31536000, stale-while-revalidate=86400";

export async function GET(
  _istek: Request,
  { params }: { params: Promise<{ kova: string; yol: string[] }> },
) {
  const { kova, yol } = await params;

  if (!acikKovaMi(kova)) {
    return NextResponse.json({ hata: "Bilinmeyen kova." }, { status: 404 });
  }

  const hedef = supabaseNesneUrl(kova, yol.map(decodeURIComponent).join("/"));
  if (!hedef) {
    return NextResponse.json({ hata: "Depo yapılandırılmadı." }, { status: 500 });
  }

  const cevap = await fetch(hedef, { cache: "no-store" });
  if (!cevap.ok || !cevap.body) {
    /*
      Olmayan bir nesne için Supabase 404 DEĞİL 400 döndürüyor (gövdesi
      "Object not found"). İkisi de bizim için "yok" demek; ayırmazsak silinmiş
      bir görsel 502 görünür ve gerçek bir depo arızasından ayırt edilemezdi.
    */
    const yok = cevap.status === 404 || cevap.status === 400;
    return NextResponse.json(
      { hata: yok ? "Dosya bulunamadı." : "Dosyaya ulaşılamadı." },
      { status: yok ? 404 : 502 },
    );
  }

  const baslik = new Headers();
  // SVG'nin script taşıma sorunu buradan değil next.config.ts'teki /dosya
  // CSP kuralından kapatılıyor: yanıt başlıkları orada eziliyor, burada
  // yazılan bir CSP istemciye hiç ulaşmıyordu.
  baslik.set("Content-Type", cevap.headers.get("content-type") ?? "application/octet-stream");
  const boyut = cevap.headers.get("content-length");
  if (boyut) baslik.set("Content-Length", boyut);
  baslik.set("Cache-Control", ONBELLEK);
  // Tarayıcı türü tahmin etmesin: kovaya yüklenen bir dosya script olarak
  // çalıştırılamasın.
  baslik.set("X-Content-Type-Options", "nosniff");

  return new NextResponse(cevap.body, { status: 200, headers: baslik });
}
