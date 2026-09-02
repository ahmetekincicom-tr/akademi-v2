import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { onDegerlendirmeHatirlat } from "@/lib/egitim-eposta";
import { danismanlikOdemeKumesi, egitimOdemeleri } from "@/lib/egitim-odemesi";

// node:crypto gerekiyor; edge çalışma zamanında yok.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Erişimi açıldığı hâlde ön değerlendirmeyi doldurmayanlara hatırlatma.
 *
 * Panelde bunun için bir şerit var ama şerit yalnızca panele GİREN kişiye
 * çalışıyor; kimse her gün girmiyor ve testi doldurmamış kişi çoğu zaman tam
 * olarak panele girmeyen kişi.
 *
 * Kişi başına BİR KEZ. Doldurmamak bir tercih de olabilir ve aynı maili
 * tekrar göndermek ilkini de okunmaz hâle getiriyor.
 *
 * Damga gönderimden SONRA atılıyor: görev ortada çökerse mail hiç gitmemiş
 * sayılır ve bir sonraki tur tekrar dener. Tersi olsaydı sessizce kaybolurdu.
 */

/** Erişim açıldıktan sonra hatırlatmaya kadar beklenen süre. */
const BEKLEME_SAAT = 48;

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

  const esik = new Date(Date.now() - BEKLEME_SAAT * 3_600_000).toISOString();

  /*
    Erişimin iki kaynağı var ve ikisi ayrı sorgu:

      1. Kendi ödemesi   — payments.durum = 'odendi'
      2. Kurumsal koltuk — odeme_katilimcilari

    Tek sorguda gömme ile birleştirilmiyor: odeme_katilimcilari, payments'ı
    hem profiles hem courses ile ilişkili bir bağlantı tablosuna çevirdiğinden
    gömme ifadeleri belirsiz kalıyor (PGRST201). Bu depoda bir kez ödemeler
    ekranını boşaltan hata tam olarak buydu.
  */
  const [
    { data: odemeler, error: odemeHata },
    { data: koltuklar, error: koltukHata },
    { data: gorusmeOdemeleri, error: gorusmeHata },
  ] = await Promise.all([
    supabase
      .from("payments")
      .select("id, user_id, odeme_tarihi, created_at")
      .eq("durum", "odendi")
      .lte("created_at", esik),
    supabase.from("odeme_katilimcilari").select("user_id, payment_id").lte("created_at", esik),
    /*
      DANIŞMANLIK ÖDEMELERİ LİSTE DIŞI.

      Görüşme ücreti de payments'a yazılıyor; "ödenmiş ödemesi olan" diye
      sorulduğunda yalnızca danışmanlık alan, hiçbir eğitime katılmayan kişi
      de aday oluyordu ve ona "ön değerlendirmeni doldur" maili gidiyordu.
      Ön değerlendirme birebir EĞİTİMİN kapsamını kurmak için var;
      danışmanlık görüşmesinin böyle bir adımı yok.

      Ayrım course_id'ye değil görüşme bağına bakıyor — gerekçesi
      egitim_erisimim() işlevinin migration'ında.
    */
    supabase.from("gorusmeler").select("payment_id").not("payment_id", "is", null),
  ]);

  if (odemeHata || koltukHata || gorusmeHata) {
    return NextResponse.json({ hata: (odemeHata ?? koltukHata ?? gorusmeHata)!.message }, { status: 500 });
  }

  const danismanlik = danismanlikOdemeKumesi(gorusmeOdemeleri);

  const odenmisOdemeler = new Set(
    egitimOdemeleri(odemeler ?? [], danismanlik).map((o) => o.user_id as string),
  );

  // Ödemesi tamamlanmamış bir koltuk erişim vermiyor (bkz. egitim_erisimim);
  // o kişiye "testin açıldı" demek olmayan bir kapıyı göstermek olurdu.
  const { data: odenmisIdler } = await supabase.from("payments").select("id").eq("durum", "odendi");
  const odenmisSet = new Set(egitimOdemeleri(odenmisIdler ?? [], danismanlik).map((p) => p.id as string));

  const adaylar = new Set<string>(odenmisOdemeler);
  for (const k of koltuklar ?? []) {
    if (odenmisSet.has(k.payment_id as string)) adaylar.add(k.user_id as string);
  }

  if (adaylar.size === 0) return NextResponse.json({ aday: 0, gonderilen: 0 });

  // Damgası olan ve testi dolduran zaten elenmiş olarak geliyor: filtreyi
  // veritabanına bırakmak, aday listesi büyüdükçe tek fark yaratan şey.
  const { data: kisiler, error: kisiHata } = await supabase
    .from("profiles")
    .select("id")
    .in("id", [...adaylar])
    .is("on_degerlendirme_tarihi", null)
    .is("on_degerlendirme_hatirlatma_tarihi", null)
    .not("email", "is", null);

  if (kisiHata) return NextResponse.json({ hata: kisiHata.message }, { status: 500 });

  let gonderilen = 0;
  const basarisiz: string[] = [];

  for (const k of kisiler ?? []) {
    const sonuc = await onDegerlendirmeHatirlat(supabase, k.id as string);
    if (!sonuc.gonderildi) {
      basarisiz.push(sonuc.sebep ?? "bilinmeyen");
      // Damga ATILMIYOR: gitmeyen mail bir sonraki turda tekrar denensin.
      continue;
    }
    gonderilen += 1;
    await supabase
      .from("profiles")
      .update({ on_degerlendirme_hatirlatma_tarihi: new Date().toISOString() })
      .eq("id", k.id as string);
  }

  return NextResponse.json({
    aday: kisiler?.length ?? 0,
    gonderilen,
    basarisiz: basarisiz.length,
  });
}
