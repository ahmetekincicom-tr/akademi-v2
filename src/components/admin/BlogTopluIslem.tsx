"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useBildirim } from "@/components/Bildirim";
import { StatusBadge } from "@/lib/admin/shared";
import { YonlendirmeKarariPenceresi } from "@/components/admin/YonlendirmeKarari";
import {
  topluIslem,
  type TopluIslem,
  type YonlendirmeKarari,
} from "@/app/kontrol-9f4x2k/(protected)/blog/actions";
import type { IcLinkHedef, Kategori, YaziDurum } from "@/lib/yazilar";

/**
 * Blog listesinde toplu işlem: seçilen yazıların kategorisini değiştir,
 * yayınla, taslağa al, sil.
 *
 * Performans tablosu (BlogPanel) sunucu bileşeni ve dokunulmadı; seçim
 * ayrı, açılır bir listede. Yayından kalkan / silinen yazıların eski
 * adresi için tek karar soruluyor (YonlendirmeKarari), hepsine uygulanıyor.
 */

export type TopluYazi = {
  id: string;
  slug: string;
  baslik: string;
  durum: YaziDurum;
  kategoriId: string | null;
  hicYayinlandi: boolean;
};

const DURUM_ETIKETI: Record<YaziDurum, string> = { yayin: "Yayında", taslak: "Taslak", zamanli: "Zamanlı" };
const SUZGECLER: { deger: YaziDurum | "hepsi"; ad: string }[] = [
  { deger: "hepsi", ad: "Hepsi" },
  { deger: "yayin", ad: "Yayında" },
  { deger: "taslak", ad: "Taslak" },
  { deger: "zamanli", ad: "Zamanlı" },
];

const DUGME =
  "flex h-11 items-center justify-center rounded-[10px] border px-3.5 text-[13.5px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-45";

export function BlogTopluIslem({
  yazilar,
  kategoriler,
  icHedefler,
}: {
  yazilar: TopluYazi[];
  kategoriler: Kategori[];
  icHedefler: IcLinkHedef[];
}) {
  const bildir = useBildirim();
  const router = useRouter();
  const [acik, setAcik] = useState(false);
  const [secili, setSecili] = useState<Set<string>>(new Set());
  const [suzgec, setSuzgec] = useState<YaziDurum | "hepsi">("hepsi");
  const [hedefKategori, setHedefKategori] = useState<string>("");
  const [onay, setOnay] = useState<null | "yayinla" | "kategori" | "sil-onay">(null);
  const [karar, setKarar] = useState<null | "taslak" | "sil">(null);
  const [bekliyor, basla] = useTransition();

  const gorunen = useMemo(() => yazilar.filter((y) => suzgec === "hepsi" || y.durum === suzgec), [yazilar, suzgec]);
  const seciliYazilar = yazilar.filter((y) => secili.has(y.id));
  const hepsiSecili = gorunen.length > 0 && gorunen.every((y) => secili.has(y.id));
  const katAd = (id: string | null) => kategoriler.find((k) => k.id === id)?.ad ?? "Kategorisiz";

  const degistir = (id: string) =>
    setSecili((s) => {
      const y = new Set(s);
      if (y.has(id)) y.delete(id);
      else y.add(id);
      return y;
    });

  const hepsini = () =>
    setSecili((s) => {
      const y = new Set(s);
      for (const g of gorunen) {
        if (hepsiSecili) y.delete(g.id);
        else y.add(g.id);
      }
      return y;
    });

  const calistir = (islem: TopluIslem, ad: string) => {
    setOnay(null);
    setKarar(null);
    basla(async () => {
      const r = await topluIslem([...secili], islem);
      if (r.error) return bildir.hata(r.error);
      if (r.hatalar.length) {
        bildir.hata(
          `${r.tamam} yazı ${ad}; ${r.hatalar.length} yazıda hata: ${r.hatalar.map((h) => `${h.baslik} (${h.mesaj})`).join("; ")}`,
        );
      } else bildir.basarili(`${r.tamam} yazı ${ad}.`);
      setSecili(new Set());
      router.refresh();
    });
  };

  const taslakIste = () => {
    // Yayındaki bir yazı yayından kalkıyorsa eski adresinin kaderi soruluyor.
    if (seciliYazilar.some((y) => y.durum === "yayin")) setKarar("taslak");
    else calistir({ tur: "taslak" }, "taslağa alındı");
  };

  const silIste = () => {
    if (seciliYazilar.some((y) => y.hicYayinlandi)) setKarar("sil");
    else setOnay("sil-onay");
  };

  const yayindaSayisi = seciliYazilar.filter((y) => y.durum === "yayin").length;

  return (
    <div className="mt-5 rounded-[14px] border border-ink/11 bg-white">
      <button
        type="button"
        aria-expanded={acik}
        onClick={() => setAcik((a) => !a)}
        className="flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left"
      >
        <span className="text-[14px] font-semibold text-ink">
          Toplu işlem
          <span className="ml-2 font-normal text-[#5C6273]">
            {secili.size ? `${secili.size} yazı seçili` : "kategori değiştir, yayınla, taslağa al, sil"}
          </span>
        </span>
        <span aria-hidden className={`text-[11px] text-[#8A90A0] transition ${acik ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>

      {acik && (
        <div className="border-t border-ink/10 px-4 pt-3 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex min-h-11 items-center gap-2 pr-2 text-[13.5px] font-semibold text-ink">
              <input type="checkbox" checked={hepsiSecili} onChange={hepsini} className="h-[18px] w-[18px]" />
              Görünenlerin hepsi
            </label>
            <div role="group" aria-label="Duruma göre süz" className="flex flex-wrap gap-1">
              {SUZGECLER.map((s) => (
                <button
                  key={s.deger}
                  type="button"
                  aria-pressed={suzgec === s.deger}
                  onClick={() => setSuzgec(s.deger)}
                  className={`h-11 rounded-[9px] px-3 text-[13px] font-semibold transition ${
                    suzgec === s.deger ? "bg-ink text-white" : "border border-ink/12 text-[#5C6273] hover:text-ink"
                  }`}
                >
                  {s.ad}
                </button>
              ))}
            </div>
          </div>

          <ul className="mt-2 max-h-[360px] overflow-y-auto rounded-[10px] border border-ink/[0.08]">
            {gorunen.map((y) => (
              <li key={y.id} className="border-b border-ink/[0.06] last:border-0">
                <label className="flex min-h-12 cursor-pointer items-center gap-3 px-3 py-2 hover:bg-mist/60">
                  <input
                    type="checkbox"
                    checked={secili.has(y.id)}
                    onChange={() => degistir(y.id)}
                    className="h-[18px] w-[18px] flex-none"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold text-ink">{y.baslik}</span>
                    <span className="block truncate text-[12px] text-[#5C6273]">{katAd(y.kategoriId)}</span>
                  </span>
                  <StatusBadge durum={DURUM_ETIKETI[y.durum]} />
                </label>
              </li>
            ))}
            {gorunen.length === 0 && <li className="px-3 py-6 text-center text-[13px] text-[#5C6273]">Bu durumda yazı yok.</li>}
          </ul>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex gap-2">
              <select
                value={hedefKategori}
                onChange={(e) => setHedefKategori(e.target.value)}
                aria-label="Yeni kategori"
                className="h-11 min-w-0 flex-1 rounded-[10px] border border-ink/14 bg-white px-3 text-[13.5px] text-ink sm:w-[220px] sm:flex-none"
              >
                <option value="">Kategori seç…</option>
                {kategoriler.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.ad}
                  </option>
                ))}
                <option value="__yok">— Kategorisiz —</option>
              </select>
              <button
                type="button"
                disabled={!secili.size || !hedefKategori || bekliyor}
                onClick={() => setOnay("kategori")}
                className={`${DUGME} border-ink/13 bg-white text-ink hover:border-brand`}
              >
                Kategoriyi değiştir
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:flex">
              <button
                type="button"
                disabled={!secili.size || bekliyor}
                onClick={() => setOnay("yayinla")}
                className={`${DUGME} border-brand bg-brand text-white hover:bg-ink`}
              >
                Yayınla
              </button>
              <button
                type="button"
                disabled={!secili.size || bekliyor}
                onClick={taslakIste}
                className={`${DUGME} border-ink/13 bg-white text-ink hover:border-brand`}
              >
                Taslağa al
              </button>
              <button
                type="button"
                disabled={!secili.size || bekliyor}
                onClick={silIste}
                className={`${DUGME} border-ink/13 bg-white text-[#b4232a] hover:border-[#b4232a]`}
              >
                Sil
              </button>
            </div>
            {bekliyor && (
              <span role="status" className="text-[13px] text-[#5C6273]">
                İşleniyor…
              </span>
            )}
          </div>
        </div>
      )}

      {onay && (
        <Onay
          baslik={
            onay === "yayinla"
              ? `${secili.size} yazı yayınlansın mı?`
              : onay === "kategori"
                ? `${secili.size} yazının kategorisi “${hedefKategori === "__yok" ? "Kategorisiz" : katAd(hedefKategori)}” olsun mu?`
                : `${secili.size} yazı kalıcı olarak silinsin mi?`
          }
          aciklama={
            onay === "yayinla"
              ? "Hemen yayına girer; zamanlı olanların zamanlaması iptal olur. Yayın öncesi kontrol listesi toplu yayında gösterilmez — eksikleri yazıları tek tek açınca görebilirsin."
              : onay === "kategori"
                ? "Yazıların adresi değişmez; kategori sayfaları ve yazılardaki eğitim butonu yeni kategoriye göre güncellenir."
                : "Seçilenler hiç yayınlanmamış yazılar; adresleri Google'da yok. Silinen yazı geri getirilemez."
          }
          onayMetni={onay === "yayinla" ? "Yayınla" : onay === "kategori" ? "Değiştir" : "Sil"}
          tehlikeli={onay === "sil-onay"}
          onIptal={() => setOnay(null)}
          onOnay={() =>
            onay === "yayinla"
              ? calistir({ tur: "yayinla" }, "yayınlandı")
              : onay === "kategori"
                ? calistir({ tur: "kategori", kategoriId: hedefKategori === "__yok" ? null : hedefKategori }, "güncellendi")
                : calistir({ tur: "sil" }, "silindi")
          }
        />
      )}

      {karar && (
        <YonlendirmeKarariPenceresi
          baslik={
            karar === "sil"
              ? `${secili.size} yazı silinecek. Eski adresleri nereye gitsin?`
              : `${yayindaSayisi} yazı yayından kalkıyor. Adresleri nereye gitsin?`
          }
          aciklama="Seçtiğin yönlendirme yayınlanmış olan yazıların hepsine uygulanır. Adresler Google'da ve başka sitelerde bağlantı olarak duruyor olabilir."
          onayMetni={karar === "sil" ? "Yazıları sil" : "Taslağa al"}
          yazilar={icHedefler.filter((h) => !seciliYazilar.some((y) => h.url === `/${y.slug}/`))}
          onIptal={() => setKarar(null)}
          onOnay={(k: YonlendirmeKarari) =>
            karar === "sil"
              ? calistir({ tur: "sil", yonlendirme: k }, "silindi")
              : calistir({ tur: "taslak", yonlendirme: k }, "taslağa alındı")
          }
        />
      )}
    </div>
  );
}

function Onay({
  baslik,
  aciklama,
  onayMetni,
  tehlikeli = false,
  onIptal,
  onOnay,
}: {
  baslik: string;
  aciklama: string;
  onayMetni: string;
  tehlikeli?: boolean;
  onIptal: () => void;
  onOnay: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/40 sm:items-center sm:p-4" onClick={onIptal}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="toplu-onay-baslik"
        className="w-full max-w-[460px] rounded-t-[18px] bg-white p-5 shadow-[0_30px_70px_rgba(10,13,24,0.25)] sm:rounded-[18px] sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="toplu-onay-baslik" className="font-heading text-[18px] font-semibold tracking-[-0.02em] text-ink [overflow-wrap:anywhere]">
          {baslik}
        </h2>
        <p className="mt-2 text-[13.5px] leading-[1.55] text-[#5C6273]">{aciklama}</p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            autoFocus
            onClick={onIptal}
            className="h-11 rounded-[11px] border border-ink/13 bg-white px-4 text-[14px] font-semibold text-ink hover:border-brand"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={onOnay}
            className={`h-11 rounded-[11px] px-4 text-[14px] font-semibold text-white ${
              tehlikeli ? "bg-[#b4232a] hover:bg-ink" : "bg-brand hover:bg-ink"
            }`}
          >
            {onayMetni}
          </button>
        </div>
      </div>
    </div>
  );
}
