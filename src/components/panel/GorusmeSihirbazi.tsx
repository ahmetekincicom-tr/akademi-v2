"use client";

import { useState } from "react";
import { SihirbazAdimlari } from "@/components/panel/SihirbazAdimlari";
import { Icon } from "@/components/Icon";

/**
 * Danışmanlık talebi, dört adımda.
 *
 * Öncesinde üç boş kutu vardı: "Konu", "Detay", "Tercih ettiğin zamanlar".
 * Boş bir metin kutusu ne yazılacağını söylemiyor; gelen taleplerin çoğu tek
 * cümlelik ("reklam sorunu") oluyor ve görüşmeye hazırlıksız giriliyordu.
 * Adımlarda önce hazır seçenekler var, serbest metin onları tamamlıyor.
 */

const KONULAR = [
  { deger: "Reklam hesabı / kısıtlama sorunu", ikon: "shield" as const },
  { deger: "Kampanya kurulumu ve optimizasyon", ikon: "sliders" as const },
  { deger: "Bütçe ve ölçekleme", ikon: "card" as const },
  { deger: "İçerik ve sosyal medya stratejisi", ikon: "sparkle" as const },
  { deger: "Ölçümleme, piksel ve raporlama", ikon: "grid" as const },
  { deger: "Diğer", ikon: "message" as const },
];

const ZAMANLAR = [
  "Hafta içi sabah (09–12)",
  "Hafta içi öğleden sonra (12–17)",
  "Hafta içi akşam (17–21)",
  "Hafta sonu",
];

const BASLIKLAR = ["Konu", "Detay", "Zaman", "Özet"];

export function GorusmeSihirbazi({
  bilgi,
  islemde,
  onGonder,
  onVazgec,
}: {
  /** Ücret / hak durumu; adım 4'te gönderimden hemen önce gösteriliyor. */
  bilgi: string;
  islemde: boolean;
  onGonder: (girdi: { konu: string; aciklama: string; tercihZaman: string }) => void;
  onVazgec: () => void;
}) {
  const [adim, setAdim] = useState(1);
  const [konuSecim, setKonuSecim] = useState("");
  const [konuSerbest, setKonuSerbest] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [zamanlar, setZamanlar] = useState<string[]>([]);
  const [zamanNot, setZamanNot] = useState("");

  // "Diğer" seçildiğinde başlık serbest metinden geliyor; aksi halde seçenek
  // metninin kendisi konu oluyor.
  const konu = konuSecim === "Diğer" ? konuSerbest.trim() : konuSecim;
  const tercihZaman = [zamanlar.join(", "), zamanNot.trim()].filter(Boolean).join(" · ");

  const gecerli = adim === 1 ? konu.length > 2 : true;

  function zamanDegistir(z: string) {
    setZamanlar((v) => (v.includes(z) ? v.filter((x) => x !== z) : [...v, z]));
  }

  return (
    <div id="gorusme-talep-formu" className="mt-5 rounded-2xl border border-brand/30 bg-white p-5 sm:p-6">
      <SihirbazAdimlari basliklar={BASLIKLAR} adim={adim} />

      <div className="mt-6">
        {adim === 1 && (
          <>
            <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Ne konuşmak istiyorsun?</h2>
            <p className="mt-1 text-[13.5px] text-[#5C6273]">Sana en yakın başlığı seç.</p>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {KONULAR.map((k) => {
                const secili = konuSecim === k.deger;
                return (
                  <button
                    key={k.deger}
                    type="button"
                    onClick={() => setKonuSecim(k.deger)}
                    aria-pressed={secili}
                    className="flex items-center gap-3 rounded-[12px] border p-[14px] text-left transition"
                    style={{
                      borderColor: secili ? "#1C56F3" : "rgba(10,13,24,0.12)",
                      background: secili ? "rgba(28,86,243,0.06)" : "#FFFFFF",
                    }}
                  >
                    <span
                      className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px]"
                      style={{
                        background: secili ? "#1C56F3" : "rgba(28,86,243,0.09)",
                        color: secili ? "#FFFFFF" : "#1C56F3",
                      }}
                    >
                      <Icon name={k.ikon} size={17} />
                    </span>
                    <span className="min-w-0 text-[14px] leading-[1.35] font-medium text-ink">{k.deger}</span>
                  </button>
                );
              })}
            </div>

            {konuSecim === "Diğer" && (
              <input
                type="text"
                autoFocus
                value={konuSerbest}
                onChange={(e) => setKonuSerbest(e.target.value)}
                placeholder="Konuyu bir cümleyle yaz"
                className="mt-3 h-[46px] w-full rounded-[10px] border border-ink/13 bg-white px-[14px] text-[15px] text-ink outline-none focus:border-brand"
              />
            )}
          </>
        )}

        {adim === 2 && (
          <>
            <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Biraz açar mısın?</h2>
            <p className="mt-1 text-[13.5px] leading-[1.55] text-[#5C6273]">
              Neyi denedin, nerede takıldın? Yazdıkça görüşmeye hazırlıklı geliyoruz. İstemezsen boş bırakabilirsin.
            </p>
            <textarea
              autoFocus
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              placeholder="Örn. Kampanyayı 500 TL'ye çıkardım, dönüşüm maliyeti iki katına çıktı. Kitleyi mi daraltmalıyım?"
              className="mt-4 min-h-[130px] w-full resize-y rounded-[10px] border border-ink/13 bg-white px-[14px] py-3 text-[15px] leading-[1.6] text-ink outline-none focus:border-brand"
            />
          </>
        )}

        {adim === 3 && (
          <>
            <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Ne zaman uygunsun?</h2>
            <p className="mt-1 text-[13.5px] text-[#5C6273]">Birden fazla seçebilirsin; planlamayı kolaylaştırır.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {ZAMANLAR.map((z) => {
                const secili = zamanlar.includes(z);
                return (
                  <button
                    key={z}
                    type="button"
                    onClick={() => zamanDegistir(z)}
                    aria-pressed={secili}
                    className="inline-flex h-10 items-center gap-[7px] rounded-full border px-[15px] text-[13.5px] font-medium transition"
                    style={{
                      borderColor: secili ? "#1C56F3" : "rgba(10,13,24,0.13)",
                      background: secili ? "rgba(28,86,243,0.08)" : "#FFFFFF",
                      color: secili ? "#1C56F3" : "#3A3F4F",
                    }}
                  >
                    {secili && <Icon name="check" size={13} strokeWidth={3} />}
                    {z}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={zamanNot}
              onChange={(e) => setZamanNot(e.target.value)}
              placeholder="Eklemek istediğin bir not (örn. salı günleri olmaz)"
              className="mt-4 h-[46px] w-full rounded-[10px] border border-ink/13 bg-white px-[14px] text-[15px] text-ink outline-none focus:border-brand"
            />
          </>
        )}

        {adim === 4 && (
          <>
            <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Talebini gönderelim mi?</h2>
            <dl className="mt-4 divide-y divide-ink/8 overflow-hidden rounded-[12px] border border-ink/10">
              <Satir etiket="Konu" deger={konu} />
              <Satir etiket="Detay" deger={aciklama.trim() || "—"} />
              <Satir etiket="Zaman" deger={tercihZaman || "Belirtilmedi"} />
            </dl>
            <p className="mt-4 rounded-[11px] bg-mist px-4 py-3 text-[13.5px] leading-[1.6] text-[#3A3F4F]">
              {bilgi}
            </p>
          </>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => (adim === 1 ? onVazgec() : setAdim((a) => a - 1))}
          className="inline-flex h-[46px] items-center gap-[7px] rounded-[10px] border border-ink/13 bg-white px-4 text-[14px] font-semibold text-ink transition hover:border-brand hover:text-brand"
        >
          <Icon name="arrowLeft" size={15} />
          {adim === 1 ? "Vazgeç" : "Geri"}
        </button>

        {adim < 4 ? (
          <button
            type="button"
            onClick={() => setAdim((a) => a + 1)}
            disabled={!gecerli}
            className="inline-flex h-[46px] items-center gap-[7px] rounded-[10px] bg-brand px-5 text-[14px] font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-45"
          >
            Devam
            <Icon name="arrowRight" size={15} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onGonder({ konu, aciklama, tercihZaman })}
            disabled={islemde}
            className="inline-flex h-[46px] items-center gap-[7px] rounded-[10px] bg-brand px-5 text-[14px] font-semibold text-white transition hover:bg-ink disabled:opacity-50"
          >
            <Icon name="check" size={15} />
            {islemde ? "Gönderiliyor…" : "Talebi gönder"}
          </button>
        )}
      </div>
    </div>
  );
}

function Satir({ etiket, deger }: { etiket: string; deger: string }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:gap-4">
      <dt className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase sm:w-[74px] sm:flex-none sm:pt-[3px]">
        {etiket}
      </dt>
      <dd className="min-w-0 text-[14px] leading-[1.55] break-words text-ink">{deger}</dd>
    </div>
  );
}
