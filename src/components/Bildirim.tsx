"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";

type Tip = "basarili" | "hata" | "bilgi";
type Kayit = { id: number; tip: Tip; mesaj: string };

type BildirimApi = {
  basarili: (mesaj: string) => void;
  hata: (mesaj: string) => void;
  bilgi: (mesaj: string) => void;
};

const Baglam = createContext<BildirimApi | null>(null);

/**
 * Saving used to be silent — nothing confirmed a write and most failures were
 * swallowed by a component that simply re-rendered. Every save now reports
 * one way or the other through here.
 */
export function useBildirim(): BildirimApi {
  const api = useContext(Baglam);
  if (!api) throw new Error("useBildirim, BildirimSaglayici içinde kullanılmalı.");
  return api;
}

const STIL: Record<Tip, { bg: string; kenar: string; renk: string; ikon: "check" | "x" | "sparkle" }> = {
  basarili: { bg: "#0E2E1F", kenar: "rgba(24,140,90,0.55)", renk: "#7BE3AE", ikon: "check" },
  hata: { bg: "#2E1214", kenar: "rgba(229,72,77,0.5)", renk: "#FF9A9D", ikon: "x" },
  bilgi: { bg: "#101528", kenar: "rgba(28,86,243,0.5)", renk: "#A9C0FF", ikon: "sparkle" },
};

function Satir({ kayit, kapat }: { kayit: Kayit; kapat: () => void }) {
  // Hatalar okunmaya daha çok zaman ister; başarılar hızlı kaybolsun.
  const sure = kayit.tip === "hata" ? 8000 : 4000;

  useEffect(() => {
    const t = setTimeout(kapat, sure);
    return () => clearTimeout(t);
  }, [kapat, sure]);

  const s = STIL[kayit.tip];

  return (
    <div
      role="status"
      className="bildirim-giris pointer-events-auto flex w-[min(380px,calc(100vw-32px))] items-start gap-3 rounded-[12px] border px-4 py-[13px] shadow-[0_18px_40px_rgba(10,13,24,0.28)]"
      style={{ background: s.bg, borderColor: s.kenar }}
    >
      <span
        className="mt-[1px] flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full"
        style={{ background: "rgba(255,255,255,0.12)", color: s.renk }}
      >
        <Icon name={s.ikon} size={11} strokeWidth={2.6} />
      </span>
      <span className="min-w-0 flex-1 text-[13.5px] leading-[1.55] break-words" style={{ color: "#FFFFFF" }}>
        {kayit.mesaj}
      </span>
      <button
        type="button"
        onClick={kapat}
        aria-label="Bildirimi kapat"
        className="mt-[1px] flex h-[18px] w-[18px] flex-none items-center justify-center rounded-[5px] text-white/45 transition hover:text-white"
      >
        <Icon name="x" size={12} />
      </button>
    </div>
  );
}

export function BildirimSaglayici({ children }: { children: React.ReactNode }) {
  const [kayitlar, setKayitlar] = useState<Kayit[]>([]);

  const ekle = useCallback((tip: Tip, mesaj: string) => {
    const temiz = mesaj.trim();
    if (!temiz) return;
    setKayitlar((v) => [...v, { id: Date.now() + Math.random(), tip, mesaj: temiz }].slice(-4));
  }, []);

  // Sağlayıcı her render'da yeni bir nesne üretirse tüketiciler boşuna yeniden
  // render olur; ekle zaten sabit olduğu için bunlar da sabit kalır.
  const [api] = useState<BildirimApi>(() => ({
    basarili: (m: string) => ekle("basarili", m),
    hata: (m: string) => ekle("hata", m),
    bilgi: (m: string) => ekle("bilgi", m),
  }));

  const kapat = useCallback((id: number) => {
    setKayitlar((v) => v.filter((k) => k.id !== id));
  }, []);

  return (
    <Baglam.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[100] flex flex-col items-end gap-[10px] sm:right-6 sm:bottom-6">
        {kayitlar.map((k) => (
          <Satir key={k.id} kayit={k} kapat={() => kapat(k.id)} />
        ))}
      </div>
    </Baglam.Provider>
  );
}
