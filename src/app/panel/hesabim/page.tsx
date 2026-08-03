import { redirect } from "next/navigation";
import { getPanelCourses, getPanelProfile } from "@/lib/panel";
import { HesapFormu } from "@/components/panel/HesapFormu";
import { HesapSilme } from "@/components/panel/HesapSilme";
import { createClient } from "@/lib/supabase/server";
import { getOturumlar, konumEtiketi, cihazEtiketi } from "@/lib/oturum";
import { Icon } from "@/components/Icon";

const tarihBicimi = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" });
const anBicimi = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
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

      <div className="mt-5 overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <div className="border-b border-ink/8 px-[26px] py-[18px]">
          <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Giriş hareketleri</h2>
          <p className="mt-1 text-[13.5px] leading-[1.6] text-[#5C6273]">
            Hesabına yapılan son girişler. Tanımadığın bir konum veya cihaz görürsen şifreni değiştir ve bize haber
            ver. Kayıtlar 90 gün saklanır, sonra silinir.
          </p>
        </div>

        {oturumlar.length === 0 ? (
          <div className="px-[26px] py-8 text-[14.5px] text-[#656B7A]">
            Henüz kayıtlı bir giriş yok. Bir sonraki girişinden itibaren burada listelenecek.
          </div>
        ) : (
          oturumlar.map((o, i) => (
            <div
              key={o.id}
              className="flex flex-wrap items-center gap-4 border-b border-ink/7 px-[26px] py-[15px] last:border-b-0"
            >
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-mist text-[#5C6273]">
                <Icon name="pin" size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] font-semibold">{konumEtiketi(o)}</div>
                <div className="mt-[3px] truncate font-mono text-[10.5px] text-[#656B7A]">
                  {cihazEtiketi(o)}
                  {o.ip && ` · ${o.ip}`}
                </div>
              </div>
              <div className="flex-none text-right">
                <div className="font-mono text-[11.5px] text-[#3A3F4F]">{anBicimi.format(new Date(o.tarih))}</div>
                {i === 0 && (
                  <div className="mt-[3px] font-mono text-[9.5px] tracking-[0.1em] text-brand uppercase">
                    en son
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    
      <HesapSilme talepTarihi={silmeSatiri?.silme_talebi_tarihi ?? null} />
    </main>
  );
}
