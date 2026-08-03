import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { pushGonder } from "@/lib/apns";

// node:http2 ve node:crypto gerekiyor; edge çalışma zamanında ikisi de yok.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Başlangıç saati gelen birebir eğitimler için otomatik bildirim.
 *
 * Zamanlayıcı Supabase'de (pg_cron) — Vercel'in cron'u ücretsiz planda günde
 * bir kez çalışıyor, bu iş dakika hassasiyeti istiyor.
 *
 * Aynı oturum iki kez bildirim göndermesin diye damga oturumun kendi satırına
 * yazılıyor. Damga gönderimden SONRA atılıyor: görev ortada çökerse bildirim
 * hiç gitmemiş sayılır ve bir sonraki tur tekrar dener. Tersi olsaydı sessizce
 * kaybolurdu.
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

type Oturum = {
  id: string;
  user_id: string;
  baslangic: string;
  konu: string | null;
};

export async function POST(istek: Request) {
  if (!anahtarDogru(istek)) {
    return NextResponse.json({ hata: "Yetkisiz." }, { status: 401 });
  }

  const supabase = gorevIstemcisi();
  if (!supabase) {
    return NextResponse.json({ hata: "SUPABASE_SERVICE_ROLE_KEY tanımlı değil." }, { status: 500 });
  }

  const simdi = Date.now();
  // Pencere: başlangıcı 2 dakika içinde olan ya da son 30 dakikada başlamış
  // oturumlar. Üst sınır cron'un tam saniyeye denk gelmemesini tolere ediyor,
  // alt sınır ise günler önce kaçmış bir oturumun şimdi bildirim atmasını
  // engelliyor.
  const ust = new Date(simdi + 2 * 60_000).toISOString();
  const alt = new Date(simdi - 30 * 60_000).toISOString();

  const { data: oturumlar, error } = await supabase
    .from("egitim_oturumlari")
    .select("id, user_id, baslangic, konu")
    .eq("durum", "planlandi")
    .is("bildirim_gonderildi_tarihi", null)
    .lte("baslangic", ust)
    .gt("baslangic", alt);

  if (error) return NextResponse.json({ hata: error.message }, { status: 500 });

  const sira = (oturumlar ?? []) as Oturum[];
  if (sira.length === 0) return NextResponse.json({ oturum: 0, gonderilen: 0 });

  // Cihazlar tek sorguda alınıyor; oturum başına sorgu atmak gereksiz.
  const { data: cihazlar } = await supabase
    .from("push_cihazlar")
    .select("user_id, token")
    .is("gecersiz_tarihi", null)
    .in("user_id", [...new Set(sira.map((o) => o.user_id))]);

  const kisiTokenlari = new Map<string, string[]>();
  for (const c of cihazlar ?? []) {
    const mevcut = kisiTokenlari.get(c.user_id as string);
    if (mevcut) mevcut.push(c.token as string);
    else kisiTokenlari.set(c.user_id as string, [c.token as string]);
  }

  let toplamGonderilen = 0;
  const olenTokenlar: string[] = [];

  for (const o of sira) {
    const tokenlar = kisiTokenlari.get(o.user_id) ?? [];

    if (tokenlar.length > 0) {
      const sonuc = await pushGonder(
        tokenlar,
        "Eğitimin başlıyor",
        o.konu ? `${o.konu} — katılmak için dokun.` : "Birebir eğitimin başladı, katılmak için dokun.",
        // Bildirime dokununca doğrudan katılma ekranına gidilsin.
        { yol: "/panel/birebir-egitim" },
      );
      toplamGonderilen += sonuc.gonderilen;
      olenTokenlar.push(...sonuc.gecersizTokenlar);
    }

    // Cihazı olmayan öğrencinin oturumu da damgalanıyor: pencere kapandıktan
    // sonra bildirim göndermenin anlamı yok, her turda yeniden denenmesin.
    await supabase
      .from("egitim_oturumlari")
      .update({ bildirim_gonderildi_tarihi: new Date().toISOString() })
      .eq("id", o.id);
  }

  if (olenTokenlar.length > 0) {
    await supabase
      .from("push_cihazlar")
      .update({ gecersiz_tarihi: new Date().toISOString() })
      .in("token", olenTokenlar);
  }

  return NextResponse.json({
    oturum: sira.length,
    gonderilen: toplamGonderilen,
    gecersiz: olenTokenlar.length,
  });
}
