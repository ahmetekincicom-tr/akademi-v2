"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  markaGuncelle,
  logoYuksekligiKaydet,
  type MarkaAlan,
} from "@/app/kontrol-9f4x2k/(protected)/marka/actions";
import { LOGO_YUKSEKLIK_ALT, LOGO_YUKSEKLIK_UST, VARSAYILAN_LOGO_YUKSEKLIGI } from "@/lib/marka";
import { Icon } from "@/components/Icon";
import { useBildirim } from "@/components/Bildirim";

export type MarkaGorunum = {
  logoKoyuZemin: string | null;
  logoAcikZemin: string | null;
  favicon: string | null;
  ogGorsel: string | null;
  logoYuksekligi: number;
  epostaLogo: string | null;
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
  {
    alan: "og_gorsel",
    baslik: "Paylaşım görseli (OpenGraph)",
    aciklama:
      "Bir bağlantı WhatsApp, LinkedIn, X veya Facebook'ta paylaşıldığında çıkan kapak görseli. Yüklemezsen paylaşımlarda görsel gösterilmez.",
    oneri: "1200×630 PNG veya JPG · SVG çalışmaz, bu platformlar SVG okumuyor",
    koyuOnizleme: true,
  },
  {
    alan: "eposta_logo",
    baslik: "E-posta logosu",
    aciklama:
      "Bildirim e-postalarının üst şeridinde görünür. Şerit koyu olduğu için açık renkli bir sürüm gerekiyor. Yüklemezsen mailler yerleşik “AE” işaretiyle gider.",
    oneri:
      "Açık renkli PNG · yüksekliği 64-96 piksel · SVG çalışmaz, e-posta istemcileri SVG çizmiyor",
    koyuOnizleme: true,
  },
];

export function MarkaYonetimi({ marka }: { marka: MarkaGorunum }) {
  const mevcut: Record<MarkaAlan, string | null> = {
    logo_acik_zemin: marka.logoAcikZemin,
    logo_koyu_zemin: marka.logoKoyuZemin,
    favicon: marka.favicon,
    og_gorsel: marka.ogGorsel,
    eposta_logo: marka.epostaLogo,
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
        <LogoBoyutu marka={marka} />
      </div>
    </main>
  );
}

/** Dosyayı yüklemeden önce doğal ölçüsünü okur; okunamazsa null. */
async function gorselOlcusu(dosya: File): Promise<{ genislik: number; yukseklik: number } | null> {
  try {
    const bitmap = await createImageBitmap(dosya);
    const olcu = { genislik: bitmap.width, yukseklik: bitmap.height };
    bitmap.close();
    return olcu;
  } catch {
    // SVG ve bazı biçimler createImageBitmap ile okunamıyor; ölçüsüz devam.
    return null;
  }
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

    // Paylaşım görselinin ölçüsü etikete yazılıyor; burada okumak, sunucuda
    // her istekte görseli indirip ölçmekten çok daha ucuz.
    const olcu = kart.alan === "og_gorsel" ? await gorselOlcusu(dosya) : null;

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

    const r = await markaGuncelle(kart.alan, yol, olcu);
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
        <div className="min-w-0 grow basis-[240px]">
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

/**
 * Logo boyutu ayarı.
 *
 * Neden ayar: bir logonun ekranda ne kadar büyük durduğunu yalnızca piksel
 * yüksekliği belirlemiyor. SVG'nin viewBox'ında kenar payı varsa aynı
 * yükseklikte gözle görülür biçimde küçük duruyor — ve o payı kod tarafından
 * bilmenin yolu yok. Sürgüyü oynatıp gözle karar vermek, dosyayı yeniden
 * dışa aktarmaktan hızlı.
 */
function LogoBoyutu({ marka }: { marka: MarkaGorunum }) {
  const router = useRouter();
  const bildir = useBildirim();
  const [deger, setDeger] = useState(marka.logoYuksekligi);
  const [islemde, startTransition] = useTransition();

  const degisti = deger !== marka.logoYuksekligi;

  const kaydet = () =>
    startTransition(async () => {
      const r = await logoYuksekligiKaydet(deger);
      if (r?.error) bildir.hata(r.error);
      else {
        bildir.basarili("Logo boyutu güncellendi.");
        router.refresh();
      }
    });

  // Site tarafındaki oranların aynısı (src/components/site/Logo.tsx).
  const onizleme = [
    { ad: "Üst menü", oran: 1, koyu: false, url: marka.logoAcikZemin },
    { ad: "Alt bilgi", oran: 0.88, koyu: true, url: marka.logoKoyuZemin },
    { ad: "Giriş ekranı", oran: 1.2, koyu: true, url: marka.logoKoyuZemin },
  ];

  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-6">
      <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Logo boyutu</h2>
      <p className="mt-1 max-w-[640px] text-[13.5px] leading-[1.6] text-[#5C6273]">
        Üst menüdeki logonun yüksekliği. Alt bilgi ve giriş ekranı bu değerden oranlanır, yani üçü birlikte
        büyüyüp küçülür. Logo olması gerekenden küçük duruyorsa önce buradan dene; düzelmiyorsa dosyanın
        kenarlarında boşluk var demektir.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <input
          type="range"
          min={LOGO_YUKSEKLIK_ALT}
          max={LOGO_YUKSEKLIK_UST}
          step={1}
          value={deger}
          onChange={(e) => setDeger(Number(e.target.value))}
          className="h-2 w-full max-w-[380px] accent-[#1C56F3]"
          aria-label="Logo yüksekliği"
        />
        <span className="font-mono text-[13px] text-[#3A3F4F]">{deger} px</span>
        {deger !== VARSAYILAN_LOGO_YUKSEKLIGI && (
          <button
            type="button"
            onClick={() => setDeger(VARSAYILAN_LOGO_YUKSEKLIGI)}
            className="text-[13px] font-semibold text-[#5C6273] underline underline-offset-2 hover:text-brand"
          >
            Varsayılana dön ({VARSAYILAN_LOGO_YUKSEKLIGI} px)
          </button>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {onizleme.map((o) => {
          const y = Math.round(deger * o.oran);
          return (
            <div key={o.ad} className="overflow-hidden rounded-[12px] border border-ink/10">
              <div className="border-b border-ink/8 px-3 py-2 font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">
                {o.ad} · {y} px
              </div>
              <div
                className="flex items-center px-4 py-5"
                style={{ background: o.koyu ? "#0A0D18" : "#FFFFFF" }}
              >
                {o.url ? (
                  /* eslint-disable-next-line @next/next/no-img-element -- önizleme */
                  <img
                    src={o.url}
                    alt=""
                    style={{ height: y, maxWidth: y * 7 }}
                    className="w-auto object-contain"
                  />
                ) : (
                  <span
                    style={{ height: y, fontSize: Math.round(y * 0.38) }}
                    className="flex items-center rounded-[9px] bg-brand px-3 font-heading font-bold text-white"
                  >
                    AE
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={kaydet}
        disabled={!degisti || islemde}
        className="mt-5 h-[44px] rounded-[10px] bg-brand px-6 text-[15px] font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-45"
      >
        {islemde ? "Kaydediliyor…" : degisti ? "Boyutu kaydet" : "Kaydedildi"}
      </button>
    </section>
  );
}
