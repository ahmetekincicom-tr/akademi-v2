import Link from "next/link";
import { getEgitimOturumlarim, getKayitArsivim, type EgitimOturumu } from "@/lib/egitim-oturumu";
import { getSiteIcerik } from "@/lib/site-icerik";
import { guvenliUrl } from "@/lib/guvenli-url";
import { oynatmaCoz } from "@/lib/oynatma";
import { platformAdi } from "@/lib/platform";
import { gunFarki, trGun } from "@/lib/tarih-satiri";
import { TR_ZAMAN } from "@/lib/zaman";
import { Icon } from "@/components/Icon";
import { GorulduIsareti } from "@/components/panel/GorulduIsareti";
import { BirebirTakvim, type TakvimOturumu } from "@/components/panel/BirebirTakvim";
import { GecmisOturumlar, type GecmisSatir } from "@/components/panel/GecmisOturumlar";

/**
 * Birebir eğitim — "Birebir Eğitim" tasarımı (masaüstü + mobil).
 *
 * Kaynaklar değişmedi: takvim egitim_oturumlari'ndan, kayıtlar kişiye bağlı
 * kayıt arşivinden (getKayitArsivim). Eğitim bittikten sonraki görüşme
 * hakları ayrı sayfada (/panel/gorusmeler).
 *
 * Düğmeler:
 *  - Derse katıl: toplantı bağlantısı varsa (yoksa not).
 *  - Takvime ekle: tek oturumluk .ics (birebir-egitim/takvim/[id]).
 *  - Erteleme talebi: soru-cevapta oturum bilgisiyle doldurulmuş yeni soru;
 *    ayrı bir erteleme sistemi yok, talep eğitmene oradan ulaşıyor.
 */

const AY_KISA = new Intl.DateTimeFormat("tr-TR", { timeZone: TR_ZAMAN, month: "short" });
const AY_UZUN = new Intl.DateTimeFormat("tr-TR", { timeZone: TR_ZAMAN, month: "long" });
const GUN_ADI = new Intl.DateTimeFormat("tr-TR", { timeZone: TR_ZAMAN, weekday: "long" });
const GUN_KISA = new Intl.DateTimeFormat("tr-TR", { timeZone: TR_ZAMAN, weekday: "short" });
const SAAT = new Intl.DateTimeFormat("tr-TR", { timeZone: TR_ZAMAN, hour: "2-digit", minute: "2-digit" });
const TARIH = new Intl.DateTimeFormat("tr-TR", { timeZone: TR_ZAMAN, day: "numeric", month: "short", year: "numeric" });

const buyuk = (s: string) => s.replace(".", "").toLocaleUpperCase("tr");
const kisaltma = (s: string) => s.replace(".", "");

function saatAraligi(o: EgitimOturumu) {
  const bas = new Date(o.baslangic);
  const bit = new Date(bas.getTime() + o.sureDk * 60_000);
  return `${SAAT.format(bas)} – ${SAAT.format(bit)}`;
}

function kalanMetni(gun: number) {
  if (gun <= 0) return "bugün";
  if (gun === 1) return "yarın";
  return `${gun} gün sonra`;
}

export default async function PanelBirebirEgitimPage() {
  const [oturumlar, arsiv, icerik] = await Promise.all([getEgitimOturumlarim(), getKayitArsivim(), getSiteIcerik()]);

  const simdi = new Date();
  const anlik = simdi.getTime();
  const bitis = (o: EgitimOturumu) => new Date(o.baslangic).getTime() + o.sureDk * 60_000;

  // Canlı: başlamış ama bitmemiş planlı oturum. Sıradaki: canlı yoksa ilk gelecek.
  const planli = oturumlar.filter((o) => o.durum === "planlandi");
  const canli = planli.find((o) => new Date(o.baslangic).getTime() <= anlik && anlik < bitis(o)) ?? null;
  const gelecek = planli.filter((o) => new Date(o.baslangic).getTime() > anlik);
  const siradaki = canli ?? gelecek[0] ?? null;
  const sonrakiler = gelecek.filter((o) => o.id !== siradaki?.id);
  const gecmis = oturumlar
    .filter((o) => o.id !== siradaki?.id && (o.durum !== "planlandi" || bitis(o) <= anlik))
    .reverse(); // en yeni üstte

  // "Oturum 04 / 12": iptaller sayılmıyor; sıra başlangıç tarihine göre.
  const sayilan = oturumlar.filter((o) => o.durum !== "iptal");
  const sira = (o: EgitimOturumu) => String(sayilan.findIndex((x) => x.id === o.id) + 1).padStart(2, "0");

  const bugun = trGun(simdi);
  const takvim: TakvimOturumu[] = oturumlar
    .filter((o) => o.durum !== "iptal")
    .map((o) => {
      const g = trGun(new Date(o.baslangic));
      return {
        id: o.id,
        ...g,
        saat: SAAT.format(new Date(o.baslangic)),
        tur: o.id === siradaki?.id ? "siradaki" : o.durum === "tamamlandi" || bitis(o) <= anlik ? "tamamlandi" : "planlandi",
      };
    });
  const acilisAyi = siradaki ? trGun(new Date(siradaki.baslangic)) : bugun;

  const klasorler = arsiv
    .map((a) => ({ ...a, kaynak: guvenliUrl(a.link) }))
    .filter((a): a is typeof a & { kaynak: string } => Boolean(a.kaynak));
  const ilkKlasor = klasorler[0]?.kaynak ?? null;

  const gecmisSatirlar: GecmisSatir[] = gecmis.map((o) => {
    const kaynak = guvenliUrl(o.kayitLink);
    const bas = new Date(o.baslangic);
    return {
      id: o.id,
      tarih: TARIH.format(bas),
      saat: `${kisaltma(GUN_KISA.format(bas))} · ${SAAT.format(bas)}`,
      konu: o.konu || "Eğitim oturumu",
      alt: o.program,
      sureDk: o.sureDk,
      durum: o.durum,
      kayit: kaynak ? { video: oynatmaCoz(o.kayitLink), kaynak } : null,
    };
  });

  const egitmen = icerik.egitmenAd || "Eğitmen";
  const egitmenBas = egitmen
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toLocaleUpperCase("tr");

  const erteleme = siradaki
    ? `/panel/soru-cevap?${new URLSearchParams({
        yeni: "1",
        baslik: `Oturum erteleme talebi: ${siradaki.konu || "birebir eğitim"}`,
        mesaj: `${TARIH.format(new Date(siradaki.baslangic))} ${saatAraligi(siradaki)} tarihli "${
          siradaki.konu || "birebir eğitim"
        }" oturumunu ertelemek istiyorum. Uygun olduğum zamanlar: `,
      })}`
    : null;

  const yaklasanListe = (
    <ul className="flex flex-col gap-1">
      {sonrakiler.slice(0, 4).map((o) => {
        const t = new Date(o.baslangic);
        return (
          <li key={o.id} className="flex items-center gap-3.5 rounded-[12px] p-1 lg:p-2.5 lg:hover:bg-[#F6F7FB]">
            <span className="flex h-[52px] w-[48px] flex-none flex-col items-center justify-center rounded-[10px] bg-ink text-white lg:h-[54px] lg:w-[50px]">
              <span className="font-mono text-[9px] text-[#8FAEFF]">{buyuk(AY_KISA.format(t))}</span>
              <span className="text-[19px] font-extrabold">{String(trGun(t).gun).padStart(2, "0")}</span>
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <span className="truncate text-[14px] font-bold text-ink">{o.konu || "Eğitim oturumu"}</span>
              <span className="truncate text-[12px] text-[#5B6478]">
                {kisaltma(GUN_KISA.format(t))} · {saatAraligi(o)}
                {o.toplantiLink ? ` · ${platformAdi(o.toplantiLink)}` : ""}
              </span>
            </span>
            <span className="hidden rounded-full bg-[#EEF2FF] px-2 py-1 font-mono text-[10px] text-[#1A44CC] lg:inline">{sira(o)}</span>
          </li>
        );
      })}
    </ul>
  );

  const klasorKarti = (
    <div className="relative flex items-center gap-4 overflow-hidden rounded-[18px] border border-[#E6E8EF] bg-white p-[18px] sm:p-5">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(#ECEEF3 1px,transparent 1px),linear-gradient(90deg,#ECEEF3 1px,transparent 1px)",
          backgroundSize: "14px 14px",
          maskImage: "radial-gradient(circle at 12% 50%,#000,transparent 45%)",
          WebkitMaskImage: "radial-gradient(circle at 12% 50%,#000,transparent 45%)",
        }}
      />
      <span className="relative h-[52px] w-[52px] flex-none" aria-hidden>
        <span className="absolute top-2 left-2 h-11 w-11 rotate-[10deg] rounded-[14px] opacity-35" style={{ background: "oklch(0.6 0.2 300)" }} />
        <span
          className="absolute inset-[0_8px_8px_0] flex items-center justify-center rounded-[14px] border"
          style={{
            background: "linear-gradient(150deg,rgba(255,255,255,.95),rgba(255,255,255,.6))",
            borderColor: "oklch(0.88 0.06 300)",
            boxShadow: "0 8px 16px -8px oklch(0.55 0.2 300)",
            color: "oklch(0.5 0.2 300)",
          }}
        >
          <Icon name="folder" size={18} />
        </span>
      </span>
      <div className="relative flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className="text-[15px] font-bold text-ink">{klasorler[0]?.baslik || "Ders kayıt klasörü"}</span>
        <span className="text-[12px] leading-[1.45] text-[#5B6478]">
          {ilkKlasor
            ? "Klasör canlı: yeni ders işlendikçe kayıt otomatik eklenir."
            : "İlk dersinden sonra kayıtların burada toplanmaya başlar."}
        </span>
      </div>
      {ilkKlasor && (
        <a
          href={ilkKlasor}
          target="_blank"
          rel="noreferrer"
          className="relative flex-none rounded-[10px] border border-[#E1E4EC] bg-white px-3.5 py-2.5 text-[13px] font-semibold text-ink transition hover:border-brand hover:text-brand"
        >
          <span className="hidden sm:inline">Klasörü aç</span>
          <span className="sm:hidden" aria-label="Klasörü aç">
            →
          </span>
        </a>
      )}
    </div>
  );

  return (
    <main className="flex flex-col gap-4 p-4 pb-14 sm:gap-5 sm:px-[34px] sm:pt-7 sm:pb-9">
      {/* Sayfa açıldı: yan menüdeki ve genel bakıştaki rozet düşüyor. */}
      <GorulduIsareti alan="birebir" />

      <div className="flex items-center gap-4">
        <h1 className="px-1 font-heading text-[24px] leading-[1.15] font-bold tracking-[-0.02em] text-ink sm:px-0 sm:text-[26px]">
          Birebir eğitim
        </h1>
        {erteleme && (
          <Link
            href={erteleme}
            className="ml-auto hidden rounded-[10px] border border-[#E1E4EC] bg-white px-4 py-[11px] text-[13px] font-semibold text-ink transition hover:border-brand hover:text-brand sm:inline-flex"
          >
            Erteleme talebi
          </Link>
        )}
      </div>

      {/* ------------------------------------------------ sıradaki oturum --- */}
      <section
        className="relative grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-4 overflow-hidden rounded-[20px] p-[18px] text-white lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-8 lg:p-7"
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
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -left-30 h-[420px] w-[420px] rounded-full"
          style={{ background: "radial-gradient(circle,rgba(91,134,255,.45),transparent 65%)" }}
        />

        {siradaki ? (
          <>
            {(() => {
              const t = new Date(siradaki.baslangic);
              const kalan = gunFarki(simdi, t);
              const link = guvenliUrl(siradaki.toplantiLink);
              const dakika = canli ? Math.max(1, Math.floor((anlik - t.getTime()) / 60_000)) : 0;
              return (
                <>
                  <div className="relative flex h-[86px] w-[72px] flex-col overflow-hidden rounded-[14px] bg-white text-ink shadow-[0_20px_40px_-16px_rgba(0,0,0,.6)] lg:h-32 lg:w-[118px] lg:rounded-[18px]">
                    <div className="bg-[#2459FF] py-1 text-center font-mono text-[9px] font-semibold tracking-[0.14em] text-white lg:py-[7px] lg:text-[11px]">
                      {buyuk(AY_UZUN.format(t))}
                    </div>
                    <div className="flex flex-1 flex-col items-center justify-center gap-0.5">
                      <div className="text-[28px] leading-none font-extrabold tracking-[-0.04em] lg:text-[48px]">
                        {String(trGun(t).gun).padStart(2, "0")}
                      </div>
                      <div className="text-[10px] font-semibold text-[#5B6478] lg:text-[12px]">{GUN_ADI.format(t)}</div>
                    </div>
                  </div>

                  <div className="relative flex min-w-0 flex-col gap-2.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      {canli ? (
                        <span className="flex items-center gap-2 rounded-full bg-[rgba(61,220,151,.12)] px-2.5 py-[5px] font-mono text-[10px] font-semibold tracking-[0.14em] text-[#3DDC97] lg:text-[11px]">
                          <span className="h-[7px] w-[7px] animate-pulse rounded-full bg-[#3DDC97]" />
                          CANLI · {dakika} DK’DIR SÜRÜYOR
                        </span>
                      ) : (
                        <span className="rounded-full bg-white/10 px-2.5 py-[5px] font-mono text-[10px] tracking-[0.14em] text-[#AFC2FF] uppercase lg:text-[11px]">
                          <span className="hidden lg:inline">Sıradaki oturum · </span>
                          {kalanMetni(kalan)}
                        </span>
                      )}
                      <span className="hidden font-mono text-[11px] text-[#8E98B3] lg:inline">
                        OTURUM {sira(siradaki)} / {String(sayilan.length).padStart(2, "0")}
                      </span>
                    </div>
                    <h2 className="hidden text-[30px] leading-[1.1] font-extrabold tracking-[-0.03em] lg:block">
                      {siradaki.konu || "Eğitim oturumu"}
                    </h2>
                    <div className="flex flex-wrap gap-x-[18px] gap-y-1.5 text-[14px] text-[#C9D0E0]">
                      <span className="flex items-center gap-2">
                        <Icon name="clock" size={15} className="hidden lg:block" />
                        {saatAraligi(siradaki)}
                        <span className="hidden lg:inline">(TSİ)</span>
                      </span>
                      {link && (
                        <span className="flex items-center gap-2">
                          <Icon name="play" size={14} className="hidden lg:block" />
                          {platformAdi(link)}
                        </span>
                      )}
                      <span className="hidden items-center gap-2 lg:flex">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2459FF] text-[9px] font-bold text-white">
                          {egitmenBas}
                        </span>
                        Eğitmen: {egitmen}
                      </span>
                    </div>
                  </div>

                  {/* Telefonda başlık tarih bloğunun altında, tam genişlikte. */}
                  <h2 className="relative col-span-2 text-[22px] leading-[1.2] font-extrabold tracking-[-0.02em] lg:hidden">
                    {siradaki.konu || "Eğitim oturumu"}
                  </h2>

                  <div className="relative col-span-2 flex flex-col gap-2.5 lg:col-span-1 lg:w-[220px]">
                    {link ? (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex h-[52px] items-center justify-center rounded-[13px] text-[15px] font-extrabold transition ${
                          canli
                            ? "bg-[#3DDC97] text-[#06251A] shadow-[0_14px_30px_-12px_rgba(61,220,151,.8)] hover:bg-[#5BE6A9]"
                            : "bg-white text-[#1A44CC] hover:bg-[#EEF2FF]"
                        }`}
                      >
                        {canli ? "Şimdi katıl →" : "Derse katıl →"}
                      </a>
                    ) : (
                      <p className="rounded-[12px] bg-white/8 px-3 py-3 text-center text-[13px] text-[#C9D0E0]">
                        Katılım bağlantısı dersten önce burada paylaşılacak.
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-1">
                      <a
                        href={`/panel/birebir-egitim/takvim/${siradaki.id}`}
                        className="flex h-11 items-center justify-center rounded-[12px] border border-white/25 text-[13px] font-semibold text-white transition hover:bg-white/8"
                      >
                        Takvime ekle
                      </a>
                      {erteleme && (
                        <Link
                          href={erteleme}
                          className="flex h-11 items-center justify-center rounded-[12px] border border-white/25 text-[13px] font-semibold text-white transition hover:bg-white/8 lg:hidden"
                        >
                          Ertele
                        </Link>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </>
        ) : (
          <>
            <div className="relative h-[86px] w-[72px] rounded-[14px] border-[1.5px] border-dashed border-white/30 lg:h-32 lg:w-[118px] lg:rounded-[18px]" />
            <div className="relative flex flex-col gap-2">
              <div className="font-mono text-[10px] tracking-[0.14em] text-[#AFC2FF] uppercase lg:text-[11px]">Sıradaki oturum</div>
              <h2 className="text-[20px] leading-[1.15] font-extrabold tracking-[-0.03em] lg:text-[28px]">Planlanmış oturumun yok</h2>
              <p className="text-[14px] text-[#C9D0E0]">Eğitmenin yeni bir ders planladığında burada görünecek.</p>
            </div>
            <Link
              href="/panel/soru-cevap"
              className="relative col-span-2 flex h-12 items-center justify-center rounded-[12px] bg-white px-5 text-[14px] font-bold text-[#1A44CC] transition hover:bg-[#EEF2FF] lg:col-span-1"
            >
              Eğitmene yaz
            </Link>
          </>
        )}
      </section>

      {/* ------------------------------------- takvim + yaklaşan + klasör --- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-[18px]">
        <BirebirTakvim oturumlar={takvim} bugun={bugun} baslangic={{ yil: acilisAyi.yil, ay: acilisAyi.ay }}>
          {sonrakiler.length > 0 ? yaklasanListe : null}
        </BirebirTakvim>

        <div className="hidden flex-col gap-[18px] lg:flex">
          <div className="flex flex-col gap-1.5 rounded-[18px] border border-[#E6E8EF] bg-white p-5">
            <div className="flex items-center pb-1.5">
              <h2 className="text-[16px] font-bold text-ink">Yaklaşan oturumlar</h2>
              <span className="ml-auto rounded-full bg-[#F1F3F8] px-2 py-[3px] font-mono text-[10px] text-[#8A92A6] uppercase">
                {sonrakiler.length} oturum
              </span>
            </div>
            {sonrakiler.length > 0 ? (
              yaklasanListe
            ) : (
              <p className="py-3 text-[13px] leading-[1.5] text-[#5B6478]">
                {siradaki ? "Sıradaki oturumdan sonra planlanmış başka oturum yok." : "Planlanmış oturum yok."}
              </p>
            )}
          </div>
          {klasorKarti}
        </div>
      </div>

      {gecmisSatirlar.length > 0 && <GecmisOturumlar liste={gecmisSatirlar} klasor={ilkKlasor} />}

      {/* Telefonda klasör en altta (tasarım). */}
      <div className="lg:hidden">{klasorKarti}</div>
    </main>
  );
}
