"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ilanDurumDegistir,
  ilanOneCikar,
  ilanSil,
} from "@/app/kontrol-9f4x2k/(protected)/firsatlar/actions";
import { CALISMA_TIPI, lokasyonMetni, suresiDoldu, type IlanDurum } from "@/lib/firsat";
import type { YonetimIlani } from "@/lib/firsat-sorgu";
import { useBildirim } from "@/components/Bildirim";
import { Icon } from "@/components/Icon";
import { SirketLogosu, tarihMetni } from "@/components/firsat/IlanOrtak";

/**
 * İş ilanları — yönetim listesi.
 *
 * Görünen durum, kayıtlı durumdan türetiliyor: "yayında" bir ilanın son
 * başvuru günü geçtiyse öğrenci onu zaten "süresi doldu" görüyor; burada da
 * öyle gösteriliyor ki ekip, yayında sandığı bir ilanın aslında kapandığını
 * listede fark etsin.
 */

type Gorunen = "yayinda" | "taslak" | "doldu" | "arsiv";
const GORUNEN: Record<Gorunen, { ad: string; sinif: string }> = {
  yayinda: { ad: "Yayında", sinif: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  taslak: { ad: "Taslak", sinif: "bg-ink/[0.05] text-[#5C6273] border-ink/12" },
  doldu: { ad: "Süresi doldu", sinif: "bg-amber-50 text-amber-700 border-amber-200" },
  arsiv: { ad: "Arşiv", sinif: "bg-ink/[0.05] text-[#8A90A0] border-ink/10" },
};

function gorunenDurum(i: YonetimIlani, bugun: string): Gorunen {
  if (i.durum === "taslak") return "taslak";
  if (i.durum === "arsiv") return "arsiv";
  return suresiDoldu(i, bugun) ? "doldu" : "yayinda";
}

export function IlanYonetimi({ ilanlar, bugun, bolumAcik }: { ilanlar: YonetimIlani[]; bugun: string; bolumAcik: boolean }) {
  const router = useRouter();
  const bildir = useBildirim();
  const [islemde, startTransition] = useTransition();
  const [suzgec, setSuzgec] = useState<"hepsi" | Gorunen>("hepsi");
  const [silinecek, setSilinecek] = useState<string | null>(null);

  const sayac = useMemo(() => {
    const s = { hepsi: ilanlar.length, yayinda: 0, taslak: 0, doldu: 0, arsiv: 0, tiklama: 0, goruntulenme: 0 };
    for (const i of ilanlar) {
      s[gorunenDurum(i, bugun)]++;
      s.tiklama += i.metrik.basvuruTiklama;
      s.goruntulenme += i.metrik.goruntulenme;
    }
    return s;
  }, [ilanlar, bugun]);

  const listelenen = suzgec === "hepsi" ? ilanlar : ilanlar.filter((i) => gorunenDurum(i, bugun) === suzgec);

  const calistir = (is: () => Promise<{ error?: string }>, mesaj: string) =>
    startTransition(async () => {
      const r = await is();
      if (r.error) return bildir.hata(r.error);
      bildir.basarili(mesaj);
      router.refresh();
    });

  const durum = (id: string, d: IlanDurum, mesaj: string) => calistir(() => ilanDurumDegistir(id, d), mesaj);

  return (
    <main className="flex flex-col gap-6 p-4 pb-14 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
            İş ilanları
          </h1>
          <p className="mt-[7px] max-w-[640px] text-[14.5px] leading-[1.6] text-[#5C6273]">
            Öğrenci panelindeki &ldquo;İş fırsatları&rdquo; bölümü. Başvurular ilanın kendi adresinde yapıldığı için
            ölçülen şey gerçek başvuru değil, <strong className="font-semibold text-ink">başvuru tıklaması</strong>.
          </p>
        </div>
        <Link
          href="/kontrol-9f4x2k/firsatlar/yeni"
          className="inline-flex h-[42px] flex-none items-center gap-2 rounded-[10px] bg-brand px-4 text-[13.5px] font-semibold text-white transition hover:bg-ink"
        >
          <Icon name="plus" size={15} />
          Yeni ilan
        </Link>
      </div>

      {!bolumAcik && (
        <div className="rounded-[12px] border border-[#C98A1B]/30 bg-[rgba(201,138,27,0.08)] px-4 py-3 text-[13.5px] leading-[1.55] text-[#7A5512]">
          Bölüm öğrenci menüsünde henüz <strong className="font-semibold">&ldquo;Çok yakında&rdquo;</strong>. İlanları
          girip{" "}
          <Link href="/panel/firsatlar" className="font-semibold underline underline-offset-2">
            öğrenci ekranında önizleyebilirsin
          </Link>
          ; açmak için <code className="font-mono text-[12px]">lib/bolumler.ts → FIRSATLAR_ACIK</code>.
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {[
          { e: "Yayında", v: sayac.yayinda },
          { e: "Taslak", v: sayac.taslak },
          { e: "Görüntülenme", v: sayac.goruntulenme },
          { e: "Başvuru tıklaması", v: sayac.tiklama },
        ].map((k) => (
          <div key={k.e} className="rounded-[12px] border border-ink/10 bg-white px-4 py-3">
            <div className="font-mono text-[9.5px] tracking-[0.12em] text-[#656B7A] uppercase">{k.e}</div>
            <div className="mt-1 font-heading text-[22px] leading-none font-semibold tracking-[-0.02em] text-ink">{k.v}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(["hepsi", "yayinda", "taslak", "doldu", "arsiv"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setSuzgec(f)}
            aria-pressed={suzgec === f}
            className={`rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition ${
              suzgec === f ? "border-brand bg-brand/10 text-brand" : "border-ink/12 bg-white text-[#5C6273] hover:text-ink"
            }`}
          >
            {f === "hepsi" ? "Tümü" : GORUNEN[f].ad} <span className="font-mono text-[11px] opacity-60">{sayac[f]}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {ilanlar.length === 0 && (
          <div className="rounded-2xl border border-dashed border-ink/16 px-6 py-12 text-center text-[14px] text-[#656B7A]">
            Henüz ilan yok. &ldquo;Yeni ilan&rdquo; ile ilk fırsatı ekleyebilirsin.
          </div>
        )}
        {ilanlar.length > 0 && listelenen.length === 0 && (
          <div className="rounded-2xl border border-dashed border-ink/16 px-6 py-10 text-center text-[14px] text-[#656B7A]">
            Bu durumda ilan yok.
          </div>
        )}

        {listelenen.map((i) => {
          const g = gorunenDurum(i, bugun);
          return (
            <div key={i.id} className="rounded-2xl border border-ink/10 bg-white p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-3.5">
                  <SirketLogosu ilan={i} boyut={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${GORUNEN[g].sinif}`}>
                        {GORUNEN[g].ad}
                      </span>
                      {i.oneCikan && (
                        <span className="rounded-full border border-brand/20 bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">
                          Öne çıkan
                        </span>
                      )}
                      <span className="font-mono text-[10.5px] text-[#8A90A0]">{i.kategori}</span>
                    </div>
                    <Link
                      href={`/kontrol-9f4x2k/firsatlar/${i.id}`}
                      className="mt-1 block truncate text-[15.5px] font-semibold text-ink hover:text-brand"
                    >
                      {i.pozisyon}
                    </Link>
                    <div className="mt-0.5 truncate text-[13px] text-[#5C6273]">
                      {i.sirketAdi} · {lokasyonMetni(i)} · {CALISMA_TIPI[i.calismaTipi]}
                    </div>
                    <div className="mt-1 font-mono text-[10.5px] text-[#8A90A0]">
                      Son başvuru: {i.sonBasvuru ? tarihMetni(i.sonBasvuru, true) : "—"}
                    </div>
                  </div>
                </div>

                {/* Metrikler */}
                <dl className="grid flex-none grid-cols-3 gap-2 lg:w-[300px]">
                  {[
                    { e: "Görüntülenme", v: i.metrik.goruntulenme },
                    { e: "Başvuru tıklaması", v: i.metrik.basvuruTiklama },
                    { e: "Kaydetme", v: i.metrik.kayit },
                  ].map((m) => (
                    <div key={m.e} className="rounded-[10px] bg-mist/70 px-2.5 py-2 text-center">
                      <dd className="font-heading text-[18px] leading-none font-semibold text-ink">{m.v}</dd>
                      <dt className="mt-1 text-[10.5px] leading-tight text-[#656B7A]">{m.e}</dt>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-ink/7 pt-3">
                <Link
                  href={`/kontrol-9f4x2k/firsatlar/${i.id}`}
                  className="inline-flex h-9 items-center rounded-[9px] border border-ink/13 bg-white px-3 text-[13px] font-semibold text-ink transition hover:border-brand hover:text-brand"
                >
                  Düzenle
                </Link>
                {i.durum !== "yayinda" && i.durum !== "sona_erdi" && (
                  <button
                    type="button"
                    disabled={islemde}
                    onClick={() => durum(i.id, "yayinda", "İlan yayına alındı.")}
                    className="inline-flex h-9 items-center rounded-[9px] bg-brand px-3 text-[13px] font-semibold text-white transition hover:bg-ink disabled:opacity-40"
                  >
                    Yayına al
                  </button>
                )}
                {i.durum === "sona_erdi" && (
                  <button
                    type="button"
                    disabled={islemde}
                    onClick={() => durum(i.id, "yayinda", "İlan yeniden yayında.")}
                    className="inline-flex h-9 items-center rounded-[9px] border border-ink/13 bg-white px-3 text-[13px] font-semibold text-ink transition hover:border-brand hover:text-brand disabled:opacity-40"
                  >
                    Yeniden aç
                  </button>
                )}
                {i.durum === "yayinda" && (
                  <>
                    <Link
                      href={`/panel/firsatlar/${i.id}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-[9px] border border-ink/13 bg-white px-3 text-[13px] font-semibold text-ink transition hover:border-brand hover:text-brand"
                    >
                      <Icon name="eye" size={14} />
                      Önizle
                    </Link>
                    <button
                      type="button"
                      disabled={islemde}
                      onClick={() => durum(i.id, "sona_erdi", "İlan süresi doldu olarak işaretlendi.")}
                      className="inline-flex h-9 items-center rounded-[9px] border border-ink/13 bg-white px-3 text-[13px] font-semibold text-ink transition hover:border-brand hover:text-brand disabled:opacity-40"
                    >
                      Süresini bitir
                    </button>
                    <button
                      type="button"
                      disabled={islemde}
                      onClick={() => durum(i.id, "taslak", "İlan taslağa çekildi.")}
                      className="inline-flex h-9 items-center rounded-[9px] border border-ink/13 bg-white px-3 text-[13px] font-semibold text-ink transition hover:border-brand hover:text-brand disabled:opacity-40"
                    >
                      Taslağa çek
                    </button>
                  </>
                )}
                <button
                  type="button"
                  disabled={islemde}
                  onClick={() =>
                    calistir(() => ilanOneCikar(i.id, !i.oneCikan), i.oneCikan ? "Öne çıkarma kaldırıldı." : "İlan öne çıkarıldı.")
                  }
                  aria-pressed={i.oneCikan}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[9px] border border-ink/13 bg-white px-3 text-[13px] font-semibold text-ink transition hover:border-brand hover:text-brand disabled:opacity-40"
                >
                  <Icon name="sparkle" size={13} />
                  {i.oneCikan ? "Öne çıkarmayı kaldır" : "Öne çıkar"}
                </button>
                {i.durum !== "arsiv" && (
                  <button
                    type="button"
                    disabled={islemde}
                    onClick={() => durum(i.id, "arsiv", "İlan arşivlendi.")}
                    className="inline-flex h-9 items-center rounded-[9px] border border-ink/13 bg-white px-3 text-[13px] font-semibold text-[#5C6273] transition hover:border-ink hover:text-ink disabled:opacity-40"
                  >
                    Arşivle
                  </button>
                )}
                {silinecek === i.id ? (
                  <span className="inline-flex items-center gap-2 rounded-[9px] border border-danger/30 bg-danger/5 px-2.5 text-[12.5px] text-danger-ink">
                    Metrikleriyle birlikte kalıcı silinsin mi?
                    <button
                      type="button"
                      disabled={islemde}
                      onClick={() => calistir(() => ilanSil(i.id), "İlan silindi.")}
                      className="h-7 rounded-[7px] bg-danger px-2.5 font-semibold text-white disabled:opacity-50"
                    >
                      Sil
                    </button>
                    <button type="button" onClick={() => setSilinecek(null)} className="h-7 px-1.5 font-semibold">
                      Vazgeç
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={islemde}
                    onClick={() => setSilinecek(i.id)}
                    className="inline-flex h-9 items-center rounded-[9px] border border-ink/13 bg-white px-3 text-[13px] font-semibold text-[#5C6273] transition hover:border-danger/45 hover:text-danger disabled:opacity-40"
                  >
                    Sil
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
