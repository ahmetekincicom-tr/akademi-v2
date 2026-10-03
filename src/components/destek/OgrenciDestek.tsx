"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { talepAc, mesajGonder, talebimiKapat, talebimiEgitimeBagla } from "@/app/destek-actions";
import type { DestekTalep } from "@/lib/destek";
import { EK_TIPLERI } from "@/lib/destek-ek";
import { Icon } from "@/components/Icon";
import { useBildirim } from "@/components/Bildirim";
import { BekleyenEkler, MesajEkleri, useEkYukleme } from "@/components/destek/Ekler";

/**
 * Öğrenci paneli — Soru-cevap.
 *
 * Masaüstü: solda arama + süzgeç + liste, sağda aktif konuşma.
 * Mobil: WhatsApp gibi "liste → konuşma". İlk ekran liste; bir soru seçilince
 * konuşma tam ekran açılıyor, geri düğmesi (ve tarayıcının/telefonun geri
 * hareketi) listeye döndürüyor. Seçim adreste (?talep=<id>) duruyor; mobilde
 * pushState, masaüstünde replaceState — masaüstünde her tıklama geçmişe
 * kayıt eklemesin.
 *
 * Veri ve davranış mevcut destek sisteminin: talepAc / mesajGonder aynı;
 * yalnız ek (ekran görüntüsü/PDF), "Sorun çözüldü mü?" (talebimiKapat) ve
 * eğitim bağlama (talebimiEgitimeBagla) eklendi. Tahmini yanıt süresi
 * gerçek geçmişten (medyan ilk yanıt); veri yetersizse hiç gösterilmiyor.
 */

type Durum = DestekTalep["durum"];
type Suzgec = "hepsi" | "acik" | "yanitlandi" | "kapandi";

const DURUM_STIL: Record<Durum, { etiket: string; nokta: string; bg: string; fg: string }> = {
  acik: { etiket: "Açık", nokta: "#1C56F3", bg: "rgba(28,86,243,0.11)", fg: "#1C56F3" },
  inceleniyor: { etiket: "İnceleniyor", nokta: "#C98A1B", bg: "rgba(201,138,27,0.15)", fg: "#A5711A" },
  yanitlandi: { etiket: "Yanıtlandı", nokta: "#188C5A", bg: "rgba(24,140,90,0.13)", fg: "#157A4E" },
  kapandi: { etiket: "Kapandı", nokta: "#8A90A0", bg: "rgba(10,13,24,0.07)", fg: "#5C6273" },
};

// "Açık" süzgeci incelenenleri de kapsıyor: öğrenci için ikisi de "henüz
// yanıt bekliyorum" demek. Rozet yine ayrı ayrı gösteriyor.
const SUZGECLER: { deger: Suzgec; etiket: string }[] = [
  { deger: "hepsi", etiket: "Tümü" },
  { deger: "acik", etiket: "Açık" },
  { deger: "yanitlandi", etiket: "Yanıtlandı" },
  { deger: "kapandi", etiket: "Kapandı" },
];
function suzgecUyar(s: Suzgec, d: Durum) {
  if (s === "hepsi") return true;
  if (s === "acik") return d === "acik" || d === "inceleniyor";
  return d === s;
}

const saat = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit" });
const gunUzun = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "numeric", month: "long", year: "numeric" });
const gunKisa = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "numeric", month: "short" });

function kisaYas(tarih: string): string {
  const dk = Math.round((Date.now() - new Date(tarih).getTime()) / 60000);
  if (dk < 1) return "şimdi";
  if (dk < 60) return `${dk} dk`;
  const sa = Math.round(dk / 60);
  if (sa < 24) return `${sa} sa`;
  const gun = Math.round(sa / 24);
  if (gun < 7) return `${gun} g`;
  return gunKisa.format(new Date(tarih));
}

function gunEtiketi(tarih: string): string {
  const t = new Date(tarih);
  const bugun = new Date();
  const ayniGun = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (ayniGun(t, bugun)) return "Bugün";
  const dun = new Date(bugun);
  dun.setDate(bugun.getDate() - 1);
  if (ayniGun(t, dun)) return "Dün";
  return gunUzun.format(t);
}

/** 45 → "45 dakika", 150 → "3 saat", 2000 → "1 gün" */
function sureMetni(dk: number): string {
  if (dk < 60) return `${dk} dakika`;
  const sa = Math.round(dk / 60);
  if (sa < 24) return `${sa} saat`;
  return `${Math.round(sa / 24)} gün`;
}

const kisaNo = (id: string) => id.slice(0, 6).toUpperCase();
const EK_KABUL = EK_TIPLERI.join(",");

function masaustuMu() {
  return typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
}

export function OgrenciDestek({
  talepler,
  benimId,
  kurslar,
  yanitSuresiDk,
}: {
  talepler: DestekTalep[];
  benimId: string;
  /** Öğrencinin kayıtlı olduğu eğitimler (ilerlemesiyle). */
  kurslar: { id: string; ad: string; yuzde: number }[];
  /** Medyan ilk yanıt süresi (dk); veri yetersizse null. */
  yanitSuresiDk: number | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const aramaParam = useSearchParams();
  const bildir = useBildirim();
  const [islemde, startTransition] = useTransition();

  const [suzgec, setSuzgec] = useState<Suzgec>("hepsi");
  const [arama, setArama] = useState("");
  const [yanit, setYanit] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  /*
    ?yeni=1&baslik=…&mesaj=… : başka bir ekrandan hazır doldurulmuş yeni soru
    (birebir eğitimdeki "Erteleme talebi"). Öğrenci metni görüp düzeltebiliyor,
    gönderen yine kendisi.
  */
  const [yeniAcik, setYeniAcik] = useState(aramaParam.get("yeni") === "1");
  /** "Hayır, devam" denen talepler: soru o talepte tekrar sorulmuyor (bu oturumda). */
  const [devamEdilen, setDevamEdilen] = useState<string[]>([]);
  const gecmiseEklendi = useRef(false);
  const akisRef = useRef<HTMLDivElement>(null);
  const yaziRef = useRef<HTMLTextAreaElement>(null);
  const dosyaRef = useRef<HTMLInputElement>(null);

  const ekHata = useCallback((m: string) => bildir.hata(m), [bildir]);
  const ekler = useEkYukleme(benimId, ekHata);

  const sayilar = useMemo(
    () => ({
      hepsi: talepler.length,
      acik: talepler.filter((t) => suzgecUyar("acik", t.durum)).length,
      yanitlandi: talepler.filter((t) => t.durum === "yanitlandi").length,
      kapandi: talepler.filter((t) => t.durum === "kapandi").length,
    }),
    [talepler],
  );

  const listelenen = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase("tr");
    return talepler.filter((t) => {
      if (!suzgecUyar(suzgec, t.durum)) return false;
      if (!q) return true;
      const havuz = `${t.baslik} ${t.program} ${kisaNo(t.id)} ${t.mesajlar.map((m) => m.metin).join(" ")}`;
      return havuz.toLocaleLowerCase("tr").includes(q);
    });
  }, [talepler, suzgec, arama]);

  // Adresteki seçim (mobilde konuşmanın açık olup olmadığını da belirliyor).
  const adrestekiId = aramaParam.get("talep");
  const adrestekiTalep = adrestekiId ? (talepler.find((t) => t.id === adrestekiId) ?? null) : null;
  // Masaüstünde bir şey seçilmemişse listenin ilki gösteriliyor.
  const secili = adrestekiTalep ?? listelenen[0] ?? null;
  const mobilKonusmaAcik = adrestekiTalep !== null;

  const sec = (id: string) => {
    const yeni = new URLSearchParams(aramaParam.toString());
    yeni.set("talep", id);
    if (masaustuMu()) {
      window.history.replaceState(null, "", `?${yeni.toString()}`);
    } else {
      window.history.pushState(null, "", `?${yeni.toString()}`);
      gecmiseEklendi.current = true;
    }
    setHata(null);
  };

  const listeyeDon = () => {
    if (gecmiseEklendi.current) {
      gecmiseEklendi.current = false;
      window.history.back();
    } else {
      window.history.replaceState(null, "", pathname);
    }
  };

  // Mobilde konuşma tam ekranken arkadaki sayfa kaymasın.
  useEffect(() => {
    if (!mobilKonusmaAcik || masaustuMu()) return;
    const onceki = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = onceki;
    };
  }, [mobilKonusmaAcik]);

  // Yazma alanı içeriğe göre büyüyor (üst sınırlı).
  useEffect(() => {
    const el = yaziRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [yanit]);

  // Talep değişince ya da yeni mesaj gelince akışın sonuna in.
  useEffect(() => {
    const el = akisRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [secili?.id, secili?.mesajlar.length, mobilKonusmaAcik]);

  const sonGorunur = secili?.mesajlar[secili.mesajlar.length - 1];
  const yanitBekleniyor = Boolean(secili && secili.durum !== "kapandi" && sonGorunur && !sonGorunur.egitmenMi);
  const cozulduSor = Boolean(
    secili && secili.durum === "yanitlandi" && sonGorunur?.egitmenMi && !devamEdilen.includes(secili.id),
  );
  const bagliKurs = secili?.courseId ? kurslar.find((k) => k.id === secili.courseId) : undefined;

  const gonder = () => {
    if (!secili || (!yanit.trim() && !ekler.hazirEkler.length) || ekler.yukleniyor) return;
    setHata(null);
    startTransition(async () => {
      const r = await mesajGonder(secili.id, yanit, false, ekler.hazirEkler);
      if (r?.error) {
        setHata(r.error);
        bildir.hata(r.error);
      } else {
        setYanit("");
        ekler.temizle();
        router.refresh();
      }
    });
  };

  const kapat = () => {
    if (!secili) return;
    startTransition(async () => {
      const r = await talebimiKapat(secili.id);
      if (r?.error) bildir.hata(r.error);
      else {
        bildir.basarili("Harika! Talep çözüldü olarak kapatıldı.");
        router.refresh();
      }
    });
  };

  const devam = () => {
    if (!secili) return;
    setDevamEdilen((l) => [...l, secili.id]);
    yaziRef.current?.focus();
  };

  const egitimBagla = (courseId: string) => {
    if (!secili) return;
    startTransition(async () => {
      const r = await talebimiEgitimeBagla(secili.id, courseId || null);
      if (r?.error) bildir.hata(r.error);
      else {
        bildir.basarili(courseId ? "Soru eğitime bağlandı." : "Eğitim bağlantısı kaldırıldı.");
        router.refresh();
      }
    });
  };

  const yeniSoruAcildi = (id?: string) => {
    setYeniAcik(false);
    setSuzgec("hepsi");
    router.refresh();
    if (id) sec(id);
  };

  const ortYanit = yanitSuresiDk === null ? null : yanitSuresiDk < 60 ? `~${yanitSuresiDk} dk` : `~${Math.round(yanitSuresiDk / 60)} sa`;
  const basHarf = (ad: string) =>
    ad
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toLocaleUpperCase("tr") || "E";

  return (
    <main className="flex flex-col gap-4 p-4 pb-10 sm:gap-[18px] sm:px-[34px] sm:pt-7 sm:pb-9">
      {/* Başlık bandı: özet sayılar + yeni soru (tasarım). */}
      <section
        className="relative flex flex-col gap-4 overflow-hidden rounded-[20px] px-[18px] py-5 text-white sm:px-[26px] lg:flex-row lg:items-center lg:gap-6"
        style={{ background: "linear-gradient(135deg,#1A3FCC 0%,#0F1E5C 39%,#070B16 100%)" }}
      >
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage: "linear-gradient(120deg,#000 10%,transparent 85%)",
            WebkitMaskImage: "linear-gradient(120deg,#000 10%,transparent 85%)",
          }}
        />
        <div className="relative flex min-w-0 items-start gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-[26px] leading-[1.1] font-extrabold tracking-[-0.03em] sm:text-[28px]">Soru-cevap</h1>
            <p className="mt-1.5 text-[14px] text-[#C9D0E0]">Eğitim boyunca takıldığın her konuyu buradan sorabilirsin.</p>
          </div>
          {/* Telefonda düğme başlığın yanında. */}
          <YeniDugme acik={yeniAcik} onClick={() => setYeniAcik((v) => !v)} className="inline-flex lg:hidden" />
        </div>
        {talepler.length > 0 && (
          <div className={`relative grid lg:ml-auto lg:flex ${ortYanit ? "grid-cols-4" : "grid-cols-3"}`}>
            <BantSayi etiket="Açık" deger={String(sayilar.acik)} />
            <BantSayi etiket="Yanıtlandı" deger={String(sayilar.yanitlandi)} renk={sayilar.yanitlandi ? "#3DDC97" : undefined} />
            <BantSayi etiket="Kapandı" deger={String(sayilar.kapandi)} />
            {ortYanit && <BantSayi etiket="Ort. yanıt" deger={ortYanit} />}
          </div>
        )}
        <YeniDugme acik={yeniAcik} onClick={() => setYeniAcik((v) => !v)} className="relative hidden lg:inline-flex" />
      </section>

      {yeniAcik && (
        <YeniSoru
          benimId={benimId}
          kurslar={kurslar}
          ilkBaslik={aramaParam.get("baslik") ?? ""}
          ilkMesaj={aramaParam.get("mesaj") ?? ""}
          onAcildi={yeniSoruAcildi}
          onVazgec={() => setYeniAcik(false)}
        />
      )}

      {talepler.length === 0 ? (
        !yeniAcik && <BosDurum onYeni={() => setYeniAcik(true)} />
      ) : (
        <div className="grid grid-cols-1 gap-[18px] lg:h-[calc(100dvh-260px)] lg:min-h-[560px] lg:grid-cols-[minmax(300px,380px)_1fr]">
          {/* SOL: liste */}
          <section className="flex min-h-0 flex-col overflow-hidden rounded-[18px] border border-[#E6E8EF] bg-white">
            <div className="flex flex-none flex-col gap-3 p-4">
              <label className="flex h-11 items-center gap-2.5 rounded-[12px] bg-[#F1F3F8] px-3.5 text-[#8A92A6] focus-within:ring-2 focus-within:ring-brand/30">
                <Icon name="search" size={15} />
                <input
                  type="search"
                  value={arama}
                  onChange={(e) => setArama(e.target.value)}
                  placeholder="Konu, mesaj veya #no ara"
                  aria-label="Sorularında ara"
                  className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-[#8A92A6]"
                />
              </label>
              <div className="grid grid-cols-4 gap-1 rounded-[12px] bg-[#F1F3F8] p-1" role="group" aria-label="Duruma göre süz">
                {SUZGECLER.map((s) => {
                  const secim = suzgec === s.deger;
                  return (
                    <button
                      key={s.deger}
                      type="button"
                      onClick={() => setSuzgec(s.deger)}
                      aria-pressed={secim}
                      className={`flex h-9 items-center justify-center gap-1.5 rounded-[9px] text-[12.5px] font-semibold whitespace-nowrap transition ${
                        secim ? "bg-white text-ink shadow-[0_1px_2px_rgba(14,21,38,.08)]" : "text-[#3A3F4F] hover:text-ink"
                      }`}
                    >
                      {s.etiket}
                      <span className={`font-mono text-[10px] ${secim ? "text-brand" : "text-[#8A92A6]"}`}>{sayilar[s.deger]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="min-h-0 flex-1 border-t border-[#EEF0F5] lg:overflow-y-auto">
              {listelenen.length === 0 ? (
                <p className="px-5 py-10 text-center text-[13.5px] text-[#656B7A]">Bu aramayla eşleşen soru yok.</p>
              ) : (
                <ul>
                  {listelenen.map((t) => {
                    const st = DURUM_STIL[t.durum];
                    const secim = t.id === secili?.id;
                    const son = t.mesajlar[t.mesajlar.length - 1];
                    const yeniYanit = t.durum === "yanitlandi" && son?.egitmenMi;
                    return (
                      <li key={t.id} className="border-b border-[#EEF0F5] last:border-b-0">
                        <button
                          type="button"
                          onClick={() => sec(t.id)}
                          aria-current={secim ? "true" : undefined}
                          className={`flex w-full flex-col gap-1.5 border-l-[3px] px-4 py-3.5 text-left transition ${
                            secim ? "lg:border-l-brand lg:bg-[#F5F7FC]" : ""
                          } border-l-transparent hover:bg-[#FAFBFE]`}
                        >
                          <span className="flex items-center gap-2 font-mono text-[10.5px] text-[#8A92A6]">
                            <span className="truncate">
                              <span className="text-brand">#{kisaNo(t.id)}</span> · {t.program}
                            </span>
                            <span className="ml-auto flex-none" title={gunUzun.format(new Date(t.guncelleme))}>
                              {kisaYas(t.guncelleme)}
                            </span>
                          </span>
                          <span className="flex items-center gap-2">
                            <span className={`min-w-0 flex-1 truncate text-[15px] text-ink ${yeniYanit ? "font-extrabold" : "font-bold"}`}>
                              {t.baslik}
                            </span>
                            {yeniYanit && <span className="h-2 w-2 flex-none rounded-full bg-brand" aria-label="Yeni yanıt" />}
                          </span>
                          {son && (
                            <span className="block truncate text-[13px] text-[#3A3F4F]">
                              {son.egitmenMi ? "Eğitmen: " : "Sen: "}
                              {son.metin || (son.ekler.length ? "Ek gönderildi" : "")}
                            </span>
                          )}
                          <span className="flex items-center">
                            <span
                              className="inline-flex items-center gap-[5px] rounded-full px-2 py-[2px] font-mono text-[9.5px] tracking-[0.08em] uppercase"
                              style={{ background: st.bg, color: st.fg }}
                            >
                              <span className="h-[5px] w-[5px] rounded-full" style={{ background: st.nokta }} />
                              {st.etiket}
                            </span>
                            <span className="ml-auto font-mono text-[10px] text-[#8A92A6] uppercase">{t.mesajlar.length} mesaj</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          {/* SAĞ: konuşma — mobilde yalnız seçim varken, tam ekran */}
          {secili ? (
            <section
              aria-label="Konuşma"
              className={`${
                mobilKonusmaAcik ? "fixed inset-0 z-[46] flex" : "hidden"
              } min-h-0 flex-col overflow-hidden bg-white lg:static lg:z-auto lg:flex lg:rounded-[18px] lg:border lg:border-[#E6E8EF]`}
            >
              {/* Telefon: koyu başlık (tasarım). */}
              <header
                className="relative flex flex-none items-center gap-3 px-4 pt-[calc(12px+env(safe-area-inset-top))] pb-3.5 text-white lg:hidden"
                style={{ background: "linear-gradient(135deg,#1A3FCC 0%,#0F1E5C 45%,#070B16 100%)" }}
              >
                <button
                  type="button"
                  onClick={listeyeDon}
                  aria-label="Soru listesine dön"
                  className="grid h-11 w-11 flex-none place-items-center rounded-[12px] bg-white/10 transition active:bg-white/20"
                >
                  <Icon name="arrowLeft" size={19} />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="min-w-0 truncate text-[17px] font-bold">{secili.baslik}</h2>
                    <DurumRozeti durum={secili.durum} koyu />
                  </div>
                  <div className="mt-0.5 truncate font-mono text-[10.5px] text-[#AFC2FF]">
                    #{kisaNo(secili.id)} · {secili.program}
                  </div>
                </div>
              </header>

              {/* Masaüstü başlığı: konu, durum, eğitim seçimi, kapat. */}
              <header className="hidden flex-none flex-wrap items-center gap-3 border-b border-[#EEF0F5] px-6 py-4 lg:flex">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <h2 className="min-w-0 truncate text-[18px] font-bold text-ink">{secili.baslik}</h2>
                    <DurumRozeti durum={secili.durum} />
                  </div>
                  <div className="mt-1 truncate font-mono text-[10.5px] text-[#8A92A6]">
                    #{kisaNo(secili.id)} · açıldı {gunUzun.format(new Date(secili.tarih))} · {secili.mesajlar.length} mesaj
                    {yanitBekleniyor && yanitSuresiDk !== null ? ` · tahmini yanıt ${sureMetni(yanitSuresiDk)}` : ""}
                  </div>
                </div>
                <EgitimSecimi
                  secili={secili}
                  kurslar={kurslar}
                  bagliKurs={bagliKurs}
                  islemde={islemde}
                  onSec={egitimBagla}
                />
                {secili.durum !== "kapandi" && (
                  <button
                    type="button"
                    onClick={kapat}
                    disabled={islemde}
                    className="h-10 rounded-[10px] border border-[#E1E4EC] bg-white px-3.5 text-[13px] font-semibold text-ink transition hover:border-[#188C5A] hover:text-[#157A4E] disabled:opacity-50"
                  >
                    Çözüldü olarak kapat
                  </button>
                )}
              </header>

              {/* Telefon bilgi şeridi: eğitim + tahmini yanıt + kapat. */}
              <div className="flex flex-none flex-wrap items-center gap-x-3 gap-y-2 border-b border-[#EEF0F5] px-4 py-2.5 text-[12.5px] lg:hidden">
                <EgitimSecimi secili={secili} kurslar={kurslar} bagliKurs={bagliKurs} islemde={islemde} onSec={egitimBagla} />
                {yanitBekleniyor && yanitSuresiDk !== null && (
                  <span className="flex items-center gap-1.5 text-[#5C6273]">
                    <Icon name="clock" size={13} />~{sureMetni(yanitSuresiDk)}
                  </span>
                )}
                {secili.durum !== "kapandi" && (
                  <button type="button" onClick={kapat} disabled={islemde} className="ml-auto font-semibold text-[#157A4E] disabled:opacity-50">
                    Çözüldü, kapat
                  </button>
                )}
              </div>

              {/* Akış — ızgaralı zemin, gün ayracı hap. */}
              <div
                ref={akisRef}
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#FBFCFE] px-4 py-5 sm:px-6"
                style={{
                  backgroundImage: "linear-gradient(#EEF0F5 1px,transparent 1px),linear-gradient(90deg,#EEF0F5 1px,transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              >
                {secili.mesajlar.map((m, i) => {
                  const onceki = secili.mesajlar[i - 1];
                  const gunDegisti = !onceki || new Date(onceki.tarih).toDateString() !== new Date(m.tarih).toDateString();
                  const ayniKisi = onceki && onceki.egitmenMi === m.egitmenMi && !gunDegisti;
                  return (
                    <div key={m.id}>
                      {gunDegisti && (
                        <div className="my-4 flex justify-center first:mt-0">
                          <span className="rounded-full border border-[#E6E8EF] bg-white px-3 py-1 font-mono text-[10.5px] tracking-[0.06em] text-[#8A92A6]">
                            {gunEtiketi(m.tarih)}
                          </span>
                        </div>
                      )}
                      {m.egitmenMi ? (
                        /* Eğitmen: solda, avatarlı beyaz balon. */
                        <div className={`flex items-start gap-2.5 ${ayniKisi ? "mt-1.5" : "mt-4"}`}>
                          <span
                            className={`flex h-9 w-9 flex-none items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white ${
                              ayniKisi ? "invisible" : ""
                            }`}
                            aria-hidden
                          >
                            {basHarf(m.gonderenAd)}
                          </span>
                          <div className="flex max-w-[85%] min-w-0 flex-col items-start sm:max-w-[70%]">
                            {!ayniKisi && (
                              <span className="mb-1.5 flex items-center gap-2 text-[13px] font-bold text-ink">
                                {m.gonderenAd}
                                <span className="rounded-full bg-[#EEF2FF] px-1.5 py-[1px] font-mono text-[9px] tracking-[0.08em] text-brand uppercase">
                                  Eğitmen
                                </span>
                              </span>
                            )}
                            <div className="rounded-[4px_16px_16px_16px] border border-[#E6E8EF] bg-white px-4 py-3 text-[14.5px] leading-[1.6] whitespace-pre-line text-ink shadow-[0_1px_2px_rgba(10,13,24,.04)]">
                              {m.metin}
                              <MesajEkleri ekler={m.ekler} koyu={false} />
                            </div>
                            <span className="mt-1 font-mono text-[10px] text-[#8A92A6]" title={gunUzun.format(new Date(m.tarih))}>
                              {saat.format(new Date(m.tarih))}
                            </span>
                          </div>
                        </div>
                      ) : (
                        /* Öğrenci: sağda mavi balon. */
                        <div className={`flex flex-col items-end ${ayniKisi ? "mt-1.5" : "mt-4"}`}>
                          <div className="max-w-[85%] rounded-[16px_16px_4px_16px] bg-brand px-4 py-3 text-[14.5px] leading-[1.6] whitespace-pre-line text-white shadow-[0_6px_16px_-8px_rgba(28,86,243,.6)] sm:max-w-[70%]">
                            {m.metin}
                            <MesajEkleri ekler={m.ekler} koyu />
                          </div>
                          <span className="mt-1 font-mono text-[10px] text-[#8A92A6]" title={gunUzun.format(new Date(m.tarih))}>
                            Sen · {saat.format(new Date(m.tarih))}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Sorun çözüldü mü? — yalnız eğitmen yanıtından sonra */}
              {cozulduSor && (
                <div className="flex flex-none flex-wrap items-center gap-3 border-t border-[#EEF0F5] bg-[rgba(24,140,90,0.06)] px-4 py-3 sm:px-6">
                  <span className="flex min-w-0 flex-1 items-center gap-2 text-[13.5px] font-semibold text-[#157A4E]">
                    <Icon name="check" size={15} />
                    Sorun çözüldü mü?
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={devam}
                      disabled={islemde}
                      className="h-9 rounded-[9px] border border-ink/13 bg-white px-3.5 text-[13px] font-semibold text-[#3A3F4F] transition hover:border-brand hover:text-brand disabled:opacity-50"
                    >
                      Hayır, devam
                    </button>
                    <button
                      type="button"
                      onClick={kapat}
                      disabled={islemde}
                      className="h-9 rounded-[9px] bg-[#188C5A] px-3.5 text-[13px] font-semibold text-white transition hover:bg-[#157A4E] disabled:opacity-50"
                    >
                      Evet, kapat
                    </button>
                  </div>
                </div>
              )}

              {/* Yazma alanı */}
              {secili.durum !== "kapandi" ? (
                <div className="flex-none border-t border-[#EEF0F5] bg-white px-3 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:px-5 sm:py-4">
                  <input
                    ref={dosyaRef}
                    type="file"
                    accept={EK_KABUL}
                    multiple
                    hidden
                    onChange={(e) => {
                      if (e.target.files) void ekler.ekle(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  {ekler.liste.length > 0 && (
                    <div className="mb-2">
                      <BekleyenEkler liste={ekler.liste} onKaldir={ekler.kaldir} />
                    </div>
                  )}
                  <div className="flex items-end gap-2 sm:block sm:overflow-hidden sm:rounded-[14px] sm:border sm:border-[#E1E4EC] sm:transition sm:focus-within:border-brand sm:focus-within:ring-[3px] sm:focus-within:ring-brand/12">
                    {/* Telefon: ek düğmesi solda (kare). */}
                    <button
                      type="button"
                      onClick={() => dosyaRef.current?.click()}
                      disabled={ekler.dolu}
                      aria-label="Ekran görüntüsü veya dosya ekle"
                      className="grid h-11 w-11 flex-none place-items-center rounded-[12px] bg-[#F1F3F8] text-[#3A3F4F] disabled:opacity-40 sm:hidden"
                    >
                      <Icon name="upload" size={17} />
                    </button>
                    <textarea
                      ref={yaziRef}
                      data-odak="sarmal"
                      rows={1}
                      value={yanit}
                      onChange={(e) => setYanit(e.target.value)}
                      onPaste={(e) => {
                        // Panodan ekran görüntüsü yapıştırma: dosya varsa ek olarak al.
                        const dosyalar = Array.from(e.clipboardData.files);
                        if (dosyalar.length) {
                          e.preventDefault();
                          void ekler.ekle(dosyalar);
                        }
                      }}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                          e.preventDefault();
                          gonder();
                        }
                      }}
                      placeholder="Mesajını yaz…"
                      aria-label="Mesajın"
                      className="block max-h-[200px] min-h-11 min-w-0 flex-1 resize-none appearance-none rounded-[12px] border border-[#E1E4EC] bg-white px-3.5 py-2.5 text-[15px] leading-[1.5] text-ink outline-none focus:border-brand sm:w-full sm:rounded-none sm:border-0 sm:px-4 sm:py-3"
                    />
                    <button
                      type="button"
                      onClick={gonder}
                      disabled={islemde || ekler.yukleniyor || (!yanit.trim() && !ekler.hazirEkler.length)}
                      aria-label="Gönder"
                      className="grid h-11 w-11 flex-none place-items-center rounded-[12px] bg-brand text-white transition disabled:opacity-45 sm:hidden"
                    >
                      <Icon name="arrowRight" size={17} />
                    </button>
                    <div className="hidden items-center gap-3 border-t border-[#EEF0F5] px-3 py-2.5 sm:flex">
                      <button
                        type="button"
                        onClick={() => dosyaRef.current?.click()}
                        disabled={ekler.dolu}
                        className="inline-flex h-9 items-center gap-2 rounded-[9px] border border-[#E1E4EC] px-3 text-[13px] font-semibold text-ink transition hover:border-brand hover:text-brand disabled:opacity-40"
                      >
                        <Icon name="upload" size={14} />
                        Ekran görüntüsü / dosya
                      </button>
                      <span className="hidden font-mono text-[10.5px] text-[#8A92A6] lg:inline">⌘/Ctrl + Enter</span>
                      <button
                        type="button"
                        onClick={gonder}
                        disabled={islemde || ekler.yukleniyor || (!yanit.trim() && !ekler.hazirEkler.length)}
                        className="ml-auto inline-flex h-10 items-center gap-2 rounded-[10px] bg-brand px-[18px] text-[13.5px] font-bold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {islemde ? "Gönderiliyor…" : "Gönder →"}
                      </button>
                    </div>
                  </div>
                  {hata && <div className="mt-2 text-sm text-danger-ink">{hata}</div>}
                </div>
              ) : (
                <div className="flex flex-none flex-wrap items-center justify-between gap-3 border-t border-[#EEF0F5] px-4 pt-4 pb-[max(16px,env(safe-area-inset-bottom))] sm:px-6">
                  <span className="text-[13.5px] text-[#656B7A]">Bu talep kapatıldı. Başka bir konuda yeni soru açabilirsin.</span>
                  <button
                    type="button"
                    onClick={() => {
                      listeyeDon();
                      setYeniAcik(true);
                      window.scrollTo({ top: 0, behavior: "instant" });
                    }}
                    className="inline-flex h-9 items-center gap-[6px] rounded-[9px] border border-ink/13 bg-white px-4 text-[13px] font-semibold text-[#3A3F4F] transition hover:border-brand hover:text-brand"
                  >
                    <Icon name="plus" size={13} />
                    Yeni soru
                  </button>
                </div>
              )}
            </section>
          ) : (
            <section className="hidden min-h-[320px] items-center justify-center rounded-[18px] border border-[#E6E8EF] bg-white lg:flex">
              <p className="px-6 text-center text-[14px] text-[#656B7A]">Soldan bir soru seç.</p>
            </section>
          )}
        </div>
      )}
    </main>
  );
}

/** "+ Yeni soru"; görünürlük sınıfları (inline-flex / hidden) çağırandan. */
function YeniDugme({ acik, onClick, className }: { acik: boolean; onClick: () => void; className: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={acik}
      className={`h-11 flex-none items-center gap-1.5 rounded-[12px] bg-white px-4 text-[14px] font-bold text-[#1A44CC] transition hover:bg-[#EEF2FF] sm:h-12 sm:px-5 ${className}`}
    >
      {acik ? "Vazgeç" : "+ Yeni soru"}
    </button>
  );
}

function BantSayi({ etiket, deger, renk }: { etiket: string; deger: string; renk?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 border-l border-white/14 px-3 first:border-l-0 first:pl-0 lg:px-5">
      <span className="text-[20px] leading-none font-extrabold lg:text-[24px]" style={{ color: renk }}>
        {deger}
      </span>
      <span className="truncate font-mono text-[9px] tracking-[0.12em] text-[#AFC2FF] uppercase lg:text-[10px] lg:tracking-[0.14em]">{etiket}</span>
    </div>
  );
}

function DurumRozeti({ durum, koyu = false }: { durum: Durum; koyu?: boolean }) {
  const st = DURUM_STIL[durum];
  return (
    <span
      className="flex-none rounded-full px-2 py-[2px] font-mono text-[9.5px] tracking-[0.08em] uppercase"
      style={koyu ? { background: "rgba(61,220,151,.15)", color: durum === "kapandi" ? "#C9D0E0" : "#3DDC97" } : { background: st.bg, color: st.fg }}
    >
      {st.etiket}
    </span>
  );
}

/** Sorunun bağlı olduğu eğitim: açık talepte değiştirilebilir hap. */
function EgitimSecimi({
  secili,
  kurslar,
  bagliKurs,
  islemde,
  onSec,
}: {
  secili: DestekTalep;
  kurslar: { id: string; ad: string; yuzde: number }[];
  bagliKurs: { id: string; ad: string; yuzde: number } | undefined;
  islemde: boolean;
  onSec: (id: string) => void;
}) {
  if (kurslar.length === 0 || secili.durum === "kapandi") {
    return (
      <span className="flex items-center gap-2 text-[12.5px] font-semibold text-[#3A3F4F]">
        <span className="h-2 w-2 rounded-[2px] bg-brand" />
        {secili.program}
      </span>
    );
  }
  return (
    <label className="relative flex h-10 max-w-[260px] min-w-0 items-center gap-2 rounded-[10px] border border-[#E1E4EC] bg-[#F7F8FB] pr-2 pl-3">
      <span className="h-2 w-2 flex-none rounded-[2px] bg-brand" />
      <span className="sr-only">İlgili eğitim</span>
      <select
        value={secili.courseId ?? ""}
        onChange={(e) => onSec(e.target.value)}
        disabled={islemde}
        className="min-w-0 flex-1 truncate bg-transparent text-[13px] font-semibold text-ink outline-none"
      >
        <option value="">Genel (eğitime bağlı değil)</option>
        {secili.courseId && !bagliKurs && <option value={secili.courseId}>{secili.program}</option>}
        {kurslar.map((k) => (
          <option key={k.id} value={k.id}>
            {k.ad}
          </option>
        ))}
      </select>
    </label>
  );
}

function YeniSoru({
  benimId,
  kurslar,
  ilkBaslik = "",
  ilkMesaj = "",
  onAcildi,
  onVazgec,
}: {
  benimId: string;
  kurslar: { id: string; ad: string }[];
  ilkBaslik?: string;
  ilkMesaj?: string;
  onAcildi: (id?: string) => void;
  onVazgec: () => void;
}) {
  const bildir = useBildirim();
  const [baslik, setBaslik] = useState(ilkBaslik.slice(0, 200));
  const [mesaj, setMesaj] = useState(ilkMesaj.slice(0, 2000));
  const [kurs, setKurs] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [islemde, startTransition] = useTransition();
  const dosyaRef = useRef<HTMLInputElement>(null);
  const ekHata = useCallback((m: string) => bildir.hata(m), [bildir]);
  const ekler = useEkYukleme(benimId, ekHata);

  const gonder = () => {
    setHata(null);
    startTransition(async () => {
      const r = await talepAc(baslik, mesaj, kurs || undefined, ekler.hazirEkler);
      if (r?.error) {
        setHata(r.error);
        bildir.hata(r.error);
      } else {
        bildir.basarili("Sorun iletildi. Yanıtı buradan takip edebilirsin.");
        ekler.temizle();
        onAcildi(r.id);
      }
    });
  };

  return (
    <div className="rounded-2xl border border-brand/30 bg-white p-5 sm:p-6">
      <h2 className="font-heading text-[17px] font-semibold tracking-[-0.02em]">Yeni soru</h2>
      <p className="mt-1 text-[13.5px] text-[#5C6273]">
        Ne denedin ve nerede takıldın — yazdıkça ve ekran görüntüsü ekledikçe daha isabetli yanıt alırsın.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">Konu</span>
          <input
            type="text"
            value={baslik}
            onChange={(e) => setBaslik(e.target.value)}
            placeholder="Kısa bir başlık"
            className="h-[46px] rounded-[10px] border border-ink/13 bg-white px-[14px] text-[15px] text-ink outline-none focus:border-brand"
          />
        </label>
        {kurslar.length > 0 && (
          <label className="flex flex-col gap-2">
            <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">İlgili eğitim</span>
            <select
              value={kurs}
              onChange={(e) => setKurs(e.target.value)}
              className="h-[46px] rounded-[10px] border border-ink/13 bg-white px-[13px] text-sm text-ink outline-none focus:border-brand"
            >
              <option value="">Genel</option>
              {kurslar.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.ad}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <label className="mt-4 flex flex-col gap-2">
        <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">Sorun</span>
        <textarea
          value={mesaj}
          onChange={(e) => setMesaj(e.target.value)}
          onPaste={(e) => {
            const dosyalar = Array.from(e.clipboardData.files);
            if (dosyalar.length) {
              e.preventDefault();
              void ekler.ekle(dosyalar);
            }
          }}
          placeholder="Örn. Kampanyayı yayına aldım ama üç gündür gösterim almıyor; bütçe ve kitle şu şekilde…"
          className="min-h-[130px] resize-y rounded-[10px] border border-ink/13 bg-white px-[14px] py-3 text-[15px] leading-[1.6] text-ink outline-none focus:border-brand"
        />
      </label>

      <div className="mt-3 flex flex-col gap-2">
        <BekleyenEkler liste={ekler.liste} onKaldir={ekler.kaldir} />
        <div>
          <input
            ref={dosyaRef}
            type="file"
            accept={EK_KABUL}
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files) void ekler.ekle(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => dosyaRef.current?.click()}
            disabled={ekler.dolu}
            className="inline-flex h-9 items-center gap-[6px] rounded-[9px] border border-dashed border-ink/20 px-3 text-[13px] font-medium text-[#5C6273] transition hover:border-brand hover:text-brand disabled:opacity-40"
          >
            <Icon name="upload" size={14} />
            Ekran görüntüsü / dosya ekle
          </button>
          <span className="ml-2 text-[11.5px] text-[#8A90A0]">Görsel veya PDF · en fazla 4 dosya, 10 MB</span>
        </div>
      </div>

      {hata && <div className="mt-3 text-sm text-danger-ink">{hata}</div>}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={gonder}
          disabled={islemde || ekler.yukleniyor || !baslik.trim() || !mesaj.trim()}
          className="inline-flex h-[46px] items-center gap-2 rounded-[10px] bg-brand px-6 text-[15px] font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Icon name="check" size={15} />
          {islemde ? "Gönderiliyor…" : "Soruyu gönder"}
        </button>
        <button
          type="button"
          onClick={onVazgec}
          className="h-[46px] rounded-[10px] px-4 text-[14px] font-medium text-[#5C6273] transition hover:text-ink"
        >
          Vazgeç
        </button>
      </div>
    </div>
  );
}

function BosDurum({ onYeni }: { onYeni: () => void }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white px-6 py-16 text-center sm:px-8">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[13px] bg-mist text-[#656B7A]">
        <Icon name="message" size={22} />
      </div>
      <h2 className="mt-4 font-heading text-lg font-semibold tracking-[-0.02em]">Henüz bir soru sormadın</h2>
      <p className="mx-auto mt-[10px] max-w-[430px] text-[14.5px] leading-[1.6] text-[#5C6273]">
        Takıldığın bir konu olduğunda sor; yanıtı burada takip edersin. Ekran görüntüsü eklemek çözümü hızlandırır.
      </p>
      <button
        type="button"
        onClick={onYeni}
        className="mt-5 inline-flex h-11 items-center gap-[7px] rounded-[10px] bg-brand px-5 text-sm font-semibold text-white transition hover:bg-ink"
      >
        <Icon name="plus" size={15} />
        Yeni soru
      </button>
    </div>
  );
}
