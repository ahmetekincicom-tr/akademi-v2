"use client";

import { useCallback, useEffect, useState } from "react";
import { useBildirim } from "@/components/Bildirim";
import {
  wpAdresleriniGuncelle,
  wpGorselKopyala,
  wpTaramasi,
  type KopyaSonucu,
  type TaramaSonucu,
} from "@/app/kontrol-9f4x2k/(protected)/blog/tasima/actions";

const PARTI = 6;

export function WpTasimaAraci() {
  const bildir = useBildirim();
  const [tarama, setTarama] = useState<TaramaSonucu | null>(null);
  const [kopyalaniyor, setKopyalaniyor] = useState(false);
  const [ilerleme, setIlerleme] = useState(0);
  const [hatalar, setHatalar] = useState<KopyaSonucu[]>([]);
  const [guncelleniyor, setGuncelleniyor] = useState(false);

  const tara = useCallback(async () => {
    setTarama(null);
    setTarama(await wpTaramasi());
  }, []);

  useEffect(() => {
    void wpTaramasi().then(setTarama);
  }, []);

  const bekleyen = tarama?.dosyalar.filter((d) => !d.tasindi) ?? [];
  const tasinan = (tarama?.dosyalar.length ?? 0) - bekleyen.length;

  const kopyala = async () => {
    setKopyalaniyor(true);
    setHatalar([]);
    setIlerleme(0);
    const sira = bekleyen.map((d) => d.wpYol);
    const hata: KopyaSonucu[] = [];
    for (let i = 0; i < sira.length; i += PARTI) {
      const r = await wpGorselKopyala(sira.slice(i, i + PARTI));
      if (r.error) {
        bildir.hata(r.error);
        break;
      }
      hata.push(...r.sonuclar.filter((s) => !s.ok));
      setIlerleme(Math.min(i + PARTI, sira.length));
    }
    setHatalar(hata);
    setKopyalaniyor(false);
    if (hata.length === 0) bildir.basarili("Görseller kopyalandı.");
    await tara();
  };

  const guncelle = async () => {
    if (
      !window.confirm(
        "Yazılardaki WordPress görsel adresleri kendi depomuzdaki kopyalarla değiştirilecek. Değişen her yazının eski hâli sürüm geçmişine kaydedilir. Devam edilsin mi?",
      )
    )
      return;
    setGuncelleniyor(true);
    const r = await wpAdresleriniGuncelle();
    setGuncelleniyor(false);
    if (r.error) bildir.hata(r.error);
    else bildir.basarili(`${r.guncellenen} yazı güncellendi.${r.kalan ? ` ${r.kalan} görsel henüz kopyalanmadı.` : ""}`);
    await tara();
  };

  if (!tarama) return <p className="text-[14px] text-[#5C6273]">Yazılar taranıyor…</p>;
  if (tarama.error) return <p className="text-[14px] text-danger">Tarama yapılamadı: {tarama.error}</p>;
  if (tarama.dosyalar.length === 0) {
    return (
      <div className="rounded-[14px] border border-ink/11 bg-white p-5 text-[14.5px] text-[#3D4252]">
        Yazılarda WordPress&apos;e bağlı görsel kalmadı. WordPress sunucusu blog için artık gerekmiyor.
      </div>
    );
  }

  return (
    <div className="flex max-w-[860px] flex-col gap-5">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { ad: "Görsel", deger: tarama.dosyalar.length },
          { ad: "Kopyalandı", deger: tasinan },
          { ad: "Etkilenen yazı", deger: tarama.yaziSayisi },
        ].map((k) => (
          <div key={k.ad} className="rounded-[14px] border border-ink/11 bg-white p-4">
            <div className="font-mono text-[10px] tracking-[0.13em] text-[#656B7A] uppercase">{k.ad}</div>
            <div className="mt-1 font-heading text-[26px] font-semibold">{k.deger}</div>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-4 rounded-[14px] border border-ink/11 bg-white p-5">
        <div>
          <h2 className="font-heading text-[16px] font-semibold">1. Görselleri kopyala</h2>
          <p className="mt-1 text-[13.5px] leading-[1.55] text-[#5C6273]">
            {tarama.kaynak
              ? `Kaynak: ${tarama.kaynak}. Yazılara henüz dokunulmuyor.`
              : "WORDPRESS_KAYNAK ortam değişkeni tanımlı değil; kopyalama yapılamaz."}
          </p>
        </div>
        {kopyalaniyor && (
          <div>
            <div className="h-2 overflow-hidden rounded-full bg-mist" role="progressbar" aria-valuenow={ilerleme} aria-valuemin={0} aria-valuemax={bekleyen.length}>
              <div className="h-full bg-brand transition-all" style={{ width: `${(ilerleme / Math.max(1, bekleyen.length)) * 100}%` }} />
            </div>
            <p className="mt-1.5 text-[12.5px] text-[#5C6273]">
              {ilerleme} / {bekleyen.length}
            </p>
          </div>
        )}
        {hatalar.length > 0 && (
          <ul className="rounded-[10px] border border-danger/25 bg-danger/[0.05] p-3 text-[13px] text-danger">
            {hatalar.map((h) => (
              <li key={h.wpYol} className="break-all">
                {h.wpYol}: {h.hata}
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={kopyala}
          disabled={kopyalaniyor || bekleyen.length === 0 || !tarama.kaynak}
          className="h-11 self-start rounded-[10px] bg-brand px-5 text-[14px] font-semibold text-white hover:bg-ink disabled:opacity-45"
        >
          {bekleyen.length === 0 ? "Hepsi kopyalandı" : kopyalaniyor ? "Kopyalanıyor…" : `${bekleyen.length} görseli kopyala`}
        </button>
      </section>

      <section className="flex flex-col gap-4 rounded-[14px] border border-ink/11 bg-white p-5">
        <div>
          <h2 className="font-heading text-[16px] font-semibold">2. Yazılardaki adresleri güncelle</h2>
          <p className="mt-1 text-[13.5px] leading-[1.55] text-[#5C6273]">
            Yalnız kopyası doğrulanmış görsellerin adresi değişir. Canlı yazılar güncellenir ve hemen yayına yansır.
          </p>
        </div>
        <button
          type="button"
          onClick={guncelle}
          disabled={guncelleniyor || tasinan === 0}
          className="h-11 self-start rounded-[10px] border border-brand px-5 text-[14px] font-semibold text-brand hover:bg-brand hover:text-white disabled:opacity-45"
        >
          {guncelleniyor ? "Güncelleniyor…" : "Adresleri güncelle"}
        </button>
      </section>

      <details className="rounded-[14px] border border-ink/11 bg-white p-5">
        <summary className="min-h-[44px] cursor-pointer text-[14px] font-semibold">Görsel listesi</summary>
        <ul className="mt-3 flex flex-col gap-1.5 text-[12.5px]">
          {tarama.dosyalar.map((d) => (
            <li key={d.wpYol} className="flex flex-wrap gap-x-2 break-all">
              <span className={d.tasindi ? "text-[#157A4E]" : "text-[#A5711A]"}>{d.tasindi ? "✓" : "•"}</span>
              <span className="font-mono">{d.wpYol}</span>
              <span className="text-[#8A90A0]">· {d.yazilar.join(", ")}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
