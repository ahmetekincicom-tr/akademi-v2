import Link from "next/link";
import { getPanelCourses, getPanelProfile } from "@/lib/panel";
import { Icon } from "@/components/Icon";

export default async function PanelOverviewPage() {
  const [profil, courses] = await Promise.all([getPanelProfile(), getPanelCourses()]);

  const toplamDers = courses.reduce((n, c) => n + c.dersSayisi, 0);
  const toplamTamamlanan = courses.reduce((n, c) => n + c.tamamlanan, 0);
  const genelYuzde = toplamDers ? Math.round((toplamTamamlanan / toplamDers) * 100) : 0;
  const tamamlananProgram = courses.filter((c) => c.dersSayisi > 0 && c.yuzde === 100).length;
  const aktifKurs = courses.find((c) => c.yuzde < 100) ?? courses[0];

  const kpiler = [
    { etiket: "Genel ilerleme", deger: `${genelYuzde}%`, alt: `${toplamTamamlanan}/${toplamDers} ders` },
    { etiket: "Kayıtlı program", deger: String(courses.length), alt: "aktif eğitim" },
    { etiket: "Tamamlanan ders", deger: String(toplamTamamlanan), alt: `toplam ${toplamDers} ders` },
    { etiket: "Biten program", deger: String(tamamlananProgram), alt: "eğitim tamamlandı" },
  ];

  return (
    <main className="flex flex-col gap-[26px] p-[34px] pb-14">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[32px]">
            Merhaba{profil?.ad ? `, ${profil.ad}` : ""}
          </h1>
          <p className="mt-2 text-[15px] text-[#5C6273]">
            {courses.length > 0
              ? "Kaldığın yerden devam edebilirsin."
              : "Panelin hazır. Eğitim kaydın tanımlandığında dersler burada görünecek."}
          </p>
        </div>
        {aktifKurs?.sonrakiDers && (
          <Link
            href={`/panel/dersler?kurs=${aktifKurs.slug}&ders=${aktifKurs.sonrakiDers.id}`}
            className="inline-flex h-[46px] items-center rounded-[11px] bg-brand px-[20px] text-[15px] font-semibold text-white hover:bg-ink"
          >
            Derse devam et
          </Link>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="rounded-2xl border border-ink/10 bg-white px-8 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[13px] bg-mist text-[#656B7A]">
            <Icon name="grid" size={22} />
          </div>
          <h2 className="mt-4 font-heading text-xl font-semibold tracking-[-0.02em]">Henüz bir eğitim kaydın yok</h2>
          <p className="mx-auto mt-[10px] max-w-[440px] text-[14.5px] leading-[1.6] text-[#5C6273]">
            Bir eğitime katıldığında dersler, ilerlemen ve materyaller bu panelde açılır. Programları inceleyip
            başvurabilirsin.
          </p>
          <Link
            href="/panel/yeni-egitimler"
            className="mt-6 inline-flex h-11 items-center rounded-[10px] bg-brand px-5 text-sm font-semibold text-white hover:bg-ink"
          >
            Eğitimleri incele
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpiler.map((k) => (
              <div key={k.etiket} className="rounded-2xl border border-ink/10 bg-white p-5">
                <div className="font-mono text-[9.5px] tracking-[0.13em] text-[#656B7A] uppercase">{k.etiket}</div>
                <div className="mt-[10px] font-heading text-[30px] leading-none font-semibold tracking-[-0.03em]">
                  {k.deger}
                </div>
                <div className="mt-2 text-[13px] text-[#656B7A]">{k.alt}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1fr_360px]">
            <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
              <div className="border-b border-ink/8 px-6 py-5">
                <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Eğitimlerim</h2>
              </div>
              {courses.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center gap-4 border-b border-ink/8 px-6 py-5 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-semibold text-ink">{c.baslik}</div>
                    <div className="mt-1 font-mono text-[11.5px] text-[#656B7A]">
                      {c.modules.length} modül · {c.dersSayisi} ders{c.sure ? ` · ${c.sure}` : ""}
                    </div>
                    <div className="mt-[10px] h-[6px] w-full overflow-hidden rounded-full bg-mist">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${c.yuzde}%` }} />
                    </div>
                  </div>
                  <div className="flex flex-none items-center gap-4">
                    <span className="font-mono text-[13px] font-medium text-brand">{c.yuzde}%</span>
                    <Link
                      href={`/panel/dersler?kurs=${c.slug}`}
                      className="inline-flex h-9 items-center rounded-[9px] border border-ink/13 bg-white px-[15px] text-[13.5px] font-semibold text-ink hover:border-brand hover:text-brand"
                    >
                      {c.yuzde === 100 ? "Tekrar izle" : "Devam et"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {aktifKurs && aktifKurs.modules.length > 0 && (
              <div className="rounded-2xl border border-ink/10 bg-white p-6">
                <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Modül ilerlemesi</h2>
                <p className="mt-1 truncate text-[13px] text-[#656B7A]">{aktifKurs.baslik}</p>
                <div className="mt-5 flex flex-col gap-[14px]">
                  {aktifKurs.modules.map((m, i) => (
                    <div key={m.id}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate text-[13.5px] text-ink">
                          {i + 1}. {m.baslik}
                        </span>
                        <span className="flex-none font-mono text-[11.5px] text-[#656B7A]">{m.yuzde}%</span>
                      </div>
                      <div className="mt-2 h-[5px] w-full overflow-hidden rounded-full bg-mist">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${m.yuzde}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
