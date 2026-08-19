"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { profilGuncelle } from "@/app/panel/actions";
import { createClient } from "@/lib/supabase/client";
import type { PanelProfile } from "@/lib/panel";
import { useBildirim } from "@/components/Bildirim";
import { authHatasi } from "@/lib/auth-hatalari";

export function HesapFormu({ profil }: { profil: PanelProfile }) {
  const router = useRouter();
  const bildir = useBildirim();
  const [ad, setAd] = useState(profil.ad);
  const [soyad, setSoyad] = useState(profil.soyad);
  const [telefon, setTelefon] = useState(profil.telefon);
  const [sirket, setSirket] = useState(profil.sirket);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [sonuc, setSonuc] = useState<{ tip: "ok" | "hata"; mesaj: string } | null>(null);

  const [sifreAcik, setSifreAcik] = useState(false);
  const [yeniSifre, setYeniSifre] = useState("");
  const [sifreDurum, setSifreDurum] = useState<{ tip: "ok" | "hata"; mesaj: string } | null>(null);

  const kaydet = async () => {
    setKaydediliyor(true);
    setSonuc(null);
    const r = await profilGuncelle({ ad, soyad, telefon, sirket });
    setKaydediliyor(false);
    if (r?.error) {
      setSonuc({ tip: "hata", mesaj: r.error });
      bildir.hata(r.error);
    } else {
      setSonuc({ tip: "ok", mesaj: "Bilgilerin güncellendi." });
      bildir.basarili("Bilgilerin güncellendi.");
      router.refresh();
    }
  };

  const sifreDegistir = async () => {
    if (yeniSifre.length < 8) {
      setSifreDurum({ tip: "hata", mesaj: "Şifre en az 8 karakter olmalı." });
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: yeniSifre });
    if (error) {
      const mesaj = authHatasi(error, "sifre-degistir");
      setSifreDurum({ tip: "hata", mesaj });
      bildir.hata(mesaj);
    } else {
      setSifreDurum({ tip: "ok", mesaj: "Şifren güncellendi." });
      bildir.basarili("Şifren güncellendi.");
      setYeniSifre("");
    }
  };

  const alanlar = [
    { etiket: "Ad", deger: ad, set: setAd },
    { etiket: "Soyad", deger: soyad, set: setSoyad },
    { etiket: "Telefon", deger: telefon, set: setTelefon },
    { etiket: "Şirket", deger: sirket, set: setSirket },
  ];

  return (
    <div className="p-[26px]">
      <div className="flex items-center gap-4 border-b border-ink/8 pb-6">
        <span className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-brand/12 font-heading text-lg font-semibold text-brand">
          {profil.basHarfler}
        </span>
        <div className="min-w-0">
          <div className="truncate text-[17px] font-semibold">{profil.tamAd}</div>
          <div className="mt-[3px] truncate font-mono text-[11px] text-[#656B7A]">{profil.email}</div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-[18px] sm:grid-cols-2">
        {alanlar.map((a) => (
          <label key={a.etiket} className="flex flex-col gap-[7px]">
            <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">{a.etiket}</span>
            <input
              type="text"
              value={a.deger}
              onChange={(e) => a.set(e.target.value)}
              className="h-[46px] rounded-[10px] border border-ink/13 bg-white px-[14px] text-[15px] text-ink outline-none focus:border-brand"
            />
          </label>
        ))}
        <label className="flex flex-col gap-[7px]">
          <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">E-posta</span>
          <input
            type="text"
            value={profil.email}
            disabled
            className="h-[46px] rounded-[10px] border border-ink/10 bg-mist px-[14px] text-[15px] text-[#656B7A]"
          />
        </label>
      </div>

      {sonuc && (
        <div
          className="mt-5 rounded-[10px] border px-4 py-3 text-sm"
          style={{
            borderColor: sonuc.tip === "ok" ? "rgba(28,86,243,0.3)" : "rgba(214,58,58,0.35)",
            background: sonuc.tip === "ok" ? "rgba(28,86,243,0.06)" : "rgba(214,58,58,0.06)",
            color: sonuc.tip === "ok" ? "#1C56F3" : "#8C1D1D",
          }}
        >
          {sonuc.mesaj}
        </div>
      )}

      <div className="mt-[26px] flex flex-wrap gap-3">
        <button
          type="button"
          onClick={kaydet}
          disabled={kaydediliyor}
          className="h-[46px] rounded-[10px] bg-brand px-[22px] text-[15px] font-semibold text-white hover:bg-ink disabled:opacity-60"
        >
          {kaydediliyor ? "Kaydediliyor…" : "Değişiklikleri kaydet"}
        </button>
        <button
          type="button"
          onClick={() => setSifreAcik((v) => !v)}
          className="h-[46px] rounded-[10px] border border-ink/13 bg-white px-5 text-[15px] font-semibold text-ink hover:border-brand hover:text-brand"
        >
          Şifre değiştir
        </button>
      </div>

      {sifreAcik && (
        <div className="mt-5 max-w-[420px] rounded-[12px] border border-ink/11 bg-mist p-5">
          <label className="flex flex-col gap-[7px]">
            <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">Yeni şifre</span>
            <input
              type="password"
              value={yeniSifre}
              onChange={(e) => setYeniSifre(e.target.value)}
              placeholder="En az 8 karakter"
              className="h-[46px] rounded-[10px] border border-ink/13 bg-white px-[14px] text-[15px] text-ink outline-none focus:border-brand"
            />
          </label>
          {sifreDurum && (
            <div
              className="mt-3 text-[13.5px]"
              style={{ color: sifreDurum.tip === "ok" ? "#1C56F3" : "#8C1D1D" }}
            >
              {sifreDurum.mesaj}
            </div>
          )}
          <button
            type="button"
            onClick={sifreDegistir}
            className="mt-4 h-[42px] rounded-[9px] bg-ink px-5 text-sm font-semibold text-white hover:bg-brand"
          >
            Şifreyi güncelle
          </button>
        </div>
      )}
    </div>
  );
}
