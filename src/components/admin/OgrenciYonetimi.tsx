"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { useBildirim } from "@/components/Bildirim";
import { OgrenciDetay } from "@/components/admin/OgrenciDetay";
import { kayitEkleToplu } from "@/app/kontrol-9f4x2k/(protected)/ogrenciler/actions";
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
  /**
   * Kayıt sırasında alınan telefon (E.164).
   *
   * Panelde hiçbir yerde gösterilmiyordu: 313 kaydın 312'sinde dolu olan bir
   * alan, katılımcıya ulaşmanın en hızlı yolu ve yönetici onu görmek için
   * veritabanına bakmak zorundaydı.
   */
  telefon: string;
  admin: boolean;
  kayitTarihi: string;
  /** Öğrenci uygulamadan hesap silme talebi açtıysa dolu (App Store 5.1.1v). */
  silmeTalebi: string | null;
  /** Bağlanmış WhatsApp tıklama kodu; boşsa reklam ilişkisi kurulmamış. */
  temasKodu: string | null;
  /** Ön değerlendirme formunun doldurulduğu an; boşsa doldurulmamış. */
  onDegerlendirme: string | null;
  /** Yöneticinin işaretlediği geliş kaynağı. */
  kaynak: string | null;
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

const anBicimi = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TR_ZAMAN,
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function basHarfler(isim: string) {
  return isim
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toLocaleUpperCase("tr");
}

/**
 * Satırın TEK durumu.
 *
 * Önceden ad-soyadın yanında dört ayrı rozet birden durabiliyordu (admin,
 * silme talebi, paylaşım şüphesi) ve hiçbiri "bu kişi eğitimde nerede"
 * sorusunu yanıtlamıyordu — listeye bakma sebebi çoğunlukla o. Şimdi tek bir
 * durum sütunu var ve sırası önemli: acil olan (silme talebi) ilerlemeyi
 * bastırıyor.
 *
 * Admin rozeti durumdan ayrı kaldı: bir kişi hem yönetici hem öğrenci
 * olabiliyor, ikisi aynı yeri paylaşamaz.
 */
type DurumBilgisi = { etiket: string; bg: string; fg: string };

function durumu(o: AdminOgrenci, yuzde: number): DurumBilgisi {
  if (o.silmeTalebi) return { etiket: "Silme talebi", bg: "rgba(217,60,60,0.12)", fg: "#B03B3B" };
  if (o.sinyal.supheli) return { etiket: "Paylaşım?", bg: "rgba(201,138,27,0.16)", fg: "#94571C" };
  if (o.kayitlar.length === 0) return { etiket: "Eğitimsiz", bg: "#FDF1E6", fg: "#94571C" };
  if (yuzde >= 100) return { etiket: "Tamamlandı", bg: "#F0EEFB", fg: "#5241A8" };
  if (yuzde > 0) return { etiket: "Devam ediyor", bg: "#E8F3EC", fg: "#1F6B47" };
  return { etiket: "Başlamadı", bg: "#EAF0FE", fg: "#2450C9" };
}

type Suzgec = "tumu" | "egitimsiz" | "onDegerlendirme" | "dikkat";

export function OgrenciYonetimi({
  ogrenciler,
  kurslar,
}: {
  ogrenciler: AdminOgrenci[];
  kurslar: AdminKurs[];
}) {
  const router = useRouter();
  const bildir = useBildirim();
  const [islemde, startTransition] = useTransition();

  const [arama, setArama] = useState("");
  const [suzgec, setSuzgec] = useState<Suzgec>("tumu");
  const [sayfa, setSayfa] = useState(0);
  const [seciliId, setSeciliId] = useState<string | null>(null);
  const [isaretli, setIsaretli] = useState<string[]>([]);
  const [topluKurs, setTopluKurs] = useState("");

  /** Kişi başına toplam ilerleme; hem satırda hem durumda kullanılıyor. */
  const ilerleme = useMemo(() => {
    const m = new Map<string, { yuzde: number; bitti: number; toplam: number }>();
    for (const o of ogrenciler) {
      const toplam = o.kayitlar.reduce((n, r) => n + r.dersSayisi, 0);
      const bitti = o.kayitlar.reduce((n, r) => n + r.tamamlanan, 0);
      m.set(o.id, { yuzde: toplam ? Math.round((bitti / toplam) * 100) : 0, bitti, toplam });
    }
    return m;
  }, [ogrenciler]);

  const sayilar = useMemo(() => {
    const egitimsiz = ogrenciler.filter((o) => o.kayitlar.length === 0).length;
    // Ön değerlendirme yalnızca eğitimi olanlar için bekleniyor: eğitimi
    // olmayan birinin doldurmasını beklemek anlamsız, o adım eğitim
    // planlamasının kapısı.
    const onDeg = ogrenciler.filter((o) => o.kayitlar.length > 0 && !o.onDegerlendirme).length;
    const dikkat = ogrenciler.filter((o) => o.silmeTalebi || o.sinyal.supheli).length;
    return { egitimsiz, onDeg, dikkat };
  }, [ogrenciler]);

  const listelenen = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase("tr");
    /*
      Telefon aramasında boşluk, parantez ve tire ATILIYOR: numara veritabanında
      +905321234567 olarak duruyor ama insan "0532 123 45 67" diye arıyor.
      Ham karşılaştırma bu yüzden hiçbir zaman tutmuyordu.
    */
    const rakamlar = q.replace(/\D/g, "");
    return ogrenciler.filter((o) => {
      if (suzgec === "egitimsiz" && o.kayitlar.length > 0) return false;
      if (suzgec === "onDegerlendirme" && (o.kayitlar.length === 0 || o.onDegerlendirme)) return false;
      if (suzgec === "dikkat" && !o.silmeTalebi && !o.sinyal.supheli) return false;
      if (!q) return true;
      if (`${o.isim} ${o.eposta}`.toLocaleLowerCase("tr").includes(q)) return true;
      // "0532…" ile aranırken baştaki sıfır numarada yok: sondan eşleştiriyoruz.
      return rakamlar.length >= 3 && o.telefon.replace(/\D/g, "").endsWith(rakamlar.replace(/^0+/, ""));
    });
  }, [arama, suzgec, ogrenciler]);

  const sayfaSayisi = Math.max(1, Math.ceil(listelenen.length / SAYFA_BOYU));
  // Arama daraldığında elde olmayan bir sayfada kalınabiliyor; sınıra çekiyoruz.
  const gecerliSayfa = Math.min(sayfa, sayfaSayisi - 1);
  const basla = gecerliSayfa * SAYFA_BOYU;
  const sayfadakiler = listelenen.slice(basla, basla + SAYFA_BOYU);

  const secili = seciliId ? (ogrenciler.find((o) => o.id === seciliId) ?? null) : null;

  /*
    Esc paneli kapatıyor.

    Panel ekranın yarısını kaplıyor ve kapatma düğmesi sağ üstte: fareyi
    oraya götürmek, listeye dönmenin en sık yapılan hareketi için uzun bir
    yol. Dinleyici yalnızca panel açıkken bağlanıyor.
  */
  useEffect(() => {
    if (!seciliId) return;
    const tus = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSeciliId(null);
    };
    window.addEventListener("keydown", tus);
    return () => window.removeEventListener("keydown", tus);
  }, [seciliId]);

  const listeDegisti = () => {
    setSayfa(0);
    // Açık detay ve işaretler listeyle birlikte anlamını yitiriyor: görünmeyen
    // bir satır için toplu işlem yapmak, kullanıcının göremediği bir şeye
    // dokunmak demek.
    setSeciliId(null);
    setIsaretli([]);
  };

  const sayfaDegistir = (yon: -1 | 1) => {
    setSayfa(Math.min(Math.max(gecerliSayfa + yon, 0), sayfaSayisi - 1));
    setSeciliId(null);
    setIsaretli([]);
  };

  const isaretle = (id: string) => {
    setIsaretli((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.concat(id)));
  };

  const sayfaIdleri = sayfadakiler.map((o) => o.id);
  const hepsiIsaretli = sayfaIdleri.length > 0 && sayfaIdleri.every((id) => isaretli.includes(id));

  const topluAta = () => {
    startTransition(async () => {
      const r = await kayitEkleToplu(isaretli, topluKurs);
      if (r.error) {
        bildir.hata(r.error);
        return;
      }
      const atlanan = (r.secilen ?? 0) - (r.eklenen ?? 0);
      bildir.basarili(
        atlanan > 0
          ? `${r.eklenen} kişiye atandı, ${atlanan} kişi zaten kayıtlıydı.`
          : `${r.eklenen} kişiye atandı.`,
      );
      setIsaretli([]);
      setTopluKurs("");
      router.refresh();
    });
  };

  return (
    <main className="p-4 pb-14 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="font-mono text-[10px] tracking-[0.14em] text-[#94A0B3] uppercase">
            Yönetim / Katılımcılar
          </div>
          <div className="mt-[9px] flex items-baseline gap-[10px]">
            <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
              Öğrenciler
            </h1>
            <span className="font-mono text-[12px] text-[#8B97AA]">{ogrenciler.length} kayıt</span>
          </div>
        </div>
        <Link
          href="/kontrol-9f4x2k/ogrenciler/ice-aktar"
          className="inline-flex h-[38px] flex-none items-center gap-2 rounded-[9px] border border-ink/13 bg-white px-4 text-[13px] font-semibold text-ink transition hover:border-brand hover:text-brand"
        >
          <Icon name="upload" size={15} />
          Excel/CSV içe aktar
        </Link>
      </div>

      {/*
        Dört sayaç: listeye bakmadan "bugün ne yapmam gerekiyor" sorusunu
        yanıtlıyorlar. Üçü aynı zamanda süzgeç — sayıya tıklamakla o listeye
        düşmek arasında bir adım kalmasın diye.
      */}
      <div className="mt-[18px] grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Sayac etiket="Toplam kayıt" deger={ogrenciler.length} not="öğrenci" />
        <Sayac
          etiket="Eğitim atanmamış"
          deger={sayilar.egitimsiz}
          not="kişi"
          vurgu={sayilar.egitimsiz > 0}
          tikla={() => {
            setSuzgec("egitimsiz");
            listeDegisti();
          }}
        />
        <Sayac
          etiket="Ön değerlendirme bekliyor"
          deger={sayilar.onDeg}
          not="kişi"
          vurgu={sayilar.onDeg > 0}
          tikla={() => {
            setSuzgec("onDegerlendirme");
            listeDegisti();
          }}
        />
        <Sayac
          etiket="Dikkat gerektiren"
          deger={sayilar.dikkat}
          not="silme / paylaşım"
          vurgu={sayilar.dikkat > 0}
          tikla={() => {
            setSuzgec("dikkat");
            listeDegisti();
          }}
        />
      </div>

      <div className="mt-[18px] overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-ink/8 px-4 py-3 sm:px-[16px]">
          <div className="flex h-9 w-full min-w-0 items-center gap-[9px] rounded-[9px] border border-ink/12 bg-[#FBFBFC] px-[12px] sm:w-[300px]">
            <Icon name="search" size={14} className="flex-none text-[#8B97AA]" />
            <input
              type="text"
              placeholder="İsim, e-posta veya telefon ara"
              value={arama}
              onChange={(e) => {
                setArama(e.target.value);
                listeDegisti();
              }}
              className="w-full border-0 bg-transparent text-[13px] text-ink outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-1 rounded-[10px] bg-[#F2F3F6] p-[3px]">
            {(
              [
                ["tumu", "Tümü", ogrenciler.length],
                ["egitimsiz", "Eğitimsiz", sayilar.egitimsiz],
                ["onDegerlendirme", "Ön değ. bekleyen", sayilar.onDeg],
                ["dikkat", "Dikkat", sayilar.dikkat],
              ] as [Suzgec, string, number][]
            ).map(([deger, etiket, sayi]) => {
              const acik = suzgec === deger;
              return (
                <button
                  key={deger}
                  type="button"
                  onClick={() => {
                    setSuzgec(deger);
                    listeDegisti();
                  }}
                  className={`h-[30px] rounded-[8px] px-[11px] text-[12.5px] font-semibold transition ${
                    acik ? "bg-white text-ink shadow-[0_1px_2px_rgba(16,21,31,0.12)]" : "text-[#5C6273] hover:text-ink"
                  }`}
                >
                  {etiket} <span className="font-mono text-[11px] opacity-55">{sayi}</span>
                </button>
              );
            })}
          </div>

          <div className="ml-auto font-mono text-[11.5px] text-[#8B97AA]">
            {listelenen.length === ogrenciler.length
              ? `${ogrenciler.length} kayıt`
              : `${listelenen.length} / ${ogrenciler.length} kayıt`}
          </div>
        </div>

        {/*
          Toplu atama çubuğu yalnızca seçim varken.

          Bu ekranın en sık işi bir eğitimi birden çok kişiye atamak (kurumsal
          satış, aynı gruba açılan program). Tek tek detay açıp atamak yirmi
          kişide yirmi kez aynı üç tıklama demekti.
        */}
        {isaretli.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 border-b border-[#DFE6FB] bg-[#EFF3FE] px-4 py-[11px] sm:px-[16px]">
            <span className="text-[13px] font-semibold text-[#1C3A8F]">{isaretli.length} kişi seçildi</span>
            <select
              aria-label="Toplu atanacak eğitim"
              value={topluKurs}
              onChange={(e) => setTopluKurs(e.target.value)}
              className="h-[34px] w-[230px] max-w-full rounded-[8px] border border-[#C9D5F5] bg-white px-[10px] text-[12.5px] text-ink outline-none focus:border-brand"
            >
              <option value="">Eğitim seç…</option>
              {kurslar.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.baslik}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!topluKurs || islemde}
              onClick={topluAta}
              className="h-[34px] rounded-[8px] bg-brand px-[14px] text-[12.5px] font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              Seçilenlere ata
            </button>
            <button
              type="button"
              onClick={() => setIsaretli([])}
              className="ml-auto h-[30px] px-[10px] text-[12.5px] font-semibold text-[#4C5F8E] underline"
            >
              Seçimi temizle
            </button>
          </div>
        )}

        {/* Başlık satırı yalnızca sütunların yan yana durduğu genişlikte. */}
        <div className="hidden grid-cols-[28px_2fr_1.6fr_1.1fr_120px_84px] items-center gap-4 border-b border-ink/8 bg-mist px-[16px] py-[10px] font-mono text-[9.5px] tracking-[0.12em] text-[#94A0B3] uppercase lg:grid">
          <span>
            <input
              type="checkbox"
              aria-label="Sayfadaki herkesi seç"
              checked={hepsiIsaretli}
              onChange={() => setIsaretli(hepsiIsaretli ? [] : sayfaIdleri)}
              className="h-[15px] w-[15px] accent-[#2F5FE0]"
            />
          </span>
          <span>Öğrenci</span>
          <span>Kayıtlı eğitim</span>
          <span>İlerleme</span>
          <span>Durum</span>
          <span className="text-right">İşlem</span>
        </div>

        {sayfadakiler.length === 0 ? (
          <div className="px-[22px] py-12 text-center text-sm text-[#8B97AA]">
            {ogrenciler.length === 0 ? "Henüz kayıtlı kullanıcı yok." : "Aramanla eşleşen öğrenci yok."}
          </div>
        ) : (
          sayfadakiler.map((o) => {
            const p = ilerleme.get(o.id) ?? { yuzde: 0, bitti: 0, toplam: 0 };
            const durum = durumu(o, p.yuzde);
            const acik = o.id === seciliId;
            const secim = isaretli.includes(o.id);

            return (
              <div
                key={o.id}
                className={`flex flex-col gap-3 border-b border-ink/7 px-4 py-[13px] transition last:border-b-0 sm:px-[16px] lg:grid lg:grid-cols-[28px_2fr_1.6fr_1.1fr_120px_84px] lg:items-center lg:gap-4 ${
                  acik ? "bg-[#F4F7FF]" : secim ? "bg-[#FAFBFF]" : "hover:bg-[#F8FAFD]"
                }`}
              >
                <div className="hidden lg:block">
                  <input
                    type="checkbox"
                    aria-label={`${o.isim} seç`}
                    checked={secim}
                    onChange={() => isaretle(o.id)}
                    className="h-[15px] w-[15px] accent-[#2F5FE0]"
                  />
                </div>

                <div className="flex min-w-0 items-center gap-[11px]">
                  <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[10px] bg-[#EEF1F6] font-mono text-[11.5px] font-semibold text-[#3D4759]">
                    {basHarfler(o.isim)}
                  </span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-[13.5px] font-semibold">{o.isim}</span>
                      {o.admin && (
                        <span className="flex-none rounded-full bg-ink px-[7px] py-[2px] font-mono text-[9px] tracking-[0.08em] text-white uppercase">
                          admin
                        </span>
                      )}
                    </span>
                    <span className="block truncate font-mono text-[10.5px] text-[#8B97AA]">
                      {o.eposta}
                      {o.telefon && <span className="ml-2 text-[#A6B0C0]">· {o.telefon}</span>}
                    </span>
                  </span>
                </div>

                {/*
                  Eğitimler virgülle ayrılmış bir metin değil ayrı etiketler:
                  iki eğitimi olan bir kişide "Birebir Meta Ads Eğitimi, Birebir
                  Sosyal Medya Uzmanlığı Eğitimi" tek satıra sığmıyor ve nerede
                  bittiği okunmuyordu.
                */}
                <div className="flex min-w-0 flex-wrap gap-[6px]">
                  {o.kayitlar.length === 0 ? (
                    <span className="rounded-[6px] border border-[#F7E2CD] bg-[#FFF5EC] px-[8px] py-[4px] text-[11.5px] text-[#94571C]">
                      Eğitim atanmadı
                    </span>
                  ) : (
                    o.kayitlar.map((r) => (
                      <span
                        key={r.courseId}
                        className="max-w-full truncate rounded-[6px] border border-ink/9 bg-[#F1F3F7] px-[8px] py-[4px] text-[11.5px] text-[#414C5E]"
                      >
                        {r.baslik}
                      </span>
                    ))
                  )}
                </div>

                <div className="max-w-[220px] lg:max-w-none">
                  <div className="h-[5px] overflow-hidden rounded-full bg-ink/8">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${p.yuzde}%` }} />
                  </div>
                  <div className="mt-[6px] font-mono text-[10.5px] text-[#8B97AA]">
                    {o.kayitlar.length ? `${p.yuzde}% · ${p.bitti}/${p.toplam} ders` : "ders yok"}
                  </div>
                </div>

                <div>
                  <span
                    className="inline-flex items-center gap-[6px] rounded-full px-[9px] py-[4px] text-[11.5px] font-semibold"
                    style={{ background: durum.bg, color: durum.fg }}
                    title={o.sinyal.supheli ? o.sinyal.gerekce : undefined}
                  >
                    <span className="h-[5px] w-[5px] rounded-full" style={{ background: durum.fg }} />
                    {durum.etiket}
                  </span>
                </div>

                <div className="flex lg:justify-end">
                  <button
                    type="button"
                    onClick={() => setSeciliId(acik ? null : o.id)}
                    className="h-[30px] rounded-[8px] border border-ink/13 bg-white px-3 text-[12px] font-semibold text-ink transition hover:border-ink hover:bg-ink hover:text-white"
                  >
                    Detay
                  </button>
                </div>
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

      {/*
        Detay artık satırın altında değil, sağdan açılan bir panelde.

        Satır arasında açıldığında listeyi ortasından ikiye bölüyor, altındaki
        satırlar ekranın dışına itiliyordu; uzun bir detayda (oturumlar, kayıt
        arşivi, onaylar, giriş hareketleri) hangi listeye bakıldığı kayboluyor
        ve kapatınca sayfa bambaşka bir yere zıplıyordu. Panel listeyi yerinde
        bırakıyor: kapat, sıradaki kişiye geç.
      */}
      {secili && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <button
            type="button"
            aria-label="Detayı kapat"
            onClick={() => setSeciliId(null)}
            className="absolute inset-0 bg-ink/25"
          />
          <section className="relative flex h-full w-full flex-col overflow-hidden border-l border-ink/10 bg-white shadow-[-24px_0_60px_rgba(16,21,31,0.14)] sm:w-[640px]">
            <div className="flex flex-none items-start gap-[13px] border-b border-ink/8 px-5 py-4">
              <span className="flex h-[44px] w-[44px] flex-none items-center justify-center rounded-[13px] bg-ink font-mono text-[14px] font-semibold text-white">
                {basHarfler(secili.isim)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-[9px]">
                  <span className="truncate font-heading text-[17px] font-semibold tracking-[-0.01em]">
                    {secili.isim}
                  </span>
                  {(() => {
                    const p = ilerleme.get(secili.id) ?? { yuzde: 0 };
                    const d = durumu(secili, p.yuzde);
                    return (
                      <span
                        className="rounded-full px-[8px] py-[3px] text-[11px] font-semibold"
                        style={{ background: d.bg, color: d.fg }}
                      >
                        {d.etiket}
                      </span>
                    );
                  })()}
                </div>
                <div className="mt-[5px] truncate font-mono text-[11.5px] text-[#8B97AA]">
                  {secili.eposta}
                  {secili.telefon ? ` · ${secili.telefon}` : ""} · Kayıt{" "}
                  {tarihBicimi.format(new Date(secili.kayitTarihi))}
                  {secili.oturumlar[0] &&
                    ` · Son giriş ${anBicimi.format(new Date(secili.oturumlar[0].tarih))}`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSeciliId(null)}
                aria-label="Kapat"
                className="flex h-8 w-8 flex-none items-center justify-center rounded-[8px] border border-ink/11 bg-white text-[#5B6577] transition hover:border-ink hover:text-ink"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto">
              <OgrenciDetay ogrenci={secili} kurslar={kurslar} />
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function Sayac({
  etiket,
  deger,
  not,
  vurgu = false,
  tikla,
}: {
  etiket: string;
  deger: number;
  not: string;
  /** Sıfırdan büyük ve işlem bekleyen sayaç: rakam markanın rengiyle. */
  vurgu?: boolean;
  tikla?: () => void;
}) {
  const icerik = (
    <>
      <div className="font-mono text-[9.5px] tracking-[0.14em] text-[#94A0B3] uppercase">{etiket}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <span
          className={`font-heading text-[24px] font-semibold tracking-[-0.02em] ${vurgu ? "text-brand" : "text-ink"}`}
        >
          {deger}
        </span>
        <span className="font-mono text-[11px] text-[#7B8798]">{not}</span>
      </div>
    </>
  );

  if (!tikla) {
    return <div className="rounded-[13px] border border-ink/10 bg-white px-4 py-[14px]">{icerik}</div>;
  }
  return (
    <button
      type="button"
      onClick={tikla}
      className="rounded-[13px] border border-ink/10 bg-white px-4 py-[14px] text-left transition hover:border-brand/45 hover:shadow-[0_4px_14px_rgba(16,21,31,0.06)]"
    >
      {icerik}
    </button>
  );
}
