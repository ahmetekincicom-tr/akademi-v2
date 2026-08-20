"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { OgrenciDetay } from "@/components/admin/OgrenciDetay";
import type { OturumKaydi, PaylasimSinyali } from "@/lib/oturum";
import type { RizaKaydi } from "@/lib/riza-tipleri";
import { TR_ZAMAN } from "@/lib/zaman";

export type AdminKurs = { id: string; slug: string; baslik: string };

export type AdminEgitimOturumu = {
  id: string;
  baslangic: string;
  sureDk: number;
  konu: string;
  toplantiLink: string;
  kayitLink: string;
  durum: "planlandi" | "tamamlandi" | "iptal";
};

/**
 * Kişiye paylaşılan kayıt klasörü. Takvimden ayrı: aynı Drive klasörünü her
 * oturuma tek tek yapıştırmak gerekmesin diye kişiye bağlı duruyor.
 */
export type AdminKayitArsivi = {
  id: string;
  baslik: string;
  link: string;
  aciklama: string;
  courseId: string;
  program: string;
};

export type AdminOgrenci = {
  id: string;
  isim: string;
  eposta: string;
  admin: boolean;
  kayitTarihi: string;
  /** Öğrenci uygulamadan hesap silme talebi açtıysa dolu (App Store 5.1.1v). */
  silmeTalebi: string | null;
  kayitlar: {
    courseId: string;
    baslik: string;
    atanmaTarihi: string;
    dersSayisi: number;
    tamamlanan: number;
    yuzde: number;
  }[];
  /** Birebir eğitim takvimi; detayda buradan yönetiliyor. */
  egitimler: AdminEgitimOturumu[];
  /** Ders kaydı klasörleri; takvimden bağımsız. */
  arsiv: AdminKayitArsivi[];
  /** Verilen onayların zaman damgalı kaydı (KVKK ispatı). */
  onaylar: RizaKaydi[];
  oturumlar: OturumKaydi[];
  sinyal: PaylasimSinyali;
};

// 300 kayıtta tek sayfa hem uzun hem yavaş; 25 ekrana sığan ve aramayla
// birlikte çalışan bir boy.
const SAYFA_BOYU = 25;

const tarihBicimi = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TR_ZAMAN,
  day: "numeric",
  month: "short",
  year: "numeric",
});

function basHarfler(isim: string) {
  return isim
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function OgrenciYonetimi({
  ogrenciler,
  kurslar,
}: {
  ogrenciler: AdminOgrenci[];
  kurslar: AdminKurs[];
}) {
  const [arama, setArama] = useState("");
  const [sayfa, setSayfa] = useState(0);
  const [seciliId, setSeciliId] = useState<string | null>(null);

  const listelenen = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase("tr-TR");
    if (!q) return ogrenciler;
    return ogrenciler.filter(
      (o) =>
        o.isim.toLocaleLowerCase("tr-TR").includes(q) || o.eposta.toLocaleLowerCase("tr-TR").includes(q),
    );
  }, [arama, ogrenciler]);

  const sayfaSayisi = Math.max(1, Math.ceil(listelenen.length / SAYFA_BOYU));
  // Arama daraldığında elde olmayan bir sayfada kalınabiliyor; sınıra çekiyoruz.
  const gecerliSayfa = Math.min(sayfa, sayfaSayisi - 1);
  const basla = gecerliSayfa * SAYFA_BOYU;
  const sayfadakiler = listelenen.slice(basla, basla + SAYFA_BOYU);

  const aramaDegisti = (deger: string) => {
    setArama(deger);
    setSayfa(0);
    setSeciliId(null);
  };

  const sayfaDegistir = (yon: -1 | 1) => {
    setSayfa(Math.min(Math.max(gecerliSayfa + yon, 0), sayfaSayisi - 1));
    // Açık detay başka sayfada kalırsa kafa karıştırıcı olurdu.
    setSeciliId(null);
  };

  return (
    <main className="p-4 pb-14 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
            Öğrenciler
          </h1>
          <p className="mt-[7px] text-[14.5px] text-[#5C6273]">
            {ogrenciler.length} kayıt · eğitim ataması, birebir eğitim takvimi ve ilerleme buradan yönetilir.
          </p>
        </div>
        <Link
          href="/kontrol-9f4x2k/ogrenciler/ice-aktar"
          className="inline-flex h-[42px] flex-none items-center gap-2 rounded-[10px] border border-ink/13 bg-white px-4 text-[13.5px] font-semibold text-ink transition hover:border-brand hover:text-brand"
        >
          <Icon name="upload" size={15} />
          Excel/CSV içe aktar
        </Link>
      </div>

      <div className="mt-[22px] flex h-[42px] max-w-[380px] items-center gap-[9px] rounded-[10px] border border-ink/12 bg-white px-[14px]">
        <Icon name="search" size={15} className="flex-none text-[#656B7A]" />
        <input
          type="text"
          placeholder="İsim veya e-posta ara"
          value={arama}
          onChange={(e) => aramaDegisti(e.target.value)}
          className="w-full border-0 bg-transparent text-sm text-ink outline-none"
        />
      </div>

      <div className="mt-[18px] overflow-hidden rounded-2xl border border-ink/10 bg-white">
        {/* Başlık satırı yalnızca sütunların yan yana durduğu genişlikte. */}
        <div className="hidden grid-cols-[2fr_1.8fr_1.2fr_1fr_90px] gap-4 border-b border-ink/8 bg-mist px-[22px] py-[13px] font-mono text-[9.5px] tracking-[0.12em] text-[#656B7A] uppercase lg:grid">
          <span>Öğrenci</span>
          <span>Eğitimler</span>
          <span>İlerleme</span>
          <span>Kayıt</span>
          <span />
        </div>

        {sayfadakiler.length === 0 ? (
          <div className="px-[22px] py-10 text-center text-sm text-[#656B7A]">
            {ogrenciler.length === 0 ? "Henüz kayıtlı kullanıcı yok." : "Aramanla eşleşen öğrenci bulunamadı."}
          </div>
        ) : (
          sayfadakiler.map((o) => {
            const toplamDers = o.kayitlar.reduce((n, r) => n + r.dersSayisi, 0);
            const toplamBitti = o.kayitlar.reduce((n, r) => n + r.tamamlanan, 0);
            const yuzde = toplamDers ? Math.round((toplamBitti / toplamDers) * 100) : 0;
            const acik = o.id === seciliId;

            return (
              <div key={o.id} className="border-b border-ink/7 last:border-b-0">
                {/*
                  Dar ekranda satır alt alta yığılıyor, lg'den itibaren sütunlara
                  geçiyor. Eskiden sabit 820px genişlikte bir ızgaraydı ve tablo
                  yatay kayıyordu; telefonda ve uygulamada kullanılamıyordu.
                */}
                <div
                  className={`flex flex-col gap-3 px-4 py-[14px] transition sm:px-[22px] lg:grid lg:grid-cols-[2fr_1.8fr_1.2fr_1fr_90px] lg:items-center lg:gap-4 ${
                    acik ? "bg-[#F4F7FF]" : "hover:bg-[#F7F9FF]"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-[11px]">
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#F2F4FA] font-mono text-[11px] font-medium text-[#5C6273]">
                      {basHarfler(o.isim)}
                    </span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-semibold">{o.isim}</span>
                        {o.silmeTalebi && (
                          <span
                            title={`Hesap silme talebi: ${tarihBicimi.format(new Date(o.silmeTalebi))}`}
                            className="flex-none rounded-full bg-danger/12 px-[8px] py-[2px] font-mono text-[9px] tracking-[0.08em] text-danger-ink uppercase"
                          >
                            Silme talebi
                          </span>
                        )}
                        {o.admin && (
                          <span className="flex-none rounded-full bg-ink px-[7px] py-[2px] font-mono text-[9px] tracking-[0.08em] text-white uppercase">
                            admin
                          </span>
                        )}
                        {o.sinyal.supheli && (
                          <span
                            title={o.sinyal.gerekce}
                            className="flex-none rounded-full bg-[rgba(201,138,27,0.16)] px-[7px] py-[2px] font-mono text-[9px] tracking-[0.08em] text-[#A5711A] uppercase"
                          >
                            paylaşım?
                          </span>
                        )}
                      </span>
                      <span className="block truncate font-mono text-[10px] text-[#656B7A]">{o.eposta}</span>
                    </span>
                  </div>

                  <div className="min-w-0 text-[13.5px] text-[#3A3F4F]">
                    {o.kayitlar.length ? o.kayitlar.map((r) => r.baslik).join(", ") : "—"}
                  </div>

                  <div className="max-w-[220px] lg:max-w-none">
                    <div className="h-[5px] overflow-hidden rounded-full bg-ink/8">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${yuzde}%` }} />
                    </div>
                    <div className="mt-[5px] font-mono text-[10px] text-[#656B7A]">
                      {o.kayitlar.length ? `${yuzde}% · ${toplamBitti}/${toplamDers}` : "kayıt yok"}
                    </div>
                  </div>

                  <div className="font-mono text-[11px] text-[#5C6273]">
                    {tarihBicimi.format(new Date(o.kayitTarihi))}
                    {o.egitimler.length > 0 && (
                      <span className="ml-2 lg:ml-0 lg:block lg:mt-[3px]">
                        {o.egitimler.length} birebir
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSeciliId(acik ? null : o.id)}
                    className="h-8 w-fit rounded-[8px] border border-ink/13 bg-white px-3 text-[12.5px] font-semibold text-ink hover:border-ink hover:bg-ink hover:text-white lg:w-full lg:px-0"
                  >
                    {acik ? "Kapat" : "Detay"}
                  </button>
                </div>

                {/*
                  Detay tıklanan satırın hemen altında açılıyor. Eskiden listenin
                  tamamının altındaydı; 300 kayıtta beşinci satırın detayı
                  ekranın çok aşağısında açılıyor ve kaybolmuş gibi duruyordu.
                */}
                {acik && (
                  <OgrenciDetay ogrenci={o} kurslar={kurslar} kapat={() => setSeciliId(null)} />
                )}
              </div>
            );
          })
        )}
      </div>

      {listelenen.length > SAYFA_BOYU && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="font-mono text-[11.5px] text-[#656B7A]">
            {basla + 1}–{Math.min(basla + SAYFA_BOYU, listelenen.length)} / {listelenen.length}
            {arama && ` (${ogrenciler.length} kayıt içinde)`}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={gecerliSayfa === 0}
              onClick={() => sayfaDegistir(-1)}
              className="flex h-9 items-center gap-1.5 rounded-[9px] border border-ink/13 bg-white px-3 text-[13px] font-semibold text-ink transition hover:border-brand hover:text-brand disabled:opacity-40 disabled:hover:border-ink/13 disabled:hover:text-ink"
            >
              <Icon name="arrowLeft" size={14} />
              Önceki
            </button>
            <span className="font-mono text-[12px] text-[#5C6273]">
              {gecerliSayfa + 1} / {sayfaSayisi}
            </span>
            <button
              type="button"
              disabled={gecerliSayfa >= sayfaSayisi - 1}
              onClick={() => sayfaDegistir(1)}
              className="flex h-9 items-center gap-1.5 rounded-[9px] border border-ink/13 bg-white px-3 text-[13px] font-semibold text-ink transition hover:border-brand hover:text-brand disabled:opacity-40 disabled:hover:border-ink/13 disabled:hover:text-ink"
            >
              Sonraki
              <Icon name="arrowRight" size={14} />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
