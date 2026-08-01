"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { seansEkle, seansDurumDegistir, seansSil } from "@/app/admin/(protected)/seanslar/actions";
import { durumStil } from "@/lib/admin/shared";
import { seansDurumEtiket, saatBicimi } from "@/lib/admin/format";
import { seansAyir } from "@/lib/seans";
import { guvenliUrl } from "@/lib/guvenli-url";
import { Icon } from "@/components/Icon";
import { useBildirim } from "@/components/Bildirim";

export type SeansSatir = {
  id: string;
  isim: string;
  program: string;
  baslangic: string;
  sureDk: number;
  konu: string;
  toplantiLink: string;
  durum: "planlandi" | "tamamlandi" | "iptal";
};

export function SeansYonetimi({
  seanslar,
  ogrenciler,
  kurslar,
}: {
  seanslar: SeansSatir[];
  ogrenciler: { id: string; ad: string }[];
  kurslar: { id: string; ad: string }[];
}) {
  const router = useRouter();
  const bildir = useBildirim();
  const [formAcik, setFormAcik] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [islemde, startTransition] = useTransition();
  const [form, setForm] = useState({
    userId: "",
    courseId: "",
    baslangic: "",
    sureDk: "60",
    konu: "",
    toplantiLink: "",
  });

  const { yaklasan, gecmis } = seansAyir(seanslar);

  const kaydet = () => {
    setHata(null);
    startTransition(async () => {
      const r = await seansEkle(form);
      if (r?.error) {
        setHata(r.error);
        bildir.hata(r.error);
      } else {
        bildir.basarili("Seans planlandı.");
        setForm({ userId: "", courseId: "", baslangic: "", sureDk: "60", konu: "", toplantiLink: "" });
        setFormAcik(false);
        router.refresh();
      }
    });
  };

  const durumDegistir = (id: string, durum: SeansSatir["durum"]) => {
    startTransition(async () => {
      const r = await seansDurumDegistir(id, durum);
      if (r?.error) bildir.hata(r.error);
      else {
        bildir.basarili("Seans durumu güncellendi.");
        router.refresh();
      }
    });
  };

  const sil = (id: string) => {
    startTransition(async () => {
      const r = await seansSil(id);
      if (r?.error) bildir.hata(r.error);
      else {
        bildir.basarili("Seans silindi.");
        router.refresh();
      }
    });
  };

  const satir = (s: SeansSatir) => {
    const etiket = seansDurumEtiket[s.durum];
    const st = durumStil(etiket);
    const toplanti = guvenliUrl(s.toplantiLink);
    return (
      <div
        key={s.id}
        className="flex flex-col gap-3 border-b border-ink/7 px-4 py-4 last:border-b-0 hover:bg-[#F7F9FF] sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:px-[22px] sm:py-[14px]"
      >
        <div className="order-2 font-mono text-[11.5px] text-[#3A3F4F] sm:order-none sm:w-[150px] sm:flex-none">
          {saatBicimi.format(new Date(s.baslangic))}
          <span className="mt-[2px] block text-[10px] text-[#656B7A]">{s.sureDk} dk</span>
        </div>
        <div className="order-1 min-w-0 sm:order-none sm:flex-1">
          <div className="text-sm leading-[1.3] font-semibold">{s.isim}</div>
          <div className="mt-[2px] font-mono text-[10.5px] text-[#656B7A]">
            {s.konu || "Konu belirtilmedi"} · {s.program}
          </div>
        </div>
        {toplanti && (
          <a
            href={toplanti}
            target="_blank"
            rel="noreferrer"
            className="order-3 inline-flex h-8 w-fit flex-none items-center gap-[5px] rounded-[7px] border border-ink/13 bg-white px-3 text-[12.5px] font-semibold text-ink transition hover:border-brand hover:text-brand sm:order-none"
          >
            <Icon name="external" size={13} />
            Toplantı
          </a>
        )}
        <select
          aria-label="Seans durumu"
          value={s.durum}
          disabled={islemde}
          onChange={(e) => durumDegistir(s.id, e.target.value as SeansSatir["durum"])}
          className="h-8 flex-none rounded-[7px] border-0 px-[7px] font-mono text-[9.5px] tracking-[0.08em] uppercase outline-none"
          style={{ background: st.bg, color: st.renk }}
        >
          <option value="planlandi">Planlandı</option>
          <option value="tamamlandi">Tamamlandı</option>
          <option value="iptal">İptal</option>
        </select>
        <button
          type="button"
          disabled={islemde}
          onClick={() => sil(s.id)}
          aria-label="Seansı sil"
          className="flex h-8 w-8 flex-none items-center justify-center rounded-[7px] border border-ink/12 text-[#656B7A] transition hover:border-danger/45 hover:text-danger disabled:opacity-50"
        >
          <Icon name="x" size={14} />
        </button>
      </div>
    );
  };

  return (
    <main className="p-4 pb-14 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
            Birebir seanslar
          </h1>
          <p className="mt-[7px] text-[14.5px] text-[#5C6273]">
            {yaklasan.length} yaklaşan · {seanslar.length} toplam seans
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormAcik((v) => !v)}
          className="inline-flex h-10 items-center gap-[6px] rounded-[10px] bg-brand px-4 text-[13.5px] font-semibold text-white transition hover:bg-ink"
        >
          {!formAcik && <Icon name="plus" size={15} />}
          {formAcik ? "Vazgeç" : "Seans planla"}
        </button>
      </div>

      {formAcik && (
        <div className="mt-5 rounded-2xl border border-brand/30 bg-white p-6">
          <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Yeni seans</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">Öğrenci</span>
              <select
                value={form.userId}
                onChange={(e) => setForm({ ...form, userId: e.target.value })}
                className="h-[46px] rounded-[10px] border border-ink/13 bg-white px-[13px] text-sm text-ink outline-none focus:border-brand"
              >
                <option value="">Seç…</option>
                {ogrenciler.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.ad}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">Eğitim</span>
              <select
                value={form.courseId}
                onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                className="h-[46px] rounded-[10px] border border-ink/13 bg-white px-[13px] text-sm text-ink outline-none focus:border-brand"
              >
                <option value="">Belirtilmedi</option>
                {kurslar.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.ad}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">Tarih ve saat</span>
              <input
                type="datetime-local"
                value={form.baslangic}
                onChange={(e) => setForm({ ...form, baslangic: e.target.value })}
                className="h-[46px] rounded-[10px] border border-ink/13 bg-white px-[13px] text-sm text-ink outline-none focus:border-brand"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">Süre (dk)</span>
              <input
                type="number"
                value={form.sureDk}
                onChange={(e) => setForm({ ...form, sureDk: e.target.value })}
                className="h-[46px] rounded-[10px] border border-ink/13 bg-white px-[13px] text-sm text-ink outline-none focus:border-brand"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">Konu</span>
              <input
                type="text"
                value={form.konu}
                onChange={(e) => setForm({ ...form, konu: e.target.value })}
                placeholder="Kampanya optimizasyon seansı"
                className="h-[46px] rounded-[10px] border border-ink/13 bg-white px-[13px] text-sm text-ink outline-none focus:border-brand"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">Toplantı linki</span>
              <input
                type="text"
                value={form.toplantiLink}
                onChange={(e) => setForm({ ...form, toplantiLink: e.target.value })}
                placeholder="https://meet.google.com/…"
                className="h-[46px] rounded-[10px] border border-ink/13 bg-white px-[13px] text-sm text-ink outline-none focus:border-brand"
              />
            </label>
          </div>

          {hata && <div className="mt-4 text-sm text-danger-ink">{hata}</div>}

          <button
            type="button"
            onClick={kaydet}
            disabled={islemde}
            className="mt-5 h-[46px] rounded-[10px] bg-brand px-6 text-[15px] font-semibold text-white hover:bg-ink disabled:opacity-60"
          >
            {islemde ? "Kaydediliyor…" : "Seansı kaydet"}
          </button>
        </div>
      )}

      <div className="mt-5 overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <div className="border-b border-ink/8 px-[22px] py-[15px]">
          <h2 className="font-heading text-base font-semibold tracking-[-0.02em]">Yaklaşan</h2>
        </div>
        {yaklasan.length === 0 ? (
          <div className="px-[22px] py-8 text-center text-sm text-[#656B7A]">Planlanmış seans yok.</div>
        ) : (
          yaklasan.map(satir)
        )}
      </div>

      {gecmis.length > 0 && (
        <div className="mt-5 overflow-hidden rounded-2xl border border-ink/10 bg-white">
          <div className="border-b border-ink/8 px-[22px] py-[15px]">
            <h2 className="font-heading text-base font-semibold tracking-[-0.02em]">Geçmiş</h2>
          </div>
          {gecmis.map(satir)}
        </div>
      )}
    </main>
  );
}
