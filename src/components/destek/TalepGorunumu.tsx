"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { talepAc, mesajGonder, talepDurumDegistir } from "@/app/destek-actions";
import { durumStil } from "@/lib/admin/shared";
import { talepDurumEtiket, saatBicimi } from "@/lib/admin/format";
import type { DestekTalep } from "@/lib/destek";
import { Icon } from "@/components/Icon";
import { useBildirim } from "@/components/Bildirim";

/**
 * Shared by the admin support screen and the student Q&A page. The admin view
 * adds status control and shows who opened each ticket; the student view adds
 * a "new ticket" form.
 */
export function TalepGorunumu({
  talepler,
  benimId,
  rol,
  kurslar = [],
}: {
  talepler: DestekTalep[];
  benimId: string;
  rol: "admin" | "ogrenci";
  kurslar?: { id: string; ad: string }[];
}) {
  const router = useRouter();
  const bildir = useBildirim();
  const [seciliId, setSeciliId] = useState<string | null>(talepler[0]?.id ?? null);
  const [yanit, setYanit] = useState("");
  const [yeniAcik, setYeniAcik] = useState(false);
  const [yeniBaslik, setYeniBaslik] = useState("");
  const [yeniMesaj, setYeniMesaj] = useState("");
  const [yeniKurs, setYeniKurs] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [islemde, startTransition] = useTransition();

  const secili = talepler.find((t) => t.id === seciliId) ?? null;

  const gonder = () => {
    if (!secili || !yanit.trim()) return;
    setHata(null);
    startTransition(async () => {
      const r = await mesajGonder(secili.id, yanit);
      if (r?.error) {
        setHata(r.error);
        bildir.hata(r.error);
      } else {
        setYanit("");
        bildir.basarili("Mesajın gönderildi.");
        router.refresh();
      }
    });
  };

  const ac = () => {
    setHata(null);
    startTransition(async () => {
      const r = await talepAc(yeniBaslik, yeniMesaj, yeniKurs || undefined);
      if (r?.error) {
        setHata(r.error);
        bildir.hata(r.error);
      } else {
        bildir.basarili("Destek talebin oluşturuldu.");
        setYeniBaslik("");
        setYeniMesaj("");
        setYeniKurs("");
        setYeniAcik(false);
        router.refresh();
      }
    });
  };

  const durumDegistir = (durum: "acik" | "yanitlandi" | "kapandi") => {
    if (!secili) return;
    startTransition(async () => {
      const r = await talepDurumDegistir(secili.id, durum);
      if (r?.error) bildir.hata(r.error);
      else {
        bildir.basarili("Talep durumu güncellendi.");
        router.refresh();
      }
    });
  };

  const adminMi = rol === "admin";

  return (
    <main className={adminMi ? "p-7 pb-14" : "p-[34px] pb-14"}>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
            {adminMi ? "Destek talepleri" : "Soru-cevap"}
          </h1>
          <p className="mt-[7px] text-[14.5px] text-[#5C6273]">
            {adminMi
              ? `${talepler.length} talep · ${talepler.filter((t) => t.durum === "acik").length} tanesi açık`
              : "Eğitim boyunca takıldığın her konuyu buradan sorabilirsin."}
          </p>
        </div>
        {!adminMi && (
          <button
            type="button"
            onClick={() => setYeniAcik((v) => !v)}
            className="inline-flex h-11 items-center gap-[6px] rounded-[10px] bg-brand px-5 text-sm font-semibold text-white transition hover:bg-ink"
          >
            {!yeniAcik && <Icon name="plus" size={15} />}
            {yeniAcik ? "Vazgeç" : "Yeni soru"}
          </button>
        )}
      </div>

      {yeniAcik && (
        <div className="mt-5 rounded-2xl border border-brand/30 bg-white p-6">
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">Konu</span>
              <input
                type="text"
                value={yeniBaslik}
                onChange={(e) => setYeniBaslik(e.target.value)}
                placeholder="Kısa bir başlık"
                className="h-[46px] rounded-[10px] border border-ink/13 bg-white px-[14px] text-[15px] text-ink outline-none focus:border-brand"
              />
            </label>
            {kurslar.length > 0 && (
              <label className="flex flex-col gap-2">
                <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">İlgili eğitim</span>
                <select
                  value={yeniKurs}
                  onChange={(e) => setYeniKurs(e.target.value)}
                  className="h-[46px] rounded-[10px] border border-ink/13 bg-white px-[13px] text-sm text-ink outline-none focus:border-brand"
                >
                  <option value="">Genel</option>
                  {kurslar.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.ad}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">Sorun</span>
              <textarea
                value={yeniMesaj}
                onChange={(e) => setYeniMesaj(e.target.value)}
                placeholder="Yaşadığın durumu olabildiğince net anlat"
                className="min-h-[110px] resize-y rounded-[10px] border border-ink/13 bg-white px-[14px] py-3 text-[15px] leading-[1.6] text-ink outline-none focus:border-brand"
              />
            </label>
          </div>
          {hata && <div className="mt-3 text-sm text-danger-ink">{hata}</div>}
          <button
            type="button"
            onClick={ac}
            disabled={islemde}
            className="mt-4 h-[46px] rounded-[10px] bg-brand px-6 text-[15px] font-semibold text-white hover:bg-ink disabled:opacity-60"
          >
            {islemde ? "Gönderiliyor…" : "Soruyu gönder"}
          </button>
        </div>
      )}

      {talepler.length === 0 ? (
        <div className="mt-[22px] rounded-2xl border border-ink/10 bg-white px-8 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[13px] bg-mist text-[#656B7A]">
            <Icon name="message" size={22} />
          </div>
          <p className="mx-auto mt-4 max-w-[420px] text-[14.5px] leading-[1.6] text-[#5C6273]">
            {adminMi ? "Henüz açılmış bir destek talebi yok." : "Henüz bir soru sormadın."}
          </p>
        </div>
      ) : (
        <div className="mt-[22px] grid grid-cols-1 items-start gap-5 xl:grid-cols-[340px_1fr]">
          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
            {talepler.map((t) => {
              const etiket = talepDurumEtiket[t.durum];
              const st = durumStil(etiket);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSeciliId(t.id)}
                  className="flex w-full flex-col gap-[6px] border-b border-ink/7 px-[18px] py-[14px] text-left last:border-b-0 hover:bg-[#F7F9FF]"
                  style={{ background: t.id === seciliId ? "rgba(28,86,243,0.06)" : undefined }}
                >
                  <span className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-ink">{t.baslik}</span>
                    <span
                      className="flex-none rounded-full px-[8px] py-[2px] font-mono text-[9px] tracking-[0.08em] uppercase"
                      style={{ background: st.bg, color: st.renk }}
                    >
                      {etiket}
                    </span>
                  </span>
                  <span className="truncate font-mono text-[10.5px] text-[#656B7A]">
                    {adminMi ? `${t.kisiAd} · ` : ""}
                    {t.program} · {saatBicimi.format(new Date(t.guncelleme))}
                  </span>
                </button>
              );
            })}
          </div>

          {secili && (
            <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
              <div className="flex flex-wrap items-center gap-3 border-b border-ink/8 px-6 py-[18px]">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-heading text-lg font-semibold tracking-[-0.02em]">{secili.baslik}</h2>
                  <div className="mt-[3px] truncate font-mono text-[10.5px] text-[#656B7A]">
                    {adminMi ? `${secili.kisiAd} · ` : ""}
                    {secili.program}
                  </div>
                </div>
                {adminMi && (
                  <select
                    aria-label="Talep durumu"
                    value={secili.durum}
                    disabled={islemde}
                    onChange={(e) => durumDegistir(e.target.value as "acik" | "yanitlandi" | "kapandi")}
                    className="h-9 rounded-[9px] border border-ink/13 bg-white px-[11px] text-[13px] font-semibold text-ink outline-none focus:border-brand"
                  >
                    <option value="acik">Açık</option>
                    <option value="yanitlandi">Yanıtlandı</option>
                    <option value="kapandi">Kapandı</option>
                  </select>
                )}
              </div>

              <div className="flex max-h-[460px] flex-col gap-4 overflow-auto px-6 py-5">
                {secili.mesajlar.map((m) => {
                  const benim = m.gonderenId === benimId;
                  // Konum ve renk role göre: aynı konuşma iki panelde de aynı
                  // görünsün, kimin baktığına göre yer değiştirmesin.
                  return (
                    <div
                      key={m.id}
                      className={m.egitmenMi ? "flex flex-col items-start" : "flex flex-col items-end"}
                    >
                      <span className="mb-[5px] flex items-center gap-[6px] px-1">
                        <span
                          className="rounded-full px-[7px] py-[2px] font-mono text-[9px] tracking-[0.09em] uppercase"
                          style={
                            m.egitmenMi
                              ? { background: "rgba(28,86,243,0.13)", color: "#1C56F3" }
                              : { background: "rgba(10,13,24,0.07)", color: "#5C6273" }
                          }
                        >
                          {m.egitmenMi ? "Eğitmen" : "Öğrenci"}
                        </span>
                        <span className="font-mono text-[10px] text-[#656B7A]">
                          {benim ? "Sen" : m.gonderenAd}
                        </span>
                      </span>

                      <div
                        className="max-w-[80%] px-4 py-3 text-[14.5px] leading-[1.6] whitespace-pre-line"
                        style={
                          m.egitmenMi
                            ? {
                                background: "#1C56F3",
                                color: "#FFFFFF",
                                borderRadius: "13px 13px 13px 4px",
                              }
                            : {
                                background: "#F2F4FA",
                                color: "#2B303D",
                                border: "1px solid rgba(10,13,24,0.08)",
                                borderRadius: "13px 13px 4px 13px",
                              }
                        }
                      >
                        {m.metin}
                      </div>

                      <span className="mt-[5px] px-1 font-mono text-[10px] text-[#656B7A]">
                        {saatBicimi.format(new Date(m.tarih))}
                      </span>
                    </div>
                  );
                })}
              </div>

              {secili.durum !== "kapandi" ? (
                <div className="border-t border-ink/8 px-6 py-5">
                  <textarea
                    value={yanit}
                    onChange={(e) => setYanit(e.target.value)}
                    placeholder={adminMi ? "Yanıtını yaz…" : "Mesajını yaz…"}
                    className="min-h-[88px] w-full resize-y rounded-[10px] border border-ink/13 bg-white px-[14px] py-3 text-[15px] leading-[1.6] text-ink outline-none focus:border-brand"
                  />
                  {hata && <div className="mt-2 text-sm text-danger-ink">{hata}</div>}
                  <button
                    type="button"
                    onClick={gonder}
                    disabled={islemde || !yanit.trim()}
                    className="mt-3 h-[42px] rounded-[10px] bg-brand px-5 text-sm font-semibold text-white hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {islemde ? "Gönderiliyor…" : "Gönder"}
                  </button>
                </div>
              ) : (
                <div className="border-t border-ink/8 px-6 py-5 text-[13.5px] text-[#656B7A]">
                  Bu talep kapatıldı.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
