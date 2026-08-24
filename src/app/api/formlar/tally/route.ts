import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { IMZA_BASLIGI, imzaDogru, kullaniciyiBul, yanitOlayiMi } from "@/lib/tally";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Tally ön değerlendirme formunun webhook'u.
 *
 * Bunun öncesinde adımı KATILIMCININ KENDİSİ işaretliyordu: panelde bir
 * "formu doldurdum" düğmesi vardı. Formu hiç açmadan basılabiliyordu ve
 * bunun bedeli görünenden büyük — bu adım eğitim planlamasının kapısı, yani
 * yanlış işaretlendiğinde eğitmen ön değerlendirmeyi okumadan tarih
 * planlıyor.
 *
 * Düğmeyi gizlemek yetmezdi: işaretleme bir server action'dı, yani herkese
 * açık bir uç nokta. Kim olduğunu doğrulayan tek yol, cevabın Tally'den
 * gelmesi.
 *
 * Kimlik doğrulaması YOK ve olamaz: isteği Tally'nin sunucusu atıyor,
 * oturumumuz yok. Güvenliği sağlayan şey imza — gövdenin HMAC'i, yalnızca
 * bizde ve Tally'de olan sırla hesaplanıyor.
 */

export async function POST(istek: Request) {
  const sir = process.env.TALLY_IMZA_ANAHTARI?.trim();
  if (!sir) {
    /*
      Sır tanımlı değilse istek İŞLENMİYOR.

      "Sır yoksa imzayı atla" demek, uç noktayı herkese açık bir işaretleme
      düğmesine çevirirdi — düzeltmeye çalıştığımız şeyin aynısı, üstelik
      artık oturum bile gerekmeden.
    */
    console.error("[tally] TALLY_IMZA_ANAHTARI tanımlı değil; webhook işlenmedi.");
    return NextResponse.json({ hata: "Yapılandırılmadı." }, { status: 503 });
  }

  // Ham metin: imza baytlar üzerinden hesaplanıyor, JSON.parse edilip tekrar
  // stringify edilen gövde aynı imzayı vermiyor.
  const ham = await istek.text();

  if (!imzaDogru(ham, istek.headers.get(IMZA_BASLIGI), sir)) {
    return NextResponse.json({ hata: "İmza doğrulanamadı." }, { status: 401 });
  }

  let govde: unknown;
  try {
    govde = JSON.parse(ham);
  } catch {
    return NextResponse.json({ hata: "Gövde okunamadı." }, { status: 400 });
  }

  // Tally başka olay türleri de yollayabiliyor; onlara 200 dönüp geçiyoruz ki
  // yeniden denemesin.
  if (!yanitOlayiMi(govde)) return NextResponse.json({ atlandi: "olay türü" });

  const userId = kullaniciyiBul(govde);
  if (!userId) {
    /*
      Gizli alan boş geldi. En olası sebebi formdaki alan adının "kullanici"
      olmaması — Tally tanımsız bir parametreyi sessizce yok sayıyor.

      200 dönülüyor: Tally'nin tekrar denemesi bir şeyi düzeltmez, ama günlükte
      iz kalıyor.
    */
    console.error("[tally] yanıtta 'kullanici' gizli alanı yok; işaretlenemedi.");
    return NextResponse.json({ atlandi: "kullanıcı yok" });
  }

  const servis = gorevIstemcisi();
  if (!servis) {
    return NextResponse.json({ hata: "Servis anahtarı tanımlı değil." }, { status: 500 });
  }

  /*
    Damga yalnızca BOŞSA yazılıyor.

    Tally başarısız bir teslimattan sonra aynı yanıtı tekrar yollayabiliyor;
    koşulsuz yazsaydık ikinci deneme tarihi ileri kaydırırdı. İlk gönderim
    tarihi doğru olan.
  */
  const { data, error } = await servis
    .from("profiles")
    .update({ on_degerlendirme_tarihi: new Date().toISOString() })
    .eq("id", userId)
    .is("on_degerlendirme_tarihi", null)
    .select("id");

  if (error) {
    // 500 dönülüyor ki Tally tekrar denesin: bu geçici bir veritabanı hatası
    // olabilir ve cevabın kaybolmasına gerek yok.
    console.error("[tally] damga yazılamadı", error.message);
    return NextResponse.json({ hata: "Kaydedilemedi." }, { status: 500 });
  }

  // Panelin adım kartı ve yan menü rozeti düzende duruyor.
  revalidatePath("/panel", "layout");
  revalidatePath("/panel/testlerim");

  return NextResponse.json({ isaretlendi: (data?.length ?? 0) > 0 });
}
