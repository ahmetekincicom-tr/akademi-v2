"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { seoKaydet } from "@/app/kontrol-9f4x2k/(protected)/seo/actions";
import { Icon } from "@/components/Icon";
import { useBildirim } from "@/components/Bildirim";
import { BASLIK_SINIRI, ACIKLAMA_SINIRI, aciklamayiKisalt } from "@/lib/sayfa-seo";

/**
 * Bir sayfanın SEO satırı.
 *
 * `otomatikBaslik` / `otomatikAciklama`: alan boş bırakıldığında sitenin
 * gerçekten basacağı metin. Yer tutucu olarak gösteriliyor ki "boş bırakırsam
 * ne olur" sorusunun cevabı ekranda dursun — boş bir kutu, sanki sayfanın
 * başlığı yokmuş gibi okunuyordu.
 */
export type SeoSatiri = {
  tip: "sayfa" | "egitim";
  anahtar: string;
  ad: string;
  /** Sitedeki adres; "Görüntüle" bağlantısı ve önizleme bunu kullanıyor. */
  adres: string;
  baslik: string;
  aciklama: string;
  otomatikBaslik: string;
  otomatikAciklama: string;
};

export function SeoYonetimi({ satirlar, siteUrl }: { satirlar: SeoSatiri[]; siteUrl: string }) {
  const router = useRouter();
  const [acik, setAcik] = useState<string | null>(null);

  const ozelSayisi = satirlar.filter((s) => s.baslik || s.aciklama).length;

  return (
    <main className="p-4 pb-14 sm:p-7">
      <div>
        <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
          SEO
        </h1>
        <p className="mt-[7px] max-w-[760px] text-[14.5px] leading-[1.6] text-[#5C6273]">
          Sayfaların Google&apos;da görünen başlığı ve açıklaması. {satirlar.length} sayfa ·{" "}
          {ozelSayisi === 0 ? "hiçbiri elle yazılmamış" : `${ozelSayisi} tanesi elle yazılmış`}.
          Boş bıraktığın alan otomatik değerini kullanmaya devam eder — yani hiçbir şey doldurmasan da
          site bugünkü hâliyle çalışır.
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        {satirlar.map((s) => (
          <SeoKarti
            key={`${s.tip}:${s.anahtar}`}
            satir={s}
            siteUrl={siteUrl}
            acik={acik === `${s.tip}:${s.anahtar}`}
            onAc={() => setAcik(acik === `${s.tip}:${s.anahtar}` ? null : `${s.tip}:${s.anahtar}`)}
            onKaydedildi={() => router.refresh()}
          />
        ))}
      </div>
    </main>
  );
}

function SeoKarti({
  satir,
  siteUrl,
  acik,
  onAc,
  onKaydedildi,
}: {
  satir: SeoSatiri;
  siteUrl: string;
  acik: boolean;
  onAc: () => void;
  onKaydedildi: () => void;
}) {
  const [baslik, setBaslik] = useState(satir.baslik);
  const [aciklama, setAciklama] = useState(satir.aciklama);
  const [islemde, startTransition] = useTransition();
  const bildir = useBildirim();

  const kaydet = () => {
    startTransition(async () => {
      const r = await seoKaydet({ tip: satir.tip, anahtar: satir.anahtar, baslik, aciklama });
      if (r?.error) {
        bildir.hata(r.error);
      } else {
        bildir.basarili(`${satir.ad} kaydedildi.`);
        onKaydedildi();
      }
    });
  };

  // Ekranda gerçekten ne basılacak: elle yazılan varsa o, yoksa otomatik.
  const etkinBaslik = baslik.trim() || satir.otomatikBaslik;
  const etkinAciklama = aciklamayiKisalt(aciklama.trim() || satir.otomatikAciklama);
  const elleYazilmis = Boolean(satir.baslik || satir.aciklama);

  const alan =
    "rounded-[10px] border border-ink/13 bg-white px-[13px] py-[11px] text-sm leading-[1.55] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]";

  return (
    <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
      <div className="flex flex-wrap items-center gap-4 px-6 py-[16px]">
        <div className="min-w-0 grow basis-[240px]">
          <div className="text-[15.5px] font-semibold">{satir.ad}</div>
          <div className="mt-1 truncate font-mono text-[10.5px] text-[#656B7A]">{satir.adres}</div>
        </div>
        <span
          className="flex-none rounded-full px-[9px] py-[3px] font-mono text-[9.5px] tracking-[0.08em] uppercase"
          style={
            elleYazilmis
              ? { background: "rgba(28,86,243,0.12)", color: "#1C56F3" }
              : { background: "rgba(10,13,24,0.06)", color: "#656B7A" }
          }
        >
          {elleYazilmis ? "Elle yazıldı" : "Otomatik"}
        </span>
        <a
          href={satir.adres}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-8 flex-none items-center gap-[6px] rounded-[8px] border border-ink/13 bg-white px-3 text-[12.5px] font-semibold text-ink transition hover:border-brand hover:text-brand"
        >
          <Icon name="external" size={13} />
          Görüntüle
        </a>
        <button
          type="button"
          onClick={onAc}
          className="h-8 flex-none rounded-[8px] border border-ink/13 bg-white px-3 text-[12.5px] font-semibold text-ink transition hover:border-ink hover:bg-ink hover:text-white"
        >
          {acik ? "Kapat" : "Düzenle"}
        </button>
      </div>

      {acik && (
        <div className="border-t border-ink/8 bg-[#FAFBFF] px-6 py-5">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_minmax(300px,420px)]">
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-2">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">
                    Arama başlığı
                  </span>
                  <Sayac uzunluk={baslik.trim().length} sinir={BASLIK_SINIRI} />
                </span>
                <input
                  type="text"
                  value={baslik}
                  onChange={(e) => setBaslik(e.target.value)}
                  placeholder={satir.otomatikBaslik}
                  className={`h-[46px] ${alan}`}
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">
                    Arama açıklaması
                  </span>
                  <Sayac uzunluk={aciklama.trim().length} sinir={ACIKLAMA_SINIRI} />
                </span>
                <textarea
                  value={aciklama}
                  onChange={(e) => setAciklama(e.target.value)}
                  rows={4}
                  placeholder={satir.otomatikAciklama}
                  className={alan}
                />
              </label>

              <p className="max-w-[560px] text-[12.5px] leading-[1.6] text-[#656B7A]">
                İkisini de boş bırakırsan sayfa otomatik değerine döner (kutulardaki soluk metin). Sınırı
                aşman engellenmiyor; sadece Google&apos;ın kesme ihtimalini gösteriyoruz — sağdaki önizleme
                kesilmiş hâlini birebir gösterir.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={kaydet}
                  disabled={islemde}
                  className="h-[42px] rounded-[10px] bg-brand px-5 text-[14px] font-semibold text-white transition hover:bg-ink disabled:opacity-55"
                >
                  {islemde ? "Kaydediliyor…" : "Kaydet"}
                </button>
                {(baslik || aciklama) && (
                  <button
                    type="button"
                    onClick={() => {
                      setBaslik("");
                      setAciklama("");
                    }}
                    disabled={islemde}
                    className="h-[42px] rounded-[10px] border border-ink/13 bg-white px-4 text-[14px] font-semibold text-ink transition hover:border-ink disabled:opacity-55"
                  >
                    Otomatiğe döndür
                  </button>
                )}
              </div>
            </div>

            <GoogleOnizleme
              siteUrl={siteUrl}
              adres={satir.adres}
              baslik={etkinBaslik}
              aciklama={etkinAciklama}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Karakter sayacı.
 *
 * Sınırı aşmak HATA DEĞİL — bazen bir cümle 165 karakter eder ve kırpılmayı
 * göze alırsınız. O yüzden renk kırmızıya değil turuncuya dönüyor ve kaydetme
 * engellenmiyor; kutunun altındaki önizleme zaten kesilmiş hâli gösteriyor.
 */
function Sayac({ uzunluk, sinir }: { uzunluk: number; sinir: number }) {
  const asti = uzunluk > sinir;
  return (
    <span
      className="font-mono text-[10.5px] tabular-nums"
      style={{ color: asti ? "#A5711A" : uzunluk === 0 ? "#9AA0AE" : "#656B7A" }}
    >
      {uzunluk}/{sinir}
      {asti ? " · kesilebilir" : ""}
    </span>
  );
}

/**
 * Arama sonucunun taklidi.
 *
 * Sayı saymak, sonucun nasıl görüneceğini anlatmıyor. Burada metin gerçekte
 * basılacak hâliyle — kısaltılmış, marka adı eklenmiş — duruyor; başlığı
 * kısaltmak ya da uzatmak gerektiği buradan bir bakışta görülüyor.
 */
function GoogleOnizleme({
  siteUrl,
  adres,
  baslik,
  aciklama,
}: {
  siteUrl: string;
  adres: string;
  baslik: string;
  aciklama: string;
}) {
  let kirinti = adres;
  try {
    const u = new URL(adres, siteUrl);
    kirinti = `${u.host}${u.pathname === "/" ? "" : u.pathname.replace(/\/$/, "").replace(/\//g, " › ")}`;
  } catch {
    // Adres çözülemezse ham hâli yeterli.
  }

  return (
    <div className="rounded-[14px] border border-ink/10 bg-white p-5">
      <div className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">
        Google&apos;da böyle görünür
      </div>
      <div className="mt-4">
        <div className="truncate text-[12.5px] text-[#4D5156]">{kirinti}</div>
        <div className="mt-[3px] text-[18px] leading-[1.3] text-[#1a0dab]">{baslik}</div>
        <div className="mt-[3px] text-[13px] leading-[1.58] text-[#4D5156]">{aciklama}</div>
      </div>
      <p className="mt-4 border-t border-ink/8 pt-3 text-[11.5px] leading-[1.55] text-[#8A90A0]">
        Temsilîdir. Google başlığı ve açıklamayı arama sorgusuna göre kendisi de değiştirebiliyor; buradaki
        metin bir talep, garanti değil.
      </p>
    </div>
  );
}
