"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bildirimGonder } from "@/app/admin/(protected)/bildirimler/actions";
import { useBildirim } from "@/components/Bildirim";
import { Icon } from "@/components/Icon";

export type PushAlici = { id: string; isim: string; eposta: string; cihaz: number };
export type PushGecmis = {
  id: string;
  baslik: string;
  govde: string;
  hedef: string;
  cihazSayisi: number;
  basarili: number;
  hata: string | null;
  tarih: string;
};

const tarihBicimi = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export function BildirimGonderim({
  alicilar,
  gecmis,
  toplamCihaz,
  yapilandirildi,
}: {
  alicilar: PushAlici[];
  gecmis: PushGecmis[];
  toplamCihaz: number;
  yapilandirildi: boolean;
}) {
  const router = useRouter();
  const bildir = useBildirim();
  const [islemde, startTransition] = useTransition();
  const [hedef, setHedef] = useState("");
  const [baslik, setBaslik] = useState("");
  const [govde, setGovde] = useState("");

  const cihazliAlicilar = alicilar.filter((a) => a.cihaz > 0);
  const secili = alicilar.find((a) => a.id === hedef);
  const ulasilacak = hedef ? (secili?.cihaz ?? 0) : toplamCihaz;

  const gonder = () => {
    const veri = new FormData();
    veri.set("baslik", baslik);
    veri.set("govde", govde);
    veri.set("hedef", hedef);

    startTransition(async () => {
      const r = await bildirimGonder(veri);
      if (r?.error) {
        bildir.hata(r.error);
        return;
      }
      bildir.basarili(r.mesaj ?? "Gönderildi.");
      setBaslik("");
      setGovde("");
      router.refresh();
    });
  };

  return (
    <main className="flex flex-col gap-6 p-[34px] pb-14">
      <div>
        <h1 className="font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em]">
          Push bildirimler
        </h1>
        <p className="mt-2 max-w-[620px] text-[15px] text-[#5C6273]">
          Mobil uygulamayı kurmuş ve bildirim iznini vermiş öğrencilere anlık bildirim gönderir.
          Uygulamayı kurmayanlar bu listede görünmez.
        </p>
      </div>

      {!yapilandirildi && (
        <div className="rounded-2xl border border-danger/35 bg-[#FDF2F2] p-5">
          <div className="text-[15px] font-semibold text-ink">APNs anahtarı tanımlı değil</div>
          <div className="mt-1 text-[13.5px] leading-[1.55] text-[#5C6273]">
            Gönderim için <code className="font-mono text-[12.5px]">APNS_KEY_ID</code>,{" "}
            <code className="font-mono text-[12.5px]">APNS_TEAM_ID</code>,{" "}
            <code className="font-mono text-[12.5px]">APNS_BUNDLE_ID</code> ve{" "}
            <code className="font-mono text-[12.5px]">APNS_KEY_P8</code> ortam değişkenleri gerekiyor.
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="rounded-2xl border border-ink/10 bg-white p-5 sm:p-6">
          <label className="block text-[13px] font-semibold text-ink">Kime</label>
          <select
            value={hedef}
            onChange={(e) => setHedef(e.target.value)}
            className="mt-2 h-11 w-full rounded-[10px] border border-ink/13 bg-white px-3 text-[14px] text-ink"
          >
            <option value="">Tüm öğrenciler ({toplamCihaz} cihaz)</option>
            {cihazliAlicilar.map((a) => (
              <option key={a.id} value={a.id}>
                {a.isim} ({a.cihaz} cihaz)
              </option>
            ))}
          </select>

          <label className="mt-5 block text-[13px] font-semibold text-ink">Başlık</label>
          <input
            value={baslik}
            onChange={(e) => setBaslik(e.target.value)}
            maxLength={80}
            placeholder="Yeni ders yayında"
            className="mt-2 h-11 w-full rounded-[10px] border border-ink/13 bg-white px-3 text-[14px] text-ink"
          />

          <label className="mt-5 block text-[13px] font-semibold text-ink">Mesaj</label>
          <textarea
            value={govde}
            onChange={(e) => setGovde(e.target.value)}
            maxLength={300}
            rows={4}
            placeholder="Reklam Yönetimi programına 3. modül eklendi."
            className="mt-2 w-full rounded-[10px] border border-ink/13 bg-white p-3 text-[14px] leading-[1.55] text-ink"
          />
          <div className="mt-1 text-right font-mono text-[11px] text-[#8A90A0]">{govde.length}/300</div>

          <button
            type="button"
            disabled={islemde || !baslik.trim() || !govde.trim() || ulasilacak === 0}
            onClick={gonder}
            className="mt-4 inline-flex h-11 items-center gap-2 rounded-[10px] bg-brand px-5 text-[14px] font-semibold text-white transition hover:bg-ink disabled:opacity-45"
          >
            <Icon name="bell" size={16} />
            {islemde ? "Gönderiliyor…" : `Gönder (${ulasilacak} cihaz)`}
          </button>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white p-5">
          <div className="font-mono text-[10px] tracking-[0.18em] text-[#8A90A0] uppercase">Önizleme</div>
          {/* iOS bildirim kartının kaba taklidi: metnin telefonda nasıl kırpılacağı görülsün. */}
          <div className="mt-3 rounded-[14px] bg-[#EDEFF4] p-3">
            <div className="flex items-start gap-2.5">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[8px] bg-brand font-heading text-[12px] font-bold text-white">
                AE
              </span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-ink">
                  {baslik || "Bildirim başlığı"}
                </div>
                <div className="mt-[2px] line-clamp-3 text-[12.5px] leading-[1.45] text-[#4A5060]">
                  {govde || "Mesaj metni burada görünecek."}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 text-[12.5px] leading-[1.55] text-[#5C6273]">
            Kayıtlı cihaz: <strong className="text-ink">{toplamCihaz}</strong>
            <br />
            Bildirimi açan öğrenci: <strong className="text-ink">{cihazliAlicilar.length}</strong>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-ink/10 bg-white p-5 sm:p-6">
        <h2 className="font-heading text-[17px] font-semibold tracking-[-0.02em]">Son gönderimler</h2>
        {gecmis.length === 0 ? (
          <p className="mt-3 text-[13.5px] text-[#5C6273]">Henüz bildirim gönderilmedi.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {gecmis.map((g) => (
              <div key={g.id} className="rounded-[12px] border border-ink/8 bg-paper p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="text-[14px] font-semibold text-ink">{g.baslik}</div>
                  <div className="font-mono text-[11px] text-[#8A90A0]">
                    {tarihBicimi.format(new Date(g.tarih))}
                  </div>
                </div>
                <div className="mt-1 text-[13px] leading-[1.55] text-[#5C6273]">{g.govde}</div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-[#8A90A0]">
                  <span>{g.hedef}</span>
                  <span>
                    {g.basarili}/{g.cihazSayisi} cihaz
                  </span>
                  {g.hata && <span className="text-danger-ink">{g.hata}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
