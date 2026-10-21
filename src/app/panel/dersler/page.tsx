import Link from "next/link";
import { redirect } from "next/navigation";
import { getPanelCourses, getPanelProfile } from "@/lib/panel";
import { DERSLER_ACIK } from "@/lib/bolumler";
import { abonelikDurumum, derslerGorunurMu } from "@/lib/abonelik";
import { createClient } from "@/lib/supabase/server";
import { nativeIstekMi } from "@/lib/native-sunucu";
import { DersPlayer } from "@/components/panel/DersPlayer";
import { Icon } from "@/components/Icon";

export default async function DersIzlemePage({
  searchParams,
}: {
  searchParams: Promise<{ kurs?: string; ders?: string }>;
}) {
  /*
    Bölüm kapalıyken adres elle yazılarak da açılmasın. Menüden kaldırmak
    yetmiyor: eski sekmeler, yer imleri ve maillerdeki bağlantılar hâlâ
    buraya geliyor ve içi boş bir oynatıcı açılıyordu.
  */
  const profil = await getPanelProfile();
  if (!profil) redirect("/giris");
  if (!DERSLER_ACIK && !(await derslerGorunurMu(profil.admin))) redirect("/panel");

  const { kurs, ders } = await searchParams;
  const supabase = await createClient();
  const [courses, abonelik, native] = await Promise.all([
    getPanelCourses(),
    abonelikDurumum(supabase, profil.id),
    nativeIstekMi(),
  ]);

  if (courses.length === 0) {
    return (
      <main className="p-4 pb-14 sm:p-[34px]">
        <div className="rounded-2xl border border-ink/10 bg-white px-8 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[13px] bg-mist text-[#656B7A]">
            <Icon name="playCircle" size={22} />
          </div>
          <h1 className="mt-4 font-heading text-xl font-semibold tracking-[-0.02em]">Görüntülenecek ders yok</h1>
          <p className="mx-auto mt-[10px] max-w-[420px] text-[14.5px] leading-[1.6] text-[#5C6273]">
            Bir eğitime kaydolduğunda müfredat ve dersler burada listelenir.
          </p>
          <Link
            href="/panel/yeni-egitimler"
            className="mt-6 inline-flex h-11 items-center rounded-[10px] bg-brand px-5 text-sm font-semibold text-white hover:bg-ink"
          >
            Eğitimleri incele
          </Link>
        </div>
      </main>
    );
  }

  const secilenKurs = courses.find((c) => c.slug === kurs) ?? courses.find((c) => c.yuzde < 100) ?? courses[0];
  const varsayilanDers = ders ?? secilenKurs.sonrakiDers?.id ?? secilenKurs.modules[0]?.dersler[0]?.id ?? null;

  /*
    Kilit: kayıtlı ama aboneliği olmayan (ya da süresi dolmuş) kişi.

    Uygulamada satın alma bağlantısı YOK: Apple 3.1.3 uygulama içinden
    dışarıdaki bir ödemeye yönlendirmeyi de yasaklıyor. Orada yalnızca durum
    söyleniyor; abonelik web'den başlatılıyor.
  */
  const erisim = profil.admin || Boolean(abonelik?.erisimAcik);
  const kilit = erisim
    ? null
    : {
        baslik: native
          ? "Bu ders henüz açık değil"
          : abonelik?.durum === "odeme_alinamadi"
            ? "Abonelik ödemen alınamadı"
            : "Bu ders video aboneliğine dahil",
        // Uygulamada aboneliğin varlığından ve fiyatından bile söz edilmiyor:
        // 3.1.3 "dışarıda satın al" diyen metni de yönlendirme sayıyor.
        aciklama: native
          ? "Bu dersin videosu hesabında henüz açık değil."
          : abonelik?.durum === "iptal" || abonelik?.durum === "sona_erdi"
            ? "Aboneliğinin süresi doldu. Yeniden abone olduğunda kayıtlı olduğun eğitimlerin bütün videoları açılır."
            : "Aylık video aboneliğiyle kayıtlı olduğun eğitimlerin bütün ders videolarını izleyebilirsin. Birebir seans kayıtların ücretsiz ve Birebir eğitim sayfasında.",
        eylem: native ? undefined : { href: "/panel/abonelik", etiket: "Aboneliği incele" },
      };

  return (
    <DersPlayer
      courses={courses}
      baslangicKursSlug={secilenKurs.slug}
      baslangicDersId={varsayilanDers}
      kilit={kilit}
    />
  );
}
