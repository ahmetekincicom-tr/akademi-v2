"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { gorusmeTalepEt, gorusmeIptalEt } from "@/app/panel/gorusmeler/actions";
import { Icon } from "@/components/Icon";
import { guvenliUrl } from "@/lib/guvenli-url";
import { para, saatBicimi } from "@/lib/admin/format";
import { GORUSME_DURUM_ETIKET, type Gorusme, type GorusmeAyarlari } from "@/lib/gorusme";
import { GorusmeSihirbazi } from "@/components/panel/GorusmeSihirbazi";
import { useBildirim } from "@/components/Bildirim";
import { useNativeUygulama } from "@/lib/native";
import { TR_ZAMAN } from "@/lib/zaman";

const DURUM_RENK: Record<string, { bg: string; fg: string }> = {
  talep: { bg: "rgba(28,86,243,0.12)", fg: "#1C56F3" },
  odeme_bekliyor: { bg: "rgba(201,138,27,0.16)", fg: "#A5711A" },
  planlandi: { bg: "rgba(28,86,243,0.12)", fg: "#1C56F3" },
  tamamlandi: { bg: "rgba(24,140,90,0.13)", fg: "#157A4E" },
  iptal: { bg: "rgba(10,13,24,0.07)", fg: "#5C6273" },
};

const AY = new Intl.DateTimeFormat("tr-TR", { timeZone: TR_ZAMAN, month: "short" });
const GUN = new Intl.DateTimeFormat("tr-TR", { timeZone: TR_ZAMAN, day: "2-digit" });
const GUN_AY = new Intl.DateTimeFormat("tr-TR", { timeZone: TR_ZAMAN, day: "numeric", month: "short" });

/** Hareketi azalt tercihi açıkken yumuşak kaydırma yapılmaz. */
function kaydirma(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

export function GorusmeGorunumu({
  gorusmeler,
  ayarlar,
  hak,
}: {
  gorusmeler: Gorusme[];
  ayarlar: GorusmeAyarlari;
  hak: {
    kullanilan: number;
    kalan: number;
    bekleyen: boolean;
    sonrakiUcretli: boolean;
    egitimKaydiVar: boolean;
  };
}) {
  // Ödeme yüzeyleri uygulamada kapalı: Apple'ın 3.1.3 maddesi uygulama
  // içinden dışarıdaki ödemeye yönlendirmeyi yasaklıyor ve ödeme açıklaması
  // IBAN/havale talimatı içeriyor. Talep akışının kendisi açık kalıyor,
  // yalnızca ücret ve ödeme bilgisi gizleniyor.
  const native = useNativeUygulama();
  const router = useRouter();
  const bildir = useBildirim();
  const [formAcik, setFormAcik] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [islemde, startTransition] = useTransition();
  const formRef = useRef<HTMLDivElement>(null);
  const listeRef = useRef<HTMLDivElement>(null);

  // Kısa ekranlarda formun alt kenarı kadraj dışında kalabiliyor; açılınca
  // sihirbaza kaydırmak kullanıcıyı alanı aramaktan kurtarıyor.
  useEffect(() => {
    if (!formAcik) return;
    formRef.current?.scrollIntoView({ behavior: kaydirma(), block: "nearest" });
  }, [formAcik]);

  const gonder = (girdi: { konu: string; aciklama: string; tercihZaman: string }) => {
    setHata(null);
    startTransition(async () => {
      const r = await gorusmeTalepEt(girdi);
      if (r?.error) {
        setHata(r.error);
        bildir.hata(r.error);
      } else if (r?.odemeYolu) {
        // Ücretli yol: talep ödeme tamamlanınca geçerli oluyor, o yüzden
        // kişiyi burada bırakmayıp doğrudan ödeme ekranına götürüyoruz.
        bildir.basarili("Talebin hazır. Ödemeyi tamamlayınca planlamaya alıyoruz.");
        router.push(r.odemeYolu);
      } else {
        bildir.basarili("Görüşme talebin alındı. En kısa sürede planlayıp buraya ekleyeceğiz.");
        setFormAcik(false);
        router.refresh();
        // Form kapanınca ekranda hiçbir şey değişmemiş gibi duruyordu: yeni
        // talep listede, mobilde çok aşağıda.
        listeRef.current?.scrollIntoView({ behavior: kaydirma(), block: "start" });
      }
    });
  };

  const iptal = (id: string) => {
    setHata(null);
    startTransition(async () => {
      const r = await gorusmeIptalEt(id);
      if (r?.error) {
        setHata(r.error);
        bildir.hata(r.error);
      } else {
        bildir.basarili("Talebin iptal edildi.");
        router.refresh();
      }
    });
  };

  const [acikNot, setAcikNot] = useState<string | null>(null);
  const talepAcilabilir = ayarlar.aktif && !hak.bekleyen && !(native && !hak.egitimKaydiVar);
  const ucretMetni = ayarlar.ucret > 0 ? para(ayarlar.ucret) : "ücretli";
  const nasilRef = useRef<HTMLDivElement>(null);

  const talepDugmesi = (genis: boolean) =>
    talepAcilabilir && (
      <button
        type="button"
        onClick={() => setFormAcik((v) => !v)}
        aria-expanded={formAcik}
        aria-controls="gorusme-talep-formu"
        className={`h-12 items-center justify-center rounded-[12px] bg-white px-5 text-[14px] font-bold text-[#1A44CC] transition hover:bg-[#EEF2FF] ${
          genis ? "flex w-full lg:hidden" : "hidden lg:inline-flex"
        }`}
      >
        {formAcik ? "Vazgeç" : "+ Görüşme talep et"}
      </button>
    );

  return (
    <main className="flex flex-col gap-4 p-4 pb-14 sm:gap-5 sm:px-[34px] sm:pt-7 sm:pb-9">
      {/* ------------------------------------------------------ bant --- */}
      <section
        className="relative grid grid-cols-1 gap-5 overflow-hidden rounded-[20px] p-[18px] text-white lg:grid-cols-[minmax(0,1fr)_400px] lg:items-stretch lg:gap-8 lg:p-7"
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
        <div className="relative flex flex-col gap-2">
          <div className="font-mono text-[10px] tracking-[0.16em] text-[#AFC2FF] uppercase">Birebir destek</div>
          <h1 className="text-[26px] leading-[1.1] font-extrabold tracking-[-0.03em] lg:text-[34px]">Danışmanlık görüşmeleri</h1>
          <p className="hidden max-w-[420px] text-[15px] leading-[1.5] text-[#C9D0E0] lg:block">
            {hak.egitimKaydiVar
              ? "Eğitimin bittikten sonra da takıldığın yerlerde eğitmeninle birebir görüşebilirsin."
              : "Dijital pazarlamada takıldığın bir konuyu birebir konuşabilirsin. Eğitim katılımcısı değilsen görüşme ücrete tabidir."}
          </p>
          <div className="mt-auto hidden gap-2.5 pt-6 lg:flex">
            {talepDugmesi(false)}
            <button
              type="button"
              onClick={() => nasilRef.current?.scrollIntoView({ behavior: kaydirma(), block: "start" })}
              className="h-12 rounded-[12px] border border-white/25 px-5 text-[14px] font-bold text-white transition hover:bg-white/8"
            >
              Nasıl çalışır?
            </button>
          </div>
        </div>

        {/* Hak kartı */}
        {hak.egitimKaydiVar ? (
          <div className="relative flex flex-col gap-4 rounded-[16px] border border-white/12 bg-[#070B16]/55 p-4 lg:p-5">
            <div className="hidden font-mono text-[10px] tracking-[0.14em] text-[#AFC2FF] uppercase lg:block">Kalan ücretsiz hak</div>
            <div className="flex items-end gap-2">
              <span className="text-[44px] leading-none font-extrabold tracking-[-0.03em]">{hak.kalan}</span>
              <span className="pb-1 text-[16px] font-bold text-[#8E98B3]">
                / {ayarlar.ucretsizHak}
                <span className="lg:hidden"> ücretsiz hak</span>
              </span>
              <span className="ml-auto hidden pb-1 font-mono text-[10px] tracking-[0.12em] text-[#AFC2FF] uppercase lg:inline">
                {hak.kullanilan} kullanıldı
              </span>
            </div>
            {/* Masaüstü: hak kutuları; telefon: ince çubuklar. */}
            <div
              className="hidden gap-2 lg:grid"
              style={{ gridTemplateColumns: `repeat(${Math.min(Math.max(ayarlar.ucretsizHak, 1), 4)}, minmax(0,1fr))` }}
            >
              {Array.from({ length: ayarlar.ucretsizHak }, (_, i) => {
                const kullanildi = i < Math.min(hak.kullanilan, ayarlar.ucretsizHak);
                return (
                  <div
                    key={i}
                    className={`rounded-[12px] px-3 py-2.5 ${
                      kullanildi
                        ? "border border-white/12 bg-white/[0.04] text-[#C9D0E0]"
                        : "bg-[#2459FF] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.18)]"
                    }`}
                  >
                    <div className={`font-mono text-[9px] tracking-[0.12em] uppercase ${kullanildi ? "text-[#8E98B3]" : "text-[#DCE5FF]"}`}>
                      Hak {String(i + 1).padStart(2, "0")}
                    </div>
                    <div className="mt-0.5 text-[13px] font-bold">{kullanildi ? "✓ Kullanıldı" : "Hazır"}</div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-1.5 lg:hidden">
              {Array.from({ length: ayarlar.ucretsizHak }, (_, i) => (
                <span
                  key={i}
                  className={`h-2 flex-1 rounded-full ${i < Math.min(hak.kullanilan, ayarlar.ucretsizHak) ? "bg-white/15" : "bg-[#7FA0FF]"}`}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3 text-[13px] text-[#C9D0E0]">
              <span className="hidden h-2 w-2 rounded-full bg-[#3DDC97] lg:inline-block" />
              <span>
                Sonraki görüşmen{" "}
                <strong className="font-bold text-white">{hak.sonrakiUcretli ? (native ? "ücretli" : ucretMetni) : "ücretsiz"}</strong> ·{" "}
                {ayarlar.sureDk} dk
                {!native && !hak.sonrakiUcretli && ayarlar.ucret > 0 && <span className="lg:hidden"> · sonra {para(ayarlar.ucret)}</span>}
              </span>
              {!native && !hak.sonrakiUcretli && ayarlar.ucret > 0 && (
                <span className="ml-auto hidden font-mono text-[10px] tracking-[0.1em] text-[#8E98B3] uppercase lg:inline">
                  Sonra {para(ayarlar.ucret)}
                </span>
              )}
            </div>
          </div>
        ) : (
          !native && (
            <div className="relative flex flex-col justify-center gap-2 rounded-[16px] border border-white/12 bg-[#070B16]/55 p-5">
              <div className="font-mono text-[10px] tracking-[0.14em] text-[#AFC2FF] uppercase">Görüşme ücreti</div>
              <div className="text-[34px] leading-none font-extrabold tracking-[-0.03em]">{ucretMetni}</div>
              <div className="text-[13px] text-[#C9D0E0]">{ayarlar.sureDk} dakika · birebir</div>
            </div>
          )
        )}

        <div className="relative lg:hidden">{talepDugmesi(true)}</div>
      </section>

      {hata && (
        <div className="rounded-[11px] border border-danger/35 bg-danger/7 px-4 py-3 text-sm text-danger-ink">{hata}</div>
      )}

      {/* Form bandın hemen altında: telefonda düğmeye basan kişi ekranda
          bir şeyin değiştiğini görsün. */}
      {formAcik && (
        <div ref={formRef}>
          <GorusmeSihirbazi
            bilgi={
              !hak.sonrakiUcretli
                ? `Bu görüşme ücretsiz haklarından düşülecek. Kalan: ${hak.kalan}`
                : native
                  ? "Talebini gönderdikten sonra planlama için sana döneceğiz."
                  : hak.egitimKaydiVar
                    ? `Ücretsiz hakların doldu. Bu görüşme ${ucretMetni}; devam edince ödeme ekranına yönlendirileceksin.`
                    : `Görüşme ücreti ${ayarlar.ucret > 0 ? para(ayarlar.ucret) : "belirlenecek"}. Devam edince ödeme ekranına yönlendirileceksin; talebin ödeme tamamlanınca planlamaya alınır.`
            }
            islemde={islemde}
            onGonder={gonder}
            onVazgec={() => setFormAcik(false)}
          />
        </div>
      )}

      {/* Uygulamada, eğitim kaydı olmayan kişiye ne ücret ne ödeme yolu
          gösteriliyor (Apple 3.1.3). */}
      {native && !hak.egitimKaydiVar && ayarlar.aktif && (
        <div className="rounded-[11px] border border-ink/12 bg-mist px-4 py-3 text-[13.5px] leading-[1.6] text-[#5C6273]">
          Birebir danışmanlık görüşmeleri eğitim katılımcılarına açıktır. Eğitim kaydın oluşturulduğunda bu bölüm kullanıma
          açılır.
        </div>
      )}
      {!ayarlar.aktif && (
        <div className="rounded-[11px] border border-[rgba(201,138,27,0.35)] bg-[rgba(201,138,27,0.08)] px-4 py-3 text-[13.5px] text-[#A5711A]">
          Görüşme talepleri şu anda kapalı. Kısa süre içinde tekrar açılacak.
        </div>
      )}
      {hak.bekleyen && (
        <div className="rounded-[11px] border border-brand/30 bg-brand/[0.06] px-4 py-3 text-[13.5px] text-[#1C56F3]">
          Bekleyen bir talebin var. Sonuçlanmadan yeni talep oluşturamazsın.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:items-start lg:gap-[18px]">
        {/* -------------------------------------------- görüşmelerim --- */}
        <section ref={listeRef} className="scroll-mt-4 overflow-hidden rounded-[18px] border border-[#E6E8EF] bg-white">
          <div className="flex items-center gap-2.5 px-[18px] pt-4 pb-3 sm:px-[22px]">
            <h2 className="text-[17px] font-bold text-ink">Görüşmelerim</h2>
            {gorusmeler.length > 0 && (
              <span className="hidden rounded-full bg-[#F1F3F8] px-2 py-[3px] font-mono text-[10px] text-[#8A92A6] uppercase lg:inline">
                {gorusmeler.length} talep
              </span>
            )}
          </div>

          {gorusmeler.length === 0 ? (
            <div className="border-t border-[#EEF0F5] px-6 py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[13px] bg-mist text-[#656B7A]">
                <Icon name="clock" size={22} />
              </div>
              <p className="mx-auto mt-4 max-w-[420px] text-[14.5px] leading-[1.6] text-[#5C6273]">
                {hak.egitimKaydiVar
                  ? `Henüz bir görüşme talebin yok. ${ayarlar.ucretsizHak} ücretsiz hakkın seni bekliyor.`
                  : "Henüz bir görüşme talebin yok."}
              </p>
            </div>
          ) : (
            <ul>
              {gorusmeler.map((g) => {
                const renk = DURUM_RENK[g.durum];
                const link = guvenliUrl(g.toplantiLink);
                const tarih = new Date(g.baslangic ?? g.olusturma);
                const dolu = g.durum === "planlandi" || g.durum === "tamamlandi";
                const notAcik = acikNot === g.id;
                return (
                  <li key={g.id} className="border-t border-[#EEF0F5] px-[18px] py-4 sm:px-[22px]">
                    <div className="flex items-start gap-3.5">
                      <span
                        className={`flex h-[52px] w-[52px] flex-none flex-col items-center justify-center rounded-[11px] ${
                          dolu ? "bg-ink text-white" : "border border-dashed border-[#D5DAE5] text-[#8A92A6]"
                        }`}
                      >
                        <span className={`font-mono text-[9px] uppercase ${dolu ? "text-[#8FAEFF]" : ""}`}>
                          {AY.format(tarih).replace(".", "")}
                        </span>
                        <span className="text-[19px] leading-none font-extrabold">{GUN.format(tarih)}</span>
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-[15.5px] font-bold text-ink">{g.konu}</span>
                          <span
                            className="rounded-full px-2 py-[2px] font-mono text-[9.5px] tracking-[0.08em] uppercase"
                            style={{ background: renk.bg, color: renk.fg }}
                          >
                            {GORUSME_DURUM_ETIKET[g.durum]}
                          </span>
                          <span className="rounded-full bg-[#EEF2FF] px-2 py-[2px] font-mono text-[9.5px] tracking-[0.08em] text-[#1A44CC] uppercase">
                            {g.ucretsiz ? "Ücretsiz hak" : g.ucret && !native ? para(g.ucret) : "Ücretli"}
                          </span>
                        </div>
                        {g.aciklama && (
                          <p className="mt-1 hidden text-[13.5px] leading-[1.55] whitespace-pre-line text-[#5B6478] sm:block">{g.aciklama}</p>
                        )}
                        <div className="mt-1 font-mono text-[11px] text-[#8A92A6]">
                          {g.baslangic
                            ? `${saatBicimi.format(new Date(g.baslangic))} · ${g.sureDk} dk`
                            : g.durum === "iptal"
                              ? `Talep: ${GUN_AY.format(new Date(g.olusturma))}`
                              : g.tercihZaman
                                ? `Tercih: ${g.tercihZaman}`
                                : `Talep: ${GUN_AY.format(new Date(g.olusturma))}`}
                        </div>
                      </div>

                      <div className="hidden flex-none flex-col items-end gap-2 sm:flex">
                        {link && g.durum === "planlandi" && (
                          <a
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-9 items-center gap-[6px] rounded-[10px] bg-brand px-3.5 text-[13px] font-semibold text-white transition hover:bg-ink"
                          >
                            Görüşmeye katıl →
                          </a>
                        )}
                        {(g.durum === "talep" || g.durum === "odeme_bekliyor") && (
                          <button
                            type="button"
                            disabled={islemde}
                            onClick={() => iptal(g.id)}
                            className="h-9 rounded-[10px] border border-[#E1E4EC] bg-white px-3.5 text-[13px] font-semibold text-[#5C6273] transition hover:border-danger/45 hover:text-danger disabled:opacity-50"
                          >
                            Talebi iptal et
                          </button>
                        )}
                        {g.adminNotu && (
                          <button
                            type="button"
                            onClick={() => setAcikNot(notAcik ? null : g.id)}
                            aria-expanded={notAcik}
                            className="h-9 rounded-[10px] border border-[#E1E4EC] bg-white px-3.5 text-[13px] font-semibold text-ink transition hover:border-brand hover:text-brand"
                          >
                            {notAcik ? "Notu kapat" : "Notları gör"}
                          </button>
                        )}
                        {g.durum === "iptal" && g.ucretsiz && <span className="pt-2 text-[12.5px] text-[#8A92A6]">Hakkından düşmedi</span>}
                      </div>
                    </div>

                    {/* Telefon: eylemler satırın altında. */}
                    {((link && g.durum === "planlandi") || g.durum === "talep" || g.durum === "odeme_bekliyor" || g.adminNotu) && (
                      <div className="mt-3 flex flex-wrap gap-2 pl-[66px] sm:hidden">
                        {link && g.durum === "planlandi" && (
                          <a href={link} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center rounded-[10px] bg-brand px-3.5 text-[13px] font-semibold text-white">
                            Görüşmeye katıl →
                          </a>
                        )}
                        {(g.durum === "talep" || g.durum === "odeme_bekliyor") && (
                          <button
                            type="button"
                            disabled={islemde}
                            onClick={() => iptal(g.id)}
                            className="h-9 rounded-[10px] border border-[#E1E4EC] px-3.5 text-[13px] font-semibold text-[#5C6273] disabled:opacity-50"
                          >
                            Talebi iptal et
                          </button>
                        )}
                        {g.adminNotu && (
                          <button
                            type="button"
                            onClick={() => setAcikNot(notAcik ? null : g.id)}
                            aria-expanded={notAcik}
                            className="h-9 rounded-[10px] border border-[#E1E4EC] px-3.5 text-[13px] font-semibold text-ink"
                          >
                            {notAcik ? "Notu kapat" : "Notları gör"}
                          </button>
                        )}
                      </div>
                    )}

                    {notAcik && g.adminNotu && (
                      <div className="mt-3 rounded-[12px] bg-[#F4F6FC] px-4 py-3 sm:ml-[66px]">
                        <div className="font-mono text-[9.5px] tracking-[0.12em] text-[#8A92A6] uppercase">Eğitmen notu</div>
                        <p className="mt-1.5 text-[13.5px] leading-[1.6] whitespace-pre-line text-[#3A3F4F]">{g.adminNotu}</p>
                      </div>
                    )}

                    {/* Ödeme talimatı — uygulamada gösterilmiyor. */}
                    {g.durum === "odeme_bekliyor" && !native && (
                      <div className="mt-4 rounded-[12px] border border-[rgba(201,138,27,0.35)] bg-[rgba(201,138,27,0.07)] px-4 py-[14px] sm:ml-[66px]">
                        <div className="font-mono text-[10px] tracking-[0.12em] text-[#A5711A] uppercase">
                          Ödeme bekleniyor{g.ucret ? ` · ${para(g.ucret)}` : ""}
                        </div>
                        <p className="mt-2 text-[13.5px] leading-[1.65] whitespace-pre-line text-[#5C6273]">
                          {ayarlar.odemeAciklamasi ||
                            "Ödeme bilgileri için bizimle iletişime geçebilirsin. Ödemen görüldüğünde görüşme saatini planlayıp buraya ekleyeceğiz."}
                        </p>
                        <p className="mt-2 text-[12.5px] text-[#656B7A]">Ödemen onaylandığında bu talep otomatik olarak planlamaya geçer.</p>
                        {g.paymentId && (
                          <Link
                            href={`/panel/odemelerim/ode/${g.paymentId}`}
                            className="mt-3 inline-flex h-9 items-center gap-[6px] rounded-[9px] bg-brand px-[15px] text-[13.5px] font-semibold text-white transition hover:bg-ink"
                          >
                            <Icon name="card" size={14} />
                            Ödemeyi tamamla
                          </Link>
                        )}
                      </div>
                    )}

                    {g.durum === "planlandi" && !link && (
                      <p className="mt-3 text-[13px] text-[#656B7A] sm:ml-[66px]">Görüşme bağlantısı yaklaşınca burada görünecek.</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ------------------------------------- nasıl çalışır + ücret --- */}
        <div className="flex flex-col gap-4 lg:gap-[18px]">
          <div ref={nasilRef} className="hidden scroll-mt-4 rounded-[18px] border border-[#E6E8EF] bg-white p-5 lg:block">
            <h2 className="text-[17px] font-bold text-ink">Nasıl çalışır?</h2>
            <ol className="mt-4 flex flex-col gap-4">
              {[
                ["Talep oluştur", "Konunu ve uygun olduğun zamanı yaz."],
                ["Onay ve planlama", "Eğitmen saati onaylar, bağlantı panele düşer."],
                [`${ayarlar.sureDk} dk birebir görüşme`, "Görüşme sonrası notlar burada kalır."],
              ].map(([b, a], i) => (
                <li key={b} className="flex gap-3">
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#EEF2FF] font-mono text-[11px] font-semibold text-brand">
                    {i + 1}
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[14.5px] font-bold text-ink">{b}</span>
                    <span className="text-[13px] text-[#5B6478]">{a}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Ücretlendirme web'de her zaman görünür; uygulamada kapalı. */}
          {!native && (
            <div className="flex flex-col gap-3 lg:rounded-[18px] lg:border lg:border-[#E6E8EF] lg:bg-white lg:p-5">
              <div className="hidden font-mono text-[10px] tracking-[0.14em] text-[#8A92A6] uppercase lg:block">Ücretlendirme</div>
              <div className="grid grid-cols-2 gap-3">
                {hak.egitimKaydiVar && (
                  <div className="rounded-[14px] bg-[#E3F6EE] p-4">
                    <div className="text-[12.5px] font-semibold text-[#12825A]">İlk {ayarlar.ucretsizHak} görüşme</div>
                    <div className="mt-1 text-[20px] font-extrabold text-ink">Ücretsiz</div>
                  </div>
                )}
                <div className={`rounded-[14px] border border-[#E6E8EF] bg-white p-4 lg:border-0 lg:bg-[#F1F3F8] ${hak.egitimKaydiVar ? "" : "col-span-2"}`}>
                  <div className="text-[12.5px] font-semibold text-[#5B6478]">{hak.egitimKaydiVar ? "Sonrası / görüşme" : "Görüşme başı"}</div>
                  <div className="mt-1 text-[20px] font-extrabold text-ink">{ucretMetni}</div>
                </div>
              </div>
              <p className="px-1 text-[13px] leading-[1.6] text-[#5B6478] lg:px-0">
                Her görüşme {ayarlar.sureDk} dakika sürer.{" "}
                {hak.egitimKaydiVar
                  ? "İptal ettiğin talepler hakkından düşmez."
                  : "Talebin ödeme tamamlandıktan sonra planlamaya alınır; ödemeden vazgeçersen talebi iptal edebilirsin."}
              </p>
              {ayarlar.odemeAciklamasi && (
                <div className="rounded-[12px] bg-mist px-4 py-3">
                  <div className="font-mono text-[9.5px] tracking-[0.13em] text-[#656B7A] uppercase">Ödeme bilgileri</div>
                  <p className="mt-1.5 text-[13px] leading-[1.65] whitespace-pre-line text-[#3A3F4F]">{ayarlar.odemeAciklamasi}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
