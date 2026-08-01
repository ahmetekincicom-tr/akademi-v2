"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { siteIcerikKaydet } from "@/app/admin/(protected)/site-icerik/actions";
import { useBildirim } from "@/components/Bildirim";
import type { SiteIcerik, DuyuruStili } from "@/lib/site-icerik";

const ALAN =
  "h-[46px] rounded-[10px] border border-ink/13 bg-white px-[14px] text-[15px] text-ink outline-none focus:border-brand";
const ETIKET = "font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase";

export function SiteIcerikFormu({ icerik }: { icerik: SiteIcerik }) {
  const router = useRouter();
  const bildir = useBildirim();
  const [islemde, startTransition] = useTransition();
  const [form, setForm] = useState({
    kayitDuyurusu: icerik.kayitDuyurusu,
    kayitDuyurusuAktif: icerik.kayitDuyurusuAktif,
    duyuruStili: icerik.duyuruStili as DuyuruStili,
    egitmenAd: icerik.egitmenAd,
    egitmenUnvan: icerik.egitmenUnvan,
    egitmenBiyografi: icerik.egitmenBiyografi,
  });

  const kaydet = () => {
    startTransition(async () => {
      const r = await siteIcerikKaydet(form);
      if (r?.error) bildir.hata(r.error);
      else {
        bildir.basarili("Kaydedildi. Eğitim sayfalarında görünür.");
        router.refresh();
      }
    });
  };

  return (
    <div className="mt-6 flex flex-col gap-5">
      <section className="rounded-2xl border border-ink/10 bg-white p-6">
        <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Kayıt duyurusu</h2>
        <p className="mt-1 max-w-[620px] text-[13.5px] leading-[1.6] text-[#5C6273]">
          Eğitim detay sayfalarında, eğitim başlığının hemen üstünde beyaz bir kutu olarak çıkar; çerçevesi yavaşça
          mavi yanıp söner. Her ay güncellemen yeterli.
        </p>

        <label className="mt-5 flex flex-col gap-2">
          <span className={ETIKET}>Duyuru metni</span>
          <input
            type="text"
            value={form.kayitDuyurusu}
            onChange={(e) => setForm({ ...form, kayitDuyurusu: e.target.value })}
            placeholder="Ağustos ayı kayıtları doldu, Eylül ayı kayıtları başladı!"
            className={ALAN}
          />
        </label>

        <label className="mt-4 flex items-center gap-[10px] text-[14px] text-[#3A3F4F]">
          <input
            type="checkbox"
            checked={form.kayitDuyurusuAktif}
            onChange={(e) => setForm({ ...form, kayitDuyurusuAktif: e.target.checked })}
            className="h-4 w-4 accent-[#1C56F3]"
          />
          Duyuruyu sayfada göster
        </label>

        {form.kayitDuyurusu && (
          <div className="mt-6">
            <div className={ETIKET}>Görünüm — birini seç</div>
            <p className="mt-[6px] text-[13px] text-[#5C6273]">
              İkisi de koyu hero üzerinde gösteriliyor. Kenarındaki ışık her ikisinde de turluyor.
            </p>

            <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {(
                [
                  { deger: "acik" as const, ad: "Beyaz kutu", not: "Koyu zeminde en yüksek kontrast." },
                  { deger: "koyu" as const, ad: "Siyah hap", not: "Verdiğin kaynak tasarımın birebir hâli." },
                ]
              ).map((se) => {
                const secili = form.duyuruStili === se.deger;
                return (
                  <button
                    key={se.deger}
                    type="button"
                    onClick={() => setForm({ ...form, duyuruStili: se.deger })}
                    aria-pressed={secili}
                    className="rounded-[14px] border-2 p-4 text-left transition"
                    style={{
                      borderColor: secili ? "#1C56F3" : "rgba(10,13,24,0.12)",
                      background: secili ? "rgba(28,86,243,0.05)" : "#FFFFFF",
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[14.5px] font-semibold text-ink">{se.ad}</span>
                      <span
                        className="flex h-[18px] w-[18px] items-center justify-center rounded-full border-2"
                        style={{
                          borderColor: secili ? "#1C56F3" : "rgba(10,13,24,0.2)",
                          background: secili ? "#1C56F3" : "transparent",
                        }}
                      >
                        {secili && <span className="h-[6px] w-[6px] rounded-full bg-white" />}
                      </span>
                    </div>
                    <div className="mt-1 text-[12.5px] text-[#5C6273]">{se.not}</div>

                    <div className="mt-3 rounded-[11px] bg-ink p-5">
                      {se.deger === "koyu" ? (
                        <div className="duyuru-koyu inline-block max-w-full">
                          <span>{form.kayitDuyurusu}</span>
                        </div>
                      ) : (
                        <div className="duyuru-parlak inline-block max-w-full rounded-[13px] px-[18px] py-[13px]">
                          <span className="text-[14.5px] leading-[1.45] font-semibold tracking-[-0.01em] text-ink">
                            {form.kayitDuyurusu}
                          </span>
                        </div>
                      )}
                      <div className="mt-3 font-heading text-[20px] leading-[1.15] font-semibold tracking-[-0.03em] text-white">
                        Eğitim başlığı buraya gelir
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-ink/10 bg-white p-6">
        <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Eğitmen bilgisi</h2>
        <p className="mt-1 max-w-[620px] text-[13.5px] leading-[1.6] text-[#5C6273]">
          Eğitim detay sayfasındaki eğitmen kutusunda görünür.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className={ETIKET}>Ad soyad</span>
            <input
              type="text"
              value={form.egitmenAd}
              onChange={(e) => setForm({ ...form, egitmenAd: e.target.value })}
              className={ALAN}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className={ETIKET}>Unvan</span>
            <input
              type="text"
              value={form.egitmenUnvan}
              onChange={(e) => setForm({ ...form, egitmenUnvan: e.target.value })}
              placeholder="Dijital pazarlama eğitmeni · Ankara"
              className={ALAN}
            />
          </label>
        </div>

        <label className="mt-4 flex flex-col gap-2">
          <span className={ETIKET}>Biyografi</span>
          <textarea
            value={form.egitmenBiyografi}
            onChange={(e) => setForm({ ...form, egitmenBiyografi: e.target.value })}
            placeholder="Kaç yıldır ne yaptığın, derslerde nasıl çalıştığın…"
            className="min-h-[140px] resize-y rounded-[10px] border border-ink/13 bg-white px-[14px] py-3 text-[15px] leading-[1.65] text-ink outline-none focus:border-brand"
          />
        </label>
      </section>

      <div>
        <button
          type="button"
          onClick={kaydet}
          disabled={islemde}
          className="h-[46px] rounded-[10px] bg-brand px-6 text-[15px] font-semibold text-white transition hover:bg-ink disabled:opacity-60"
        >
          {islemde ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </div>
    </div>
  );
}
