import Link from "next/link";
import { Icon } from "@/components/Icon";
import { initials } from "@/lib/admin/shared";
import { para } from "@/lib/admin/format";

/**
 * Yönetim panelinin genel bakışı — "Admin Genel Bakış" tasarımı (masaüstü +
 * mobil). Veriler sayfada (kontrol-9f4x2k/(protected)/page.tsx) hesaplanıyor;
 * buradaki parçalar yalnızca çiziyor. Öğrenci genel bakışıyla aynı dil:
 * mavi–siyah ızgaralı bant, beyaz kartlar, ikonlu satırlar.
 */

const MONO = "font-mono text-[10px] tracking-[0.16em] uppercase";
const KART = "rounded-[18px] border border-[#E6E8EF] bg-white";

/* --------------------------------------------------------------- başlık */

export function YonetimBasligi({ tarih, kisaTarih }: { tarih: string; kisaTarih: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex min-w-0 flex-col gap-[3px] px-1 sm:px-0">
        <div className={`${MONO} tracking-[0.14em] text-[#8A92A6]`}>
          <span className="sm:hidden">Yönetim · {kisaTarih}</span>
          <span className="hidden sm:inline">Yönetim · {tarih}</span>
        </div>
        <h1 className="font-heading text-[24px] leading-[1.15] font-bold tracking-[-0.02em] text-ink sm:text-[26px]">
          Akademi durumu
        </h1>
      </div>
      <div className="ml-auto hidden flex-none gap-2.5 sm:flex">
        <Link
          href="/kontrol-9f4x2k/ogrenciler/ice-aktar"
          className="rounded-[10px] border border-[#E1E4EC] bg-white px-4 py-[11px] text-[13px] font-semibold text-ink transition hover:border-brand hover:text-brand"
        >
          Öğrenci ekle
        </Link>
        <Link
          href="/kontrol-9f4x2k/egitimler/yeni"
          className="rounded-[10px] bg-ink px-[18px] py-[11px] text-[13px] font-semibold text-white transition hover:bg-[#1E2740]"
        >
          + Yeni eğitim
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ KPI bandı */

export type BekleyenOdemeOzeti = { adet: number; isim: string; tutar: number; yontem: string | null };

export function DurumBandi({
  toplamGelir,
  odemeAdedi,
  buAy,
  ogrenci,
  buAyKatilan,
  tamamlanma,
  acikTalep,
  toplamTalep,
  bekleyen,
}: {
  toplamGelir: number;
  odemeAdedi: number;
  buAy: { ay: string; tutar: number };
  ogrenci: number;
  buAyKatilan: number;
  tamamlanma: number;
  acikTalep: number;
  toplamTalep: number;
  bekleyen: BekleyenOdemeOzeti | null;
}) {
  const kucukKpi = [
    { etiket: "Öğrenci", deger: String(ogrenci), alt: buAyKatilan ? `Bu ay ${buAyKatilan} kişi katıldı` : "Bu ay katılan yok", kisa: `Bu ay ${buAyKatilan}` },
    { etiket: "Tamamlama oranı", kisaEtiket: "Tamamlama", deger: `%${tamamlanma}`, alt: "Ortalama ders bitirme", kisa: "Ders bitirme" },
    { etiket: "Açık talep", deger: String(acikTalep), alt: `${toplamTalep} toplam talep`, kisa: `${toplamTalep} toplam` },
  ];

  return (
    <section
      aria-label="Akademi özeti"
      className="relative flex flex-col gap-5 overflow-hidden rounded-[20px] p-[18px] text-white sm:gap-[22px] sm:px-7 sm:py-[26px]"
      style={{ background: "linear-gradient(135deg,#1A3FCC 0%,#0F1E5C 39%,#070B16 100%)" }}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: "linear-gradient(120deg,#000 10%,transparent 85%)",
          WebkitMaskImage: "linear-gradient(120deg,#000 10%,transparent 85%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-30 h-[420px] w-[420px] rounded-full"
        style={{ background: "radial-gradient(circle,rgba(91,134,255,.45),transparent 65%)" }}
      />

      <div className="relative grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr_1fr_1fr] lg:gap-0">
        <div className="flex flex-col gap-2 border-b border-white/12 pb-5 lg:border-b-0 lg:pr-6 lg:pb-0">
          <div className={`${MONO} text-[#AFC2FF]`}>Toplam gelir</div>
          <div className="text-[40px] leading-none font-extrabold tracking-[-0.03em] sm:text-[44px]">{para(toplamGelir)}</div>
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#C9D0E0]">
            <span className="rounded-full bg-[rgba(61,220,151,.12)] px-2 py-[3px] font-mono text-[11px] text-[#3DDC97]">
              {buAy.ay} {para(buAy.tutar)}
            </span>
            {odemeAdedi} ödeme
          </div>
        </div>

        {/* Telefonda üç küçük kutu yan yana; geniş ekranda ayraçlı sütunlar. */}
        <div className="grid grid-cols-3 lg:contents">
          {kucukKpi.map((k, i) => (
            <div key={k.etiket} className={`flex flex-col gap-1.5 px-3 first:pl-0 lg:gap-2 lg:border-l lg:border-white/12 lg:px-6 lg:first:pl-6 lg:last:pr-0 ${
                i > 0 ? "border-l border-white/12" : ""
              }`}>
              <div className={`${MONO} truncate text-[9px] text-[#AFC2FF] lg:text-[10px]`}>
                <span className="lg:hidden">{k.kisaEtiket ?? k.etiket}</span>
                <span className="hidden lg:inline">{k.etiket}</span>
              </div>
              <div className="text-[24px] leading-[1.1] font-extrabold tracking-[-0.03em] lg:text-[34px]">{k.deger}</div>
              <div className="truncate text-[12px] text-[#C9D0E0] lg:text-[13px]">
                <span className="lg:hidden">{k.kisa}</span>
                <span className="hidden lg:inline">{k.alt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {bekleyen && (
        <div className="relative flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[12px] border border-white/12 bg-[#070B16]/50 px-3.5 py-3">
          <span className="h-2 w-2 flex-none rounded-full bg-[#FFB547] shadow-[0_0_0_4px_rgba(255,181,71,.18)]" />
          <span className="min-w-0 flex-1 sm:flex-none">
            <span className="block text-[14px] font-semibold sm:inline">{bekleyen.adet} ödeme onay bekliyor</span>
            <span className="block text-[12.5px] text-[#9AA4BE] sm:ml-3 sm:inline sm:text-[13px]">
              {bekleyen.adet === 1 ? `${bekleyen.isim} · ` : `İlki: ${bekleyen.isim} · `}
              {para(bekleyen.tutar)}
              {bekleyen.yontem ? ` · ${bekleyen.yontem}` : ""}
            </span>
          </span>
          {/* Onay ödemeler ekranında yapılıyor (iade/kısmi gibi seçenekler
              orada); düğme o ekrana "Onay bekliyor" süzgeciyle açıyor. */}
          <Link
            href="/kontrol-9f4x2k/odemeler?durum=bekliyor"
            className="ml-auto flex-none rounded-[10px] bg-white px-3.5 py-2.5 text-[13px] font-bold text-[#1A44CC] transition hover:bg-[#EEF2FF] sm:rounded-[9px] sm:py-2 sm:text-[12px]"
          >
            Onayla →
          </Link>
        </div>
      )}
    </section>
  );
}

/* --------------------------------------------------- aksiyon bekleyenler */

export type Aksiyon = {
  baslik: string;
  alt: string;
  href: string;
  ikon: "card" | "users" | "calendar" | "message" | "mail";
  /** oklch tonu: ikon kutusunun rengi. */
  ton: number;
};

function IkonKutusu({ ikon, ton }: { ikon: Aksiyon["ikon"]; ton: number }) {
  return (
    <span className="relative h-[46px] w-[46px] flex-none">
      <span
        className="absolute top-[7px] left-[7px] h-[39px] w-[39px] rotate-[10deg] rounded-[12px] opacity-40"
        style={{ background: `oklch(0.66 0.17 ${ton})` }}
      />
      <span
        className="absolute inset-[0_7px_7px_0] flex items-center justify-center rounded-[12px] border"
        style={{
          background: "linear-gradient(150deg,rgba(255,255,255,.95),rgba(255,255,255,.6))",
          borderColor: `oklch(0.89 0.06 ${ton})`,
          boxShadow: `0 8px 16px -8px oklch(0.57 0.17 ${ton})`,
          color: `oklch(0.52 0.16 ${ton})`,
        }}
      >
        <Icon name={ikon} size={16} />
      </span>
    </span>
  );
}

export function AksiyonBekleyenler({ liste }: { liste: Aksiyon[] }) {
  return (
    <div className={`${KART} flex h-full flex-col gap-2.5 p-[18px] sm:p-5`}>
      <div className="flex items-center gap-2">
        <h2 className="text-[16px] font-bold text-ink">Aksiyon bekleyenler</h2>
        <span
          className={`rounded-full px-2 py-[3px] font-mono text-[10px] uppercase ${
            liste.length ? "bg-[#FFF4D6] text-[#9A6A00]" : "bg-[#EEF0F5] text-[#8A92A6]"
          }`}
        >
          {liste.length} iş
        </span>
      </div>

      {liste.length === 0 ? (
        <div className="flex flex-1 items-center gap-3.5 rounded-[12px] border border-dashed border-[#D5DAE5] bg-[#FAFBFD] p-4">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[11px] border border-[#E6E8EF] bg-white text-[#8A92A6]">
            <Icon name="check" size={18} />
          </span>
          <span className="flex flex-col gap-1">
            <span className="text-[15px] font-semibold text-ink">Bekleyen bir iş yok</span>
            <span className="text-[13px] text-[#5B6478]">Ödeme, talep ya da mesaj gelince burada görünecek.</span>
          </span>
        </div>
      ) : (
        <ul className="-mx-1.5 flex flex-col divide-y divide-[#F1F3F7] sm:divide-y-0">
          {liste.map((a) => (
            <li key={a.baslik}>
              <Link href={a.href} className="flex items-center gap-3.5 rounded-[14px] px-1.5 py-3 transition hover:bg-[#F6F7FB] sm:p-3">
                <IkonKutusu ikon={a.ikon} ton={a.ton} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[14px] font-bold text-ink">{a.baslik}</span>
                  <span className="truncate text-[12px] text-[#5B6478]">{a.alt}</span>
                </span>
                <span className="flex-none font-bold text-brand">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ son işlemler */

export type Islem = {
  id: string;
  isim: string;
  tarih: string;
  yontem: string | null;
  durum: "odendi" | "bekliyor" | "iade";
  tutar: number;
};

const DURUM: Record<Islem["durum"], { etiket: string; renk: string; zemin: string }> = {
  odendi: { etiket: "Ödendi", renk: "#12825A", zemin: "#E3F6EE" },
  bekliyor: { etiket: "Bekliyor", renk: "#9A6A00", zemin: "#FFF4D6" },
  iade: { etiket: "İade", renk: "#5B6478", zemin: "#EEF0F5" },
};

const AVATAR = [
  { zemin: "#EEF2FF", renk: "#2459FF" },
  { zemin: "#F3EEFF", renk: "#6B3FE0" },
  { zemin: "#E6F7F2", renk: "#0F8A6A" },
  { zemin: "#FFF1E6", renk: "#B85A12" },
];

/** İsimden sabit renk: aynı kişi her girişte aynı renkte. */
function avatarRengi(isim: string) {
  let h = 0;
  for (const c of isim) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR[h % AVATAR.length];
}

function DurumRozeti({ durum }: { durum: Islem["durum"] }) {
  const d = DURUM[durum];
  return (
    <span
      className="justify-self-start rounded-full px-2 py-1 font-mono text-[10px] tracking-[0.08em] uppercase"
      style={{ color: d.renk, background: d.zemin }}
    >
      {d.etiket}
    </span>
  );
}

export function SonIslemler({ liste }: { liste: Islem[] }) {
  const izgara = "grid grid-cols-[minmax(0,1fr)_140px_110px_110px] gap-3";
  return (
    <div className={`${KART} flex h-full flex-col overflow-hidden`}>
      <div className="flex items-center px-[18px] pt-4 pb-2.5 sm:px-[22px] sm:pt-3.5">
        <h2 className="text-[16px] font-bold text-ink">Son işlemler</h2>
        <Link href="/kontrol-9f4x2k/odemeler" className="ml-auto text-[13px] font-semibold text-brand hover:text-ink">
          Tümü →
        </Link>
      </div>

      {liste.length === 0 ? (
        <p className="px-[22px] py-8 text-center text-[13.5px] text-[#5B6478]">Henüz ödeme kaydı yok.</p>
      ) : (
        <>
          <div className={`${izgara} hidden border-b border-[#EEF0F5] px-[22px] py-2 font-mono text-[10px] tracking-[0.12em] text-[#8A92A6] uppercase md:grid`}>
            <div>Öğrenci</div>
            <div>Yöntem</div>
            <div>Durum</div>
            <div className="text-right">Tutar</div>
          </div>
          <ul className="flex flex-col">
            {liste.map((i) => {
              const r = avatarRengi(i.isim);
              const kisi = (
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-[12px] font-bold"
                    style={{ background: r.zemin, color: r.renk }}
                  >
                    {initials(i.isim)}
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-[14px] font-semibold text-ink">{i.isim}</span>
                    <span className="truncate font-mono text-[11px] text-[#8A92A6]">
                      {i.tarih}
                      <span className="md:hidden">{i.yontem ? ` · ${i.yontem}` : ""}</span>
                    </span>
                  </span>
                </div>
              );
              return (
                <li key={i.id} className="border-b border-[#F1F3F7] last:border-b-0">
                  {/* Masaüstü: tablo satırı. */}
                  <div className={`${izgara} hidden items-center px-[22px] py-3.5 hover:bg-[#F8F9FC] md:grid`}>
                    {kisi}
                    <div className="truncate text-[13px] text-[#5B6478]">{i.yontem || "—"}</div>
                    <DurumRozeti durum={i.durum} />
                    <div className="text-right text-[15px] font-bold text-ink">{para(i.tutar)}</div>
                  </div>
                  {/* Telefon: kişi solda, tutar ve durum sağda. */}
                  <div className="flex items-center gap-3 px-[18px] py-3 md:hidden">
                    <div className="min-w-0 flex-1">{kisi}</div>
                    <div className="flex flex-none flex-col items-end gap-1">
                      <span className="text-[15px] font-bold text-ink">{para(i.tutar)}</span>
                      <DurumRozeti durum={i.durum} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

/* ----------------------------------------------------- program performansı */

export type ProgramSatiri = { id: string; ad: string; kisaAd: string; kayit: number; pay: number; dersSayisi: number; tamamlanma: number };

export function ProgramPerformansi({ liste }: { liste: ProgramSatiri[] }) {
  return (
    <div className={`${KART} flex h-full flex-col gap-[18px] p-[18px] sm:p-[22px]`}>
      <div className="flex items-center">
        <h2 className="text-[16px] font-bold text-ink">Program performansı</h2>
        <span className="ml-auto hidden font-mono text-[10px] tracking-[0.12em] text-[#8A92A6] uppercase sm:inline">Kayıt payı</span>
      </div>
      {liste.length === 0 ? (
        <p className="text-[13.5px] text-[#5B6478]">Yayında eğitim yok.</p>
      ) : (
        <ul className="flex flex-col gap-[18px]">
          {liste.map((p) => (
            <li key={p.id} className="flex flex-col gap-2">
              <div className="flex items-baseline gap-2">
                <span className="min-w-0 truncate text-[14px] font-semibold text-ink">
                  <span className="sm:hidden">{p.kisaAd}</span>
                  <span className="hidden sm:inline">{p.ad}</span>
                </span>
                <span className="ml-auto text-[14px] font-bold text-ink">{p.kayit}</span>
                <span className="font-mono text-[11px] text-[#8A92A6]">kayıt</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#EEF0F5]">
                <div className="h-full rounded-full bg-[linear-gradient(90deg,#2459FF,#5B86FF)]" style={{ width: `${p.pay}%` }} />
              </div>
              <div className="font-mono text-[11px] text-[#8A92A6]">
                {p.dersSayisi} ders · tamamlanma %{p.tamamlanma}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
