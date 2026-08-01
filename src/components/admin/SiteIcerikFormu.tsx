"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { siteIcerikKaydet } from "@/app/admin/(protected)/site-icerik/actions";
import { useBildirim } from "@/components/Bildirim";
import type { SiteIcerik } from "@/lib/site-icerik";

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
          <div className="mt-5">
            <div className={ETIKET}>Önizleme</div>
            <div className="mt-2 rounded-[12px] bg-ink p-6">
              <div className="duyuru-nefes inline-block max-w-full rounded-[13px] border-2 bg-white px-[18px] py-[13px]">
                <span className="text-[15.5px] leading-[1.45] font-semibold tracking-[-0.01em] text-ink">
                  {form.kayitDuyurusu}
                </span>
              </div>
              <div className="mt-4 font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] text-white">
                Eğitim başlığı buraya gelir
              </div>
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
