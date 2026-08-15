"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { gorusmeTalepEt, gorusmeIptalEt } from "@/app/panel/gorusmeler/actions";
import { Icon } from "@/components/Icon";
import { guvenliUrl } from "@/lib/guvenli-url";
import { para, saatBicimi } from "@/lib/admin/format";
import { GORUSME_DURUM_ETIKET, type Gorusme, type GorusmeAyarlari } from "@/lib/gorusme";
import { GorusmeSihirbazi } from "@/components/panel/GorusmeSihirbazi";
import { useBildirim } from "@/components/Bildirim";
import { useNativeUygulama } from "@/lib/native";

const DURUM_RENK: Record<string, { bg: string; fg: string }> = {
  talep: { bg: "rgba(28,86,243,0.12)", fg: "#1C56F3" },
  odeme_bekliyor: { bg: "rgba(201,138,27,0.16)", fg: "#A5711A" },
  planlandi: { bg: "rgba(28,86,243,0.12)", fg: "#1C56F3" },
  tamamlandi: { bg: "rgba(24,140,90,0.13)", fg: "#157A4E" },
  iptal: { bg: "rgba(10,13,24,0.07)", fg: "#5C6273" },
};

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
  hak: { kullanilan: number; kalan: number; bekleyen: boolean; sonrakiUcretli: boolean };
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

  return (
    <main className="p-4 pb-14 sm:p-[34px]">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[32px]">
            Danışmanlık görüşmeleri
          </h1>
          <p className="mt-2 max-w-[620px] text-[15px] text-[#5C6273]">
            Eğitimin bittikten sonra da takıldığın yerlerde birebir görüşebilirsin.
          </p>
        </div>
        {ayarlar.aktif && !hak.bekleyen && (
          <button
            type="button"
            onClick={() => setFormAcik((v) => !v)}
            aria-expanded={formAcik}
            aria-controls="gorusme-talep-formu"
            className="inline-flex h-11 items-center gap-[6px] rounded-[10px] bg-brand px-5 text-sm font-semibold text-white transition hover:bg-ink"
          >
            {!formAcik && <Icon name="plus" size={15} />}
            {formAcik ? "Vazgeç" : "Görüşme talep et"}
          </button>
        )}
      </div>

      {hata && (
        <div className="mt-5 rounded-[11px] border border-danger/35 bg-danger/7 px-4 py-3 text-sm text-danger-ink">
          {hata}
        </div>
      )}

      {/* Form düğmenin hemen altında. Eskiden hak kartlarının ve ücretlendirme
          kutusunun altında açılıyordu; telefonda düğmeye basan kişi ekranda
          hiçbir şey değişmemiş sanıyordu. */}
      {formAcik && (
        <div ref={formRef}>
          <GorusmeSihirbazi
            bilgi={
              hak.sonrakiUcretli
                ? native
                  ? "Ücretsiz hakların doldu. Talebini gönderdikten sonra planlama için sana döneceğiz."
                  : `Ücretsiz hakların doldu. Bu görüşme ${ayarlar.ucret > 0 ? para(ayarlar.ucret) : "ücretli"} olarak planlanır; talebi gönderdikten sonra ödeme bilgileri burada görünür.`
                : `Bu görüşme ücretsiz haklarından düşülecek. Kalan: ${hak.kalan}`
            }
            islemde={islemde}
            onGonder={gonder}
            onVazgec={() => setFormAcik(false)}
          />
        </div>
      )}

      {/* Hak özeti */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-ink/10 bg-white p-5">
          <div className="font-mono text-[9.5px] tracking-[0.13em] text-[#656B7A] uppercase">Kalan ücretsiz hak</div>
          <div className="mt-[10px] font-heading text-[30px] leading-none font-semibold tracking-[-0.03em]">
            {hak.kalan}
          </div>
          <div className="mt-2 text-[13px] text-[#656B7A]">{ayarlar.ucretsizHak} hakkın var</div>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white p-5">
          <div className="font-mono text-[9.5px] tracking-[0.13em] text-[#656B7A] uppercase">Kullanılan</div>
          <div className="mt-[10px] font-heading text-[30px] leading-none font-semibold tracking-[-0.03em]">
            {hak.kullanilan}
          </div>
          <div className="mt-2 text-[13px] text-[#656B7A]">iptal edilenler sayılmaz</div>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white p-5">
          <div className="font-mono text-[9.5px] tracking-[0.13em] text-[#656B7A] uppercase">Sonraki görüşme</div>
          <div className="mt-[10px] font-heading text-[30px] leading-none font-semibold tracking-[-0.03em]">
            {hak.sonrakiUcretli ? (ayarlar.ucret > 0 ? para(ayarlar.ucret) : "Ücretli") : "Ücretsiz"}
          </div>
          <div className="mt-2 text-[13px] text-[#656B7A]">
            {ayarlar.sureDk} dakika · birebir
            {!native && !hak.sonrakiUcretli && ayarlar.ucret > 0 && (
              <span className="mt-[3px] block">Hakların bitince {para(ayarlar.ucret)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Ücretlendirme web'de her zaman görünür: ödeme bilgisi yalnızca borç
          doğunca ortaya çıkarsa öğrenci ne ödeyeceğini önceden bilemez.
          Uygulamada bu kartın tamamı kapalı. */}
      {!native && (
      <div className="mt-4 rounded-2xl border border-ink/10 bg-white p-5">
        <div className="font-mono text-[9.5px] tracking-[0.13em] text-[#656B7A] uppercase">
          Ücretlendirme ve ödeme
        </div>
        <p className="mt-[10px] text-[14px] leading-[1.7] text-[#5C6273]">
          Her katılımcının {ayarlar.ucretsizHak} ücretsiz birebir görüşme hakkı var. Hakların bittikten sonra her
          görüşme {ayarlar.ucret > 0 ? para(ayarlar.ucret) : "ücretli"} olarak planlanır ve {ayarlar.sureDk} dakika
          sürer. İptal ettiğin talepler hakkından düşmez.
        </p>
        {ayarlar.odemeAciklamasi && (
          <div className="mt-4 rounded-[11px] bg-mist px-4 py-[14px]">
            <div className="font-mono text-[9.5px] tracking-[0.13em] text-[#656B7A] uppercase">Ödeme bilgileri</div>
            <p className="mt-2 text-[13.5px] leading-[1.7] whitespace-pre-line text-[#3A3F4F]">
              {ayarlar.odemeAciklamasi}
            </p>
          </div>
        )}
      </div>
      )}

      {!ayarlar.aktif && (
        <div className="mt-5 rounded-[11px] border border-[rgba(201,138,27,0.35)] bg-[rgba(201,138,27,0.08)] px-4 py-3 text-[13.5px] text-[#A5711A]">
          Görüşme talepleri şu anda kapalı. Kısa süre içinde tekrar açılacak.
        </div>
      )}

      {hak.bekleyen && (
        <div className="mt-5 rounded-[11px] border border-brand/30 bg-brand/[0.06] px-4 py-3 text-[13.5px] text-[#1C56F3]">
          Bekleyen bir talebin var. Sonuçlanmadan yeni talep oluşturamazsın.
        </div>
      )}

      {/* Liste */}
      <div ref={listeRef} className="mt-6 scroll-mt-4 overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <div className="border-b border-ink/8 px-6 py-[15px]">
          <h2 className="font-heading text-base font-semibold tracking-[-0.02em]">Görüşmelerim</h2>
        </div>

        {gorusmeler.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[13px] bg-mist text-[#656B7A]">
              <Icon name="clock" size={22} />
            </div>
            <p className="mx-auto mt-4 max-w-[420px] text-[14.5px] leading-[1.6] text-[#5C6273]">
              Henüz bir görüşme talebin yok. {ayarlar.ucretsizHak} ücretsiz hakkın seni bekliyor.
            </p>
          </div>
        ) : (
          gorusmeler.map((g) => {
            const renk = DURUM_RENK[g.durum];
            const link = guvenliUrl(g.toplantiLink);
            return (
              <div key={g.id} className="border-b border-ink/7 px-6 py-5 last:border-b-0">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[15.5px] font-semibold text-ink">{g.konu}</span>
                      <span
                        className="rounded-full px-[9px] py-[3px] font-mono text-[9.5px] tracking-[0.08em] uppercase"
                        style={{ background: renk.bg, color: renk.fg }}
                      >
                        {GORUSME_DURUM_ETIKET[g.durum]}
                      </span>
                      <span className="rounded-full bg-mist px-[9px] py-[3px] font-mono text-[9.5px] tracking-[0.08em] text-[#5C6273] uppercase">
                        {g.ucretsiz ? "ücretsiz hak" : g.ucret ? para(g.ucret) : "ücretli"}
                      </span>
                    </div>

                    {g.baslangic ? (
                      <div className="mt-2 font-mono text-[11.5px] text-[#3A3F4F]">
                        {saatBicimi.format(new Date(g.baslangic))} · {g.sureDk} dk
                      </div>
                    ) : (
                      g.tercihZaman && (
                        <div className="mt-2 font-mono text-[11px] text-[#656B7A]">
                          Tercihin: {g.tercihZaman}
                        </div>
                      )
                    )}

                    {g.aciklama && (
                      <p className="mt-2 text-[14px] leading-[1.6] whitespace-pre-line text-[#5C6273]">{g.aciklama}</p>
                    )}
                  </div>

                  <div className="flex flex-none flex-wrap gap-2">
                    {link && g.durum === "planlandi" && (
                      <a
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 items-center gap-[6px] rounded-[9px] bg-brand px-[15px] text-[13.5px] font-semibold text-white transition hover:bg-ink"
                      >
                        <Icon name="external" size={14} />
                        Görüşmeye katıl
                      </a>
                    )}
                    {(g.durum === "talep" || g.durum === "odeme_bekliyor") && (
                      <button
                        type="button"
                        disabled={islemde}
                        onClick={() => iptal(g.id)}
                        className="inline-flex h-9 items-center rounded-[9px] border border-ink/13 bg-white px-[13px] text-[13px] font-semibold text-[#5C6273] transition hover:border-danger/45 hover:text-danger disabled:opacity-50"
                      >
                        Talebi iptal et
                      </button>
                    )}
                  </div>
                </div>

                {/* Ödeme talimatı — uygulamada gösterilmiyor. */}
                {g.durum === "odeme_bekliyor" && !native && (
                  <div className="mt-4 rounded-[11px] border border-[rgba(201,138,27,0.35)] bg-[rgba(201,138,27,0.07)] px-4 py-[14px]">
                    <div className="font-mono text-[10px] tracking-[0.12em] text-[#A5711A] uppercase">
                      Ödeme bekleniyor{g.ucret ? ` · ${para(g.ucret)}` : ""}
                    </div>
                    <p className="mt-2 text-[13.5px] leading-[1.65] whitespace-pre-line text-[#5C6273]">
                      {ayarlar.odemeAciklamasi ||
                        "Ödeme bilgileri için bizimle iletişime geçebilirsin. Ödemen görüldüğünde görüşme saatini planlayıp buraya ekleyeceğiz."}
                    </p>
                    <p className="mt-2 text-[12.5px] text-[#656B7A]">
                      Ödemen onaylandığında bu talep otomatik olarak planlamaya geçer.
                    </p>
                  </div>
                )}

                {g.durum === "planlandi" && !link && (
                  <p className="mt-3 text-[13px] text-[#656B7A]">
                    Görüşme bağlantısı yaklaşınca burada görünecek.
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
