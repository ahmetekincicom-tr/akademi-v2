import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Doküman indirme — kendi alan adımızdan, imzalı adres görünmeden.
 *
 * Önceden panel, Supabase'ten 60 saniyelik imzalı bir adres alıp tarayıcıyı
 * oraya gönderiyordu: kullanıcı supabase.co adresini görüyor, kopyaladığı
 * bağlantı bir dakika sonra ölüyordu.
 *
 * Şimdi adres /indir/<doküman kimliği>. Yetki kontrolü BURADA:
 *
 *   1. Oturum yoksa girişe gönderiliyor.
 *   2. Satır, kullanıcının kendi Supabase istemcisiyle okunuyor — yani
 *      documents tablosundaki RLS politikası neyi görüyorsa o. Yetkisi
 *      olmayan için satır hiç dönmüyor ve 404 veriyoruz.
 *
 * İmzalı adres yalnızca sunucuda kullanılıyor; dosya buradan akıtılıyor.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(istek: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const kok = new URL(istek.url).origin;
    return NextResponse.redirect(`${kok}/giris`, { status: 302 });
  }

  // RLS: kullanıcı yalnızca kendisine açık dokümanları görebiliyor.
  const { data: dokuman } = await supabase
    .from("documents")
    .select("baslik, dosya_yolu, dosya_tipi")
    .eq("id", id)
    .maybeSingle();

  if (!dokuman?.dosya_yolu) {
    return NextResponse.json({ hata: "Doküman bulunamadı." }, { status: 404 });
  }

  const yol = dokuman.dosya_yolu as string;
  const { data: imzali, error } = await supabase.storage.from("dokumanlar").createSignedUrl(yol, 60);
  if (error || !imzali?.signedUrl) {
    return NextResponse.json({ hata: "Dosya bağlantısı oluşturulamadı." }, { status: 502 });
  }

  const cevap = await fetch(imzali.signedUrl, { cache: "no-store" });
  if (!cevap.ok || !cevap.body) {
    return NextResponse.json({ hata: "Dosya okunamadı." }, { status: 502 });
  }

  const baslik = new Headers();
  const tip =
    (dokuman.dosya_tipi as string) || cevap.headers.get("content-type") || "application/octet-stream";
  baslik.set("Content-Type", tip);
  const boyut = cevap.headers.get("content-length");
  if (boyut) baslik.set("Content-Length", boyut);
  /*
    inline: PDF tarayıcıda açılsın, indirme zorunlu olmasın — panelde en sık
    yapılan şey dosyaya bakmak. Dosya adı, depodaki zaman damgalı ad değil
    panelde yazılan başlık: indirilen dosyanın adı "1725… .pdf" olmasın.

    SVG bunun dışında: kendi alan adımızdan AÇILAN bir SVG içindeki script
    panelin kaynağında çalışırdı. Doküman kovasına SVG yüklemek olağan değil
    ama mümkün; indirmeye zorlamak o kapıyı görüntülemeyi bozmadan kapatıyor.
  */
  const yerlesim = tip.startsWith("image/svg") ? "attachment" : "inline";
  baslik.set(
    "Content-Disposition",
    `${yerlesim}; filename*=UTF-8''${encodeURIComponent(dosyaAdi(dokuman.baslik as string, yol))}`,
  );
  baslik.set("Cache-Control", "private, no-store");
  baslik.set("X-Content-Type-Options", "nosniff");

  return new NextResponse(cevap.body, { status: 200, headers: baslik });
}

/** "Kampanya kontrol listesi" + .pdf */
function dosyaAdi(baslik: string, yol: string): string {
  const uzanti = yol.includes(".") ? yol.slice(yol.lastIndexOf(".")) : "";
  const ad = (baslik || "dokuman").trim().replace(/[\\/:*?"<>|]+/g, "-");
  return ad.toLocaleLowerCase("tr").endsWith(uzanti.toLocaleLowerCase("tr")) ? ad : `${ad}${uzanti}`;
}
