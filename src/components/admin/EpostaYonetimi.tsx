"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { useBildirim } from "@/components/Bildirim";
import { akisDurumuDegistir } from "@/app/kontrol-9f4x2k/(protected)/e-postalar/actions";
import { AKISLAR, AKIS_ADI, DURUM_ETIKET } from "@/lib/eposta-akislari";
import { TR_ZAMAN } from "@/lib/zaman";

export type GunlukSatiri = {
  id: string;
  akis: string;
  alici: string;
  konu: string;
  durum: string;
  sebep: string;
  tarih: string;
};

const anBicimi = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TR_ZAMAN,
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const DURUM_STIL: Record<string, { bg: string; renk: string }> = {
  gonderildi: { bg: "rgba(24,140,90,0.14)", renk: "#15774E" },
  basarisiz: { bg: "rgba(229,72,77,0.13)", renk: "#B4232A" },
  kapali: { bg: "#EEF2FC", renk: "#5C6273" },
  yapilandirilmadi: { bg: "rgba(201,138,27,0.16)", renk: "#A5711A" },
};

/**
 * E-posta bildirimlerinin yönetimi: hangileri gidiyor ve gerçekten gitti mi.
 *
 * İki bölüm bilerek aynı sayfada. "Neden mail gelmedi" sorusunun iki cevabı
 * var — ya akış kapalı ya da gönderim başarısız — ve ikisi ayrı ekranlarda
 * olsaydı hangisi olduğunu anlamak için iki yere bakmak gerekirdi. Günlükte
 * "Kapalı" satırı da göründüğü için cevap tek bakışta çıkıyor.
 */
export function EpostaYonetimi({
  kapaliAkislar,
  gunluk,
  yapilandirildi,
}: {
  kapaliAkislar: string[];
  gunluk: GunlukSatiri[];
  yapilandirildi: boolean;
}) {
  const router = useRouter();
  const bildir = useBildirim();
  const [islemde, basla] = useTransition();
  const [suzgec, setSuzgec] = useState<string>("hepsi");

  const kapali = useMemo(() => new Set(kapaliAkislar), [kapaliAkislar]);

  const katilimci = AKISLAR.filter((a) => a.kime === "katilimci");
  const yonetim = AKISLAR.filter((a) => a.kime === "yonetim");

  const listelenen = suzgec === "hepsi" ? gunluk : gunluk.filter((g) => g.durum === suzgec);

  // Son 150 kayıttaki dağılım; "bugün bir sorun var mı" sorusuna hızlı cevap.
  const sayim = useMemo(() => {
    const s: Record<string, number> = {};
    for (const g of gunluk) s[g.durum] = (s[g.durum] ?? 0) + 1;
    return s;
  }, [gunluk]);

  const degistir = (anahtar: string, acik: boolean, baslik: string) => {
    basla(async () => {
      const r = await akisDurumuDegistir(anahtar, acik);
      if (r?.error) {
        bildir.hata(r.error);
        return;
      }
      bildir.basarili(acik ? `${baslik} açıldı.` : `${baslik} kapatıldı.`);
      router.refresh();
    });
  };

  const akisSatiri = (a: (typeof AKISLAR)[number]) => {
    const zorunlu = "zorunlu" in a && a.zorunlu;
    const acik = zorunlu || !kapali.has(a.anahtar);

    return (
      <div
        key={a.anahtar}
        className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-ink/7 px-5 py-[14px] last:border-b-0 sm:px-6"
      >
        <div className="min-w-0 grow basis-[260px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[14.5px] leading-[1.3] font-semibold ${acik ? "text-ink" : "text-[#8A90A0]"}`}>
              {a.baslik}
            </span>
            {zorunlu && (
              <span className="rounded-full bg-mist px-[8px] py-[2px] font-mono text-[9px] tracking-[0.1em] text-[#5C6273] uppercase">
                Kapatılamaz
              </span>
            )}
          </div>
          <div className="mt-[3px] text-[13px] leading-[1.5] text-[#656B7A]">{a.aciklama}</div>
        </div>

        {zorunlu ? (
          /* Anahtar hiç çizilmiyor: kapalı görünen ama tıklanmayan bir düğme,
             kapatılabilir sanılıp defalarca denenirdi. */
          <span className="flex-none font-mono text-[10px] tracking-[0.08em] text-[#A6ABB8] uppercase">
            her zaman açık
          </span>
        ) : (
          <button
            type="button"
            role="switch"
            aria-checked={acik}
            aria-label={`${a.baslik} bildirimi`}
            disabled={islemde}
            onClick={() => degistir(a.anahtar, !acik, a.baslik)}
            className="relative h-[26px] w-[46px] flex-none rounded-full transition disabled:opacity-50"
            style={{ background: acik ? "#1C56F3" : "#D2D7E4" }}
          >
            <span
              className="absolute top-[3px] h-[20px] w-[20px] rounded-full bg-white shadow-sm transition-[left] duration-200"
              style={{ left: acik ? 23 : 3 }}
            />
          </button>
        )}
      </div>
    );
  };

  return (
    <main className="p-4 pb-14 sm:p-7">
      <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
        E-posta bildirimleri
      </h1>
      <p className="mt-[7px] max-w-[720px] text-[14.5px] leading-[1.6] text-[#5C6273]">
        Sistemden çıkan bildirimleri geçici olarak kapatabilir, gönderilip gönderilmediklerini aşağıdaki
        günlükten takip edebilirsin.
      </p>

      {!yapilandirildi && (
        <div className="mt-5 flex flex-wrap items-start gap-3 rounded-2xl border border-[#E0A21C]/35 bg-[#FDF6E7] px-5 py-4">
          <span className="mt-[2px] flex-none text-[#8A6210]">
            <Icon name="alert" size={18} />
          </span>
          <p className="min-w-0 flex-1 text-[13.5px] leading-[1.6] text-[#5C6273]">
            E-posta gönderimi yapılandırılmamış: <code className="font-mono text-[12.5px]">RESEND_API_KEY</code>,{" "}
            <code className="font-mono text-[12.5px]">BILDIRIM_GONDEREN</code> ve{" "}
            <code className="font-mono text-[12.5px]">BILDIRIM_EPOSTA</code> değişkenlerinden en az biri eksik.
            Aşağıdaki anahtarlar kaydedilir ama hiçbir mail gönderilmez.
          </p>
        </div>
      )}

      {/*
        Supabase'in kendi mailleri burada YOK ve olamaz. Bunu yazmak gerekiyor:
        aksi halde şifre sıfırlama maili de bu listede sanılır ve kapalı
        olmadığı halde "kapattım ama geliyor" ya da tersi karışıklığı çıkar.
      */}
      <div className="mt-5 flex flex-wrap items-start gap-3 rounded-2xl border border-ink/10 bg-white px-5 py-4">
        <span className="mt-[2px] flex-none text-[#8A90A0]">
          <Icon name="alert" size={17} />
        </span>
        <p className="min-w-0 flex-1 text-[13.5px] leading-[1.6] text-[#5C6273]">
          Şifre sıfırlama ve e-posta doğrulama mailleri bu listede değil: onları biz göndermiyoruz, Supabase
          gönderiyor. Ayarları Supabase panelinde, Authentication → Emails bölümünde.
        </p>
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <div className="border-b border-ink/8 px-5 py-4 sm:px-6">
          <h2 className="font-heading text-[17px] font-semibold tracking-[-0.02em]">Katılımcıya gidenler</h2>
        </div>
        {katilimci.map(akisSatiri)}
      </section>

      <section className="mt-5 overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <div className="border-b border-ink/8 px-5 py-4 sm:px-6">
          <h2 className="font-heading text-[17px] font-semibold tracking-[-0.02em]">Sana gidenler</h2>
        </div>
        {yonetim.map(akisSatiri)}
      </section>

      {/* ------------------------------------------------------- günlük --- */}
      <section className="mt-8 overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-ink/8 px-5 py-4 sm:px-6">
          <div className="min-w-0 grow basis-[220px]">
            <h2 className="font-heading text-[17px] font-semibold tracking-[-0.02em]">Gönderim günlüğü</h2>
            <p className="mt-[2px] text-[13px] text-[#656B7A]">Son {gunluk.length} kayıt.</p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {["hepsi", "gonderildi", "basarisiz", "kapali", "yapilandirilmadi"].map((d) => {
              // Hiç örneği olmayan durum için düğme çizmiyoruz; boş bir süzgeç
              // tıklanıp boş liste görmekten ibaret olurdu.
              if (d !== "hepsi" && !sayim[d]) return null;
              const secili = suzgec === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSuzgec(d)}
                  className="h-[30px] rounded-[8px] border px-[11px] font-mono text-[10.5px] tracking-[0.06em] uppercase transition"
                  style={{
                    borderColor: secili ? "#1C56F3" : "rgba(10,13,24,0.13)",
                    background: secili ? "rgba(28,86,243,0.09)" : "#FFFFFF",
                    color: secili ? "#1C56F3" : "#5C6273",
                  }}
                >
                  {d === "hepsi" ? `Hepsi ${gunluk.length}` : `${DURUM_ETIKET[d]} ${sayim[d]}`}
                </button>
              );
            })}
          </div>
        </div>

        {listelenen.length === 0 ? (
          <p className="px-5 py-10 text-center text-[13.5px] text-[#656B7A] sm:px-6">
            {gunluk.length === 0
              ? "Henüz kayıt yok. Bir bildirim gönderildiğinde burada görünecek."
              : "Bu süzgeçle eşleşen kayıt yok."}
          </p>
        ) : (
          <div className="divide-y divide-ink/7">
            {listelenen.map((g) => {
              const st = DURUM_STIL[g.durum] ?? DURUM_STIL.kapali;
              return (
                <div key={g.id} className="flex flex-wrap items-start gap-x-4 gap-y-2 px-5 py-[13px] sm:px-6">
                  <span
                    className="mt-[2px] w-fit flex-none rounded-full px-[9px] py-[3px] font-mono text-[9.5px] tracking-[0.08em] uppercase"
                    style={{ background: st.bg, color: st.renk }}
                  >
                    {DURUM_ETIKET[g.durum] ?? g.durum}
                  </span>

                  <div className="min-w-0 grow basis-[260px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13.5px] leading-[1.3] font-semibold text-ink">
                        {AKIS_ADI[g.akis] ?? g.akis}
                      </span>
                      {g.alici && (
                        <span className="truncate font-mono text-[11px] text-[#656B7A]">{g.alici}</span>
                      )}
                    </div>
                    {g.konu && (
                      <div className="mt-[3px] truncate text-[12.5px] text-[#5C6273]">{g.konu}</div>
                    )}
                    {/* Sebep yalnızca gitmeyen satırlarda dolu; asıl aranan bu. */}
                    {g.sebep && (
                      <div className="mt-[4px] text-[12px] leading-[1.5] break-words text-[#B4232A]">
                        {g.sebep}
                      </div>
                    )}
                  </div>

                  <time
                    dateTime={g.tarih}
                    className="flex-none font-mono text-[11px] whitespace-nowrap text-[#656B7A]"
                  >
                    {anBicimi.format(new Date(g.tarih))}
                  </time>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
