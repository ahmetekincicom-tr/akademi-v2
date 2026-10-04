"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { odemeyeGec, havaleBildir } from "@/app/panel/odemelerim/actions";
import { BankaKutusu } from "@/components/panel/BankaKutusu";
import { Icon } from "@/components/Icon";
import { MenuIkon } from "@/components/YanMenu";
import type { Banka } from "@/lib/odeme";
import { TR_ZAMAN } from "@/lib/zaman";

const paraBicimi = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
});

const tarihBicimi = new Intl.DateTimeFormat("tr-TR", { timeZone: TR_ZAMAN, day: "numeric", month: "long", year: "numeric" });

type Yontem = "kart" | "havale";

const YONTEM_ADI: Record<Yontem, string> = { kart: "Kredi / banka kartı", havale: "Havale / EFT" };

/**
 * Ödeme akışı iki adımda: önce yöntem, sonra o yönteme ait ekran.
 *
 * Öncesinde tek bir "Kartla ödemeye geç" düğmesi vardı; havale bilgileri de
 * bambaşka bir sayfada, ödemeyle ilişkisi kurulmadan duruyordu. Havale ile
 * ödemek isteyen kişi ne yapacağını buradan anlayamıyordu.
 *
 * Adımlar bileşen içi durumda tutuluyor, ayrı adres değil: geri tuşuna basan
 * kişi ödeme akışının ortasına değil, geldiği listeye dönmeli.
 */
export function OdemeSihirbazi({
  id,
  tutar,
  kurs,
  not,
  tarih,
  banka,
  kartAcik,
}: {
  id: string;
  tutar: number;
  kurs: string | null;
  not: string | null;
  tarih: string;
  banka: Banka | null;
  kartAcik: boolean;
}) {
  // Tek seçenek varsa yöntem sorusu anlamsız; doğrudan ikinci adımda başlıyor.
  const tekYontem: Yontem | null = kartAcik && banka ? null : kartAcik ? "kart" : banka ? "havale" : null;

  const [yontem, setYontem] = useState<Yontem | null>(tekYontem);
  const [onay, setOnay] = useState(false);
  const [bildirildi, setBildirildi] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [islemde, basla] = useTransition();

  const adim = yontem ? 2 : 1;
  const ikiAdim = !tekYontem && (kartAcik || banka);

  function sec(y: Yontem | null) {
    setYontem(y);
    setOnay(false);
    setHata(null);
  }

  function kartaGec() {
    setHata(null);
    basla(async () => {
      const { adres, hata: h } = await odemeyeGec(id, onay);
      if (h || !adres) {
        setHata(h ?? "Ödeme başlatılamadı.");
        return;
      }
      // Hedef bu uygulamanın dışında; router.push kullanılmıyor.
      window.location.href = adres;
    });
  }

  function havaleyiBildir() {
    setHata(null);
    basla(async () => {
      const { hata: h } = await havaleBildir(id, onay);
      if (h) {
        setHata(h);
        return;
      }
      setBildirildi(true);
    });
  }

  const program = kurs ?? "Genel";
  const yontemAdi = yontem ? YONTEM_ADI[yontem] : "Seçilmedi";
  const mobilBaslik = !ikiAdim ? "Ödeme" : adim === 1 ? "Adım 1 / 2 · Yöntem" : "Adım 2 / 2 · Ödeme";

  // Telefon bandındaki geri: ikinci adımdan yönteme, yoksa listeye.
  const geri =
    adim === 2 && ikiAdim ? (
      <button type="button" onClick={() => sec(null)} aria-label="Yöntem seçimine dön" className={GERI}>
        <Icon name="arrowLeft" size={18} />
      </button>
    ) : (
      <Link href="/panel/odemelerim" aria-label="Ödemelerime dön" className={GERI}>
        <Icon name="arrowLeft" size={18} />
      </Link>
    );

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6">
      {/* --------------------------------------------- telefon: bant --- */}
      <section className="relative flex flex-col gap-3.5 overflow-hidden rounded-[20px] p-[18px] text-white lg:hidden" style={{ background: BANT }}>
        <Izgara />
        <div className="relative flex items-center gap-3">
          {geri}
          <div className="font-mono text-[10px] tracking-[0.14em] text-[#AFC2FF] uppercase">{mobilBaslik}</div>
        </div>
        <div className="relative font-mono text-[10px] tracking-[0.14em] text-[#AFC2FF] uppercase">Ödenecek tutar</div>
        <div className="relative -mt-1.5 flex items-end gap-3">
          <div className="text-[40px] leading-none font-extrabold tracking-[-0.04em]">{paraBicimi.format(tutar)}</div>
          <div className="ml-auto min-w-0 text-right text-[12.5px] leading-[1.35] text-[#C9D0E0]">
            <div>Eğitim ücreti</div>
            <div className="truncate">{program}</div>
          </div>
        </div>
        {ikiAdim && (
          <div className="relative grid grid-cols-2 gap-1.5">
            <span className="h-[3px] rounded-full bg-[#7FA0FF]" />
            <span className={`h-[3px] rounded-full ${adim === 2 ? "bg-[#7FA0FF]" : "bg-white/15"}`} />
          </div>
        )}
      </section>

      {/* ------------------------------------------------ akış --- */}
      <div className="flex min-w-0 flex-col gap-4 lg:gap-[18px]">
        <div className="hidden flex-col gap-1.5 lg:flex">
          <h1 className="text-[30px] leading-[1.1] font-extrabold tracking-[-0.03em] text-ink">Ödeme</h1>
          <p className="text-[15px] text-[#5B6478]">Tutarı kontrol et, sana uyan ödeme yöntemini seç.</p>
        </div>

        {ikiAdim && (
          <div className="hidden items-center gap-3 rounded-[14px] border border-[#E6E8EF] bg-white px-[18px] py-3.5 lg:flex">
            {adim === 1 ? (
              <AdimNo aktif>1</AdimNo>
            ) : (
              <button
                type="button"
                onClick={() => sec(null)}
                aria-label="Yöntem seçimine dön"
                className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#E3F6EE] text-[#12825A]"
              >
                <Icon name="check" size={13} strokeWidth={2.6} />
              </button>
            )}
            <span className="text-[14px] font-semibold text-ink">Ödeme yöntemi</span>
            {yontem && <span className="rounded-full bg-[#F1F3F8] px-2.5 py-1 text-[12px] text-[#5B6478]">{yontemAdi}</span>}
            <span className="h-0.5 flex-1 overflow-hidden rounded-full bg-[#EEF0F5]">
              {adim === 2 && <span className="block h-full bg-brand" />}
            </span>
            <AdimNo aktif={adim === 2}>2</AdimNo>
            <span className="text-[14px] font-semibold text-ink">Ödeme</span>
          </div>
        )}

        {!kartAcik && !banka && (
          <div className="rounded-[18px] border border-[#E6E8EF] bg-white p-6 text-[14.5px] leading-[1.6] text-[#5C6273]">
            Ödeme yöntemleri henüz tanımlanmadı. Bize yazarsan ödemeni birlikte tamamlayalım.
          </div>
        )}

        {adim === 1 && (kartAcik || banka) && (
          <>
            <h2 className="px-1 pt-1 text-[16px] font-bold text-ink lg:px-0">Nasıl ödemek istersin?</h2>
            <div className="flex flex-col gap-2.5 lg:grid lg:grid-cols-2 lg:gap-3.5">
              {kartAcik && (
                <YontemKarti
                  ikon="card"
                  ton="mavi"
                  baslik="Kredi veya banka kartı"
                  kisaBaslik="Kredi / banka kartı"
                  metin="Anında tamamlanır, kaydın hemen “Ödendi” olur. Taksit seçenekleri kartına göre çıkar."
                  kisaMetin="Kaydın hemen “Ödendi” olur. Taksit seçenekleri kartına göre."
                  rozet={{ metin: "Anında onay", kisa: "Anında", yesil: true }}
                  alt="iyzico · 3D SECURE"
                  onSec={() => sec("kart")}
                />
              )}
              {banka && (
                <YontemKarti
                  ikon="bank"
                  ton="yesil"
                  baslik="Havale / EFT"
                  kisaBaslik="Havale / EFT"
                  metin="Hesap bilgilerini gösterelim, bankandan gönder. Ödemen ulaştığında kaydını işaretliyoruz."
                  kisaMetin="Bankandan gönder, ulaştığında kaydını işaretleriz."
                  rozet={{ metin: "1 iş günü" }}
                  alt={(banka.banka ?? "Banka havalesi").toLocaleUpperCase("tr-TR")}
                  onSec={() => sec("havale")}
                />
              )}
            </div>
            <Link
              href="/panel/odemelerim"
              className="hidden items-center gap-1.5 self-center pt-1 text-[13px] font-semibold text-[#5B6478] hover:text-brand lg:inline-flex"
            >
              <Icon name="arrowLeft" size={14} />
              Ödemelerime dön
            </Link>
          </>
        )}

        {adim === 2 && yontem === "kart" && (
          <div className="flex items-center gap-3.5 rounded-[16px] border border-[#E6E8EF] bg-white p-4 lg:gap-[18px] lg:rounded-[18px] lg:p-[22px]">
            <div className="flex h-[54px] w-[84px] flex-none flex-col justify-between rounded-[10px] bg-[linear-gradient(130deg,#2459FF,#0F1E5C_70%,#070B16)] p-2 text-white lg:h-[94px] lg:w-[150px] lg:rounded-[14px] lg:p-3 lg:shadow-[0_18px_30px_-16px_rgba(36,89,255,.8)]">
              <span className="h-3 w-4 rounded-[3px] bg-[linear-gradient(135deg,#FFE29A,#D9A93F)] lg:h-[18px] lg:w-6 lg:rounded-[4px]" />
              <span className="font-mono text-[8px] tracking-[0.12em] lg:text-[11px]">
                •••• ••••<span className="hidden lg:inline"> ••••</span>
              </span>
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <div className="hidden text-[17px] font-bold text-ink lg:block">Kartla güvenli ödeme</div>
              <p className="text-[12px] leading-[1.45] text-[#5B6478] lg:text-[13px] lg:leading-[1.5]">
                <span className="lg:hidden">iyzico altyapısıyla, 3D Secure. Kart bilgilerin bize ulaşmaz.</span>
                <span className="hidden lg:inline">
                  Ödeme iyzico altyapısıyla alınır. Kart bilgilerin bu sayfaya girilmez ve bize hiçbir zaman ulaşmaz.
                </span>
              </p>
              <div className="mt-1 hidden gap-1.5 lg:flex">
                <span className="rounded-full bg-[#E3F6EE] px-2 py-[3px] font-mono text-[10px] text-[#12825A]">3D SECURE</span>
                <span className="rounded-full bg-[#EEF2FF] px-2 py-[3px] font-mono text-[10px] text-[#1A44CC]">TAKSİT</span>
              </div>
            </div>
          </div>
        )}

        {adim === 2 && yontem === "havale" && banka && <BankaKutusu banka={banka} />}

        {/*
          Sözleşme onayı iki yöntem için de ortak.

          Önceden yalnızca kart adımında vardı; havale ile ödeyen kişi aynı satın
          almayı hiçbir sözleşmeyi kabul etmeden yapıyordu. Aynı işi kapsayan
          sözleşme, ödeme aracına göre değişmez.

          Onay ayrıca zaman damgasıyla kaydediliyor (riza_kayitlari): hangi
          metnin hangi sürümünün ne zaman kabul edildiği ispat edilebilir olsun.
        */}
        {adim === 2 && (yontem === "kart" || (yontem === "havale" && banka)) && !bildirildi && (
          <>
            <label className="flex cursor-pointer items-start gap-3 rounded-[14px] border border-[#E6E8EF] bg-white p-3.5 lg:items-center lg:gap-3.5 lg:px-[18px] lg:py-4">
              <input type="checkbox" checked={onay} onChange={(e) => setOnay(e.target.checked)} className="peer sr-only" />
              <span
                aria-hidden
                className={`flex h-6 w-6 flex-none items-center justify-center rounded-[7px] peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40 lg:h-[22px] lg:w-[22px] ${
                  onay ? "bg-brand text-white" : "border-[1.5px] border-[#C9CFDC] bg-white"
                }`}
              >
                {onay && <Icon name="check" size={13} strokeWidth={3} />}
              </span>
              <span className="text-[13px] leading-[1.45] text-ink lg:text-[14px] lg:leading-[1.5]">
                <Link href="/satis-sozlesmesi" target="_blank" className="font-semibold text-brand hover:underline">
                  Mesafeli satış sözleşmesini
                </Link>{" "}
                ve{" "}
                <Link href="/iptal-iade-politikasi" target="_blank" className="font-semibold text-brand hover:underline">
                  iptal ve iade politikasını
                </Link>{" "}
                <span className="hidden lg:inline">okudum, </span>onaylıyorum.
              </span>
            </label>

            {hata && (
              <div role="alert" className="rounded-[12px] border border-[#E5484D]/30 bg-[#FDF0F0] px-4 py-3 text-[13.5px] text-[#8E2226]">
                {hata}
              </div>
            )}

            <button
              type="button"
              onClick={yontem === "kart" ? kartaGec : havaleyiBildir}
              disabled={!onay || islemde}
              className="flex h-[52px] w-full items-center justify-center gap-2.5 rounded-[14px] bg-brand text-[15px] font-extrabold text-white shadow-[0_16px_30px_-14px_rgba(36,89,255,.8)] transition hover:bg-[#1A44CC] disabled:cursor-not-allowed disabled:bg-[#E3E6EE] disabled:font-bold disabled:text-[#8A92A6] disabled:shadow-none lg:h-[54px]"
            >
              <span className="hidden lg:inline-flex">
                <Icon name={yontem === "kart" ? "shield" : "check"} size={16} strokeWidth={2.2} />
              </span>
              {islemde
                ? yontem === "kart"
                  ? "Ödeme sayfası açılıyor…"
                  : "Gönderiliyor…"
                : yontem === "kart"
                  ? "Güvenli ödemeye geç"
                  : "Ödemeyi yaptım, bildir"}
            </button>
            {!onay ? (
              <p className="-mt-1.5 hidden text-center text-[12px] text-[#8A92A6] lg:block">Devam etmek için sözleşmeyi onayla</p>
            ) : (
              yontem === "havale" && (
                <p className="-mt-1.5 text-center text-[12px] leading-[1.5] text-[#8A92A6]">
                  Bu düğme ödemeyi tamamlamaz; yalnızca bize haber verir.
                </p>
              )
            )}
          </>
        )}

        {adim === 2 && yontem === "havale" && bildirildi && (
          <div className="flex items-start gap-[11px] rounded-[14px] border border-[#1C9A5F]/30 bg-[#EFF9F3] px-5 py-4">
            <span className="mt-[2px] flex-none text-[#127048]">
              <Icon name="check" size={17} strokeWidth={2.6} />
            </span>
            <span className="text-[13.5px] leading-[1.6] text-[#0F5B3B]">
              Bildirimin bize ulaştı. Tutar hesaba geçtiğinde kaydını “Ödendi” olarak işaretleyeceğiz.
            </span>
          </div>
        )}

        {adim === 2 && (
          <div className="flex justify-center gap-6 text-[13px] font-semibold">
            {ikiAdim && !bildirildi && (
              <button type="button" onClick={() => sec(null)} className="hidden items-center gap-1.5 text-[#5B6478] hover:text-brand lg:inline-flex">
                <Icon name="arrowLeft" size={14} />
                Yöntemi değiştir
              </button>
            )}
            <Link href="/panel/odemelerim" className={`text-[#5B6478] hover:text-brand ${bildirildi ? "" : "hidden lg:block"}`}>
              Ödemelerime dön
            </Link>
          </div>
        )}
      </div>

      {/* ---------------------------------- masaüstü: özet kartı --- */}
      <aside className="relative hidden flex-col gap-[18px] overflow-hidden rounded-[20px] p-6 text-white lg:flex" style={{ background: BANT }}>
        <Izgara />
        <div className="relative font-mono text-[10px] tracking-[0.16em] text-[#AFC2FF] uppercase">Ödenecek tutar</div>
        <div className="relative text-[64px] leading-none font-extrabold tracking-[-0.04em]">{paraBicimi.format(tutar)}</div>
        <dl className="relative flex flex-col border-t border-white/12 text-[13px]">
          <OzetSatir etiket="Kalem" deger="Eğitim ücreti" />
          <OzetSatir etiket="Program" deger={program} />
          <OzetSatir etiket="Oluşturulma" deger={tarihBicimi.format(new Date(tarih))} />
          <OzetSatir etiket="Yöntem" deger={yontemAdi} son={!not} />
          {not && <OzetSatir etiket="Not" deger={not} son />}
        </dl>
        <div className="relative flex items-center gap-2.5 rounded-[12px] border border-white/10 bg-[#070B16]/50 p-3 text-[12px] leading-[1.45] text-[#C9D0E0]">
          <span className="flex-none text-[#3DDC97]">
            <Icon name="shield" size={18} />
          </span>
          Sorun yaşarsan destek ekibimiz aynı gün dönüş yapar.
        </div>
      </aside>
    </div>
  );
}

const BANT = "linear-gradient(150deg,#1A3FCC 0%,#0F1E5C 40%,#070B16 100%)";
const GERI = "flex h-11 w-11 flex-none items-center justify-center rounded-[12px] bg-white/10 text-white";

function Izgara() {
  return (
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px)",
        backgroundSize: "24px 24px",
        maskImage: "linear-gradient(160deg,#000 10%,transparent 80%)",
        WebkitMaskImage: "linear-gradient(160deg,#000 10%,transparent 80%)",
      }}
    />
  );
}

function AdimNo({ aktif, children }: { aktif: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`flex h-7 w-7 flex-none items-center justify-center rounded-full font-mono text-[12px] font-semibold ${
        aktif ? "bg-brand text-white shadow-[0_0_0_4px_rgba(36,89,255,.15)]" : "border-[1.5px] border-[#D5DAE5] text-[#8A92A6]"
      }`}
    >
      {children}
    </span>
  );
}

function OzetSatir({ etiket, deger, son = false }: { etiket: string; deger: string; son?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 py-3 ${son ? "" : "border-b border-white/8"}`}>
      <dt className="flex-none text-[#AFC2FF]">{etiket}</dt>
      <dd className="min-w-0 text-right font-semibold">{deger}</dd>
    </div>
  );
}

function YontemKarti({
  ikon,
  ton,
  baslik,
  kisaBaslik,
  metin,
  kisaMetin,
  rozet,
  alt,
  onSec,
}: {
  ikon: "card" | "bank";
  ton: "mavi" | "yesil";
  baslik: string;
  kisaBaslik: string;
  metin: string;
  kisaMetin: string;
  rozet: { metin: string; kisa?: string; yesil?: boolean };
  alt: string;
  onSec: () => void;
}) {
  const t =
    ton === "mavi"
      ? { arka: "bg-[oklch(0.6_0.2_265)]", kenar: "border-[oklch(0.88_0.06_265)]", renk: "text-[oklch(0.5_0.21_265)]", golge: "shadow-[5px_5px_0_-1px_oklch(0.85_0.07_265)]", zemin: "bg-[linear-gradient(150deg,#fff,#F4F6FC)]" }
      : { arka: "bg-[oklch(0.62_0.15_170)]", kenar: "border-[oklch(0.88_0.06_170)]", renk: "text-[oklch(0.48_0.13_170)]", golge: "shadow-[5px_5px_0_-1px_oklch(0.85_0.07_170)]", zemin: "bg-[linear-gradient(150deg,#fff,#F4FBF8)]" };
  const rozetRenk = rozet.yesil ? "bg-[#E3F6EE] text-[#12825A]" : "bg-[#F1F3F8] text-[#5B6478]";

  return (
    <button
      type="button"
      onClick={onSec}
      className="group relative flex gap-3.5 overflow-hidden rounded-[16px] border border-[#E6E8EF] bg-white p-4 text-left transition hover:border-brand hover:shadow-[0_18px_40px_-24px_rgba(36,89,255,.5)] lg:flex-col lg:gap-3.5 lg:rounded-[18px] lg:p-[22px]"
    >
      <span
        aria-hidden
        className="absolute inset-0 hidden lg:block"
        style={{
          backgroundImage: "linear-gradient(#ECEEF3 1px,transparent 1px),linear-gradient(90deg,#ECEEF3 1px,transparent 1px)",
          backgroundSize: "14px 14px",
          maskImage: "radial-gradient(circle at 20% 20%,#000,transparent 55%)",
          WebkitMaskImage: "radial-gradient(circle at 20% 20%,#000,transparent 55%)",
        }}
      />
      {/* Telefon: düz ikon kutusu */}
      <span className={`flex h-12 w-12 flex-none items-center justify-center rounded-[13px] border lg:hidden ${t.kenar} ${t.renk} ${t.golge} ${t.zemin}`}>
        <MenuIkon ikon={ikon} boyut={18} kalinlik={2} />
      </span>
      {/* Masaüstü: döndürülmüş arka plakalı ikon + rozet */}
      <span className="relative hidden items-start lg:flex">
        <span className="relative h-14 w-14">
          <span className={`absolute top-[9px] left-[9px] h-[47px] w-[47px] rotate-[10deg] rounded-[15px] opacity-35 ${t.arka}`} />
          <span className={`absolute inset-[0_9px_9px_0] flex items-center justify-center rounded-[15px] border bg-[linear-gradient(150deg,#fff,rgba(255,255,255,.7))] ${t.kenar} ${t.renk}`}>
            <MenuIkon ikon={ikon} boyut={20} kalinlik={2} />
          </span>
        </span>
        <span className={`ml-auto rounded-full px-2 py-1 font-mono text-[10px] tracking-[0.1em] uppercase ${rozetRenk}`}>{rozet.metin}</span>
      </span>

      <span className="relative flex min-w-0 flex-col gap-1 lg:gap-1.5">
        <span className="flex items-center gap-2">
          <span className="text-[15px] font-bold text-ink lg:hidden">{kisaBaslik}</span>
          <span className="hidden text-[17px] font-bold text-ink lg:inline">{baslik}</span>
          {rozet.kisa && (
            <span className={`rounded-full px-1.5 py-0.5 font-mono text-[9px] uppercase lg:hidden ${rozetRenk}`}>{rozet.kisa}</span>
          )}
        </span>
        <span className="text-[12px] leading-[1.45] text-[#5B6478] lg:hidden">{kisaMetin}</span>
        <span className="hidden text-[13px] leading-[1.5] text-[#5B6478] lg:inline">{metin}</span>
      </span>

      <span className="relative mt-auto hidden items-center gap-2 border-t border-[#F1F3F7] pt-3 lg:flex">
        <span className="truncate font-mono text-[10px] tracking-[0.1em] text-[#8A92A6]">{alt}</span>
        <span className="ml-auto flex-none text-[13px] font-bold text-brand">Seç</span>
      </span>
    </button>
  );
}
