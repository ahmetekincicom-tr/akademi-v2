"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { kayitEkle, kayitKaldir } from "@/app/admin/(protected)/ogrenciler/actions";
import { Icon } from "@/components/Icon";

export type AdminKurs = { id: string; slug: string; baslik: string };

export type AdminOgrenci = {
  id: string;
  isim: string;
  eposta: string;
  admin: boolean;
  kayitTarihi: string;
  kayitlar: {
    courseId: string;
    baslik: string;
    atanmaTarihi: string;
    dersSayisi: number;
    tamamlanan: number;
    yuzde: number;
  }[];
};

const tarihBicimi = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric" });

function basHarfler(isim: string) {
  return isim
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function OgrenciYonetimi({ ogrenciler, kurslar }: { ogrenciler: AdminOgrenci[]; kurslar: AdminKurs[] }) {
  const router = useRouter();
  const [arama, setArama] = useState("");
  const [seciliId, setSeciliId] = useState<string | null>(null);
  const [eklenecekKurs, setEklenecekKurs] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [islemde, startTransition] = useTransition();

  const listelenen = useMemo(() => {
    const q = arama.trim().toLowerCase();
    if (!q) return ogrenciler;
    return ogrenciler.filter((o) => o.isim.toLowerCase().includes(q) || o.eposta.toLowerCase().includes(q));
  }, [arama, ogrenciler]);

  const secili = ogrenciler.find((o) => o.id === seciliId) ?? null;
  const atanabilir = kurslar.filter((k) => !secili?.kayitlar.some((r) => r.courseId === k.id));

  const ata = () => {
    if (!secili || !eklenecekKurs) return;
    setHata(null);
    startTransition(async () => {
      const r = await kayitEkle(secili.id, eklenecekKurs);
      if (r?.error) setHata(r.error);
      else {
        setEklenecekKurs("");
        router.refresh();
      }
    });
  };

  const kaldir = (courseId: string) => {
    if (!secili) return;
    setHata(null);
    startTransition(async () => {
      const r = await kayitKaldir(secili.id, courseId);
      if (r?.error) setHata(r.error);
      else router.refresh();
    });
  };

  return (
    <main className="p-7 pb-14">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
            Öğrenciler
          </h1>
          <p className="mt-[7px] text-[14.5px] text-[#5C6273]">
            {ogrenciler.length} kayıt · eğitim ataması ve ilerleme buradan yönetilir.
          </p>
        </div>
      </div>

      <div className="mt-[22px] flex h-[42px] max-w-[380px] items-center gap-[9px] rounded-[10px] border border-ink/12 bg-white px-[14px]">
        <Icon name="search" size={15} className="flex-none text-[#9CA1AE]" />
        <input
          type="text"
          placeholder="İsim veya e-posta ara"
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          className="w-full border-0 bg-transparent text-sm text-ink outline-none"
        />
      </div>

      <div className="mt-[18px] overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <div className="grid grid-cols-[2fr_1.8fr_1.2fr_1fr_90px] gap-4 border-b border-ink/8 bg-mist px-[22px] py-[13px] font-mono text-[9.5px] tracking-[0.12em] text-[#8A8F9E] uppercase">
          <span>Öğrenci</span>
          <span>Eğitimler</span>
          <span>İlerleme</span>
          <span>Kayıt</span>
          <span />
        </div>

        {listelenen.length === 0 ? (
          <div className="px-[22px] py-10 text-center text-sm text-[#8A8F9E]">
            {ogrenciler.length === 0 ? "Henüz kayıtlı kullanıcı yok." : "Aramanla eşleşen öğrenci bulunamadı."}
          </div>
        ) : (
          listelenen.map((o) => {
            const toplamDers = o.kayitlar.reduce((n, r) => n + r.dersSayisi, 0);
            const toplamBitti = o.kayitlar.reduce((n, r) => n + r.tamamlanan, 0);
            const yuzde = toplamDers ? Math.round((toplamBitti / toplamDers) * 100) : 0;
            return (
              <div
                key={o.id}
                className="grid grid-cols-[2fr_1.8fr_1.2fr_1fr_90px] items-center gap-4 border-b border-ink/7 px-[22px] py-[14px] transition last:border-b-0 hover:bg-[#F7F9FF]"
              >
                <div className="flex min-w-0 items-center gap-[11px]">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#F2F4FA] font-mono text-[11px] font-medium text-[#5C6273]">
                    {basHarfler(o.isim)}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">{o.isim}</span>
                      {o.admin && (
                        <span className="flex-none rounded-full bg-ink px-[7px] py-[2px] font-mono text-[9px] tracking-[0.08em] text-white uppercase">
                          admin
                        </span>
                      )}
                    </span>
                    <span className="block truncate font-mono text-[10px] text-[#8A8F9E]">{o.eposta}</span>
                  </span>
                </div>
                <div className="min-w-0 text-[13.5px] text-[#3A3F4F]">
                  {o.kayitlar.length ? o.kayitlar.map((r) => r.baslik).join(", ") : "—"}
                </div>
                <div>
                  <div className="h-[5px] overflow-hidden rounded-full bg-ink/8">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${yuzde}%` }} />
                  </div>
                  <div className="mt-[5px] font-mono text-[10px] text-[#8A8F9E]">
                    {o.kayitlar.length ? `${yuzde}% · ${toplamBitti}/${toplamDers}` : "kayıt yok"}
                  </div>
                </div>
                <div className="font-mono text-[11px] text-[#5C6273]">
                  {tarihBicimi.format(new Date(o.kayitTarihi))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSeciliId(o.id === seciliId ? null : o.id);
                    setHata(null);
                    setEklenecekKurs("");
                  }}
                  className="h-8 rounded-[8px] border border-ink/13 bg-white text-[12.5px] font-semibold text-ink hover:border-ink hover:bg-ink hover:text-white"
                >
                  {o.id === seciliId ? "Kapat" : "Detay"}
                </button>
              </div>
            );
          })
        )}
      </div>

      {secili && (
        <div className="mt-5 overflow-hidden rounded-2xl border border-brand/30 bg-white shadow-[0_20px_44px_rgba(10,13,24,0.09)]">
          <div className="flex flex-wrap items-center gap-[14px] border-b border-ink/8 px-6 py-5">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#F2F4FA] font-mono text-[13px] font-medium text-[#5C6273]">
              {basHarfler(secili.isim)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-heading text-[19px] font-semibold tracking-[-0.02em]">{secili.isim}</div>
              <div className="mt-[3px] truncate font-mono text-[10.5px] text-[#8A8F9E]">{secili.eposta}</div>
            </div>
            <button
              type="button"
              onClick={() => setSeciliId(null)}
              aria-label="Kapat"
              className="flex h-[38px] w-[38px] items-center justify-center rounded-[9px] border border-ink/13 bg-white text-[#5C6273] transition hover:border-ink hover:text-ink"
            >
              <Icon name="x" size={16} />
            </button>
          </div>

          {hata && (
            <div className="border-b border-ink/8 bg-danger/6 px-6 py-3 text-sm text-danger-ink">{hata}</div>
          )}

          <div className="px-6 py-5">
            <div className="font-mono text-[9.5px] tracking-[0.12em] text-[#8A8F9E] uppercase">Kayıtlı eğitimler</div>
            <div className="mt-3 flex flex-col gap-[10px]">
              {secili.kayitlar.length === 0 && (
                <div className="rounded-[11px] border border-dashed border-ink/16 px-[15px] py-[18px] text-center text-[13.5px] text-[#8A8F9E]">
                  Bu öğrenciye henüz eğitim atanmamış.
                </div>
              )}
              {secili.kayitlar.map((r) => (
                <div key={r.courseId} className="flex flex-wrap items-center gap-3 rounded-[11px] border border-ink/11 px-[15px] py-[13px]">
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{r.baslik}</span>
                  <span className="font-mono text-[10.5px] text-[#5C6273]">
                    {r.yuzde}% · {r.tamamlanan}/{r.dersSayisi} ders
                  </span>
                  <span className="font-mono text-[10.5px] text-[#9CA1AE]">
                    {tarihBicimi.format(new Date(r.atanmaTarihi))}
                  </span>
                  <button
                    type="button"
                    disabled={islemde}
                    onClick={() => kaldir(r.courseId)}
                    className="h-[30px] rounded-[8px] border border-ink/13 bg-white px-[11px] text-xs font-semibold text-[#5C6273] hover:border-danger/40 hover:text-danger disabled:opacity-50"
                  >
                    Çıkar
                  </button>
                </div>
              ))}
            </div>

            {atanabilir.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-ink/8 pt-5">
                <select
                  value={eklenecekKurs}
                  onChange={(e) => setEklenecekKurs(e.target.value)}
                  className="h-[42px] min-w-[260px] rounded-[10px] border border-ink/13 bg-white px-[13px] text-sm text-ink outline-none focus:border-brand"
                >
                  <option value="">Eğitim seç…</option>
                  {atanabilir.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.baslik}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!eklenecekKurs || islemde}
                  onClick={ata}
                  className="h-[42px] rounded-[10px] bg-brand px-[18px] text-sm font-semibold text-white hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {islemde ? "Atanıyor…" : "Eğitimi ata"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
