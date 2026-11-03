"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { KAYNAK_ADI, turEtiketi, type KaynakTuru } from "@/lib/whatsapp/gorunum";

/**
 * WhatsApp gelen kutusu — Destek masasıyla aynı düzen: solda sohbetler,
 * ortada konuşma, sağda kişi kartı (kaynak, takip kodu, bağlı hesap).
 *
 * Yalnız okuma: yanıtlar telefondaki WhatsApp Business uygulamasından
 * veriliyor ve webhook'la buraya düşüyor. Sayfa açıkken 20 saniyede bir
 * tazeleniyor (sekme görünürken).
 */

export type Konusma = {
  waId: string;
  ad: string | null;
  numara: string;
  sonZaman: string;
  onizleme: string;
  sonGiden: boolean;
  yanitBekliyor: boolean;
  kod: string | null;
  reklam: boolean;
  hesap: boolean;
};

export type KonusmaMesaji = {
  id: string;
  yon: "gelen" | "giden";
  metin: string | null;
  tur: string;
  zaman: string;
  kod: string | null;
  reklam: boolean;
};

export type KisiDetayi = {
  waId: string;
  ad: string | null;
  numara: string;
  ilkMesaj: string | null;
  kaynak: KaynakTuru;
  kod: string | null;
  tiklamaZamani: string | null;
  tiklananSayfa: string | null;
  reklamBasligi: string | null;
  reklamAdresi: string | null;
  hesap: { ad: string; eposta: string | null; kayit: string } | null;
};

type Filtre = "hepsi" | "bekleyen" | "kodlu" | "reklam" | "hesap";
const FILTRELER: { k: Filtre; ad: string }[] = [
  { k: "hepsi", ad: "Tümü" },
  { k: "bekleyen", ad: "Yanıt bekleyen" },
  { k: "kodlu", ad: "Siteden gelen" },
  { k: "reklam", ad: "Reklamdan" },
  { k: "hesap", ad: "Hesabı olan" },
];

const TAZELEME_MS = 20_000;
const BOLGE = "Europe/Istanbul";
const saatFmt = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: BOLGE });
const gunFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: BOLGE });
const kisaGun = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", timeZone: BOLGE });
const tamFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: BOLGE });

function nispi(iso: string): string {
  const dk = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (dk < 1) return "az önce";
  if (dk < 60) return `${dk} dk`;
  const sa = Math.floor(dk / 60);
  if (sa < 24) return `${sa} sa`;
  const gun = Math.floor(sa / 24);
  if (gun < 7) return `${gun} gün`;
  return kisaGun.format(new Date(iso));
}

function harf(ad: string | null, numara: string): string {
  if (ad?.trim()) {
    const p = ad.trim().split(/\s+/);
    return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toLocaleUpperCase("tr");
  }
  return numara.replace(/\D/g, "").slice(-2);
}

const ROZET = "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold";
const DUGME =
  "inline-flex min-h-11 items-center justify-center rounded-[9px] border border-ink/14 bg-white px-3.5 text-[13px] font-semibold text-ink transition hover:border-brand hover:text-brand";

export function WhatsappGelenKutusu({
  numara,
  konusmalar,
  seciliId,
  secimVar,
  mesajlar,
  detay,
  sayilar,
}: {
  numara: string | null;
  konusmalar: Konusma[];
  seciliId: string | null;
  secimVar: boolean;
  mesajlar: KonusmaMesaji[];
  detay: KisiDetayi | null;
  sayilar: { sohbet: number; mesaj: number; eslesen: number; baglanan: number };
}) {
  const router = useRouter();
  const [arama, setArama] = useState("");
  const [filtre, setFiltre] = useState<Filtre>("hepsi");
  const [detayAcik, setDetayAcik] = useState(false);
  const akis = useRef<HTMLDivElement>(null);

  // Yeni mesajlar için sayfa açıkken tazele (sekme arka plandayken değil).
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, TAZELEME_MS);
    return () => clearInterval(t);
  }, [router]);

  // Konuşma açılınca ve yeni mesaj gelince en alta in.
  const sonId = mesajlar[mesajlar.length - 1]?.id;
  useEffect(() => {
    const el = akis.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [seciliId, sonId]);

  const sayac = useMemo(
    () => ({
      hepsi: konusmalar.length,
      bekleyen: konusmalar.filter((k) => k.yanitBekliyor).length,
      kodlu: konusmalar.filter((k) => k.kod).length,
      reklam: konusmalar.filter((k) => k.reklam).length,
      hesap: konusmalar.filter((k) => k.hesap).length,
    }),
    [konusmalar],
  );

  const listelenen = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase("tr");
    const rakam = q.replace(/\D/g, "");
    return konusmalar
      .filter((k) =>
        filtre === "hepsi"
          ? true
          : filtre === "bekleyen"
            ? k.yanitBekliyor
            : filtre === "kodlu"
              ? Boolean(k.kod)
              : filtre === "reklam"
                ? k.reklam
                : k.hesap,
      )
      .filter((k) =>
        !q
          ? true
          : (k.ad ?? "").toLocaleLowerCase("tr").includes(q) ||
            (rakam.length >= 3 && k.waId.includes(rakam)) ||
            (k.kod ?? "").toLocaleLowerCase("tr").includes(q),
      );
  }, [konusmalar, filtre, arama]);

  const secili = konusmalar.find((k) => k.waId === seciliId) ?? null;
  const baslik = secili ? (secili.ad ?? secili.numara) : "";

  return (
    <main className="wa-gelen-kutusu flex h-[calc(100dvh-var(--baslik-h,64px))] flex-col p-3 sm:p-5">
      {/* Başlık + sayılar (telefonda konuşma açıkken gizli: ekran konuşmaya kalsın) */}
      <div className={`${secimVar ? "hidden lg:flex" : "flex"} flex-wrap items-end justify-between gap-4`}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-[22px] leading-[1.1] font-extrabold tracking-[-0.02em] sm:text-[26px]">WhatsApp</h1>
            <span className={`${ROZET} border-emerald-200 bg-emerald-50 text-emerald-700`}>
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
              Bağlı{numara ? ` · ${numara}` : ""}
            </span>
          </div>
          <p className="mt-[5px] text-[13px] text-[#64748b]">
            0850&apos;ye gelen mesajlar ve telefondan verdiğin yanıtlar; sitedeki tıklamalarla eşleşmeleri.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="grid grid-cols-4 gap-2">
            {[
              { e: "Sohbet", v: sayilar.sohbet },
              { e: "Mesaj", v: sayilar.mesaj },
              { e: "Kodu okunan", v: sayilar.eslesen },
              { e: "Hesaba bağlı", v: sayilar.baglanan },
            ].map((k) => (
              <div key={k.e} className="min-w-[72px] rounded-[10px] border border-ink/11 bg-white px-3 py-2">
                <div className="text-[10px] font-bold tracking-[0.05em] text-[#6B7080] uppercase">{k.e}</div>
                <div className="mt-0.5 font-mono text-[19px] font-extrabold text-ink">{k.v}</div>
              </div>
            ))}
          </div>
          <Link href="/kontrol-9f4x2k/whatsapp/ayarlar/" className={DUGME}>
            Ayarlar
          </Link>
        </div>
      </div>

      <div className={`${secimVar ? "mt-0 lg:mt-4" : "mt-4"} grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_300px]`}>
        {/* SOL: sohbetler */}
        <section className={`min-h-0 flex-col rounded-[14px] border border-ink/11 bg-white ${secimVar ? "hidden" : "flex"} lg:flex`}>
          <div className="border-b border-ink/10 p-3">
            <input
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="Ad, numara ya da takip kodu"
              aria-label="Sohbetlerde ara"
              className="h-11 w-full rounded-[9px] border border-ink/13 bg-white px-3 text-[13.5px] outline-none focus:border-brand"
            />
            {/* Telefonda tek satır, yana kaydırılır (sayfa değil yalnız bu satır kayar). */}
            <div className="-mx-3 mt-2 flex gap-1.5 overflow-x-auto px-3 pb-0.5 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
              {FILTRELER.map((f) => (
                <button
                  key={f.k}
                  type="button"
                  onClick={() => setFiltre(f.k)}
                  aria-pressed={filtre === f.k}
                  className={`inline-flex min-h-11 flex-none items-center rounded-full border px-3 text-[12.5px] font-semibold whitespace-nowrap transition ${
                    filtre === f.k ? "border-brand bg-brand/10 text-brand" : "border-ink/12 bg-white text-[#5C6273] hover:text-ink"
                  }`}
                >
                  {f.ad} <span className="ml-1 text-[#6B7080]">{sayac[f.k]}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {listelenen.length === 0 && (
              <div className="p-6 text-center text-[13px] text-[#6B7080]">
                {konusmalar.length === 0 ? "Henüz mesaj yok. 0850'ye gelen ilk mesaj burada görünür." : "Bu filtrede sohbet yok."}
              </div>
            )}
            {listelenen.map((k) => (
              <Link
                key={k.waId}
                href={`?k=${k.waId}`}
                scroll={false}
                className={`flex w-full items-start gap-3 border-b border-ink/[0.06] px-3 py-3 text-left transition hover:bg-mist ${
                  k.waId === seciliId ? "bg-brand/[0.06]" : ""
                }`}
              >
                <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-emerald-50 font-mono text-[12px] font-bold text-emerald-700">
                  {harf(k.ad, k.numara)}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex items-center justify-between gap-2">
                    <span className={`truncate text-[13.5px] ${k.yanitBekliyor ? "font-extrabold text-ink" : "font-semibold text-ink"}`}>
                      {k.ad ?? k.numara}
                    </span>
                    <span className="flex-none text-[11px] text-[#6B7080]" suppressHydrationWarning>
                      {nispi(k.sonZaman)}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className={`truncate text-[12.5px] ${k.yanitBekliyor ? "text-ink" : "text-[#6B7080]"}`}>
                      {k.sonGiden && <span className="text-[#6B7080]">Sen: </span>}
                      {k.onizleme || "—"}
                    </span>
                    {k.yanitBekliyor && <span className="ml-auto h-2.5 w-2.5 flex-none rounded-full bg-emerald-500" title="Yanıt bekliyor" />}
                  </span>
                  {(k.kod || k.reklam || k.hesap) && (
                    <span className="mt-1 flex flex-wrap gap-1">
                      {k.reklam && <span className={`${ROZET} border-brand/25 bg-brand/[0.06] text-brand`}>Reklamdan</span>}
                      {k.kod && <span className={`${ROZET} border-ink/12 bg-ink/[0.04] font-mono text-[#3A3F4F]`}>{k.kod}</span>}
                      {k.hesap && <span className={`${ROZET} border-emerald-200 bg-emerald-50 text-emerald-700`}>Hesap</span>}
                    </span>
                  )}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ORTA: konuşma */}
        <section className={`min-h-0 flex-col rounded-[14px] border border-ink/11 bg-white ${secimVar ? "flex" : "hidden"} lg:flex`}>
          {!secili ? (
            <div className="grid flex-1 place-items-center p-8 text-center text-[13.5px] text-[#6B7080]">
              Soldan bir sohbet seçin.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 border-b border-ink/10 px-3 py-2 sm:px-4">
                <Link href="?" scroll={false} className="inline-flex min-h-11 items-center pr-1 text-[13px] font-semibold text-[#5C6273] lg:hidden">
                  ← Sohbetler
                </Link>
                <span className="hidden h-10 w-10 flex-none place-items-center rounded-full bg-emerald-50 font-mono text-[12px] font-bold text-emerald-700 sm:grid">
                  {harf(secili.ad, secili.numara)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-bold">{baslik}</div>
                  {secili.ad && <div className="truncate font-mono text-[11.5px] text-[#6B7080]">{secili.numara}</div>}
                </div>
                <button type="button" onClick={() => setDetayAcik(true)} className={`${DUGME} xl:hidden`}>
                  Kişi
                </button>
                <a href={`https://wa.me/${secili.waId}`} target="_blank" rel="noopener noreferrer" className={`${DUGME.replace("inline-flex ", "")} hidden sm:inline-flex`}>
                  WhatsApp&apos;ta aç
                </a>
              </div>

              <div ref={akis} className="min-h-0 flex-1 overflow-y-auto bg-[#F6F7F9] px-3 py-4 sm:px-5">
                {mesajlar.map((m, i) => {
                  const gun = gunFmt.format(new Date(m.zaman));
                  const ayrac = i === 0 || gunFmt.format(new Date(mesajlar[i - 1]!.zaman)) !== gun;
                  const giden = m.yon === "giden";
                  const metinsiz = !m.metin?.trim();
                  return (
                    <div key={m.id}>
                      {ayrac && (
                        <div className="my-3 flex justify-center">
                          <span className="rounded-full border border-ink/10 bg-white px-3 py-1 text-[11px] font-semibold text-[#5C6273]">{gun}</span>
                        </div>
                      )}
                      <div className={`mb-2 flex flex-col ${giden ? "items-end" : "items-start"}`}>
                        <div
                          className={`max-w-[85%] rounded-[14px] px-3.5 py-2 text-[13.5px] leading-[1.55] break-words whitespace-pre-wrap shadow-[0_1px_0_rgba(15,23,42,0.04)] sm:max-w-[70%] ${
                            giden ? "rounded-br-[4px] bg-[#DCF5E3] text-ink" : "rounded-bl-[4px] border border-ink/10 bg-white text-ink"
                          }`}
                        >
                          {m.tur !== "text" && (
                            <span className={`block text-[12px] font-semibold text-[#5C6273] ${metinsiz ? "" : "mb-0.5"}`}>
                              {turEtiketi(m.tur)}
                            </span>
                          )}
                          {m.metin}
                          <span className="mt-1 block text-right text-[10.5px] text-[#6B7080]">{saatFmt.format(new Date(m.zaman))}</span>
                        </div>
                        {(m.kod || m.reklam) && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {m.reklam && <span className={`${ROZET} border-brand/25 bg-brand/[0.06] text-brand`}>Reklamdan geldi</span>}
                            {m.kod && (
                              <span className={`${ROZET} border-ink/12 bg-white text-[#3A3F4F]`}>
                                Takip kodu <span className="ml-1 font-mono">{m.kod}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-ink/10 px-4 py-3 text-[12.5px] leading-[1.5] text-[#5C6273]">
                Yanıtları telefondaki WhatsApp Business uygulamasından ver; gönderdiğin yanıt birkaç saniye içinde burada görünür.
              </div>
            </>
          )}
        </section>

        {/* SAĞ: kişi kartı (geniş ekranda sütun, dar ekranda çekmece) */}
        {detay && (
          <>
            <aside className="hidden min-h-0 overflow-y-auto rounded-[14px] border border-ink/11 bg-white p-4 xl:block">
              <KisiKarti d={detay} />
            </aside>
            {detayAcik && (
              <div className="fixed inset-0 z-[120] flex justify-end bg-black/40 xl:hidden" onClick={() => setDetayAcik(false)}>
                <div
                  role="dialog"
                  aria-label="Kişi bilgisi"
                  className="h-full w-[88vw] max-w-[360px] overflow-y-auto bg-white p-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button type="button" onClick={() => setDetayAcik(false)} className={`${DUGME} mb-3`}>
                    Kapat
                  </button>
                  <KisiKarti d={detay} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function Satir({ e, children }: { e: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
      <span className="flex-none text-[#6B7080]">{e}</span>
      <span className="min-w-0 truncate text-right font-medium text-ink">{children}</span>
    </div>
  );
}

function KisiKarti({ d }: { d: KisiDetayi }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 flex-none place-items-center rounded-full bg-emerald-50 font-mono text-[14px] font-bold text-emerald-700">
          {harf(d.ad, d.numara)}
        </span>
        <div className="min-w-0">
          <div className="truncate text-[15px] font-bold">{d.ad ?? d.numara}</div>
          <div className="truncate font-mono text-[11.5px] text-[#6B7080]">{d.numara}</div>
        </div>
      </div>

      <div>
        <div className="mb-2 text-[12px] font-bold tracking-[0.04em] text-[#5C6273] uppercase">Nereden geldi</div>
        <div className="flex flex-col gap-1.5">
          <Satir e="Kaynak">{KAYNAK_ADI[d.kaynak]}</Satir>
          {d.reklamBasligi && <Satir e="Reklam">{d.reklamBasligi}</Satir>}
          <Satir e="Takip kodu">{d.kod ? <span className="font-mono">{d.kod}</span> : "—"}</Satir>
          {d.tiklamaZamani && <Satir e="Sitede tıklama">{tamFmt.format(new Date(d.tiklamaZamani))}</Satir>}
          {d.tiklananSayfa && <Satir e="Sayfa">{d.tiklananSayfa}</Satir>}
          {d.ilkMesaj && <Satir e="İlk mesaj">{tamFmt.format(new Date(d.ilkMesaj))}</Satir>}
        </div>
        {d.kaynak === "dogrudan" && (
          <p className="mt-2 text-[12px] leading-[1.5] text-[#6B7080]">
            Mesajda takip kodu yok: kişi numarayı doğrudan yazmış ya da kodu silmiş.
          </p>
        )}
      </div>

      <div>
        <div className="mb-2 text-[12px] font-bold tracking-[0.04em] text-[#5C6273] uppercase">Hesap</div>
        {d.hesap ? (
          <div className="flex flex-col gap-1.5 rounded-[10px] border border-emerald-200 bg-emerald-50/50 p-3">
            <Satir e="Ad">{d.hesap.ad}</Satir>
            {d.hesap.eposta && <Satir e="E-posta">{d.hesap.eposta}</Satir>}
            <Satir e="Kayıt">{kisaGun.format(new Date(d.hesap.kayit))}</Satir>
          </div>
        ) : (
          <p className="text-[12.5px] leading-[1.5] text-[#6B7080]">
            Bu numarayla açılmış hesap yok. Kişi aynı telefonla kayıt olursa tıklama kendiliğinden hesaba bağlanır.
          </p>
        )}
      </div>

      <a href={`https://wa.me/${d.waId}`} target="_blank" rel="noopener noreferrer" className={DUGME}>
        WhatsApp&apos;ta aç
      </a>
    </div>
  );
}
