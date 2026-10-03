import { createClient } from "@/lib/supabase/server";
import { para, kisaTarihBicimi } from "@/lib/admin/format";
import { ayAnahtari, tarihSatiri } from "@/lib/tarih-satiri";
import {
  AksiyonBekleyenler,
  DurumBandi,
  ProgramPerformansi,
  SonIslemler,
  YonetimBasligi,
  type Aksiyon,
  type Islem,
  type ProgramSatiri,
} from "@/components/admin/AdminGenelBakis";
import { GelirGrafigi, type GelirAyi } from "@/components/admin/GelirGrafigi";

const AY_ADLARI = ["OCA", "ŞUB", "MAR", "NİS", "MAY", "HAZ", "TEM", "AĞU", "EYL", "EKİ", "KAS", "ARA"];

export default async function AdminGenelBakisPage() {
  const supabase = await createClient();

  const [
    { data: profiles },
    { data: enrollments },
    { data: courses },
    { data: progress },
    { data: payments },
    { data: tickets },
    { data: yaklasanOturumlar },
    { data: okunmamisMesajlar },
  ] = await Promise.all([
    supabase.from("profiles").select("id, ad, soyad, email, role, created_at"),
    supabase.from("enrollments").select("user_id, course_id"),
    supabase.from("courses").select("id, baslik, durum, content, modules(lessons(id))"),
    supabase.from("lesson_progress").select("user_id, lesson_id").eq("tamamlandi", true),
    supabase
      .from("payments")
      .select("id, tutar, durum, yontem, odeme_tarihi, profiles(ad, soyad, email)")
      .order("odeme_tarihi", { ascending: false }),
    supabase.from("support_tickets").select("id, durum, created_at"),
    /*
      Gündem sayacı artık "seanslar" tablosundan değil: o tabloya yazan ekran
      kaldırıldı (bkz. seanslar/page.tsx) ve sayaç kullanılmayan bir tabloyu
      sayıyordu — yani her zaman sıfır gösteriyordu.
    */
    supabase
      .from("egitim_oturumlari")
      .select("id, baslangic, durum")
      .eq("durum", "planlandi")
      .gte("baslangic", new Date().toISOString()),
    supabase.from("iletisim_mesajlari").select("id").eq("okundu", false),
  ]);

  type CourseRow = {
    id: string;
    baslik: string;
    durum: string;
    content: { etiket?: string } | null;
    modules: { lessons: { id: string }[] }[];
  };
  const courseRows = (courses ?? []) as unknown as CourseRow[];

  const dersKursu = new Map<string, string>();
  const kursDersSayisi = new Map<string, number>();
  for (const c of courseRows) {
    let n = 0;
    for (const m of c.modules) {
      for (const l of m.lessons) {
        dersKursu.set(l.id, c.id);
        n++;
      }
    }
    kursDersSayisi.set(c.id, n);
  }

  const kursTamamlanan = new Map<string, number>();
  for (const p of progress ?? []) {
    const cid = dersKursu.get(p.lesson_id as string);
    if (cid) kursTamamlanan.set(cid, (kursTamamlanan.get(cid) ?? 0) + 1);
  }

  const ogrenciler = (profiles ?? []).filter((p) => p.role !== "admin");
  const odenmis = (payments ?? []).filter((p) => p.durum === "odendi");
  const toplamGelir = odenmis.reduce((n, p) => n + Number(p.tutar), 0);
  const acikTalep = (tickets ?? []).filter((t) => t.durum === "acik").length;
  const bekleyenOdeme = (payments ?? []).filter((p) => p.durum === "bekliyor");

  const toplamDersAtamasi = (enrollments ?? []).reduce(
    (n, e) => n + (kursDersSayisi.get(e.course_id) ?? 0),
    0,
  );
  const toplamTamamlanan = (progress ?? []).filter((p) => dersKursu.has(p.lesson_id as string)).length;
  const genelTamamlanma = toplamDersAtamasi ? Math.round((toplamTamamlanan / toplamDersAtamasi) * 100) : 0;

  /*
    Aylar Türkiye saatine göre (ayAnahtari): Vercel UTC'de çalışıyor; ayın
    ilk gecesi 00:00–03:00 arası alınan ödeme önceki aya yazılıyordu.
  */
  const simdi = new Date();
  const buAyAnahtari = ayAnahtari(simdi);
  const buAyKatilan = ogrenciler.filter((p) => ayAnahtari(new Date(p.created_at)) === buAyAnahtari).length;

  const ayGeliri = new Map<string, number>();
  for (const p of odenmis) {
    const k = ayAnahtari(new Date(p.odeme_tarihi));
    ayGeliri.set(k, (ayGeliri.get(k) ?? 0) + Number(p.tutar));
  }
  // Son 12 ay, eskiden yeniye. Ay başına gitmek için yıl/ay aritmetiği.
  const [yil, ay] = buAyAnahtari.split("-").map(Number);
  const aylar: GelirAyi[] = [];
  for (let i = 11; i >= 0; i--) {
    const toplamAy = yil * 12 + (ay - 1) - i;
    const k = `${Math.floor(toplamAy / 12)}-${String((toplamAy % 12) + 1).padStart(2, "0")}`;
    aylar.push({ ay: AY_ADLARI[toplamAy % 12], tutar: ayGeliri.get(k) ?? 0, simdi: i === 0 });
  }
  // Banttaki yeşil rozet: bu ayın geliri; bu ay henüz tahsilat yoksa geçen ay.
  const rozetAyi = aylar[11].tutar > 0 ? aylar[11] : aylar[10];

  const kayitSayisi = new Map<string, number>();
  for (const e of enrollments ?? []) {
    kayitSayisi.set(e.course_id, (kayitSayisi.get(e.course_id) ?? 0) + 1);
  }

  const yayindakiler = courseRows.filter((c) => c.durum === "yayinda");
  const toplamKayit = yayindakiler.reduce((n, c) => n + (kayitSayisi.get(c.id) ?? 0), 0);
  const programPerf: ProgramSatiri[] = yayindakiler
    .map((c) => {
      const kayit = kayitSayisi.get(c.id) ?? 0;
      const dersSayisi = kursDersSayisi.get(c.id) ?? 0;
      const beklenen = kayit * dersSayisi;
      const bitti = kursTamamlanan.get(c.id) ?? 0;
      return {
        id: c.id,
        ad: c.baslik,
        // Telefonda kısa ad: eğitimin etiketi ("Meta Business"), yoksa başlık.
        kisaAd: c.content?.etiket?.trim() || c.baslik,
        kayit,
        // Kayıt payı: tüm kayıtların bu programa düşen yüzdesi.
        pay: toplamKayit ? Math.round((kayit / toplamKayit) * 100) : 0,
        dersSayisi,
        tamamlanma: beklenen ? Math.round((bitti / beklenen) * 100) : 0,
      };
    })
    .sort((a, b) => b.kayit - a.kayit);

  const kayitliKisiler = new Set((enrollments ?? []).map((e) => e.user_id));
  const kayitsizOgrenci = ogrenciler.filter((p) => !kayitliKisiler.has(p.id)).length;

  const isimOf = (k: { ad: string | null; soyad: string | null; email: string | null } | null) =>
    [k?.ad, k?.soyad].filter(Boolean).join(" ") || k?.email || "—";

  // Ödemeler odeme_tarihi'ne göre yeniden eskiye geliyor: ilki en yenisi.
  const ilkBekleyen = bekleyenOdeme[0];
  const bekleyenToplam = bekleyenOdeme.reduce((n, p) => n + Number(p.tutar), 0);
  const okunmamis = (okunmamisMesajlar ?? []).length;
  const yaklasan = (yaklasanOturumlar ?? []).length;

  const aksiyonlar = [
    bekleyenOdeme.length > 0 && {
      baslik: `${bekleyenOdeme.length} ödeme onay bekliyor`,
      alt:
        bekleyenOdeme.length === 1
          ? `${para(bekleyenToplam)} · ${isimOf(ilkBekleyen.profiles)}`
          : `Toplam ${para(bekleyenToplam)}`,
      href: "/kontrol-9f4x2k/odemeler?durum=bekliyor",
      ikon: "card",
      ton: 60,
    },
    acikTalep > 0 && {
      baslik: `${acikTalep} destek talebi açık`,
      alt: "Yanıt bekliyor",
      href: "/kontrol-9f4x2k/destek",
      ikon: "message",
      ton: 250,
    },
    okunmamis > 0 && {
      baslik: `${okunmamis} okunmamış mesaj`,
      alt: "Siteden gelen iletişim ve teklif talepleri",
      href: "/kontrol-9f4x2k/mesajlar",
      ikon: "mail",
      ton: 220,
    },
    kayitsizOgrenci > 0 && {
      baslik: `${kayitsizOgrenci} öğrencide eğitim kaydı yok`,
      alt: "Panelden eğitim atayabilirsin",
      href: "/kontrol-9f4x2k/ogrenciler",
      ikon: "users",
      ton: 300,
    },
    yaklasan > 0 && {
      baslik: `${yaklasan} yaklaşan oturum`,
      alt: "Takvimini kontrol et",
      href: "/kontrol-9f4x2k/seanslar",
      ikon: "calendar",
      ton: 165,
    },
  ].filter(Boolean) as Aksiyon[];

  const sonIslemler: Islem[] = (payments ?? []).slice(0, 4).map((p) => ({
    id: p.id,
    isim: isimOf(p.profiles),
    tarih: kisaTarihBicimi.format(new Date(p.odeme_tarihi)),
    yontem: p.yontem,
    durum: p.durum as Islem["durum"],
    tutar: Number(p.tutar),
  }));

  /*
    Yerleşim (tasarım): başlık → özet bandı → [aylık gelir | aksiyon
    bekleyenler] → [son işlemler | program performansı]. Telefonda aksiyon
    bekleyenler grafiğin ÜSTÜNDE: yöneticinin panele girme sebebi önce o.
  */
  return (
    <main className="flex flex-col gap-4 p-4 pb-14 sm:gap-5 sm:px-9 sm:pt-7 sm:pb-9">
      <YonetimBasligi tarih={tarihSatiri(simdi)} kisaTarih={tarihSatiri(simdi, { yil: false }).split(" · ")[1]} />

      <DurumBandi
        toplamGelir={toplamGelir}
        odemeAdedi={odenmis.length}
        buAy={rozetAyi}
        ogrenci={ogrenciler.length}
        buAyKatilan={buAyKatilan}
        tamamlanma={genelTamamlanma}
        acikTalep={acikTalep}
        toplamTalep={(tickets ?? []).length}
        bekleyen={
          ilkBekleyen
            ? {
                adet: bekleyenOdeme.length,
                isim: isimOf(ilkBekleyen.profiles),
                tutar: Number(ilkBekleyen.tutar),
                yontem: ilkBekleyen.yontem,
              }
            : null
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] xl:gap-[18px]">
        <div className="order-2 xl:order-1">
          {toplamGelir === 0 ? (
            <div className="flex h-full flex-col gap-3 rounded-[18px] border border-[#E6E8EF] bg-white p-[22px]">
              <h2 className="text-[16px] font-bold text-ink">Aylık gelir</h2>
              <p className="text-[13.5px] text-[#5B6478]">
                Henüz kayıtlı ödeme yok. Ödemeler sayfasından ekledikçe burada grafikleşir.
              </p>
            </div>
          ) : (
            <GelirGrafigi aylar={aylar} />
          )}
        </div>
        <div className="order-1 xl:order-2">
          <AksiyonBekleyenler liste={aksiyonlar} />
        </div>
        <div className="order-3">
          <SonIslemler liste={sonIslemler} />
        </div>
        <div className="order-4">
          <ProgramPerformansi liste={programPerf} />
        </div>
      </div>
    </main>
  );
}
