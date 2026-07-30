"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { dersDurumDegistir } from "@/app/panel/actions";
import type { PanelCourse } from "@/lib/panel";

export function DersPlayer({
  courses,
  baslangicKursSlug,
  baslangicDersId,
}: {
  courses: PanelCourse[];
  baslangicKursSlug: string;
  baslangicDersId: string | null;
}) {
  const router = useRouter();
  const [kursSlug, setKursSlug] = useState(baslangicKursSlug);
  const [aktifDersId, setAktifDersId] = useState(baslangicDersId);
  const [tamamlananlar, setTamamlananlar] = useState<Set<string>>(
    () =>
      new Set(
        courses.flatMap((c) => c.modules.flatMap((m) => m.dersler.filter((d) => d.tamamlandi).map((d) => d.id))),
      ),
  );
  const [kaydediliyor, startTransition] = useTransition();

  const kurs = courses.find((c) => c.slug === kursSlug) ?? courses[0];
  const tumDersler = kurs.modules.flatMap((m) => m.dersler.map((d) => ({ ...d, modulBaslik: m.baslik })));
  const aktifDers = tumDersler.find((d) => d.id === aktifDersId) ?? tumDersler[0] ?? null;
  const bitti = aktifDers ? tamamlananlar.has(aktifDers.id) : false;
  const video = aktifDers?.oynatma ?? null;

  const kursTamamlanan = tumDersler.filter((d) => tamamlananlar.has(d.id)).length;
  const kursYuzde = tumDersler.length ? Math.round((kursTamamlanan / tumDersler.length) * 100) : 0;

  const toggleTamamla = () => {
    if (!aktifDers) return;
    const yeniDurum = !bitti;

    // Optimistic: the checkmark and progress bar update immediately, then the
    // server action persists and revalidates.
    setTamamlananlar((prev) => {
      const next = new Set(prev);
      if (yeniDurum) next.add(aktifDers.id);
      else next.delete(aktifDers.id);
      return next;
    });

    startTransition(async () => {
      await dersDurumDegistir(aktifDers.id, yeniDurum);
      router.refresh();
    });
  };

  const kursDegistir = (slug: string) => {
    const yeni = courses.find((c) => c.slug === slug);
    if (!yeni) return;
    setKursSlug(slug);
    const ilkTamamlanmayan = yeni.modules.flatMap((m) => m.dersler).find((d) => !tamamlananlar.has(d.id));
    setAktifDersId(ilkTamamlanmayan?.id ?? yeni.modules[0]?.dersler[0]?.id ?? null);
  };

  return (
    <main className="p-[34px] px-[34px] pt-[26px] pb-14">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-6">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href="/panel"
            className="flex h-[38px] flex-none items-center rounded-[9px] border border-ink/13 bg-white px-[14px] text-[13.5px] font-semibold text-ink hover:border-brand hover:text-brand"
          >
            ← Panel
          </Link>
          <div className="min-w-0">
            <div className="truncate font-mono text-[10.5px] tracking-[0.1em] text-[#8A8F9E] uppercase">
              {kurs.baslik}
              {aktifDers ? ` · ${aktifDers.modulBaslik}` : ""}
            </div>
            <h1 className="mt-[6px] font-heading text-2xl leading-[1.15] font-semibold tracking-[-0.03em] sm:text-[26px]">
              {aktifDers?.ad ?? "Bu eğitimde henüz ders yok"}
            </h1>
          </div>
        </div>
        {aktifDers && (
          <button
            type="button"
            onClick={toggleTamamla}
            disabled={kaydediliyor}
            className="h-[46px] flex-none rounded-[10px] px-[22px] text-[15px] font-semibold hover:opacity-90 disabled:opacity-60"
            style={{ background: bitti ? "#E9EDF7" : "#1C56F3", color: bitti ? "#3A3F4F" : "#FFFFFF" }}
          >
            {bitti ? "✓ Tamamlandı" : "Dersi tamamlandı işaretle"}
          </button>
        )}
      </div>

      {courses.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {courses.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => kursDegistir(c.slug)}
              className="h-9 rounded-[9px] border px-[14px] text-[13.5px] font-semibold"
              style={{
                borderColor: c.slug === kursSlug ? "#1C56F3" : "rgba(15,17,24,0.13)",
                background: c.slug === kursSlug ? "rgba(28,86,243,0.08)" : "#FFFFFF",
                color: c.slug === kursSlug ? "#1C56F3" : "#3A3F4F",
              }}
            >
              {c.baslik}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-[22px] xl:grid-cols-[1fr_372px]">
        <div className="flex min-w-0 flex-col gap-[22px]">
          <div className="overflow-hidden rounded-2xl border border-ink/12 bg-ink">
            {video ? (
              video.tip === "iframe" ? (
                <iframe
                  key={video.src}
                  src={video.src}
                  title={aktifDers?.ad ?? "Ders videosu"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="aspect-video w-full border-0"
                />
              ) : (
                <video key={video.src} src={video.src} controls className="aspect-video w-full bg-ink" />
              )
            ) : (
              <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-ink text-center">
                <span className="flex h-[66px] w-[66px] items-center justify-center rounded-full bg-white/8 text-xl text-white/50">
                  ▶
                </span>
                <span className="px-6 text-[13.5px] text-white/45">
                  Ders videosu henüz yüklenmedi.
                  {aktifDers?.sure ? ` Planlanan süre: ${aktifDers.sure}.` : ""}
                </span>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-ink/10 bg-white px-[26px] py-6">
            <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Ders hakkında</h2>
            <p className="mt-3 text-[15px] leading-[1.7] whitespace-pre-line text-[#5C6273]">
              {!aktifDers
                ? "Bu eğitime henüz ders eklenmemiş."
                : aktifDers.aciklama ||
                  "Bu ders için henüz açıklama eklenmedi. Dersi izleyip tamamlandı olarak işaretleyebilirsin."}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
          <div className="border-b border-ink/8 px-5 py-[18px]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-base font-semibold tracking-[-0.02em]">Müfredat</h2>
              <span className="font-mono text-[11.5px] text-brand">{kursYuzde}%</span>
            </div>
            <div className="mt-[10px] h-[5px] w-full overflow-hidden rounded-full bg-mist">
              <div className="h-full rounded-full bg-brand" style={{ width: `${kursYuzde}%` }} />
            </div>
            <div className="mt-2 font-mono text-[11px] text-[#8A8F9E]">
              {kursTamamlanan}/{tumDersler.length} ders tamamlandı
            </div>
          </div>

          <div className="max-h-[560px] overflow-auto">
            {kurs.modules.map((m, mi) => (
              <div key={m.id} className="border-b border-ink/8 last:border-b-0">
                <div className="bg-mist px-5 py-[11px]">
                  <div className="text-[13px] font-semibold text-ink">
                    {mi + 1}. {m.baslik}
                  </div>
                  <div className="mt-[2px] font-mono text-[10.5px] text-[#8A8F9E]">
                    {m.dersler.filter((d) => tamamlananlar.has(d.id)).length}/{m.dersler.length} ders
                  </div>
                </div>
                {m.dersler.map((d) => {
                  const aktifMi = d.id === aktifDers?.id;
                  const dersBitti = tamamlananlar.has(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setAktifDersId(d.id)}
                      className="flex w-full items-center gap-[11px] border-t border-ink/6 px-5 py-[11px] text-left hover:bg-mist/60"
                      style={{ background: aktifMi ? "rgba(28,86,243,0.07)" : undefined }}
                    >
                      <span
                        className="flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full text-[10px] font-bold"
                        style={{
                          background: dersBitti ? "#1C56F3" : "transparent",
                          border: dersBitti ? "none" : "1.5px solid rgba(15,17,24,0.18)",
                          color: "#FFFFFF",
                        }}
                      >
                        {dersBitti ? "✓" : ""}
                      </span>
                      <span
                        className="min-w-0 flex-1 truncate text-[13.5px]"
                        style={{ color: aktifMi ? "#1C56F3" : "#3A3F4F", fontWeight: aktifMi ? 600 : 400 }}
                      >
                        {d.ad}
                      </span>
                      {d.sure && <span className="flex-none font-mono text-[10.5px] text-[#9CA1AE]">{d.sure}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
