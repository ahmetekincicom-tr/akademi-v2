"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ogrencileriIceAktar } from "@/app/admin/(protected)/ogrenciler/ice-aktar-actions";
import { useBildirim } from "@/components/Bildirim";
import { Icon } from "@/components/Icon";
import { tabloOku, type TabloSatiri } from "@/lib/tablo-oku";
import {
  basliklariEsle,
  satirDogrula,
  tamAdiBol,
  type HamSatir,
  type IceAktarmaSonucu,
} from "@/lib/ogrenci-ice-aktarma";

// Sunucu eylemiyle aynı sınır. Tarayıcı listeyi bu boyda parçalara bölüp
// sırayla gönderiyor; ilerleme çubuğu da buradan besleniyor.
const PARCA = 30;

type Alan = "ad" | "soyad" | "eposta" | "telefon";
type Eslesme = Record<Alan, string>;

const ALAN_ETIKET: Record<Alan, string> = {
  ad: "Ad",
  soyad: "Soyad",
  eposta: "E-posta",
  telefon: "Telefon",
};

const ALAN = "h-11 w-full rounded-[10px] border border-ink/13 bg-white px-3 text-[14px] text-ink";

export function OgrenciIceAktarma() {
  const router = useRouter();
  const bildir = useBildirim();

  const [dosyaAdi, setDosyaAdi] = useState("");
  const [basliklar, setBasliklar] = useState<string[]>([]);
  const [satirlar, setSatirlar] = useState<TabloSatiri[]>([]);
  const [eslesme, setEslesme] = useState<Eslesme>({ ad: "", soyad: "", eposta: "", telefon: "" });
  const [tekSutunAd, setTekSutunAd] = useState(false);
  const [mevcutlariGuncelle, setMevcutlariGuncelle] = useState(false);

  const [islemde, setIslemde] = useState(false);
  const [ilerleme, setIlerleme] = useState({ islenen: 0, toplam: 0 });
  const [rapor, setRapor] = useState<IceAktarmaSonucu[] | null>(null);

  const dosyaSec = async (dosya: File | undefined) => {
    if (!dosya) return;
    setRapor(null);
    try {
      const { basliklar: b, satirlar: s } = await tabloOku(dosya);
      if (s.length === 0) {
        bildir.hata("Dosyada veri satırı bulunamadı.");
        return;
      }
      const otomatik = basliklariEsle(b);
      setDosyaAdi(dosya.name);
      setBasliklar(b);
      setSatirlar(s);
      setEslesme(otomatik);
      // Soyad sütunu yoksa ad alanı büyük ihtimalle "Ad Soyad".
      setTekSutunAd(!otomatik.soyad && Boolean(otomatik.ad));
    } catch (e) {
      bildir.hata(e instanceof Error ? e.message : "Dosya okunamadı.");
    }
  };

  // Eşlemeye göre ham satırları çıkar, dosya içindeki tekrarları ayıkla.
  const hazirla = (): { gecerli: HamSatir[]; hatali: IceAktarmaSonucu[] } => {
    const gecerli: HamSatir[] = [];
    const hatali: IceAktarmaSonucu[] = [];
    const gorulen = new Set<string>();

    satirlar.forEach((s, i) => {
      const adHam = eslesme.ad ? (s[eslesme.ad] ?? "") : "";
      const bolunmus = tekSutunAd ? tamAdiBol(adHam) : null;

      const ham: HamSatir = {
        ad: bolunmus ? bolunmus.ad : adHam,
        soyad: bolunmus ? bolunmus.soyad : eslesme.soyad ? (s[eslesme.soyad] ?? "") : "",
        eposta: eslesme.eposta ? (s[eslesme.eposta] ?? "") : "",
        telefon: eslesme.telefon ? (s[eslesme.telefon] ?? "") : "",
      };

      const d = satirDogrula(ham);
      if (!d.gecerli) {
        hatali.push({ eposta: ham.eposta || `${i + 2}. satır`, durum: "hata", aciklama: d.sebep });
        return;
      }
      if (gorulen.has(d.satir.eposta)) {
        hatali.push({ eposta: d.satir.eposta, durum: "atlandi", aciklama: "Dosyada tekrar ediyor" });
        return;
      }
      gorulen.add(d.satir.eposta);
      gecerli.push(d.satir);
    });

    return { gecerli, hatali };
  };

  const { gecerli, hatali } = satirlar.length ? hazirla() : { gecerli: [], hatali: [] };

  const aktar = async () => {
    if (gecerli.length === 0) return;
    setIslemde(true);
    setRapor(null);
    setIlerleme({ islenen: 0, toplam: gecerli.length });

    // Dosyadan gelen hatalar da rapora giriyor: yönetici tek listede
    // neyin neden olmadığını görsün.
    const toplanan: IceAktarmaSonucu[] = [...hatali];

    for (let i = 0; i < gecerli.length; i += PARCA) {
      const parca = gecerli.slice(i, i + PARCA);
      const cevap = await ogrencileriIceAktar(parca, { mevcutlariGuncelle });

      if (cevap.error) {
        bildir.hata(cevap.error);
        setIslemde(false);
        setRapor(toplanan);
        return;
      }
      toplanan.push(...(cevap.sonuclar ?? []));
      setIlerleme({ islenen: Math.min(i + PARCA, gecerli.length), toplam: gecerli.length });
    }

    setRapor(toplanan);
    setIslemde(false);
    const eklendi = toplanan.filter((r) => r.durum === "eklendi").length;
    bildir.basarili(`${eklendi} öğrenci eklendi.`);
    router.refresh();
  };

  const raporIndir = () => {
    if (!rapor) return;
    const satirlarCsv = [
      "eposta;durum;aciklama",
      ...rapor.map((r) => `${r.eposta};${r.durum};${(r.aciklama ?? "").replace(/;/g, ",")}`),
    ].join("\n");
    // BOM: Excel UTF-8 olduğunu aksi halde anlamıyor ve Türkçe harfler bozuluyor.
    const bag = URL.createObjectURL(new Blob(["﻿" + satirlarCsv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = bag;
    a.download = "ice-aktarma-raporu.csv";
    a.click();
    URL.revokeObjectURL(bag);
  };

  const sayim = (d: IceAktarmaSonucu["durum"]) => rapor?.filter((r) => r.durum === d).length ?? 0;

  return (
    <main className="flex flex-col gap-6 p-4 pb-14 sm:p-[34px]">
      <div>
        <Link
          href="/admin/ogrenciler"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#5C6273] hover:text-brand"
        >
          <Icon name="arrowLeft" size={14} />
          Öğrenciler
        </Link>
        <h1 className="mt-3 font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em]">
          Öğrenci içe aktarma
        </h1>
        <p className="mt-2 max-w-[660px] text-[15px] leading-[1.6] text-[#5C6273]">
          Excel (.xlsx) veya CSV dosyasından toplu öğrenci kaydı oluşturur. Hesaplar şifresiz açılır ve
          kimseye e-posta gitmez; öğrenci hazır olduğunda &quot;şifremi unuttum&quot; ile kendi şifresini
          belirler.
        </p>
      </div>

      <div className="rounded-2xl border border-ink/10 bg-white p-5 sm:p-6">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[12px] border-2 border-dashed border-ink/15 bg-paper px-6 py-10 text-center transition hover:border-brand">
          <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-brand/12 text-brand">
            <Icon name="upload" size={20} />
          </span>
          <span className="text-[15px] font-semibold text-ink">
            {dosyaAdi || "Dosya seç (.xlsx veya .csv)"}
          </span>
          <span className="text-[13px] text-[#5C6273]">
            İlk satır başlık olmalı: Ad, Soyad, E-posta, Telefon
          </span>
          <input
            type="file"
            accept=".csv,.xlsx,text/csv"
            className="hidden"
            onChange={(e) => void dosyaSec(e.target.files?.[0])}
          />
        </label>
      </div>

      {basliklar.length > 0 && (
        <>
          <div className="rounded-2xl border border-ink/10 bg-white p-5 sm:p-6">
            <h2 className="font-heading text-[17px] font-semibold tracking-[-0.02em]">Sütun eşleme</h2>
            <p className="mt-1 text-[13.5px] text-[#5C6273]">
              Başlıklar otomatik eşlendi. Yanlışsa buradan düzeltebilirsin.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(Object.keys(ALAN_ETIKET) as Alan[]).map((alan) => (
                <label key={alan} className="flex flex-col gap-2">
                  <span className="text-[13px] font-semibold text-ink">
                    {ALAN_ETIKET[alan]}
                    {alan === "eposta" && <span className="text-danger"> *</span>}
                  </span>
                  <select
                    value={eslesme[alan]}
                    disabled={alan === "soyad" && tekSutunAd}
                    onChange={(e) => setEslesme({ ...eslesme, [alan]: e.target.value })}
                    className={`${ALAN} disabled:opacity-45`}
                  >
                    <option value="">— yok —</option>
                    {basliklar.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            <label className="mt-4 flex items-center gap-2.5 text-[13.5px] text-ink">
              <input
                type="checkbox"
                checked={tekSutunAd}
                onChange={(e) => setTekSutunAd(e.target.checked)}
                className="h-4 w-4 accent-[#1C56F3]"
              />
              Ad ve soyad tek sütunda — son kelime soyad sayılır
            </label>
            <label className="mt-2 flex items-center gap-2.5 text-[13.5px] text-ink">
              <input
                type="checkbox"
                checked={mevcutlariGuncelle}
                onChange={(e) => setMevcutlariGuncelle(e.target.checked)}
                className="h-4 w-4 accent-[#1C56F3]"
              />
              Zaten kayıtlı e-postaların ad, soyad ve telefonunu güncelle
            </label>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-heading text-[17px] font-semibold tracking-[-0.02em]">Önizleme</h2>
              <div className="font-mono text-[12px] text-[#656B7A]">
                {satirlar.length} satır · <span className="text-[#1C7C4A]">{gecerli.length} geçerli</span>
                {hatali.length > 0 && <span className="text-danger-ink"> · {hatali.length} sorunlu</span>}
              </div>
            </div>

            {/* Dar ekranda tablo kendi içinde kaysın, sayfa yana kaymasın. */}
            <div className="mt-4 -mx-5 overflow-x-auto sm:mx-0">
              <table className="w-full min-w-[560px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-ink/10">
                    {(Object.keys(ALAN_ETIKET) as Alan[]).map((a) => (
                      <th
                        key={a}
                        className="px-5 pb-2 font-mono text-[10px] tracking-[0.14em] text-[#8A90A0] uppercase sm:px-3"
                      >
                        {ALAN_ETIKET[a]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gecerli.slice(0, 8).map((s) => (
                    <tr key={s.eposta} className="border-b border-ink/6 last:border-b-0">
                      <td className="px-5 py-2.5 text-[13.5px] text-ink sm:px-3">{s.ad || "—"}</td>
                      <td className="px-5 py-2.5 text-[13.5px] text-ink sm:px-3">{s.soyad || "—"}</td>
                      <td className="px-5 py-2.5 font-mono text-[12.5px] text-ink sm:px-3">{s.eposta}</td>
                      <td className="px-5 py-2.5 font-mono text-[12.5px] text-[#5C6273] sm:px-3">
                        {s.telefon || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {gecerli.length > 8 && (
              <p className="mt-3 text-[12.5px] text-[#8A90A0]">
                İlk 8 satır gösteriliyor; {gecerli.length - 8} kayıt daha var.
              </p>
            )}

            {hatali.length > 0 && (
              <div className="mt-4 rounded-[11px] border border-[#E0A21C]/35 bg-[#FDF6E7] p-4">
                <div className="text-[13.5px] font-semibold text-ink">
                  {hatali.length} satır aktarılmayacak
                </div>
                <ul className="mt-2 flex flex-col gap-1 text-[12.5px] text-[#5C6273]">
                  {hatali.slice(0, 5).map((h, i) => (
                    <li key={`${h.eposta}-${i}`} className="font-mono">
                      {h.eposta} — {h.aciklama}
                    </li>
                  ))}
                  {hatali.length > 5 && <li>… ve {hatali.length - 5} tane daha</li>}
                </ul>
              </div>
            )}

            <button
              type="button"
              disabled={islemde || gecerli.length === 0}
              onClick={aktar}
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-[10px] bg-brand px-5 text-[14px] font-semibold text-white transition hover:bg-ink disabled:opacity-45"
            >
              <Icon name="upload" size={16} />
              {islemde
                ? `Aktarılıyor… ${ilerleme.islenen}/${ilerleme.toplam}`
                : `${gecerli.length} öğrenciyi içe aktar`}
            </button>

            {islemde && (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-mist">
                <div
                  className="h-full rounded-full bg-brand transition-[width] duration-200"
                  style={{
                    width: `${ilerleme.toplam ? (ilerleme.islenen / ilerleme.toplam) * 100 : 0}%`,
                  }}
                />
              </div>
            )}
          </div>
        </>
      )}

      {rapor && (
        <div className="rounded-2xl border border-ink/10 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-heading text-[17px] font-semibold tracking-[-0.02em]">Sonuç</h2>
            <button
              type="button"
              onClick={raporIndir}
              className="inline-flex h-9 items-center gap-2 rounded-[9px] border border-ink/13 bg-white px-3 text-[13px] font-semibold text-ink hover:border-brand hover:text-brand"
            >
              <Icon name="download" size={14} />
              Raporu indir
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                ["eklendi", "Eklendi", "#1C7C4A"],
                ["guncellendi", "Güncellendi", "#1C56F3"],
                ["atlandi", "Atlandı", "#8A6210"],
                ["hata", "Hata", "#B4232A"],
              ] as const
            ).map(([d, etiket, renk]) => (
              <div key={d} className="rounded-[11px] border border-ink/8 bg-paper px-4 py-3">
                <div className="font-mono text-[10px] tracking-[0.14em] text-[#8A90A0] uppercase">
                  {etiket}
                </div>
                <div className="mt-1 font-heading text-[22px] font-semibold" style={{ color: renk }}>
                  {sayim(d)}
                </div>
              </div>
            ))}
          </div>

          {sayim("hata") + sayim("atlandi") > 0 && (
            <ul className="mt-4 flex max-h-[240px] flex-col gap-1 overflow-y-auto text-[12.5px] text-[#5C6273]">
              {rapor
                .filter((r) => r.durum === "hata" || r.durum === "atlandi")
                .map((r, i) => (
                  <li key={`${r.eposta}-${i}`} className="font-mono">
                    {r.eposta} — {r.aciklama}
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </main>
  );
}
