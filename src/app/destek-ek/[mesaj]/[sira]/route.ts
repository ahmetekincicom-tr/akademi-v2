import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { EK_KOVA, EK_TIPLERI, type DestekEk } from "@/lib/destek-ek";

/**
 * Destek mesajı eki — kendi alan adımızdan, imzalı adres görünmeden
 * (bkz. /indir/[id] ile aynı desen).
 *
 * Yetki iki katlı:
 *   1. Mesaj satırı kullanıcının kendi istemcisiyle okunuyor: RLS yalnız
 *      kendi talebindeki (iç not olmayan) mesajları ya da yöneticiye hepsini
 *      döndürüyor. Göremediği mesajın ekine 404.
 *   2. İmzalı adres de kullanıcının istemcisiyle alınıyor; depo politikası
 *      ayrıca "dosya o mesajı gönderenin klasöründe mi" diye bakıyor.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(istek: Request, { params }: { params: Promise<{ mesaj: string; sira: string }> }) {
  const { mesaj, sira } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const kok = new URL(istek.url).origin;
    return NextResponse.redirect(`${kok}/giris`, { status: 302 });
  }

  const i = Number(sira);
  if (!Number.isInteger(i) || i < 0 || i > 3) {
    return NextResponse.json({ hata: "Ek bulunamadı." }, { status: 404 });
  }

  const { data: satir } = await supabase.from("support_messages").select("ekler").eq("id", mesaj).maybeSingle();
  const ek = (Array.isArray(satir?.ekler) ? (satir.ekler as unknown as DestekEk[]) : [])[i];
  if (!ek?.yol) return NextResponse.json({ hata: "Ek bulunamadı." }, { status: 404 });

  const { data: imzali, error } = await supabase.storage.from(EK_KOVA).createSignedUrl(ek.yol, 60);
  if (error || !imzali?.signedUrl) {
    return NextResponse.json({ hata: "Dosya bağlantısı oluşturulamadı." }, { status: 502 });
  }

  const cevap = await fetch(imzali.signedUrl, { cache: "no-store" });
  if (!cevap.ok || !cevap.body) {
    return NextResponse.json({ hata: "Dosya okunamadı." }, { status: 502 });
  }

  // Tür yalnız izin verilen listeden (görsel/PDF); kova da aynısını zorluyor.
  const tip = (EK_TIPLERI as readonly string[]).includes(ek.tip) ? ek.tip : "application/octet-stream";
  const baslik = new Headers();
  baslik.set("Content-Type", tip);
  const boyut = cevap.headers.get("content-length");
  if (boyut) baslik.set("Content-Length", boyut);
  const yerlesim = tip === "application/octet-stream" ? "attachment" : "inline";
  const ad = (ek.ad || "ek").replace(/[\\/:*?"<>|]+/g, "-");
  baslik.set("Content-Disposition", `${yerlesim}; filename*=UTF-8''${encodeURIComponent(ad)}`);
  baslik.set("Cache-Control", "private, max-age=300");
  baslik.set("X-Content-Type-Options", "nosniff");

  return new NextResponse(cevap.body, { status: 200, headers: baslik });
}
