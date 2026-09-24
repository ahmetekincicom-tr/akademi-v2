"use client";

import { useCallback, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { optimizeGorsel, GorselHatasi, boyutMetni } from "@/lib/gorsel-optimize";
import { EK_KOVA, EK_MAKS_ADET, ekDosyaAdi, ekGorselMi, ekOnKontrol, type DestekEk } from "@/lib/destek-ek";
import type { DestekMesajEki } from "@/lib/destek";
import { Icon } from "@/components/Icon";

/**
 * Destek mesajı ekleri — yükleme kancası + gösterim.
 *
 * Akış: dosya seçilir / yapıştırılır → görselse tarayıcıda küçültülüp WebP'ye
 * çevrilir (gorsel-optimize, admin editörüyle aynı) → kişinin kendi depo
 * klasörüne (<uid>/…) yüklenir → mesaj gönderilirken yalnız {yol, ad, tip,
 * boyut} server action'a gider, orada yeniden doğrulanır. Gönderilmeden
 * kaldırılan ek depodan da siliniyor.
 */

type Bekleyen = { anahtar: string; ad: string; durum: "yukleniyor" | "hazir"; ek?: DestekEk; onizleme?: string };

export function useEkYukleme(benimId: string, onHata: (mesaj: string) => void) {
  const [liste, setListe] = useState<Bekleyen[]>([]);
  const sayac = useRef(0);

  const ekle = useCallback(
    async (dosyalar: FileList | File[]) => {
      const secilen = Array.from(dosyalar);
      if (!secilen.length) return;
      const bos = EK_MAKS_ADET - liste.length;
      if (bos <= 0) return onHata(`En fazla ${EK_MAKS_ADET} dosya eklenebilir.`);
      if (secilen.length > bos) onHata(`En fazla ${EK_MAKS_ADET} dosya eklenebilir; ilk ${bos} dosya alındı.`);

      const supabase = createClient();
      await Promise.all(
        secilen.slice(0, bos).map(async (dosya) => {
          const anahtar = `ek-${++sayac.current}`;
          setListe((l) => [...l, { anahtar, ad: dosya.name || "ekran-goruntusu.png", durum: "yukleniyor" }]);
          const dus = (mesaj: string) => {
            setListe((l) => l.filter((b) => b.anahtar !== anahtar));
            onHata(mesaj);
          };

          const onHataMetni = ekOnKontrol({ type: dosya.type, size: dosya.type.startsWith("image/") ? 0 : dosya.size });
          if (onHataMetni) return dus(onHataMetni);

          let blob: Blob = dosya;
          let tip = dosya.type;
          let ad = dosya.name || "ekran-goruntusu.png";
          if (ekGorselMi(tip)) {
            try {
              const s = await optimizeGorsel(dosya);
              blob = s.blob;
              tip = s.mime;
              ad = ad.replace(/\.[^.]+$/, "") + "." + s.uzanti;
            } catch (e) {
              return dus(e instanceof GorselHatasi ? e.message : "Görsel işlenemedi.");
            }
          }
          const sonKontrol = ekOnKontrol({ type: tip, size: blob.size });
          if (sonKontrol) return dus(sonKontrol);

          const yol = `${benimId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${ekDosyaAdi(ad)}`;
          const { error } = await supabase.storage.from(EK_KOVA).upload(yol, blob, { contentType: tip, upsert: false });
          if (error) return dus("Dosya yüklenemedi. Bağlantını kontrol edip tekrar dene.");

          const onizleme = ekGorselMi(tip) ? URL.createObjectURL(blob) : undefined;
          setListe((l) =>
            l.map((b) =>
              b.anahtar === anahtar ? { ...b, ad, durum: "hazir", onizleme, ek: { yol, ad, tip, boyut: blob.size } } : b,
            ),
          );
        }),
      );
    },
    [benimId, liste.length, onHata],
  );

  const kaldir = useCallback((anahtar: string) => {
    setListe((l) => {
      const b = l.find((x) => x.anahtar === anahtar);
      if (b?.onizleme) URL.revokeObjectURL(b.onizleme);
      // Gönderilmemiş dosya depoda sahipsiz kalmasın (başarısızlık önemsiz).
      if (b?.ek) void createClient().storage.from(EK_KOVA).remove([b.ek.yol]);
      return l.filter((x) => x.anahtar !== anahtar);
    });
  }, []);

  /** Mesaj gönderildikten sonra: dosyalar artık mesaja ait, silinmiyor. */
  const temizle = useCallback(() => {
    setListe((l) => {
      l.forEach((b) => b.onizleme && URL.revokeObjectURL(b.onizleme));
      return [];
    });
  }, []);

  return {
    liste,
    ekle,
    kaldir,
    temizle,
    hazirEkler: liste.flatMap((b) => (b.ek ? [b.ek] : [])),
    yukleniyor: liste.some((b) => b.durum === "yukleniyor"),
    dolu: liste.length >= EK_MAKS_ADET,
  };
}

/** Yazma alanının altındaki bekleyen ekler. */
export function BekleyenEkler({ liste, onKaldir }: { liste: Bekleyen[]; onKaldir: (anahtar: string) => void }) {
  if (!liste.length) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Eklenecek dosyalar">
      {liste.map((b) => (
        <li
          key={b.anahtar}
          className="flex h-[42px] max-w-[220px] items-center gap-2 rounded-[9px] border border-ink/12 bg-white py-1 pr-1 pl-1.5 text-[12.5px] text-ink"
        >
          {b.onizleme ? (
            // eslint-disable-next-line @next/next/no-img-element -- yerel blob önizlemesi; next/image blob: adresini işlemiyor
            <img src={b.onizleme} alt="" className="h-8 w-8 flex-none rounded-[6px] object-cover" />
          ) : (
            <span className="grid h-8 w-8 flex-none place-items-center rounded-[6px] bg-mist text-[#5C6273]">
              <Icon name="file" size={15} />
            </span>
          )}
          <span className="min-w-0 flex-1 truncate">{b.durum === "yukleniyor" ? "Yükleniyor…" : b.ad}</span>
          <button
            type="button"
            onClick={() => onKaldir(b.anahtar)}
            disabled={b.durum === "yukleniyor"}
            aria-label={`${b.ad} ekini kaldır`}
            className="grid h-8 w-8 flex-none place-items-center rounded-[7px] text-[#8A90A0] transition hover:bg-mist hover:text-ink disabled:opacity-40"
          >
            <Icon name="x" size={13} />
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Mesaj balonundaki ekler: görsel küçük resim, PDF dosya satırı. Yeni sekmede açılır. */
export function MesajEkleri({ ekler, koyu }: { ekler: DestekMesajEki[]; koyu?: boolean }) {
  if (!ekler.length) return null;
  const gorseller = ekler.filter((e) => ekGorselMi(e.tip));
  const dosyalar = ekler.filter((e) => !ekGorselMi(e.tip));
  return (
    <div className="mt-2 flex flex-col gap-2">
      {gorseller.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {gorseller.map((e) => (
            <a
              key={e.url}
              href={e.url}
              target="_blank"
              rel="noopener"
              className="block overflow-hidden rounded-[10px] border border-ink/10 bg-white"
              title={e.ad}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- yetki kontrollü kendi ucumuz; optimizer'dan geçmemeli (özel dosya) */}
              <img src={e.url} alt={e.ad} loading="lazy" className="block h-[120px] w-auto max-w-[220px] object-cover" />
            </a>
          ))}
        </div>
      )}
      {dosyalar.map((e) => (
        <a
          key={e.url}
          href={e.url}
          target="_blank"
          rel="noopener"
          className={`flex items-center gap-2 rounded-[9px] border px-2.5 py-2 text-[12.5px] transition ${
            koyu ? "border-white/25 bg-white/10 text-white hover:bg-white/20" : "border-ink/12 bg-white text-ink hover:border-brand"
          }`}
        >
          <Icon name="file" size={15} />
          <span className="min-w-0 flex-1 truncate">{e.ad}</span>
          <span className={`flex-none font-mono text-[10px] ${koyu ? "text-white/70" : "text-[#8A90A0]"}`}>
            {boyutMetni(e.boyut)}
          </span>
        </a>
      ))}
    </div>
  );
}
