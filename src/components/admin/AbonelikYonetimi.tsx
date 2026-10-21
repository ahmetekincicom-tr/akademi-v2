"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Toggle } from "@/components/admin/Toggle";
import { Icon } from "@/components/Icon";
import { useBildirim } from "@/components/Bildirim";
import type { AbonelikAyari } from "@/lib/abonelik-hesap";
import {
  abonelikAyariniKaydet,
  aboneligiSor,
  planiDogrula,
  sureTani,
  sureyiBitir,
  yoneticiIptalEt,
} from "@/app/kontrol-9f4x2k/(protected)/abonelikler/actions";

export type AbonelikSatiri = {
  id: string;
  isim: string;
  email: string;
  kaynak: "iyzico" | "yonetici";
  durum: string;
  durumEtiketi: string;
  erisimAcik: boolean;
  erisimBitis: string;
  donemBitis: string;
  tutar: number | null;
  testModu: boolean;
  sonHata: string | null;
  not: string | null;
  baslangic: string;
  iyzicoda: boolean;
};

const KART = "rounded-2xl border border-ink/10 bg-white p-5 sm:p-6";
const GIRDI =
  "h-11 w-full rounded-[10px] border border-ink/13 bg-white px-3 text-[14px] outline-none focus:border-brand";
const ETIKET = "mb-1.5 block font-mono text-[10.5px] tracking-[0.12em] text-[#8A92A6] uppercase";

const paraBicimi = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 });

export function AbonelikYonetimi({
  ayar: ilkAyar,
  satirlar,
  ozet,
  kurulum,
}: {
  ayar: AbonelikAyari;
  satirlar: AbonelikSatiri[];
  ozet: { aktif: number; aylikGelir: number };
  kurulum: { canliAnahtar: boolean; testAnahtar: boolean; merchantId: boolean; bildirimAdresi: string };
}) {
  const router = useRouter();
  const bildir = useBildirim();
  const [ayar, setAyar] = useState(ilkAyar);
  const [planBilgisi, setPlanBilgisi] = useState<Record<string, string>>({});
  const [sure, setSure] = useState({ email: "", gun: "30", not: "" });
  const [filtre, setFiltre] = useState<"hepsi" | "acik" | "test">("acik");
  const [islemde, startTransition] = useTransition();

  const calistir = (is: () => Promise<{ tamam?: boolean; hata?: string; bilgi?: string }>, basari: string) =>
    startTransition(async () => {
      const r = await is();
      if (r.hata) bildir.hata(r.hata);
      else {
        bildir.basarili(r.bilgi ?? basari);
        router.refresh();
      }
    });

  const dogrula = (test: boolean) => {
    const kodu = test ? ayar.testPlanKodu : ayar.planKodu;
    startTransition(async () => {
      const r = await planiDogrula(test, kodu);
      setPlanBilgisi((p) => ({ ...p, [test ? "test" : "canli"]: r.hata ? `✗ ${r.hata}` : `✓ ${r.bilgi}` }));
    });
  };

  const gorunen = satirlar.filter((s) =>
    filtre === "hepsi" ? true : filtre === "test" ? s.testModu : s.erisimAcik && !s.testModu,
  );

  return (
    <div className="mt-6 flex flex-col gap-5">
      {/* ------------------------------------------------------ özet --- */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Ozet etiket="Durum" deger={ayar.acik && !ayar.testModu ? "Katılımcılara açık" : ayar.testModu ? "Test modu" : "Kapalı"} />
        <Ozet etiket="İzlemesi açık abone" deger={String(ozet.aktif)} />
        <Ozet etiket="Aylık yenilenen gelir" deger={paraBicimi.format(ozet.aylikGelir)} />
      </div>

      {/* ---------------------------------------------------- ayarlar --- */}
      <section className={`${KART} flex flex-col gap-4`}>
        <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Ayarlar</h2>

        <Toggle
          checked={ayar.testModu}
          onToggle={() => setAyar((a) => ({ ...a, testModu: !a.testModu }))}
          label="Test modu"
          sublabel="Açıkken abonelik yalnızca yöneticilere görünür ve iyzico'nun test ortamına gider. Gerçek kart çekilmez."
        />
        <Toggle
          checked={ayar.acik}
          onToggle={() => setAyar((a) => ({ ...a, acik: !a.acik }))}
          label="Katılımcılara açık"
          sublabel="Test modu kapalıyken Derslerim ve Video aboneliği bölümleri bütün katılımcılara açılır."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PlanAlani
            etiket="Canlı plan kodu"
            deger={ayar.planKodu}
            onChange={(v) => setAyar((a) => ({ ...a, planKodu: v }))}
            onDogrula={() => dogrula(false)}
            bilgi={planBilgisi.canli}
            islemde={islemde}
          />
          <PlanAlani
            etiket="Test plan kodu"
            deger={ayar.testPlanKodu}
            onChange={(v) => setAyar((a) => ({ ...a, testPlanKodu: v }))}
            onDogrula={() => dogrula(true)}
            bilgi={planBilgisi.test}
            islemde={islemde}
          />
          <label>
            <span className={ETIKET}>Sayfada gösterilen aylık ücret (₺)</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={ayar.fiyat || ""}
              onChange={(e) => setAyar((a) => ({ ...a, fiyat: Number(e.target.value) }))}
              className={GIRDI}
            />
            <span className="mt-1 block text-[12px] text-[#8A92A6]">
              Kartlardan çekilen tutar iyzico&apos;daki plandan gelir; ikisini aynı tut.
            </span>
          </label>
          <label>
            <span className={ETIKET}>Reddedilen ödemede ek süre (gün)</span>
            <input
              type="number"
              min={0}
              max={14}
              value={ayar.ekSureGun}
              onChange={(e) => setAyar((a) => ({ ...a, ekSureGun: Number(e.target.value) }))}
              className={GIRDI}
            />
          </label>
        </div>

        <button
          type="button"
          disabled={islemde}
          onClick={() => calistir(() => abonelikAyariniKaydet(ayar), "Ayarlar kaydedildi.")}
          className="self-start rounded-[10px] bg-brand px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-ink disabled:opacity-60"
        >
          Kaydet
        </button>
      </section>

      {/* --------------------------------------------------- kurulum --- */}
      <section className={`${KART} flex flex-col gap-3`}>
        <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Kurulum</h2>
        <Kontrol tamam={kurulum.testAnahtar} metin="Test ortamı anahtarları (IYZICO_SANDBOX_API_KEY / IYZICO_SANDBOX_SECRET_KEY)" />
        <Kontrol tamam={kurulum.canliAnahtar} metin="Canlı iyzico anahtarları (IYZICO_ORTAM = canli)" />
        <Kontrol
          tamam={kurulum.merchantId}
          metin="Bildirim imzası için üye işyeri numarası (IYZICO_MERCHANT_ID) — isteğe bağlı"
        />
        <div className="rounded-[12px] bg-mist/60 px-4 py-3 text-[13px] text-ink">
          iyzico paneli → Ayarlar → Üye İşyeri Ayarları → Abonelik Bildirimleri adresine şunu gir:
          <code className="mt-1.5 block font-mono text-[12.5px] break-all text-brand">{kurulum.bildirimAdresi}</code>
        </div>
      </section>

      {/* ------------------------------------------------ süre tanı --- */}
      <section className={`${KART} flex flex-col gap-3`}>
        <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Elle süre tanı</h2>
        <p className="text-[13.5px] text-[#5C6273]">
          Ödemesiz izleme hakkı: hediye, telafi ya da kurumsal anlaşma. Kartından bir şey çekilmez.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr_2fr_auto] sm:items-end">
          <label>
            <span className={ETIKET}>Üyenin e-postası</span>
            <input value={sure.email} onChange={(e) => setSure((s) => ({ ...s, email: e.target.value }))} className={GIRDI} />
          </label>
          <label>
            <span className={ETIKET}>Gün</span>
            <input
              type="number"
              min={1}
              max={400}
              value={sure.gun}
              onChange={(e) => setSure((s) => ({ ...s, gun: e.target.value }))}
              className={GIRDI}
            />
          </label>
          <label>
            <span className={ETIKET}>Not</span>
            <input value={sure.not} onChange={(e) => setSure((s) => ({ ...s, not: e.target.value }))} className={GIRDI} />
          </label>
          <button
            type="button"
            disabled={islemde || !sure.email.trim()}
            onClick={() =>
              calistir(async () => {
                const r = await sureTani({ email: sure.email, gun: Number(sure.gun), not: sure.not });
                if (r.tamam) setSure({ email: "", gun: "30", not: "" });
                return r;
              }, "Süre tanındı.")
            }
            className="h-11 rounded-[10px] bg-ink px-4 text-[14px] font-semibold text-white hover:bg-brand disabled:opacity-60"
          >
            Tanı
          </button>
        </div>
      </section>

      {/* --------------------------------------------------- liste --- */}
      <section className={`${KART} flex flex-col gap-4`}>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-auto font-heading text-lg font-semibold tracking-[-0.02em]">Abonelikler</h2>
          {(["acik", "test", "hepsi"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFiltre(f)}
              className={`rounded-full px-3 py-1.5 text-[12.5px] font-semibold ${
                filtre === f ? "bg-ink text-white" : "bg-mist text-[#5B6478] hover:text-ink"
              }`}
            >
              {f === "acik" ? "İzlemesi açık" : f === "test" ? "Test" : "Hepsi"}
            </button>
          ))}
        </div>

        {gorunen.length === 0 ? (
          <p className="py-6 text-center text-[14px] text-[#8A92A6]">Bu görünümde kayıt yok.</p>
        ) : (
          <div className="-mx-5 overflow-x-auto sm:-mx-6">
            <table className="w-full min-w-[760px] text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-ink/8 font-mono text-[10.5px] tracking-[0.1em] text-[#8A92A6] uppercase">
                  <th className="px-5 py-2.5 sm:px-6">Üye</th>
                  <th className="px-2 py-2.5">Durum</th>
                  <th className="px-2 py-2.5">Ücret</th>
                  <th className="px-2 py-2.5">Dönem sonu</th>
                  <th className="px-2 py-2.5">İzleme</th>
                  <th className="px-5 py-2.5 sm:px-6" />
                </tr>
              </thead>
              <tbody>
                {gorunen.map((s) => (
                  <tr key={s.id} className="border-b border-ink/6 align-top last:border-b-0">
                    <td className="px-5 py-3 sm:px-6">
                      <div className="font-semibold text-ink">{s.isim}</div>
                      <div className="text-[12.5px] text-[#8A92A6]">{s.email}</div>
                      {s.not && <div className="mt-1 text-[12px] text-[#5B6478]">Not: {s.not}</div>}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold">{s.kaynak === "yonetici" ? "Elle tanındı" : s.durumEtiketi}</span>
                        {s.testModu && (
                          <span className="rounded-full bg-[#FFF4D6] px-2 py-0.5 font-mono text-[10px] text-[#9A6A00]">TEST</span>
                        )}
                      </div>
                      {s.sonHata && <div className="mt-1 max-w-[220px] text-[12px] text-[#B4232A]">{s.sonHata}</div>}
                      <div className="mt-1 text-[12px] text-[#8A92A6]">Başlangıç {s.baslangic}</div>
                    </td>
                    <td className="px-2 py-3">{s.tutar != null ? paraBicimi.format(s.tutar) : "—"}</td>
                    <td className="px-2 py-3">{s.donemBitis}</td>
                    <td className="px-2 py-3">
                      <span style={{ color: s.erisimAcik ? "#12825A" : "#8A92A6" }} className="font-semibold">
                        {s.erisimAcik ? `${s.erisimBitis} tarihine kadar` : "Kapalı"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap sm:px-6">
                      {s.kaynak === "iyzico" && (
                        <button
                          type="button"
                          disabled={islemde}
                          onClick={() => calistir(() => aboneligiSor(s.id), "iyzico'dan güncellendi.")}
                          className="inline-flex items-center gap-1 rounded-[8px] px-2 py-1 text-[12.5px] font-semibold text-brand hover:bg-brand/8 disabled:opacity-60"
                        >
                          <Icon name="search" size={13} />
                          iyzico&apos;ya sor
                        </button>
                      )}
                      {s.kaynak === "iyzico" && s.iyzicoda && (s.durum === "aktif" || s.durum === "odeme_alinamadi") && (
                        <button
                          type="button"
                          disabled={islemde}
                          onClick={() => {
                            if (window.confirm(`${s.isim} için abonelik iptal edilsin mi? Ödenmiş dönemin sonuna kadar izleyebilir.`)) {
                              calistir(() => yoneticiIptalEt(s.id), "Abonelik iptal edildi.");
                            }
                          }}
                          className="ml-1 rounded-[8px] px-2 py-1 text-[12.5px] font-semibold text-[#B4232A] hover:bg-[#FDF0F0] disabled:opacity-60"
                        >
                          İptal et
                        </button>
                      )}
                      {s.kaynak === "yonetici" && s.erisimAcik && (
                        <button
                          type="button"
                          disabled={islemde}
                          onClick={() => calistir(() => sureyiBitir(s.id), "Süre bitirildi.")}
                          className="rounded-[8px] px-2 py-1 text-[12.5px] font-semibold text-[#B4232A] hover:bg-[#FDF0F0] disabled:opacity-60"
                        >
                          Süreyi bitir
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Ozet({ etiket, deger }: { etiket: string; deger: string }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white px-5 py-4">
      <div className="font-mono text-[10.5px] tracking-[0.12em] text-[#8A92A6] uppercase">{etiket}</div>
      <div className="mt-1.5 font-heading text-[20px] font-semibold tracking-[-0.02em] text-ink">{deger}</div>
    </div>
  );
}

function PlanAlani({
  etiket,
  deger,
  onChange,
  onDogrula,
  bilgi,
  islemde,
}: {
  etiket: string;
  deger: string;
  onChange: (v: string) => void;
  onDogrula: () => void;
  bilgi?: string;
  islemde: boolean;
}) {
  return (
    <div>
      <span className={ETIKET}>{etiket}</span>
      <div className="flex gap-2">
        <input value={deger} onChange={(e) => onChange(e.target.value)} className={GIRDI} placeholder="iyzico planının referans kodu" />
        <button
          type="button"
          disabled={islemde || !deger.trim()}
          onClick={onDogrula}
          className="h-11 flex-none rounded-[10px] border border-ink/13 px-3 text-[13px] font-semibold text-ink hover:border-brand hover:text-brand disabled:opacity-50"
        >
          Doğrula
        </button>
      </div>
      {bilgi && (
        <span className={`mt-1 block text-[12px] ${bilgi.startsWith("✓") ? "text-[#12825A]" : "text-[#B4232A]"}`}>{bilgi}</span>
      )}
    </div>
  );
}

function Kontrol({ tamam, metin }: { tamam: boolean; metin: string }) {
  return (
    <div className="flex items-start gap-2.5 text-[13.5px] text-ink">
      <span
        className={`mt-[2px] flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full ${
          tamam ? "bg-[#E3F6EE] text-[#12825A]" : "bg-[#FDF0F0] text-[#B4232A]"
        }`}
      >
        <Icon name={tamam ? "check" : "x"} size={11} strokeWidth={3} />
      </span>
      {metin}
    </div>
  );
}
