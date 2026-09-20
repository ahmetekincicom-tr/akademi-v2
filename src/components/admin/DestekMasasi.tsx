"use client";

import { useMemo, useState, useTransition } from "react";
import { useBildirim } from "@/components/Bildirim";
import { mesajGonder, talepDurumDegistir, talebeEgitimBagla } from "@/app/destek-actions";
import { HAZIR_CEVAPLAR } from "@/lib/destek-hazir";
import type { DestekTalep, DestekKullanici } from "@/lib/destek";

/**
 * Destek masası (yönetici) — 3 panel: talep listesi · konuşma · öğrenci detayı.
 *
 * Tasarım referansındaki yapı projenin design token'larıyla uyarlandı (marka/
 * ink renkleri, mevcut spacing/radius). Öğrenci panelindeki TalepGorunumu'na
 * DOKUNULMADI; bu bileşen yalnız admin sayfasında. Tüm eylemler mevcut server
 * action'lara bağlı (mesajGonder / talepDurumDegistir / talebeEgitimBagla).
 *
 * Not: SLA / atama / birleştirme / dosya eki veri modelinde yok; uydurulmadı.
 * "Yanıt bekliyor" gerçek sinyalden türetiliyor (son mesaj katılımcıdan &
 * talep kapanmamış).
 */

type Durum = DestekTalep["durum"];
const DURUM: Record<Durum, { ad: string; sinif: string }> = {
  acik: { ad: "Açık", sinif: "bg-brand/10 text-brand border-brand/20" },
  inceleniyor: { ad: "İnceleniyor", sinif: "bg-amber-50 text-amber-700 border-amber-200" },
  yanitlandi: { ad: "Yanıtlandı", sinif: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  kapandi: { ad: "Kapandı", sinif: "bg-ink/[0.06] text-[#5C6273] border-ink/12" },
};
const DURUM_SIRA: Durum[] = ["acik", "inceleniyor", "yanitlandi", "kapandi"];

const saatFmt = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" });
const gunFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Istanbul" });
const kisaGun = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", timeZone: "Europe/Istanbul" });

function harf(ad: string): string {
  const p = ad.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || "?";
}
function nispi(iso: string): string {
  const fark = Date.now() - new Date(iso).getTime();
  const dk = Math.floor(fark / 60000);
  if (dk < 1) return "az önce";
  if (dk < 60) return `${dk} dk`;
  const sa = Math.floor(dk / 60);
  if (sa < 24) return `${sa} sa`;
  const gun = Math.floor(sa / 24);
  if (gun < 7) return `${gun} gün`;
  return kisaGun.format(new Date(iso));
}
function sonMesaj(t: DestekTalep) {
  const gorunur = t.mesajlar.filter((m) => !m.icNot);
  return gorunur[gorunur.length - 1];
}
function yanitBekliyor(t: DestekTalep): boolean {
  const s = sonMesaj(t);
  return t.durum !== "kapandi" && Boolean(s) && !s!.egitmenMi;
}

function Rozet({ durum }: { durum: Durum }) {
  const d = DURUM[durum];
  return <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold ${d.sinif}`}>{d.ad}</span>;
}

export function DestekMasasi({
  talepler,
  kullanicilar,
  kurslar,
}: {
  talepler: DestekTalep[];
  kullanicilar: Record<string, DestekKullanici>;
  kurslar: { id: string; ad: string }[];
}) {
  const bildir = useBildirim();
  const [islemde, basla] = useTransition();
  const [arama, setArama] = useState("");
  const [filtre, setFiltre] = useState<"hepsi" | Durum>("hepsi");
  const [seciliId, setSeciliId] = useState<string | null>(talepler[0]?.id ?? null);
  const [mod, setMod] = useState<"yanit" | "icnot">("yanit");
  const [metin, setMetin] = useState("");
  const [gorunum, setGorunum] = useState<"liste" | "konusma">("liste"); // mobil drill-down
  const [detayAcik, setDetayAcik] = useState(false); // mobil öğrenci çekmecesi

  const sayac = useMemo(() => {
    const s = { hepsi: talepler.length, acik: 0, inceleniyor: 0, yanitlandi: 0, kapandi: 0, bekleyen: 0 };
    for (const t of talepler) {
      s[t.durum]++;
      if (yanitBekliyor(t)) s.bekleyen++;
    }
    return s;
  }, [talepler]);

  const listelenen = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase("tr");
    return talepler
      .filter((t) => (filtre === "hepsi" ? true : t.durum === filtre))
      .filter((t) =>
        !q
          ? true
          : t.baslik.toLocaleLowerCase("tr").includes(q) ||
            t.kisiAd.toLocaleLowerCase("tr").includes(q) ||
            t.id.slice(0, 8).includes(q),
      );
  }, [talepler, filtre, arama]);

  const secili = talepler.find((t) => t.id === seciliId) ?? null;
  const detay = secili ? kullanicilar[secili.userId] : undefined;
  const gecmis = secili ? talepler.filter((t) => t.userId === secili.userId && t.id !== secili.id) : [];

  const seciliAc = (id: string) => {
    setSeciliId(id);
    setGorunum("konusma");
    setDetayAcik(false);
    setMod("yanit");
    setMetin("");
  };

  const gonder = () => {
    if (!secili || !metin.trim()) return;
    basla(async () => {
      const r = await mesajGonder(secili.id, metin, mod === "icnot");
      if (r?.error) return bildir.hata(r.error);
      setMetin("");
      bildir.basarili(mod === "icnot" ? "İç not eklendi." : "Yanıt gönderildi.");
    });
  };
  const durumDegistir = (durum: Durum) => {
    if (!secili) return;
    basla(async () => {
      const r = await talepDurumDegistir(secili.id, durum);
      if (r?.error) bildir.hata(r.error);
    });
  };
  const egitimBagla = (courseId: string) => {
    if (!secili) return;
    basla(async () => {
      const r = await talebeEgitimBagla(secili.id, courseId || null);
      if (r?.error) bildir.hata(r.error);
      else bildir.basarili("Eğitim bağlandı.");
    });
  };

  return (
    <main className="flex h-[calc(100dvh-var(--baslik-h,64px))] flex-col p-3 sm:p-5">
      {/* Başlık + KPI */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-[22px] leading-[1.1] font-extrabold tracking-[-0.02em] sm:text-[26px]">
            Destek masası
          </h1>
          <p className="mt-[5px] text-[13px] text-[#64748b]">Katılımcılardan gelen tüm yazışmalar tek yerde.</p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { e: "Açık", v: sayac.acik },
            { e: "İnceleniyor", v: sayac.inceleniyor },
            { e: "Yanıtlandı", v: sayac.yanitlandi },
            { e: "Yanıt bekliyor", v: sayac.bekleyen },
          ].map((k) => (
            <div key={k.e} className="min-w-[74px] rounded-[10px] border border-ink/11 bg-white px-3 py-2">
              <div className="text-[10px] font-bold tracking-[0.05em] text-[#9aa0ae] uppercase">{k.e}</div>
              <div className="mt-0.5 font-mono text-[19px] font-extrabold text-ink">{k.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 3 panel */}
      <div className="mt-4 grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)_300px]">
        {/* SOL: arama + filtre + liste */}
        <section
          className={`min-h-0 flex-col rounded-[14px] border border-ink/11 bg-white ${gorunum === "liste" ? "flex" : "hidden"} lg:flex`}
        >
          <div className="border-b border-ink/10 p-3">
            <input
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="Kişi, konu veya #talep no"
              className="h-[38px] w-full rounded-[9px] border border-ink/13 bg-white px-3 text-[13.5px] outline-none focus:border-brand"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(["hepsi", ...DURUM_SIRA] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFiltre(f)}
                  className={`rounded-full border px-2.5 py-1 text-[12px] font-semibold transition ${
                    filtre === f ? "border-brand bg-brand/10 text-brand" : "border-ink/12 bg-white text-[#5C6273] hover:text-ink"
                  }`}
                >
                  {f === "hepsi" ? "Tümü" : DURUM[f].ad} <span className="text-[#9aa0ae]">{sayac[f === "hepsi" ? "hepsi" : f]}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {listelenen.length === 0 && <div className="p-6 text-center text-[13px] text-[#9aa0ae]">Talep yok.</div>}
            {listelenen.map((t) => {
              const s = sonMesaj(t);
              const bekliyor = yanitBekliyor(t);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => seciliAc(t.id)}
                  className={`flex w-full items-start gap-3 border-b border-ink/[0.06] px-3 py-3 text-left transition hover:bg-mist ${
                    t.id === seciliId ? "bg-brand/[0.05]" : ""
                  }`}
                >
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-[9px] bg-brand/10 font-mono text-[12px] font-bold text-brand">
                    {harf(t.kisiAd)}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13.5px] font-bold">{t.baslik}</span>
                      <span className="flex-none text-[11px] text-[#9aa0ae]">{nispi(t.guncelleme)}</span>
                    </span>
                    <span className="truncate text-[12.5px] text-[#6B7080]">{s?.metin ?? "—"}</span>
                    <span className="mt-0.5 flex items-center gap-2">
                      <Rozet durum={t.durum} />
                      <span className="truncate font-mono text-[10.5px] text-[#9aa0ae]">
                        {t.kisiAd} · {t.program}
                      </span>
                      {bekliyor && <span className="ml-auto h-2 w-2 flex-none rounded-full bg-brand" title="Yanıt bekliyor" />}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ORTA: konuşma */}
        <section
          className={`min-h-0 flex-col rounded-[14px] border border-ink/11 bg-white ${gorunum === "konusma" ? "flex" : "hidden"} lg:flex`}
        >
          {!secili ? (
            <div className="grid flex-1 place-items-center p-8 text-center text-[13.5px] text-[#9aa0ae]">
              Soldan bir talep seçin.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3 border-b border-ink/10 px-4 py-3">
                <button type="button" onClick={() => setGorunum("liste")} className="text-[13px] text-[#5C6273] lg:hidden">
                  ← Liste
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[15px] font-bold">{secili.baslik}</span>
                    <Rozet durum={secili.durum} />
                  </div>
                  <div className="truncate font-mono text-[11px] text-[#9aa0ae]">
                    #{secili.id.slice(0, 8)} · {secili.kisiAd} · {secili.program} · {secili.mesajlar.length} mesaj
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <button type="button" onClick={() => setDetayAcik(true)} className="text-[12.5px] font-semibold text-brand lg:hidden">
                    Öğrenci
                  </button>
                  <select
                    value={secili.durum}
                    onChange={(e) => durumDegistir(e.target.value as Durum)}
                    disabled={islemde}
                    className="rounded-[8px] border border-ink/13 bg-white px-2 py-1.5 text-[12.5px] font-semibold text-ink outline-none focus:border-brand"
                  >
                    {DURUM_SIRA.map((d) => (
                      <option key={d} value={d}>
                        {DURUM[d].ad}
                      </option>
                    ))}
                  </select>
                  {secili.durum !== "kapandi" ? (
                    <button
                      type="button"
                      onClick={() => durumDegistir("kapandi")}
                      disabled={islemde}
                      className="rounded-[8px] border border-brand/25 bg-brand/[0.06] px-2.5 py-1.5 text-[12.5px] font-semibold text-brand hover:bg-brand hover:text-white disabled:opacity-50"
                    >
                      Çözüldü olarak kapat
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => durumDegistir("acik")}
                      disabled={islemde}
                      className="rounded-[8px] border border-ink/13 bg-white px-2.5 py-1.5 text-[12.5px] font-semibold text-ink hover:border-brand hover:text-brand disabled:opacity-50"
                    >
                      Yeniden aç
                    </button>
                  )}
                </div>
              </div>

              {/* Thread */}
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {secili.mesajlar.map((mesaj, i) => {
                  const oncekiGun = i > 0 ? gunFmt.format(new Date(secili.mesajlar[i - 1].tarih)) : null;
                  const buGun = gunFmt.format(new Date(mesaj.tarih));
                  const ayrac = oncekiGun !== buGun;
                  const ben = mesaj.egitmenMi;
                  return (
                    <div key={mesaj.id}>
                      {ayrac && (
                        <div className="my-3 flex items-center gap-3 text-[11px] tracking-[0.05em] text-[#9aa0ae] uppercase">
                          <div className="h-px flex-1 bg-ink/10" />
                          {buGun}
                          <div className="h-px flex-1 bg-ink/10" />
                        </div>
                      )}
                      <div className={`flex flex-col ${ben ? "items-end" : "items-start"}`}>
                        <div className="mb-1 flex items-center gap-1.5 text-[10.5px] tracking-[0.04em] text-[#9aa0ae] uppercase">
                          {mesaj.icNot ? (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-700">İç not</span>
                          ) : (
                            <span className="rounded bg-ink/[0.06] px-1.5 py-0.5 font-semibold">{ben ? "Ekip" : "Katılımcı"}</span>
                          )}
                          <span className="normal-case">{mesaj.gonderenAd}</span>
                        </div>
                        <div
                          className={`max-w-[80%] whitespace-pre-wrap rounded-[13px] px-3.5 py-2.5 text-[13.5px] leading-[1.55] ${
                            mesaj.icNot
                              ? "border border-amber-200 bg-amber-50 text-[#7c5b12]"
                              : ben
                                ? "bg-brand text-white"
                                : "border border-ink/12 bg-white text-ink"
                          }`}
                        >
                          {mesaj.metin}
                        </div>
                        <span className="mt-1 text-[10.5px] text-[#9aa0ae]">{saatFmt.format(new Date(mesaj.tarih))}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Composer */}
              <div className="border-t border-ink/10 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex gap-1 rounded-[8px] border border-ink/12 bg-mist p-0.5">
                    {(["yanit", "icnot"] as const).map((mm) => (
                      <button
                        key={mm}
                        type="button"
                        onClick={() => setMod(mm)}
                        className={`rounded-[6px] px-2.5 py-1 text-[12.5px] font-semibold transition ${
                          mod === mm ? "bg-white text-ink shadow-sm" : "text-[#5C6273]"
                        }`}
                      >
                        {mm === "yanit" ? "Yanıt" : "İç not"}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {HAZIR_CEVAPLAR.map((h) => (
                      <button
                        key={h.etiket}
                        type="button"
                        onClick={() => setMetin((m) => (m ? `${m}\n${h.metin}` : h.metin))}
                        className="rounded-[7px] border border-ink/13 bg-white px-2.5 py-1 text-[12px] font-medium text-[#475569] hover:border-brand hover:text-brand"
                      >
                        {h.etiket}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={metin}
                  onChange={(e) => setMetin(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                      e.preventDefault();
                      gonder();
                    }
                  }}
                  rows={2}
                  placeholder={mod === "icnot" ? "Yalnızca ekibin göreceği not…" : "Yanıtınızı yazın…"}
                  className={`mt-2 w-full resize-y rounded-[10px] border px-3 py-2.5 text-[13.5px] outline-none ${
                    mod === "icnot" ? "border-amber-300 bg-amber-50/40 focus:border-amber-400" : "border-ink/13 bg-white focus:border-brand"
                  }`}
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11.5px] text-[#9aa0ae]">⌘↵ ile gönder</span>
                  <button
                    type="button"
                    onClick={gonder}
                    disabled={islemde || !metin.trim()}
                    className="rounded-[9px] bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:bg-ink disabled:opacity-50"
                  >
                    {mod === "icnot" ? "Notu kaydet" : "Gönder"}
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        {/* SAĞ: öğrenci detayı (mobilde çekmece) */}
        {secili && detay !== undefined && (
          <>
            <aside className="hidden min-h-0 overflow-y-auto rounded-[14px] border border-ink/11 bg-white p-4 lg:block">
              <OgrenciDetay talep={secili} detay={detay} gecmis={gecmis} kurslar={kurslar} onEgitim={egitimBagla} onSec={seciliAc} />
            </aside>
            {detayAcik && (
              <div className="fixed inset-0 z-[120] flex justify-end bg-black/40 lg:hidden" onClick={() => setDetayAcik(false)}>
                <div className="h-full w-[86vw] max-w-[360px] overflow-y-auto bg-white p-4" onClick={(e) => e.stopPropagation()}>
                  <button type="button" onClick={() => setDetayAcik(false)} className="mb-3 text-[13px] text-[#5C6273]">
                    ✕ Kapat
                  </button>
                  <OgrenciDetay talep={secili} detay={detay} gecmis={gecmis} kurslar={kurslar} onEgitim={egitimBagla} onSec={seciliAc} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function OgrenciDetay({
  talep,
  detay,
  gecmis,
  kurslar,
  onEgitim,
  onSec,
}: {
  talep: DestekTalep;
  detay: DestekKullanici;
  gecmis: DestekTalep[];
  kurslar: { id: string; ad: string }[];
  onEgitim: (courseId: string) => void;
  onSec: (id: string) => void;
}) {
  const facts: { e: string; v: string }[] = [
    { e: "E-posta", v: talep.kisiEposta ?? "—" },
    { e: "Telefon", v: detay.telefon ?? "—" },
    { e: "Kaynak", v: detay.kaynak ?? "—" },
    { e: "Kayıt", v: kisaGun.format(new Date(detay.kayitTarihi)) },
  ];
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-brand/10 font-mono text-[14px] font-bold text-brand">
          {harf(talep.kisiAd)}
        </span>
        <div className="min-w-0">
          <div className="truncate text-[15px] font-bold">{talep.kisiAd}</div>
          <div className="truncate font-mono text-[11.5px] text-[#9aa0ae]">{talep.kisiEposta ?? "—"}</div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {facts.map((f) => (
          <div key={f.e} className="flex items-baseline justify-between gap-3 text-[12.5px]">
            <span className="text-[#9aa0ae]">{f.e}</span>
            <span className="truncate text-right font-medium text-ink">{f.v}</span>
          </div>
        ))}
      </div>

      <div>
        <div className="mb-2 text-[12px] font-bold tracking-[0.04em] text-[#5C6273] uppercase">Kayıtlı eğitimler</div>
        {detay.egitimler.length === 0 ? (
          <div className="text-[12.5px] text-[#9aa0ae]">Kayıtlı eğitim yok.</div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {detay.egitimler.map((e, i) => (
              <div key={i} className="rounded-[8px] border border-ink/10 bg-mist px-2.5 py-1.5 text-[12.5px] text-ink">
                {e}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 text-[12px] font-bold tracking-[0.04em] text-[#5C6273] uppercase">Talebi eğitime bağla</div>
        <select
          value={talep.courseId ?? ""}
          onChange={(e) => onEgitim(e.target.value)}
          className="w-full rounded-[8px] border border-ink/13 bg-white px-2.5 py-2 text-[12.5px] outline-none focus:border-brand"
        >
          <option value="">Genel (bağlı değil)</option>
          {kurslar.map((k) => (
            <option key={k.id} value={k.id}>
              {k.ad}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="mb-2 text-[12px] font-bold tracking-[0.04em] text-[#5C6273] uppercase">Geçmiş talepler</div>
        {gecmis.length === 0 ? (
          <div className="text-[12.5px] text-[#9aa0ae]">Başka talep yok.</div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {gecmis.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => onSec(g.id)}
                className="flex items-center justify-between gap-2 rounded-[8px] border border-ink/10 bg-white px-2.5 py-2 text-left hover:border-brand/40"
              >
                <span className="truncate text-[12.5px] font-medium text-ink">{g.baslik}</span>
                <Rozet durum={g.durum} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
