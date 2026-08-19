"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { dersDurumDegistir } from "@/app/panel/actions";
import type { PanelCourse } from "@/lib/panel";
import { Icon } from "@/components/Icon";
import { useBildirim } from "@/components/Bildirim";

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
  const bildir = useBildirim();
  const [kursSlug, setKursSlug] = useState(baslangicKursSlug);
  const [aktifDersId, setAktifDersId] = useState(baslangicDersId);
  const [tamamlananlar, setTamamlananlar] = useState<Set<string>>(
    () =>
      new Set(
        courses.flatMap((c) => c.modules.flatMap((m) => m.dersler.filter((d) => d.tamamlandi).map((d) => d.id))),
      ),
  );
  const [kaydediliyor, startTransition] = useTransition();
  const listeRef = useRef<HTMLDivElement>(null);
  const aktifSatirRef = useRef<HTMLButtonElement>(null);

  // 24 derslik bir eğitimde açılan ders listenin ortasındaysa kendini
  // göstermiyordu. Yalnızca listenin kendi kaydırmasına dokunuluyor: kutu
  // kaymıyorsa (telefon) hiçbir şey yapılmıyor, sayfa asla zıplamıyor.
  useEffect(() => {
    const satir = aktifSatirRef.current;
    const kap = listeRef.current;
    if (!satir || !kap || kap.scrollHeight <= kap.clientHeight) return;

    const s = satir.getBoundingClientRect();
    const k = kap.getBoundingClientRect();
    if (s.top >= k.top && s.bottom <= k.bottom) return;
    kap.scrollTop += s.top - k.top - (k.height - s.height) / 2;
  }, [aktifDersId, kursSlug]);

  const kurs = courses.find((c) => c.slug === kursSlug) ?? courses[0];
  const tumDersler = kurs.modules.flatMap((m) => m.dersler.map((d) => ({ ...d, modulBaslik: m.baslik })));
  const aktifDers = tumDersler.find((d) => d.id === aktifDersId) ?? tumDersler[0] ?? null;
  const aktifSira = aktifDers ? tumDersler.findIndex((d) => d.id === aktifDers.id) + 1 : 0;
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
      const r = await dersDurumDegistir(aktifDers.id, yeniDurum);
      if (r?.error) {
        // Kayıt geçmediyse işareti geri al, yoksa ekran yalan söyler.
        setTamamlananlar((prev) => {
          const next = new Set(prev);
          if (yeniDurum) next.delete(aktifDers.id);
          else next.add(aktifDers.id);
          return next;
        });
        bildir.hata(r.error);
      } else {
        bildir.basarili(yeniDurum ? "Ders tamamlandı olarak işaretlendi." : "Ders tamamlanmadı olarak işaretlendi.");
        router.refresh();
      }
    });
  };

  const kursDegistir = (slug: string) => {
    const yeni = courses.find((c) => c.slug === slug);
    if (!yeni) return;
    setKursSlug(slug);
    const ilkTamamlanmayan = yeni.modules.flatMap((m) => m.dersler).find((d) => !tamamlananlar.has(d.id));
    setAktifDersId(ilkTamamlanmayan?.id ?? yeni.modules[0]?.dersler[0]?.id ?? null);
  };

  // Kurs ve modül adı; boş olan ve kursla aynı olan parça atılıyor.
  const ustSatir = [kurs.baslik, aktifDers?.modulBaslik?.trim()]
    .map((p) => p?.trim())
    .filter((p): p is string => Boolean(p))
    .filter((p, i, hepsi) => hepsi.indexOf(p) === i);

  return (
    <main className="p-4 pt-4 pb-14 sm:p-[34px] sm:pt-[26px]">
      {/* Panele dönüş düğmesi yok: shell'in üst çubuğunda zaten tıklanabilir
          bir "Panel" kırıntısı var, ikincisi hem gereksizdi hem başlığı içeri
          itiyordu. */}
      <div className="mb-4 min-w-0 sm:mb-5">
        {/*
          Üst satır "kurs · modül" olarak kuruluyor ama parçalar tek tek
          süzülüyor.

          Önceden modül adı yoksa yedek olarak KURS ADI yazılıyordu ve satır
          "Birebir Meta Ads Eğitimi · Birebir Meta Ads Eğitimi" haline
          geliyordu. Aynı gerekçeyle boş dizeye de dikkat ediliyor: modül
          başlıksız kaydedilmişse ?? bunu yakalamıyor ve satır ayraçla
          bitiyordu.

          Kurs adı dar ekranda gizli kalmaya devam ediyor; mobilde tek parça
          gösteriliyor.
        */}
        <div className="truncate font-mono text-[10px] tracking-[0.1em] text-[#656B7A] uppercase sm:text-[10.5px]">
          <span className="hidden sm:inline">{ustSatir.join(" · ")}</span>
          <span className="sm:hidden">{ustSatir[ustSatir.length - 1]}</span>
        </div>
        <h1 className="mt-[5px] font-heading text-[18px] leading-[1.22] font-semibold tracking-[-0.03em] sm:mt-[6px] sm:text-[26px]">
          {aktifDers?.ad ?? "Bu eğitimde henüz ders yok"}
        </h1>
      </div>

      {courses.length > 1 && (
        // Kaydırılabilir olduğu anlaşılsın diye şerit mobilde ekran kenarına
        // kadar taşıyor; ortada kesilmiş gibi durmuyor.
        <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:mb-5 sm:px-0">
          {courses.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => kursDegistir(c.slug)}
              className="h-8 flex-none rounded-full border px-[13px] text-[12.5px] font-semibold whitespace-nowrap sm:h-9 sm:px-[15px] sm:text-[13px]"
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

      <div className="grid grid-cols-1 items-start gap-[22px] xl:grid-cols-[1fr_372px] xl:grid-rows-[auto_1fr]">
        {/* Üç kart tek ızgarada: telefonda sıra oynatıcı → ders listesi →
            açıklama oluyor, çünkü videodan sonra istenen şey sonraki derse
            geçmek. Geniş ekranda liste sağ sütuna, açıklama oynatıcının altına
            dönüyor. */}
        <div className="min-w-0 xl:col-start-1 xl:row-start-1">
          {/* Sayfanın asıl işi burası. Oynatıcı ve altındaki künye tek bir koyu
              kart; tamamlama düğmesi de bu kartın içinde duruyor. Eskiden düğme
              hem başlıkta hem videonun altında ayrı ayrı basılıyordu. */}
          <div className="-mx-4 overflow-hidden bg-ink shadow-[0_22px_54px_-30px_rgba(10,13,24,0.55)] sm:mx-0 sm:rounded-[18px] sm:ring-1 sm:ring-ink/12">
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
              <div className="flex aspect-video flex-col items-center justify-center gap-[14px] bg-[linear-gradient(158deg,#191D2B_0%,#0A0D18_58%)] px-6 text-center">
                <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white/[0.07] pl-[3px] text-white/55 ring-1 ring-white/12 sm:h-[58px] sm:w-[58px]">
                  <Icon name="play" size={20} />
                </span>
                <div>
                  <div className="text-[13.5px] font-medium text-white/75">Ders videosu henüz yüklenmedi</div>
                  {aktifDers?.sure && (
                    <div className="mt-[9px] inline-flex items-center gap-[7px] rounded-full bg-white/[0.07] px-[11px] py-[5px] font-mono text-[10.5px] tracking-[0.06em] text-white/60">
                      <Icon name="clock" size={12} />
                      Planlanan süre · {aktifDers.sure}
                    </div>
                  )}
                </div>
              </div>
            )}

            {aktifDers && (
              <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-[11px] sm:px-5 sm:py-[13px]">
                <div className="min-w-0">
                  <div className="font-mono text-[10px] tracking-[0.13em] text-white/60 uppercase">
                    {aktifSira}. ders / {tumDersler.length}
                    {aktifDers.sure ? ` · ${aktifDers.sure}` : ""}
                  </div>
                  <div className="mt-[3px] truncate text-[12.5px] text-white/85 sm:text-[13px]">
                    {aktifDers.modulBaslik}
                  </div>
                </div>
                <TamamlaDugmesi bitti={bitti} kaydediliyor={kaydediliyor} onClick={toggleTamamla} />
              </div>
            )}
          </div>
        </div>

        {/* row-span-2 şart: liste yalnızca 1. satırdayken o satırın yüksekliğini
            listenin boyu belirliyordu ve oynatıcı listeden kısa kalınca aradaki
            fark "Ders hakkında"nın üstünde boşluk olarak duruyordu. */}
        <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white xl:sticky xl:top-[94px] xl:col-start-2 xl:row-span-2 xl:row-start-1">
          <div className="border-b border-ink/8 px-5 py-[18px]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-base font-semibold tracking-[-0.02em]">Eğitim içeriği</h2>
              <span className="font-mono text-[11.5px] text-brand">{kursYuzde}%</span>
            </div>
            <div className="mt-[10px] h-[5px] w-full overflow-hidden rounded-full bg-mist">
              <div className="h-full rounded-full bg-brand" style={{ width: `${kursYuzde}%` }} />
            </div>
            <div className="mt-2 font-mono text-[11px] text-[#656B7A]">
              {kursTamamlanan}/{tumDersler.length} ders tamamlandı
            </div>
          </div>

          {/* Kendi içinde kaydırma yalnızca geniş ekranda: telefonda liste zaten
              sayfayla birlikte akıyor, iç kaydırma orada yalnızca sinir bozucu.
              Yükseklik pencereye bağlı, böylece son satır kartın kenarında
              yarım kalmıyor. */}
          <div ref={listeRef} className="xl:max-h-[calc(100vh-268px)] xl:overflow-auto">
            {kurs.modules.map((m, mi) => (
              <div key={m.id} className="border-b border-ink/8 last:border-b-0">
                <div className="bg-mist px-5 py-[11px]">
                  <div className="text-[13px] font-semibold text-ink">
                    {mi + 1}. {m.baslik}
                  </div>
                  <div className="mt-[2px] font-mono text-[10.5px] text-[#656B7A]">
                    {m.dersler.filter((d) => tamamlananlar.has(d.id)).length}/{m.dersler.length} ders
                  </div>
                </div>
                {m.dersler.map((d) => {
                  const aktifMi = d.id === aktifDers?.id;
                  const dersBitti = tamamlananlar.has(d.id);
                  return (
                    <button
                      key={d.id}
                      ref={aktifMi ? aktifSatirRef : undefined}
                      type="button"
                      onClick={() => setAktifDersId(d.id)}
                      className="flex w-full items-center gap-[11px] border-t border-ink/6 px-5 py-[11px] text-left hover:bg-mist/60"
                      style={{ background: aktifMi ? "rgba(28,86,243,0.07)" : undefined }}
                    >
                      <span
                        className="flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full text-white"
                        style={{
                          background: dersBitti ? "#1C56F3" : "transparent",
                          border: dersBitti ? "none" : "1.5px solid rgba(15,17,24,0.18)",
                        }}
                      >
                        {dersBitti && <Icon name="check" size={11} strokeWidth={2.6} />}
                      </span>
                      <span
                        className="min-w-0 flex-1 text-[13.5px] leading-[1.4]"
                        style={{ color: aktifMi ? "#1C56F3" : "#3A3F4F", fontWeight: aktifMi ? 600 : 400 }}
                      >
                        {d.ad}
                      </span>
                      {d.sure && <span className="flex-none font-mono text-[10.5px] text-[#656B7A]">{d.sure}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white px-5 py-5 sm:px-[26px] sm:py-6 xl:col-start-1 xl:row-start-2">
          <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Ders hakkında</h2>
          <p className="mt-3 text-[15px] leading-[1.7] whitespace-pre-line text-[#5C6273]">
            {!aktifDers
              ? "Bu eğitime henüz ders eklenmemiş."
              : aktifDers.aciklama ||
                "Bu ders için henüz açıklama eklenmedi. Dersi izleyip tamamlandı olarak işaretleyebilirsin."}
          </p>
        </div>
      </div>
    </main>
  );
}

/**
 * Koyu oynatıcı çubuğunun içinde durduğu için renkleri açık zemine göre değil
 * koyuya göre seçildi. Etiket dar ekranda "Tamamla"ya iniyor: eskiden düğme
 * "Dersi tamamlandı işaretle" yüzünden satırın tamamını kaplıyordu.
 */
function TamamlaDugmesi({
  bitti,
  kaydediliyor,
  onClick,
}: {
  bitti: boolean;
  kaydediliyor: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={kaydediliyor}
      aria-pressed={bitti}
      className="inline-flex h-[34px] flex-none items-center justify-center gap-[6px] rounded-[8px] px-[13px] text-[12.5px] font-semibold transition hover:opacity-90 disabled:opacity-60 sm:h-[36px] sm:px-[15px] sm:text-[13.5px]"
      style={{ background: bitti ? "rgba(255,255,255,0.12)" : "#1C56F3", color: "#FFFFFF" }}
    >
      {bitti && <Icon name="check" size={14} strokeWidth={2.4} />}
      <span className="sm:hidden">{bitti ? "Tamamlandı" : "Tamamla"}</span>
      <span className="hidden sm:inline">{bitti ? "Tamamlandı" : "Tamamlandı işaretle"}</span>
    </button>
  );
}
