import { NextResponse, after, type NextRequest } from "next/server";
import { dogrulamaIfadesi, imzaGecerliMi, webhookMesajlari, webhookRehberi } from "@/lib/whatsapp/webhook";
import { whatsappMesajlariniKaydet, whatsappRehberiniKaydet } from "@/lib/whatsapp/kaydet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * WhatsApp Cloud API webhook'u.
 *
 * Meta'daki adres SONDAKİ EĞİK ÇİZGİYLE girilmeli (…/api/whatsapp/webhook/):
 * next.config'te trailingSlash açık; çizgisiz adrese gelen POST 308 ile
 * yönlendiriliyor ve Meta yönlendirmeyi izlemiyor. Panel (WhatsApp
 * ekranı) adresi doğru biçimde gösteriyor.
 *
 * Gizli değer: WHATSAPP_APP_SECRET (Vercel). Abonelik doğrulama ifadesi
 * ondan türetiliyor (lib/whatsapp/webhook → dogrulamaIfadesi).
 */

const sir = () => process.env.WHATSAPP_APP_SECRET?.trim() ?? "";

/** Abonelik doğrulaması: Meta "hub.challenge"ı geri bekliyor. */
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const s = sir();
  if (s && p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === dogrulamaIfadesi(s)) {
    return new NextResponse(p.get("hub.challenge") ?? "", { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest) {
  const s = sir();
  if (!s) {
    // Yapılandırma eksik: Meta tekrar deneyecek; 503 bunu doğru anlatıyor.
    console.error("[whatsapp] WHATSAPP_APP_SECRET tanımlı değil; bildirim işlenmedi");
    return new NextResponse("Not configured", { status: 503 });
  }

  // İmza HAM gövde üzerinden; JSON'a çevirmeden önce.
  const ham = await request.text();
  if (!imzaGecerliMi(ham, request.headers.get("x-hub-signature-256"), s)) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let govde: unknown;
  try {
    govde = JSON.parse(ham);
  } catch {
    // İmzası doğru ama okunamayan gövde: tekrar göndermesi işe yaramaz.
    return new NextResponse("ok", { status: 200 });
  }

  /*
    Yazma yanıttan sonra: Meta birkaç saniye içinde 200 bekliyor, gecikirse
    aynı bildirimi tekrar gönderiyor. Tekrar zararsız (wa_mesaj_id benzersiz)
    ama gereksiz.
  */
  const mesajlar = webhookMesajlari(govde);
  const rehber = webhookRehberi(govde);
  if (mesajlar.length) after(() => whatsappMesajlariniKaydet(mesajlar));
  if (rehber.length) after(() => whatsappRehberiniKaydet(rehber));

  return new NextResponse("ok", { status: 200 });
}
