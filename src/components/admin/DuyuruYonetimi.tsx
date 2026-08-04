"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  duyuruKaydet,
  duyuruSil,
  duyuruBildirimGonder,
} from "@/app/admin/(protected)/duyurular/actions";
import { useBildirim } from "@/components/Bildirim";
import { Icon } from "@/components/Icon";
import {
  KATEGORILER,
  ONEM_ETIKET,
  ONEM_STIL,
  type Duyuru,
  type DuyuruOnem,
} from "@/lib/duyuru";
import { TR_ZAMAN } from "@/lib/zaman";

const tarihBicimi = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TR_ZAMAN,
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const ALAN =
  "h-[42px] w-full rounded-[10px] border border-ink/13 bg-white px-3 text-[14px] text-ink outline-none focus:border-brand";

type Taslak = {
  id?: string;
  baslik: string;
  ozet: string;
  icerik: string;
  kategori: string;
  onem: DuyuruOnem;
};

const BOS: Taslak = { baslik: "", ozet: "", icerik: "", kategori: "Instagram", onem: "normal" };

export function DuyuruYonetimi({ duyurular, cihazSayisi }: { duyurular: Duyuru[]; cihazSayisi: number }) {
  const router = useRouter();
  const bildir = useBildirim();
  const [islemde, startTransition] = useTransition();
  const [taslak, setTaslak] = useState<Taslak | null>(null);

  const calistir = (is: () => Promise<{ error?: string; mesaj?: string }>, basarili?: string) => {
    startTransition(async () => {
      const r = await is();
      if (r.error) {
        bildir.hata(r.error);
        return;
      }
      bildir.basarili(r.mesaj ?? basarili ?? "Kaydedildi.");
      router.refresh();
    });
  };

  const kaydet = (durum: "taslak" | "yayinda") => {
    if (!taslak) return;
    startTransition(async () => {
      const r = await duyuruKaydet({ ...taslak, durum });
      if (r.error) {
        bildir.hata(r.error);
        return;
      }
      bildir.basarili(durum === "yayinda" ? "Duyuru yayınlandı." : "Taslak kaydedildi.");
      setTaslak(null);
      router.refresh();
    });
  };

  return (
    <main className="flex flex-col gap-6 p-4 pb-14 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
            Gündem panosu
          </h1>
          <p className="mt-[7px] max-w-[620px] text-[14.5px] leading-[1.6] text-[#5C6273]">
            Meta ve sosyal medya tarafındaki gelişmeler. Yayına aldığın duyuruyu push bildirimi olarak
            gönderebilirsin; bildirime dokunan öğrenci doğrudan duyurunun sayfasına gider.
          </p>
        </div>
        {!taslak && (
          <button
            type="button"
            onClick={() => setTaslak({ ...BOS })}
            className="inline-flex h-[42px] flex-none items-center gap-2 rounded-[10px] bg-brand px-4 text-[13.5px] font-semibold text-white transition hover:bg-ink"
          >
            <Icon name="plus" size={15} />
            Yeni duyuru
          </button>
        )}
      </div>

      {taslak && (
        <div className="rounded-2xl border border-brand/30 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-[17px] font-semibold tracking-[-0.02em]">
              {taslak.id ? "Duyuruyu düzenle" : "Yeni duyuru"}
            </h2>
            <button
              type="button"
              onClick={() => setTaslak(null)}
              aria-label="Kapat"
              className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border border-ink/13 text-[#5C6273] hover:border-ink hover:text-ink"
            >
              <Icon name="x" size={15} />
            </button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_180px_150px]">
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-ink">Başlık</span>
              <input
                value={taslak.baslik}
                onChange={(e) => setTaslak({ ...taslak, baslik: e.target.value })}
                maxLength={80}
                placeholder="Instagram'da erişim sorunu"
                className={ALAN}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-ink">Kategori</span>
              <input
                list="duyuru-kategorileri"
                value={taslak.kategori}
                onChange={(e) => setTaslak({ ...taslak, kategori: e.target.value })}
                className={ALAN}
              />
              <datalist id="duyuru-kategorileri">
                {KATEGORILER.map((k) => (
                  <option key={k} value={k} />
                ))}
              </datalist>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-ink">Önem</span>
              <select
                value={taslak.onem}
                onChange={(e) => setTaslak({ ...taslak, onem: e.target.value as DuyuruOnem })}
                className={ALAN}
              >
                {(Object.keys(ONEM_ETIKET) as DuyuruOnem[]).map((o) => (
                  <option key={o} value={o}>
                    {ONEM_ETIKET[o]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-ink">
              Özet <span className="font-normal text-[#8A90A0]">— bildirimin gövdesi olarak gider</span>
            </span>
            <input
              value={taslak.ozet}
              onChange={(e) => setTaslak({ ...taslak, ozet: e.target.value })}
              maxLength={180}
              placeholder="Bazı hesaplarda gönderi yükleme hatası bildiriliyor."
              className={ALAN}
            />
            <span className="text-right font-mono text-[11px] text-[#8A90A0]">{taslak.ozet.length}/180</span>
          </label>

          <label className="mt-2 flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-ink">Detay</span>
            <textarea
              value={taslak.icerik}
              onChange={(e) => setTaslak({ ...taslak, icerik: e.target.value })}
              rows={8}
              placeholder={"## Ne oluyor\nAçıklama…\n\n- Madde\n- Madde\n\n## Ne yapmalı\n…"}
              className="w-full rounded-[10px] border border-ink/13 bg-white p-3 text-[14px] leading-[1.6] text-ink outline-none focus:border-brand"
            />
            <span className="text-[12px] text-[#8A90A0]">
              Başlık için <code className="font-mono">##</code>, madde için <code className="font-mono">-</code>{" "}
              kullanabilirsin.
            </span>
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={islemde || !taslak.baslik.trim()}
              onClick={() => kaydet("yayinda")}
              className="h-[42px] rounded-[10px] bg-brand px-5 text-[14px] font-semibold text-white transition hover:bg-ink disabled:opacity-45"
            >
              Yayınla
            </button>
            <button
              type="button"
              disabled={islemde || !taslak.baslik.trim()}
              onClick={() => kaydet("taslak")}
              className="h-[42px] rounded-[10px] border border-ink/13 bg-white px-4 text-[14px] font-semibold text-ink transition hover:border-ink disabled:opacity-45"
            >
              Taslak kaydet
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {duyurular.length === 0 && !taslak && (
          <div className="rounded-2xl border border-dashed border-ink/16 px-6 py-12 text-center text-[14px] text-[#656B7A]">
            Henüz duyuru yok. &quot;Yeni duyuru&quot; ile ilk gelişmeyi ekleyebilirsin.
          </div>
        )}

        {duyurular.map((d) => {
          const st = ONEM_STIL[d.onem];
          const yayinda = d.durum === "yayinda";
          return (
            <div key={d.id} className="rounded-2xl border border-ink/10 bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-[9px] py-[3px] font-mono text-[9.5px] tracking-[0.08em] uppercase"
                  style={{ background: st.bg, color: st.renk }}
                >
                  {ONEM_ETIKET[d.onem]}
                </span>
                <span className="rounded-full bg-mist px-[9px] py-[3px] font-mono text-[9.5px] tracking-[0.08em] text-[#5C6273] uppercase">
                  {d.kategori}
                </span>
                {!yayinda && (
                  <span className="rounded-full bg-ink/8 px-[9px] py-[3px] font-mono text-[9.5px] tracking-[0.08em] text-[#5C6273] uppercase">
                    Taslak
                  </span>
                )}
                {d.bildirimTarihi && (
                  <span className="inline-flex items-center gap-1 font-mono text-[10.5px] text-[#1C7C4A]">
                    <Icon name="bell" size={12} />
                    gönderildi
                  </span>
                )}
                <span className="ml-auto font-mono text-[10.5px] text-[#8A90A0]">
                  {d.yayinTarihi ? tarihBicimi.format(new Date(d.yayinTarihi)) : "—"}
                </span>
              </div>

              <div className="mt-2 text-[15.5px] font-semibold text-ink">{d.baslik}</div>
              {d.ozet && <div className="mt-1 text-[13.5px] leading-[1.55] text-[#5C6273]">{d.ozet}</div>}

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={islemde || !yayinda || cihazSayisi === 0}
                  onClick={() => calistir(() => duyuruBildirimGonder(d.id))}
                  title={
                    !yayinda
                      ? "Önce yayına al"
                      : cihazSayisi === 0
                        ? "Kayıtlı cihaz yok"
                        : d.bildirimTarihi
                          ? "Bu duyuru için daha önce bildirim gönderildi"
                          : undefined
                  }
                  className="inline-flex h-9 items-center gap-1.5 rounded-[9px] bg-brand px-3 text-[13px] font-semibold text-white transition hover:bg-ink disabled:opacity-40"
                >
                  <Icon name="bell" size={14} />
                  {d.bildirimTarihi ? "Tekrar gönder" : `Bildirim gönder (${cihazSayisi})`}
                </button>
                <button
                  type="button"
                  disabled={islemde}
                  onClick={() =>
                    setTaslak({
                      id: d.id,
                      baslik: d.baslik,
                      ozet: d.ozet,
                      icerik: d.icerik,
                      kategori: d.kategori,
                      onem: d.onem,
                    })
                  }
                  className="inline-flex h-9 items-center rounded-[9px] border border-ink/13 bg-white px-3 text-[13px] font-semibold text-ink transition hover:border-brand hover:text-brand disabled:opacity-40"
                >
                  Düzenle
                </button>
                <button
                  type="button"
                  disabled={islemde}
                  onClick={() => calistir(() => duyuruSil(d.id), "Duyuru silindi.")}
                  className="inline-flex h-9 items-center rounded-[9px] border border-ink/13 bg-white px-3 text-[13px] font-semibold text-[#5C6273] transition hover:border-danger/45 hover:text-danger disabled:opacity-40"
                >
                  Sil
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
