"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  hakkimizdaKaydet,
  hakkimizdaGorselGuncelle,
} from "@/app/kontrol-9f4x2k/(protected)/hakkimizda/actions";
import { createClient } from "@/lib/supabase/client";
import { useBildirim } from "@/components/Bildirim";
import { Icon } from "@/components/Icon";
import { kapakUrl } from "@/lib/kapak";
import type { HakkimizdaIcerik } from "@/lib/hakkimizda";

const ALAN =
  "h-[46px] rounded-[10px] border border-ink/13 bg-white px-[14px] text-[15px] text-ink outline-none focus:border-brand";
const METIN =
  "resize-y rounded-[10px] border border-ink/13 bg-white px-[14px] py-3 text-[15px] leading-[1.65] text-ink outline-none focus:border-brand";
const ETIKET = "font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase";

const KABUL = "image/png,image/jpeg,image/webp,image/avif";
const SINIR = 5 * 1024 * 1024;

export function HakkimizdaFormu({ icerik }: { icerik: HakkimizdaIcerik }) {
  const router = useRouter();
  const bildir = useBildirim();
  const [islemde, startTransition] = useTransition();
  const [form, setForm] = useState({
    heroEtiket: icerik.heroEtiket,
    heroBaslik: icerik.heroBaslik,
    heroVurgu: icerik.heroVurgu,
    heroMetin: icerik.heroMetin,
    kisiEtiket: icerik.kisiEtiket,
    kisiBaslik: icerik.kisiBaslik,
    kisiUnvan: icerik.kisiUnvan,
    kisiMetin: icerik.kisiMetin,
    akademiEtiket: icerik.akademiEtiket,
    akademiBaslik: icerik.akademiBaslik,
    akademiMetin: icerik.akademiMetin,
  });

  const degistir = (ad: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [ad]: e.target.value }));

  const kaydet = () => {
    startTransition(async () => {
      const r = await hakkimizdaKaydet(form);
      if (r?.error) bildir.hata(r.error);
      else {
        bildir.basarili("Kaydedildi. Hakkımızda sayfasında görünür.");
        router.refresh();
      }
    });
  };

  return (
    <div className="mt-6 flex flex-col gap-5">
      <section className="rounded-2xl border border-ink/10 bg-white p-6">
        <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Üst bölüm (hero)</h2>
        <p className="mt-1 max-w-[640px] text-[13.5px] leading-[1.6] text-[#5C6273]">
          Sayfanın en üstündeki koyu alan. Başlık iki parçadan oluşuyor: ilk satır beyaz, ikinci satır mavi. İkinci
          satırı boş bırakırsan başlık tek satır kalır.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className={ETIKET}>Üst etiket</span>
            <input type="text" value={form.heroEtiket} onChange={degistir("heroEtiket")} placeholder="Hakkımızda" className={ALAN} />
          </label>
          <div className="hidden sm:block" />
          <label className="flex flex-col gap-2">
            <span className={ETIKET}>Başlık · 1. satır</span>
            <input type="text" value={form.heroBaslik} onChange={degistir("heroBaslik")} className={ALAN} />
          </label>
          <label className="flex flex-col gap-2">
            <span className={ETIKET}>Başlık · 2. satır (mavi)</span>
            <input type="text" value={form.heroVurgu} onChange={degistir("heroVurgu")} className={ALAN} />
          </label>
        </div>

        <label className="mt-4 flex flex-col gap-2">
          <span className={ETIKET}>Açıklama</span>
          <textarea value={form.heroMetin} onChange={degistir("heroMetin")} className={`${METIN} min-h-[100px]`} />
        </label>

        {/* Önizleme: metinler koyu zeminde okunuyor, düzenlerken sonucu görmek
            için ayrı sekmeye geçmek gerekmesin. */}
        <div className="mt-5 rounded-[14px] bg-ink px-6 py-8 text-center">
          {form.heroEtiket && (
            <div className="font-mono text-[10px] tracking-[0.14em] text-brand uppercase">{form.heroEtiket}</div>
          )}
          <div className="mt-3 font-heading text-[26px] leading-[1.08] font-semibold tracking-[-0.035em] text-white">
            {form.heroBaslik}
            {form.heroVurgu && (
              <>
                <br />
                <span className="text-brand">{form.heroVurgu}</span>
              </>
            )}
          </div>
          {form.heroMetin && (
            <p className="mx-auto mt-4 max-w-[520px] text-[14px] leading-[1.6] text-white/65">{form.heroMetin}</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-ink/10 bg-white p-6">
        <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Kimdir bölümü</h2>
        <p className="mt-1 max-w-[640px] text-[13.5px] leading-[1.6] text-[#5C6273]">
          Sayfanın ortasındaki uzun tanıtım metni ve yanındaki tek fotoğraf. Metni paragraflara ayırmak için satır
          arası bırakman yeterli.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className={ETIKET}>Üst etiket</span>
            <input type="text" value={form.kisiEtiket} onChange={degistir("kisiEtiket")} placeholder="Eğitmen" className={ALAN} />
          </label>
          <label className="flex flex-col gap-2">
            <span className={ETIKET}>Başlık</span>
            <input type="text" value={form.kisiBaslik} onChange={degistir("kisiBaslik")} className={ALAN} />
          </label>
        </div>

        <label className="mt-4 flex flex-col gap-2">
          <span className={ETIKET}>Unvan satırı</span>
          <input
            type="text"
            value={form.kisiUnvan}
            onChange={degistir("kisiUnvan")}
            placeholder="Dijital pazarlama eğitmeni · Ankara"
            className={ALAN}
          />
        </label>

        <label className="mt-4 flex flex-col gap-2">
          <span className={ETIKET}>Tanıtım metni</span>
          <textarea
            value={form.kisiMetin}
            onChange={degistir("kisiMetin")}
            className={`${METIN} min-h-[300px]`}
            placeholder="Kaç yıldır ne yaptığın, hangi projelerde çalıştığın, ödüller, çalışma biçimin…"
          />
          <span className="text-[12.5px] text-[#656B7A]">
            {form.kisiMetin.trim().length.toLocaleString("tr-TR")} karakter · eğitim sayfalarındaki kısa biyografiden
            bağımsızdır
          </span>
        </label>

        <div className="mt-6">
          <div className={ETIKET}>Fotoğraf</div>
          <p className="mt-[6px] max-w-[520px] text-[13px] leading-[1.55] text-[#5C6273]">
            Tek bir dikey fotoğraf. En iyi sonuç için 3:4 oranında, en az 900×1200 piksel.
          </p>
          <GorselAlani mevcut={icerik.kisiGorsel} />
        </div>
      </section>

      <section className="rounded-2xl border border-ink/10 bg-white p-6">
        <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Akademi bölümü</h2>
        <p className="mt-1 max-w-[640px] text-[13.5px] leading-[1.6] text-[#5C6273]">
          Referans logolarının altındaki açık gri bölüm. Altındaki numaralı çalışma biçimi listesi sabittir.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className={ETIKET}>Üst etiket</span>
            <input type="text" value={form.akademiEtiket} onChange={degistir("akademiEtiket")} placeholder="Akademi" className={ALAN} />
          </label>
          <label className="flex flex-col gap-2">
            <span className={ETIKET}>Başlık</span>
            <input type="text" value={form.akademiBaslik} onChange={degistir("akademiBaslik")} className={ALAN} />
          </label>
        </div>

        <label className="mt-4 flex flex-col gap-2">
          <span className={ETIKET}>Metin</span>
          <textarea value={form.akademiMetin} onChange={degistir("akademiMetin")} className={`${METIN} min-h-[140px]`} />
        </label>
      </section>

      <div>
        <button
          type="button"
          onClick={kaydet}
          disabled={islemde}
          className="h-[46px] rounded-[10px] bg-brand px-6 text-[15px] font-semibold text-white transition hover:bg-ink disabled:opacity-60"
        >
          {islemde ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </div>
    </div>
  );
}

/**
 * Tek fotoğraf alanı.
 *
 * Metin alanlarından ayrı kaydediliyor: yükleme tarayıcıdan doğrudan Storage'a
 * gidiyor, sonucu beklemek için "Kaydet"e basılması gerekseydi yarım kalmış
 * yüklemeler sütuna hiç yazılmazdı.
 */
function GorselAlani({ mevcut }: { mevcut: string | null }) {
  const router = useRouter();
  const bildir = useBildirim();
  const [yukleniyor, setYukleniyor] = useState(false);
  const [uzerinde, setUzerinde] = useState(false);

  const url = kapakUrl(mevcut);

  const yukle = async (dosya: File | undefined) => {
    if (!dosya) return;
    if (!dosya.type.startsWith("image/")) {
      bildir.hata("Yalnızca görsel dosyası yükleyebilirsin.");
      return;
    }
    if (dosya.size > SINIR) {
      bildir.hata("Görsel 5 MB'tan küçük olmalı.");
      return;
    }

    setYukleniyor(true);
    const temizAd = dosya.name.replace(/[^\w.\-]/g, "_");
    const yol = `hakkimizda-${Date.now()}-${temizAd}`;

    const supabase = createClient();
    const { error } = await supabase.storage.from("kapaklar").upload(yol, dosya, { cacheControl: "3600" });
    if (error) {
      setYukleniyor(false);
      bildir.hata(`Görsel yüklenemedi: ${error.message}`);
      return;
    }

    const r = await hakkimizdaGorselGuncelle(yol);
    setYukleniyor(false);
    if (r?.error) bildir.hata(r.error);
    else {
      bildir.basarili("Fotoğraf güncellendi.");
      router.refresh();
    }
  };

  const kaldir = async () => {
    setYukleniyor(true);
    const r = await hakkimizdaGorselGuncelle(null);
    setYukleniyor(false);
    if (r?.error) bildir.hata(r.error);
    else {
      bildir.basarili("Fotoğraf kaldırıldı.");
      router.refresh();
    }
  };

  return (
    <div className="mt-3 max-w-[280px]">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setUzerinde(true);
        }}
        onDragLeave={() => setUzerinde(false)}
        onDrop={(e) => {
          e.preventDefault();
          setUzerinde(false);
          void yukle(e.dataTransfer.files?.[0]);
        }}
        className={`relative flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-[13px] border border-dashed bg-mist text-center transition ${
          uzerinde ? "border-brand bg-brand/8" : "border-ink/20 hover:border-brand"
        }`}
      >
        {url && (
          /* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage
             konağı next/image remotePatterns'a eklenmeli; burası yalnızca önizleme. */
          <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}

        {(!url || uzerinde || yukleniyor) && (
          <span className={`relative flex flex-col items-center gap-2 px-4 ${url ? "rounded-[10px] bg-white/85 py-3" : ""}`}>
            <Icon name="upload" size={20} className="text-[#656B7A]" />
            <span className="text-[13px] text-[#656B7A]">{yukleniyor ? "Yükleniyor…" : "Sürükle veya seç"}</span>
          </span>
        )}

        <input
          type="file"
          accept={KABUL}
          disabled={yukleniyor}
          onChange={(e) => {
            void yukle(e.target.files?.[0]);
            e.target.value = "";
          }}
          className="hidden"
        />
      </label>

      {url && (
        <button
          type="button"
          disabled={yukleniyor}
          onClick={kaldir}
          className="mt-[10px] inline-flex h-9 items-center gap-2 rounded-[9px] border border-ink/13 bg-white px-3 text-[13px] font-semibold text-[#5C6273] transition hover:border-danger/45 hover:text-danger disabled:opacity-50"
        >
          <Icon name="x" size={14} />
          Fotoğrafı kaldır
        </button>
      )}
    </div>
  );
}
