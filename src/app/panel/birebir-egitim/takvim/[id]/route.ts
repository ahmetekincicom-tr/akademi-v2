import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { guvenliUrl } from "@/lib/guvenli-url";

/**
 * "Takvime ekle": tek oturumluk .ics dosyası. iPhone, Android, Google ve
 * Outlook takvimlerinin hepsi açıyor; ayrı entegrasyon gerekmiyor.
 *
 * Yetki: satır kullanıcının kendi istemcisiyle okunuyor ve user_id süzgeci
 * açık — RLS yöneticiye herkesin oturumunu gösteriyor, panel ise kişinin
 * kendi takvimi (bkz. lib/panel-kapsam.ts). Başkasının kimliği 404.
 */

export const dynamic = "force-dynamic";

/** RFC 5545 metin kaçışı. */
function kac(metin: string): string {
  return metin.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** 2026-10-08T11:00:00.000Z → 20261008T110000Z */
function icsZaman(an: Date): string {
  return an.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export async function GET(istek: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${new URL(istek.url).origin}/giris`, { status: 302 });

  const { data: o } = await supabase
    .from("egitim_oturumlari")
    .select("id, baslangic, sure_dk, konu, toplanti_link, courses(baslik)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!o) return NextResponse.json({ hata: "Oturum bulunamadı." }, { status: 404 });

  const bas = new Date(o.baslangic);
  const bit = new Date(bas.getTime() + (o.sure_dk ?? 60) * 60_000);
  const link = guvenliUrl(o.toplanti_link);
  const baslik = o.konu?.trim() || o.courses?.baslik || "Birebir eğitim oturumu";
  const aciklama = [o.courses?.baslik, link ? `Katılım: ${link}` : "Katılım bağlantısı panelde paylaşılacak."]
    .filter(Boolean)
    .join("\n");

  const satirlar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ahmet Ekinci Akademi//Birebir Egitim//TR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${o.id}@ahmetekinciakademi.com`,
    `DTSTAMP:${icsZaman(new Date())}`,
    `DTSTART:${icsZaman(bas)}`,
    `DTEND:${icsZaman(bit)}`,
    `SUMMARY:${kac(baslik)}`,
    `DESCRIPTION:${kac(aciklama)}`,
    ...(link ? [`LOCATION:${kac(link)}`, `URL:${link}`] : []),
    // Dersten 15 dk önce hatırlatma.
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    `DESCRIPTION:${kac(baslik)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return new NextResponse(satirlar.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="birebir-egitim.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}
