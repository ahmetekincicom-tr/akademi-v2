"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { dersVideoKaydet } from "@/app/admin/(protected)/video/actions";
import { Icon } from "@/components/Icon";
import { useBildirim } from "@/components/Bildirim";

export type VideoDers = {
  id: string;
  ad: string;
  kurs: string;
  modul: string;
  sure: string;
  videoUrl: string;
  aciklama: string;
};

export function VideoYonetimi({ dersler, bunnyAktif }: { dersler: VideoDers[]; bunnyAktif: boolean }) {
  const router = useRouter();
  const bildir = useBildirim();
  const [arama, setArama] = useState("");
  const [sadeceEksik, setSadeceEksik] = useState(false);
  const [duzenlenen, setDuzenlenen] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [islemde, startTransition] = useTransition();

  const listelenen = useMemo(() => {
    const q = arama.trim().toLowerCase();
    return dersler.filter(
      (d) =>
        (!sadeceEksik || !d.videoUrl) &&
        (!q || d.ad.toLowerCase().includes(q) || d.kurs.toLowerCase().includes(q)),
    );
  }, [arama, sadeceEksik, dersler]);

  const videolu = dersler.filter((d) => d.videoUrl).length;

  const duzenlemeyeBasla = (d: VideoDers) => {
    setDuzenlenen(d.id);
    setUrl(d.videoUrl);
    setAciklama(d.aciklama);
    setHata(null);
  };

  const kaydet = (lessonId: string) => {
    setHata(null);
    startTransition(async () => {
      const r = await dersVideoKaydet(lessonId, url, aciklama);
      if (r?.error) {
        setHata(r.error);
        bildir.hata(r.error);
      } else {
        setDuzenlenen(null);
        bildir.basarili("Ders videosu kaydedildi.");
        router.refresh();
      }
    });
  };

  return (
    <main className="p-4 pb-14 sm:p-7">
      <div>
        <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
          Video yönetimi
        </h1>
        <p className="mt-[7px] text-[14.5px] text-[#5C6273]">
          {videolu}/{dersler.length} derste video var.{" "}
          {bunnyAktif
            ? "Bunny video ID'si yapıştırdığında bağlantı sunucuda imzalanır ve paylaşılamaz."
            : "Bunny, YouTube, Vimeo veya doğrudan dosya bağlantısı yapıştırabilirsin."}
        </p>
      </div>

      <div className="mt-[22px] flex flex-wrap items-center gap-[10px]">
        <div className="flex h-[42px] max-w-[380px] min-w-[240px] flex-1 items-center gap-[9px] rounded-[10px] border border-ink/12 bg-white px-[14px]">
          <Icon name="search" size={15} className="flex-none text-[#9CA1AE]" />
          <input
            type="text"
            placeholder="Ders veya eğitim ara"
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            className="w-full border-0 bg-transparent text-sm text-ink outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => setSadeceEksik((v) => !v)}
          className="h-[42px] rounded-[10px] border px-[15px] text-[13.5px] font-semibold hover:border-brand"
          style={{
            background: sadeceEksik ? "#0A0D18" : "#FFFFFF",
            color: sadeceEksik ? "#FFFFFF" : "#3A3F4F",
            borderColor: sadeceEksik ? "#0A0D18" : "rgba(10,13,24,0.13)",
          }}
        >
          Sadece videosuz
        </button>
      </div>

      <div className="mt-[18px] overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <div className="overflow-x-auto">
          <div className="grid grid-cols-[2fr_1.5fr_1fr_0.8fr_110px] min-w-[780px] gap-4 border-b border-ink/8 bg-mist px-[22px] py-[13px] font-mono text-[9.5px] tracking-[0.12em] text-[#8A8F9E] uppercase">
            <span>Ders</span>
            <span>Eğitim</span>
            <span>Modül</span>
            <span>Durum</span>
            <span />
          </div>

          {listelenen.length === 0 ? (
            <div className="px-[22px] py-10 text-center text-sm text-[#8A8F9E]">
              {dersler.length === 0 ? "Henüz ders tanımlanmamış." : "Eşleşen ders bulunamadı."}
            </div>
          ) : (
            listelenen.map((d) => (
              <div key={d.id} className="border-b border-ink/7 last:border-b-0">
                <div className="grid grid-cols-[2fr_1.5fr_1fr_0.8fr_110px] min-w-[780px] items-center gap-4 px-[22px] py-[14px] hover:bg-[#F7F9FF]">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{d.ad}</div>
                    {d.sure && <div className="font-mono text-[10px] text-[#8A8F9E]">{d.sure}</div>}
                  </div>
                  <div className="min-w-0 truncate text-[13.5px] text-[#3A3F4F]">{d.kurs}</div>
                  <div className="min-w-0 truncate font-mono text-[11px] text-[#5C6273]">{d.modul}</div>
                  <div>
                    <span
                      className="rounded-full px-[9px] py-[3px] font-mono text-[9.5px] tracking-[0.08em] uppercase"
                      style={
                        d.videoUrl
                          ? { background: "rgba(28,86,243,0.12)", color: "#1C56F3" }
                          : { background: "rgba(10,13,24,0.07)", color: "#5C6273" }
                      }
                    >
                      {d.videoUrl ? "Video var" : "Eksik"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => (duzenlenen === d.id ? setDuzenlenen(null) : duzenlemeyeBasla(d))}
                    className="h-8 rounded-[8px] border border-ink/13 bg-white text-[12.5px] font-semibold text-ink hover:border-ink hover:bg-ink hover:text-white"
                  >
                    {duzenlenen === d.id ? "Kapat" : "Düzenle"}
                  </button>
                </div>

                {duzenlenen === d.id && (
                  <div className="border-t border-ink/8 bg-[#FAFBFF] px-[22px] py-5">
                    <div className="grid grid-cols-1 gap-4">
                      <label className="flex flex-col gap-2">
                        <span className="font-mono text-[10px] tracking-[0.12em] text-[#8A8F9E] uppercase">
                          Video bağlantısı
                        </span>
                        <input
                          type="text"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder={
                            bunnyAktif
                              ? "Bunny video ID (örn. 8f2c1a90-…) veya YouTube/Vimeo bağlantısı"
                              : "https://www.youtube.com/watch?v=… veya https://vimeo.com/…"
                          }
                          className="h-[46px] rounded-[10px] border border-ink/13 bg-white px-[13px] text-sm text-ink outline-none focus:border-brand"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="font-mono text-[10px] tracking-[0.12em] text-[#8A8F9E] uppercase">
                          Ders açıklaması
                        </span>
                        <textarea
                          value={aciklama}
                          onChange={(e) => setAciklama(e.target.value)}
                          placeholder="Öğrencinin ders altında göreceği açıklama"
                          className="min-h-[90px] resize-y rounded-[10px] border border-ink/13 bg-white px-[13px] py-3 text-sm leading-[1.6] text-ink outline-none focus:border-brand"
                        />
                      </label>
                    </div>
                    {hata && <div className="mt-3 text-sm text-danger-ink">{hata}</div>}
                    <button
                      type="button"
                      onClick={() => kaydet(d.id)}
                      disabled={islemde}
                      className="mt-4 h-[42px] rounded-[10px] bg-brand px-5 text-sm font-semibold text-white hover:bg-ink disabled:opacity-60"
                    >
                      {islemde ? "Kaydediliyor…" : "Kaydet"}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
