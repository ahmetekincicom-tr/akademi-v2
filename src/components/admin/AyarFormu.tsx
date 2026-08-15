"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ayarKaydet } from "@/app/kontrol-9f4x2k/(protected)/ayar-actions";
import { useBildirim } from "@/components/Bildirim";

export type AyarAlan = {
  ad: string;
  etiket: string;
  yerTutucu?: string;
  gizli?: boolean;
  genis?: boolean;
  ipucu?: string;
};

export type AyarGrubu = {
  anahtar: string;
  baslik: string;
  aciklama: string;
  alanlar: AyarAlan[];
};

export function AyarFormu({
  gruplar,
  degerler,
}: {
  gruplar: AyarGrubu[];
  degerler: Record<string, Record<string, string>>;
}) {
  return (
    <div className="mt-[22px] flex flex-col gap-5">
      {gruplar.map((g) => (
        <AyarKarti key={g.anahtar} grup={g} baslangic={degerler[g.anahtar] ?? {}} />
      ))}
    </div>
  );
}

function AyarKarti({ grup, baslangic }: { grup: AyarGrubu; baslangic: Record<string, string> }) {
  const router = useRouter();
  const bildir = useBildirim();
  const [form, setForm] = useState<Record<string, string>>(() =>
    Object.fromEntries(grup.alanlar.map((a) => [a.ad, baslangic[a.ad] ?? ""])),
  );
  const [durum, setDurum] = useState<{ tip: "ok" | "hata"; mesaj: string } | null>(null);
  const [islemde, startTransition] = useTransition();

  const kaydet = () => {
    setDurum(null);
    startTransition(async () => {
      const r = await ayarKaydet(grup.anahtar, form);
      if (r?.error) {
        setDurum({ tip: "hata", mesaj: r.error });
        bildir.hata(r.error);
      } else {
        setDurum({ tip: "ok", mesaj: "Kaydedildi." });
        bildir.basarili("Ayarlar kaydedildi.");
        router.refresh();
      }
    });
  };

  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-6">
      <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">{grup.baslik}</h2>
      <p className="mt-1 max-w-[640px] text-[13.5px] leading-[1.6] text-[#656B7A]">{grup.aciklama}</p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {grup.alanlar.map((a) => (
          <label key={a.ad} className={a.genis ? "flex flex-col gap-2 sm:col-span-2" : "flex flex-col gap-2"}>
            <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">{a.etiket}</span>
            <input
              type={a.gizli ? "password" : "text"}
              value={form[a.ad] ?? ""}
              onChange={(e) => setForm({ ...form, [a.ad]: e.target.value })}
              placeholder={a.yerTutucu}
              className="h-[46px] rounded-[10px] border border-ink/13 bg-white px-[13px] text-sm text-ink outline-none focus:border-brand"
            />
            {a.ipucu && <span className="text-[12px] text-[#656B7A]">{a.ipucu}</span>}
          </label>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-4">
        <button
          type="button"
          onClick={kaydet}
          disabled={islemde}
          className="h-[42px] rounded-[10px] bg-brand px-5 text-sm font-semibold text-white hover:bg-ink disabled:opacity-60"
        >
          {islemde ? "Kaydediliyor…" : "Kaydet"}
        </button>
        {durum && (
          <span className="text-[13.5px]" style={{ color: durum.tip === "ok" ? "#1C56F3" : "#8C1D1D" }}>
            {durum.mesaj}
          </span>
        )}
      </div>
    </div>
  );
}
