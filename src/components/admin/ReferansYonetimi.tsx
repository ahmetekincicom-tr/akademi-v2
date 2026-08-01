"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { referansKaydet, referansSil } from "@/app/admin/(protected)/icerik-actions";
import { Icon } from "@/components/Icon";
import { Toggle } from "./Toggle";
import { useBildirim } from "@/components/Bildirim";

export type AdminReferans = {
  id: string;
  ad: string;
  sektor: string;
  logoYolu: string | null;
  logoUrl: string | null;
  siteUrl: string;
  sira: number;
  yayinda: boolean;
};

const BOS = { ad: "", sektor: "", siteUrl: "", sira: "0", yayinda: true };

export function ReferansYonetimi({ referanslar }: { referanslar: AdminReferans[] }) {
  const router = useRouter();
  const bildir = useBildirim();
  const [duzenlenen, setDuzenlenen] = useState<string | "yeni" | null>(null);
  const [form, setForm] = useState(BOS);
  const [dosya, setDosya] = useState<File | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [islemde, startTransition] = useTransition();

  const yeniAc = () => {
    setDuzenlenen("yeni");
    setForm({ ...BOS, sira: String(referanslar.length + 1) });
    setDosya(null);
    setHata(null);
  };

  const duzenle = (r: AdminReferans) => {
    setDuzenlenen(r.id);
    setForm({ ad: r.ad, sektor: r.sektor, siteUrl: r.siteUrl, sira: String(r.sira), yayinda: r.yayinda });
    setDosya(null);
    setHata(null);
  };

  const kaydet = async () => {
    setHata(null);
    setYukleniyor(true);

    let logoYolu: string | undefined;
    if (dosya) {
      const temizAd = dosya.name.replace(/[^\w.\-]/g, "_");
      const yol = `${Date.now()}-${temizAd}`;
      const supabase = createClient();
      const { error } = await supabase.storage.from("logolar").upload(yol, dosya);
      if (error) {
        setYukleniyor(false);
        setHata(error.message);
        bildir.hata(`Logo yüklenemedi: ${error.message}`);
        return;
      }
      logoYolu = yol;
    }

    const r = await referansKaydet({
      ...form,
      id: duzenlenen === "yeni" ? undefined : (duzenlenen ?? undefined),
      logoYolu,
    });

    setYukleniyor(false);
    if (r?.error) {
      setHata(r.error);
      bildir.hata(r.error);
    } else {
      setDuzenlenen(null);
      setDosya(null);
      bildir.basarili("Referans kaydedildi.");
      router.refresh();
    }
  };

  const sil = (r: AdminReferans) => {
    startTransition(async () => {
      const sonuc = await referansSil(r.id, r.logoYolu);
      if (sonuc?.error) {
        setHata(sonuc.error);
        bildir.hata(sonuc.error);
      } else {
        setDuzenlenen(null);
        bildir.basarili("Referans silindi.");
        router.refresh();
      }
    });
  };

  const yayindaSayisi = referanslar.filter((r) => r.yayinda).length;
  const mesgul = yukleniyor || islemde;

  return (
    <main className="p-7 pb-14">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
            Referans logoları
          </h1>
          <p className="mt-[7px] text-[14.5px] text-[#5C6273]">
            {referanslar.length} kurum · {yayindaSayisi} tanesi sitede görünüyor. Logo yüklemezsen kurum adı yazıyla
            çıkar.
          </p>
        </div>
        <button
          type="button"
          onClick={() => (duzenlenen === "yeni" ? setDuzenlenen(null) : yeniAc())}
          className="inline-flex h-10 items-center gap-[6px] rounded-[10px] bg-brand px-4 text-[13.5px] font-semibold text-white transition hover:bg-ink"
        >
          {duzenlenen !== "yeni" && <Icon name="plus" size={15} />}
          {duzenlenen === "yeni" ? "Vazgeç" : "Yeni referans"}
        </button>
      </div>

      {duzenlenen === "yeni" && (
        <ReferansFormu
          form={form}
          setForm={setForm}
          setDosya={setDosya}
          hata={hata}
          islemde={mesgul}
          onKaydet={kaydet}
          onVazgec={() => setDuzenlenen(null)}
          baslik="Yeni referans"
        />
      )}

      <div className="mt-5 overflow-hidden rounded-2xl border border-ink/10 bg-white">
        {referanslar.length === 0 ? (
          <div className="px-[22px] py-12 text-center text-sm text-[#8A8F9E]">
            Henüz referans eklenmemiş. Sağ üstten ekleyebilirsin.
          </div>
        ) : (
          referanslar.map((r) => (
            <div key={r.id} className="border-b border-ink/7 last:border-b-0">
              <div className="flex flex-wrap items-center gap-4 px-[22px] py-[14px] hover:bg-[#F7F9FF]">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-[8px] bg-mist font-mono text-[11px] text-[#5C6273]">
                  {r.sira}
                </span>
                <span className="flex h-11 w-[110px] flex-none items-center justify-center rounded-[9px] border border-ink/10 bg-mist px-2">
                  {r.logoUrl ? (
                    // Supabase Storage serves these; next/image would need remote host config.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.logoUrl} alt={r.ad} className="max-h-8 max-w-full object-contain" />
                  ) : (
                    <span className="truncate font-mono text-[10px] text-[#9CA1AE]">logo yok</span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{r.ad}</div>
                  {r.sektor && <div className="font-mono text-[10.5px] text-[#8A8F9E]">{r.sektor}</div>}
                </div>
                <span
                  className="flex-none rounded-full px-[9px] py-[3px] font-mono text-[9.5px] tracking-[0.08em] uppercase"
                  style={
                    r.yayinda
                      ? { background: "rgba(28,86,243,0.12)", color: "#1C56F3" }
                      : { background: "rgba(10,13,24,0.07)", color: "#5C6273" }
                  }
                >
                  {r.yayinda ? "Yayında" : "Gizli"}
                </span>
                <div className="flex flex-none gap-2">
                  <button
                    type="button"
                    onClick={() => (duzenlenen === r.id ? setDuzenlenen(null) : duzenle(r))}
                    className="h-8 rounded-[8px] border border-ink/13 bg-white px-3 text-[12.5px] font-semibold text-ink transition hover:border-ink hover:bg-ink hover:text-white"
                  >
                    {duzenlenen === r.id ? "Kapat" : "Düzenle"}
                  </button>
                  <button
                    type="button"
                    disabled={mesgul}
                    onClick={() => sil(r)}
                    aria-label="Referansı sil"
                    className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-ink/12 text-[#9CA1AE] transition hover:border-danger/45 hover:text-danger disabled:opacity-50"
                  >
                    <Icon name="x" size={14} />
                  </button>
                </div>
              </div>

              {duzenlenen === r.id && (
                <ReferansFormu
                  form={form}
                  setForm={setForm}
                  setDosya={setDosya}
                  hata={hata}
                  islemde={mesgul}
                  onKaydet={kaydet}
                  onVazgec={() => setDuzenlenen(null)}
                  logoNotu={r.logoUrl ? "Yeni dosya seçmezsen mevcut logo korunur." : undefined}
                  gomulu
                />
              )}
            </div>
          ))
        )}
      </div>
    </main>
  );
}

function ReferansFormu({
  form,
  setForm,
  setDosya,
  hata,
  islemde,
  onKaydet,
  onVazgec,
  baslik,
  logoNotu,
  gomulu,
}: {
  form: typeof BOS;
  setForm: (f: typeof BOS) => void;
  setDosya: (f: File | null) => void;
  hata: string | null;
  islemde: boolean;
  onKaydet: () => void;
  onVazgec: () => void;
  baslik?: string;
  logoNotu?: string;
  gomulu?: boolean;
}) {
  const alan = "h-[46px] rounded-[10px] border border-ink/13 bg-white px-[13px] text-sm text-ink outline-none focus:border-brand";

  return (
    <div
      className={
        gomulu
          ? "border-t border-ink/8 bg-[#FAFBFF] px-[22px] py-5"
          : "mt-5 rounded-2xl border border-brand/30 bg-white p-6"
      }
    >
      {baslik && <h2 className="mb-4 font-heading text-lg font-semibold tracking-[-0.02em]">{baslik}</h2>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[10px] tracking-[0.12em] text-[#8A8F9E] uppercase">Kurum adı</span>
          <input
            type="text"
            value={form.ad}
            onChange={(e) => setForm({ ...form, ad: e.target.value })}
            placeholder="Marka veya şirket"
            className={alan}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[10px] tracking-[0.12em] text-[#8A8F9E] uppercase">Sektör</span>
          <input
            type="text"
            value={form.sektor}
            onChange={(e) => setForm({ ...form, sektor: e.target.value })}
            placeholder="E-ticaret, kozmetik…"
            className={alan}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[10px] tracking-[0.12em] text-[#8A8F9E] uppercase">Web sitesi</span>
          <input
            type="text"
            value={form.siteUrl}
            onChange={(e) => setForm({ ...form, siteUrl: e.target.value })}
            placeholder="https://…"
            className={alan}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[10px] tracking-[0.12em] text-[#8A8F9E] uppercase">Sıra</span>
          <input
            type="number"
            value={form.sira}
            onChange={(e) => setForm({ ...form, sira: e.target.value })}
            className={alan}
          />
        </label>
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="font-mono text-[10px] tracking-[0.12em] text-[#8A8F9E] uppercase">Logo</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setDosya(e.target.files?.[0] ?? null)}
            className="h-[46px] rounded-[10px] border border-ink/13 bg-white px-[13px] pt-[11px] text-[13px] text-ink outline-none file:mr-3 file:rounded-[6px] file:border-0 file:bg-mist file:px-3 file:py-1 file:text-[12px] file:font-semibold focus:border-brand"
          />
          <span className="text-[12px] text-[#9CA1AE]">
            {logoNotu ?? "Şeffaf zeminli PNG veya SVG en iyi sonucu verir."}
          </span>
        </label>
      </div>

      <div className="mt-4 max-w-[320px]">
        <Toggle
          checked={form.yayinda}
          onToggle={() => setForm({ ...form, yayinda: !form.yayinda })}
          label="Sitede görünsün"
          sublabel="Kapalıysa yalnızca burada durur"
        />
      </div>

      {hata && <div className="mt-4 text-sm text-danger-ink">{hata}</div>}

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={onKaydet}
          disabled={islemde}
          className="h-[42px] rounded-[10px] bg-brand px-5 text-sm font-semibold text-white transition hover:bg-ink disabled:opacity-60"
        >
          {islemde ? "Kaydediliyor…" : "Kaydet"}
        </button>
        <button
          type="button"
          onClick={onVazgec}
          className="h-[42px] rounded-[10px] border border-ink/13 bg-white px-4 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand"
        >
          Vazgeç
        </button>
      </div>
    </div>
  );
}
