"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { yasalKaydet } from "@/app/admin/(protected)/yasal/actions";
import { Icon } from "@/components/Icon";
import { Toggle } from "./Toggle";
import type { YasalSayfa } from "@/lib/yasal";
import { useBildirim } from "@/components/Bildirim";

export function YasalYonetimi({ sayfalar }: { sayfalar: YasalSayfa[] }) {
  const router = useRouter();
  const [acik, setAcik] = useState<string | null>(sayfalar[0]?.slug ?? null);

  const yayindaSayisi = sayfalar.filter((s) => s.yayinda).length;

  return (
    <main className="p-7 pb-14">
      <div>
        <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
          Yasal metinler
        </h1>
        <p className="mt-[7px] max-w-[720px] text-[14.5px] text-[#5C6273]">
          {sayfalar.length} belge · {yayindaSayisi} tanesi yayında. Metni mevcut sitenden kopyalayıp buraya
          yapıştırabilirsin. Boş bir belge yayınlanamaz; yayına almadığın sayfa ziyaretçiye &ldquo;henüz
          yayınlanmadı&rdquo; mesajı gösterir.
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        {sayfalar.map((s) => (
          <YasalKarti
            key={s.slug}
            sayfa={s}
            acik={acik === s.slug}
            onAc={() => setAcik(acik === s.slug ? null : s.slug)}
            onKaydedildi={() => router.refresh()}
          />
        ))}
      </div>
    </main>
  );
}

function YasalKarti({
  sayfa,
  acik,
  onAc,
  onKaydedildi,
}: {
  sayfa: YasalSayfa;
  acik: boolean;
  onAc: () => void;
  onKaydedildi: () => void;
}) {
  const [baslik, setBaslik] = useState(sayfa.baslik);
  const [ozet, setOzet] = useState(sayfa.ozet);
  const [icerik, setIcerik] = useState(sayfa.icerik);
  const [guncelleme, setGuncelleme] = useState(sayfa.guncelleme ?? "");
  const [yayinda, setYayinda] = useState(sayfa.yayinda);
  const [durum, setDurum] = useState<{ tip: "ok" | "hata"; mesaj: string } | null>(null);
  const [islemde, startTransition] = useTransition();
  const bildir = useBildirim();

  const kaydet = () => {
    setDurum(null);
    startTransition(async () => {
      const r = await yasalKaydet({ slug: sayfa.slug, baslik, ozet, icerik, guncelleme, yayinda });
      if (r?.error) {
        setDurum({ tip: "hata", mesaj: r.error });
        bildir.hata(r.error);
      } else {
        setDurum({ tip: "ok", mesaj: "Kaydedildi." });
        bildir.basarili(`${baslik || sayfa.slug} kaydedildi.`);
        onKaydedildi();
      }
    });
  };

  const alan = "h-[46px] rounded-[10px] border border-ink/13 bg-white px-[13px] text-sm text-ink outline-none focus:border-brand";
  const karakterSayisi = icerik.trim().length;

  return (
    <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
      <div className="flex flex-wrap items-center gap-4 px-6 py-[16px]">
        <div className="min-w-0 flex-1">
          <div className="text-[15.5px] font-semibold">{sayfa.baslik}</div>
          <div className="mt-1 font-mono text-[10.5px] text-[#8A8F9E]">
            /{sayfa.slug} · {karakterSayisi > 0 ? `${karakterSayisi.toLocaleString("tr-TR")} karakter` : "metin boş"}
          </div>
        </div>
        <span
          className="flex-none rounded-full px-[9px] py-[3px] font-mono text-[9.5px] tracking-[0.08em] uppercase"
          style={
            sayfa.yayinda
              ? { background: "rgba(28,86,243,0.12)", color: "#1C56F3" }
              : { background: "rgba(201,138,27,0.14)", color: "#A5711A" }
          }
        >
          {sayfa.yayinda ? "Yayında" : "Taslak"}
        </span>
        <a
          href={`/${sayfa.slug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-8 flex-none items-center gap-[6px] rounded-[8px] border border-ink/13 bg-white px-3 text-[12.5px] font-semibold text-ink transition hover:border-brand hover:text-brand"
        >
          <Icon name="external" size={13} />
          Görüntüle
        </a>
        <button
          type="button"
          onClick={onAc}
          className="h-8 flex-none rounded-[8px] border border-ink/13 bg-white px-3 text-[12.5px] font-semibold text-ink transition hover:border-ink hover:bg-ink hover:text-white"
        >
          {acik ? "Kapat" : "Düzenle"}
        </button>
      </div>

      {acik && (
        <div className="border-t border-ink/8 bg-[#FAFBFF] px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-2 sm:col-span-2">
              <span className="font-mono text-[10px] tracking-[0.12em] text-[#8A8F9E] uppercase">Başlık</span>
              <input type="text" value={baslik} onChange={(e) => setBaslik(e.target.value)} className={alan} />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] tracking-[0.12em] text-[#8A8F9E] uppercase">
                Son güncelleme tarihi
              </span>
              <input
                type="date"
                value={guncelleme}
                onChange={(e) => setGuncelleme(e.target.value)}
                className={alan}
              />
            </label>
            <label className="flex flex-col gap-2 sm:col-span-3">
              <span className="font-mono text-[10px] tracking-[0.12em] text-[#8A8F9E] uppercase">
                Kısa özet (başlığın altında görünür)
              </span>
              <input type="text" value={ozet} onChange={(e) => setOzet(e.target.value)} className={alan} />
            </label>
          </div>

          <label className="mt-4 flex flex-col gap-2">
            <span className="font-mono text-[10px] tracking-[0.12em] text-[#8A8F9E] uppercase">Belge metni</span>
            <textarea
              value={icerik}
              onChange={(e) => setIcerik(e.target.value)}
              placeholder="Metni buraya yapıştır."
              className="min-h-[420px] resize-y rounded-[10px] border border-ink/13 bg-white px-[14px] py-3 font-mono text-[13px] leading-[1.7] text-ink outline-none focus:border-brand"
            />
            <span className="text-[12px] leading-[1.6] text-[#9CA1AE]">
              Düz metin yapıştırabilirsin. Biçimlendirme için: <code>##</code> ile başlayan satır başlık olur,{" "}
              <code>-</code> ile başlayan satır madde olur, <code>1.</code> ile başlayan satır numaralı madde olur.
              &ldquo;MADDE 5&rdquo; gibi satırlar otomatik başlık sayılır. Boş satır paragrafları ayırır.
            </span>
          </label>

          <div className="mt-4 max-w-[340px]">
            <Toggle
              checked={yayinda}
              onToggle={() => setYayinda((v) => !v)}
              label="Sitede yayında"
              sublabel="Kapalıysa sayfa 'henüz yayınlanmadı' gösterir"
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={kaydet}
              disabled={islemde}
              className="h-[42px] rounded-[10px] bg-brand px-5 text-sm font-semibold text-white transition hover:bg-ink disabled:opacity-60"
            >
              {islemde ? "Kaydediliyor…" : "Kaydet"}
            </button>
            {durum && (
              <span className="text-[13.5px]" style={{ color: durum.tip === "ok" ? "#1C56F3" : "#8C1D1D" }}>
                {durum.mesaj}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
