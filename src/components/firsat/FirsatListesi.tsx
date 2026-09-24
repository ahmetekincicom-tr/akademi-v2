"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CALISMA_MODELI,
  CALISMA_TIPI,
  SEVIYE,
  lokasyonMetni,
  suresiDoldu,
  type CalismaModeli,
  type CalismaTipi,
  type Ilan,
  type Seviye,
} from "@/lib/firsat";
import { Icon } from "@/components/Icon";
import { Etiket, SirketLogosu, SonBasvuruEtiketi } from "@/components/firsat/IlanOrtak";
import { KaydetDugmesi } from "@/components/firsat/IlanEylemleri";
import { TR_ZAMAN } from "@/lib/zaman";

/**
 * Öğrenci: iş fırsatları listesi.
 *
 * Masaüstünde süzgeçler solda sabit bir kartta; mobilde listeyi daraltmasın
 * diye "Süzgeçler" düğmesiyle alttan açılan bir sayfada (bottom sheet).
 * Süresi dolan ilanlar varsayılan olarak gizli (ayrı bir anahtarla
 * açılıyor); Kaydedilenler sekmesinde ise hepsi görünüyor — kişi kaydettiği
 * ilanın ne olduğunu, süresi dolsa da görebilmeli.
 */

type Grup = "kategori" | "calismaTipi" | "calismaModeli" | "sehir" | "seviye";
type Secim = Record<Grup, string[]>;
const BOS_SECIM: Secim = { kategori: [], calismaTipi: [], calismaModeli: [], sehir: [], seviye: [] };

const GRUP_BASLIK: Record<Grup, string> = {
  kategori: "Kategori",
  calismaTipi: "Çalışma tipi",
  calismaModeli: "Çalışma modeli",
  sehir: "Şehir",
  seviye: "Seviye",
};

const yayinBicimi = new Intl.DateTimeFormat("tr-TR", { timeZone: TR_ZAMAN, day: "numeric", month: "long" });

function deger(ilan: Ilan, g: Grup): string | null {
  switch (g) {
    case "kategori":
      return ilan.kategori;
    case "calismaTipi":
      return ilan.calismaTipi;
    case "calismaModeli":
      return ilan.calismaModeli;
    case "sehir":
      return ilan.sehir;
    case "seviye":
      return ilan.seviye;
  }
}

function etiket(g: Grup, v: string): string {
  if (g === "calismaTipi") return CALISMA_TIPI[v as CalismaTipi] ?? v;
  if (g === "calismaModeli") return CALISMA_MODELI[v as CalismaModeli] ?? v;
  if (g === "seviye") return SEVIYE[v as Seviye] ?? v;
  return v;
}

/** Sabit kümelerde tanım sırası, serbest metinlerde alfabetik. */
function secenekSirasi(g: Grup, degerler: string[]): string[] {
  const sabit =
    g === "calismaTipi" ? Object.keys(CALISMA_TIPI) : g === "calismaModeli" ? Object.keys(CALISMA_MODELI) : g === "seviye" ? Object.keys(SEVIYE) : null;
  if (sabit) return sabit.filter((k) => degerler.includes(k));
  return [...degerler].sort((a, b) => a.localeCompare(b, "tr"));
}

export function FirsatListesi({
  ilanlar,
  kaydedilenler,
  bugun,
}: {
  ilanlar: Ilan[];
  kaydedilenler: string[];
  /** Türkiye günü (sunucuda hesaplandı; sunucu/istemci aynı sonucu versin). */
  bugun: string;
}) {
  const [arama, setArama] = useState("");
  const [secim, setSecim] = useState<Secim>(BOS_SECIM);
  const [sekme, setSekme] = useState<"hepsi" | "kaydedilen">("hepsi");
  const [dolanlariGoster, setDolanlariGoster] = useState(false);
  const [sheetAcik, setSheetAcik] = useState(false);
  const [kayitli, setKayitli] = useState<string[]>(kaydedilenler);
  const [oncekiKayit, setOncekiKayit] = useState(kaydedilenler);
  if (kaydedilenler !== oncekiKayit) {
    setOncekiKayit(kaydedilenler);
    setKayitli(kaydedilenler);
  }

  const doldu = useMemo(() => new Set(ilanlar.filter((i) => suresiDoldu(i, bugun)).map((i) => i.id)), [ilanlar, bugun]);

  // Süzgeç seçenekleri eldeki ilanlardan (olmayan bir şehri seçtirmenin anlamı yok).
  const secenekler = useMemo(() => {
    const kaynak = ilanlar.filter((i) => !doldu.has(i.id) || dolanlariGoster);
    const sonuc = {} as Record<Grup, { deger: string; adet: number }[]>;
    (Object.keys(GRUP_BASLIK) as Grup[]).forEach((g) => {
      const say = new Map<string, number>();
      for (const i of kaynak) {
        const v = deger(i, g);
        if (v) say.set(v, (say.get(v) ?? 0) + 1);
      }
      sonuc[g] = secenekSirasi(g, [...say.keys()]).map((v) => ({ deger: v, adet: say.get(v) ?? 0 }));
    });
    return sonuc;
  }, [ilanlar, doldu, dolanlariGoster]);

  const secimSayisi = Object.values(secim).reduce((t, l) => t + l.length, 0);

  const listelenen = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase("tr");
    const sonuc = ilanlar.filter((i) => {
      if (sekme === "kaydedilen") {
        if (!kayitli.includes(i.id)) return false;
      } else if (doldu.has(i.id) && !dolanlariGoster) {
        return false;
      }
      for (const g of Object.keys(secim) as Grup[]) {
        const s = secim[g];
        if (s.length && !s.includes(deger(i, g) ?? "")) return false;
      }
      if (!q) return true;
      const havuz = [i.pozisyon, i.sirketAdi, i.kategori, i.sehir ?? "", i.aciklama, ...i.sorumluluklar]
        .join(" ")
        .toLocaleLowerCase("tr");
      return havuz.includes(q);
    });
    // Süresi dolanlar her zaman sona.
    return [...sonuc].sort((a, b) => Number(doldu.has(a.id)) - Number(doldu.has(b.id)));
  }, [ilanlar, sekme, kayitli, doldu, dolanlariGoster, secim, arama]);

  const acikSayisi = ilanlar.length - doldu.size;

  const degistir = (g: Grup, v: string) =>
    setSecim((s) => ({ ...s, [g]: s[g].includes(v) ? s[g].filter((x) => x !== v) : [...s[g], v] }));
  const temizle = () => setSecim(BOS_SECIM);

  // Alt sayfa açıkken arkadaki sayfa kaymasın; Esc kapatsın.
  useEffect(() => {
    if (!sheetAcik) return;
    const onceki = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const tus = (e: KeyboardEvent) => e.key === "Escape" && setSheetAcik(false);
    window.addEventListener("keydown", tus);
    return () => {
      document.body.style.overflow = onceki;
      window.removeEventListener("keydown", tus);
    };
  }, [sheetAcik]);

  const suzgecler = (
    <div className="flex flex-col gap-5">
      {(Object.keys(GRUP_BASLIK) as Grup[]).map((g) =>
        secenekler[g].length === 0 ? null : (
          <fieldset key={g}>
            <legend className="mb-2 font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">{GRUP_BASLIK[g]}</legend>
            <div className="flex flex-wrap gap-[6px]">
              {secenekler[g].map((s) => {
                const secili = secim[g].includes(s.deger);
                return (
                  <button
                    key={s.deger}
                    type="button"
                    onClick={() => degistir(g, s.deger)}
                    aria-pressed={secili}
                    className={`inline-flex h-[34px] items-center gap-[6px] rounded-full border px-[12px] text-[13px] font-medium transition ${
                      secili ? "border-brand bg-brand/8 text-brand" : "border-ink/12 bg-white text-[#3A3F4F] hover:border-ink/25"
                    }`}
                  >
                    {secili && <Icon name="check" size={12} />}
                    {etiket(g, s.deger)}
                    <span className="font-mono text-[10.5px] opacity-60">{s.adet}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        ),
      )}
      {doldu.size > 0 && sekme === "hepsi" && (
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[11px] border border-ink/10 bg-mist/60 px-3 py-2.5 text-[13px] text-[#3A3F4F]">
          <span>
            Süresi dolanları da göster <span className="font-mono text-[10.5px] text-[#8A90A0]">{doldu.size}</span>
          </span>
          <input
            type="checkbox"
            checked={dolanlariGoster}
            onChange={(e) => setDolanlariGoster(e.target.checked)}
            className="h-4 w-4 accent-[#1C56F3]"
          />
        </label>
      )}
    </div>
  );

  if (ilanlar.length === 0) {
    return (
      <div className="mt-[26px] rounded-2xl border border-ink/10 bg-white px-8 py-14 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[13px] bg-mist text-[#656B7A]">
          <Icon name="briefcase" size={22} />
        </div>
        <h2 className="mt-4 font-heading text-lg font-semibold tracking-[-0.02em]">Şu an açık bir fırsat yok</h2>
        <p className="mx-auto mt-2 max-w-[440px] text-[14.5px] leading-[1.6] text-[#5C6273]">
          Akademi mezunlarına uygun iş ve staj fırsatlarını burada paylaşacağız. Yeni ilan eklendiğinde bu sayfada görünecek.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-[22px]">
      {/* Sekmeler + arama */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit rounded-[11px] border border-ink/10 bg-white p-[3px]" role="tablist">
          {(
            [
              ["hepsi", "Tüm fırsatlar", acikSayisi],
              ["kaydedilen", "Kaydedilenler", kayitli.length],
            ] as const
          ).map(([k, ad, adet]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={sekme === k}
              onClick={() => setSekme(k)}
              className={`inline-flex h-9 items-center gap-2 rounded-[9px] px-3.5 text-[13.5px] font-semibold transition ${
                sekme === k ? "bg-ink text-white" : "text-[#5C6273] hover:text-ink"
              }`}
            >
              {ad}
              <span className={`font-mono text-[10.5px] ${sekme === k ? "text-white/65" : "text-[#8A90A0]"}`}>{adet}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <label className="relative block flex-1 sm:w-[300px] sm:flex-none">
            <span className="pointer-events-none absolute top-1/2 left-[12px] -translate-y-1/2 text-[#8A90A0]">
              <Icon name="search" size={15} />
            </span>
            <input
              type="search"
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="Pozisyon, şirket, şehir ara"
              aria-label="İlanlarda ara"
              className="h-11 w-full rounded-[10px] border border-ink/12 bg-white pr-3 pl-[34px] text-[14.5px] text-ink outline-none focus:border-brand"
            />
          </label>
          <button
            type="button"
            onClick={() => setSheetAcik(true)}
            className="relative inline-flex h-11 flex-none items-center gap-2 rounded-[10px] border border-ink/12 bg-white px-3.5 text-[13.5px] font-semibold text-ink lg:hidden"
            aria-haspopup="dialog"
          >
            <Icon name="sliders" size={15} />
            Süzgeçler
            {secimSayisi > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 font-mono text-[10.5px] text-white">{secimSayisi}</span>
            )}
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[264px_minmax(0,1fr)]">
        {/* Masaüstü süzgeç kartı */}
        <aside className="hidden lg:block">
          <div className="sticky top-[calc(var(--baslik-h,64px)+16px)] rounded-2xl border border-ink/10 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-heading text-[15px] font-semibold tracking-[-0.01em]">Süzgeçler</span>
              {secimSayisi > 0 && (
                <button type="button" onClick={temizle} className="text-[12.5px] font-semibold text-brand hover:underline">
                  Temizle
                </button>
              )}
            </div>
            {suzgecler}
          </div>
        </aside>

        {/* Liste */}
        <section aria-label="İlanlar" className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center justify-between text-[13px] text-[#656B7A]">
            <span>
              <span className="font-semibold text-ink">{listelenen.length}</span> ilan
            </span>
            {secimSayisi > 0 && (
              <button type="button" onClick={temizle} className="font-semibold text-brand hover:underline lg:hidden">
                Süzgeçleri temizle
              </button>
            )}
          </div>

          {listelenen.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/16 bg-white px-6 py-12 text-center text-[14px] leading-[1.6] text-[#656B7A]">
              {sekme === "kaydedilen" && kayitli.length === 0
                ? "Henüz ilan kaydetmedin. İlgini çeken ilanı kaydedersen burada toplanır."
                : "Bu arama ve süzgeçlerle eşleşen ilan yok."}
              {secimSayisi > 0 && (
                <div>
                  <button type="button" onClick={temizle} className="mt-3 font-semibold text-brand hover:underline">
                    Süzgeçleri temizle
                  </button>
                </div>
              )}
            </div>
          ) : (
            listelenen.map((i) => {
              const bitti = doldu.has(i.id);
              return (
                <article
                  key={i.id}
                  className={`group relative rounded-2xl border bg-white p-4 transition sm:p-5 ${
                    i.oneCikan && !bitti
                      ? "border-brand/28 bg-gradient-to-br from-[#F6F8FF] to-white hover:border-brand/50"
                      : "border-ink/10 hover:border-brand/40"
                  } hover:shadow-[0_14px_32px_rgba(10,13,24,0.07)] ${bitti ? "opacity-70" : ""}`}
                >
                  <div className="flex gap-3.5 sm:gap-4">
                    <SirketLogosu ilan={i} />
                    <div className="min-w-0 flex-1 pr-11">
                      <div className="flex flex-wrap items-center gap-2">
                        {i.oneCikan && !bitti && <Etiket vurgulu>Öne çıkan</Etiket>}
                        <Etiket>{i.kategori}</Etiket>
                      </div>
                      <h2 className="mt-1.5 font-heading text-[16.5px] leading-[1.3] font-semibold tracking-[-0.01em] text-ink">
                        {/* Kartın tamamı tıklanır: bağlantının ::after'ı kartı kaplıyor. */}
                        <Link
                          href={`/panel/firsatlar/${i.id}`}
                          className="text-ink after:absolute after:inset-0 after:rounded-2xl after:content-[''] group-hover:text-brand focus-visible:outline-none"
                        >
                          {i.pozisyon}
                        </Link>
                      </h2>
                      <div className="mt-0.5 truncate text-[14px] text-[#3A3F4F]">{i.sirketAdi}</div>

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-[#5C6273]">
                        <span className="inline-flex items-center gap-[5px]">
                          <Icon name="pin" size={13} />
                          {lokasyonMetni(i)}
                        </span>
                        <span className="inline-flex items-center gap-[5px]">
                          <Icon name="briefcase" size={13} />
                          {CALISMA_TIPI[i.calismaTipi]}
                        </span>
                        <span>{SEVIYE[i.seviye]}</span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-ink/7 pt-3">
                        <SonBasvuruEtiketi ilan={i} bugun={bugun} />
                        {i.yayinTarihi && (
                          <span className="ml-auto font-mono text-[10.5px] text-[#8A90A0]">
                            {yayinBicimi.format(new Date(i.yayinTarihi))}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Kaydet bağlantı katmanının üstünde (z-10). */}
                  <div className="absolute top-4 right-4 z-10 sm:top-5 sm:right-5">
                    <KaydetDugmesi
                      ilanId={i.id}
                      kayitli={kayitli.includes(i.id)}
                      onDegisti={(k) => setKayitli((l) => (k ? [...new Set([...l, i.id])] : l.filter((x) => x !== i.id)))}
                    />
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>

      {/* Mobil: alttan açılan süzgeç sayfası */}
      {sheetAcik && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Süzgeçler">
          <button type="button" aria-label="Kapat" onClick={() => setSheetAcik(false)} className="absolute inset-0 bg-ink/45" />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-[22px] bg-white shadow-[0_-18px_40px_rgba(10,13,24,0.18)]">
            <div className="flex flex-none flex-col items-center px-5 pt-2.5">
              <span className="h-1 w-10 rounded-full bg-ink/15" aria-hidden />
              <div className="mt-3 flex w-full items-center justify-between">
                <span className="font-heading text-[17px] font-semibold tracking-[-0.02em]">Süzgeçler</span>
                <button
                  type="button"
                  onClick={() => setSheetAcik(false)}
                  aria-label="Kapat"
                  className="grid h-9 w-9 place-items-center rounded-[9px] text-[#5C6273] hover:bg-mist"
                >
                  <Icon name="x" size={16} />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-3 pb-5">{suzgecler}</div>
            <div className="flex flex-none gap-2 border-t border-ink/8 px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={temizle}
                disabled={secimSayisi === 0}
                className="h-12 rounded-[11px] border border-ink/13 px-4 text-[14px] font-semibold text-ink disabled:opacity-40"
              >
                Temizle
              </button>
              <button
                type="button"
                onClick={() => setSheetAcik(false)}
                className="h-12 flex-1 rounded-[11px] bg-brand text-[14.5px] font-semibold text-white"
              >
                {listelenen.length} ilanı göster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

