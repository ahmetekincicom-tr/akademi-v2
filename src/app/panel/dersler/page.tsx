import Link from "next/link";
import { getPanelCourses } from "@/lib/panel";
import { DersPlayer } from "@/components/panel/DersPlayer";
import { Icon } from "@/components/Icon";

export default async function DersIzlemePage({
  searchParams,
}: {
  searchParams: Promise<{ kurs?: string; ders?: string }>;
}) {
  const { kurs, ders } = await searchParams;
  const courses = await getPanelCourses();

  if (courses.length === 0) {
    return (
      <main className="p-4 pb-14 sm:p-[34px]">
        <div className="rounded-2xl border border-ink/10 bg-white px-8 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[13px] bg-mist text-[#9CA1AE]">
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

  return <DersPlayer courses={courses} baslangicKursSlug={secilenKurs.slug} baslangicDersId={varsayilanDers} />;
}
