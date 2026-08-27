"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { egitmenGorseliGuncelle } from "@/app/kontrol-9f4x2k/(protected)/site-icerik/actions";
import { useBildirim } from "@/components/Bildirim";
import { Icon } from "@/components/Icon";

const KABUL = "image/png,image/jpeg,image/webp,image/avif";
// 5 MB: portre bunun çok altında kalıyor; üstü büyük ihtimalle küçültülmemiş
// bir fotoğraf ve eğitim sayfasını yavaşlatır.
const SINIR = 5 * 1024 * 1024;

/**
 * Eğitmen portresi: yükleme, önizleme, kaldırma.
 *
 * Dosya `kapaklar` kovasında `egitmen/` önekiyle duruyor — kova zaten herkese
 * açık ve görsel türleriyle sınırlı; portre için ayrı bir kova açmak aynı
 * kuralları bir kez daha yazmak olurdu.
 */
export function EgitmenGorseli({ mevcut }: { mevcut: string | null }) {
  const router = useRouter();
  const bildir = useBildirim();
  const [yukleniyor, setYukleniyor] = useState(false);

  const yukle = async (dosya: File | undefined) => {
    if (!dosya) return;

    if (!dosya.type.startsWith("image/")) {
      bildir.hata("Yalnızca görsel dosyası yükleyebilirsin.");
      return;
    }
    if (dosya.size > SINIR) {
      bildir.hata("Görsel 5 MB'tan küçük olmalı.");
      return;
    }

    setYukleniyor(true);
    const temizAd = dosya.name.replace(/[^\w.\-]/g, "_");
    const yol = `egitmen/${Date.now()}-${temizAd}`;

    const supabase = createClient();
    const { error } = await supabase.storage.from("kapaklar").upload(yol, dosya, { cacheControl: "3600" });

    if (error) {
      setYukleniyor(false);
      bildir.hata(`Görsel yüklenemedi: ${error.message}`);
      return;
    }

    const r = await egitmenGorseliGuncelle(yol);
    setYukleniyor(false);
    if (r?.error) bildir.hata(r.error);
    else {
      bildir.basarili("Eğitmen portresi güncellendi.");
      router.refresh();
    }
  };

  const kaldir = async () => {
    setYukleniyor(true);
    const r = await egitmenGorseliGuncelle(null);
    setYukleniyor(false);
    if (r?.error) bildir.hata(r.error);
    else {
      bildir.basarili("Portre kaldırıldı.");
      router.refresh();
    }
  };

  return (
    <div className="flex items-start gap-4">
      <div className="h-[104px] w-[104px] flex-none overflow-hidden rounded-[14px] border border-ink/12 bg-[#F2F4FA]">
        {mevcut ? (
          // next/image değil: kaynak Supabase CDN'i ve tek bir yönetim
          // ekranında görünüyor; iyileştirme kazancı yok, yapılandırma yükü var.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mevcut} alt="Eğitmen portresi" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-mono text-[10px] text-[#656B7A]">
            portre yok
          </div>
        )}
      </div>
      <div className="min-w-0">
        <label
          className={`inline-flex h-[38px] cursor-pointer items-center gap-[6px] rounded-[9px] border border-brand/40 bg-brand/[0.07] px-[15px] text-[13.5px] font-semibold text-brand transition hover:bg-brand hover:text-white ${
            yukleniyor ? "pointer-events-none opacity-60" : ""
          }`}
        >
          <Icon name="upload" size={14} />
          {yukleniyor ? "Yükleniyor…" : mevcut ? "Değiştir" : "Portre yükle"}
          <input type="file" accept={KABUL} className="hidden" onChange={(e) => yukle(e.target.files?.[0])} />
        </label>
        {mevcut && (
          <button
            type="button"
            onClick={kaldir}
            disabled={yukleniyor}
            className="ml-2 h-[38px] rounded-[9px] border border-ink/13 bg-white px-[14px] text-[13.5px] font-semibold text-[#5C6273] transition hover:border-danger/45 hover:text-danger disabled:opacity-60"
          >
            Kaldır
          </button>
        )}
        <p className="mt-[10px] max-w-[380px] text-[12.5px] leading-[1.55] text-[#656B7A]">
          Kare bir fotoğraf en iyi sonucu veriyor; görsel her yerde ortadan kırpılıyor. Portre yoksa adın baş
          harfleri gösteriliyor.
        </p>
      </div>
    </div>
  );
}
