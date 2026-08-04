"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { kursKapakGuncelle } from "@/app/admin/(protected)/egitimler/actions";
import { useBildirim } from "@/components/Bildirim";
import { Icon } from "@/components/Icon";
import { kapakUrl } from "@/lib/kapak";

const KABUL = "image/png,image/jpeg,image/webp,image/avif";
// 5 MB: kapak görselleri bunun çok altında kalıyor, üstü büyük ihtimalle
// küçültülmemiş bir fotoğraf ve sayfayı yavaşlatır.
const SINIR = 5 * 1024 * 1024;

/**
 * Eğitim kapak görseli: yükleme, önizleme, kaldırma.
 *
 * Buradaki alan bugüne kadar boş bir yer tutucuydu — kesikli çerçeve ve
 * "sürükle veya seç" yazısı vardı ama arkasında ne bir dosya girdisi ne de
 * bir sütun bulunuyordu. Yani tıklamak ve sürüklemek hiçbir şey yapmıyordu.
 *
 * Yeni programda kapak yüklenemiyor, bilerek: dosyanın bağlanacağı bir kayıt
 * henüz yok. Program kaydedildikten sonra alan açılıyor.
 */
export function KapakGorseli({ slug, mevcut }: { slug: string | null; mevcut: string | null }) {
  const router = useRouter();
  const bildir = useBildirim();
  const [yukleniyor, setYukleniyor] = useState(false);
  const [uzerinde, setUzerinde] = useState(false);

  const url = kapakUrl(mevcut);

  const yukle = async (dosya: File | undefined) => {
    if (!dosya || !slug) return;

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
    const yol = `${slug}-${Date.now()}-${temizAd}`;

    const supabase = createClient();
    const { error } = await supabase.storage.from("kapaklar").upload(yol, dosya, {
      cacheControl: "3600",
    });

    if (error) {
      setYukleniyor(false);
      bildir.hata(`Görsel yüklenemedi: ${error.message}`);
      return;
    }

    const r = await kursKapakGuncelle(slug, yol);
    setYukleniyor(false);
    if (r?.error) bildir.hata(r.error);
    else {
      bildir.basarili("Kapak görseli güncellendi.");
      router.refresh();
    }
  };

  const kaldir = async () => {
    if (!slug) return;
    setYukleniyor(true);
    const r = await kursKapakGuncelle(slug, null);
    setYukleniyor(false);
    if (r?.error) bildir.hata(r.error);
    else {
      bildir.basarili("Kapak görseli kaldırıldı.");
      router.refresh();
    }
  };

  if (!slug) {
    return (
      <div className="mt-[14px] flex aspect-[16/10] flex-col items-center justify-center gap-2 rounded-[11px] border border-dashed border-ink/20 bg-mist px-4 text-center">
        <Icon name="upload" size={20} className="text-[#656B7A]" />
        <span className="text-[13px] leading-[1.5] text-[#656B7A]">
          Kapak görseli için önce programı kaydet.
        </span>
      </div>
    );
  }

  return (
    <>
      <label
        onDragOver={(e) => {
          // Varsayılan davranış dosyayı yeni sekmede açıyor; engellenmezse
          // sürükle-bırak hiç çalışmıyor.
          e.preventDefault();
          setUzerinde(true);
        }}
        onDragLeave={() => setUzerinde(false)}
        onDrop={(e) => {
          e.preventDefault();
          setUzerinde(false);
          void yukle(e.dataTransfer.files?.[0]);
        }}
        className={`relative mt-[14px] flex aspect-[16/10] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-[11px] border border-dashed bg-mist text-center transition ${
          uzerinde ? "border-brand bg-brand/8" : "border-ink/20 hover:border-brand"
        }`}
      >
        {url && (
          /* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage
             konağı next/image için remotePatterns'a eklenmeli; kapak yalnızca
             yönetim ekranında önizleniyor. */
          <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}

        {(!url || uzerinde || yukleniyor) && (
          <span
            className={`relative flex flex-col items-center gap-2 px-4 ${
              url ? "bg-white/85 py-3 rounded-[10px]" : ""
            }`}
          >
            <Icon name="upload" size={20} className="text-[#656B7A]" />
            <span className="text-[13px] text-[#656B7A]">
              {yukleniyor ? "Yükleniyor…" : "Sürükle veya seç · 1600×1000"}
            </span>
          </span>
        )}

        <input
          type="file"
          accept={KABUL}
          disabled={yukleniyor}
          onChange={(e) => {
            void yukle(e.target.files?.[0]);
            // Aynı dosya ikinci kez seçilebilsin.
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
          Kapağı kaldır
        </button>
      )}
    </>
  );
}
