"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { mesajOkunduIsaretle, mesajSil } from "@/app/mesaj-actions";
import { Icon } from "@/components/Icon";
import { saatBicimi } from "@/lib/admin/format";
import { useBildirim } from "@/components/Bildirim";

export type MesajSatir = {
  id: string;
  tur: "iletisim" | "teklif";
  ad: string;
  email: string;
  telefon: string;
  sirket: string;
  konu: string;
  mesaj: string;
  program: string;
  okundu: boolean;
  tarih: string;
};

const filtreler: { id: "hepsi" | "okunmadi" | "teklif" | "iletisim"; ad: string }[] = [
  { id: "hepsi", ad: "Tümü" },
  { id: "okunmadi", ad: "Okunmadı" },
  { id: "teklif", ad: "Teklif talebi" },
  { id: "iletisim", ad: "İletişim" },
];

export function MesajYonetimi({ mesajlar }: { mesajlar: MesajSatir[] }) {
  const router = useRouter();
  const bildir = useBildirim();
  const [filtre, setFiltre] = useState<"hepsi" | "okunmadi" | "teklif" | "iletisim">("hepsi");
  const [seciliId, setSeciliId] = useState<string | null>(mesajlar[0]?.id ?? null);
  const [islemde, startTransition] = useTransition();

  const listelenen = useMemo(() => {
    if (filtre === "hepsi") return mesajlar;
    if (filtre === "okunmadi") return mesajlar.filter((m) => !m.okundu);
    return mesajlar.filter((m) => m.tur === filtre);
  }, [filtre, mesajlar]);

  const secili = mesajlar.find((m) => m.id === seciliId) ?? null;
  const okunmamis = mesajlar.filter((m) => !m.okundu).length;

  const okunduDegistir = (id: string, okundu: boolean) => {
    startTransition(async () => {
      const r = await mesajOkunduIsaretle(id, okundu);
      if (r?.error) bildir.hata(r.error);
      else {
        bildir.basarili(okundu ? "Okundu olarak işaretlendi." : "Okunmadı olarak işaretlendi.");
        router.refresh();
      }
    });
  };

  const sil = (id: string) => {
    startTransition(async () => {
      const r = await mesajSil(id);
      if (r?.error) bildir.hata(r.error);
      else {
        setSeciliId(null);
        bildir.basarili("Mesaj silindi.");
        router.refresh();
      }
    });
  };

  return (
    <main className="p-4 pb-14 sm:p-7">
      <div>
        <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
          Gelen mesajlar
        </h1>
        <p className="mt-[7px] text-[14.5px] text-[#5C6273]">
          {mesajlar.length} mesaj · {okunmamis} okunmadı. Siteden gelen iletişim ve teklif talepleri burada toplanır.
        </p>
      </div>

      <div className="mt-[22px] flex flex-wrap gap-2">
        {filtreler.map((f) => {
          const aktif = filtre === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltre(f.id)}
              className="h-[42px] rounded-[10px] border px-[15px] text-[13.5px] font-semibold transition hover:border-brand"
              style={{
                background: aktif ? "#0A0D18" : "#FFFFFF",
                color: aktif ? "#FFFFFF" : "#3A3F4F",
                borderColor: aktif ? "#0A0D18" : "rgba(10,13,24,0.13)",
              }}
            >
              {f.ad}
            </button>
          );
        })}
      </div>

      {mesajlar.length === 0 ? (
        <div className="mt-[18px] rounded-2xl border border-ink/10 bg-white px-8 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[13px] bg-mist text-[#656B7A]">
            <Icon name="message" size={22} />
          </div>
          <p className="mx-auto mt-4 max-w-[420px] text-[14.5px] leading-[1.6] text-[#5C6273]">
            Henüz siteden gelen bir mesaj yok.
          </p>
        </div>
      ) : (
        <div className="mt-[18px] grid grid-cols-1 items-start gap-5 xl:grid-cols-[380px_1fr]">
          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
            {listelenen.length === 0 ? (
              <div className="px-[18px] py-10 text-center text-sm text-[#656B7A]">
                Bu filtreyle eşleşen mesaj yok.
              </div>
            ) : (
              listelenen.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setSeciliId(m.id);
                    if (!m.okundu) okunduDegistir(m.id, true);
                  }}
                  className="flex w-full flex-col gap-[6px] border-b border-ink/7 px-[18px] py-[14px] text-left transition last:border-b-0 hover:bg-[#F7F9FF]"
                  style={{ background: m.id === seciliId ? "rgba(28,86,243,0.06)" : undefined }}
                >
                  <span className="flex items-center gap-2">
                    {!m.okundu && <span className="h-[7px] w-[7px] flex-none rounded-full bg-brand" />}
                    <span
                      className="min-w-0 flex-1 truncate text-[14px] text-ink"
                      style={{ fontWeight: m.okundu ? 500 : 700 }}
                    >
                      {m.ad}
                    </span>
                    <span
                      className="flex-none rounded-full px-[8px] py-[2px] font-mono text-[9px] tracking-[0.08em] uppercase"
                      style={
                        m.tur === "teklif"
                          ? { background: "rgba(28,86,243,0.12)", color: "#1C56F3" }
                          : { background: "rgba(10,13,24,0.07)", color: "#5C6273" }
                      }
                    >
                      {m.tur === "teklif" ? "teklif" : "iletişim"}
                    </span>
                  </span>
                  <span className="truncate text-[13px] text-[#5C6273]">{m.konu || m.mesaj}</span>
                  <span className="font-mono text-[10.5px] text-[#656B7A]">
                    {saatBicimi.format(new Date(m.tarih))}
                  </span>
                </button>
              ))
            )}
          </div>

          {secili && (
            <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
              <div className="flex flex-wrap items-start gap-4 border-b border-ink/8 px-6 py-5">
                <div className="min-w-0 flex-1">
                  <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">
                    {secili.konu || "İletişim mesajı"}
                  </h2>
                  <div className="mt-1 font-mono text-[10.5px] text-[#656B7A]">
                    {saatBicimi.format(new Date(secili.tarih))}
                    {secili.program !== "—" ? ` · ${secili.program}` : ""}
                  </div>
                </div>
                <div className="flex flex-none gap-2">
                  <button
                    type="button"
                    disabled={islemde}
                    onClick={() => okunduDegistir(secili.id, !secili.okundu)}
                    className="h-9 rounded-[9px] border border-ink/13 bg-white px-3 text-[12.5px] font-semibold text-ink transition hover:border-brand hover:text-brand disabled:opacity-50"
                  >
                    {secili.okundu ? "Okunmadı işaretle" : "Okundu işaretle"}
                  </button>
                  <button
                    type="button"
                    disabled={islemde}
                    onClick={() => sil(secili.id)}
                    aria-label="Mesajı sil"
                    className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-ink/12 text-[#656B7A] transition hover:border-danger/45 hover:text-danger disabled:opacity-50"
                  >
                    <Icon name="x" size={15} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-px bg-ink/8 sm:grid-cols-2">
                {[
                  { etiket: "Ad soyad", deger: secili.ad },
                  { etiket: "E-posta", deger: secili.email },
                  { etiket: "Telefon", deger: secili.telefon || "—" },
                  { etiket: "Şirket", deger: secili.sirket || "—" },
                ].map((a) => (
                  <div key={a.etiket} className="bg-white px-6 py-[14px]">
                    <div className="font-mono text-[9.5px] tracking-[0.12em] text-[#656B7A] uppercase">{a.etiket}</div>
                    <div className="mt-[5px] text-[14.5px] font-medium break-words">{a.deger}</div>
                  </div>
                ))}
              </div>

              <div className="px-6 py-5">
                <div className="font-mono text-[9.5px] tracking-[0.12em] text-[#656B7A] uppercase">Mesaj</div>
                <p className="mt-3 text-[15px] leading-[1.7] whitespace-pre-line text-[#2B303D]">{secili.mesaj}</p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={`mailto:${secili.email}?subject=${encodeURIComponent(`Re: ${secili.konu || "Mesajınız"}`)}`}
                    className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-brand px-5 text-sm font-semibold text-white transition hover:bg-ink"
                  >
                    <Icon name="message" size={15} />
                    E-posta ile yanıtla
                  </a>
                  {secili.telefon && (
                    <a
                      href={`tel:${secili.telefon.replace(/\s/g, "")}`}
                      className="inline-flex h-11 items-center rounded-[10px] border border-ink/13 bg-white px-5 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand"
                    >
                      Ara
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
