"use client";

import { useMemo, useState, useTransition } from "react";
import { useBildirim } from "@/components/Bildirim";
import { Icon } from "@/components/Icon";
import {
  yonlendirmeAktifYap,
  yonlendirmeEkle,
  yonlendirmeGuncelle,
  yonlendirmeSil,
  type YonlendirmeGirdi,
} from "@/app/kontrol-9f4x2k/(protected)/blog/yonlendirmeler/actions";

export type YonlendirmeSatir = {
  id: string;
  kaynak: string;
  hedef: string | null;
  kod: 301 | 410;
  aktif: boolean;
  otomatik: boolean;
  notu: string;
  guncelleme: string;
  /** Satırı tetikleyici bir yazı için yazdıysa yazının başlığı. */
  yazi: string | null;
};

const ETIKET = "font-mono text-[10px] tracking-[0.13em] text-[#656B7A] uppercase";
const GIRDI =
  "h-11 w-full rounded-[10px] border border-ink/14 bg-white px-3 text-[14px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]";

const BOS: YonlendirmeGirdi = { kaynak: "", kod: 301, hedef: "", notu: "" };

function Form({
  ilk,
  dugme,
  onGonder,
  onIptal,
}: {
  ilk: YonlendirmeGirdi;
  dugme: string;
  onGonder: (g: YonlendirmeGirdi) => Promise<boolean>;
  onIptal?: () => void;
}) {
  const [g, setG] = useState(ilk);
  const [bekliyor, basla] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        basla(async () => {
          if (await onGonder(g)) setG(BOS);
        });
      }}
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_180px_minmax(0,1fr)]"
    >
      <label className="flex flex-col gap-1.5">
        <span className={ETIKET}>Eski adres</span>
        <input
          value={g.kaynak}
          onChange={(e) => setG({ ...g, kaynak: e.target.value })}
          placeholder="/eski-yazi/"
          required
          className={GIRDI}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={ETIKET}>Ne olsun</span>
        <select
          value={g.kod}
          onChange={(e) => setG({ ...g, kod: e.target.value === "410" ? 410 : 301 })}
          className={GIRDI}
        >
          <option value={301}>Yönlendir (301)</option>
          <option value={410}>Kaldırıldı (410)</option>
        </select>
      </label>
      <label className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
        <span className={ETIKET}>Yeni adres</span>
        <input
          value={g.kod === 410 ? "" : g.hedef}
          onChange={(e) => setG({ ...g, hedef: e.target.value })}
          placeholder={g.kod === 410 ? "— (410'da hedef yok)" : "/blog/"}
          disabled={g.kod === 410}
          required={g.kod === 301}
          className={`${GIRDI} disabled:bg-mist disabled:text-[#8A90A0]`}
        />
      </label>
      <label className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-2">
        <span className={ETIKET}>Not (isteğe bağlı)</span>
        <input
          value={g.notu}
          onChange={(e) => setG({ ...g, notu: e.target.value })}
          placeholder="Neden? Örn. içerik yeni yazıyla birleşti"
          className={GIRDI}
        />
      </label>
      <div className="flex items-end gap-2">
        {onIptal && (
          <button
            type="button"
            onClick={onIptal}
            className="h-11 flex-1 rounded-[10px] border border-ink/13 px-4 text-[14px] font-semibold text-ink hover:bg-mist"
          >
            Vazgeç
          </button>
        )}
        <button
          type="submit"
          disabled={bekliyor}
          className="h-11 flex-1 rounded-[10px] bg-brand px-4 text-[14px] font-semibold text-white hover:bg-ink disabled:opacity-50"
        >
          {bekliyor ? "Kaydediliyor…" : dugme}
        </button>
      </div>
    </form>
  );
}

export function YonlendirmeYonetimi({ satirlar }: { satirlar: YonlendirmeSatir[] }) {
  const bildir = useBildirim();
  const [ara, setAra] = useState("");
  const [duzenlenen, setDuzenlenen] = useState<string | null>(null);
  const [, basla] = useTransition();

  const gorunen = useMemo(() => {
    const q = ara.trim().toLocaleLowerCase("tr");
    if (!q) return satirlar;
    return satirlar.filter((s) =>
      [s.kaynak, s.hedef ?? "", s.notu, s.yazi ?? ""].some((a) => a.toLocaleLowerCase("tr").includes(q)),
    );
  }, [ara, satirlar]);

  const ekle = async (g: YonlendirmeGirdi) => {
    const r = await yonlendirmeEkle(g);
    if (r.error) {
      bildir.hata(r.error);
      return false;
    }
    bildir.basarili("Yönlendirme eklendi. En geç bir dakika içinde geçerli olur.");
    return true;
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-[14px] border border-ink/11 bg-white p-5">
        <h2 className="font-heading text-[16px] font-semibold tracking-[-0.01em]">Yeni yönlendirme</h2>
        <div className="mt-4">
          <Form ilk={BOS} dugme="Ekle" onGonder={ekle} />
        </div>
      </section>

      <section className="rounded-[14px] border border-ink/11 bg-white">
        <div className="flex flex-col gap-3 border-b border-ink/8 p-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-[14px] text-[#5C6273]">
            {satirlar.length} yönlendirme{ara && ` · ${gorunen.length} eşleşen`}
          </span>
          <label className="relative sm:w-[300px]">
            <span className="sr-only">Ara</span>
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#8A90A0]">
              <Icon name="search" size={15} />
            </span>
            <input
              value={ara}
              onChange={(e) => setAra(e.target.value)}
              placeholder="Adres, not ya da yazı ara"
              className={`${GIRDI} pl-9`}
            />
          </label>
        </div>

        {gorunen.length === 0 ? (
          <p className="p-6 text-center text-[14px] text-[#5C6273]">
            {satirlar.length === 0
              ? "Henüz yönlendirme yok. Bir yazının adresini değiştirdiğinde ya da yazıyı yayından kaldırdığında burada görünür."
              : "Aramayla eşleşen yönlendirme yok."}
          </p>
        ) : (
          <ul className="divide-y divide-ink/8">
            {gorunen.map((s) => (
              <li key={s.id} className="p-4">
                {duzenlenen === s.id ? (
                  <Form
                    ilk={{ kaynak: s.kaynak, kod: s.kod, hedef: s.hedef ?? "", notu: s.notu }}
                    dugme="Kaydet"
                    onIptal={() => setDuzenlenen(null)}
                    onGonder={async (g) => {
                      const r = await yonlendirmeGuncelle(s.id, g);
                      if (r.error) {
                        bildir.hata(r.error);
                        return false;
                      }
                      bildir.basarili("Yönlendirme güncellendi.");
                      setDuzenlenen(null);
                      return true;
                    }}
                  />
                ) : (
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className={`flex min-w-0 flex-col gap-1.5 ${s.aktif ? "" : "opacity-55"}`}>
                      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[13px]">
                        <span className="break-all text-ink">{s.kaynak}</span>
                        <span className="text-[#8A90A0]" aria-hidden>
                          →
                        </span>
                        {s.kod === 410 ? (
                          <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[11px] font-semibold text-danger">
                            410 · kaldırıldı
                          </span>
                        ) : (
                          <span className="break-all text-brand">{s.hedef}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-[#6B7080]">
                        <span>{s.otomatik ? "Kendiliğinden" : "Elle"}</span>
                        {s.yazi && <span>· {s.yazi}</span>}
                        {!s.aktif && <span className="font-semibold">· Kapalı</span>}
                        {s.notu && <span>· {s.notu}</span>}
                      </div>
                    </div>
                    <div className="flex flex-none flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          basla(async () => {
                            const r = await yonlendirmeAktifYap(s.id, !s.aktif);
                            if (r.error) bildir.hata(r.error);
                          })
                        }
                        className="h-11 rounded-[10px] border border-ink/13 px-3.5 text-[13.5px] font-semibold text-ink hover:bg-mist"
                      >
                        {s.aktif ? "Kapat" : "Aç"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDuzenlenen(s.id)}
                        className="h-11 rounded-[10px] border border-ink/13 px-3.5 text-[13.5px] font-semibold text-ink hover:bg-mist"
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!window.confirm(`${s.kaynak} yönlendirmesi silinsin mi? Bu adres 404 vermeye başlar.`)) return;
                          basla(async () => {
                            const r = await yonlendirmeSil(s.id);
                            if (r.error) bildir.hata(r.error);
                          });
                        }}
                        className="h-11 rounded-[10px] border border-ink/13 px-3.5 text-[13.5px] font-semibold text-[#5C6273] hover:border-danger/45 hover:text-danger"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
