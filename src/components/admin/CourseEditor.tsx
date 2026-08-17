"use client";

import { useState } from "react";
import Link from "next/link";
import { Toggle } from "./Toggle";
import { saveCourse, arsivleCourse } from "@/app/kontrol-9f4x2k/(protected)/egitimler/actions";
import { Icon } from "@/components/Icon";
import { useBildirim } from "@/components/Bildirim";
import { KapakGorseli } from "@/components/admin/KapakGorseli";
import { basligiParcala } from "@/lib/courses";

// Rows loaded from the database carry their id so saving updates them in place
// instead of recreating them (which would wipe student progress). Rows added in
// the editor have no id until first save.
type EditorLesson = { id?: string; ad: string; sure: string };
type EditorModule = { id?: string; ad: string; dersler: EditorLesson[] };

export type CourseEditorInitial = {
  ad: string;
  /** Başlıkta marka rengiyle yazılacak kısım. Boşsa başlık düz görünür. */
  vurgu: string;
  sure: string;
  format: string;
  seviye: string;
  url: string;
  aciklama: string;
  modules: EditorModule[];
  siteGorunur: boolean;
  satisaAcik: boolean;
  fiyatGorunur: boolean;
  /** Depodaki kapak dosyasının yolu; yeni programda boş. */
  kapakGorsel?: string | null;
};

const BOS_INITIAL: CourseEditorInitial = {
  ad: "",
  vurgu: "",
  sure: "",
  format: "",
  seviye: "",
  url: "",
  aciklama: "",
  modules: [],
  siteGorunur: true,
  satisaAcik: true,
  fiyatGorunur: false,
};

export function CourseEditor({
  mode,
  initial = BOS_INITIAL,
}: {
  mode: "yeni" | "duzenle";
  initial?: CourseEditorInitial;
}) {
  const bildir = useBildirim();
  const [ad, setAd] = useState(initial.ad);
  const [vurgu, setVurgu] = useState(initial.vurgu);
  const [sure, setSure] = useState(initial.sure);
  const [format, setFormat] = useState(initial.format);
  const [seviye, setSeviye] = useState(initial.seviye);
  const [url, setUrl] = useState(initial.url);
  const [aciklama, setAciklama] = useState(initial.aciklama);
  const [modules, setModules] = useState<EditorModule[]>(initial.modules);
  const [yayin, setYayin] = useState({
    site: initial.siteGorunur,
    satis: initial.satisaAcik,
    fiyat: initial.fiyatGorunur,
  });
  const [kaydediliyor, setKaydediliyor] = useState<"taslak" | "yayinda" | "arsiv" | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const originalSlug = initial.url || undefined;

  const kaydet = async (durum: "taslak" | "yayinda") => {
    setKaydediliyor(durum);
    setHata(null);
    const sonuc = await saveCourse({
      originalSlug,
      slug: url,
      baslik: ad,
      baslikVurgu: vurgu,
      sure,
      format,
      seviye,
      aciklama,
      modules,
      siteGorunur: yayin.site,
      satisaAcik: yayin.satis,
      fiyatGorunur: yayin.fiyat,
      durum,
    });
    setKaydediliyor(null);
    if (sonuc?.error) {
      setHata(sonuc.error);
      bildir.hata(sonuc.error);
      return;
    }
    bildir.basarili(durum === "yayinda" ? "Eğitim yayınlandı." : "Eğitim taslak olarak kaydedildi.");
  };

  const arsivle = async () => {
    if (!originalSlug) return;
    setKaydediliyor("arsiv");
    setHata(null);
    const sonuc = await arsivleCourse(originalSlug);
    setKaydediliyor(null);
    if (sonuc?.error) {
      setHata(sonuc.error);
      bildir.hata(sonuc.error);
      return;
    }
    bildir.basarili("Eğitim arşivlendi.");
  };

  const modulEkle = () => setModules((prev) => prev.concat({ ad: "", dersler: [] }));
  const modulSil = (mi: number) => setModules((prev) => prev.filter((_, i) => i !== mi));
  const modulAdYaz = (mi: number, v: string) =>
    setModules((prev) => prev.map((m, i) => (i === mi ? { ...m, ad: v } : m)));
  const dersEkle = (mi: number) =>
    setModules((prev) => prev.map((m, i) => (i === mi ? { ...m, dersler: m.dersler.concat({ ad: "", sure: "" }) } : m)));
  const dersSil = (mi: number, di: number) =>
    setModules((prev) => prev.map((m, i) => (i === mi ? { ...m, dersler: m.dersler.filter((_, j) => j !== di) } : m)));
  const dersAdYaz = (mi: number, di: number, v: string) =>
    setModules((prev) =>
      prev.map((m, i) => (i === mi ? { ...m, dersler: m.dersler.map((d, j) => (j === di ? { ...d, ad: v } : d)) } : m))
    );
  const dersSureYaz = (mi: number, di: number, v: string) =>
    setModules((prev) =>
      prev.map((m, i) => (i === mi ? { ...m, dersler: m.dersler.map((d, j) => (j === di ? { ...d, sure: v } : d)) } : m))
    );

  const dersSayi = modules.reduce((n, m) => n + m.dersler.length, 0);
  const baslik = mode === "yeni" ? "Yeni eğitim" : ad || "Eğitim düzenle";

  return (
    <main className="p-4 pb-14 sm:p-7">
      <Link
        href="/kontrol-9f4x2k/egitimler"
        className="inline-flex items-center gap-[6px] text-[13.5px] font-semibold text-[#5C6273] transition hover:text-brand"
      >
        <Icon name="arrowLeft" size={15} />
        Eğitimler
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
        <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
          {baslik}
        </h1>
        <div className="flex gap-[10px]">
          <button
            type="button"
            disabled={!ad.trim() || !url.trim() || kaydediliyor !== null}
            onClick={() => kaydet("taslak")}
            className="h-[42px] rounded-[10px] border border-ink/13 bg-white px-4 text-sm font-semibold text-ink hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            {kaydediliyor === "taslak" ? "Kaydediliyor…" : "Taslak kaydet"}
          </button>
          <button
            type="button"
            disabled={!ad.trim() || !url.trim() || kaydediliyor !== null}
            onClick={() => kaydet("yayinda")}
            className="h-[42px] rounded-[10px] bg-brand px-[18px] text-sm font-semibold text-white hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            {kaydediliyor === "yayinda" ? "Yayınlanıyor…" : "Yayınla"}
          </button>
        </div>
      </div>

      {hata && (
        <div className="mt-4 rounded-[10px] border border-danger/35 bg-danger/7 px-4 py-3 text-sm text-danger-ink">
          {hata}
        </div>
      )}

      <div className="mt-[22px] grid grid-cols-1 items-start gap-5 xl:grid-cols-[1fr_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="rounded-2xl border border-ink/10 bg-white p-6 px-6 pt-[22px] pb-6">
            <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Temel bilgiler</h2>
            <div className="mt-[18px] grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 sm:col-span-2">
                <span className="font-mono text-[10px] tracking-[0.13em] text-[#656B7A] uppercase">Program adı</span>
                <input
                  type="text"
                  value={ad}
                  onChange={(e) => setAd(e.target.value)}
                  placeholder="Örn. Birebir Meta Business Eğitimi"
                  className="h-[46px] rounded-[10px] border border-ink/14 bg-white px-[14px] text-[14.5px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
                />
                <span className="text-[12.5px] leading-[1.5] text-[#656B7A]">
                  Eğitim sayfasının başlığı, sekme adı ve arama sonucu bu adı kullanır.
                </span>
              </label>

              {/* Vurgu ayrı bir alan: eğitim sayfasındaki başlıkta bir kısım
                  marka rengiyle yazılıyor. Önceden yalnızca veritabanından
                  düzenlenebiliyordu ve zamanla programın adından kopmuştu. */}
              <label className="flex flex-col gap-2 sm:col-span-2">
                <span className="font-mono text-[10px] tracking-[0.13em] text-[#656B7A] uppercase">
                  Başlıkta renkli yazılacak kısım
                </span>
                <input
                  type="text"
                  value={vurgu}
                  onChange={(e) => setVurgu(e.target.value)}
                  placeholder="Örn. Meta Business"
                  className="h-[46px] rounded-[10px] border border-ink/14 bg-white px-[14px] text-[14.5px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
                />
                <span className="text-[12.5px] leading-[1.5] text-[#656B7A]">
                  Program adının içinde geçen bir parça olmalı. Boş bırakırsan başlık tek renk yazılır.
                </span>
                {ad.trim() && (
                  <span className="mt-1 rounded-[10px] bg-ink px-4 py-3 font-heading text-[19px] leading-[1.15] font-semibold tracking-[-0.03em] text-white">
                    {(() => {
                      const p = basligiParcala(ad, vurgu);
                      return (
                        <>
                          {p.once}
                          {p.vurgu && <span className="text-brand">{p.vurgu}</span>}
                          {p.sonra}
                        </>
                      );
                    })()}
                  </span>
                )}
              </label>
              <label className="flex flex-col gap-2">
                <span className="font-mono text-[10px] tracking-[0.13em] text-[#656B7A] uppercase">Toplam süre</span>
                <input
                  type="text"
                  value={sure}
                  onChange={(e) => setSure(e.target.value)}
                  placeholder="15 saat"
                  className="h-[46px] rounded-[10px] border border-ink/14 bg-white px-[14px] text-[14.5px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="font-mono text-[10px] tracking-[0.13em] text-[#656B7A] uppercase">Format</span>
                <input
                  type="text"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  placeholder="Online / yüz yüze"
                  className="h-[46px] rounded-[10px] border border-ink/14 bg-white px-[14px] text-[14.5px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="font-mono text-[10px] tracking-[0.13em] text-[#656B7A] uppercase">Seviye</span>
                <input
                  type="text"
                  value={seviye}
                  onChange={(e) => setSeviye(e.target.value)}
                  placeholder="Sıfırdan ileri"
                  className="h-[46px] rounded-[10px] border border-ink/14 bg-white px-[14px] text-[14.5px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="font-mono text-[10px] tracking-[0.13em] text-[#656B7A] uppercase">URL</span>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="meta-business-egitimi"
                  className="h-[46px] rounded-[10px] border border-ink/14 bg-white px-[14px] text-[14.5px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
                />
              </label>
              <label className="flex flex-col gap-2 sm:col-span-2">
                <span className="font-mono text-[10px] tracking-[0.13em] text-[#656B7A] uppercase">Kısa açıklama</span>
                <textarea
                  value={aciklama}
                  onChange={(e) => setAciklama(e.target.value)}
                  placeholder="Sitede program kartında görünecek 1-2 cümle"
                  className="min-h-[86px] resize-y rounded-[10px] border border-ink/14 bg-white px-[14px] py-3 text-[14.5px] leading-[1.6] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
                />
              </label>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
            <div className="flex items-center justify-between gap-4 border-b border-ink/8 px-6 py-5">
              <div>
                <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Müfredat</h2>
                <p className="mt-[5px] text-[13px] text-[#656B7A]">
                  {modules.length} modül · {dersSayi} ders
                </p>
              </div>
              <button
                type="button"
                onClick={modulEkle}
                className="inline-flex h-[38px] items-center gap-[6px] rounded-[9px] border border-brand/40 bg-brand/[0.07] px-[15px] text-[13.5px] font-semibold text-brand transition hover:bg-brand hover:text-white"
              >
                <Icon name="plus" size={14} />
                Modül ekle
              </button>
            </div>
            {modules.map((m, mi) => (
              <div key={mi} className="border-b border-ink/8 last:border-b-0">
                <div className="flex items-center gap-[13px] bg-mist px-6 py-4">
                  <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[8px] border border-ink/12 bg-white font-mono text-[11px] font-medium text-brand">
                    {String(mi + 1).padStart(2, "0")}
                  </span>
                  <input
                    type="text"
                    value={m.ad}
                    onChange={(e) => modulAdYaz(mi, e.target.value)}
                    placeholder="Modül adı"
                    className="h-10 min-w-0 flex-1 rounded-[9px] border border-ink/13 bg-white px-[13px] text-[14.5px] font-semibold text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
                  />
                  <span className="flex-none font-mono text-[10.5px] text-[#656B7A]">{m.dersler.length} ders</span>
                  <button
                    type="button"
                    onClick={() => dersEkle(mi)}
                    className="inline-flex h-9 flex-none items-center gap-[5px] rounded-[8px] border border-ink/13 bg-white px-[13px] text-[12.5px] font-semibold text-ink transition hover:border-brand hover:bg-brand hover:text-white"
                  >
                    <Icon name="plus" size={13} />
                    Ders
                  </button>
                  <button
                    type="button"
                    onClick={() => modulSil(mi)}
                    aria-label="Modülü sil"
                    className="flex h-9 w-9 flex-none items-center justify-center rounded-[8px] border border-ink/13 bg-white text-[#656B7A] transition hover:border-danger/45 hover:text-danger"
                  >
                    <Icon name="x" size={15} />
                  </button>
                </div>
                {m.dersler.map((d, di) => (
                  <div key={di} className="flex items-center gap-[11px] border-t border-ink/6 py-[11px] pr-6 pl-[78px]">
                    <span className="h-[5px] w-[5px] flex-none rounded-full bg-brand" />
                    <input
                      type="text"
                      value={d.ad}
                      onChange={(e) => dersAdYaz(mi, di, e.target.value)}
                      placeholder="Ders başlığı"
                      className="h-[38px] min-w-0 flex-1 rounded-[9px] border border-ink/12 bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
                    />
                    <input
                      type="text"
                      value={d.sure}
                      onChange={(e) => dersSureYaz(mi, di, e.target.value)}
                      placeholder="40 dk"
                      className="h-[38px] w-[82px] flex-none rounded-[9px] border border-ink/12 bg-white px-[11px] font-mono text-[12.5px] text-ink outline-none focus:border-brand"
                    />
                    <button
                      type="button"
                      className="h-9 flex-none rounded-[8px] border border-ink/12 bg-white px-3 text-[12.5px] font-semibold text-[#5C6273] hover:border-brand hover:text-brand"
                    >
                      Video
                    </button>
                    <button
                      type="button"
                      className="h-9 flex-none rounded-[8px] border border-ink/12 bg-white px-3 text-[12.5px] font-semibold text-[#5C6273] hover:border-brand hover:text-brand"
                    >
                      Dosya
                    </button>
                    <button
                      type="button"
                      onClick={() => dersSil(mi, di)}
                      aria-label="Dersi sil"
                      className="flex h-9 w-9 flex-none items-center justify-center rounded-[8px] border border-ink/12 bg-white text-[#656B7A] transition hover:border-danger/45 hover:text-danger"
                    >
                      <Icon name="x" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ))}
            {modules.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-[#656B7A]">Henüz modül eklenmedi.</div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-ink/10 bg-white p-[22px] px-[22px] pt-5 pb-[22px]">
            <div className="font-mono text-[9.5px] tracking-[0.12em] text-[#656B7A] uppercase">Yayın</div>
            <div className="mt-[14px] flex flex-col gap-[11px]">
              <Toggle
                checked={yayin.site}
                onToggle={() => setYayin((s) => ({ ...s, site: !s.site }))}
                label="Sitede görünsün"
                sublabel="Eğitimler listesinde yayınla"
              />
              <Toggle
                checked={yayin.satis}
                onToggle={() => setYayin((s) => ({ ...s, satis: !s.satis }))}
                label="Satışa açık"
                sublabel="Panelden satın alınabilir"
              />
              <Toggle
                checked={yayin.fiyat}
                onToggle={() => setYayin((s) => ({ ...s, fiyat: !s.fiyat }))}
                label="Fiyatı göster"
                sublabel="Kapalıysa teklif talebi alınır"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-white p-[22px] px-[22px] pt-5 pb-[22px]">
            <div className="font-mono text-[9.5px] tracking-[0.12em] text-[#656B7A] uppercase">Kapak görseli</div>
            <KapakGorseli slug={originalSlug ?? null} mevcut={initial.kapakGorsel ?? null} />
          </div>

          {mode === "duzenle" && (
            <div className="rounded-2xl border border-danger/28 bg-white p-[22px] px-[22px] pt-5 pb-[22px]">
              <div className="font-mono text-[9.5px] tracking-[0.12em] text-danger uppercase">Tehlikeli alan</div>
              <p className="mt-[10px] text-[13px] leading-[1.55] text-[#5C6273]">
                Programı arşivlersen yeni satışa kapanır; mevcut öğrencilerin erişimi korunur.
              </p>
              <button
                type="button"
                disabled={kaydediliyor !== null}
                onClick={arsivle}
                className="mt-[14px] h-10 rounded-[9px] border border-danger/35 bg-white px-[15px] text-[13.5px] font-semibold text-danger hover:bg-danger hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {kaydediliyor === "arsiv" ? "Arşivleniyor…" : "Programı arşivle"}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
