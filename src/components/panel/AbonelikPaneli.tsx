"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { IyzicoFormu } from "@/components/panel/IyzicoFormu";
import { aboneOl, aboneligiIptalEt, kartiGuncelle } from "@/app/panel/abonelik/actions";

export type AbonelikPaneliDurumu = {
  durum: "aktif" | "odeme_alinamadi" | "iptal" | "sona_erdi";
  kaynak: "iyzico" | "yonetici";
  erisimAcik: boolean;
  /** Biçimlenmiş tarihler ("21 Kasım 2026"). */
  erisimBitis: string | null;
  donemBitis: string | null;
  tutar: string | null;
  surduruluyor: boolean;
  sonHata: string | null;
} | null;

const KART = "rounded-2xl border border-ink/10 bg-white p-5 sm:p-6";

/**
 * Video aboneliği ekranı.
 *
 * Tek ekranda üç iş: abone olmak, süren aboneliği yönetmek (kart, iptal) ve
 * iyzico'nun formunu göstermek. Form açıldığında geri kalan her şey çekiliyor;
 * kişinin önünde aynı anda hem "abone ol" düğmesi hem kart formu durmasın.
 */
export function AbonelikPaneli({
  abonelik,
  fiyat,
  kayitli,
  testModu,
}: {
  abonelik: AbonelikPaneliDurumu;
  /** Biçimlenmiş aylık ücret; plan tanımlı değilse null. */
  fiyat: string | null;
  /** En az bir eğitime kayıtlı mı (abonelik ancak o zaman bir şey açıyor). */
  kayitli: boolean;
  testModu: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<string | null>(null);
  const [onay, setOnay] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [iptalSor, setIptalSor] = useState(false);
  const [islemde, startTransition] = useTransition();

  const calistir = (is: () => Promise<{ form?: string; hata?: string; tamam?: boolean }>) => {
    setHata(null);
    startTransition(async () => {
      const r = await is();
      if (r.hata) setHata(r.hata);
      else if (r.form) setForm(r.form);
      else {
        setIptalSor(false);
        router.refresh();
      }
    });
  };

  if (form) {
    return (
      <div className="flex flex-col gap-3">
        <IyzicoFormu icerik={form} />
        <button
          type="button"
          onClick={() => setForm(null)}
          className="self-start text-[13px] font-semibold text-[#5B6478] hover:text-ink"
        >
          ← Vazgeç
        </button>
      </div>
    );
  }

  const suruyor = abonelik?.surduruluyor ?? false;

  return (
    <div className="flex flex-col gap-4">
      {testModu && (
        <div className="rounded-[12px] border border-[#F0C36D]/50 bg-[#FFF8E6] px-4 py-3 text-[13px] text-[#7A5200]">
          <strong>Test modu.</strong> Bu ekranı yalnızca yöneticiler görüyor ve ödemeler iyzico&apos;nun test ortamına
          gidiyor; gerçek karttan para çekilmiyor.
        </div>
      )}

      {abonelik?.durum === "odeme_alinamadi" && (
        <div role="alert" className="rounded-[12px] border border-[#E5484D]/30 bg-[#FDF0F0] px-4 py-3 text-[13.5px] text-[#8E2226]">
          Bu ayın ödemesi kartından alınamadı{abonelik.sonHata ? ` (${abonelik.sonHata})` : ""}. Derslerin{" "}
          {abonelik.erisimBitis} tarihine kadar açık; kartını güncellersen ödeme yeniden denenir.
        </div>
      )}

      {abonelik && <DurumKarti a={abonelik} />}


      {suruyor ? (
        <div className={`${KART} flex flex-col gap-3`}>
          <h2 className="font-heading text-[17px] font-semibold tracking-[-0.02em]">Aboneliği yönet</h2>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              disabled={islemde}
              onClick={() => calistir(kartiGuncelle)}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-[11px] px-4 text-[14px] font-semibold transition disabled:opacity-60 ${
                abonelik?.durum === "odeme_alinamadi" ? "bg-brand text-white hover:bg-ink" : "border border-ink/13 text-ink hover:border-brand hover:text-brand"
              }`}
            >
              <Icon name="card" size={15} />
              Kartımı güncelle
            </button>
            {!iptalSor ? (
              <button
                type="button"
                disabled={islemde}
                onClick={() => setIptalSor(true)}
                className="inline-flex h-11 items-center justify-center rounded-[11px] px-4 text-[14px] font-semibold text-[#8E2226] hover:bg-[#FDF0F0] disabled:opacity-60"
              >
                Aboneliği iptal et
              </button>
            ) : null}
          </div>

          {iptalSor && (
            <div className="rounded-[12px] border border-ink/10 bg-mist/60 p-4 text-[13.5px] leading-[1.55] text-ink">
              Kartından yeni bir ödeme çekilmeyecek. Derslerin ödediğin dönemin sonuna,{" "}
              <strong>{abonelik?.donemBitis ?? abonelik?.erisimBitis}</strong> tarihine kadar açık kalır.
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={islemde}
                  onClick={() => calistir(aboneligiIptalEt)}
                  className="inline-flex h-10 items-center rounded-[10px] bg-[#B4232A] px-4 text-[13.5px] font-semibold text-white hover:bg-[#8E2226] disabled:opacity-60"
                >
                  {islemde ? "İptal ediliyor…" : "Evet, iptal et"}
                </button>
                <button
                  type="button"
                  onClick={() => setIptalSor(false)}
                  className="inline-flex h-10 items-center rounded-[10px] px-4 text-[13.5px] font-semibold text-[#5B6478] hover:text-ink"
                >
                  Vazgeç
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={`${KART} flex flex-col gap-4`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-heading text-[19px] font-semibold tracking-[-0.02em]">
              {abonelik ? "Yeniden abone ol" : "Video aboneliği"}
            </h2>
            {fiyat && (
              <div className="font-heading text-[22px] font-bold tracking-[-0.02em] text-ink">
                {fiyat}
                <span className="ml-1 text-[13px] font-medium text-[#5B6478]">/ ay</span>
              </div>
            )}
          </div>

          <ul className="flex flex-col gap-2 text-[14px] leading-[1.5] text-[#2B303D]">
            <Madde>Kayıtlı olduğun eğitimlerin bütün ders videoları</Madde>
            <Madde>Her ay aynı karttan otomatik yenilenir; istediğin zaman buradan iptal edersin</Madde>
            <Madde>Birebir seanslarının kayıtları abonelikten bağımsız, ücretsiz kalır</Madde>
          </ul>

          {abonelik?.erisimAcik && (
            <p className="rounded-[12px] bg-mist/70 px-4 py-3 text-[13px] text-[#5B6478]">
              Derslerin {abonelik.erisimBitis} tarihine kadar zaten açık. Şimdi abone olursan yeni abonelik bugünden
              başlar ve ilk ay bugün çekilir.
            </p>
          )}

          {!kayitli ? (
            <p className="rounded-[12px] bg-mist/70 px-4 py-3 text-[13.5px] text-[#5B6478]">
              Abonelik, kayıtlı olduğun eğitimlerin videolarını açar. Henüz bir eğitim kaydın görünmüyor; kaydın
              tamamlandığında buradan abone olabilirsin.
            </p>
          ) : !fiyat ? (
            <p className="rounded-[12px] bg-mist/70 px-4 py-3 text-[13.5px] text-[#5B6478]">
              Abonelik çok yakında açılacak.
            </p>
          ) : (
            <>
              <label className="flex cursor-pointer items-start gap-3 rounded-[14px] border border-[#E6E8EF] bg-white p-3.5">
                <input type="checkbox" checked={onay} onChange={(e) => setOnay(e.target.checked)} className="peer sr-only" />
                <span
                  aria-hidden
                  className={`flex h-6 w-6 flex-none items-center justify-center rounded-[7px] peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40 ${
                    onay ? "bg-brand text-white" : "border-[1.5px] border-[#C9CFDC] bg-white"
                  }`}
                >
                  {onay && <Icon name="check" size={13} strokeWidth={3} />}
                </span>
                <span className="text-[13px] leading-[1.5] text-ink">
                  Aboneliğin her ay {fiyat} olarak otomatik yenileneceğini biliyorum.{" "}
                  <Link href="/satis-sozlesmesi" target="_blank" className="font-semibold text-brand hover:underline">
                    Mesafeli satış sözleşmesini
                  </Link>{" "}
                  ve{" "}
                  <Link href="/iptal-iade-politikasi" target="_blank" className="font-semibold text-brand hover:underline">
                    iptal ve iade politikasını
                  </Link>{" "}
                  onaylıyorum.
                </span>
              </label>

              <button
                type="button"
                disabled={!onay || islemde}
                onClick={() => calistir(() => aboneOl(onay))}
                className="flex h-[52px] w-full items-center justify-center gap-2.5 rounded-[14px] bg-brand text-[15px] font-extrabold text-white shadow-[0_16px_30px_-14px_rgba(36,89,255,.8)] transition hover:bg-[#1A44CC] disabled:cursor-not-allowed disabled:bg-[#E3E6EE] disabled:font-bold disabled:text-[#8A92A6] disabled:shadow-none"
              >
                <Icon name="shield" size={16} strokeWidth={2.2} />
                {islemde ? "Ödeme formu açılıyor…" : "Abone ol"}
              </button>
            </>
          )}
        </div>
      )}

      {hata && (
        <div role="alert" className="rounded-[12px] border border-[#E5484D]/30 bg-[#FDF0F0] px-4 py-3 text-[13.5px] text-[#8E2226]">
          {hata}
        </div>
      )}
    </div>
  );
}

function Madde({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-[3px] flex h-[18px] w-[18px] flex-none items-center justify-center rounded-[6px] bg-brand/12 text-brand">
        <Icon name="check" size={11} strokeWidth={3} />
      </span>
      <span>{children}</span>
    </li>
  );
}

const DURUM_RENK: Record<NonNullable<AbonelikPaneliDurumu>["durum"], { etiket: string; renk: string; zemin: string }> = {
  aktif: { etiket: "Aktif", renk: "#12825A", zemin: "#E3F6EE" },
  odeme_alinamadi: { etiket: "Ödeme alınamadı", renk: "#B4232A", zemin: "#FDF0F0" },
  iptal: { etiket: "İptal edildi", renk: "#7A5200", zemin: "#FFF4D6" },
  sona_erdi: { etiket: "Sona erdi", renk: "#5B6478", zemin: "#F2F4FA" },
};

function DurumKarti({ a }: { a: NonNullable<AbonelikPaneliDurumu> }) {
  const d = DURUM_RENK[a.durum];
  return (
    <div className={`${KART} flex flex-col gap-4`}>
      <div className="flex items-center gap-3">
        <h2 className="font-heading text-[17px] font-semibold tracking-[-0.02em]">Aboneliğin</h2>
        <span className="rounded-full px-2.5 py-1 font-mono text-[10.5px] tracking-[0.08em] uppercase" style={{ color: d.renk, background: d.zemin }}>
          {a.kaynak === "yonetici" ? "Tanımlı süre" : d.etiket}
        </span>
      </div>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {a.tutar && a.kaynak === "iyzico" && <Bilgi etiket="Aylık ücret" deger={a.tutar} />}
        {/* Reddedilmiş yenilemede "sonraki yenileme" tarihi zaten geçmiş bir
            çekim; göstermek kişiyi yanıltır. */}
        {a.durum === "aktif" && a.surduruluyor && a.donemBitis && <Bilgi etiket="Sonraki yenileme" deger={a.donemBitis} />}
        <Bilgi
          etiket={a.erisimAcik ? "Dersler açık" : "Dersler kapandı"}
          deger={a.erisimBitis ? (a.erisimAcik ? `${a.erisimBitis} tarihine kadar` : a.erisimBitis) : "—"}
        />
      </dl>
      {a.erisimAcik && (
        <Link
          href="/panel/dersler"
          className="self-start rounded-[10px] bg-brand px-4 py-2.5 text-[13.5px] font-semibold text-white transition hover:bg-ink"
        >
          Derslerime git →
        </Link>
      )}
    </div>
  );
}

function Bilgi({ etiket, deger }: { etiket: string; deger: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-[12px] bg-mist/60 px-3.5 py-3">
      <dt className="font-mono text-[10px] tracking-[0.12em] text-[#8A92A6] uppercase">{etiket}</dt>
      <dd className="text-[14.5px] font-semibold text-ink">{deger}</dd>
    </div>
  );
}
