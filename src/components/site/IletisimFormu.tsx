"use client";

import { useState } from "react";
import { mesajGonder } from "@/app/mesaj-actions";
import { Icon } from "@/components/Icon";

const konular = ["Eğitim hakkında bilgi", "Ücretsiz ön görüşme", "Kurumsal eğitim", "Panel / teknik destek", "Diğer"];

const alanStil =
  "h-[48px] rounded-[11px] border border-ink/14 bg-white px-[15px] text-[15px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]";

export function IletisimFormu() {
  const [ad, setAd] = useState("");
  const [email, setEmail] = useState("");
  const [telefon, setTelefon] = useState("");
  const [konu, setKonu] = useState(konular[0]);
  const [mesaj, setMesaj] = useState("");
  const [tuzak, setTuzak] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [gonderildi, setGonderildi] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const gonder = async (e: React.FormEvent) => {
    e.preventDefault();
    setGonderiliyor(true);
    setHata(null);

    const sonuc = await mesajGonder({ tur: "iletisim", ad, email, telefon, konu, mesaj, tuzak });

    setGonderiliyor(false);
    if (sonuc?.error) {
      setHata(sonuc.error);
      return;
    }
    setGonderildi(true);
  };

  if (gonderildi) {
    return (
      <div className="flex flex-col items-start gap-4 py-10">
        <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-brand text-white shadow-[0_12px_28px_rgba(28,86,243,0.3)]">
          <Icon name="check" size={26} strokeWidth={2.4} />
        </span>
        <h2 className="font-heading text-2xl font-semibold tracking-[-0.03em]">Mesajın iletildi</h2>
        <p className="max-w-[420px] text-[15px] leading-[1.6] text-[#5C6273]">
          En geç 1 iş günü içinde sana dönüş yapacağız. Acil durumlarda WhatsApp&apos;tan da yazabilirsin.
        </p>
        <button
          type="button"
          onClick={() => {
            setGonderildi(false);
            setAd("");
            setEmail("");
            setTelefon("");
            setMesaj("");
          }}
          className="mt-2 h-11 rounded-[10px] border border-ink/13 bg-white px-5 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand"
        >
          Yeni mesaj yaz
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={gonder} noValidate>
      <h2 className="font-heading text-xl font-semibold tracking-[-0.02em]">Mesaj gönder</h2>

      {/* Off-screen honeypot: bots fill it, people never see it. */}
      <label className="sr-only" aria-hidden="true">
        Bu alanı boş bırakın
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={tuzak}
          onChange={(e) => setTuzak(e.target.value)}
        />
      </label>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[10px] tracking-[0.13em] text-[#656B7A] uppercase">Ad soyad</span>
          <input
            type="text"
            value={ad}
            onChange={(e) => setAd(e.target.value)}
            placeholder="Adın ve soyadın"
            className={alanStil}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[10px] tracking-[0.13em] text-[#656B7A] uppercase">E-posta</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@sirket.com"
            className={alanStil}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[10px] tracking-[0.13em] text-[#656B7A] uppercase">Telefon</span>
          <input
            type="tel"
            value={telefon}
            onChange={(e) => setTelefon(e.target.value)}
            placeholder="+90 5xx xxx xx xx"
            className={alanStil}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[10px] tracking-[0.13em] text-[#656B7A] uppercase">Konu</span>
          <select value={konu} onChange={(e) => setKonu(e.target.value)} className={alanStil}>
            {konular.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-4 flex flex-col gap-2">
        <span className="font-mono text-[10px] tracking-[0.13em] text-[#656B7A] uppercase">Mesaj</span>
        <textarea
          value={mesaj}
          onChange={(e) => setMesaj(e.target.value)}
          placeholder="Kısaca işini ve neye ihtiyacın olduğunu anlat."
          className="min-h-32 resize-y rounded-[11px] border border-ink/14 bg-white px-[15px] py-3 text-[15px] leading-[1.6] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
        />
      </label>

      {hata && (
        <div className="mt-4 flex items-start gap-[11px] rounded-[11px] border border-danger/35 bg-danger/7 px-[15px] py-[13px]">
          <span className="mt-[1px] flex h-[18px] w-[18px] flex-none items-center justify-center rounded-[6px] bg-danger text-[11px] font-bold text-white">
            !
          </span>
          <span className="text-sm leading-[1.5] text-danger-ink">{hata}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={gonderiliyor}
        className="mt-6 h-[52px] w-full rounded-[11px] bg-brand text-base font-semibold text-white shadow-[0_12px_28px_rgba(28,86,243,0.28)] transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {gonderiliyor ? "Gönderiliyor…" : "Mesajı gönder"}
      </button>
    </form>
  );
}
