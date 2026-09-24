"use client";

import { useEffect, useState, useTransition } from "react";
import { ilanKaydetDegistir, ilanOlayi } from "@/app/panel/firsatlar/actions";
import { basvuruHedefi, type Ilan } from "@/lib/firsat";
import { useBildirim } from "@/components/Bildirim";
import { Icon } from "@/components/Icon";

/**
 * Kaydet: iyimser — düğme hemen döner, sunucu reddederse geri alınıp hata
 * gösteriliyor. `onDegisti` listeye haber veriyor (Kaydedilenler sekmesi).
 */
export function KaydetDugmesi({
  ilanId,
  kayitli,
  onDegisti,
  genis,
}: {
  ilanId: string;
  kayitli: boolean;
  onDegisti?: (kayitli: boolean) => void;
  genis?: boolean;
}) {
  const bildir = useBildirim();
  const [durum, setDurum] = useState(kayitli);
  const [onceki, setOnceki] = useState(kayitli);
  const [islemde, startTransition] = useTransition();

  // Sunucudan yeni değer gelirse (sayfa tazelendi) onu esas al.
  if (kayitli !== onceki) {
    setOnceki(kayitli);
    setDurum(kayitli);
  }

  const degistir = () => {
    const yeni = !durum;
    setDurum(yeni);
    onDegisti?.(yeni);
    startTransition(async () => {
      const r = await ilanKaydetDegistir(ilanId, yeni);
      if (r.error) {
        setDurum(!yeni);
        onDegisti?.(!yeni);
        bildir.hata(r.error);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={degistir}
      disabled={islemde}
      aria-pressed={durum}
      aria-label={durum ? "Kaydedilenlerden çıkar" : "İlanı kaydet"}
      className={`inline-flex flex-none items-center justify-center gap-[7px] rounded-[10px] border text-[13.5px] font-semibold transition disabled:opacity-60 ${
        genis ? "h-11 px-4" : "h-10 w-10"
      } ${
        durum
          ? "border-brand/30 bg-brand/8 text-brand hover:bg-brand/12"
          : "border-ink/13 bg-white text-[#3A3F4F] hover:border-brand hover:text-brand"
      }`}
    >
      <Icon name={durum ? "bookmarkDolu" : "bookmark"} size={16} />
      {genis && (durum ? "Kaydedildi" : "Kaydet")}
    </button>
  );
}

/**
 * Başvur: dış bağlantı ya da e-posta. Tıklama "başvuru tıklaması" olarak
 * sayılıyor — başvurunun gerçekten yapıldığını bilmiyoruz. Süresi dolmuş
 * ilanda düğme kapalı ve bağlantı hiç çizilmiyor.
 */
export function BasvurDugmesi({
  ilan,
  kapali,
  tamGenislik,
}: {
  ilan: Pick<Ilan, "id" | "basvuruTipi" | "basvuruAdresi" | "pozisyon">;
  kapali: boolean;
  tamGenislik?: boolean;
}) {
  if (kapali) {
    return (
      <span
        aria-disabled
        className={`inline-flex h-11 cursor-not-allowed items-center justify-center gap-2 rounded-[10px] bg-ink/7 px-5 text-[14px] font-semibold text-[#8A90A0] ${
          tamGenislik ? "w-full" : ""
        }`}
      >
        İlan süresi doldu
      </span>
    );
  }
  const eposta = ilan.basvuruTipi === "eposta";
  return (
    <a
      href={basvuruHedefi(ilan)}
      target={eposta ? undefined : "_blank"}
      rel={eposta ? undefined : "noopener noreferrer"}
      onClick={() => void ilanOlayi(ilan.id, "basvuru_tiklama")}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-brand px-5 text-[14px] font-semibold text-white transition hover:bg-ink ${
        tamGenislik ? "w-full" : ""
      }`}
    >
      {eposta ? <Icon name="mail" size={15} /> : <Icon name="external" size={15} />}
      {eposta ? "E-postayla başvur" : "Başvur"}
    </a>
  );
}

/** Detay sayfası açıldığında bir kez görüntülenme yazar (günde kişi başı bir). */
export function GoruntulenmeKaydi({ ilanId }: { ilanId: string }) {
  useEffect(() => {
    void ilanOlayi(ilanId, "goruntulenme");
  }, [ilanId]);
  return null;
}
