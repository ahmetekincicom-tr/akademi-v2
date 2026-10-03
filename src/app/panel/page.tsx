import Link from "next/link";
import { getPanelCourses, getPanelProfile } from "@/lib/panel";
import { PushKayit } from "@/components/panel/PushKayit";
import {
  AktifProgram,
  Bildirimler,
  Karsilama,
  Kisayollar,
  KurulumBandi,
  ProgramYok,
  YaklasanDers,
} from "@/components/panel/GenelBakis";
import { getBaslangic } from "@/lib/baslangic";
import { getBildirimler } from "@/lib/bildirimler";
import { getEgitimOturumlarim } from "@/lib/egitim-oturumu";
import { seansAyir } from "@/lib/seans";
import { gunSelami } from "@/lib/selam";
import { TR_ZAMAN } from "@/lib/zaman";

const TARIH_PARCA = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TR_ZAMAN,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * "CUMARTESİ · 3 EKİM 2026". Parça parça kuruluyor: tarayıcılar ve Node
 * tr-TR'de gün adını farklı yere koyuyor ("3 Ekim 2026 Cumartesi" ↔
 * "Cumartesi 3 Ekim 2026"); metni bölmek bir ortamda "3 · EKİM 2026
 * CUMARTESİ" çıkarıyordu.
 */
function ustSatir(an: Date, yilli: boolean): string {
  const p = Object.fromEntries(TARIH_PARCA.formatToParts(an).map((x) => [x.type, x.value]));
  return `${p.weekday} · ${p.day} ${p.month}${yilli ? ` ${p.year}` : ""}`.toLocaleUpperCase("tr");
}

/*
  Genel bakış — "Genel Bakış Final" tasarımı. Parçalar ve gerekçeleri
  components/panel/GenelBakis.tsx içinde.

  Sıra masaüstünde: karşılama → kurulum bandı → [aktif program | yaklaşan
  ders] → [kısayollar | bildirimler]. Mobilde yaklaşan ders programın
  ÜSTÜNDE: telefonda panele girmenin en sık sebebi derse katılmak.
*/
export default async function PanelOverviewPage() {
  const [profil, courses, baslangic, bildirim, oturumlar] = await Promise.all([
    getPanelProfile(),
    getPanelCourses(),
    getBaslangic(),
    getBildirimler(),
    getEgitimOturumlarim(),
  ]);

  const simdi = new Date();
  const ad = profil?.ad?.trim();
  const devam = courses.length > 0
    ? "kaldığın yerden devam et."
    : baslangic.tamamlandi
      ? "panelin hazır."
      : "kurulumuna birkaç adım kaldı.";
  const baslik = `${gunSelami(simdi)}${ad ? ` ${ad}` : ""}, ${devam}`;

  const aktifKurs = courses.find((c) => c.yuzde < 100) ?? courses[0];
  const { yaklasan } = seansAyir(oturumlar);

  return (
    <main className="flex flex-col gap-4 p-4 pb-14 sm:gap-5 sm:px-[34px] sm:pt-7 sm:pb-9">
      <PushKayit />

      <Karsilama tarih={ustSatir(simdi, true)} kisaTarih={ustSatir(simdi, false)} baslik={baslik} />

      {/* Kurulum bitince (ya da eğitim ilişkisi yoksa) bant çekiliyor. */}
      {!baslangic.tamamlandi && <KurulumBandi adimlar={baslangic.adimlar} />}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] xl:gap-[18px]">
        <div className="order-2 xl:order-1">
          {aktifKurs ? (
            <AktifProgram
              kurs={aktifKurs}
              digerleri={courses.filter((c) => c.id !== aktifKurs.id)}
              odemeBekliyor={bildirim.odemeBekliyor}
            />
          ) : (
            <ProgramYok />
          )}
        </div>
        <div className="order-1 xl:order-2">
          <YaklasanDers oturum={yaklasan[0] ?? null} kurulumBitti={baslangic.tamamlandi} />
        </div>
        <div className="order-3">
          <Kisayollar />
        </div>
        <div className="order-4">
          <Bildirimler bildirim={bildirim} />
        </div>
      </div>

      {/* Mobilde üstteki "Destek talebi" düğmesi yok; yerine sayfanın sonunda. */}
      <Link
        href="/panel/soru-cevap"
        className="flex h-[50px] items-center justify-center rounded-[14px] bg-ink text-[15px] font-semibold text-white transition active:bg-[#1E2740] sm:hidden"
      >
        Destek talebi oluştur
      </Link>
    </main>
  );
}
