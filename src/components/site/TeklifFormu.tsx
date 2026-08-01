"use client";

import { useState } from "react";
import Link from "next/link";
import { mesajGonder } from "@/app/mesaj-actions";
import { Icon } from "@/components/Icon";

const alanStil =
  "h-[50px] rounded-[11px] border border-ink/14 bg-white px-[15px] text-[15px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]";

export function TeklifFormu({
  kurslar,
  secilenSlug,
}: {
  kurslar: { slug: string; baslik: string }[];
  secilenSlug?: string;
}) {
  const [ad, setAd] = useState("");
  const [email, setEmail] = useState("");
  const [telefon, setTelefon] = useState("");
  const [sirket, setSirket] = useState("");
  const [kurs, setKurs] = useState(
    secilenSlug && kurslar.some((k) => k.slug === secilenSlug) ? secilenSlug : (kurslar[0]?.slug ?? ""),
  );
  const [mesaj, setMesaj] = useState("");
  const [tuzak, setTuzak] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [gonderildi, setGonderildi] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const gonder = async (e: React.FormEvent) => {
    e.preventDefault();
    setGonderiliyor(true);
    setHata(null);

    const secili = kurslar.find((k) => k.slug === kurs);
    const sonuc = await mesajGonder({
      tur: "teklif",
      ad,
      email,
      telefon,
      sirket,
      konu: secili ? `Teklif talebi: ${secili.baslik}` : "Teklif talebi",
      mesaj: mesaj.trim() || "Program hakkında bilgi ve fiyat teklifi almak istiyorum.",
      courseSlug: kurs || undefined,
      tuzak,
    });

    setGonderiliyor(false);
    if (sonuc?.error) {
      setHata(sonuc.error);
      return;
    }
    setGonderildi(true);
  };

  if (gonderildi) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-white p-8 sm:p-10">
        <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-brand text-white shadow-[0_12px_28px_rgba(28,86,243,0.3)]">
          <Icon name="check" size={26} strokeWidth={2.4} />
        </span>
        <h2 className="mt-5 font-heading text-[26px] leading-[1.15] font-semibold tracking-[-0.03em]">
          Talebin bize ulaştı
        </h2>
        <p className="mt-3 max-w-[460px] text-[15.5px] leading-[1.6] text-[#5C6273]">
          En geç 1 iş günü içinde seninle iletişime geçip ihtiyacına göre kapsamı ve fiyatı konuşacağız. Ön görüşme
          ücretsizdir ve seni bir şeye bağlamaz.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/egitimler"
            className="inline-flex h-12 items-center rounded-[11px] bg-brand px-6 text-[15px] font-semibold text-white transition hover:bg-ink"
          >
            Diğer programlara bak
          </Link>
          <Link
            href="/"
            className="inline-flex h-12 items-center rounded-[11px] border border-ink/14 px-5 text-[15px] font-semibold text-ink transition hover:border-brand hover:text-brand"
          >
            Ana sayfaya dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={gonder} noValidate className="rounded-2xl border border-ink/10 bg-white p-8">
      <h2 className="font-heading text-xl font-semibold tracking-[-0.02em]">Bilgilerin</h2>
      <p className="mt-2 text-[14.5px] leading-[1.6] text-[#5C6273]">
        Kapsam ve fiyat, ön görüşmede ihtiyacına göre belirlenir. Bu formu doldurmak seni bir şeye bağlamaz.
      </p>

      <label className="sr-only" aria-hidden="true">
        Bu alanı boş bırakın
        <input type="text" tabIndex={-1} autoComplete="off" value={tuzak} onChange={(e) => setTuzak(e.target.value)} />
      </label>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[10px] tracking-[0.13em] text-[#656B7A] uppercase">Ad soyad</span>
          <input type="text" value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Adın ve soyadın" className={alanStil} />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[10px] tracking-[0.13em] text-[#656B7A] uppercase">E-posta</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@sirket.com" className={alanStil} />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[10px] tracking-[0.13em] text-[#656B7A] uppercase">Telefon</span>
          <input type="tel" value={telefon} onChange={(e) => setTelefon(e.target.value)} placeholder="+90 5xx xxx xx xx" className={alanStil} />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[10px] tracking-[0.13em] text-[#656B7A] uppercase">Şirket (opsiyonel)</span>
          <input type="text" value={sirket} onChange={(e) => setSirket(e.target.value)} placeholder="Marka veya şirket adı" className={alanStil} />
        </label>
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="font-mono text-[10px] tracking-[0.13em] text-[#656B7A] uppercase">İlgilendiğin program</span>
          <select value={kurs} onChange={(e) => setKurs(e.target.value)} className={alanStil}>
            {kurslar.length === 0 && <option value="">Program seçilemiyor</option>}
            {kurslar.map((k) => (
              <option key={k.slug} value={k.slug}>
                {k.baslik}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-4 flex flex-col gap-2">
        <span className="font-mono text-[10px] tracking-[0.13em] text-[#656B7A] uppercase">
          Hedefin (opsiyonel)
        </span>
        <textarea
          value={mesaj}
          onChange={(e) => setMesaj(e.target.value)}
          placeholder="Şu an nerede olduğunu ve eğitim sonunda nereye varmak istediğini kısaca yaz."
          className="min-h-28 resize-y rounded-[11px] border border-ink/14 bg-white px-[15px] py-3 text-[15px] leading-[1.6] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
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
        className="mt-6 h-[52px] w-full rounded-[11px] bg-brand text-base font-semibold text-white shadow-[0_12px_28px_rgba(28,86,243,0.28)] transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
      >
        {gonderiliyor ? "Gönderiliyor…" : "Ücretsiz ön görüşme talep et"}
      </button>
    </form>
  );
}
