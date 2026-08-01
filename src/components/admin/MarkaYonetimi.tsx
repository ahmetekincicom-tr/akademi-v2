"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { markaGuncelle, type MarkaAlan } from "@/app/admin/(protected)/marka/actions";
import { Icon } from "@/components/Icon";
import { useBildirim } from "@/components/Bildirim";

export type MarkaGorunum = {
  logoKoyuZemin: string | null;
  logoAcikZemin: string | null;
  favicon: string | null;
};

type Kart = {
  alan: MarkaAlan;
  baslik: string;
  aciklama: string;
  oneri: string;
  koyuOnizleme?: boolean;
  kucuk?: boolean;
};

const KARTLAR: Kart[] = [
  {
    alan: "logo_acik_zemin",
    baslik: "Logo — açık zemin",
    aciklama: "Beyaz arka planlarda kullanılır: üst menü ve giriş ekranı.",
    oneri: "Şeffaf zeminli PNG veya SVG · yüksekliği en az 72 piksel",
  },
  {
    alan: "logo_koyu_zemin",
    baslik: "Logo — koyu zemin",
    aciklama: "Koyu arka planlarda kullanılır: footer ve panel kenar çubuğu.",
    oneri: "Açık renkli, şeffaf zeminli PNG veya SVG",
    koyuOnizleme: true,
  },
  {
    alan: "favicon",
    baslik: "Favicon",
    aciklama: "Tarayıcı sekmesinde ve yer imlerinde görünen küçük simge.",
    oneri: "Kare · 512×512 PNG, SVG veya .ico",
    kucuk: true,
  },
];

export function MarkaYonetimi({ marka }: { marka: MarkaGorunum }) {
  const mevcut: Record<MarkaAlan, string | null> = {
    logo_acik_zemin: marka.logoAcikZemin,
    logo_koyu_zemin: marka.logoKoyuZemin,
    favicon: marka.favicon,
  };

  return (
    <main className="p-4 pb-14 sm:p-7">
      <div>
        <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
          Logo ve favicon
        </h1>
        <p className="mt-[7px] max-w-[700px] text-[14.5px] text-[#5C6273]">
          Yüklediğin görseller siteye anında yansır. Bir görsel yüklemezsen yerleşik &ldquo;AE&rdquo; işareti
          kullanılmaya devam eder, yani site hiçbir zaman logosuz kalmaz.
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        {KARTLAR.map((k) => (
          <MarkaKarti key={k.alan} kart={k} url={mevcut[k.alan]} />
        ))}
      </div>
    </main>
  );
}

function MarkaKarti({ kart, url }: { kart: Kart; url: string | null }) {
  const router = useRouter();
  const bildir = useBildirim();
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [islemde, startTransition] = useTransition();
  const mesgul = yukleniyor || islemde;

  const yukle = async (dosya: File) => {
    setHata(null);
    setYukleniyor(true);

    const temizAd = dosya.name.replace(/[^\w.\-]/g, "_");
    const yol = `${kart.alan}-${Date.now()}-${temizAd}`;

    const supabase = createClient();
    const { error } = await supabase.storage.from("marka").upload(yol, dosya, {
      // Tarayıcı eski logoyu uzun süre tutmasın.
      cacheControl: "300",
    });
    if (error) {
      setYukleniyor(false);
      setHata(error.message);
      bildir.hata(`Dosya yüklenemedi: ${error.message}`);
      return;
    }

    const r = await markaGuncelle(kart.alan, yol);
    setYukleniyor(false);
    if (r?.error) {
      setHata(r.error);
      bildir.hata(r.error);
    } else {
      bildir.basarili(`${kart.baslik} güncellendi.`);
      router.refresh();
    }
  };

  const kaldir = () => {
    setHata(null);
    startTransition(async () => {
      const r = await markaGuncelle(kart.alan, null);
      if (r?.error) {
        setHata(r.error);
        bildir.hata(r.error);
      } else {
        bildir.basarili(`${kart.baslik} kaldırıldı.`);
        router.refresh();
      }
    });
  };

  const onizlemeStil = kart.koyuOnizleme
    ? "flex items-center justify-center rounded-[11px] border border-ink/10 bg-ink"
    : "flex items-center justify-center rounded-[11px] border border-ink/10 bg-mist";

  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-6">
      <div className="flex flex-wrap items-start gap-6">
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">{kart.baslik}</h2>
          <p className="mt-1 max-w-[440px] text-[13.5px] leading-[1.6] text-[#5C6273]">{kart.aciklama}</p>
          <p className="mt-2 font-mono text-[11px] text-[#656B7A]">{kart.oneri}</p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="inline-flex h-[42px] cursor-pointer items-center gap-2 rounded-[10px] bg-brand px-5 text-sm font-semibold text-white transition hover:bg-ink">
              <Icon name="upload" size={15} />
              {url ? "Değiştir" : "Yükle"}
              <input
                type="file"
                accept={kart.alan === "favicon" ? "image/png,image/svg+xml,image/x-icon,.ico" : "image/*"}
                disabled={mesgul}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) yukle(f);
                  e.target.value = "";
                }}
                className="hidden"
              />
            </label>

            {url && (
              <button
                type="button"
                onClick={kaldir}
                disabled={mesgul}
                className="inline-flex h-[42px] items-center gap-2 rounded-[10px] border border-ink/13 bg-white px-4 text-sm font-semibold text-[#5C6273] transition hover:border-danger/45 hover:text-danger disabled:opacity-50"
              >
                <Icon name="x" size={15} />
                Kaldır
              </button>
            )}

            {mesgul && <span className="text-[13.5px] text-[#656B7A]">İşleniyor…</span>}
          </div>

          {hata && <div className="mt-3 text-sm text-danger-ink">{hata}</div>}
        </div>

        <div className="flex-none">
          <div className="mb-2 font-mono text-[9.5px] tracking-[0.12em] text-[#656B7A] uppercase">Önizleme</div>
          <div className={`${onizlemeStil} ${kart.kucuk ? "h-[76px] w-[76px]" : "h-[76px] w-[220px]"}`}>
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt={kart.baslik}
                className={kart.kucuk ? "h-10 w-10 object-contain" : "max-h-[46px] max-w-[180px] object-contain"}
              />
            ) : (
              <span className="px-3 text-center font-mono text-[10.5px] text-[#656B7A]">
                yüklenmedi · yerleşik işaret
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
