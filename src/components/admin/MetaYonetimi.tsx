"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { useBildirim } from "@/components/Bildirim";
import { metaKuyrugunuTazele, metaOlayiDegistir } from "@/app/kontrol-9f4x2k/(protected)/meta/actions";
import { DURUM_ETIKET, OLAYLAR, OLAY_BASLIK } from "@/lib/meta/olaylar";
import { TR_ZAMAN } from "@/lib/zaman";

export type MetaGunlukSatiri = {
  id: string;
  olay: string;
  eventId: string;
  durum: string;
  sebep: string;
  deneme: number;
  tutar: number | null;
  tarih: string;
};

export type TemasSatiri = { kod: string; yer: string; izin: boolean; tarih: string };

const anBicimi = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TR_ZAMAN,
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const paraBicimi = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });

const DURUM_STIL: Record<string, { bg: string; renk: string }> = {
  gonderildi: { bg: "rgba(24,140,90,0.14)", renk: "#15774E" },
  bekliyor: { bg: "rgba(28,86,243,0.12)", renk: "#1C46C4" },
  basarisiz: { bg: "rgba(229,72,77,0.13)", renk: "#B4232A" },
  vazgecildi: { bg: "rgba(229,72,77,0.13)", renk: "#B4232A" },
  kapali: { bg: "#EEF2FC", renk: "#5C6273" },
  izinsiz: { bg: "#EEF2FC", renk: "#5C6273" },
  yapilandirilmadi: { bg: "rgba(201,138,27,0.16)", renk: "#A5711A" },
};

/**
 * Meta ölçümlemesinin yönetimi: hangi olaylar gidiyor ve gerçekten gitti mi.
 *
 * E-posta ekranıyla aynı düzen ve aynı gerekçe. "Bu satış neden Meta'da
 * görünmüyor" sorusunun dört ayrı cevabı var — olay kapalı, kişi izin
 * vermemiş, gönderim başarısız, ya da ayarlar eksik — ve dördü de aynı
 * günlükte satır olarak duruyor. Ayrı ekranlara bölünselerdi cevabı bulmak
 * için dört yere bakmak gerekirdi.
 */
export function MetaYonetimi({
  kapaliOlaylar,
  gunluk,
  temaslar,
  yapilandirildi,
  pixelVar,
  testModu,
}: {
  kapaliOlaylar: string[];
  gunluk: MetaGunlukSatiri[];
  temaslar: TemasSatiri[];
  yapilandirildi: boolean;
  pixelVar: boolean;
  testModu: boolean;
}) {
  const router = useRouter();
  const bildir = useBildirim();
  const [islemde, basla] = useTransition();
  const [suzgec, setSuzgec] = useState("hepsi");

  const kapali = useMemo(() => new Set(kapaliOlaylar), [kapaliOlaylar]);
  const listelenen = suzgec === "hepsi" ? gunluk : gunluk.filter((g) => g.durum === suzgec);

  // Son 150 kayıttaki dağılım; "bugün bir sorun var mı" sorusuna hızlı cevap.
  const sayim = useMemo(() => {
    const s: Record<string, number> = {};
    for (const g of gunluk) s[g.durum] = (s[g.durum] ?? 0) + 1;
    return s;
  }, [gunluk]);

  // İzinsizler de düğmeye dahil: izin sonradan verilmişse o satırlar
  // gönderilebilir hale geliyor (kontrolü sunucu yapıyor, düğme değil).
  const takilanVar = (sayim.basarisiz ?? 0) + (sayim.vazgecildi ?? 0) + (sayim.izinsiz ?? 0) > 0;

  const degistir = (anahtar: string, acik: boolean, baslik: string) => {
    basla(async () => {
      const r = await metaOlayiDegistir(anahtar, acik);
      if (r?.error) {
        bildir.hata(r.error);
        return;
      }
      bildir.basarili(acik ? `${baslik} açıldı.` : `${baslik} kapatıldı.`);
      router.refresh();
    });
  };

  const tazele = () => {
    basla(async () => {
      const r = await metaKuyrugunuTazele();
      if (r?.error) {
        bildir.hata(r.error);
        return;
      }
      bildir.basarili(r.sayi ? `${r.sayi} olay yeniden sıraya alındı.` : "Sıraya alınacak olay yok.");
      router.refresh();
    });
  };

  return (
    <main className="p-4 pb-14 sm:p-7">
      <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
        Meta ölçümleme
      </h1>
      <p className="mt-[7px] max-w-[720px] text-[14.5px] leading-[1.6] text-[#5C6273]">
        Reklam dönüşümlerini Meta&apos;ya bildiren olaylar. Satın alma tarayıcıda değil panelin içinde —
        bazen havaleyle — kapandığı için olayların çoğu sunucudan gidiyor.
      </p>

      {!yapilandirildi && (
        <div className="mt-5 flex flex-wrap items-start gap-3 rounded-2xl border border-[#E0A21C]/35 bg-[#FDF6E7] px-5 py-4">
          <span className="mt-[2px] flex-none text-[#8A6210]">
            <Icon name="alert" size={18} />
          </span>
          <p className="min-w-0 flex-1 text-[13.5px] leading-[1.6] text-[#5C6273]">
            {pixelVar
              ? "Conversions API token girilmemiş: tarayıcı pixel'i çalışıyor ama sunucu olayları (satın alma, teklif formu, WhatsApp) gönderilmiyor."
              : "Meta pixel ID girilmemiş: ne tarayıcı etiketi yükleniyor ne de sunucu olayları gidiyor."}{" "}
            Entegrasyonlar → Meta bölümünden gir. Bu arada üretilen olaylar kuyrukta bekliyor ve ayarlar
            girildiğinde gönderiliyor — Meta 7 gün geriye kabul ediyor.
          </p>
        </div>
      )}

      {testModu && (
        <div className="mt-5 flex flex-wrap items-start gap-3 rounded-2xl border border-[#E0A21C]/35 bg-[#FDF6E7] px-5 py-4">
          <span className="mt-[2px] flex-none text-[#8A6210]">
            <Icon name="alert" size={18} />
          </span>
          <p className="min-w-0 flex-1 text-[13.5px] leading-[1.6] text-[#5C6273]">
            <strong className="font-semibold text-ink">Test kodu dolu.</strong> Olaylar Events Manager&apos;ın
            test sekmesine düşüyor ve gerçek raporlara girmiyor. Doğrulama bittiyse Entegrasyonlar → Meta
            bölümünden boşalt.
          </p>
        </div>
      )}

      <section className="mt-6 overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <div className="border-b border-ink/8 px-5 py-4 sm:px-6">
          <h2 className="font-heading text-[17px] font-semibold tracking-[-0.02em]">Olaylar</h2>
          <p className="mt-[3px] text-[13px] leading-[1.5] text-[#656B7A]">
            Sağdaki numara Aggregated Event Measurement sırası. Meta, iOS kullanıcıları için alan adı başına
            en fazla 8 olayı bu öncelikle sayıyor; Business Manager&apos;da aynı sırayla tanımlanmalı.
          </p>
        </div>

        {OLAYLAR.map((o) => {
          const sunucu = o.kaynak === "sunucu";
          const acik = sunucu ? !kapali.has(o.anahtar) : pixelVar;

          return (
            <div
              key={o.anahtar}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-ink/7 px-5 py-[14px] last:border-b-0 sm:px-6"
            >
              <span className="w-[22px] flex-none font-mono text-[11px] text-[#A6ABB8]">{o.oncelik}</span>
              <div className="min-w-0 grow basis-[240px]">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[14.5px] leading-[1.3] font-semibold ${acik ? "text-ink" : "text-[#8A90A0]"}`}
                  >
                    {o.baslik}
                  </span>
                  <code className="font-mono text-[11px] text-[#8A90A0]">{o.anahtar}</code>
                </div>
                <div className="mt-[3px] text-[13px] leading-[1.5] text-[#656B7A]">{o.aciklama}</div>
              </div>

              {sunucu ? (
                <button
                  type="button"
                  role="switch"
                  aria-checked={acik}
                  aria-label={`${o.baslik} olayı`}
                  disabled={islemde}
                  onClick={() => degistir(o.anahtar, !acik, o.baslik)}
                  className="relative h-[26px] w-[46px] flex-none rounded-full transition disabled:opacity-50"
                  style={{ background: acik ? "#1C56F3" : "#D2D7E4" }}
                >
                  <span
                    className="absolute top-[3px] h-[20px] w-[20px] rounded-full bg-white shadow-sm transition-[left] duration-200"
                    style={{ left: acik ? 23 : 3 }}
                  />
                </button>
              ) : (
                /*
                  Tarayıcı olayları için anahtar ÇİZİLMİYOR.

                  Kapatma yolu Pixel ID'yi boşaltmak; buraya bir anahtar
                  konsaydı basıldığında hiçbir şey değişmezdi ve kapalı sanılan
                  bir olay gitmeye devam ederdi — yalan söyleyen bir düğme.
                */
                <span className="flex-none font-mono text-[10px] tracking-[0.08em] text-[#A6ABB8] uppercase">
                  tarayıcıdan
                </span>
              )}
            </div>
          );
        })}
      </section>

      {temaslar.length > 0 && (
        <section className="mt-6 overflow-hidden rounded-2xl border border-ink/10 bg-white">
          <div className="border-b border-ink/8 px-5 py-4 sm:px-6">
            <h2 className="font-heading text-[17px] font-semibold tracking-[-0.02em]">
              Eşleşmemiş WhatsApp tıklamaları
            </h2>
            <p className="mt-[3px] text-[13px] leading-[1.5] text-[#656B7A]">
              Bu kodlar WhatsApp mesajının içinde gidiyor. Kişinin hesabını açarken öğrenci kartındaki
              &quot;Referans kodu&quot; alanına yapıştır — tıklama kimliği ancak böyle kişiye yapışıyor ve
              günler sonra gelen ödeme reklama bağlanabiliyor.
            </p>
          </div>
          {temaslar.map((t) => (
            <div
              key={t.kod}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-ink/7 px-5 py-[11px] last:border-b-0 sm:px-6"
            >
              <code className="flex-none rounded-[7px] bg-mist px-[9px] py-[3px] font-mono text-[13px] font-semibold tracking-[0.08em] text-ink">
                {t.kod}
              </code>
              <span className="text-[13px] text-[#656B7A]">{t.yer || "—"}</span>
              {!t.izin && (
                <span className="rounded-full bg-mist px-[8px] py-[2px] font-mono text-[9px] tracking-[0.1em] text-[#5C6273] uppercase">
                  izin yok
                </span>
              )}
              <span className="ml-auto font-mono text-[11px] text-[#A6ABB8]">
                {anBicimi.format(new Date(t.tarih))}
              </span>
            </div>
          ))}
        </section>
      )}

      <section className="mt-6 overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-ink/8 px-5 py-4 sm:px-6">
          <div className="min-w-0 grow">
            <h2 className="font-heading text-[17px] font-semibold tracking-[-0.02em]">Gönderim günlüğü</h2>
            <p className="mt-[3px] text-[13px] leading-[1.5] text-[#656B7A]">
              Son {gunluk.length} kayıt. 90 günden eskisi gecelik temizlikte siliniyor.
            </p>
          </div>
          {takilanVar && (
            <button
              type="button"
              disabled={islemde}
              onClick={tazele}
              className="h-[38px] flex-none rounded-[10px] border border-ink/13 bg-white px-4 text-[13.5px] font-semibold text-ink transition hover:border-brand hover:text-brand disabled:opacity-50"
            >
              Başarısızları yeniden dene
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-b border-ink/7 px-5 py-3 sm:px-6">
          {["hepsi", ...Object.keys(sayim)].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setSuzgec(d)}
              className={`rounded-full px-[11px] py-[4px] text-[12.5px] font-semibold transition ${
                suzgec === d ? "bg-ink text-white" : "bg-mist text-[#5C6273] hover:text-ink"
              }`}
            >
              {d === "hepsi" ? `Hepsi · ${gunluk.length}` : `${DURUM_ETIKET[d] ?? d} · ${sayim[d]}`}
            </button>
          ))}
        </div>

        {listelenen.length === 0 ? (
          <p className="px-5 py-8 text-center text-[13.5px] text-[#8A90A0] sm:px-6">
            Henüz kayıt yok. Olaylar oluştukça burada görünecek.
          </p>
        ) : (
          listelenen.map((g) => {
            const stil = DURUM_STIL[g.durum] ?? DURUM_STIL.kapali;
            return (
              <div
                key={g.id}
                className="flex flex-wrap items-start gap-x-4 gap-y-1 border-b border-ink/7 px-5 py-[13px] last:border-b-0 sm:px-6"
              >
                <div className="min-w-0 grow basis-[260px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-semibold text-ink">
                      {OLAY_BASLIK[g.olay] ?? g.olay}
                    </span>
                    {g.tutar !== null && (
                      <span className="font-mono text-[12px] text-[#5C6273]">{paraBicimi.format(g.tutar)}</span>
                    )}
                    {g.deneme > 1 && (
                      <span className="font-mono text-[11px] text-[#A6ABB8]">{g.deneme} deneme</span>
                    )}
                  </div>
                  {g.sebep && (
                    <div className="mt-[3px] text-[12.5px] leading-[1.5] break-words text-[#8A6210]">
                      {g.sebep}
                    </div>
                  )}
                </div>
                <span
                  className="flex-none rounded-full px-[9px] py-[3px] text-[11.5px] font-semibold"
                  style={{ background: stil.bg, color: stil.renk }}
                >
                  {DURUM_ETIKET[g.durum] ?? g.durum}
                </span>
                <span className="flex-none font-mono text-[11px] text-[#A6ABB8]">
                  {anBicimi.format(new Date(g.tarih))}
                </span>
              </div>
            );
          })
        )}
      </section>
    </main>
  );
}
