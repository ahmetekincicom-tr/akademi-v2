"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBildirim } from "@/components/Bildirim";
import {
  kategoriAciklamaGuncelle,
  kategoriEkle,
  kategoriGuncelle,
  kategoriSil,
} from "@/app/kontrol-9f4x2k/(protected)/blog/actions";
import type { Kategori } from "@/lib/yazilar";

export function KategoriYonetimi({ kategoriler }: { kategoriler: (Kategori & { adet: number })[] }) {
  const router = useRouter();
  const bildir = useBildirim();
  const [yeniAd, setYeniAd] = useState("");
  const [islemde, setIslemde] = useState(false);
  // Açıklaması düzenlenen kategori ve taslak metni.
  const [aciklamaId, setAciklamaId] = useState<string | null>(null);
  const [aciklama, setAciklama] = useState("");

  const aciklamaKaydet = async (k: Kategori) => {
    setIslemde(true);
    const r = await kategoriAciklamaGuncelle(k.id, aciklama);
    setIslemde(false);
    if (r.error) return bildir.hata(r.error);
    setAciklamaId(null);
    bildir.basarili("Açıklama kaydedildi.");
    router.refresh();
  };

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
          <div key={k.id} className="rounded-[12px] border border-ink/10 bg-white p-3">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-semibold">{k.ad}</div>
                <div className="font-mono text-[11px] text-[#8A90A0]">
                  /{k.slug} · {k.adet} yazı{k.aciklama ? "" : " · açıklama yok"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAciklamaId(aciklamaId === k.id ? null : k.id);
                  setAciklama(k.aciklama ?? "");
                }}
                className="rounded-[8px] border border-ink/13 bg-white px-3 py-[7px] text-[13px] font-semibold text-[#5C6273] hover:border-brand hover:text-brand"
              >
                Açıklama
              </button>
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
            {aciklamaId === k.id && (
              <div className="mt-3 flex flex-col gap-2 border-t border-ink/8 pt-3">
                <span className="text-[12.5px] text-[#5C6273]">
                  Kategori sayfasının başında görünür ve arama sonucundaki açıklama olarak kullanılır (2–3 cümle).
                </span>
                <textarea
                  value={aciklama}
                  onChange={(e) => setAciklama(e.target.value)}
                  rows={3}
                  maxLength={600}
                  aria-label={`${k.ad} açıklaması`}
                  className="w-full rounded-[10px] border border-ink/14 bg-white p-3 text-[14px] leading-[1.55] outline-none focus:border-brand"
                />
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-[#8A90A0]">{aciklama.length} karakter</span>
                  <button
                    type="button"
                    onClick={() => aciklamaKaydet(k)}
                    disabled={islemde}
                    className="rounded-[8px] bg-brand px-4 py-[7px] text-[13px] font-semibold text-white hover:bg-ink disabled:opacity-50"
                  >
                    Kaydet
                  </button>
                </div>
              </div>
            )}
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
