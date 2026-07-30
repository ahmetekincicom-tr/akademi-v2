"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { dokumanKaydet, dokumanSil, dokumanIndirmeLinki } from "@/app/admin/(protected)/dokumanlar/actions";
import { baytBoyut, tarihBicimi } from "@/lib/admin/format";

export type DokumanSatir = {
  id: string;
  baslik: string;
  program: string;
  dosyaYolu: string;
  dosyaTipi: string;
  boyut: number | null;
  tarih: string;
};

export function DokumanYonetimi({
  dokumanlar,
  kurslar,
}: {
  dokumanlar: DokumanSatir[];
  kurslar: { id: string; ad: string }[];
}) {
  const router = useRouter();
  const [baslik, setBaslik] = useState("");
  const [courseId, setCourseId] = useState("");
  const [dosya, setDosya] = useState<File | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [islemde, startTransition] = useTransition();

  const yukle = async () => {
    if (!dosya) {
      setHata("Bir dosya seç.");
      return;
    }
    setYukleniyor(true);
    setHata(null);

    // Prefixed with a timestamp so re-uploading the same filename doesn't clash.
    const temizAd = dosya.name.replace(/[^\w.\-]/g, "_");
    const yol = `${Date.now()}-${temizAd}`;

    const supabase = createClient();
    const { error: upErr } = await supabase.storage.from("dokumanlar").upload(yol, dosya);
    if (upErr) {
      setYukleniyor(false);
      setHata(upErr.message);
      return;
    }

    const r = await dokumanKaydet({
      baslik: baslik.trim() || dosya.name,
      courseId,
      dosyaYolu: yol,
      dosyaTipi: dosya.name.split(".").pop()?.toUpperCase() ?? "",
      boyut: dosya.size,
    });

    setYukleniyor(false);
    if (r?.error) {
      setHata(r.error);
      return;
    }
    setBaslik("");
    setDosya(null);
    setCourseId("");
    router.refresh();
  };

  const indir = (yol: string) => {
    startTransition(async () => {
      const r = await dokumanIndirmeLinki(yol);
      if (r.url) window.open(r.url, "_blank");
      else setHata(r.error ?? "Bağlantı alınamadı.");
    });
  };

  const sil = (id: string, yol: string) => {
    startTransition(async () => {
      const r = await dokumanSil(id, yol);
      if (r?.error) setHata(r.error);
      else router.refresh();
    });
  };

  return (
    <main className="p-7 pb-14">
      <div>
        <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
          Dokümanlar
        </h1>
        <p className="mt-[7px] text-[14.5px] text-[#5C6273]">
          {dokumanlar.length} dosya · bir eğitime bağlanan dosyayı yalnızca o eğitime kayıtlı öğrenciler görür.
        </p>
      </div>

      <div className="mt-5 rounded-2xl border border-ink/10 bg-white p-6">
        <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Yeni dosya yükle</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-2">
            <span className="font-mono text-[10px] tracking-[0.12em] text-[#8A8F9E] uppercase">Başlık</span>
            <input
              type="text"
              value={baslik}
              onChange={(e) => setBaslik(e.target.value)}
              placeholder="Boş bırakırsan dosya adı kullanılır"
              className="h-[46px] rounded-[10px] border border-ink/13 bg-white px-[13px] text-sm text-ink outline-none focus:border-brand"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-mono text-[10px] tracking-[0.12em] text-[#8A8F9E] uppercase">Eğitim</span>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="h-[46px] rounded-[10px] border border-ink/13 bg-white px-[13px] text-sm text-ink outline-none focus:border-brand"
            >
              <option value="">Tüm öğrenciler</option>
              {kurslar.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.ad}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-mono text-[10px] tracking-[0.12em] text-[#8A8F9E] uppercase">Dosya</span>
            <input
              type="file"
              onChange={(e) => setDosya(e.target.files?.[0] ?? null)}
              className="h-[46px] rounded-[10px] border border-ink/13 bg-white px-[13px] pt-[11px] text-[13px] text-ink outline-none file:mr-3 file:rounded-[6px] file:border-0 file:bg-mist file:px-3 file:py-1 file:text-[12px] file:font-semibold focus:border-brand"
            />
          </label>
        </div>

        {hata && <div className="mt-4 text-sm text-danger-ink">{hata}</div>}

        <button
          type="button"
          onClick={yukle}
          disabled={yukleniyor || !dosya}
          className="mt-5 h-[46px] rounded-[10px] bg-brand px-6 text-[15px] font-semibold text-white hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          {yukleniyor ? "Yükleniyor…" : "Yükle"}
        </button>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <div className="grid grid-cols-[2fr_1.4fr_0.7fr_0.8fr_1fr_150px] gap-4 border-b border-ink/8 bg-mist px-[22px] py-[13px] font-mono text-[9.5px] tracking-[0.12em] text-[#8A8F9E] uppercase">
          <span>Dosya</span>
          <span>Eğitim</span>
          <span>Tip</span>
          <span>Boyut</span>
          <span>Yüklendi</span>
          <span />
        </div>

        {dokumanlar.length === 0 ? (
          <div className="px-[22px] py-10 text-center text-sm text-[#8A8F9E]">Henüz doküman yüklenmedi.</div>
        ) : (
          dokumanlar.map((d) => (
            <div
              key={d.id}
              className="grid grid-cols-[2fr_1.4fr_0.7fr_0.8fr_1fr_150px] items-center gap-4 border-b border-ink/7 px-[22px] py-[14px] last:border-b-0 hover:bg-[#F7F9FF]"
            >
              <div className="min-w-0 truncate text-sm font-semibold">{d.baslik}</div>
              <div className="min-w-0 truncate text-[13.5px] text-[#3A3F4F]">{d.program}</div>
              <div className="font-mono text-[11px] text-[#5C6273]">{d.dosyaTipi || "—"}</div>
              <div className="font-mono text-[11px] text-[#5C6273]">{baytBoyut(d.boyut)}</div>
              <div className="font-mono text-[11px] text-[#5C6273]">{tarihBicimi.format(new Date(d.tarih))}</div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={islemde}
                  onClick={() => indir(d.dosyaYolu)}
                  className="h-8 rounded-[7px] border border-ink/13 bg-white px-3 text-[12.5px] font-semibold text-ink hover:border-brand hover:text-brand disabled:opacity-50"
                >
                  İndir
                </button>
                <button
                  type="button"
                  disabled={islemde}
                  onClick={() => sil(d.id, d.dosyaYolu)}
                  className="flex h-8 w-8 flex-none items-center justify-center rounded-[7px] border border-ink/12 text-[11px] text-[#9CA1AE] hover:border-danger/45 hover:text-danger disabled:opacity-50"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
