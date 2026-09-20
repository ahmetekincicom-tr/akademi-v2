"use client";

import { useMemo, useState, useTransition } from "react";
import { useBildirim } from "@/components/Bildirim";
import { googleDonusumTekrarla, bekleyenGoogleDonusumleri } from "@/app/kontrol-9f4x2k/(protected)/google/actions";

export type DonusumSatiri = {
  id: string;
  paymentId: string;
  durum: string;
  tutar: number | null;
  paraBirimi: string;
  gclid: string | null;
  gaClientId: string | null;
  kaynak: string | null;
  httpKod: number | null;
  hata: string | null;
  olayZamani: string;
  gonderimZamani: string | null;
  kisi: string;
  kurs: string;
};

const para = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
const gun = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function tarih(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : gun.format(d);
}

const ROZET: Record<string, { etiket: string; sinif: string }> = {
  gonderildi: { etiket: "Gönderildi", sinif: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  bekliyor: { etiket: "Bekliyor", sinif: "bg-amber-50 text-amber-700 border-amber-200" },
  basarisiz: { etiket: "Başarısız", sinif: "bg-red-50 text-red-700 border-red-200" },
  atlandi: { etiket: "Atlandı", sinif: "bg-ink/[0.05] text-[#5C6273] border-ink/12" },
};

export function GoogleDonusumleri({
  satirlar,
  ga4,
  adsBagli,
}: {
  satirlar: DonusumSatiri[];
  ga4: string | null;
  adsBagli: boolean;
}) {
  const bildir = useBildirim();
  const [islemde, basla] = useTransition();
  const [aktif, setAktif] = useState<string | null>(null);

  const ozet = useMemo(() => {
    const say = (d: string) => satirlar.filter((s) => s.durum === d).length;
    return { gonderildi: say("gonderildi"), bekleyen: say("bekliyor") + say("basarisiz"), atlandi: say("atlandi") };
  }, [satirlar]);

  const tekrar = (paymentId: string) => {
    setAktif(paymentId);
    basla(async () => {
      const r = await googleDonusumTekrarla(paymentId);
      setAktif(null);
      if (r.error) bildir.hata(r.error);
      else bildir.basarili("Google'a yeniden gönderildi.");
    });
  };

  const hepsi = () => {
    basla(async () => {
      const r = await bekleyenGoogleDonusumleri();
      if (r.error) bildir.hata(r.error);
      else bildir.basarili(`${r.sayi ?? 0} dönüşüm gönderildi.`);
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-heading text-[22px] font-semibold tracking-[-0.02em]">Google dönüşümleri</h1>
        <p className="mt-1 max-w-[70ch] text-[13.5px] leading-[1.6] text-[#5C6273]">
          Reklamdan gelen ziyaretçinin GA4 kimliği (tıklama anında yakalanır) profile bağlanıyor; eğitim kaydı
          kesinleşince kayıt GA4 Measurement Protocol ile Google’a bir <strong>purchase</strong> olayı olarak
          gönderiliyor. GA4’te bunu <em>anahtar olay</em> işaretleyip Google Ads’e içe aktardığınızda reklam
          dönüşümleri Ads panelinde de görünür.
        </p>
      </div>

      {/* Kurulum durumu */}
      <div className="flex flex-wrap gap-3 text-[12.5px]">
        <span className={`rounded-full border px-3 py-1 ${ga4 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
          GA4 Measurement ID: {ga4 ? ga4 : "girilmemiş"}
        </span>
        <span className={`rounded-full border px-3 py-1 ${adsBagli ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-ink/12 bg-ink/[0.05] text-[#5C6273]"}`}>
          Google Ads ID: {adsBagli ? "girili" : "opsiyonel"}
        </span>
        <span className="rounded-full border border-ink/12 bg-ink/[0.05] px-3 py-1 text-[#5C6273]">
          Gönderim için sunucuda <code>GA4_MP_API_SECRET</code> gerekli
        </span>
      </div>

      {/* Özet */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { e: "Gönderildi", v: ozet.gonderildi },
          { e: "Bekleyen / hatalı", v: ozet.bekleyen },
          { e: "Atlandı (atıf yok)", v: ozet.atlandi },
        ].map((k) => (
          <div key={k.e} className="rounded-[12px] border border-ink/11 bg-white p-4">
            <div className="text-[24px] font-semibold text-ink">{k.v}</div>
            <div className="text-[12.5px] text-[#5C6273]">{k.e}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[13px] text-[#5C6273]">Son {satirlar.length} kayıt</span>
        <button
          type="button"
          onClick={hepsi}
          disabled={islemde || ozet.bekleyen === 0}
          className="rounded-[9px] border border-ink/14 bg-white px-3 py-2 text-[13px] font-semibold text-ink transition hover:border-brand hover:text-brand disabled:opacity-50"
        >
          Bekleyenleri gönder
        </button>
      </div>

      <div className="overflow-x-auto rounded-[12px] border border-ink/11 bg-white">
        <table className="w-full min-w-[820px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-ink/10 bg-mist text-left text-[11.5px] uppercase tracking-[0.04em] text-[#6B7080]">
              <th className="px-3 py-2.5 font-semibold">Kişi</th>
              <th className="px-3 py-2.5 font-semibold">Eğitim</th>
              <th className="px-3 py-2.5 font-semibold">Tutar</th>
              <th className="px-3 py-2.5 font-semibold">Atıf</th>
              <th className="px-3 py-2.5 font-semibold">Durum</th>
              <th className="px-3 py-2.5 font-semibold">Tarih</th>
              <th className="px-3 py-2.5 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {satirlar.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-[#8A90A0]">
                  Henüz dönüşüm yok. İlk reklam kaydı geldiğinde burada listelenecek.
                </td>
              </tr>
            )}
            {satirlar.map((s) => {
              const rozet = ROZET[s.durum] ?? ROZET.atlandi;
              const reklam = Boolean(s.gclid) || s.kaynak === "whatsapp" || Boolean(s.gaClientId);
              return (
                <tr key={s.id} className="border-b border-ink/[0.06] last:border-0 align-top">
                  <td className="px-3 py-2.5 text-ink">{s.kisi}</td>
                  <td className="px-3 py-2.5 text-[#5C6273]">{s.kurs}</td>
                  <td className="px-3 py-2.5 text-ink">{s.tutar != null ? para.format(s.tutar) : "—"}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-col gap-0.5">
                      <span className={reklam ? "font-medium text-emerald-700" : "text-[#8A90A0]"}>
                        {reklam ? "Reklam" : "Atıf yok"}
                      </span>
                      <span className="font-mono text-[10.5px] text-[#9aa0ae]">
                        {s.gclid ? "gclid ✓" : "gclid —"} · {s.gaClientId ? "GA ✓" : "GA —"}
                        {s.kaynak ? ` · ${s.kaynak}` : ""}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-block rounded-full border px-2.5 py-1 text-[11.5px] font-medium ${rozet.sinif}`}>
                      {rozet.etiket}
                    </span>
                    {s.hata && (
                      <div className="mt-1 max-w-[220px] text-[11px] text-[#8A90A0]">{s.hata}</div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-[#5C6273]">{tarih(s.gonderimZamani ?? s.olayZamani)}</td>
                  <td className="px-3 py-2.5 text-right">
                    {s.durum !== "gonderildi" && (
                      <button
                        type="button"
                        onClick={() => tekrar(s.paymentId)}
                        disabled={islemde && aktif === s.paymentId}
                        className="rounded-[8px] border border-ink/14 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-ink transition hover:border-brand hover:text-brand disabled:opacity-50"
                      >
                        {islemde && aktif === s.paymentId ? "…" : "Tekrar gönder"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
