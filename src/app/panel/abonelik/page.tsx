import { redirect } from "next/navigation";
import { getPanelProfile } from "@/lib/panel";
import { createClient } from "@/lib/supabase/server";
import { abonelikAyari, abonelikDurumum, planKodu } from "@/lib/abonelik";
import { abonelikGorunurMu } from "@/lib/abonelik-hesap";
import { UygulamadaYok } from "@/components/panel/SadeceWeb";
import { AbonelikPaneli, type AbonelikPaneliDurumu } from "@/components/panel/AbonelikPaneli";
import { TR_ZAMAN } from "@/lib/zaman";

const tarihBicimi = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TR_ZAMAN,
  day: "numeric",
  month: "long",
  year: "numeric",
});

const paraBicimi = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 2,
});

/** Form dönüşünde adrese eklenen sonuç; metin kişiye ne olduğunu ve ne yapacağını söylüyor. */
const SONUC_METNI: Record<string, { baslik: string; metin: string; iyi: boolean }> = {
  basarili: {
    baslik: "Aboneliğin başladı",
    metin: "İlk aylık ödemen alındı; derslerin açıldı. Makbuz e-postana gönderildi.",
    iyi: true,
  },
  basarisiz: {
    baslik: "Abonelik başlatılamadı",
    metin: "Kartından ödeme alınmadı. Farklı bir kartla yeniden deneyebilirsin.",
    iyi: false,
  },
  belirsiz: {
    baslik: "Sonucu henüz doğrulayamadık",
    metin: "Kartından ödeme alınmış olabilir; birkaç dakika içinde burada görünür. Tekrar denemeden önce bize yaz.",
    iyi: false,
  },
  kart: {
    baslik: "Kartın güncellendi",
    metin: "Sonraki aylık ödemeler yeni kartından çekilecek.",
    iyi: true,
  },
  "kart-odendi": {
    baslik: "Kartın güncellendi, ödemen alındı",
    metin: "Bekleyen aylık ödeme yeni kartından çekildi; derslerin açık.",
    iyi: true,
  },
  hata: {
    baslik: "Bir sorun çıktı",
    metin: "İşlem tamamlanamadı. Sorun sürerse bize yaz.",
    iyi: false,
  },
};

function tarih(deger: string | null): string | null {
  return deger ? tarihBicimi.format(new Date(deger)) : null;
}

export default async function AbonelikPage({ searchParams }: { searchParams: Promise<{ sonuc?: string }> }) {
  const profil = await getPanelProfile();
  if (!profil) redirect("/giris");

  const ayar = await abonelikAyari();
  if (!abonelikGorunurMu(ayar, profil.admin)) redirect("/panel");

  const supabase = await createClient();
  const [abonelik, { count }, { sonuc }] = await Promise.all([
    abonelikDurumum(supabase, profil.id),
    supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profil.id)
      .neq("durum", "iptal"),
    searchParams,
  ]);

  const durum: AbonelikPaneliDurumu =
    abonelik && abonelik.durum !== "bekliyor" && abonelik.durum !== "basarisiz"
      ? {
          durum: abonelik.durum,
          kaynak: abonelik.kaynak,
          erisimAcik: abonelik.erisimAcik,
          erisimBitis: tarih(abonelik.erisimBitis),
          donemBitis: tarih(abonelik.donemBitis),
          tutar: abonelik.tutar != null ? paraBicimi.format(abonelik.tutar) : null,
          surduruluyor: abonelik.surduruluyor,
          sonHata: abonelik.sonHata,
        }
      : null;

  // Plan kodu yoksa "Abone ol" hiç basılmıyor: iyzico formu açılamayacak bir
  // düğme, çalışmayan bir üründen ayırt edilemez.
  const fiyat = planKodu(ayar) && ayar.fiyat > 0 ? paraBicimi.format(ayar.fiyat) : null;
  const sonucKutusu = sonuc ? SONUC_METNI[sonuc] : undefined;

  return (
    <UygulamadaYok>
      <main className="mx-auto flex w-full max-w-[760px] flex-col gap-4 p-4 pb-14 sm:gap-5 sm:px-[34px] sm:pt-7 sm:pb-9">
        <div>
          <h1 className="font-heading text-[24px] font-semibold tracking-[-0.03em] sm:text-[28px]">Video aboneliği</h1>
          <p className="mt-1.5 text-[14.5px] leading-[1.6] text-[#5C6273]">
            Kayıtlı olduğun eğitimlerin ders videoları aylık abonelikle açılır.
          </p>
        </div>

        {sonucKutusu && (
          <div
            role="status"
            className={`rounded-[12px] border px-4 py-3 text-[13.5px] ${
              sonucKutusu.iyi
                ? "border-[#12825A]/25 bg-[#E3F6EE] text-[#0B5C3F]"
                : "border-[#E5484D]/30 bg-[#FDF0F0] text-[#8E2226]"
            }`}
          >
            <strong className="font-semibold">{sonucKutusu.baslik}.</strong> {sonucKutusu.metin}
          </div>
        )}

        <AbonelikPaneli abonelik={durum} fiyat={fiyat} kayitli={(count ?? 0) > 0} testModu={ayar.testModu} />
      </main>
    </UygulamadaYok>
  );
}
