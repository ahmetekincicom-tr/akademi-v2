"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { yorumKaydet, yorumSil } from "@/app/admin/(protected)/icerik-actions";
import { Icon } from "@/components/Icon";
import { Toggle } from "./Toggle";
import { useBildirim } from "@/components/Bildirim";

export type AdminYorum = {
  id: string;
  metin: string;
  isim: string;
  rol: string;
  courseId: string | null;
  sira: number;
  yayinda: boolean;
};

const BOS = { metin: "", isim: "", rol: "", courseId: "", sira: "0", yayinda: true };

export function YorumYonetimi({
  yorumlar,
  kurslar,
}: {
  yorumlar: AdminYorum[];
  kurslar: { id: string; ad: string }[];
}) {
  const router = useRouter();
  const bildir = useBildirim();
  const [duzenlenen, setDuzenlenen] = useState<string | "yeni" | null>(null);
  const [form, setForm] = useState(BOS);
  const [hata, setHata] = useState<string | null>(null);
  const [islemde, startTransition] = useTransition();

  const yeniAc = () => {
    setDuzenlenen("yeni");
    setForm({ ...BOS, sira: String(yorumlar.length + 1) });
    setHata(null);
  };

  const duzenle = (y: AdminYorum) => {
    setDuzenlenen(y.id);
    setForm({
      metin: y.metin,
      isim: y.isim,
      rol: y.rol,
      courseId: y.courseId ?? "",
      sira: String(y.sira),
      yayinda: y.yayinda,
    });
    setHata(null);
  };

  const kaydet = () => {
    setHata(null);
    startTransition(async () => {
      const yeniMi = duzenlenen === "yeni";
      const r = await yorumKaydet({ ...form, id: yeniMi ? undefined : (duzenlenen ?? undefined) });
      if (r?.error) {
        setHata(r.error);
        bildir.hata(r.error);
      } else {
        setDuzenlenen(null);
        bildir.basarili(yeniMi ? "Yorum eklendi." : "Yorum güncellendi.");
        router.refresh();
      }
    });
  };

  const sil = (id: string) => {
    startTransition(async () => {
      const r = await yorumSil(id);
      if (r?.error) {
        setHata(r.error);
        bildir.hata(r.error);
      } else {
        setDuzenlenen(null);
        bildir.basarili("Yorum silindi.");
        router.refresh();
      }
    });
  };

  const yayindaSayisi = yorumlar.filter((y) => y.yayinda).length;

  return (
    <main className="p-4 pb-14 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
            Katılımcı yorumları
          </h1>
          <p className="mt-[7px] text-[14.5px] text-[#5C6273]">
            {yorumlar.length} yorum · {yayindaSayisi} tanesi sitede görünüyor. Sıra numarası küçük olan önce çıkar.
          </p>
        </div>
        <button
          type="button"
          onClick={() => (duzenlenen === "yeni" ? setDuzenlenen(null) : yeniAc())}
          className="inline-flex h-10 items-center gap-[6px] rounded-[10px] bg-brand px-4 text-[13.5px] font-semibold text-white transition hover:bg-ink"
        >
          {duzenlenen !== "yeni" && <Icon name="plus" size={15} />}
          {duzenlenen === "yeni" ? "Vazgeç" : "Yeni yorum"}
        </button>
      </div>

      {duzenlenen === "yeni" && (
        <YorumFormu
          form={form}
          setForm={setForm}
          kurslar={kurslar}
          hata={hata}
          islemde={islemde}
          onKaydet={kaydet}
          onVazgec={() => setDuzenlenen(null)}
          baslik="Yeni yorum"
        />
      )}

      <div className="mt-5 overflow-hidden rounded-2xl border border-ink/10 bg-white">
        {yorumlar.length === 0 ? (
          <div className="px-[22px] py-12 text-center text-sm text-[#656B7A]">
            Henüz yorum eklenmemiş. Sağ üstten ekleyebilirsin.
          </div>
        ) : (
          yorumlar.map((y) => (
            <div key={y.id} className="border-b border-ink/7 last:border-b-0">
              <div className="flex flex-wrap items-start gap-4 px-[22px] py-[16px] hover:bg-[#F7F9FF]">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-[8px] bg-mist font-mono text-[11px] text-[#5C6273]">
                  {y.sira}
                </span>
                {/* basis, dar ekranda satır kaydırmayı tetikler: min-w-0 tek başına
                    kaldığında metin alt satıra inmek yerine sıfıra doğru eziliyordu. */}
                <div className="min-w-0 grow basis-[240px]">
                  <p className="text-[14.5px] leading-[1.55] text-[#2B303D]">“{y.metin}”</p>
                  <div className="mt-2 font-mono text-[10.5px] text-[#656B7A]">
                    {y.isim}
                    {y.rol ? ` · ${y.rol}` : ""}
                    {y.courseId ? ` · ${kurslar.find((k) => k.id === y.courseId)?.ad ?? "eğitim"}` : ""}
                  </div>
                </div>
                <span
                  className="flex-none rounded-full px-[9px] py-[3px] font-mono text-[9.5px] tracking-[0.08em] uppercase"
                  style={
                    y.yayinda
                      ? { background: "rgba(28,86,243,0.12)", color: "#1C56F3" }
                      : { background: "rgba(10,13,24,0.07)", color: "#5C6273" }
                  }
                >
                  {y.yayinda ? "Yayında" : "Gizli"}
                </span>
                <div className="flex flex-none gap-2">
                  <button
                    type="button"
                    onClick={() => (duzenlenen === y.id ? setDuzenlenen(null) : duzenle(y))}
                    className="h-8 rounded-[8px] border border-ink/13 bg-white px-3 text-[12.5px] font-semibold text-ink transition hover:border-ink hover:bg-ink hover:text-white"
                  >
                    {duzenlenen === y.id ? "Kapat" : "Düzenle"}
                  </button>
                  <button
                    type="button"
                    disabled={islemde}
                    onClick={() => sil(y.id)}
                    aria-label="Yorumu sil"
                    className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-ink/12 text-[#656B7A] transition hover:border-danger/45 hover:text-danger disabled:opacity-50"
                  >
                    <Icon name="x" size={14} />
                  </button>
                </div>
              </div>

              {duzenlenen === y.id && (
                <YorumFormu
                  form={form}
                  setForm={setForm}
                  kurslar={kurslar}
                  hata={hata}
                  islemde={islemde}
                  onKaydet={kaydet}
                  onVazgec={() => setDuzenlenen(null)}
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

function YorumFormu({
  form,
  setForm,
  kurslar,
  hata,
  islemde,
  onKaydet,
  onVazgec,
  baslik,
  gomulu,
}: {
  form: typeof BOS;
  setForm: (f: typeof BOS) => void;
  kurslar: { id: string; ad: string }[];
  hata: string | null;
  islemde: boolean;
  onKaydet: () => void;
  onVazgec: () => void;
  baslik?: string;
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

      <label className="flex flex-col gap-2">
        <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">Yorum metni</span>
        <textarea
          value={form.metin}
          onChange={(e) => setForm({ ...form, metin: e.target.value })}
          placeholder="Katılımcının kendi cümleleri"
          className="min-h-[96px] resize-y rounded-[10px] border border-ink/13 bg-white px-[13px] py-3 text-sm leading-[1.6] text-ink outline-none focus:border-brand"
        />
      </label>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">İsim</span>
          <input
            type="text"
            value={form.isim}
            onChange={(e) => setForm({ ...form, isim: e.target.value })}
            placeholder="Ad Soyad"
            className={alan}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">Ünvan / şirket</span>
          <input
            type="text"
            value={form.rol}
            onChange={(e) => setForm({ ...form, rol: e.target.value })}
            placeholder="Kurucu, Marka adı"
            className={alan}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">İlgili eğitim</span>
          <select
            value={form.courseId}
            onChange={(e) => setForm({ ...form, courseId: e.target.value })}
            className={alan}
          >
            <option value="">Genel (tüm sayfalarda)</option>
            {kurslar.map((k) => (
              <option key={k.id} value={k.id}>
                {k.ad}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">Sıra</span>
          <input
            type="number"
            value={form.sira}
            onChange={(e) => setForm({ ...form, sira: e.target.value })}
            className={alan}
          />
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
