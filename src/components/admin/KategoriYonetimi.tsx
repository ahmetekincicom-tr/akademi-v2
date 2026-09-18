"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBildirim } from "@/components/Bildirim";
import { kategoriEkle, kategoriGuncelle, kategoriSil } from "@/app/kontrol-9f4x2k/(protected)/blog/actions";
import type { Kategori } from "@/lib/yazilar";

export function KategoriYonetimi({ kategoriler }: { kategoriler: (Kategori & { adet: number })[] }) {
  const router = useRouter();
  const bildir = useBildirim();
  const [yeniAd, setYeniAd] = useState("");
  const [islemde, setIslemde] = useState(false);

  const ekle = async () => {
    if (!yeniAd.trim()) return;
    setIslemde(true);
    const r = await kategoriEkle(yeniAd.trim());
    setIslemde(false);
    if (r.error) return bildir.hata(r.error);
    setYeniAd("");
    bildir.basarili("Kategori eklendi.");
    router.refresh();
  };

  const yenidenAdlandir = async (k: Kategori) => {
    const ad = window.prompt("Yeni ad:", k.ad);
    if (!ad || ad.trim() === k.ad) return;
    const r = await kategoriGuncelle(k.id, ad.trim());
    if (r.error) return bildir.hata(r.error);
    bildir.basarili("Güncellendi.");
    router.refresh();
  };

  const sil = async (k: Kategori & { adet: number }) => {
    const uyari =
      k.adet > 0
        ? `"${k.ad}" silinsin mi? ${k.adet} yazı kategorisiz kalacak (yazılar silinmez).`
        : `"${k.ad}" silinsin mi?`;
    if (!window.confirm(uyari)) return;
    const r = await kategoriSil(k.id);
    if (r.error) return bildir.hata(r.error);
    bildir.basarili("Silindi.");
    router.refresh();
  };

  return (
    <div className="max-w-[560px]">
      <div className="flex gap-2">
        <input
          value={yeniAd}
          onChange={(e) => setYeniAd(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ekle()}
          placeholder="Yeni kategori adı"
          className="h-[46px] flex-1 rounded-[10px] border border-ink/14 bg-white px-[14px] text-[15px] outline-none focus:border-brand"
        />
        <button
          type="button"
          onClick={ekle}
          disabled={islemde}
          className="h-[46px] rounded-[10px] bg-brand px-5 text-[14px] font-semibold text-white hover:bg-ink disabled:opacity-50"
        >
          Ekle
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-2">
        {kategoriler.map((k) => (
          <div key={k.id} className="flex items-center gap-3 rounded-[12px] border border-ink/10 bg-white p-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-semibold">{k.ad}</div>
              <div className="font-mono text-[11px] text-[#8A90A0]">/blog/kategori/{k.slug} · {k.adet} yazı</div>
            </div>
            <button
              type="button"
              onClick={() => yenidenAdlandir(k)}
              className="rounded-[8px] border border-ink/13 bg-white px-3 py-[7px] text-[13px] font-semibold text-[#5C6273] hover:border-brand hover:text-brand"
            >
              Adı değiştir
            </button>
            <button
              type="button"
              onClick={() => sil(k)}
              className="rounded-[8px] border border-ink/13 bg-white px-3 py-[7px] text-[13px] font-semibold text-[#5C6273] hover:border-danger/45 hover:text-danger"
            >
              Sil
            </button>
          </div>
        ))}
        {kategoriler.length === 0 && (
          <div className="rounded-[12px] border border-dashed border-ink/15 bg-white p-6 text-center text-sm text-[#656B7A]">
            Henüz kategori yok.
          </div>
        )}
      </div>
    </div>
  );
}
