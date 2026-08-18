"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { talepAc, mesajGonder, talepDurumDegistir } from "@/app/destek-actions";
import type { DestekTalep } from "@/lib/destek";
import { Icon } from "@/components/Icon";
import { useBildirim } from "@/components/Bildirim";

/**
 * Destek masası — hem yöneticinin hem öğrencinin kullandığı ekran.
 *
 * Tek bileşen olmasının sebebi: bu bir YAZIŞMA. İki taraf aynı konuşmaya
 * bakıyor ve ekranın iki panelde farklı davranması, "acaba karşı taraf ne
 * görüyor" sorusunu her seferinde yeniden doğuruyor. Rol yalnızca yetkiyi
 * (durum değiştirme) ve kimin adının yazılacağını belirliyor.
 *
 * Yerleşim gerçek bir gelen kutusu gibi: solda liste, sağda konuşma, yazma
 * alanı altta sabit. Önceki hâlde yazışma sayfanın içinde 460 piksellik bir
 * kutuya sıkışıyordu; uzun bir konuşmada hem liste hem sayfa hem kutu ayrı
 * ayrı kayıyor, insan nerede olduğunu kaybediyordu.
 */

type Durum = "acik" | "yanitlandi" | "kapandi";

const DURUM_STIL: Record<Durum, { etiket: string; nokta: string; bg: string; fg: string }> = {
  acik: { etiket: "Açık", nokta: "#1C56F3", bg: "rgba(28,86,243,0.11)", fg: "#1C56F3" },
  yanitlandi: { etiket: "Yanıtlandı", nokta: "#188C5A", bg: "rgba(24,140,90,0.13)", fg: "#157A4E" },
  kapandi: { etiket: "Kapandı", nokta: "#8A90A0", bg: "rgba(10,13,24,0.07)", fg: "#5C6273" },
};

const SUZGECLER: { deger: "hepsi" | Durum; etiket: string }[] = [
  { deger: "hepsi", etiket: "Tümü" },
  { deger: "acik", etiket: "Açık" },
  { deger: "yanitlandi", etiket: "Yanıtlandı" },
  { deger: "kapandi", etiket: "Kapandı" },
];

const saat = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  hour: "2-digit",
  minute: "2-digit",
});

const gunUzun = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** Listede "3 sa" gibi kısa yaş; tam tarih başlık (title) olarak duruyor. */
function kisaYas(tarih: string): string {
  const fark = Date.now() - new Date(tarih).getTime();
  const dk = Math.round(fark / 60000);
  if (dk < 1) return "şimdi";
  if (dk < 60) return `${dk} dk`;
  const sa = Math.round(dk / 60);
  if (sa < 24) return `${sa} sa`;
  const gun = Math.round(sa / 24);
  if (gun < 7) return `${gun} g`;
  return gunUzun.format(new Date(tarih)).replace(/ \d{4}$/, "");
}

/** Mesaj akışındaki gün ayracı. */
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

function basHarfler(ad: string): string {
  return (
    ad
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toLocaleUpperCase("tr") ?? "")
      .join("") || "?"
  );
}

export function TalepGorunumu({
  talepler,
  benimId,
  rol,
  kurslar = [],
}: {
  talepler: DestekTalep[];
  benimId: string;
  rol: "admin" | "ogrenci";
  kurslar?: { id: string; ad: string }[];
}) {
  const router = useRouter();
  const bildir = useBildirim();
  const adminMi = rol === "admin";

  const [seciliId, setSeciliId] = useState<string | null>(talepler[0]?.id ?? null);
  const [suzgec, setSuzgec] = useState<"hepsi" | Durum>("hepsi");
  const [arama, setArama] = useState("");
  const [yanit, setYanit] = useState("");
  const [yeniAcik, setYeniAcik] = useState(false);
  const [yeniBaslik, setYeniBaslik] = useState("");
  const [yeniMesaj, setYeniMesaj] = useState("");
  const [yeniKurs, setYeniKurs] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [islemde, startTransition] = useTransition();
  const akisRef = useRef<HTMLDivElement>(null);

  const sayilar = useMemo(
    () => ({
      hepsi: talepler.length,
      acik: talepler.filter((t) => t.durum === "acik").length,
      yanitlandi: talepler.filter((t) => t.durum === "yanitlandi").length,
      kapandi: talepler.filter((t) => t.durum === "kapandi").length,
    }),
    [talepler],
  );

  const listelenen = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase("tr");
    return talepler.filter((t) => {
      if (suzgec !== "hepsi" && t.durum !== suzgec) return false;
      if (!q) return true;
      const havuz = `${t.baslik} ${t.kisiAd} ${t.program}`.toLocaleLowerCase("tr");
      return havuz.includes(q);
    });
  }, [talepler, suzgec, arama]);

  /*
    Seçim durumdan DEĞİL, listeden türetiliyor.

    Süzgeç seçili talebi listeden düşürebiliyor. Bunu bir effect'le state'e
    yazmak (seç → effect → yeniden çiz) fazladan bir tur ve kısa bir "boş
    panel" karesi demek. Türetince o kare hiç oluşmuyor: seçili talep listede
    yoksa listenin ilki gösteriliyor.
  */
  const secili = listelenen.find((t) => t.id === seciliId) ?? listelenen[0] ?? null;

  // Yeni mesaj gelince ya da başka talebe geçince akışın sonuna in.
  useEffect(() => {
    const el = akisRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [seciliId, secili?.mesajlar.length]);

  const gonder = () => {
    if (!secili || !yanit.trim()) return;
    setHata(null);
    startTransition(async () => {
      const r = await mesajGonder(secili.id, yanit);
      if (r?.error) {
        setHata(r.error);
        bildir.hata(r.error);
      } else {
        setYanit("");
        router.refresh();
      }
    });
  };

  const ac = () => {
    setHata(null);
    startTransition(async () => {
      const r = await talepAc(yeniBaslik, yeniMesaj, yeniKurs || undefined);
      if (r?.error) {
        setHata(r.error);
        bildir.hata(r.error);
      } else {
        bildir.basarili("Sorun iletildi. Yanıtı buradan takip edebilirsin.");
        setYeniBaslik("");
        setYeniMesaj("");
        setYeniKurs("");
        setYeniAcik(false);
        router.refresh();
      }
    });
  };

  const durumDegistir = (durum: Durum) => {
    if (!secili) return;
    startTransition(async () => {
      const r = await talepDurumDegistir(secili.id, durum);
      if (r?.error) bildir.hata(r.error);
      else {
        bildir.basarili("Talep durumu güncellendi.");
        router.refresh();
      }
    });
  };

  return (
    <main className="flex flex-col gap-[18px] p-4 pb-10 sm:p-7">
      {/* Başlık şeridi */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
            {adminMi ? "Destek masası" : "Soru-cevap"}
          </h1>
          <p className="mt-[7px] text-[14.5px] text-[#5C6273]">
            {adminMi
              ? "Katılımcılardan gelen tüm yazışmalar tek yerde."
              : "Eğitim boyunca takıldığın her konuyu buradan sorabilirsin."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {adminMi && (
            <div className="flex items-center gap-2">
              <Ozet etiket="Açık" deger={sayilar.acik} vurgulu />
              <Ozet etiket="Yanıtlandı" deger={sayilar.yanitlandi} />
              <Ozet etiket="Toplam" deger={sayilar.hepsi} />
            </div>
          )}
          {!adminMi && (
            <button
              type="button"
              onClick={() => setYeniAcik((v) => !v)}
              className="inline-flex h-11 items-center gap-[7px] rounded-[10px] bg-brand px-5 text-sm font-semibold text-white transition hover:bg-ink"
            >
              {!yeniAcik && <Icon name="plus" size={15} />}
              {yeniAcik ? "Vazgeç" : "Yeni soru"}
            </button>
          )}
        </div>
      </div>

      {/* Yeni soru formu */}
      {yeniAcik && (
        <div className="rounded-2xl border border-brand/30 bg-white p-5 sm:p-6">
          <h2 className="font-heading text-[17px] font-semibold tracking-[-0.02em]">Yeni soru</h2>
          <p className="mt-1 text-[13.5px] text-[#5C6273]">
            Ne denedin ve nerede takıldın — yazdıkça daha isabetli yanıt alırsın.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">Konu</span>
              <input
                type="text"
                value={yeniBaslik}
                onChange={(e) => setYeniBaslik(e.target.value)}
                placeholder="Kısa bir başlık"
                className="h-[46px] rounded-[10px] border border-ink/13 bg-white px-[14px] text-[15px] text-ink outline-none focus:border-brand"
              />
            </label>
            {kurslar.length > 0 && (
              <label className="flex flex-col gap-2">
                <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">İlgili eğitim</span>
                <select
                  value={yeniKurs}
                  onChange={(e) => setYeniKurs(e.target.value)}
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
              value={yeniMesaj}
              onChange={(e) => setYeniMesaj(e.target.value)}
              placeholder="Örn. Kampanyayı yayına aldım ama üç gündür gösterim almıyor; bütçe ve kitle şu şekilde…"
              className="min-h-[130px] resize-y rounded-[10px] border border-ink/13 bg-white px-[14px] py-3 text-[15px] leading-[1.6] text-ink outline-none focus:border-brand"
            />
          </label>

          {hata && <div className="mt-3 text-sm text-danger-ink">{hata}</div>}

          <button
            type="button"
            onClick={ac}
            disabled={islemde || !yeniBaslik.trim() || !yeniMesaj.trim()}
            className="mt-4 inline-flex h-[46px] items-center gap-2 rounded-[10px] bg-brand px-6 text-[15px] font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Icon name="check" size={15} />
            {islemde ? "Gönderiliyor…" : "Soruyu gönder"}
          </button>
        </div>
      )}

      {talepler.length === 0 ? (
        <BosDurum adminMi={adminMi} />
      ) : (
        /*
          Yükseklik ekrana sabitleniyor: gelen kutusu mantığında liste ve
          konuşma kendi içinde kayar, sayfa kaymaz. 100dvh — mobil tarayıcı
          çubuğu açılıp kapandığında 100vh yanlış ölçüyor.
        */
        <div className="grid min-h-[560px] grid-cols-1 gap-[18px] lg:h-[calc(100dvh-230px)] lg:grid-cols-[minmax(300px,360px)_1fr]">
          {/* Sol: liste */}
          <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white">
            <div className="flex flex-none flex-col gap-3 border-b border-ink/8 px-4 py-[14px]">
              <label className="relative block">
                <span className="pointer-events-none absolute top-1/2 left-[12px] -translate-y-1/2 text-[#8A90A0]">
                  <Icon name="search" size={15} />
                </span>
                <input
                  type="search"
                  value={arama}
                  onChange={(e) => setArama(e.target.value)}
                  placeholder={adminMi ? "Kişi veya konu ara" : "Konu ara"}
                  aria-label="Taleplerde ara"
                  className="h-10 w-full rounded-[9px] border border-ink/12 bg-mist pr-3 pl-[34px] text-[14px] text-ink outline-none focus:border-brand focus:bg-white"
                />
              </label>

              <div className="flex flex-wrap gap-[6px]">
                {SUZGECLER.map((s) => {
                  const secim = suzgec === s.deger;
                  const adet = sayilar[s.deger];
                  return (
                    <button
                      key={s.deger}
                      type="button"
                      onClick={() => setSuzgec(s.deger)}
                      aria-pressed={secim}
                      className="inline-flex h-[30px] items-center gap-[6px] rounded-full border px-[11px] text-[12.5px] font-medium transition"
                      style={{
                        borderColor: secim ? "#1C56F3" : "rgba(10,13,24,0.12)",
                        background: secim ? "rgba(28,86,243,0.08)" : "#FFFFFF",
                        color: secim ? "#1C56F3" : "#5C6273",
                      }}
                    >
                      {s.etiket}
                      <span className="font-mono text-[10.5px] opacity-70">{adet}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {listelenen.length === 0 ? (
                <p className="px-5 py-10 text-center text-[13.5px] text-[#656B7A]">
                  Bu süzgeçle eşleşen talep yok.
                </p>
              ) : (
                listelenen.map((t) => {
                  const st = DURUM_STIL[t.durum];
                  const secim = t.id === seciliId;
                  const son = t.mesajlar[t.mesajlar.length - 1];
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSeciliId(t.id)}
                      aria-current={secim ? "true" : undefined}
                      className={`flex w-full gap-3 border-b border-l-[3px] border-ink/7 px-4 py-[13px] text-left transition last:border-b-0 ${
                        secim ? "border-l-brand bg-[#F5F8FF]" : "border-l-transparent hover:bg-[#FAFBFE]"
                      }`}
                    >
                      {adminMi && (
                        <span className="mt-[2px] flex h-9 w-9 flex-none items-center justify-center rounded-full bg-mist font-heading text-[12.5px] font-semibold text-[#5C6273]">
                          {basHarfler(t.kisiAd)}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-ink">
                            {t.baslik}
                          </span>
                          <span
                            className="mt-[1px] h-[7px] w-[7px] flex-none rounded-full"
                            style={{ background: st.nokta }}
                            title={st.etiket}
                          />
                        </span>
                        {son && (
                          <span className="mt-[3px] block truncate text-[12.5px] text-[#656B7A]">
                            {son.egitmenMi ? "Eğitmen: " : adminMi ? "" : "Sen: "}
                            {son.metin}
                          </span>
                        )}
                        <span className="mt-[5px] flex items-center gap-[6px] font-mono text-[10px] text-[#8A90A0]">
                          {adminMi && <span className="truncate">{t.kisiAd}</span>}
                          {adminMi && <span>·</span>}
                          <span className="truncate">{t.program}</span>
                          <span>·</span>
                          <span
                            className="flex-none"
                            title={gunUzun.format(new Date(t.guncelleme))}
                          >
                            {kisaYas(t.guncelleme)}
                          </span>
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* Sağ: konuşma */}
          {secili ? (
            <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white">
              <header className="flex flex-none flex-wrap items-center gap-3 border-b border-ink/8 px-5 py-[15px] sm:px-6">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate font-heading text-[17px] font-semibold tracking-[-0.02em]">
                      {secili.baslik}
                    </h2>
                    <span
                      className="flex-none rounded-full px-[9px] py-[3px] font-mono text-[9px] tracking-[0.08em] uppercase"
                      style={{ background: DURUM_STIL[secili.durum].bg, color: DURUM_STIL[secili.durum].fg }}
                    >
                      {DURUM_STIL[secili.durum].etiket}
                    </span>
                  </div>
                  <div className="mt-[4px] truncate font-mono text-[10.5px] text-[#656B7A]">
                    {adminMi ? `${secili.kisiAd} · ` : ""}
                    {secili.program} · {secili.mesajlar.length} mesaj
                  </div>
                </div>

                {adminMi && (
                  <div className="flex flex-none items-center gap-2">
                    <select
                      aria-label="Talep durumu"
                      value={secili.durum}
                      disabled={islemde}
                      onChange={(e) => durumDegistir(e.target.value as Durum)}
                      className="h-9 rounded-[9px] border border-ink/13 bg-white px-[11px] text-[13px] font-semibold text-ink outline-none focus:border-brand"
                    >
                      <option value="acik">Açık</option>
                      <option value="yanitlandi">Yanıtlandı</option>
                      <option value="kapandi">Kapandı</option>
                    </select>
                  </div>
                )}
              </header>

              {/* Akış */}
              <div ref={akisRef} className="min-h-0 flex-1 overflow-y-auto bg-[#FBFCFE] px-4 py-5 sm:px-6">
                {secili.mesajlar.map((m, i) => {
                  const onceki = secili.mesajlar[i - 1];
                  const gunDegisti =
                    !onceki || new Date(onceki.tarih).toDateString() !== new Date(m.tarih).toDateString();
                  // Arka arkaya aynı kişiden gelen mesajlarda ad tekrar
                  // yazılmıyor; konuşma böyle daha az gürültülü okunuyor.
                  const ayniKisi = onceki && onceki.egitmenMi === m.egitmenMi && !gunDegisti;
                  const benim = m.gonderenId === benimId;

                  return (
                    <div key={m.id}>
                      {gunDegisti && (
                        <div className="my-4 flex items-center gap-3 first:mt-0">
                          <span className="h-px flex-1 bg-ink/8" />
                          <span className="font-mono text-[9.5px] tracking-[0.12em] text-[#8A90A0] uppercase">
                            {gunEtiketi(m.tarih)}
                          </span>
                          <span className="h-px flex-1 bg-ink/8" />
                        </div>
                      )}

                      <div
                        className={`flex flex-col ${m.egitmenMi ? "items-start" : "items-end"} ${
                          ayniKisi ? "mt-[6px]" : "mt-4"
                        }`}
                      >
                        {!ayniKisi && (
                          <span className="mb-[6px] flex items-center gap-[7px] px-1">
                            <span
                              className="rounded-full px-[8px] py-[2px] font-mono text-[9px] tracking-[0.09em] uppercase"
                              style={
                                m.egitmenMi
                                  ? { background: "rgba(28,86,243,0.13)", color: "#1C56F3" }
                                  : { background: "rgba(10,13,24,0.07)", color: "#5C6273" }
                              }
                            >
                              {m.egitmenMi ? "Eğitmen" : "Katılımcı"}
                            </span>
                            <span className="font-mono text-[10px] text-[#8A90A0]">
                              {benim ? "Sen" : m.gonderenAd}
                            </span>
                          </span>
                        )}

                        <div
                          className="max-w-[86%] px-[15px] py-[11px] text-[14.5px] leading-[1.62] whitespace-pre-line sm:max-w-[74%]"
                          style={
                            m.egitmenMi
                              ? {
                                  background: "#1C56F3",
                                  color: "#FFFFFF",
                                  borderRadius: ayniKisi ? "6px 14px 14px 6px" : "14px 14px 14px 5px",
                                  boxShadow: "0 1px 2px rgba(28,86,243,0.25)",
                                }
                              : {
                                  background: "#FFFFFF",
                                  color: "#2B303D",
                                  border: "1px solid rgba(10,13,24,0.09)",
                                  borderRadius: ayniKisi ? "14px 6px 6px 14px" : "14px 14px 5px 14px",
                                  boxShadow: "0 1px 2px rgba(10,13,24,0.04)",
                                }
                          }
                        >
                          {m.metin}
                        </div>

                        <span
                          className="mt-[4px] px-1 font-mono text-[9.5px] text-[#8A90A0]"
                          title={gunUzun.format(new Date(m.tarih))}
                        >
                          {saat.format(new Date(m.tarih))}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Yazma alanı */}
              {secili.durum !== "kapandi" ? (
                <div className="flex-none border-t border-ink/8 px-4 py-4 sm:px-6">
                  <div className="rounded-[12px] border border-ink/13 bg-white transition focus-within:border-brand">
                    <textarea
                      value={yanit}
                      onChange={(e) => setYanit(e.target.value)}
                      onKeyDown={(e) => {
                        // Ctrl/⌘+Enter ile gönder. Düz Enter satır atlıyor:
                        // buradaki mesajlar çoğu zaman birkaç paragraf.
                        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                          e.preventDefault();
                          gonder();
                        }
                      }}
                      placeholder={adminMi ? "Yanıtını yaz…" : "Mesajını yaz…"}
                      className="min-h-[78px] w-full resize-y bg-transparent px-[14px] py-3 text-[15px] leading-[1.6] text-ink outline-none"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/7 px-[14px] py-[10px]">
                      <span className="font-mono text-[10px] text-[#8A90A0]">⌘/Ctrl + Enter ile gönder</span>
                      <button
                        type="button"
                        onClick={gonder}
                        disabled={islemde || !yanit.trim()}
                        className="inline-flex h-[38px] items-center gap-[7px] rounded-[9px] bg-brand px-[18px] text-[13.5px] font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <Icon name="arrowRight" size={14} />
                        {islemde ? "Gönderiliyor…" : "Gönder"}
                      </button>
                    </div>
                  </div>
                  {hata && <div className="mt-2 text-sm text-danger-ink">{hata}</div>}
                </div>
              ) : (
                <div className="flex flex-none flex-wrap items-center justify-between gap-3 border-t border-ink/8 px-5 py-4 sm:px-6">
                  <span className="text-[13.5px] text-[#656B7A]">
                    Bu talep kapatıldı. {adminMi ? "" : "Yeni bir soru açabilirsin."}
                  </span>
                  {adminMi && (
                    <button
                      type="button"
                      onClick={() => durumDegistir("acik")}
                      disabled={islemde}
                      className="inline-flex h-9 items-center gap-[6px] rounded-[9px] border border-ink/13 bg-white px-4 text-[13px] font-semibold text-[#3A3F4F] transition hover:border-brand hover:text-brand disabled:opacity-50"
                    >
                      Yeniden aç
                    </button>
                  )}
                </div>
              )}
            </section>
          ) : (
            <section className="flex min-h-[320px] items-center justify-center rounded-2xl border border-ink/10 bg-white">
              <p className="px-6 text-center text-[14px] text-[#656B7A]">Soldan bir talep seç.</p>
            </section>
          )}
        </div>
      )}
    </main>
  );
}

function Ozet({ etiket, deger, vurgulu }: { etiket: string; deger: number; vurgulu?: boolean }) {
  return (
    <div
      className="rounded-[11px] border px-[14px] py-[9px]"
      style={{
        borderColor: vurgulu && deger > 0 ? "rgba(28,86,243,0.3)" : "rgba(10,13,24,0.1)",
        background: vurgulu && deger > 0 ? "rgba(28,86,243,0.05)" : "#FFFFFF",
      }}
    >
      <div className="font-mono text-[9px] tracking-[0.13em] text-[#656B7A] uppercase">{etiket}</div>
      <div
        className="mt-[3px] font-heading text-[19px] leading-none font-semibold tracking-[-0.02em]"
        style={{ color: vurgulu && deger > 0 ? "#1C56F3" : "#0A0D18" }}
      >
        {deger}
      </div>
    </div>
  );
}

function BosDurum({ adminMi }: { adminMi: boolean }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white px-6 py-16 text-center sm:px-8">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[13px] bg-mist text-[#656B7A]">
        <Icon name="message" size={22} />
      </div>
      <h2 className="mt-4 font-heading text-lg font-semibold tracking-[-0.02em]">
        {adminMi ? "Gelen kutusu boş" : "Henüz bir soru sormadın"}
      </h2>
      <p className="mx-auto mt-[10px] max-w-[430px] text-[14.5px] leading-[1.6] text-[#5C6273]">
        {adminMi
          ? "Katılımcılar soru açtığında yazışmalar burada toplanır."
          : "Takıldığın bir konu olduğunda “Yeni soru” ile yaz; yanıtı burada takip edersin."}
      </p>
    </div>
  );
}
