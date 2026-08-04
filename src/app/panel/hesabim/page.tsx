import { redirect } from "next/navigation";
import { getPanelCourses, getPanelProfile } from "@/lib/panel";
import { HesapFormu } from "@/components/panel/HesapFormu";
import { HesapSilme } from "@/components/panel/HesapSilme";
import { createClient } from "@/lib/supabase/server";
import { getOturumlar } from "@/lib/oturum";
import { TR_ZAMAN } from "@/lib/zaman";
import { GirisHareketleri } from "@/components/panel/GirisHareketleri";

const tarihBicimi = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TR_ZAMAN,
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function HesabimPage() {
  const supabase = await createClient();
  const [profil, courses] = await Promise.all([getPanelProfile(), getPanelCourses()]);
  if (!profil) redirect("/giris");

  // RLS bu listeyi kullanıcının kendi kayıtlarıyla sınırlar.
  const oturumlar = await getOturumlar(supabase, { limit: 20 });

  const { data: silmeSatiri } = await supabase
    .from("profiles")
    .select("silme_talebi_tarihi")
    .eq("id", profil.id)
    .maybeSingle();

  return (
    <main className="p-4 pb-14 sm:p-[34px]">
      <h1 className="font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[32px]">Hesabım</h1>

      <div className="mt-6 overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <div className="border-b border-ink/8 px-[26px] py-[18px]">
          <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Profil</h2>
        </div>
        <HesapFormu profil={profil} />
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <div className="border-b border-ink/8 px-[26px] py-[18px]">
          <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Eğitim kayıtlarım</h2>
        </div>
        {courses.length === 0 ? (
          <div className="px-[26px] py-8 text-[14.5px] text-[#656B7A]">Henüz bir eğitim kaydın bulunmuyor.</div>
        ) : (
          courses.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-4 border-b border-ink/7 px-[26px] py-[18px] last:border-b-0">
              <div className="min-w-0 flex-1">
                <div className="text-[15.5px] font-semibold">{c.baslik}</div>
                <div className="mt-1 font-mono text-[10.5px] text-[#656B7A]">
                  {tarihBicimi.format(new Date(c.atanmaTarihi))} · {c.dersSayisi} ders
                </div>
              </div>
              <span className="rounded-full bg-brand/12 px-[10px] py-1 font-mono text-[9.5px] tracking-[0.1em] text-brand uppercase">
                %{c.yuzde} tamamlandı
              </span>
            </div>
          ))
        )}
      </div>

      <GirisHareketleri oturumlar={oturumlar} />

      <HesapSilme talepTarihi={silmeSatiri?.silme_talebi_tarihi ?? null} />
    </main>
  );
}
