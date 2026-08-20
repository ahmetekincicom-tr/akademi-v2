import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { durumStil, initials } from "@/lib/admin/shared";
import { para, odemeDurumEtiket, kisaTarihBicimi } from "@/lib/admin/format";

const AY_ADLARI = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

export default async function AdminGenelBakisPage() {
  const supabase = await createClient();

  const [
    { data: profiles },
    { data: enrollments },
    { data: courses },
    { data: progress },
    { data: payments },
    { data: tickets },
    { data: seanslar },
    { data: okunmamisMesajlar },
  ] = await Promise.all([
    supabase.from("profiles").select("id, ad, soyad, email, role, created_at"),
    supabase.from("enrollments").select("user_id, course_id"),
    supabase.from("courses").select("id, baslik, durum, modules(lessons(id))"),
    supabase.from("lesson_progress").select("user_id, lesson_id").eq("tamamlandi", true),
    supabase
      .from("payments")
      .select("id, tutar, durum, yontem, odeme_tarihi, profiles(ad, soyad, email)")
      .order("odeme_tarihi", { ascending: false }),
    supabase.from("support_tickets").select("id, durum, created_at"),
    supabase.from("seanslar").select("id, baslangic, durum").eq("durum", "planlandi"),
    supabase.from("iletisim_mesajlari").select("id").eq("okundu", false),
  ]);

  type CourseRow = { id: string; baslik: string; durum: string; modules: { lessons: { id: string }[] }[] };
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

  const simdi = new Date();
  const buAy = ogrenciler.filter((p) => {
    const d = new Date(p.created_at);
    return d.getFullYear() === simdi.getFullYear() && d.getMonth() === simdi.getMonth();
  }).length;

  const kpiler = [
    { etiket: "Toplam gelir", deger: para(toplamGelir), alt: `${odenmis.length} ödeme` },
    { etiket: "Öğrenci", deger: String(ogrenciler.length), alt: `${buAy}'i bu ay katıldı` },
    { etiket: "Tamamlanma oranı", deger: `%${genelTamamlanma}`, alt: "ortalama ders bitirme" },
    { etiket: "Açık talep", deger: String(acikTalep), alt: `${(tickets ?? []).length} toplam talep` },
  ];

  // Last six months of paid revenue, oldest first.
  const aylar: { ay: string; tutar: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(simdi.getFullYear(), simdi.getMonth() - i, 1);
    const tutar = odenmis
      .filter((p) => {
        const pd = new Date(p.odeme_tarihi);
        return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth();
      })
      .reduce((n, p) => n + Number(p.tutar), 0);
    aylar.push({ ay: AY_ADLARI[d.getMonth()], tutar });
  }
  const enYuksekAy = Math.max(...aylar.map((a) => a.tutar), 1);

  const kayitSayisi = new Map<string, number>();
  for (const e of enrollments ?? []) {
    kayitSayisi.set(e.course_id, (kayitSayisi.get(e.course_id) ?? 0) + 1);
  }
  const enCokKayit = Math.max(...courseRows.map((c) => kayitSayisi.get(c.id) ?? 0), 1);

  const programPerf = courseRows
    .filter((c) => c.durum === "yayinda")
    .map((c) => {
      const kayit = kayitSayisi.get(c.id) ?? 0;
      const dersBasina = kursDersSayisi.get(c.id) ?? 0;
      const beklenen = kayit * dersBasina;
      const bitti = kursTamamlanan.get(c.id) ?? 0;
      return {
        ad: c.baslik,
        kayit,
        genislik: Math.round((kayit / enCokKayit) * 100),
        tamamlanma: beklenen ? Math.round((bitti / beklenen) * 100) : 0,
        dersSayisi: dersBasina,
      };
    })
    .sort((a, b) => b.kayit - a.kayit);

  const kayitsizOgrenci = ogrenciler.filter(
    (p) => !(enrollments ?? []).some((e) => e.user_id === p.id),
  ).length;

  const bekleyenler = [
    (okunmamisMesajlar ?? []).length > 0 && {
      baslik: `${(okunmamisMesajlar ?? []).length} okunmamış mesaj`,
      alt: "Siteden gelen iletişim ve teklif talepleri",
      nokta: "#1C56F3",
      href: "/kontrol-9f4x2k/mesajlar",
    },
    bekleyenOdeme.length > 0 && {
      baslik: `${bekleyenOdeme.length} ödeme onay bekliyor`,
      alt: para(bekleyenOdeme.reduce((n, p) => n + Number(p.tutar), 0)),
      nokta: "#A5711A",
      href: "/kontrol-9f4x2k/odemeler",
    },
    acikTalep > 0 && {
      baslik: `${acikTalep} destek talebi açık`,
      alt: "Yanıt bekliyor",
      nokta: "#1C56F3",
      href: "/kontrol-9f4x2k/destek",
    },
    kayitsizOgrenci > 0 && {
      baslik: `${kayitsizOgrenci} öğrencide eğitim kaydı yok`,
      alt: "Panelden eğitim atayabilirsin",
      nokta: "#A5711A",
      href: "/kontrol-9f4x2k/ogrenciler",
    },
    (seanslar ?? []).length > 0 && {
      baslik: `${(seanslar ?? []).length} planlı seans`,
      alt: "Takvimini kontrol et",
      nokta: "rgba(10,13,24,0.25)",
      href: "/kontrol-9f4x2k/seanslar",
    },
  ].filter(Boolean) as { baslik: string; alt: string; nokta: string; href: string }[];

  const sonIslemler = (payments ?? []).slice(0, 5);

  return (
    <main className="flex flex-col gap-5 p-7 pb-14">
      <div>
        <div className="font-mono text-[10px] tracking-[0.14em] text-[#656B7A] uppercase">Genel bakış</div>
        <h1 className="mt-[9px] font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
          Akademi durumu
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-[14px] lg:grid-cols-4">
        {kpiler.map((k) => (
          <div key={k.etiket} className="rounded-[14px] border border-ink/10 bg-white p-[19px] px-[19px] pt-[17px] pb-[15px]">
            <span className="font-mono text-[9.5px] tracking-[0.13em] text-[#656B7A] uppercase">{k.etiket}</span>
            <div className="mt-[13px]">
              <div className="font-heading text-2xl leading-none font-semibold tracking-[-0.03em]">{k.deger}</div>
              <div className="mt-[6px] text-[12.5px] text-[#656B7A]">{k.alt}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="rounded-2xl border border-ink/10 bg-white p-[22px] px-[22px] pt-5 pb-[22px]">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Aylık gelir</h2>
              <span className="font-mono text-[10px] tracking-[0.1em] text-[#656B7A] uppercase">Son 6 ay</span>
            </div>
            {toplamGelir === 0 ? (
              <p className="mt-6 text-sm text-[#656B7A]">
                Henüz kayıtlı ödeme yok. Ödemeler sayfasından ekledikçe burada grafikleşir.
              </p>
            ) : (
              <div className="mt-[22px] flex h-[190px] items-stretch gap-[14px]">
                {aylar.map((a, i) => (
                  <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-[9px]">
                    <span className="font-mono text-[10.5px] text-[#5C6273]">
                      {a.tutar > 0 ? Math.round(a.tutar / 1000) + " B" : "—"}
                    </span>
                    <span
                      className="w-full max-w-[54px] rounded-t-[8px] rounded-b-[3px]"
                      style={{
                        height: `${Math.max(Math.round((a.tutar / enYuksekAy) * 134), 3)}px`,
                        background: i === aylar.length - 1 ? "#1C56F3" : "rgba(28,86,243,0.3)",
                      }}
                    />
                    <span className="font-mono text-[10.5px] text-[#656B7A]">{a.ay}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
            <div className="flex items-center justify-between gap-4 border-b border-ink/8 px-[22px] py-[18px]">
              <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Son işlemler</h2>
              <Link href="/kontrol-9f4x2k/odemeler" className="text-[13.5px] font-semibold text-brand">
                Tümü →
              </Link>
            </div>
            {sonIslemler.length === 0 ? (
              <div className="px-[22px] py-8 text-center text-sm text-[#656B7A]">Henüz ödeme kaydı yok.</div>
            ) : (
              sonIslemler.map((i) => {
                const kisi = i.profiles;
                const isim = [kisi?.ad, kisi?.soyad].filter(Boolean).join(" ") || kisi?.email || "—";
                const etiket = odemeDurumEtiket[i.durum] ?? i.durum;
                const st = durumStil(etiket);
                return (
                  <div key={i.id} className="flex items-center gap-[14px] border-b border-ink/7 px-[22px] py-[13px] last:border-b-0">
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[9px] bg-[#F2F4FA] font-mono text-[10.5px] font-medium text-[#5C6273]">
                      {initials(isim)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{isim}</div>
                      <div className="mt-[2px] font-mono text-[10.5px] text-[#656B7A]">
                        {kisaTarihBicimi.format(new Date(i.odeme_tarihi))}
                        {i.yontem ? ` · ${i.yontem}` : ""}
                      </div>
                    </div>
                    <span
                      className="flex-none rounded-full px-[9px] py-[3px] font-mono text-[9.5px] tracking-[0.08em] uppercase"
                      style={{ background: st.bg, color: st.renk }}
                    >
                      {etiket}
                    </span>
                    <span className="w-[98px] flex-none text-right font-heading text-[15px] font-semibold">
                      {para(Number(i.tutar))}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <div className="overflow-hidden rounded-2xl border border-brand/28 bg-[#F5F8FF]">
            <div className="flex items-center justify-between gap-3 border-b border-brand/18 px-5 py-[18px]">
              <h2 className="font-heading text-[17px] font-semibold tracking-[-0.02em]">Aksiyon bekleyenler</h2>
              <span className="font-mono text-[10px] text-brand">{bekleyenler.length} iş</span>
            </div>
            {bekleyenler.length === 0 ? (
              <div className="px-5 py-7 text-center text-[13.5px] text-[#5C6273]">Bekleyen bir iş yok.</div>
            ) : (
              bekleyenler.map((b) => (
                <Link
                  key={b.baslik}
                  href={b.href}
                  className="flex items-center gap-3 border-b border-brand/14 px-5 py-[14px] last:border-b-0 hover:bg-brand/7"
                >
                  <span className="h-[7px] w-[7px] flex-none rounded-full" style={{ background: b.nokta }} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink">{b.baslik}</span>
                    <span className="mt-[3px] block text-[12.5px] text-[#5C6273]">{b.alt}</span>
                  </span>
                  <span className="flex-none text-xs text-brand">→</span>
                </Link>
              ))
            )}
          </div>

          <div className="rounded-2xl border border-ink/10 bg-white p-[22px] px-[22px] pt-5 pb-[22px]">
            <h2 className="font-heading text-[17px] font-semibold tracking-[-0.02em]">Program performansı</h2>
            {programPerf.length === 0 ? (
              <p className="mt-4 text-[13.5px] text-[#656B7A]">Yayında eğitim yok.</p>
            ) : (
              <div className="mt-[18px] flex flex-col gap-[14px]">
                {programPerf.map((p) => (
                  <div key={p.ad}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate text-[13.5px] font-medium text-[#2B303D]">{p.ad}</span>
                      <span className="flex-none font-mono text-[10.5px] text-[#5C6273]">{p.kayit} kayıt</span>
                    </div>
                    <div className="mt-[7px] h-[6px] overflow-hidden rounded-full bg-ink/8">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${p.genislik}%` }} />
                    </div>
                    <div className="mt-[5px] font-mono text-[10px] text-[#656B7A]">
                      tamamlanma %{p.tamamlanma} · {p.dersSayisi} ders
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
